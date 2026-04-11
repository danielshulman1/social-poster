# Tier System - Real-World Usage Examples

Complete examples showing how to implement tier restrictions in your actual app.

## 1️⃣ Protect a Page (Redirect to Upgrade)

```javascript
// app/dashboard/voice-training/page.jsx

import { redirect } from 'next/navigation';
import { getUserTierInfo } from '@/utils/tier-check';
import { TIERS } from '@/utils/tier-config';

export default async function VoiceTrainingPage() {
  // Get user (from session/auth)
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  // Check tier
  const tierInfo = await getUserTierInfo(user.id);
  
  if (tierInfo.current_tier === TIERS.FREE) {
    redirect(`/upgrade?required=${TIERS.STARTER}`);
  }

  return (
    <div>
      <h1>Voice Training</h1>
      {/* Voice training UI */}
    </div>
  );
}
```

## 2️⃣ Protect an API Endpoint

```javascript
// app/api/dashboard/platforms/add/route.js

import { requireTier } from '@/lib/middleware-tier';
import { checkPlatformLimit } from '@/utils/tier-check';
import { TIERS } from '@/utils/tier-config';

export async function POST(request) {
  // Check tier access
  const tierCheck = await requireTier(request, TIERS.STARTER);
  
  if (tierCheck.error) {
    return Response.json(
      { error: tierCheck.message },
      { status: tierCheck.status }
    );
  }

  const { platform } = await request.json();
  const userId = tierCheck.userId;

  // Check platform limit
  const currentCount = await getUserPlatformCount(userId);
  const { allowed, limit } = await checkPlatformLimit(
    userId,
    currentCount
  );

  if (!allowed) {
    return Response.json(
      {
        error: `Platform limit reached (${limit} max)`,
        code: 'PLATFORM_LIMIT_EXCEEDED',
        limit,
        current: currentCount,
      },
      { status: 403 }
    );
  }

  // Add platform
  await addPlatform(userId, platform);

  return Response.json({
    success: true,
    message: `${platform} added successfully`,
  });
}
```

## 3️⃣ Show/Hide Features Based on Tier

```javascript
// app/components/Dashboard.jsx

import { useTierCheck } from '@/lib/middleware-tier';
import { TIERS } from '@/utils/tier-config';

export function Dashboard() {
  const { tier, hasTierAccess, loading } = useTierCheck();

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1>Dashboard</h1>

      {/* Platform Management - Starter+ */}
      <section className="rounded-lg border">
        <h2>Platforms</h2>
        <PlatformManager />
      </section>

      {/* Voice Training - Starter+ */}
      {hasTierAccess(TIERS.STARTER) ? (
        <section className="rounded-lg border">
          <h2>Voice Training</h2>
          <VoiceTrainingWidget />
        </section>
      ) : (
        <section className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <h3 className="font-semibold">Voice Training</h3>
          <p className="text-sm text-gray-600">
            Upgrade to Starter tier to train your AI on your
            social media voice.
          </p>
          <a href="/upgrade" className="text-blue-600 hover:underline">
            View plans →
          </a>
        </section>
      )}

      {/* Check-in Calls - Core+ */}
      {hasTierAccess(TIERS.CORE) ? (
        <section className="rounded-lg border">
          <h2>Schedule Check-in Call</h2>
          <CallScheduler />
        </section>
      ) : null}

      {/* Strategy Calls - Premium */}
      {hasTierAccess(TIERS.PREMIUM) ? (
        <section className="rounded-lg border">
          <h2>Schedule Strategy Call</h2>
          <StrategyCallScheduler />
        </section>
      ) : null}
    </div>
  );
}
```

## 4️⃣ Limit Resource Usage (Posts Per Week)

```javascript
// app/api/posts/schedule/route.js

import { requireTier } from '@/lib/middleware-tier';
import { checkPostLimit } from '@/utils/tier-check';
import { TIERS } from '@/utils/tier-config';

export async function POST(request) {
  const tierCheck = await requireTier(request);
  if (tierCheck.error) {
    return Response.json(
      { error: tierCheck.message },
      { status: tierCheck.status }
    );
  }

  const { content, platforms, scheduleTime } = await request.json();
  const userId = tierCheck.userId;

  // Get posts scheduled for this week
  const weeklyCount = await getWeeklyPostCountForUser(userId);

  // Check limit
  const { allowed, limit, current } = await checkPostLimit(
    userId,
    weeklyCount
  );

  if (!allowed) {
    return Response.json(
      {
        error: `Weekly post limit reached`,
        message: `You've scheduled ${current} of ${limit} posts this week`,
        limit,
        current,
        nextResetDate: getNextWeekMonday(),
      },
      { status: 403 }
    );
  }

  // Schedule the posts
  const postIds = await scheduleContentPosts(
    userId,
    platforms,
    content,
    scheduleTime
  );

  return Response.json({
    success: true,
    postIds,
    remaining: limit - (current + platforms.length),
  });
}
```

## 5️⃣ Handle Subscription Expiration

```javascript
// app/api/cron/check-subscriptions/route.js
// Called daily via cron job

