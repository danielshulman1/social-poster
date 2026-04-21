import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-04-10",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function updateUserSubscription(
  userId: string,
  data: {
    stripe_subscription_id?: string;
    stripe_customer_id?: string;
    subscription_tier?: string;
    subscription_status?: string;
    trial_ends_at?: string;
    subscription_ends_at?: string;
  }
) {
  const { error } = await supabase
    .from("users")
    .update(data)
    .eq("id", userId);

  if (error) {
    console.error("[webhook] Update error:", error);
    throw error;
  }
}

async function logSubscriptionEvent(
  userId: string,
  eventType: string,
  metadata: Record<string, any>
) {
  const { error } = await supabase
    .from("subscription_logs")
    .insert({
      user_id: userId,
      event_type: eventType,
      ...metadata,
    });

  if (error) {
    console.error("[webhook] Log error:", error);
  }
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

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("[webhook] Invalid signature:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const subscription = event.data.object as Stripe.Subscription;

    switch (event.type) {
      case "customer.subscription.created": {
        const userId = subscription.metadata?.user_id;
        if (!userId) {
          console.error("[webhook] No user_id in metadata");
          return NextResponse.json({ received: true });
        }

        const tier = subscription.metadata?.tier || "free";
        const trialEndsAt = subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null;

        await updateUserSubscription(userId, {
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer as string,
          subscription_tier: tier,
          subscription_status: "trialing",
          trial_ends_at: trialEndsAt || undefined,
        });

        await logSubscriptionEvent(userId, "subscription_created", {
          tier,
          stripe_subscription_id: subscription.id,
          status: "trialing",
          trial_ends_at: trialEndsAt,
          metadata: {
            message: `User enrolled in ${tier} tier with 7-day trial access`,
          },
        });

        console.log(`[webhook] Subscription created for user ${userId}, tier: ${tier}, trial until ${trialEndsAt}`);
        break;
      }

      case "customer.subscription.updated": {
        const userId = subscription.metadata?.user_id;
        if (!userId) {
          return NextResponse.json({ received: true });
        }

        const tier = subscription.metadata?.tier || "free";
        const status = subscription.status;
        const currentPeriodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;

        await updateUserSubscription(userId, {
          subscription_tier: tier,
          subscription_status: status,
          subscription_ends_at: currentPeriodEnd || undefined,
        });

        await logSubscriptionEvent(userId, "subscription_updated", {
          tier,
          stripe_subscription_id: subscription.id,
          status,
          subscription_ends_at: currentPeriodEnd,
        });

        console.log(
          `[webhook] Subscription updated for user ${userId}, status: ${status}`
        );
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find user by stripe customer id
        const { data: users, error: queryError } = await supabase
          .from("users")
          .select("id, subscription_tier")
          .eq("stripe_customer_id", customerId)
          .limit(1)
          .single();

        if (queryError || !users) {
          console.error(
            "[webhook] User not found for customer:",
            customerId
          );
          return NextResponse.json({ received: true });
        }

        const userId = users.id;

        await logSubscriptionEvent(userId, "invoice_paid", {
          stripe_subscription_id: invoice.subscription,
          status: "active",
          metadata: {
            invoice_id: invoice.id,
            amount_paid: invoice.amount_paid,
          },
        });

        // Update subscription status to active (payment succeeded after trial)
        await updateUserSubscription(userId, {
          subscription_status: "active",
        });

        console.log(
          `[webhook] Invoice paid for user ${userId}, subscription now active`
        );
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: users } = await supabase
          .from("users")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .limit(1)
          .single();

        if (users) {
          const userId = users.id;
          await logSubscriptionEvent(userId, "invoice_failed", {
            stripe_subscription_id: invoice.subscription,
            status: "payment_failed",
            metadata: {
              invoice_id: invoice.id,
              failure_message: invoice.last_payment_error?.message,
            },
          });

          await updateUserSubscription(userId, {
            subscription_status: "payment_failed",
          });
        }

        console.log("[webhook] Invoice payment failed");
        break;
      }

      case "customer.subscription.deleted": {
        const userId = subscription.metadata?.user_id;
        if (!userId) {
          return NextResponse.json({ received: true });
        }

        await updateUserSubscription(userId, {
          subscription_status: "canceled",
          subscription_tier: "free",
        });

        await logSubscriptionEvent(userId, "subscription_canceled", {
          stripe_subscription_id: subscription.id,
          status: "canceled",
        });

        console.log(`[webhook] Subscription canceled for user ${userId}`);
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
