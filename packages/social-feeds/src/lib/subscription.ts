import { prisma } from "@/lib/prisma";
import {
  getTierConfig,
  normalizeTier,
  type RestrictedSocialProvider,
  type TierConfig,
  type TierId,
} from "@/lib/tiers";

export interface UserSubscription {
  id: string;
  userId: string;
  email: string;
  tier: TierId | null;
  status: string;
  isValid: boolean;
  config: TierConfig | null;
  allowedPlatforms: RestrictedSocialProvider[];
  postsPerWeekPerPlatform: number;
  maxPlatforms: number;
  canAccessCheckInCall: boolean;
  canAccessPrioritySupport: boolean;
  canAccessStrategyCall: boolean;
  supportLabel: string;
  subscription_tier: string;
  subscription_status: string;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

function isValidSubscriptionStatus(status: string, periodEnd: Date | null) {
  if (status === "trialing") {
    return !!periodEnd && periodEnd.getTime() > Date.now();
  }

  if (status === "active") {
    return !periodEnd || periodEnd.getTime() > Date.now();
  }

  if (status === "canceling") {
    return !!periodEnd && periodEnd.getTime() > Date.now();
  }

  return false;
}

export async function getUserSubscription(
  userId: string
): Promise<UserSubscription | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      subscription: true,
    },
  });

  if (!user?.subscription) {
    return null;
  }

  const subscription = user.subscription;
  const tier = normalizeTier(subscription.priceId);
  const config = tier ? getTierConfig(tier) : null;
  const periodEndIso = subscription.currentPeriodEnd?.toISOString() ?? null;
  const isValid = !!tier && isValidSubscriptionStatus(subscription.status, subscription.currentPeriodEnd);

  return {
    id: subscription.id,
    userId: user.id,
    email: user.email,
    tier,
    status: subscription.status,
    isValid,
    config,
    allowedPlatforms: config?.allowedPlatforms ?? [],
    postsPerWeekPerPlatform: config?.postsPerWeekPerPlatform ?? 0,
    maxPlatforms: config?.allowedPlatforms.length ?? 0,
    canAccessCheckInCall:
      !!config?.hasMonthlyCheckInCall || !!config?.hasWeeklyCheckInCall,
    canAccessPrioritySupport: !!config?.hasPrioritySupport,
    canAccessStrategyCall: !!config?.hasStrategyCall,
    supportLabel: config?.supportLabel ?? "No active support tier",
    subscription_tier: tier ?? "free",
    subscription_status: subscription.status,
    trial_ends_at: subscription.status === "trialing" ? periodEndIso : null,
    subscription_ends_at: periodEndIso,
    stripe_customer_id: subscription.stripeCustomerId,
    stripe_subscription_id: subscription.stripeSubscriptionId,
  };
}

export async function isSubscriptionActive(
  userId: string
): Promise<boolean> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return false;
  }

  return subscription.isValid;
}

export function getDaysUntilCharge(trialEndsAt: string | null): number {
  if (!trialEndsAt) {
    return 0;
  }

  const trialEnd = new Date(trialEndsAt);
  const now = new Date();
  const daysLeft = Math.ceil(
    (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return Math.max(0, daysLeft);
}

export async function getUserTierAccess(userId: string): Promise<string> {
  const subscription = await getUserSubscription(userId);

  return subscription?.isValid && subscription.tier ? subscription.tier : "free";
}

export function canAccessFeature(
  userTier: string,
  requiredTier: "starter" | "core" | "premium"
): boolean {
  const tierLevels: Record<string, number> = {
    free: 0,
    starter: 1,
    core: 2,
    premium: 3,
  };

  const userLevel = tierLevels[userTier] || 0;
  const requiredLevel = tierLevels[requiredTier] || 0;

  return userLevel >= requiredLevel;
}

export function getSubscriptionStatus(
  subscription: UserSubscription
): {
  status: "free" | "trialing" | "active" | "expired" | "inactive";
  message: string;
  daysLeft?: number;
} {
  const now = new Date();

  if (subscription.subscription_status === "trialing") {
    if (subscription.trial_ends_at) {
      const trialEnds = new Date(subscription.trial_ends_at);
      const daysLeft = Math.ceil(
        (trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysLeft > 0) {
        return {
          status: "trialing",
          message: `Free trial active (${daysLeft} days remaining)`,
          daysLeft,
        };
      } else {
        return {
          status: "expired",
          message: "Trial period expired",
        };
      }
    }
  }

  if (subscription.subscription_status === "active") {
    if (subscription.subscription_ends_at) {
      const subEnds = new Date(subscription.subscription_ends_at);
      const daysLeft = Math.ceil(
        (subEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        status: "active",
        message: `Active subscription (renews in ${daysLeft} days)`,
        daysLeft,
      };
    }

    return {
      status: "active",
      message: "Active subscription",
    };
  }

  if (subscription.subscription_status === "canceling") {
    if (subscription.subscription_ends_at) {
      const subEnds = new Date(subscription.subscription_ends_at);
      const daysLeft = Math.ceil(
        (subEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        status: "active",
        message: `Canceled, access ends in ${daysLeft} days`,
        daysLeft,
      };
    }

    return {
      status: "active",
      message: "Canceled, access remains until period end",
    };
  }

  if (
    subscription.subscription_status === "payment_failed" ||
    subscription.subscription_status === "past_due"
  ) {
    return {
      status: "inactive",
      message: "Subscription issue - payment failed",
    };
  }

  return {
    status: "free",
    message: "Free plan",
  };
}
