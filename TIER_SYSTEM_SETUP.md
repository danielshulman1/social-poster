# Tiered Access Control System - Setup Guide

## 📋 Overview

This is a complete, scalable tiered access control system integrated with your existing Supabase + Next.js setup. It supports 4 tiers (Free, Starter, Core, Premium) and is designed to easily integrate with Stripe payments later.

## 🗂️ Files Created

```
packages/frontend/
├── app/utils/
│   ├── tier-config.js          # Tier definitions and limits
│   ├── tier-db.js              # Database operations
│   └── tier-check.js           # Access control checks
├── app/lib/
│   └── middleware-tier.js       # Middleware and client hooks
├── app/api/
│   ├── auth/tier-check/
│   │   └── route.js            # Check user's current tier
│   └── admin/
│       ├── users/tier/
│       │   ├── route.js        # Update user tier (GET/POST)
│       │   └── cancel/
│       │       └── route.js    # Cancel subscription
│       └── tiers/analytics/
│           └── route.js        # Tier analytics
└── database/migrations/
    └── 001_create_user_tiers_table.sql  # Database schema
```

## 🚀 Quick Start

### 1. Run the Database Migration

Execute the SQL migration to create the `user_tiers` table:

```bash
# Using psql directly
psql -U postgres -h localhost -d your_db < packages/frontend/database/migrations/001_create_user_tiers_table.sql

# Or run through your Supabase dashboard SQL editor (recommended)
# Copy the contents of the .sql file and run in your Supabase SQL editor
```

### 2. Initialize Tier System in Your Auth Flow

In your login/signup flow, ensure tier record is created:

```javascript
import { createUserTier, ensureUserTiersTable } from '@/utils/tier-db';

export async function handleNewUserSignup(userId) {
  // Ensure table exists
  await ensureUserTiersTable();
  
  // Create initial tier record (FREE tier)
  const tierInfo = await createUserTier(userId);
  console.log('User created with tier:', tierInfo);
}
```

## 📚 Core Concepts

### Tier Structure

```javascript
{
  STARTER: {
    monthlyPrice: 4700,  // £47 in pence
    setupFee: 4700,
    maxPlatforms: 3,
    postsPerWeek: 3,
    features: { voiceTraining, onboarding, etc }
  },
  CORE: { ... },
  PREMIUM: { ... }
}
```

### Database Schema

```sql
user_tiers (
  id,
  user_id (FK),
  current_tier,        -- 'free', 'starter', 'core', 'premium'
  setup_fee_paid,
  subscription_status, -- 'active', 'cancelled', 'expired'
  next_billing_date,   -- For Stripe integration
  created_at,
  updated_at
)
```

## 💡 Usage Examples

### Example 1: Protecting an API Endpoint

```javascript
// app/api/dashboard/voicetraining/route.js

import { requireTier } from '@/lib/middleware-tier';
import { TIERS } from '@/utils/tier-config';

export async function POST(request) {
  // Require STARTER tier minimum
  const tierCheck = await requireTier(request, TIERS.STARTER);
  
  if (tierCheck.error) {
    return Response.json(
      { error: tierCheck.message },
      { status: tierCheck.status }
    );
  }

  // User has required tier - proceed
  const userId = tierCheck.userId;
  // ... rest of your logic
}
```

### Example 2: Protecting a Page with Middleware

Create a middleware wrapper for Next.js pages:

```javascript
// app/middleware-tier-protected.js

import { requireAuth } from '@/utils/auth';
import { needsUpgrade } from '@/utils/tier-check';
import { TIERS } from '@/utils/tier-config';

export async function withTierProtection(requiredTier) {
  return async (request) => {
    const user = await requireAuth(request);
    
    if (!user) {
      return Response.redirect('/login');
    }

    const shouldUpgrade = await needsUpgrade(user.id, requiredTier);
    
    if (shouldUpgrade) {
      return Response.redirect('/upgrade');
    }

    return null; // Allow access
  };
}
```

### Example 3: Checking Feature Access in a Component

