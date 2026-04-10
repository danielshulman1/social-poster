export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock3, Info } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseWorkflowExecutionLog } from "@/lib/workflowExecutionLog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

const getStatusBadgeClassName = (status: string) => {
    if (status === "completed") return "bg-emerald-600 text-white hover:bg-emerald-600";
    if (status === "failed") return "bg-red-600 text-white hover:bg-red-600";
    return "bg-amber-500 text-black hover:bg-amber-500";
};

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
            recentEvents: log.events.slice(-5).reverse(),
        };
    });

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
                    <p className="text-muted-foreground mt-1">Audit trail of workflow runs, node execution, and failure reasons.</p>
                </div>
            </div>

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
                <div className="space-y-4">
                    {items.map(({ execution, log, failureReasons, recentEvents }) => (
                        <Card key={execution.id}>
                            <CardHeader className="space-y-3">
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                    <div className="space-y-2">
                                        <CardTitle className="text-xl">{execution.workflow.name}</CardTitle>
                                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                            <span>Run ID: {execution.id}</span>
                                            <span>Trigger: {execution.triggerType}</span>
                                            <span>Started: {formatDateTime(execution.startedAt)}</span>
                                            <span>Finished: {formatDateTime(execution.completedAt)}</span>
                                        </div>
                                    </div>
                                    <Badge className={getStatusBadgeClassName(execution.status)}>
                                        {execution.status}
                                    </Badge>
                                </div>

                                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                    <span>{log.summary.totalNodes} node(s)</span>
                                    <span>{log.summary.completedNodes} completed</span>
                                    <span>{log.summary.failedNodes} failed</span>
                                    <span>{log.events.length} event(s)</span>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
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
                                    <h2 className="text-sm font-medium">Recent events</h2>
                                    {recentEvents.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No event details stored for this run.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {recentEvents.map((event) => (
                                                <div
                                                    key={`${execution.id}-${event.at}-${event.type}-${event.nodeId || "run"}`}
                                                    className="rounded-lg border px-3 py-2"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                                {event.level === "error" ? (
                                                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                                                ) : event.type === "run.started" ? (
                                                                    <Clock3 className="h-4 w-4 text-amber-500" />
                                                                ) : (
                                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                                )}
                                                                <span>{event.message}</span>
                                                            </div>
                                                            {event.nodeLabel && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    Node: {event.nodeLabel} ({event.nodeType || event.nodeId})
                                                                </p>
                                                            )}
                                                        </div>
                                                        <span className="shrink-0 text-xs text-muted-foreground">
                                                            {formatEventTime(event.at)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
