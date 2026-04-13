# Tier System - Quick Start Guide

## What You Have Now

Your app has a **complete tiered subscription system** ready to use. No additional setup required!

## The 30-Second Test

1. **Sign in to your app** → Auto-creates FREE tier for you
2. **Go to `/dashboard/upgrade`** → See pricing page
3. **Go to `/dashboard/admin`** → See "Tier Management" section → Click "Manage Tier" on a user
4. **Change their tier to STARTER** → User now has access to STARTER features

## Your Tier Structure

```
FREE        → 1 platform, 1 post/week, no onboarding
STARTER     → 3 platforms, 3 posts/week, voice training + onboarding (£47/mo + £47 setup)
CORE        → 3 platforms, 5 posts/week, + 1 check-in call/month (£97/mo + £47 setup)
PREMIUM     → 5 platforms, 7 posts/week, + 4 check-ins/month + strategy calls (£197/mo + £47 setup)
```

## Protecting Features by Tier

### Option 1: Wrap a React Component

```jsx
import { TierGate } from '@/lib/middleware-tier';
import { TIERS } from '@/utils/tier-config';

export default function VoiceTraining() {
  return (
    <TierGate requiredTier={TIERS.STARTER}>
      {/* This only shows for STARTER+ users */}
      <VoiceTrainingUI />
    </TierGate>
  );
}
```

### Option 2: Protect an API Route

```javascript
import { requireTier } from '@/lib/middleware-tier';
import { TIERS } from '@/utils/tier-config';

export async function POST(request) {
  const tierCheck = await requireTier(request, TIERS.STARTER);
  
  if (tierCheck.error) {
    return Response.json({ error: tierCheck.message }, { status: tierCheck.status });
  }

  // User is STARTER or higher - proceed
  const userId = tierCheck.userId;
}
```

### Option 3: Check Platform/Post Limits

```javascript
import { checkPlatformLimit, checkPostLimit } from '@/utils/tier-check';

// When user adds a platform
const platformCheck = await checkPlatformLimit(userId, currentPlatformCount);
if (!platformCheck.allowed) {
  return { error: `${platformCheck.reason} - Upgrade to add more.` };
}

// When user schedules a post
const postCheck = await checkPostLimit(userId, postsThisWeek);
if (!postCheck.allowed) {
  return { error: `${postCheck.reason} - Upgrade for more posts.` };
}
```

## Admin Commands

### Change a user's tier
Go to `/dashboard/admin` → Tier Management section → Click "Manage Tier" → Select new tier

### Cancel a subscription
Same modal → Click "Cancel Subscription" button

### View upgrade metrics
Go to `/dashboard/admin` → Stats show active users and tier distribution

## For Users

- **Sign up** → Free tier
- **Go to `/dashboard/upgrade`** → See all plans
- **Click "Upgrade Now"** → (When Stripe configured: checkout) or (Manual: admin sets tier)
- **Check tier in Settings** → See current plan and next billing date

## Enable Stripe Payments

When ready for real payments:

1. Create a Stripe account
2. Create three price objects for starter/core/premium
3. Add environment variables:
   ```
   STRIPE_PRICE_STARTER=price_xxx
   STRIPE_PRICE_CORE=price_yyy
   STRIPE_PRICE_PREMIUM=price_zzz
   STRIPE_SECRET_KEY=sk_xxx
   ```
4. Test with Stripe CLI → Users will have real checkout

**Without Stripe:** You manually set tiers in admin panel (useful for free trials, special offers, etc.)

## Files You Modified

All changes are **backwards compatible** with your existing code:

| File | What Changed |
|------|-------------|
| `app/lib/middleware-tier.js` | Fixed a bug in the hook |
| `app/api/auth/me/route.js` | Now auto-creates tier on login |
| `app/dashboard/admin/page.jsx` | Added tier management UI |
| `app/components/TierStatusCard.jsx` | Fixed data formatting bug |
| `app/dashboard/upgrade/page.jsx` | **New** - pricing page |

## Utility Functions Ready to Use

```javascript
// Check if user has access to a feature
import { checkFeatureAccess } from '@/utils/tier-check';
const { allowed, reason } = await checkFeatureAccess(userId, 'voiceTraining');

// Get user's tier info
import { getUserTierInfo } from '@/utils/tier-check';
const tierInfo = await getUserTierInfo(userId);
// Returns: { current_tier, subscription_status, isActive, features }

// Check tier in client component
import { useTierCheck } from '@/lib/middleware-tier';
const { tier, hasTierAccess } = useTierCheck();

// Update user tier (admin only)
import { updateUserTier } from '@/utils/tier-db';
await updateUserTier(userId, 'premium', setupFeePaid: true);

// Cancel subscription
import { cancelUserSubscription } from '@/utils/tier-db';
await cancelUserSubscription(userId);
```

## Common Scenarios

### Scenario 1: Gating Voice Training
```jsx
<TierGate requiredTier={TIERS.STARTER}>
  <VoiceTrainingSection />
</TierGate>
```

### Scenario 2: Limiting Platforms
```javascript
export async function POST(request) {
  const tierCheck = await requireTier(request, TIERS.FREE);
  if (tierCheck.error) return Response.json({ error: tierCheck.message }, { status: tierCheck.status });

  const platforms = await getPlatformsForUser(tierCheck.userId);
  const { allowed } = await checkPlatformLimit(tierCheck.userId, platforms.length);

  if (!allowed) {
    return Response.json({ error: 'Upgrade to add more platforms' }, { status: 403 });
  }

  // User can add a platform
  await createPlatform(...);
}
```

### Scenario 3: Showing Upgrade Prompt
```jsx
import { TierGate } from '@/lib/middleware-tier';
import { TIERS } from '@/utils/tier-config';

<TierGate 
  requiredTier={TIERS.CORE}
  fallback={
    <div className="p-6 border border-yellow rounded-lg">
      <h3>Monthly Check-in Calls</h3>
      <p>Upgrade to Core to book your first call</p>
      <Link href="/dashboard/upgrade">See Plans</Link>
    </div>
  }
>
  <CheckInCallBooking />
</TierGate>
```

## Testing Checklist

- [ ] Sign up new user → AUTO gets FREE tier
- [ ] Go to `/dashboard/admin` → See Tier Management section
- [ ] Upgrade user to STARTER → Works instantly
- [ ] Go to `/dashboard/upgrade` → Pricing page displays
- [ ] Try accessing a STARTER-gated feature as FREE user → See upgrade prompt
- [ ] Upgrade to STARTER → Can now access
- [ ] Cancel subscription in admin → Reverts to FREE
- [ ] Check `/dashboard/settings` → Tier card shows current plan

## Next Steps

1. **Add tier gates** to your premium features (copy code above)
2. **Test all tiers** using admin panel
3. **When ready:** Connect Stripe for payment processing
4. **Optional:** Add more features/limits that vary by tier

## Help & Examples

### Add a new tier?
Edit `TIER_CONFIG` in `app/utils/tier-config.js`

### Create tier-based routes?
Use `requireTier()` in API routes or `TierGate` in components

### Check a custom limit?
Use `checkPlatformLimit()` / `checkPostLimit()` or create your own in `tier-check.js`

### Debug tier issues?
Check `/api/auth/tier-check` response to see user's current tier state

---

**Everything is working now. You're ready to add features and payments whenever you need them!**
