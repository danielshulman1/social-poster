# Tier System Integration Checklist

Step-by-step guide to integrate the new tier system into your existing app **without breaking anything**.

## ✅ Phase 1: Database Setup (15 minutes)

- [ ] Run the SQL migration to create `user_tiers` table
  ```bash
  # Option A: Supabase Dashboard
  # - Go to SQL Editor
  # - Copy contents of database/migrations/001_create_user_tiers_table.sql
  # - Run the query
  
  # Option B: psql command line
  psql -U postgres -h your-host -d your-db < database/migrations/001_create_user_tiers_table.sql
  ```

- [ ] Verify table created
  ```sql
  SELECT * FROM user_tiers LIMIT 1;
  -- Should return: ERROR (table is empty - this is expected)
  ```

- [ ] Back up your database before proceeding ✨

## ✅ Phase 2: Copy New Files (5 minutes)

All these files are already created in your project:

```
✓ app/utils/tier-config.js
✓ app/utils/tier-db.js
✓ app/utils/tier-check.js
✓ app/lib/middleware-tier.js
✓ app/api/auth/tier-check/route.js
✓ app/api/admin/users/tier/route.js
✓ app/api/admin/users/tier/cancel/route.js
✓ app/api/admin/tiers/analytics/route.js
✓ app/components/AdminTierManagement.jsx
```

Files are ready to use!

## ✅ Phase 3: Initialize Tier Records for Existing Users (10 minutes)

Option A: Via Admin Script

```javascript
// scripts/init-user-tiers.js

import { createUserTier, ensureUserTiersTable } from '@/utils/tier-db';
import { query } from '@/utils/db';

async function initializeTiers() {
  console.log('🚀 Initializing user tiers...');
  
  await ensureUserTiersTable();

  // Get all users
  const result = await query('SELECT id FROM users');
  const users = result.rows;

  let created = 0;
  for (const user of users) {
    try {
      await createUserTier(user.id);
      created++;
    } catch (error) {
      console.log(`Skipped user ${user.id} (already has tier)`);
    }
  }

  console.log(`✅ Created tier records for ${created} users`);
}

initializeTiers().catch(console.error);
```

Run it:
```bash
node scripts/init-user-tiers.js
```

Option B: Via API Endpoint (simpler for small user base)

Create a temporary endpoint:
```javascript
// app/api/admin/init-tiers/route.js

import { requireSuperAdmin } from '@/utils/auth';
import { createUserTier, ensureUserTiersTable } from '@/utils/tier-db';
import { query } from '@/utils/db';

export async function POST(request) {
  const user = await requireSuperAdmin(request);
  
  await ensureUserTiersTable();
  const result = await query('SELECT id FROM users');
  
  let created = 0;
  for (const u of result.rows) {
    try {
      await createUserTier(u.id);
      created++;
    } catch {}
  }

  return Response.json({ 
    message: `Created tiers for ${created} users` 
  });
}
```

Then call it once:
```bash
curl -X POST http://localhost:3000/api/admin/init-tiers \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

- [ ] All existing users now have tier records
- [ ] Verify in database: `SELECT COUNT(*) FROM user_tiers;` should match user count

## ✅ Phase 4: Create Admin Panel Page (10 minutes)

Create a page to manage tiers:

```javascript
// app/admin/tiers/page.jsx

import { requireSuperAdmin } from '@/utils/auth';
import { AdminTierManagement } from '@/components/AdminTierManagement';

export default async function AdminTiersPage() {
  const user = await requireSuperAdmin(new Request('http://localhost'));
  
  if (!user) {
    return <div>Unauthorized</div>;
  }

  return <AdminTierManagement />;
}
```

- [ ] Admin panel page created
- [ ] Test accessing `/admin/tiers` as admin

## ✅ Phase 5: Protect Your First Feature (15 minutes)

Let's protect the voice training feature as an example:

### Step 1: Protect the API

```javascript
// app/api/voice-training/train/route.js

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

  // Your existing voice training logic here
  const userId = tierCheck.userId;
  // ... rest of code
}
```

### Step 2: Protect the UI (optional)

```javascript
// In your voice training component

