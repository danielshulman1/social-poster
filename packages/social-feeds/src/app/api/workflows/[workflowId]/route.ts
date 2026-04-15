import { NextResponse } from "next/server";
import { getApiAuthContext, unauthorizedText } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { assertWorkflowDefinitionAllowed, isTierAccessError } from "@/lib/tier-access";

export async function GET(req: Request, props: { params: Promise<{ workflowId: string }> }) {
    const params = await props.params;
    const auth = await getApiAuthContext(req);
    if (!auth?.userId) return unauthorizedText();

    const workflow = await prisma.workflow.findUnique({
        where: { id: params.workflowId, userId: auth.userId }
    });

    if (!workflow) return new NextResponse("Not Found", { status: 404 });

    // Parse JSON string back to object
    const parsedWorkflow = {
        ...workflow,
        definition: workflow.definition ? JSON.parse(workflow.definition) : {}
    };

    return NextResponse.json(parsedWorkflow);
}

export async function PUT(req: Request, props: { params: Promise<{ workflowId: string }> }) {
    try {
        const params = await props.params;
        const auth = await getApiAuthContext(req);
        if (!auth?.userId) return unauthorizedText();

        const body = await req.json();
        // Ensure we don't accidentally transfer ownership or change ID
        const { id, userId, ...data } = body;

        await assertWorkflowDefinitionAllowed(auth.userId, data.definition);

        // Handle SQLite limitation: definition must be a string
        let updateData: any = { ...data };
        if (updateData.definition && typeof updateData.definition !== 'string') {
            updateData.definition = JSON.stringify(updateData.definition);
        }

        const workflow = await prisma.workflow.update({
            where: { id: params.workflowId, userId: auth.userId },
            data: {
                ...updateData,
                updatedAt: new Date()
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

export async function DELETE(req: Request, props: { params: Promise<{ workflowId: string }> }) {
    const params = await props.params;
    const auth = await getApiAuthContext(req);
    if (!auth?.userId) return unauthorizedText();

    await prisma.workflow.delete({
        where: { id: params.workflowId, userId: auth.userId }
    });

    return NextResponse.json({ success: true });
}
