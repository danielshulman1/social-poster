# Tier System Architecture

Visual guide showing how all components work together.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Next.js App                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            React Components / Pages                  │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  • Dashboard                                         │  │
│  │  • Voice Training (STARTER+)                        │  │
│  │  • Platform Manager (STARTER+)                      │  │
│  │  • Call Scheduler (CORE+)                          │  │
│  │  • Strategy Calls (PREMIUM)                        │  │
│  │  • AdminTierManagement                             │  │
│  └──────────────────────────────────────────────────────┘  │
│           ↓                            ↓                    │
│  ┌────────────────────────┐  ┌────────────────────────┐    │
│  │  useTierCheck Hook     │  │  API Calls             │    │
│  │  TierGate Component    │  │  (POST/GET)            │    │
│  └────────────────────────┘  └────────────────────────┘    │
│           ↓                            ↓                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Middleware Layer                          │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  middleware-tier.js                                 │  │
│  │  ├── requireTier() - API protection                │  │
│  │  ├── useTierCheck() - Client hook                 │  │
│  │  └── TierGate - Component wrapper                │  │
│  └──────────────────────────────────────────────────────┘  │
│           ↓                                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            API Routes                               │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  • /api/auth/tier-check                            │  │
│  │  • /api/admin/users/tier                           │  │
│  │  • /api/admin/users/tier/cancel                    │  │
│  │  • /api/admin/tiers/analytics                      │  │
│  │  • [Your custom APIs with tier checks]             │  │
│  └──────────────────────────────────────────────────────┘  │
│           ↓                                                  │
└─────────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────────┐
│            Tier Logic Layer (utils/)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │  tier-config.js  │  │  tier-check.js   │               │
│  ├──────────────────┤  ├──────────────────┤               │
│  │ • TIERS (const) │ │ • checkFeature() │               │
│  │ • TIER_CONFIG   │ │ • checkLimit()   │               │
│  │ • getTierLimit()│ │ • needsUpgrade() │               │
│  │ • formatPrice() │ │ • getUserTier    │               │
│  └──────────────────┘  │   Info()        │               │
│                        └──────────────────┘               │
│           │                      │                        │
│           └──────────┬───────────┘                        │
│                      ↓                                    │
│           ┌──────────────────────┐                       │
│           │   tier-db.js         │                       │
│           ├──────────────────────┤                       │
│           │ • getUserTier()      │                       │
│           │ • updateUserTier()   │                       │
│           │ • getTierAnalytics() │                       │
│           │ • checkSub Status()  │                       │
│           └──────────────────────┘                       │
│                      ↓                                    │
└─────────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────────┐
│         Supabase PostgreSQL Database                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  users (existing)          user_tiers (NEW)                │
│  ├── id                    ├── id                          │
│  ├── email                 ├── user_id (FK)                │
│  ├── password_hash         ├── current_tier                │
│  └── ...                   ├── subscription_status         │
│                            ├── next_billing_date           │
│  org_members (existing)    ├── setup_fee_paid             │
│  ├── user_id               └── ...                         │
│  ├── org_id                                               │
│  ├── is_admin                                             │
│  └── ...                                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow: User Upgrade

```
Admin clicks "Upgrade User"
        ↓
┌─────────────────────────────────┐
│  AdminTierManagement Component  │
│  (frontend/admin/tiers/page)    │
└─────────────────────────────────┘
        ↓ (POST with user_id, new_tier)
┌─────────────────────────────────────────────┐
│  /api/admin/users/tier/route.js             │
│  1. requireAdmin() - verify authorization   │
│  2. Validate tier name                      │
│  3. Call updateUserTier()                   │
└─────────────────────────────────────────────┘
        ↓ (call database function)
┌─────────────────────────────────────────────┐
│  tier-db.js: updateUserTier()               │
│  1. Calculate next billing date             │
│  2. UPDATE user_tiers SET...                │
│  3. Return updated row                      │
└─────────────────────────────────────────────┘
        ↓ (SQL UPDATE)
┌─────────────────────────────────────────────┐
│  Database: user_tiers table                 │
│  Updates: current_tier, next_billing_date   │
│           subscription_status = 'active'    │
└─────────────────────────────────────────────┘
        ↓ (return success)
Response sent to frontend
        ↓
Admin sees success message + updated user
        ↓
User now has new tier
        ↓ (next time they access a feature)
tier-check.js validates new tier
        ↓
Feature now accessible (or previously inaccessible features now blocked)
```

