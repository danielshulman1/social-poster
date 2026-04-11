/**
 * Stripe Customer Portal Route
 * POST /api/stripe/portal
 * Creates a link to Stripe Customer Portal for managing subscriptions
 */

import { requireAuth } from '../../../utils/auth';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

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
    const { stripeCustomerId } = body;

    if (!stripeCustomerId) {
      return Response.json(
        { error: 'Stripe customer ID required' },
        { status: 400 }
      );
    }

    // Create billing portal session
    const sessionData = new URLSearchParams();
    sessionData.append('customer', stripeCustomerId);
    sessionData.append('return_url', `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`);

    const portalRes = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: sessionData.toString(),
    });

    if (!portalRes.ok) {
      const error = await portalRes.json();
      console.error('[portal] Stripe error:', error);
      return Response.json(
        { error: `Stripe error: ${error.error?.message || 'unknown'}` },
        { status: portalRes.status }
      );
    }

    const session = await portalRes.json();

    return Response.json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.error('[portal] Error:', error.message);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
