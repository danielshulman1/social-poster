import { NextResponse } from "next/server";
import { forbiddenText, getApiAuthContext, unauthorizedText } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { normalizeTier } from "@/lib/tiers";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const auth = await getApiAuthContext(req);
    if (!auth?.userId) return unauthorizedText();
    if (auth.role !== "admin") return forbiddenText();

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                image: true,
                createdAt: true,
                subscription: {
                    select: {
                        status: true,
                        priceId: true,
                    },
                },
                persona: {
                    select: {
                        auditUsed: true,
                        auditAuthorizedAt: true,
                    },
                },
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

export async function POST(req: Request) {
    const auth = await getApiAuthContext(req);
    if (!auth?.userId) return unauthorizedText();
    if (auth.role !== "admin") return forbiddenText();

    try {
        const { name, email, password, role, tier } = await req.json();
        const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
        const normalizedName = typeof name === "string" ? name.trim() : "";
        const normalizedRole = role === "admin" ? "admin" : "user";
        const normalizedTier = normalizeTier(tier);

        if (!normalizedEmail || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        if (!normalizedTier) {
            return NextResponse.json(
                { error: "A valid package is required" },
                { status: 400 }
            );
        }

        if (typeof password !== "string" || password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters" },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                email: {
                    equals: normalizedEmail,
                    mode: "insensitive",
                },
            },
            select: { id: true },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "A user with that email already exists" },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const nextBillingDate = new Date();
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

        const user = await prisma.user.create({
            data: {
                name: normalizedName || null,
                email: normalizedEmail,
                password: hashedPassword,
                role: normalizedRole,
                subscription: {
                    create: {
                        status: "active",
                        priceId: normalizedTier,
                        currentPeriodEnd: nextBillingDate,
                    },
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                subscription: {
                    select: {
                        status: true,
                        priceId: true,
                    },
                },
                _count: {
                    select: { workflows: true },
                },
            },
        });

        return NextResponse.json(
            {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                workflowCount: user._count.workflows,
                subscription: user.subscription
                    ? {
                        status: user.subscription.status,
                        plan: user.subscription.priceId,
                    }
                    : null,
                persona: null,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Failed to create user:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
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
            select: {
                id: true,
                email: true,
                role: true,
            },
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
        // Get all workflows for this user
        const workflows = await prisma.workflow.findMany({
            where: { userId },
            select: { id: true },
        });

        const workflowIds = workflows.map((w) => w.id);

        // Delete execution steps (depends on executions)
        if (workflowIds.length > 0) {
            await prisma.executionStep.deleteMany({
                where: {
                    execution: {
                        workflowId: { in: workflowIds },
                    },
                },
            });

            // Delete workflow executions
            await prisma.workflowExecution.deleteMany({
                where: { workflowId: { in: workflowIds } },
            });

            // Delete schedule rules
            await prisma.scheduleRule.deleteMany({
                where: { workflowId: { in: workflowIds } },
            });

            // Delete source items
            await prisma.sourceItem.deleteMany({
                where: { workflowId: { in: workflowIds } },
            });

            // Delete publish results
            await prisma.publishResult.deleteMany({
                where: { workflowId: { in: workflowIds } },
            });

            // Delete workflows
            await prisma.workflow.deleteMany({
                where: { userId },
            });
        }

        // Delete external connections
        await prisma.externalConnection.deleteMany({
            where: { userId },
        });

        // Delete subscription
        await prisma.subscription.deleteMany({
            where: { userId },
        });

        // Delete persona
        await prisma.userPersona.deleteMany({
            where: { userId },
        });

        // Delete the user (Sessions and Accounts are already deleted via cascade)
        await prisma.user.deleteMany({
            where: { id: userId },
        });

        return NextResponse.json({
            success: true,
            message: `User ${userToDelete.email} has been deleted`,
        });
    } catch (error) {
        console.error("Failed to delete user:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