---

## 🔐 Data Flow: Feature Protection

```
User tries to access feature X (e.g., schedule a post)
        ↓
┌────────────────────────────────────────┐
│  Frontend Component / Page             │
│  <TierGate requiredTier={TIERS.CORE}> │
│    <FeatureComponent />                │
│  </TierGate>                           │
└────────────────────────────────────────┘
        ↓ (useEffect on component mount)
Call /api/auth/tier-check with JWT token
        ↓
┌──────────────────────────────────────┐
│  /api/auth/tier-check/route.js       │
│  1. Check JWT token validity         │
│  2. Call getUserTierInfo(user_id)    │
│  3. Return tier & subscription info  │
└──────────────────────────────────────┘
        ↓ (in middleware-tier.js)
useTierCheck() hook runs:
  1. Checks hasTierAccess(requiredTier)
  2. Compares user's tier level vs required
  3. Checks subscription_status = 'active'
        ↓
┌────────────────────────────────────────┐
│ User meets requirements?               │
├────────────────────────────────────────┤
│ YES ✓                   │ NO ✗         │
│ Render component        │ Render       │
│ User can use feature    │ upgrade      │
│                         │ prompt       │
└────────────────────────────────────────┘
```

---

## 🛡️ Data Flow: API Protection

```
Frontend POST to /api/posts/schedule
{
  token: "eyJhb...",
  content: "My post",
  platforms: ["facebook", "instagram"]
}
        ↓
┌────────────────────────────────────────┐
│  /api/posts/schedule/route.js          │
│  const check = await requireTier(...) │
└────────────────────────────────────────┘
        ↓ (inside requireTier middleware)
┌────────────────────────────────────────────────┐
│  middleware-tier.js: requireTier()             │
│  1. Extract token from Authorization header   │
│  2. JWT decode (verify signature)             │
│  3. Extract userId from token                 │
│  4. Call getUserTier(userId)                  │
│  5. Compare tier levels vs required           │
│  6. Check subscription status                 │
└────────────────────────────────────────────────┘
        ↓ (in tier-db.js)
SELECT * FROM user_tiers WHERE user_id = ?
        ↓
Database returns tier info
        ↓
┌────────────────────────────────────────────┐
│ Check tier authorization:                  │
│                                            │
│ User tier: PREMIUM (level=3)               │
│ Required: STARTER (level=1)                │
│                                            │
│ 3 >= 1? YES ✓                             │
│ subscription_status = 'active'? YES ✓    │
├────────────────────────────────────────────┤
│ Return: { error: false, userId, tier }    │
└────────────────────────────────────────────┘
        ↓ (back in route handler)
Proceed with actual feature logic
        ↓
Check post count limits:
  const { allowed } = await checkPostLimit(...)
        ↓
If allowed: Schedule post, return 200
If denied: Return 403 with limit info
```

---

## 📊 Tier Comparison Matrix

```
                FREE      STARTER    CORE      PREMIUM
Price           -         £47/mo    £97/mo    £197/mo
Setup Fee       -         £47       £47       £47
────────────────────────────────────────────────────────
Platforms       1         3         3         5
Posts/week      1         3         5         7 (daily)
────────────────────────────────────────────────────────
Voice Training  ✗         ✓         ✓         ✓
Onboarding      ✗         ✓         ✓         ✓
Check-in Calls  ✗         ✗         ✓(1x/mo) ✓(1x/week)
Strategy Calls  ✗         ✗         ✗         ✓(1x/mo)
Priority Supp.  ✗         ✗         ✗         ✓
────────────────────────────────────────────────────────
canAccess?      Limited   Moderate  Good      Full
```

