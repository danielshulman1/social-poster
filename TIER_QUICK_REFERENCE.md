# Tier System - Quick Reference Card

## 🎯 At a Glance

| Tier | Price | Platforms | Posts/Week | Voice | Calls | Priority |
|------|-------|-----------|-----------|-------|-------|----------|
| **FREE** | Free | 1 | 1 | ❌ | ❌ | ❌ |
| **STARTER** | £47/mo | 3 | 3 | ✅ | ❌ | ❌ |
| **CORE** | £97/mo | 3 | 5 | ✅ | Check-in | ❌ |
| **PREMIUM** | £197/mo | 5 | Daily | ✅ | Check-in + Strategy | ✅ |

*Plus £47 setup fee for all paid tiers*

---

## 📦 Key Files

| File | Purpose |
|------|---------|
| `tier-config.js` | Tier definitions, prices, features |
| `tier-db.js` | Database CRUD operations |
| `tier-check.js` | Access control checks |
| `middleware-tier.js` | API & component protection |
| `AdminTierManagement.jsx` | Admin dashboard component |

---

## 🚀 Common Tasks

### Protect an API Endpoint
```javascript
import { requireTier } from '@/lib/middleware-tier';
import { TIERS } from '@/utils/tier-config';

export async function POST(request) {
  const check = await requireTier(request, TIERS.STARTER);
  if (check.error) return Response.json(...);
  
  const userId = check.userId;
  // Your logic here
}
```

### Protect a Component
```javascript
import { TierGate } from '@/lib/middleware-tier';
import { TIERS } from '@/utils/tier-config';

<TierGate requiredTier={TIERS.PREMIUM}>
  <PremiumFeature />
</TierGate>
```

### Check Feature Access
```javascript
import { useTierCheck } from '@/lib/middleware-tier';

const { hasTierAccess, tier } = useTierCheck();
if (hasTierAccess(TIERS.CORE)) {
  // Show call booking
}
```

### Check Limits
```javascript
import { checkPlatformLimit, checkPostLimit } from '@/utils/tier-check';

const { allowed, current, limit } = await checkPlatformLimit(userId, count);
if (!allowed) throw new Error(`Max ${limit} platforms`);
```

### Update User Tier (Admin)
```javascript
import { updateUserTier } from '@/utils/tier-db';

await updateUserTier(userId, 'premium', true); // true = setup fee paid
```

### Check Subscription Status
```javascript
import { isSubscriptionActive } from '@/utils/tier-db';

if (!await isSubscriptionActive(userId)) {
  // Subscription expired or cancelled
}
```

---

## 📊 Database Schema (Quick View)

```sql
user_tiers
├── id (primary key)
├── user_id (FK to users) ⭐ UNIQUE
├── current_tier (free|starter|core|premium)
├── setup_fee_paid (boolean)
├── subscription_status (active|cancelled|expired)
├── next_billing_date (for Stripe)
├── subscription_start_date
├── created_at
└── updated_at
```

---

## 🔌 API Endpoints

### Public
- `GET /api/auth/tier-check` - Get current user's tier

### Admin Only
- `GET /api/admin/users/tier?userId=123` - Get user's tier
- `POST /api/admin/users/tier` - Update tier
- `POST /api/admin/users/tier/cancel` - Cancel subscription
- `GET /api/admin/tiers/analytics` - Tier stats

---

## 🎛️ Tier Configuration (Reference)

```javascript
TIER_CONFIG = {
  free: {
    monthlyPrice: 0,
    setupFee: 0,
    features: {
      maxPlatforms: 1,
      postsPerWeek: 1,
      voiceTraining: false,
      onboardingSession: false,
      checkInCalls: false,
      prioritySupport: false,
      strategyCalls: false,
    }
  },
  starter: {
    monthlyPrice: 4700, // pence
    setupFee: 4700,
    features: {
      maxPlatforms: 3,
      postsPerWeek: 3,
      voiceTraining: true,
      onboardingSession: true,
      // ... rest false
    }
  },
  // core and premium follow same pattern
}
```

---

## ⚙️ Feature Bits

Use these in conditions:

```javascript
// Features that are boolean
voiceTraining
onboardingSession
checkInCalls
prioritySupport
strategyCalls

// Features that are numeric
maxPlatforms
postsPerWeek
checkInCallsPerMonth (CORE=1, PREMIUM=4)
strategyCallsPerMonth (PREMIUM=1)
```

---

## 🛡️ Security Essentials

✅ **Always check tier server-side** before sensitive operations
✅ **Verify subscription_status = 'active'** not just tier
✅ **Use `requireTier()` middleware** on APIs
✅ **Log tier changes** for audit trail
✅ **Validate limits** before allowing actions

