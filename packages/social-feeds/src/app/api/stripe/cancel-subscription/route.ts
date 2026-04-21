import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getApiAuthContext, unauthorizedText } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  return new Stripe(secretKey, {
    apiVersion: "2026-01-28.clover",
  });
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getApiAuthContext(request);
    if (!auth?.userId) return unauthorizedText();

    const body = await request.json();
    const requestedUserId = body.userId;
    const userId =
      auth.role === "admin" && requestedUserId ? requestedUserId : auth.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "userId required" },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: {
        id: true,
        stripeSubscriptionId: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    if (!subscription.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "No active subscription" },
        { status: 400 }
      );
    }

    const stripe = getStripeClient();

    // Cancel subscription in Stripe
    const canceledSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
        metadata: {
          canceled_at: new Date().toISOString(),
          canceled_by: "user",
        },
      }
    );

    // Update user status in database
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "canceling",
        currentPeriodEnd:
          getCurrentPeriodEnd(canceledSubscription) ??
          undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription canceled",
      canceledAt: canceledSubscription.canceled_at,
      currentPeriodEnd: getCurrentPeriodEnd(canceledSubscription)?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("[cancel-subscription]", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}

function getCurrentPeriodEnd(subscription: Stripe.Subscription) {
  const timestamp = (
    subscription as Stripe.Subscription & { current_period_end?: number }
  ).current_period_end;

  return typeof timestamp === "number" ? new Date(timestamp * 1000) : null;
}