```javascript
// In a React component

import { useTierCheck } from '@/lib/middleware-tier';
import { TIERS } from '@/utils/tier-config';

export function VoiceTrainingButton() {
  const { hasTierAccess, tier } = useTierCheck();

  if (!hasTierAccess(TIERS.STARTER)) {
    return (
      <button disabled className="opacity-50">
        Voice Training (Starter tier+)
      </button>
    );
  }

  return <button>Start Voice Training</button>;
}
```

### Example 4: Check Platform Limit Before Adding

```javascript
// In your platform integration flow

import { checkPlatformLimit } from '@/utils/tier-check';

async function addNewPlatform(userId, platform) {
  // Get user's current connected platforms
  const currentCount = await getUserPlatformCount(userId);
  
  // Check if they can add more
  const { allowed, limit, current } = await checkPlatformLimit(
    userId,
    currentCount
  );

  if (!allowed) {
    throw new Error(
      `Upgrade to add more platforms. ` +
      `Current: ${current}/${limit}`
    );
  }

  // Proceed with adding platform
  await connectPlatform(userId, platform);
}
```

### Example 5: Check Post Limit Before Publishing

```javascript
// In your post publishing flow

import { checkPostLimit } from '@/utils/tier-check';

async function schedulePost(userId, content) {
  // Get posts scheduled for this week
  const weeklyCount = await getWeeklyPostCount(userId);
  
  // Check limit
  const { allowed, limit, current } = await checkPostLimit(
    userId,
    weeklyCount
  );

  if (!allowed) {
    throw new Error(
      `Post limit reached. ` +
      `${current}/${limit} posts this week`
    );
  }

  // Proceed with scheduling
  await saveScheduledPost(userId, content);
}
```

### Example 6: Admin Panel - Update User Tier

```javascript
// In your admin dashboard component

async function upgradeUserToCore(userId) {
  const response = await fetch('/api/admin/users/tier', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAdminToken()}`,
    },
    body: JSON.stringify({
      userId,
      newTier: 'core',
      setupFeePaid: true, // Mark setup fee as paid
    }),
  });

  const result = await response.json();
  if (result.success) {
    console.log('User upgraded:', result.tierInfo);
  }
}
```

### Example 7: Check Subscription Status

```javascript
// When rendering user dashboard

import { getUserTierInfo } from '@/utils/tier-check';

export async function DashboardPage({ userId }) {
  const tierInfo = await getUserTierInfo(userId);

  if (!tierInfo.isActive) {
    return <SubscriptionExpiredNotice />;
  }

  if (tierInfo.subscription_status === 'cancelled') {
    return (
      <div className="alert alert-warning">
        Subscription cancelled. Renew to regain access.
      </div>
    );
  }

  return <Dashboard tierInfo={tierInfo} />;
}
```

### Example 8: Client-Side Tier Gate Component

```javascript
// Wrap premium features

import { TierGate } from '@/lib/middleware-tier';
import { TIERS } from '@/utils/tier-config';

export function StrategyCallsSection() {
  return (
    <TierGate requiredTier={TIERS.PREMIUM}>
      <div>
        <h3>Schedule Strategy Call</h3>
        <ScheduleCallForm />
      </div>
    </TierGate>
  );
}
```

### Example 9: Display Tier Features

```javascript
// Show what they're paying for

import { getTierFeaturesForDisplay } from '@/utils/tier-check';

export function PlanComparison() {
  return (
    <div>
      {Object.entries(TIERS).map(([tierName, tierKey]) => {
        const features = getTierFeaturesForDisplay(tierKey);
        return (
          <div key={tierKey}>
            <h3>{tierName}</h3>
            <ul>
              <li>Platforms: {features.platforms}</li>
              <li>Posts/week: {features.postsPerWeek}</li>
              <li>Support: {features.support}</li>
            </ul>
          </div>
        );
      })}
    </div>
  );
}
```

### Example 10: Admin Analytics

```javascript
// Show subscription stats in admin panel

async function getTierStats() {
  const response = await fetch('/api/admin/tiers/analytics', {
    headers: {
      'Authorization': `Bearer ${getAdminToken()}`,
    },
  });

  const data = await response.json();
  // data.analytics = [
  //   { current_tier: 'starter', subscription_status: 'active', user_count: 5 },
  //   { current_tier: 'premium', subscription_status: 'active', user_count: 2 },
  //   ...
  // ]
  
  return data.analytics;
}
```

## 🔌 Stripe Integration (Future)

The system is designed for easy Stripe integration:

1. **Webhook Handler**: Create `/api/webhooks/stripe` to handle `customer.subscription.updated`, `customer.subscription.deleted`

```javascript
// app/api/webhooks/stripe/route.js

