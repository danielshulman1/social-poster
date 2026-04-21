/**
 * Stripe Checkout Route
 * POST /api/stripe/create-checkout
 * Creates a Stripe Checkout session for tier upgrades
 */

import { requireAuth } from '../../../utils/auth';
import { getUserTier } from '../../../utils/tier-db';
import { getTierConfig } from '../../../utils/tier-config';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const PRICE_IDS = {
  starter: process.env.STRIPE_PRICE_STARTER,
  core: process.env.STRIPE_PRICE_CORE,
  premium: process.env.STRIPE_PRICE_PREMIUM,
};

export async function POST(request) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!STRIPE_SECRET_KEY) {
      return Response.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { tier } = body;

    if (!tier || !['starter', 'core', 'premium'].includes(tier)) {
      return Response.json(
        { error: 'Invalid tier' },
        { status: 400 }
      );
    }

    const priceId = PRICE_IDS[tier];
    if (!priceId) {
      return Response.json(
        { error: `Price not configured for tier: ${tier}` },
        { status: 500 }
      );
    }

    // Get user's current tier
    const currentTier = await getUserTier(user.id);

    // Create Stripe Checkout Session
    const sessionData = new URLSearchParams();
    sessionData.append('success_url', `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?payment=success&tier=${tier}`);
    sessionData.append('cancel_url', `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?payment=cancelled`);
    sessionData.append('line_items[0][price]', priceId);
    sessionData.append('line_items[0][quantity]', '1');
    sessionData.append('mode', 'subscription');
    sessionData.append('subscription_data[trial_period_days]', '7');
    sessionData.append('customer_email', user.email);
    sessionData.append('client_reference_id', user.id.toString());
    sessionData.append('metadata[user_id]', user.id.toString());
    sessionData.append('metadata[tier]', tier);

    const checkoutRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: sessionData.toString(),
    });

    if (!checkoutRes.ok) {
      const error = await checkoutRes.json();
      console.error('[create-checkout] Stripe error:', error);
      return Response.json(
        { error: `Stripe error: ${error.error?.message || 'unknown'}` },
        { status: checkoutRes.status }
      );
    }

    const session = await checkoutRes.json();

    return Response.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('[create-checkout] Error:', error.message);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
