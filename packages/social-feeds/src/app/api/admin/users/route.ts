import { NextResponse } from "next/server";
import { forbiddenText, getApiAuthContext, unauthorizedText } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const auth = await getApiAuthContext(req);
    if (!auth?.userId) return unauthorizedText();
    if (auth.role !== "admin") return forbiddenText();

    try {
        const users = await prisma.user.findMany({
            include: {
                subscription: true,
                persona: true,
                _count: {
                    select: { workflows: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Mask passwords and sensitive data
        const safeUsers = users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            image: u.image,
            createdAt: u.createdAt,
            workflowCount: u._count.workflows,
            subscription: u.subscription
                ? {
                    status: u.subscription.status,
                    plan: u.subscription.priceId,
                }
                : null,
            persona: u.persona ? {
                hasPersona: true,
                auditUsed: u.persona.auditUsed,
                authorizedAt: u.persona.auditAuthorizedAt,
                locked: u.persona.auditUsed && !u.persona.auditAuthorizedAt,
                canAuthorize: u.persona.auditUsed,
            } : null,
        }));

        return NextResponse.json(safeUsers);
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const auth = await getApiAuthContext(req);
    if (!auth?.userId) return unauthorizedText();
    if (auth.role !== "admin") return forbiddenText();

    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        // Prevent admins from deleting themselves
        if (userId === auth.userId) {
            return NextResponse.json(
                { error: "Cannot delete your own account" },
                { status: 400 }
            );
        }

        // Prevent deleting other admins
        const userToDelete = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!userToDelete) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        if (userToDelete.role === "admin") {
            return NextResponse.json(
                { error: "Cannot delete admin accounts" },
                { status: 400 }
            );
        }

        // Delete all related data in correct order (respecting foreign keys)
        // Delete workflows and their related data first
        await prisma.workflow.deleteMany({
            where: { userId },
        });

        // Delete subscription
        await prisma.subscription.deleteMany({
            where: { userId },
        });

        // Delete persona
        await prisma.persona.deleteMany({
            where: { userId },
        });

        // Delete the user
        await prisma.user.delete({
            where: { id: userId },
        });

        return NextResponse.json({
            success: true,
            message: `User ${userToDelete.email} has been deleted`,
        });
    } catch (error) {
        console.error("Failed to delete user:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
