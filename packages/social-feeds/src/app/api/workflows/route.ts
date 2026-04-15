import { NextResponse } from "next/server";
import { getApiAuthContext, unauthorizedText } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { assertWorkflowDefinitionAllowed, isTierAccessError } from "@/lib/tier-access";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const auth = await getApiAuthContext(req);
    if (!auth?.userId) return unauthorizedText();

    const workflows = await prisma.workflow.findMany({
        where: { userId: auth.userId },
        orderBy: { updatedAt: 'desc' }
    });

    // Parse JSON strings back to objects
    const parsedWorkflows = workflows.map(wf => ({
        ...wf,
        definition: wf.definition ? JSON.parse(wf.definition) : {}
    }));

    return NextResponse.json(parsedWorkflows);
}

export async function POST(req: Request) {
    try {
        const auth = await getApiAuthContext(req);
        if (!auth?.userId) return unauthorizedText();

        const body = await req.json();
        const { name, definition } = body;

        await assertWorkflowDefinitionAllowed(auth.userId, definition);

        const workflow = await prisma.workflow.create({
            data: {
                userId: auth.userId,
                name: name || "Untitled Workflow",
                definition: definition ? (typeof definition === 'string' ? definition : JSON.stringify(definition)) : "{}",
                isActive: false
            }
        });

        return NextResponse.json(workflow);
    } catch (error: unknown) {
        if (isTierAccessError(error)) {
            return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
        }

        throw error;
    }
}
