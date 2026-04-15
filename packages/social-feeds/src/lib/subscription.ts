import { prisma } from "./prisma";
import { getTierConfig, getTierOrNull } from "./tiers";

export const getUserSubscription = async (userId: string) => {
    const subscription = await prisma.subscription.findUnique({
        where: { userId },
    });

    if (!subscription) return null;

    const tier = getTierOrNull(subscription.priceId);
    const config = tier ? getTierConfig(tier) : null;

    const isValid =
        subscription.status === "active" ||
        subscription.status === "trialing" ||
        (subscription.status === "canceled" &&
            subscription.currentPeriodEnd &&
            subscription.currentPeriodEnd.getTime() > Date.now());

    return {
        ...subscription,
        tier,
        config,
        isValid,
        maxPlatforms: config?.allowedPlatforms.length ?? 0,
        postsPerWeekPerPlatform: config?.postsPerWeekPerPlatform ?? 0,
        allowedPlatforms: config?.allowedPlatforms ?? [],
        canAccessCheckInCall:
            !!config?.hasMonthlyCheckInCall || !!config?.hasWeeklyCheckInCall,
        canAccessPrioritySupport: !!config?.hasPrioritySupport,
        canAccessStrategyCall: !!config?.hasStrategyCall,
        supportLabel: config?.supportLabel ?? "No active support tier",
    };
};
