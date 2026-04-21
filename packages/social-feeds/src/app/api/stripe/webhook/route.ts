import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { normalizeTier, type TierId } from "@/lib/tiers";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  return new Stripe(secretKey, {
    apiVersion: "2026-01-28.clover",
  });
}

function getCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
) {
  return typeof customer === "string" ? customer : customer?.id ?? null;
}

function getTimestampDate(value: unknown) {
  return typeof value === "number" ? new Date(value * 1000) : null;
}

function getCurrentPeriodEnd(subscription: Stripe.Subscription) {
  return getTimestampDate(
    (subscription as Stripe.Subscription & { current_period_end?: number })
      .current_period_end
  );
}

function getTrialEnd(subscription: Stripe.Subscription) {
  return getTimestampDate(subscription.trial_end);
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice) {
  const rawInvoice = invoice as Stripe.Invoice & {
    subscription?: string | { id?: string };
    parent?: {
      subscription_details?: {
        subscription?: string | { id?: string };
      };
    };
  };

  const subscription =
    rawInvoice.subscription ?? rawInvoice.parent?.subscription_details?.subscription;

  return typeof subscription === "string" ? subscription : subscription?.id ?? null;
}

async function findStoredSubscription(stripeSubscriptionId?: string | null, customerId?: string | null) {
  if (stripeSubscriptionId) {
    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId },
    });
    if (subscription) return subscription;
  }

  if (customerId) {
    return prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
    });
  }

  return null;
}

async function logSubscriptionEvent(
  userId: string,
  eventType: string,
  metadata: Record<string, unknown>
) {
  try {
    await prisma.$executeRaw`
      INSERT INTO subscription_logs (user_id, event_type, tier, stripe_subscription_id, status, trial_ends_at, subscription_ends_at, metadata)
      VALUES (
        ${userId},
        ${eventType},
        ${metadata.tier ?? null},
        ${metadata.stripe_subscription_id ?? null},
        ${metadata.status ?? null},
        ${metadata.trial_ends_at ? new Date(String(metadata.trial_ends_at)) : null},
        ${metadata.subscription_ends_at ? new Date(String(metadata.subscription_ends_at)) : null},
        ${JSON.stringify(metadata)}
      )
    `;
  } catch (error) {
    console.warn("[webhook] Subscription log skipped:", error);
  }
}

async function upsertStripeSubscription(subscription: Stripe.Subscription) {
  const customerId = getCustomerId(subscription.customer);
  const stored = await findStoredSubscription(subscription.id, customerId);
  const userId = subscription.metadata?.user_id || stored?.userId;

  if (!userId) {
    console.error("[webhook] No user_id for subscription", subscription.id);
    return null;
  }

  const metadataTier = normalizeTier(subscription.metadata?.tier);
  const storedTier = normalizeTier(stored?.priceId);
  const tier: TierId | null = metadataTier ?? storedTier;
  const trialEnd = getTrialEnd(subscription);
  const periodEnd = getCurrentPeriodEnd(subscription);

  const updated = await prisma.subscription.upsert({
    where: { userId },
    update: {
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      status: subscription.status,
      priceId: tier,
      currentPeriodEnd: trialEnd ?? periodEnd,
    },
    create: {
      userId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      status: subscription.status,
      priceId: tier,
      currentPeriodEnd: trialEnd ?? periodEnd,
    },
  });

  await logSubscriptionEvent(userId, `subscription_${subscription.status}`, {
    tier,
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    trial_ends_at: trialEnd?.toISOString() ?? null,
    subscription_ends_at: periodEnd?.toISOString() ?? null,
  });

  return updated;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    if (!webhookSecret) {
      return NextResponse.json(
        { error: "STRIPE_WEBHOOK_SECRET is not configured" },
        { status: 500 }
      );
    }

    let event: Stripe.Event;

    try {
      event = getStripeClient().webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error("[webhook] Invalid signature:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await upsertStripeSubscription(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubscriptionId = getInvoiceSubscriptionId(invoice);
        const customerId = getCustomerId(invoice.customer);
        const stored = await findStoredSubscription(stripeSubscriptionId, customerId);

        if (!stored) {
          console.error("[webhook] Subscription not found for paid invoice", {
            stripeSubscriptionId,
            customerId,
          });
          return NextResponse.json({ received: true });
        }

        await prisma.subscription.update({
          where: { id: stored.id },
          data: { status: "active" },
        });

        await logSubscriptionEvent(stored.userId, "invoice_paid", {
          tier: stored.priceId,
          stripe_subscription_id: stripeSubscriptionId,
          status: "active",
          invoice_id: invoice.id,
          amount_paid: invoice.amount_paid,
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubscriptionId = getInvoiceSubscriptionId(invoice);
        const customerId = getCustomerId(invoice.customer);
        const stored = await findStoredSubscription(stripeSubscriptionId, customerId);

        if (stored) {
          await prisma.subscription.update({
            where: { id: stored.id },
            data: { status: "past_due" },
          });

          await logSubscriptionEvent(stored.userId, "invoice_failed", {
            tier: stored.priceId,
            stripe_subscription_id: stripeSubscriptionId,
            status: "past_due",
            invoice_id: invoice.id,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = getCustomerId(subscription.customer);
        const stored = await findStoredSubscription(subscription.id, customerId);

        if (!stored) {
          return NextResponse.json({ received: true });
        }

        await prisma.subscription.update({
          where: { id: stored.id },
          data: {
            status: "canceled",
            priceId: null,
            currentPeriodEnd: getCurrentPeriodEnd(subscription),
          },
        });

        await logSubscriptionEvent(stored.userId, "subscription_canceled", {
          tier: stored.priceId,
          stripe_subscription_id: subscription.id,
          status: "canceled",
        });
        break;
      }

      default:
        console.log(`[webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