---

## 🔄 Subscription Status Diagram

```
                    ┌──────────────────┐
                    │   NEW USER       │
                    │  (no tier yet)   │
                    └──────────────────┘
                           ↓
                    ┌──────────────────┐
                    │  Initialize      │
                    │  Tier = FREE     │
                    │  Status = active │
                    └──────────────────┘
                           ↓
              ┌────────────┴────────────┐
              ↓                        ↓
      ┌──────────────┐        ┌──────────────┐
      │ USER UPGRADES│        │ STAYS FREE   │
      │              │        │              │
      │ admin CLI    │        │ (features    │
      │ or Stripe    │        │  limited)    │
      └──────────────┘        └──────────────┘
              ↓
      ┌──────────────────────────────────────┐
      │  Status = 'active'                   │
      │  Tier = STARTER/CORE/PREMIUM         │
      │  Next_Billing_Date = 1 month ahead   │
      └──────────────────────────────────────┘
              ↓
      ┌───────┴───────────────────────────┐
      ↓                                   ↓
┌───────────────┐              ┌──────────────────┐
│ USER CANCELS  │              │ PAYMENT DUE      │
│               │              │ (automatic via   │
│ Admin or      │              │  cron job)       │
│ user-facing   │              │                  │
│ cancel button │              └──────────────────┘
└───────────────┘                       ↓
      ↓              ┌───────────────────┴────────┐
      │              ↓                            ↓
      │    ┌──────────────────┐      ┌──────────────┐
      │    │ PAYMENT SUCCESS  │      │ PAYMENT FAIL │
      │    │                  │      │              │
      │    │ Status = 'active'│      │ Status =     │
      │    │ Tier unchanged   │      │ 'expired'    │
      │    │ Renew 1 mo ahead │      │ Tier reverts │
      │    │                  │      │ to FREE      │
      │    └──────────────────┘      └──────────────┘
      │              ↑                       ↓
      │              └───────────┬───────────┘
      │                          ↓
      │              ┌──────────────────────┐
      │              │ SEND PAYMENT FAILED  │
      │              │ EMAIL TO USER        │
      │              └──────────────────────┘
      ↓
┌────────────────────────┐
│ Status = 'cancelled'   │
│ Tier reverts to FREE   │
│                        │
│ User can reactivate    │
│ by upgrading again     │
└────────────────────────┘
      ↓
  Can rejoin any tier
  (via admin or Stripe)
```

---

## 🔌 Stripe Integration Point

```
Current Setup:
┌──────────────┐
│ Admin Panel  │ ← Manual tier updates
└──────────────┘
      ↓
┌──────────────────────┐
│ tier-db.updateTier() │
└──────────────────────┘
      ↓
┌──────────────┐
│ Database     │
└──────────────┘


With Stripe Integration:
┌──────────────┐     ┌──────────────┐
│ Admin Panel  │     │ Stripe UI    │ ← User upgrades via checkout
└──────────────┘     └──────────────┘
      ↓                     ↓
      └──────────┬──────────┘
                 ↓
     ┌───────────────────────┐
     │ Webhook Received      │
     │ /api/webhooks/stripe  │
     └───────────────────────┘
                 ↓
     ┌───────────────────────┐
     │ Parse Stripe Event    │
     │ (subscription updated)│
     └───────────────────────┘
                 ↓
     ┌───────────────────────┐
     │ Get user from         │
     │ stripe_customer_id    │
     └───────────────────────┘
                 ↓
     ┌───────────────────────┐
     │ tier-db.updateTier()  │
     │ (same function!)      │
     └───────────────────────┘
                 ↓
        ┌──────────────┐
        │ Database     │
        └──────────────┘

✓ No code changes needed!
✓ Same database operations
✓ Just different trigger (webhook vs admin)
```

---

## 📁 File Dependency Map

