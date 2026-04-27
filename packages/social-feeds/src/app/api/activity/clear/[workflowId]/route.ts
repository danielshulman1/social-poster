import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ workflowId: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
    const session = await getServerSession(authOptions);
    const userId =
        typeof (session?.user as { id?: string } | undefined)?.id === "string"
            ? (session?.user as { id: string }).id
            : "";

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workflowId } = await params;
    if (!workflowId) {
        return NextResponse.json({ error: "Missing workflowId" }, { status: 400 });
    }

    const workflow = await prisma.workflow.findFirst({
        where: { id: workflowId, userId },
        select: { id: true },
    });

    if (!workflow) {
        return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const deleted = await prisma.workflowExecution.deleteMany({
        where: { workflowId },
    });

    return NextResponse.json({ cleared: deleted.count }, { status: 200 });
}