❌ Never trust client-side tier checks
❌ Don't expose feature flags in frontend code
❌ Don't hard-code user IDs

---

## 🔄 Subscription Lifecycle

```
FREE (default)
    ↓ [user upgrades]
STARTER (subscription_status='active', next_billing_date=future)
    ↓ [next_billing_date passes, no payment]
EXPIRED (subscription_status='expired', tier reverts to FREE)
    ↓ [user pays again]
STARTER (reactivated)
    ↓ [user cancels]
CANCELLED (subscription_status='cancelled', tier reverts to FREE)
    ↓ [user reactivates]
STARTER (reactivated)
```

---

## 🐛 Debugging

**User says tier doesn't match admin panel:**
```sql
-- Check database
SELECT current_tier, subscription_status FROM user_tiers WHERE user_id = 123;

-- Verify subscription is active
SELECT * FROM user_tiers WHERE user_id = 123 AND subscription_status = 'active';
```

**API returning "feature not available":**
```javascript
// Check what tier they actually have
const tierInfo = await getUserTier(userId);
console.log('Tier:', tierInfo.current_tier);
console.log('Status:', tierInfo.subscription_status);
```

**Admin update not working:**
```bash
# Check admin token
curl -X POST /api/admin/users/tier \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": 123, "newTier": "core"}'

# Check if user has is_admin=true
SELECT is_admin FROM org_members WHERE user_id = YOUR_ADMIN_ID;
```

---

## 📈 Next Steps: Stripe Integration

When ready to accept payments:

1. **Create Stripe products** in Stripe dashboard
   - Product: "Starter Plan" → Price: £47/month (prod_starter)
   - Product: "Core Plan" → Price: £97/month (prod_core)
   - Product: "Premium Plan" → Price: £197/month (prod_premium)

2. **Add Stripe fields to user_tiers**
   ```sql
   ALTER TABLE user_tiers ADD COLUMN stripe_customer_id VARCHAR(255);
   ALTER TABLE user_tiers ADD COLUMN stripe_subscription_id VARCHAR(255);
   ```

3. **Create webhook handler** at `/api/webhooks/stripe`
   - Listen for `customer.subscription.updated`
   - Listen for `customer.subscription.deleted`
   - Call `updateUserTier()` / `cancelUserSubscription()`

4. **Update upgrade flow** to redirect to Stripe checkout

**Current tier system needs NO changes for this!** It's already payment-ready.

---

## 📞 Helper Functions Cheat Sheet

```javascript
// Get info
getUserTier(userId)
getUserTierInfo(userId)
getTierConfig(tier)
isSubscriptionActive(userId)

// Check access
hasTierFeature(tier, featureName)
canAccessFeature(tier, featureName)
needsUpgrade(userId, requiredTier)

// Check limits
checkFeatureAccess(userId, featureName)
checkPlatformLimit(userId, count)
checkPostLimit(userId, count)

// Update
updateUserTier(userId, newTier, setupFeePaid)
createUserTier(userId)
cancelUserSubscription(userId)
reactivateSubscription(userId)
expireSubscription(userId)

// Analytics
getTierAnalytics()
getActiveSubscriptions()

// Format
formatPrice(penceAmount) // "47.00"
getTierFeaturesForDisplay(tier)
```

---

## 🎯 Tier Upgrade Decision Tree

```
User wants feature X?
├─ Does their current tier have it?
│  ├─ YES → Allow (check subscription status)
│  └─ NO → Redirect to /upgrade
├─ Is subscription active?
│  ├─ YES → Allow
│  └─ NO → Show "Subscription expired" message
└─ Have they hit usage limits?
   ├─ YES → Show "Limit reached" message
   └─ NO → Allow
```

---

## 📋 Testing Checklist

When adding a new feature with tier restrictions:

- [ ] Create API endpoint with `requireTier()`
- [ ] Add to tier-config.js features
- [ ] Test FREE tier gets 403
- [ ] Test required tier gets 200
- [ ] Test admin can upgrade
- [ ] Test limits are enforced
- [ ] Test subscription expiry blocks access
- [ ] Test cancellation reverts tier

---

**Need full docs?** See [TIER_SYSTEM_SETUP.md](./TIER_SYSTEM_SETUP.md)

**Looking for code examples?** See [TIER_USAGE_EXAMPLES.md](./TIER_USAGE_EXAMPLES.md)

**Setting up from scratch?** Follow [TIER_INTEGRATION_CHECKLIST.md](./TIER_INTEGRATION_CHECKLIST.md)
