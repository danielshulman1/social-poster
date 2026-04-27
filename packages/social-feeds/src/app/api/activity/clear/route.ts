import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
    const session = await getServerSession(authOptions);
    const userId =
        typeof (session?.user as { id?: string } | undefined)?.id === "string"
            ? (session?.user as { id: string }).id
            : "";

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workflows = await prisma.workflow.findMany({
        where: { userId },
        select: { id: true },
    });

    const workflowIds = workflows.map((workflow) => workflow.id);
    if (workflowIds.length === 0) {
        return NextResponse.json({ cleared: 0 }, { status: 200 });
    }

    const deleted = await prisma.workflowExecution.deleteMany({
        where: { workflowId: { in: workflowIds } },
    });

    return NextResponse.json({ cleared: deleted.count }, { status: 200 });
}