```
tier-config.js (definitions)
├─ tier-check.js
├─ tier-db.js
├─ middleware-tier.js
├─ AdminTierManagement.jsx
└─ All API routes

tier-db.js (database)
├─ Depends on: auth.js (for user context)
├─ Used by: tier-check.js
├─ Used by: middleware-tier.js
└─ Used by: All API routes

tier-check.js (logic)
├─ Depends on: tier-config.js
├─ Depends on: tier-db.js
├─ Used by: middleware-tier.js
└─ Used by: API routes (custom features)

middleware-tier.js (protection)
├─ Depends on: tier-check.js
├─ Depends on: tier-config.js
└─ Used by: React components
└─ Used by: API routes

API Routes (endpoints)
├─ All depend on: middleware-tier.js OR tier-db.js
├─ tier-check.js (optional, for detailed checks)
└─ Create responses for frontend

Frontend Components
├─ useTierCheck() from middleware-tier.js
├─ TierGate from middleware-tier.js
├─ AdminTierManagement component
└─ Custom components that call APIs

Database (single source of truth)
└─ user_tiers table
   ├─ Created by: migration SQL
   ├─ Read by: tier-db.js
   └─ Modified by: tier-db.js functions
```

---

## 🔐 Security Boundaries

```
┌─────────────────────────────────────────────────┐
│ PUBLIC (No Auth Required)                       │
├─────────────────────────────────────────────────┤
│ • GET /api/auth/tier-check        [LOGIN REQUIRED] │
│   (returns current user's tier)                 │
│                                                 │
│ • GET /upgrade (marketing page)                 │
│   (anyone can view)                            │
└─────────────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│ PROTECTED (User Login Required)                 │
├─────────────────────────────────────────────────┤
│ • All feature endpoints                         │
│   (check tier before allowing)                 │
│                                                 │
│ • /api/posts/schedule                          │
│   /api/voice-training/train                    │
│   /api/platforms/add                           │
│   etc.                                         │
└─────────────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│ ADMIN ONLY (Admin Token Required)               │
├─────────────────────────────────────────────────┤
│ • GET /api/admin/users/tier                    │
│ • POST /api/admin/users/tier                   │
│ • POST /api/admin/users/tier/cancel            │
│ • GET /api/admin/tiers/analytics               │
│                                                 │
│ Checks: requireAdmin()                         │
│ (verifies is_admin = true)                     │
└─────────────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│ SUPER ADMIN ONLY (Rare Operations)              │
├─────────────────────────────────────────────────┤
│ • System-wide settings changes                 │
│ • Initialize tier records                      │
│                                                 │
│ Checks: requireSuperAdmin()                    │
│ (verifies is_superadmin = true)                │
└─────────────────────────────────────────────────┘
```

---

## 🧪 Testing Data Flow

```
CREATE TEST USER
      ↓
┌──────────────────────┐
│ tier: FREE           │
│ status: active       │
│ no billing date      │
└──────────────────────┘
      ↓
TRY STARTER FEATURE
      ↓
  ❌ Blocked (tier too low)
      ↓
ADMIN UPGRADES TO STARTER
      ↓
┌──────────────────────────────────┐
│ tier: STARTER                    │
│ status: active                   │
│ next_billing: 1 month from now   │
└──────────────────────────────────┘
      ↓
TRY STARTER FEATURE
      ↓
  ✅ Allowed (check passed)
      ↓
TRY CORE FEATURE
      ↓
  ❌ Blocked (tier still STARTER)
      ↓
ADMIN DOWNGRADES TO FREE
      ↓
┌──────────────────────┐
│ tier: FREE           │
│ status: active       │
│ no billing date      │
└──────────────────────┘
      ↓
TRY STARTER FEATURE
      ↓
  ❌ Blocked (reverted to FREE)
```

---

This architecture ensures:

✅ **Separation of Concerns** - Config, logic, database, APIs separate
✅ **Easy Testing** - Mock each layer independently
✅ **Scalability** - Add tiers without refactoring
✅ **Security** - Clear authorization boundaries
✅ **Maintainability** - Clear data flows
✅ **Flexibility** - Easy to extend (Stripe, webhooks, etc)