import {
  getActiveSubscriptions,
  expireSubscription,
} from '@/utils/tier-db';

export async function GET(request) {
  // Verify cron secret
  const token = request.headers.get('authorization');
  if (token !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const now = new Date();
    const expiredSubscriptions = await getActiveSubscriptions();

    const toExpire = expiredSubscriptions.filter(
      (sub) =>
        sub.next_billing_date &&
        new Date(sub.next_billing_date) < now
    );

    // Mark as expired
    let expiredCount = 0;
    for (const sub of toExpire) {
      await expireSubscription(sub.user_id);
      
      // Optionally: send email notification
      await sendSubscriptionExpiredEmail(sub.email);
      
      expiredCount++;
    }

    return Response.json({
      success: true,
      expiredCount,
      message: `${expiredCount} subscriptions marked as expired`,
    });
  } catch (error) {
    console.error('[check-subscriptions] Error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

## 6️⃣ Display Pricing & Upgrade Page

```javascript
// app/upgrade/page.jsx

import { useTierCheck } from '@/lib/middleware-tier';
import { TIER_CONFIG, TIERS, formatPrice } from '@/utils/tier-config';

export function UpgradePage() {
  const { tier, hasTierAccess } = useTierCheck();
  const [selectedTier, setSelectedTier] = React.useState(TIERS.STARTER);

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold">Choose Your Plan</h1>
        <p className="mt-2 text-gray-600">
          {tier === TIERS.FREE
            ? 'Start with Starter or go Premium'
            : `Current: ${tier}`}
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {[TIERS.STARTER, TIERS.CORE, TIERS.PREMIUM].map(
          (tierKey) => {
            const config = TIER_CONFIG[tierKey];
            const isCurrentTier = tier === tierKey;

            return (
              <div
                key={tierKey}
                className={`rounded-lg border-2 p-6 transition ${
                  isCurrentTier
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <h2 className="text-2xl font-bold">
                  {config.name}
                </h2>

                <div className="mt-4">
                  <div className="text-4xl font-bold">
                    £{formatPrice(config.monthlyPrice)}
                  </div>
                  <div className="text-sm text-gray-600">
                    per month
                  </div>
                  {config.setupFee > 0 && (
                    <div className="mt-1 text-sm text-gray-600">
                      + £{formatPrice(config.setupFee)} setup fee
                    </div>
                  )}
                </div>

                <ul className="mt-6 space-y-3">
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    {config.features.maxPlatforms} platforms
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    {config.features.postsPerWeek} posts/week
                  </li>
                  {config.features.voiceTraining && (
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Voice training
                    </li>
                  )}
                  {config.features.checkInCalls && (
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Monthly check-ins
                    </li>
                  )}
                  {config.features.strategyCalls && (
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Monthly strategy calls
                    </li>
                  )}
                  {config.features.prioritySupport && (
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Priority support
                    </li>
                  )}
                </ul>

                <button
                  onClick={() => handleUpgrade(tierKey)}
                  disabled={isCurrentTier}
                  className={`mt-6 w-full rounded py-2 font-semibold ${
                    isCurrentTier
                      ? 'bg-gray-200 text-gray-600'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isCurrentTier
                    ? 'Current Plan'
                    : `Upgrade to ${config.name}`}
                </button>
              </div>
            );
          }
        )}
      </div>

      {/* FAQ */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold">FAQ</h3>
        <details className="rounded-lg border border-gray-200 p-4">
          <summary className="font-semibold">
            What's included in the setup fee?
          </summary>
          <p className="mt-2 text-gray-600">
            Onboarding session, voice training, and initial AI
            configuration.
          </p>
        </details>
        <details className="rounded-lg border border-gray-200 p-4">
          <summary className="font-semibold">
            Can I cancel anytime?
          </summary>
          <p className="mt-2 text-gray-600">
            Yes, cancel your subscription anytime. You'll keep
            access until your billing period ends.
          </p>
        </details>
      </section>
    </div>
  );
}

async function handleUpgrade(tierKey) {
  // In real app: redirect to Stripe or call upgrade API
  const response = await fetch('/api/upgrade/initiate', {
    method: 'POST',
    body: JSON.stringify({ tier: tierKey }),
  });
  // Handle response...
}
```

## 7️⃣ Admin Analytics Dashboard

```javascript
// app/admin/analytics/page.jsx

import { getTierAnalytics } from '@/utils/tier-db';
import { TIER_CONFIG } from '@/utils/tier-config';

export async function AdminAnalyticsPage() {
  const analytics = await getTierAnalytics();

  // Calculate MRR (Monthly Recurring Revenue)
  const mrrByTier = calculateMRR(analytics);
  const totalMRR = Object.values(mrrByTier).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Tier Analytics</h1>

      {/* MRR Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card
          title="Total MRR"
          value={`£${(totalMRR / 100).toFixed(2)}`}
        />
        {Object.entries(mrrByTier).map(([tier, mrr]) => (
          <Card
            key={tier}
            title={TIER_CONFIG[tier].name}
            value={`£${(mrr / 100).toFixed(2)}`}
          />
        ))}
      </div>

      {/* User Count by Tier */}
      <div className="rounded-lg border border-gray-200">
        <h2 className="border-b border-gray-200 p-4 font-semibold">
          Users by Tier & Status
        </h2>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th className="p-4">Tier</th>
              <th className="p-4">Active</th>
              <th className="p-4">Cancelled</th>
              <th className="p-4">Expired</th>
              <th className="p-4">Total</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(TIER_CONFIG).map((config) => {
              const rows = analytics.filter(
                (row) => row.current_tier === config.name
              );
              const activeUsers = rows.find(
                (r) => r.subscription_status === 'active'
              )?.user_count || 0;
              const cancelledUsers = rows.find(
                (r) => r.subscription_status === 'cancelled'
              )?.user_count || 0;
              const expiredUsers = rows.find(
                (r) => r.subscription_status === 'expired'
              )?.user_count || 0;
              const totalUsers = activeUsers + cancelledUsers + expiredUsers;

              return (
                <tr
                  key={config.name}
                  className="border-b border-gray-100"
                >
                  <td className="p-4 font-semibold">{config.name}</td>
                  <td className="p-4 text-green-600">{activeUsers}</td>
                  <td className="p-4 text-red-600">{cancelledUsers}</td>
                  <td className="p-4 text-gray-600">{expiredUsers}</td>
                  <td className="p-4 font-semibold">{totalUsers}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

function calculateMRR(analytics) {
  // Calculate based on active subscriptions × tier price
  return {
    starter: 4700 * (analytics.find(a => a.current_tier === 'starter' && a.subscription_status === 'active')?.user_count || 0),
    core: 9700 * (analytics.find(a => a.current_tier === 'core' && a.subscription_status === 'active')?.user_count || 0),
    premium: 19700 * (analytics.find(a => a.current_tier === 'premium' && a.subscription_status === 'active')?.user_count || 0),
  };
}
```

## 8️⃣ Email Notification on Upgrade

```javascript
// app/api/user/upgrade/route.js

import { sendUpgradeEmail } from '@/lib/email';
import { updateUserTier } from '@/utils/tier-db';

export async function POST(request) {
  const { userId, newTier } = await request.json();

  // Update tier
  const tierInfo = await updateUserTier(userId, newTier, true);

  // Send confirmation email
  const user = await getUser(userId);
  await sendUpgradeEmail({
    email: user.email,
    name: user.name,
    tier: newTier,
    setupFeeAmount: TIER_CONFIG[newTier].setupFee,
    monthlyAmount: TIER_CONFIG[newTier].monthlyPrice,
    nextBillingDate: tierInfo.next_billing_date,
  });

  return Response.json({ success: true });
}
```

## 9️⃣ Feature-Specific Rate Limits

```javascript
// lib/rate-limits.js

import { getTierLimit } from '@/utils/tier-config';

export async function applyTierRateLimit(userId, featureName) {
  const tierInfo = await getUserTier(userId);
  const limit = getTierLimit(tierInfo.current_tier, featureName);

  // Get usage this period
  const usage = await getFeatureUsage(userId, featureName);

  if (usage >= limit) {
    return {
      allowed: false,
      limit,
      usage,
      resetDate: getNextResetDate(featureName),
    };
  }

  return { allowed: true };
}
```

## 🔟 Payment Integration - Stripe Webhook

```javascript
// app/api/webhooks/stripe/route.js

import Stripe from 'stripe';
import { updateUserTier, cancelUserSubscription } from '@/utils/tier-db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  const signature = request.headers.get('stripe-signature');
  const body = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const { type, data } = event;

  if (type === 'customer.subscription.updated') {
    const subscription = data.object;
    const stripeProductId = subscription.items.data[0].price.product;
    
    // Map Stripe product ID to your tier
    const tier = getStripeProductTier(stripeProductId);
    const userId = await getUserIdFromStripeCustomer(subscription.customer);
    
    await updateUserTier(userId, tier, true);
  }

  if (type === 'customer.subscription.deleted') {
    const subscription = data.object;
    const userId = await getUserIdFromStripeCustomer(subscription.customer);
    
    await cancelUserSubscription(userId);
  }

  return Response.json({ received: true });
}

function getStripeProductTier(productId) {
  // Map your Stripe product IDs to tiers
  const productMap = {
    'prod_starter': 'starter',
    'prod_core': 'core',
    'prod_premium': 'premium',
  };
  return productMap[productId] || 'free';
}
```

---

These examples show how to integrate the tier system throughout your app. Pick and adapt the patterns that fit your use case!
