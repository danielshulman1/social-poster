import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getApiAuthContext } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { normalizeTier } from "@/lib/tiers";

const TIER_PRICES: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER || "",
  core: process.env.STRIPE_PRICE_CORE || "",
  premium: process.env.STRIPE_PRICE_PREMIUM || "",
};

function isPlaceholderSecret(value: string) {
  return value.includes("[") || value.includes("PASTE");
}

function getCheckoutConfigStatus() {
  const secretKey = process.env.STRIPE_SECRET_KEY || "";

  return {
    hasSecretKey: !!secretKey,
    secretKeyLooksPlaceholder: !!secretKey && isPlaceholderSecret(secretKey),
    hasStarterPrice: !!process.env.STRIPE_PRICE_STARTER,
    hasCorePrice: !!process.env.STRIPE_PRICE_CORE,
    hasPremiumPrice: !!process.env.STRIPE_PRICE_PREMIUM,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || null,
  };
}

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  if (isPlaceholderSecret(secretKey)) {
    throw new Error("STRIPE_SECRET_KEY is still set to a placeholder value");
  }

  return new Stripe(secretKey, {
    apiVersion: "2026-01-28.clover",
  });
}

function getStripeErrorMessage(error: unknown) {
  if (error instanceof Stripe.errors.StripeError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Checkout failed";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tier, email } = body;
    const requestedUserId = typeof body.userId === "string" ? body.userId : null;
    const normalizedTier = normalizeTier(tier);
    const auth = await getApiAuthContext(request);
    const userId = requestedUserId || auth?.userId;

    if (!normalizedTier) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Sign in required before checkout can start" },
        { status: 401 }
      );
    }

    if (auth?.userId && requestedUserId && requestedUserId !== auth.userId && auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized checkout user" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found for checkout" },
        { status: 404 }
      );
    }

    const priceId = TIER_PRICES[normalizedTier];
    if (!priceId) {
      return NextResponse.json(
        { error: `Price not configured for tier: ${normalizedTier}` },
        { status: 500 }
      );
    }

    const stripe = getStripeClient();

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email || email,
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
          tier: normalizedTier,
        },
      },
      payment_method_collection: "always",
      billing_address_collection: "required",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?payment=success&tier=${normalizedTier}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?payment=cancelled`,
      metadata: {
        user_id: userId,
        tier: normalizedTier,
      },
    });

    await prisma.subscription.upsert({
      where: { userId },
      update: {
        status: "incomplete",
        priceId: normalizedTier,
      },
      create: {
        userId,
        status: "incomplete",
        priceId: normalizedTier,
      },
    });

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    const message = getStripeErrorMessage(error);
    console.error("[stripe-checkout]", {
      message,
      config: getCheckoutConfigStatus(),
    });

    return NextResponse.json(
      {
        error: message,
        config: getCheckoutConfigStatus(),
      },
      { status: 500 }
    );
  }
}
