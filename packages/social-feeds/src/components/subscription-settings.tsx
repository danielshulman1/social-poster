"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface SubscriptionSettingsProps {
  userId: string;
}

type SubscriptionView = {
  subscription_tier: string;
  subscription_status: string;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
};

function getSubscriptionStatus(subscription: {
  subscription_status: string;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
}) {
  const now = new Date();

  if (subscription.subscription_status === "trialing" && subscription.trial_ends_at) {
    const trialEnds = new Date(subscription.trial_ends_at);
    const daysLeft = Math.ceil((trialEnds.getTime() - now.getTime()) / 86400000);

    return daysLeft > 0
      ? { message: `Free trial active (${daysLeft} days remaining)` }
      : { message: "Trial period expired" };
  }

  if (subscription.subscription_status === "active") {
    if (subscription.subscription_ends_at) {
      const subEnds = new Date(subscription.subscription_ends_at);
      const daysLeft = Math.ceil((subEnds.getTime() - now.getTime()) / 86400000);
      return { message: `Active subscription (renews in ${daysLeft} days)` };
    }

    return { message: "Active subscription" };
  }

  if (subscription.subscription_status === "canceling") {
    return { message: "Canceled, access remains until period end" };
  }

  return { message: "Free plan" };
}

export function SubscriptionSettings({ userId }: SubscriptionSettingsProps) {
  const [subscription, setSubscription] = useState<SubscriptionView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);

  const loadSubscription = useCallback(async () => {
    try {
      const response = await fetch(`/api/stripe/get-subscription?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error("Failed to load subscription:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSubscription();
  }, [loadSubscription]);

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel? You'll lose access at the end of your billing period.")) {
      return;
    }

    setIsCanceling(true);
    try {
      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel");
      }

      toast.success("Subscription canceled. You'll have access until the end of your billing period.");
      loadSubscription();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cancellation failed");
    } finally {
      setIsCanceling(false);
    }
  }

  if (isLoading) {
    return <div className="text-center text-muted-foreground">Loading subscription info...</div>;
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>You&apos;re on the free plan</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const status = getSubscriptionStatus(subscription);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
        <CardDescription>Manage your subscription and billing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Current Tier</p>
            <p className="text-lg font-semibold capitalize">{subscription.subscription_tier}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Access Status</p>
            <p className="text-lg font-semibold">{status.message}</p>
          </div>
        </div>

        {subscription.subscription_status === "trialing" && subscription.trial_ends_at && (
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
            <p className="text-sm font-semibold text-blue-900 mb-1">
              Free {subscription.subscription_tier.charAt(0).toUpperCase() + subscription.subscription_tier.slice(1)} Trial
            </p>
            <p className="text-sm text-blue-700">
              Full {subscription.subscription_tier} access until {new Date(subscription.trial_ends_at).toLocaleDateString()}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Auto-charges {new Date(new Date(subscription.trial_ends_at).getTime() + 86400000).toLocaleDateString()} unless you cancel
            </p>
          </div>
        )}

        {subscription.subscription_status === "active" && subscription.trial_ends_at && (
          <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
            <p className="text-sm font-semibold text-green-900 mb-1">
              {subscription.subscription_tier.charAt(0).toUpperCase() + subscription.subscription_tier.slice(1)} Subscription Active
            </p>
            <p className="text-sm text-green-700">
              Payment made. Access confirmed.
            </p>
          </div>
        )}

        {subscription.subscription_ends_at && (
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
            <p className="text-sm text-blue-700">
              Renews on {new Date(subscription.subscription_ends_at).toLocaleDateString()}
            </p>
          </div>
        )}

        {subscription.subscription_status === "active" ||
        subscription.subscription_status === "trialing" ? (
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isCanceling}
            className="w-full"
          >
            {isCanceling ? "Canceling..." : "Cancel Subscription"}
          </Button>
        ) : subscription.subscription_status === "canceling" ? (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
            <p className="text-sm text-amber-700">
              Subscription is canceled. Access remains until the period ends.
            </p>
          </div>
        ) : (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
            <p className="text-sm text-red-700">Subscription is {subscription.subscription_status}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
