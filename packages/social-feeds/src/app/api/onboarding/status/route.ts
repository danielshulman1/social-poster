import { NextResponse } from "next/server";
import { getApiAuthContext, unauthorizedText } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const getCurrentStep = (steps: {
    socialConnected: boolean;
    aiConfigured: boolean;
    personaCreated: boolean;
    firstWorkflowCreated: boolean;
}) => {
    if (!steps.socialConnected) return 1;
    if (!steps.aiConfigured) return 2;
    if (!steps.personaCreated) return 3;
    if (!steps.firstWorkflowCreated) return 4;
    return 4;
};

export async function GET(req: Request) {
    const auth = await getApiAuthContext(req);
    if (!auth?.userId) return unauthorizedText();

    try {
        const user = await prisma.user.findUnique({
            where: { id: auth.userId },
            select: {
                openaiApiKey: true,
                googleApiKey: true,
                openrouterApiKey: true,
                persona: {
                    select: {
                        id: true,
                        updatedAt: true,
                    },
                },
                onboardingProgress: {
                    select: {
                        completedAt: true,
                    },
                },
                externalConnections: {
                    select: {
                        id: true,
                        provider: true,
                        name: true,
                    },
                    orderBy: { createdAt: "asc" },
                    take: 3,
                },
                _count: {
                    select: {
                        externalConnections: true,
                        workflows: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const stepState = {
            socialConnected: user._count.externalConnections > 0,
            aiConfigured: Boolean(user.openaiApiKey || user.googleApiKey || user.openrouterApiKey),
            personaCreated: Boolean(user.persona),
            firstWorkflowCreated: user._count.workflows > 0,
        };

        const allComplete = Object.values(stepState).every(Boolean);
        let completedAt = user.onboardingProgress?.completedAt ?? null;

        if (!completedAt && allComplete) {
            const progress = await prisma.userOnboardingProgress.upsert({
                where: { userId: auth.userId },
                update: { completedAt: new Date() },
                create: {
                    userId: auth.userId,
                    completedAt: new Date(),
                },
                select: { completedAt: true },
            });
            completedAt = progress.completedAt;
        }

        return NextResponse.json({
            completed: Boolean(completedAt),
            completedAt,
            needsOnboarding: !completedAt,
            currentStep: getCurrentStep(stepState),
            steps: {
                social: {
                    complete: stepState.socialConnected,
                    count: user._count.externalConnections,
                    connections: user.externalConnections,
                },
                ai: {
                    complete: stepState.aiConfigured,
                    provider:
                        user.openaiApiKey ? "openai" :
                            user.googleApiKey ? "google" :
                                user.openrouterApiKey ? "openrouter" :
                                    null,
                },
                persona: {
                    complete: stepState.personaCreated,
                    updatedAt: user.persona?.updatedAt ?? null,
                },
                workflow: {
                    complete: stepState.firstWorkflowCreated,
                    count: user._count.workflows,
                },
            },
        });
    } catch (error) {
        console.error("Failed to load onboarding status:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
