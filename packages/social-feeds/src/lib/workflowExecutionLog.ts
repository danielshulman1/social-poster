export type WorkflowExecutionStatus = "running" | "completed" | "failed";

export type WorkflowExecutionEvent = {
    at: string;
    level: "info" | "error";
    type: string;
    message: string;
    nodeId?: string;
    nodeType?: string;
    nodeLabel?: string;
    details?: Record<string, unknown>;
};

export type WorkflowExecutionResult = {
    status: "completed" | "failed";
    nodeId: string;
    nodeType: string;
    nodeLabel?: string;
    output?: string;
    error?: string;
    details?: Record<string, unknown>;
    startedAt?: string;
    completedAt?: string;
};

export type WorkflowExecutionSummary = {
    status: WorkflowExecutionStatus;
    totalNodes: number;
    completedNodes: number;
    failedNodes: number;
    failureReasons: string[];
};

export type WorkflowExecutionLogDocument = {
    version: 1;
    workflowId: string;
    workflowName?: string;
    triggerType: "manual" | "schedule";
    requestUrl?: string;
    startedAt?: string;
    completedAt?: string;
    status: WorkflowExecutionStatus;
    events: WorkflowExecutionEvent[];
    results: Record<string, WorkflowExecutionResult>;
    summary: WorkflowExecutionSummary;
};

type CreateWorkflowExecutionLogInput = {
    workflowId: string;
    workflowName?: string;
    triggerType: "manual" | "schedule";
    requestUrl?: string;
    startedAt?: Date;
};

type ParseWorkflowExecutionLogFallback = {
    workflowId?: string;
    workflowName?: string;
    triggerType?: "manual" | "schedule";
    requestUrl?: string;
    startedAt?: Date | string | null;
    completedAt?: Date | string | null;
    status?: WorkflowExecutionStatus;
};

const asIsoString = (value?: Date | string | null) => {
    if (!value) return undefined;
    if (typeof value === "string") return value;
    return value.toISOString();
};

const normalizeFailureReasons = (results: Record<string, WorkflowExecutionResult>) =>
    Object.values(results)
        .filter((result) => result.status === "failed" && result.error)
        .map((result) => {
            const prefix = result.nodeLabel || result.nodeType || result.nodeId;
            return `${prefix}: ${result.error}`;
        });

const summarizeResults = (
    status: WorkflowExecutionStatus,
    results: Record<string, WorkflowExecutionResult>,
) => {
    const allResults = Object.values(results);
    const completedNodes = allResults.filter((result) => result.status === "completed").length;
    const failedNodes = allResults.filter((result) => result.status === "failed").length;

    return {
        status,
        totalNodes: allResults.length,
        completedNodes,
        failedNodes,
        failureReasons: normalizeFailureReasons(results),
    } satisfies WorkflowExecutionSummary;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
    Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const truncateForLog = (value: string, maxLength = 240) =>
    value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;

export function createWorkflowExecutionLog(
    input: CreateWorkflowExecutionLogInput,
): WorkflowExecutionLogDocument {
    return {
        version: 1,
        workflowId: input.workflowId,
        workflowName: input.workflowName,
        triggerType: input.triggerType,
        requestUrl: input.requestUrl,
        startedAt: asIsoString(input.startedAt || new Date()),
        status: "running",
        events: [],
        results: {},
        summary: summarizeResults("running", {}),
    };
}

export function appendWorkflowExecutionEvent(
    log: WorkflowExecutionLogDocument,
    event: Omit<WorkflowExecutionEvent, "at"> & { at?: string },
) {
    log.events.push({
        ...event,
        at: event.at || new Date().toISOString(),
    });
    log.summary = summarizeResults(log.status, log.results);
    return log;
}

export function recordWorkflowExecutionResult(
    log: WorkflowExecutionLogDocument,
    nodeId: string,
    result: WorkflowExecutionResult,
) {
    log.results[nodeId] = result;
    log.summary = summarizeResults(log.status, log.results);
    return log;
}

export function finalizeWorkflowExecutionLog(
    log: WorkflowExecutionLogDocument,
    status: WorkflowExecutionStatus,
    completedAt = new Date(),
) {
    log.status = status;
    log.completedAt = completedAt.toISOString();
    log.summary = summarizeResults(status, log.results);
    return log;
}

export function serializeWorkflowExecutionLog(log: WorkflowExecutionLogDocument) {
    return JSON.stringify(log);
}

export function parseWorkflowExecutionLog(
    raw: string | null | undefined,
    fallback: ParseWorkflowExecutionLogFallback = {},
): WorkflowExecutionLogDocument {
    const baseLog = createWorkflowExecutionLog({
        workflowId: fallback.workflowId || "unknown-workflow",
        workflowName: fallback.workflowName,
        triggerType: fallback.triggerType || "manual",
        requestUrl: fallback.requestUrl,
        startedAt:
            fallback.startedAt instanceof Date
                ? fallback.startedAt
                : fallback.startedAt
                    ? new Date(fallback.startedAt)
                    : new Date(),
    });

    if (!raw) {
        const status = fallback.status || "running";
        baseLog.status = status;
        baseLog.completedAt = asIsoString(fallback.completedAt);
        baseLog.summary = summarizeResults(status, baseLog.results);
        return baseLog;
    }

    try {
        const parsed = JSON.parse(raw) as unknown;

        if (
            isObject(parsed) &&
            parsed.version === 1 &&
            Array.isArray(parsed.events) &&
            isObject(parsed.results) &&
            isObject(parsed.summary)
        ) {
            const normalized = parsed as WorkflowExecutionLogDocument;
            normalized.status = (normalized.status || fallback.status || "running") as WorkflowExecutionStatus;
            normalized.startedAt = normalized.startedAt || asIsoString(fallback.startedAt);
            normalized.completedAt = normalized.completedAt || asIsoString(fallback.completedAt);
            normalized.workflowId = normalized.workflowId || baseLog.workflowId;
            normalized.workflowName = normalized.workflowName || fallback.workflowName;
            normalized.triggerType = normalized.triggerType || baseLog.triggerType;
            normalized.summary = summarizeResults(normalized.status, normalized.results || {});
            return normalized;
        }

        if (isObject(parsed)) {
            const legacyResults: Record<string, WorkflowExecutionResult> = {};

            for (const [nodeId, value] of Object.entries(parsed)) {
                if (!isObject(value)) continue;
                const status = value.status === "failed" ? "failed" : "completed";
                legacyResults[nodeId] = {
                    nodeId,
                    nodeType: typeof value.nodeType === "string" ? value.nodeType : "unknown",
                    nodeLabel: typeof value.nodeLabel === "string" ? value.nodeLabel : undefined,
                    status,
                    output: typeof value.output === "string" ? value.output : undefined,
                    error: typeof value.error === "string" ? value.error : undefined,
                };
            }

            baseLog.results = legacyResults;
            baseLog.status = (fallback.status || "running") as WorkflowExecutionStatus;
            baseLog.startedAt = asIsoString(fallback.startedAt) || baseLog.startedAt;
            baseLog.completedAt = asIsoString(fallback.completedAt);
            baseLog.summary = summarizeResults(baseLog.status, legacyResults);
            return baseLog;
        }
    } catch {
        // Keep the fallback log below if parsing fails.
    }

    const status = fallback.status || "failed";
    appendWorkflowExecutionEvent(baseLog, {
        level: "error",
        type: "log.parse_failed",
        message: "Stored execution log could not be parsed.",
    });
    return finalizeWorkflowExecutionLog(
        baseLog,
        status,
        fallback.completedAt ? new Date(fallback.completedAt) : new Date(),
    );
}
