import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export interface UserSubscription {
  id: string;
  email: string;
  subscription_tier: string;
  subscription_status: string;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

export async function getUserSubscription(
  userId: string
): Promise<UserSubscription | null> {
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, email, subscription_tier, subscription_status, trial_ends_at, subscription_ends_at, stripe_customer_id, stripe_subscription_id"
    )
    .eq("id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function isSubscriptionActive(
  userId: string
): Promise<boolean> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return false;
  }

  // Check if in trial period
  if (
    subscription.subscription_status === "trialing" &&
    subscription.trial_ends_at
  ) {
    const trialEndsAt = new Date(subscription.trial_ends_at);
    if (new Date() < trialEndsAt) {
      return true;
    }
  }

  // Check if subscription is active
  if (subscription.subscription_status === "active") {
    return true;
  }

  return false;
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