import { TierGate } from '@/lib/middleware-tier';
import { TIERS } from '@/utils/tier-config';

export function VoiceTrainingSection() {
  return (
    <TierGate requiredTier={TIERS.STARTER}>
      <VoiceTrainingUI />
    </TierGate>
  );
}
```

- [ ] Voice training API now requires STARTER tier
- [ ] Test with FREE tier account (should get error)
- [ ] Manually upgrade test account to STARTER in admin panel
- [ ] Verify voice training works now

## ✅ Phase 6: Protect Remaining Features (varies)

Based on your tier structure:

### Platform Connections (STARTER+)

```javascript
// app/api/platforms/add/route.js

import { requireTier, checkPlatformLimit } from '@/utils/tier-check';
import { TIERS } from '@/utils/tier-config';

export async function POST(request) {
  const tierCheck = await requireTier(request, TIERS.STARTER);
  if (tierCheck.error) return tierResponse(tierCheck);

  const { platform } = await request.json();
  const { allowed, limit } = await checkPlatformLimit(
    tierCheck.userId,
    currentCount
  );

  if (!allowed) {
    return Response.json(
      { error: `Max ${limit} platforms for your tier` },
      { status: 403 }
    );
  }

  // Add platform
}
```

- [ ] Platform connections check tier and limits
- [ ] Test FREE tier (max 1) vs STARTER (max 3)

### Post Scheduling (STARTER+, with rate limiting)

```javascript
// app/api/posts/schedule/route.js

import { requireTier, checkPostLimit } from '@/utils/tier-check';

export async function POST(request) {
  const tierCheck = await requireTier(request, TIERS.STARTER);
  if (tierCheck.error) return tierResponse(tierCheck);

  const weeklyCount = await getWeeklyPostCount(tierCheck.userId);
  const { allowed } = await checkPostLimit(tierCheck.userId, weeklyCount);

  if (!allowed) {
    return Response.json(
      { error: 'Weekly post limit reached' },
      { status: 403 }
    );
  }

  // Schedule post
}
```

- [ ] Post scheduling checks weekly limits per tier
- [ ] Test different tiers: STARTER (3/week), CORE (5/week), PREMIUM (7/week)

### Check-in Calls (CORE+)

```javascript
// In calendar/booking component

import { TierGate } from '@/lib/middleware-tier';
import { TIERS } from '@/utils/tier-config';

<TierGate requiredTier={TIERS.CORE}>
  <BookCheckInCallButton />
</TierGate>
```

- [ ] Check-in call booking only shows for CORE+
- [ ] FREE/STARTER tiers see "Upgrade to unlock" message

### Strategy Calls (PREMIUM only)

```javascript
// Similar to above

<TierGate requiredTier={TIERS.PREMIUM}>
  <BookStrategyCallButton />
</TierGate>
```

- [ ] Strategy calls only for PREMIUM tier
- [ ] Other tiers see upgrade prompt

### Priority Support (PREMIUM)

```javascript
// In support/help section

{hasTierAccess(TIERS.PREMIUM) && (
  <div>
    <PriorityChat />
    <PhoneSupport />
  </div>
)}
```

- [ ] Priority support channels visible only for PREMIUM
- [ ] Others see self-serve resources

## ✅ Phase 7: Create Upgrade Flow (20 minutes)

```javascript
// app/upgrade/page.jsx

import { PricingCards } from '@/components/PricingCards';
import { useTierCheck } from '@/lib/middleware-tier';
import { TIER_CONFIG, TIERS } from '@/utils/tier-config';

export default function UpgradePage() {
  const { tier } = useTierCheck();

  return (
    <div>
      <h1>Upgrade Your Plan</h1>
      <p>Current: {tier}</p>
      
      {/* Pricing cards for STARTER, CORE, PREMIUM */}
      {[TIERS.STARTER, TIERS.CORE, TIERS.PREMIUM].map(tierKey => (
        <TierCard 
          key={tierKey}
          tier={tierKey}
          config={TIER_CONFIG[tierKey]}
          onUpgrade={() => initiateUpgrade(tierKey)}
        />
      ))}
    </div>
  );
}

