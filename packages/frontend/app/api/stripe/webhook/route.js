/**
 * Stripe Webhook Route
 * POST /api/stripe/webhook
 * Handles Stripe events: payment_intent.succeeded, customer.subscription.updated, etc.
 */

import crypto from 'crypto';
import { updateUserTier } from '../../../utils/tier-db';
import { query } from '../../../utils/db';

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Verify Stripe webhook signature
 */
function verifyStripeSignature(body, signature) {
  if (!STRIPE_WEBHOOK_SECRET) {
    throw new Error('Stripe webhook secret not configured');
  }

  const parts = signature.split(',');
  let timestampStr = '';
  let signedContent = '';

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't') timestampStr = value;
    if (key === 'v1') signedContent = value;
  }

  if (!timestampStr || !signedContent) {
    throw new Error('Invalid signature format');
  }

  // Check timestamp is recent (within 5 minutes)
  const timestamp = parseInt(timestampStr, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    throw new Error('Timestamp too old');
  }

  // Verify signature
  const signedString = `${timestampStr}.${body}`;
  const expectedSignature = crypto
    .createHmac('sha256', STRIPE_WEBHOOK_SECRET)
    .update(signedString)
    .digest('hex');

  if (expectedSignature !== signedContent) {
    throw new Error('Invalid signature');
  }

  return true;
}

export async function POST(request) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return Response.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify signature
    try {
      verifyStripeSignature(body, signature);
    } catch (err) {
      console.error('[webhook] Signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse event
    const event = JSON.parse(body);

    console.log(`[webhook] Received event: ${event.type}`);

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      // Get user ID from client reference ID or metadata
      const userId = session.client_reference_id || session.metadata?.user_id;
      const tier = session.metadata?.tier;

      if (!userId || !tier) {
        console.error('[webhook] Missing userId or tier in session', { session });
        return Response.json({ received: true });
      }

      try {
        // Update user tier
        const result = await updateUserTier(
          parseInt(userId, 10),
          tier,
          true // setupFeePaid = true
        );

        console.log(`[webhook] Updated tier for user ${userId}:`, result);

        // Optionally: Send confirmation email
        // await sendTierUpgradeEmail({ userId, tier });
      } catch (err) {
        console.error('[webhook] Error updating tier:', err.message);
        // Still return 200 to prevent Stripe retries
      }
    }

    // Handle customer.subscription.deleted (cancelled subscription)
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const userId = subscription.metadata?.user_id;

      if (userId) {
        try {
          // Could downgrade user to free tier or mark subscription as cancelled
          console.log(`[webhook] Subscription cancelled for user ${userId}`);
          // await cancelUserSubscription(parseInt(userId, 10));
        } catch (err) {
          console.error('[webhook] Error handling subscription cancellation:', err.message);
        }
      }
    }

    // Return 200 OK for all events (Stripe expects this)
    return Response.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[webhook] Error:', error.message);
    // Still return 200 to prevent Stripe retries on unparseable events
    return Response.json({ received: true }, { status: 200 });
  }
}
