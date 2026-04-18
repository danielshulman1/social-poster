import { NextRequest, NextResponse } from 'next/server';

/**
 * Web Vitals Metrics Endpoint
 * Receives Core Web Vitals data from frontend and logs for Vercel Analytics
 * Tracks: CLS, FID, FCP, LCP, TTFB
 */
export async function POST(request: NextRequest) {
  try {
    const metric = await request.json();

    // Log metric for monitoring (visible in Vercel dashboard)
    console.log(`[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)} ${metric.unit || 'ms'}`);

    // Optional: Send to external analytics service
    // Example: Datadog, Sentry, or custom analytics
    if (process.env.ANALYTICS_ENDPOINT) {
      await fetch(process.env.ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric: metric.name,
          value: metric.value,
          unit: metric.unit,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // Silently fail - don't block user if analytics endpoint is down
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to process metric:', error);
    return NextResponse.json({ error: 'Failed to process metric' }, { status: 400 });
  }
}
