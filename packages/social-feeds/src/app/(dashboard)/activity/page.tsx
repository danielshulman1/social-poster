export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AlertCircle, CheckCircle2, ChevronRight, Clock3, Info } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseWorkflowExecutionLog } from "@/lib/workflowExecutionLog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClearActivityLogsButton } from "@/components/activity/clear-activity-logs-button";
import { ClearWorkflowLogsButton } from "@/components/activity/clear-workflow-logs-button";

const formatDateTime = (value?: Date | null) => {
    if (!value) return "In progress";

    return new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(value);
};

const formatEventTime = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;

    return new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).format(parsed);
};

const formatEventDateTime = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;

    return new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(parsed);
};

const formatDuration = (startedAt?: Date | null, completedAt?: Date | null) => {
    if (!startedAt) return "—";

    const end = completedAt ?? new Date();
    const deltaMs = end.getTime() - startedAt.getTime();
    if (!Number.isFinite(deltaMs) || deltaMs < 0) return "—";

    const totalSeconds = Math.floor(deltaMs / 1000);
    if (totalSeconds < 60) return `${totalSeconds}s`;

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes < 60) return `${minutes}m ${seconds}s`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
};

const truncateText = (value: string, maxLength = 140) =>
    value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;

const formatRunId = (value: string) => {
    if (!value) return "";
    if (value.length <= 10) return value;
    return `${value.slice(0, 8)}…${value.slice(-4)}`;
};

const getStatusBadgeClassName = (status: string) => {
    if (status === "completed") return "bg-emerald-600 text-white hover:bg-emerald-600";
    if (status === "failed") return "bg-red-600 text-white hover:bg-red-600";
    return "bg-amber-500 text-black hover:bg-amber-500";
};

type ApprovalPreviewItem = {
    nodeId: string;
    nodeLabel?: string;
    platform: string;
    platformLabel: string;
    previewTitle?: string;
    previewContent?: string;
    previewImageUrl?: string;
    destination?: string;
};

const getApprovalPreviewItems = (results: Record<string, {
    nodeId: string;
    nodeLabel?: string;
    details?: Record<string, unknown>;
}>) =>
    Object.values(results).flatMap((result) => {
        const details = result.details;
        if (!details || details.approvalRequired !== true) {
            return [];
        }

        return [{
            nodeId: result.nodeId,
            nodeLabel: result.nodeLabel,
            platform: typeof details.platform === "string" ? details.platform : "post",
            platformLabel: typeof details.platformLabel === "string" ? details.platformLabel : "Post",
            previewTitle: typeof details.previewTitle === "string" ? details.previewTitle : undefined,
            previewContent: typeof details.previewContent === "string" ? details.previewContent : undefined,
            previewImageUrl: typeof details.previewImageUrl === "string" ? details.previewImageUrl : undefined,
            destination: typeof details.destination === "string" ? details.destination : undefined,
        }] satisfies ApprovalPreviewItem[];
    });

const getEventIcon = (event: { level: "info" | "error"; type: string }) => {
    if (event.level === "error") return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (event.type === "run.started") return <Clock3 className="h-4 w-4 text-amber-500" />;
    return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
};

type HighlightEvent = {
    level: "info" | "error";
    type: string;
    at: string;
    message: string;
    nodeId?: string;
    nodeType?: string;
    nodeLabel?: string;
    details?: Record<string, unknown>;
};

const getHighlightEvents = (events: HighlightEvent[]) =>
    events.filter((event) => {
        if (event.level === "error") return true;
        if (event.type.startsWith("run.")) return true;
        if (event.type === "node.started" || event.type === "node.completed" || event.type === "node.failed") return true;
        if (event.type.includes("failed")) return true;
        return false;
    });