async function initiateUpgrade(tier) {
  // For now: manual admin upgrade
  alert(`Contact admin to upgrade to ${tier}`);
  
  // Later: integrate Stripe here
}
```

- [ ] `/upgrade` page created
- [ ] Shows all tiers and pricing
- [ ] "Upgrade" button redirects to setup instructions for now

## ✅ Phase 8: Testing Checklist (30 minutes)

### Test Each Tier

- [ ] **FREE Tier**
  - Can only connect 1 platform
  - Can only schedule 1 post/week
  - Cannot access voice training
  - Cannot schedule calls
  - Cannot see priority support

- [ ] **STARTER Tier**
  - Can connect up to 3 platforms (Facebook, Instagram, LinkedIn)
  - Can schedule up to 3 posts/week
  - Can access voice training
  - Cannot schedule calls
  - Cannot see strategy calls

- [ ] **CORE Tier**
  - Can connect up to 3 platforms
  - Can schedule up to 5 posts/week
  - Can access voice training
  - Can schedule check-in calls (monthly)
  - Cannot see strategy calls

- [ ] **PREMIUM Tier**
  - Can connect up to 5 platforms (all)
  - Can schedule daily posts (7/week)
  - Can access voice training
  - Can schedule check-in calls (weekly)
  - Can schedule strategy calls (monthly)
  - Can access priority support

### Test Admin Panel

- [ ] Can see all users
- [ ] Can upgrade user tier
- [ ] Can downgrade user tier
- [ ] Can cancel subscription
- [ ] Can see tier analytics

### Test Edge Cases

- [ ] User hits limit (e.g., max platforms) - gets error
- [ ] User cancels subscription - loses access
- [ ] Subscription expires - user reverts to FREE

## ✅ Phase 9: Setup Cron Job for Subscription Expiry (optional)

```javascript
// app/api/cron/check-subscriptions/route.js

import { getActiveSubscriptions, expireSubscription } from '@/utils/tier-db';

export async function GET(request) {
  const token = request.headers.get('authorization');
  if (token !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const subs = await getActiveSubscriptions();
  
  let expiredCount = 0;
  for (const sub of subs) {
    if (new Date(sub.next_billing_date) < now) {
      await expireSubscription(sub.user_id);
      expiredCount++;
    }
  }

  return Response.json({ 
    success: true,
    expiredCount 
  });
}
```

Set up a cron job (e.g., with EasyCron or Vercel):

```bash
# Call daily at 2 AM
GET /api/cron/check-subscriptions?token=YOUR_CRON_SECRET
```

- [ ] Cron job configured
- [ ] Runs daily to mark expired subscriptions

## ✅ Phase 10: Prepare for Stripe Integration (later)

When you're ready to add Stripe:

1. Create Stripe products for each tier:
   - prod_starter: £47/month
   - prod_core: £97/month
   - prod_premium: £197/month

2. Create setup fee products (one-off)

3. Create webhook handler at `/api/webhooks/stripe`

4. Update tier-db.js to store `stripe_customer_id` and `stripe_subscription_id`

5. Modify upgrade flow to redirect to Stripe checkout

No changes needed to current tier system - it's already prepared!

## 🎉 Done!

Your tier system is now live! Users on FREE tier, you manage upgrades manually.

When ready to accept payments:
1. Set up Stripe products
2. Add webhook handler
3. Update upgrade page to use Stripe checkout
4. Add `stripe_customer_id` to user_tiers

---

## 🚨 Troubleshooting

**"Table doesn't exist" error**
→ Re-run the SQL migration

**Users see wrong tier**
→ Check `subscription_status` is 'active' in database

**Admin updates aren't working**
→ Verify your admin token and user has `is_admin = true`

**Features showing for wrong tiers**
→ Check tier-check.js feature configurations match tier-config.js

---

## 📚 Quick Links

- [Setup Guide](./TIER_SYSTEM_SETUP.md) - Full documentation
- [Usage Examples](./TIER_USAGE_EXAMPLES.md) - Code patterns
- [Database Schema](./packages/frontend/database/migrations/001_create_user_tiers_table.sql) - SQL

**Questions?** Check the files' inline comments - they're heavily documented!