import { updateUserTier, cancelUserSubscription } from '@/utils/tier-db';

export async function POST(request) {
  const event = await request.json();

  if (event.type === 'customer.subscription.updated') {
    const { customer, items } = event.data.object;
    const product = items.data[0].price.product;
    
    // Map Stripe product ID to tier
    const tier = getStripeProductTier(product);
    const userId = await getSupabaseUserIdFromStripeCustomer(customer);
    
    await updateUserTier(userId, tier, true);
  }

  if (event.type === 'customer.subscription.deleted') {
    const customer = event.data.object.customer;
    const userId = await getSupabaseUserIdFromStripeCustomer(customer);
    
    await cancelUserSubscription(userId);
  }
}
```

2. **Add Stripe Customer ID**: Extend `user_tiers` table:

```sql
ALTER TABLE user_tiers ADD COLUMN stripe_customer_id VARCHAR(255);
ALTER TABLE user_tiers ADD COLUMN stripe_subscription_id VARCHAR(255);
```

3. **Update tier-db.js** functions to handle Stripe IDs when updating tiers

## 🛡️ Security Considerations

1. **Always verify tier on the server side** - Never trust client-side tier checks for sensitive operations
2. **Rate limit API calls** - Especially tier check endpoints
3. **Audit tier changes** - Log all tier upgrades/downgrades for compliance
4. **Validate tier before charging** - Verify user actually paid before upgrading tier

## 🔄 Subscription Lifecycle

1. **New User**: Created with FREE tier
2. **Upgrade**: Admin updates tier (pre-Stripe) or Stripe webhook updates (post-Stripe)
3. **Active**: `subscription_status = 'active'` and `next_billing_date` in future
4. **Renewal**: On next_billing_date, charge user or update status
5. **Cancellation**: Set `subscription_status = 'cancelled'`
6. **Expiration**: After next_billing_date passes without payment, set to 'expired'

## 📝 Customization

### Add a New Tier

1. Update `TIERS` in `tier-config.js`:
```javascript
export const TIERS = {
  // ... existing
  CUSTOM: 'custom',
};
```

2. Add config to `TIER_CONFIG`:
```javascript
[TIERS.CUSTOM]: {
  name: 'Custom',
  monthlyPrice: 29700,
  features: { /* ... */ }
}
```

3. Update `tierOrder` in `middleware-tier.js` and `tier-check.js` with new tier level

### Add a New Feature

1. Add to `TIER_CONFIG` feature object:
```javascript
[TIERS.PREMIUM]: {
  features: {
    // ... existing
    customBranding: true,
  }
}
```

2. Update feature check functions in `tier-check.js`
3. Add feature gate in components using `canAccessFeature()`

## ❓ FAQ

**Q: How do I migrate existing users to this system?**
A: Run:
```javascript
import { createUserTier } from '@/utils/tier-db';
const allUsers = await getAllUsers();
for (const user of allUsers) {
  await createUserTier(user.id);
}
```

**Q: Can a user have multiple tiers?**
A: No, by design. The `UNIQUE` constraint on `user_id` enforces one tier per user.

**Q: What happens when subscription expires?**
A: Set to 'expired' status and user reverts to FREE tier. They can reactivate by paying.

**Q: How do I handle free trial periods?**
A: Set `subscription_status = 'active'` and `next_billing_date` to future date. On that date, trigger billing.

## 🚨 Troubleshooting

**"Table doesn't exist" error**
- Run the migration SQL file
- Or ensure `ensureUserTiersTable()` is called on app startup

**Tier not updating**
- Check user's `subscription_status` is 'active'
- Verify admin user has `is_admin = true`

**Middleware not working**
- Ensure token is in `Authorization: Bearer <token>` format
- Check token is not expired (7-day expiry in auth.js)

---

For questions or issues, check the individual file comments for detailed documentation.
