import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-04-10",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId required" },
        { status: 400 }
      );
    }

    // Get user's subscription
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("stripe_subscription_id, subscription_tier, subscription_status")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (!user.stripe_subscription_id) {
      return NextResponse.json(
        { error: "No active subscription" },
        { status: 400 }
      );
    }

    // Cancel subscription in Stripe
    const canceledSubscription = await stripe.subscriptions.update(
      user.stripe_subscription_id,
      {
        cancel_at_period_end: true,
        metadata: {
          canceled_at: new Date().toISOString(),
          canceled_by: "user",
        },
      }
    );

    // Update user status in database
    await supabase
      .from("users")
      .update({
        subscription_status: "canceled",
        subscription_tier: "free",
      })
      .eq("id", userId);

    // Log cancellation
    await supabase
      .from("subscription_logs")
      .insert({
        user_id: userId,
        event_type: "subscription_canceled_by_user",
        stripe_subscription_id: user.stripe_subscription_id,
        status: "canceled",
        metadata: {
          canceled_at: new Date().toISOString(),
        },
      });

    return NextResponse.json({
      success: true,
      message: "Subscription canceled",
      canceledAt: canceledSubscription.canceled_at,
      currentPeriodEnd: canceledSubscription.current_period_end,
    });
  } catch (error) {
    console.error("[cancel-subscription]", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
