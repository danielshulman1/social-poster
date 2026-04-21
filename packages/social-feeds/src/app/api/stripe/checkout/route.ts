import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-04-10",
});

const TIER_PRICES: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER || "",
  core: process.env.STRIPE_PRICE_CORE || "",
  premium: process.env.STRIPE_PRICE_PREMIUM || "",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tier, email, userId } = body;

    if (!tier || !["starter", "core", "premium"].includes(tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    if (!email || !userId) {
      return NextResponse.json(
        { error: "Email and userId required" },
        { status: 400 }
      );
    }

    const priceId = TIER_PRICES[tier];
    if (!priceId) {
      return NextResponse.json(
        { error: `Price not configured for tier: ${tier}` },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          user_id: userId,
          tier: tier,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?payment=success&tier=${tier}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?payment=cancelled`,
      metadata: {
        user_id: userId,
        tier: tier,
      },
    });

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("[stripe-checkout]", error);
    return NextResponse.json(
      { error: "Checkout failed" },
      { status: 500 }
    );
  }
}