export default async function ActivityPage() {
    const session = await getServerSession(authOptions);
    const userId = typeof (session?.user as { id?: string } | undefined)?.id === "string"
        ? (session?.user as { id: string }).id
        : "";

    if (!userId) {
        redirect("/login");
    }

    const executions = await prisma.workflowExecution.findMany({
        where: {
            workflow: {
                userId,
            },
        },
        include: {
            workflow: {
                select: {
                    id: true,
                    name: true,
                },
            },
            steps: {
                orderBy: {
                    startedAt: "asc",
                },
                select: {
                    id: true,
                    nodeId: true,
                    nodeType: true,
                    status: true,
                    error: true,
                    startedAt: true,
                    completedAt: true,
                },
            },
        },
        orderBy: {
            startedAt: "desc",
        },
        take: 40,
    });

    const items = executions.map((execution) => {
        const log = parseWorkflowExecutionLog(execution.logs, {
            workflowId: execution.workflowId,
            workflowName: execution.workflow.name,
            triggerType: execution.triggerType as "manual" | "schedule",
            startedAt: execution.startedAt,
            completedAt: execution.completedAt,
            status: execution.status as "running" | "completed" | "failed",
        });

        const stepFailureReasons = execution.steps
            .filter((step) => step.status === "failed" && step.error)
            .map((step) => `${step.nodeType || step.nodeId}: ${step.error}`);

        const failureReasons = log.summary.failureReasons.length > 0
            ? log.summary.failureReasons
            : stepFailureReasons;

        return {
            execution,
            log,
            failureReasons,
            highlightEvents: getHighlightEvents(log.events).slice(-12).reverse(),
            approvalItems: getApprovalPreviewItems(log.results),
        };
    });

    return (
        <div className="page-shell space-y-6">
            <section className="page-hero">
                <div className="flex flex-col gap-3">
                    <span className="page-kicker">Execution History</span>
                    <div>
                        <h1 className="text-4xl font-semibold tracking-[-0.05em]">Track every workflow run with real failure detail.</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                            Runs, node events, and failure reasons are grouped into an audit trail that is easier to scan under pressure.
                        </p>
                    </div>
                </div>
            </section>

            {items.length === 0 ? (
                <Card className="h-[320px] flex flex-col">
                    <CardHeader>
                        <CardTitle>Workflow Runs</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex items-center justify-center">
                        <div className="text-center space-y-3">
                            <Info className="h-10 w-10 text-muted-foreground mx-auto" />
                            <p className="text-sm text-muted-foreground">
                                No workflow activity recorded yet. Run a workflow and its event trail will appear here.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="overflow-hidden">
                    <CardHeader className="space-y-2">
                        <div>
                            <CardTitle>Workflow Runs</CardTitle>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Expand a row to review failure reasons, node-level steps, and the most recent events for each run.
                            </p>
                        </div>
                        <CardAction>
                            <ClearActivityLogsButton />
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        <div className="relative w-full overflow-x-auto rounded-[1.5rem] border border-border/70 bg-background/55">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b [&_tr]:border-border/70">
                                    <tr>
                                        <th className="h-12 px-4 text-left align-middle text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground w-10" />
                                        <th className="h-12 px-4 text-left align-middle text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                            Workflow
                                        </th>
                                        <th className="h-12 px-4 text-left align-middle text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                            Trigger
                                        </th>
                                        <th className="h-12 px-4 text-left align-middle text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                            Started
                                        </th>
                                        <th className="h-12 px-4 text-left align-middle text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                            Duration
                                        </th>
                                        <th className="h-12 px-4 text-right align-middle text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {items.map(({ execution, log, failureReasons, highlightEvents, approvalItems }) => (
                                        <tr
                                            key={execution.id}
                                            className="border-b border-border/55 transition-colors"
                                        >
                                            <td colSpan={6} className="p-0 align-middle">
                                                <details className="group">
                                                    <summary className="list-none [&::-webkit-details-marker]:hidden">
                                                        <div className="grid grid-cols-[1.2rem_minmax(220px,1.35fr)_minmax(90px,0.55fr)_minmax(140px,0.75fr)_minmax(100px,0.5fr)_minmax(90px,0.4fr)] items-center gap-3 px-4 py-3 hover:bg-muted/35 transition-colors">
                                                            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                                                            <div className="min-w-0">
                                                                <div className="font-medium truncate">{execution.workflow.name}</div>
                                                                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                                    <span className="truncate">
                                                                        Run: <code className="rounded bg-muted/35 px-1 py-0.5">{formatRunId(execution.id)}</code>
                                                                    </span>
                                                                    <span>{log.summary.failedNodes} failed</span>
                                                                    <span>{log.summary.completedNodes}/{log.summary.totalNodes} nodes</span>
                                                                    <span>{log.events.length} events</span>
                                                                    {approvalItems.length > 0 && (
                                                                        <span className="text-amber-600">Approval required</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">{execution.triggerType}</div>
                                                            <div className="text-xs text-muted-foreground">{formatDateTime(execution.startedAt)}</div>
                                                            <div className="text-xs text-muted-foreground">{formatDuration(execution.startedAt, execution.completedAt)}</div>
                                                            <div className="flex justify-end">
                                                                <Badge className={getStatusBadgeClassName(execution.status)}>
                                                                    {execution.status}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </summary>

                                                    <div className="px-4 pb-4 pt-2">
                                                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/55 px-4 py-3">
                                                            <div className="space-y-1">
                                                                <div className="text-sm font-medium">Run details</div>
                                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                                    <span>
                                                                        Run: <code className="rounded bg-muted/35 px-1 py-0.5">{execution.id}</code>
                                                                    </span>
                                                                    <span>Trigger: {execution.triggerType}</span>
                                                                    <span>Started: {formatDateTime(execution.startedAt)}</span>
                                                                    <span>Finished: {formatDateTime(execution.completedAt)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-wrap items-center justify-end gap-2">
                                                                <Badge className={getStatusBadgeClassName(execution.status)}>
                                                                    {execution.status}
                                                                </Badge>
                                                                <ClearWorkflowLogsButton
                                                                    workflowId={execution.workflow.id}
                                                                    workflowName={execution.workflow.name}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                                            <div className="space-y-4">
                                                                {failureReasons.length > 0 && (
                                                                    <Alert variant="destructive">
                                                                        <AlertCircle className="h-4 w-4" />
                                                                        <AlertTitle>Failure reasons</AlertTitle>
                                                                        <AlertDescription>
                                                                            <div className="space-y-1">
                                                                                {failureReasons.map((reason) => (
                                                                                    <p key={reason}>{reason}</p>
                                                                                ))}
                                                                            </div>
                                                                        </AlertDescription>
                                                                    </Alert>
                                                                )}

                                                                <div className="space-y-2">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <h2 className="text-sm font-medium">Highlights</h2>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {highlightEvents.length} event(s)
                                                                        </span>
                                                                    </div>
                                                                    {highlightEvents.length === 0 ? (
                                                                        <p className="text-sm text-muted-foreground">
                                                                            No highlight events stored for this run.
                                                                        </p>
                                                                    ) : (
                                                                        <div className="rounded-2xl border border-border/70 bg-background/55 overflow-hidden">
                                                                            <div className="grid grid-cols-[minmax(110px,0.55fr)_minmax(240px,1.6fr)_minmax(120px,0.85fr)] gap-3 border-b border-border/55 bg-muted/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                                                <div>When</div>
                                                                                <div>Event</div>
                                                                                <div>Node</div>
                                                                            </div>
                                                                            <div className="divide-y divide-border/55">
                                                                                {highlightEvents.map((event) => (
                                                                                    <details
                                                                                        key={`${execution.id}-${event.at}-${event.type}-${event.nodeId || "run"}`}
                                                                                        className="group/event"
                                                                                    >
                                                                                        <summary className="list-none [&::-webkit-details-marker]:hidden">
                                                                                            <div className="grid grid-cols-[minmax(110px,0.55fr)_minmax(240px,1.6fr)_minmax(120px,0.85fr)] items-start gap-3 px-4 py-3 text-xs hover:bg-muted/35 transition-colors cursor-pointer">
                                                                                                <div className="text-muted-foreground">
                                                                                                    <div className="font-medium text-foreground/85">{formatEventTime(event.at)}</div>
                                                                                                    <div className="mt-1">{formatEventDateTime(event.at)}</div>
                                                                                                </div>
                                                                                                <div className="min-w-0 space-y-1">
                                                                                                    <div className="flex items-start gap-2">
                                                                                                        {getEventIcon(event)}
                                                                                                        <div className="min-w-0">
                                                                                                            <p className="font-medium leading-5">
                                                                                                                {truncateText(event.message)}
                                                                                                            </p>
                                                                                                            <p className="mt-1 text-[11px] text-muted-foreground">
                                                                                                                Type: <code className="rounded bg-muted/35 px-1 py-0.5">{event.type}</code>
                                                                                                            </p>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="min-w-0 text-muted-foreground">
                                                                                                    {event.nodeLabel ? (
                                                                                                        <p className="truncate">
                                                                                                            {event.nodeLabel}
                                                                                                        </p>
                                                                                                    ) : null}
                                                                                                    {event.nodeType || event.nodeId ? (
                                                                                                        <p className="mt-1 truncate text-[11px]">
                                                                                                            <code className="rounded bg-muted/35 px-1 py-0.5">
                                                                                                                {event.nodeType || "node"}{event.nodeId ? `:${event.nodeId}` : ""}
                                                                                                            </code>
                                                                                                        </p>
                                                                                                    ) : (
                                                                                                        <span className="text-[11px] text-muted-foreground">—</span>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        </summary>

                                                                                        {(event.details || event.message.length > 140) && (
                                                                                            <div className="px-4 pb-4">
                                                                                                {event.message.length > 140 && (
                                                                                                    <div className="rounded-xl bg-muted/25 px-3 py-3 text-sm whitespace-pre-wrap">
                                                                                                        {event.message}
                                                                                                    </div>
                                                                                                )}
                                                                                                {event.details && (
                                                                                                    <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-muted/25 px-3 py-3 text-xs leading-5">
                                                                                                        {JSON.stringify(event.details, null, 2)}
                                                                                                    </pre>
                                                                                                )}
                                                                                            </div>
                                                                                        )}
                                                                                    </details>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <h2 className="text-sm font-medium">Node steps</h2>
                                                                    {execution.steps.length === 0 ? (
                                                                        <p className="text-sm text-muted-foreground">
                                                                            No per-node step metadata stored for this run.
                                                                        </p>
                                                                    ) : (
                                                                        <div className="rounded-2xl border border-border/70 bg-background/55 overflow-hidden">
                                                                            <div className="grid grid-cols-[minmax(180px,1.2fr)_minmax(88px,0.4fr)_minmax(120px,0.6fr)_minmax(120px,0.6fr)] gap-3 border-b border-border/55 bg-muted/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                                                <div>Node</div>
                                                                                <div>Status</div>
                                                                                <div>Started</div>
                                                                                <div>Finished</div>
                                                                            </div>
                                                                            <div className="divide-y divide-border/55">
                                                                                {execution.steps.map((step) => (
                                                                                    <div
                                                                                        key={step.id}
                                                                                        className="grid grid-cols-[minmax(180px,1.2fr)_minmax(88px,0.4fr)_minmax(120px,0.6fr)_minmax(120px,0.6fr)] gap-3 px-4 py-3 text-xs"
                                                                                    >
                                                                                        <div className="min-w-0 space-y-0.5">
                                                                                            <p className="font-medium truncate">
                                                                                                {step.nodeType || "Node"} {step.nodeId ? `(${step.nodeId})` : ""}
                                                                                            </p>
                                                                                            {step.error && (
                                                                                                <p className="text-red-500 truncate">{step.error}</p>
                                                                                            )}
                                                                                        </div>
                                                                                        <div>
                                                                                            <Badge className={getStatusBadgeClassName(step.status)}>
                                                                                                {step.status}
                                                                                            </Badge>
                                                                                        </div>
                                                                                        <div className="text-muted-foreground">
                                                                                            {formatDateTime(step.startedAt)}
                                                                                        </div>
                                                                                        <div className="text-muted-foreground">
                                                                                            {formatDateTime(step.completedAt)}
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="space-y-4">
                                                                {approvalItems.length > 0 && (
                                                                    <Alert>
                                                                        <Info className="h-4 w-4" />
                                                                        <AlertTitle>Awaiting approval</AlertTitle>
                                                                        <AlertDescription>
                                                                            This run generated post output but did not publish because `Publish Without Approval` is off on one or more publisher nodes.
                                                                        </AlertDescription>
                                                                    </Alert>
                                                                )}

                                                                {approvalItems.length > 0 && (
                                                                    <div className="space-y-3">
                                                                        <h2 className="text-sm font-medium">Post previews</h2>
                                                                        {approvalItems.map((item) => (
                                                                            <div
                                                                                key={`${execution.id}-${item.nodeId}-${item.platform}`}
                                                                                className="rounded-2xl border border-border/70 bg-background/55 px-4 py-4"
                                                                            >
                                                                                <div className="flex flex-wrap items-center gap-2">
                                                                                    <Badge variant="outline">{item.platformLabel}</Badge>
                                                                                    {item.nodeLabel && (
                                                                                        <span className="text-xs text-muted-foreground">
                                                                                            Node: {item.nodeLabel}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                {item.destination && (
                                                                                    <p className="mt-2 text-xs text-muted-foreground">
                                                                                        Destination: {item.destination}
                                                                                    </p>
                                                                                )}
                                                                                {item.previewTitle && (
                                                                                    <p className="mt-3 text-sm font-medium">{item.previewTitle}</p>
                                                                                )}
                                                                                {item.previewContent && (
                                                                                    <div className="mt-3 rounded-xl bg-muted/35 px-3 py-3 text-sm whitespace-pre-wrap">
                                                                                        {item.previewContent}
                                                                                    </div>
                                                                                )}
                                                                                {item.previewImageUrl && (
                                                                                    <p className="mt-3 text-xs text-muted-foreground break-all">
                                                                                        Image: {item.previewImageUrl}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                <details className="rounded-2xl border border-border/70 bg-background/55 px-4 py-3">
                                                                    <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                                                                        <div className="flex items-center justify-between gap-2">
                                                                            <h2 className="text-sm font-medium">All events</h2>
                                                                            <span className="text-xs text-muted-foreground">
                                                                                {log.events.length} total
                                                                            </span>
                                                                        </div>
                                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                                            Expand to view the full event stream (use highlights above for the quick story).
                                                                        </p>
                                                                    </summary>
                                                                    <div className="mt-3 rounded-2xl border border-border/70 bg-background/55 overflow-hidden">
                                                                        <div className="grid grid-cols-[minmax(110px,0.55fr)_minmax(240px,1.6fr)_minmax(120px,0.85fr)] gap-3 border-b border-border/55 bg-muted/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                                            <div>When</div>
                                                                            <div>Event</div>
                                                                            <div>Node</div>
                                                                        </div>
                                                                        <div className="divide-y divide-border/55">
                                                                            {log.events.slice().reverse().map((event) => (
                                                                                <details
                                                                                    key={`${execution.id}-all-${event.at}-${event.type}-${event.nodeId || "run"}`}
                                                                                    className="group/event"
                                                                                >
                                                                                    <summary className="list-none [&::-webkit-details-marker]:hidden">
                                                                                        <div className="grid grid-cols-[minmax(110px,0.55fr)_minmax(240px,1.6fr)_minmax(120px,0.85fr)] items-start gap-3 px-4 py-3 text-xs hover:bg-muted/35 transition-colors cursor-pointer">
                                                                                            <div className="text-muted-foreground">
                                                                                                <div className="font-medium text-foreground/85">{formatEventTime(event.at)}</div>
                                                                                                <div className="mt-1">{formatEventDateTime(event.at)}</div>
                                                                                            </div>
                                                                                            <div className="min-w-0 space-y-1">
                                                                                                <div className="flex items-start gap-2">
                                                                                                    {getEventIcon(event)}
                                                                                                    <div className="min-w-0">
                                                                                                        <p className="font-medium leading-5">
                                                                                                            {truncateText(event.message, 160)}
                                                                                                        </p>
                                                                                                        <p className="mt-1 text-[11px] text-muted-foreground">
                                                                                                            Type: <code className="rounded bg-muted/35 px-1 py-0.5">{event.type}</code>
                                                                                                        </p>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="min-w-0 text-muted-foreground">
                                                                                                {event.nodeLabel ? (
                                                                                                    <p className="truncate">
                                                                                                        {event.nodeLabel}
                                                                                                    </p>
                                                                                                ) : null}
                                                                                                {event.nodeType || event.nodeId ? (
                                                                                                    <p className="mt-1 truncate text-[11px]">
                                                                                                        <code className="rounded bg-muted/35 px-1 py-0.5">
                                                                                                            {event.nodeType || "node"}{event.nodeId ? `:${event.nodeId}` : ""}
                                                                                                        </code>
                                                                                                    </p>
                                                                                                ) : (
                                                                                                    <span className="text-[11px] text-muted-foreground">—</span>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    </summary>
                                                                                    {(event.details || event.message.length > 160) && (
                                                                                        <div className="px-4 pb-4">
                                                                                            {event.message.length > 160 && (
                                                                                                <div className="rounded-xl bg-muted/25 px-3 py-3 text-sm whitespace-pre-wrap">
                                                                                                    {event.message}
                                                                                                </div>
                                                                                            )}
                                                                                            {event.details && (
                                                                                                <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-muted/25 px-3 py-3 text-xs leading-5">
                                                                                                    {JSON.stringify(event.details, null, 2)}
                                                                                                </pre>
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </details>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </details>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </details>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
