import { NextResponse } from "next/server";
import { getApiAuthContext, unauthorizedJson } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, props: { params: Promise<{ workflowId: string }> }) {
    const params = await props.params;
    const auth = await getApiAuthContext(req);
    if (!auth?.userId) return unauthorizedJson();

    const { searchParams } = new URL(req.url);
    const startedAfter = searchParams.get("startedAfter");

    const execution = await prisma.workflowExecution.findFirst({
        where: {
            workflowId: params.workflowId,
            workflow: {
                userId: auth.userId,
            },
            ...(startedAfter
                ? {
                    startedAt: {
                        gte: new Date(startedAfter),
                    },
                }
                : {}),
        },
        include: {
            steps: {
                orderBy: {
                    startedAt: "asc",
                },
            },
        },
        orderBy: {
            startedAt: "desc",
        },
    });

    if (!execution) {
        return NextResponse.json({ execution: null });
    }

    const runningStep = execution.steps.find((step) => step.status === "running") || null;
    const nodeStatuses = Object.fromEntries(
        execution.steps.map((step) => [step.nodeId, step.status]),
    );

    return NextResponse.json({
        execution: {
            id: execution.id,
            status: execution.status,
            triggerType: execution.triggerType,
            startedAt: execution.startedAt.toISOString(),
            completedAt: execution.completedAt?.toISOString() || null,
            activeNodeId: runningStep?.nodeId || null,
            nodeStatuses,
        },
    });
}
