# Stripe Integration Hooks & Usage

## Hook 1: Initiate Checkout (Signup Page)

**Location:** `packages/social-feeds/src/app/(auth)/signup/page.tsx`

**Where to add (in form submit):**

```typescript
// After user selects tier and agrees to terms
const handlePaymentCheckout = async (tier: string, email: string, userId: string) => {
  try {
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tier,
        email,
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error('Checkout failed');
    }

    const { url } = await response.json();
    
    // Redirect to Stripe checkout
    window.location.href = url;
  } catch (error) {
    console.error('Checkout error:', error);
    toast.error('Failed to start checkout');
  }
};
```

**Already implemented:** ✅ The button already calls this through the form submit

---

## Hook 2: Check User Subscription Status (Dashboard/Settings)

**Location:** Any page that needs subscription info

```typescript
import { getUserSubscription, getSubscriptionStatus } from '@/lib/subscription';

async function checkUserStatus(userId: string) {
  const subscription = await getUserSubscription(userId);
  
  if (!subscription) {
    return { status: 'free', message: 'Free plan' };
  }

  const status = getSubscriptionStatus(subscription);
  
  return {
    tier: subscription.subscription_tier,
    status: status.status,
    message: status.message,
    daysLeft: status.daysLeft,
    trialEndsAt: subscription.trial_ends_at,
  };
}
```

**Usage in component:**

```typescript
const userStatus = await checkUserStatus(userId);

if (userStatus.status === 'trialing') {
  console.log(`User has ${userStatus.daysLeft} days left in trial`);
}
```

---

## Hook 3: Check Tier Access (Feature Gates)

**Location:** Anywhere you need to check if user can access a feature

```typescript
import { getUserTierAccess, canAccessFeature } from '@/lib/subscription';

async function checkFeatureAccess(userId: string, requiredTier: 'starter' | 'core' | 'premium') {
  const userTier = await getUserTierAccess(userId);
  
  return canAccessFeature(userTier, requiredTier);
}
```

**Usage examples:**

```typescript
// Check if user can access Core features
const hasCore = await checkFeatureAccess(userId, 'core');
if (!hasCore) {
  return <UpgradePrompt tier="core" />;
}

// Check if user can access Premium features
const hasPremium = await checkFeatureAccess(userId, 'premium');
if (!hasPremium) {
  return <UpgradePrompt tier="premium" />;
}
```

---

## Hook 4: Add Subscription Settings to Page

**Location:** Your settings/account page

```typescript
import { SubscriptionSettings } from '@/components/subscription-settings';

export default function SettingsPage({ userId }: { userId: string }) {
  return (
    <div className="space-y-6">
      <h1>Account Settings</h1>
      
      {/* Add this component */}
      <SubscriptionSettings userId={userId} />
      
      {/* Rest of settings */}
    </div>
  );
}
```

**What it provides:**
- View current tier
- See trial/renewal dates
- **Cancel subscription button**
- Auto-charge information

---

## Hook 5: Handle Post-Checkout Redirect

**Location:** `packages/social-feeds/src/app/dashboard/page.tsx` (or wherever users land after checkout)

```typescript
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const tier = searchParams.get('tier');

    if (paymentStatus === 'success') {
      toast.success(`Welcome! Your ${tier} trial is active for 7 days.`);
      // Optionally redirect to onboarding or dashboard
    } else if (paymentStatus === 'cancelled') {
      toast.error('Checkout cancelled. Please try again.');
    }
  }, [searchParams]);

  return (
    <div>
      {/* Your dashboard content */}
    </div>
  );
}
```

---

## Hook 6: Protect Routes by Tier

**Location:** Middleware or route handlers

```typescript
// For API routes that require a specific tier
import { getUserTierAccess, canAccessFeature } from '@/lib/subscription';

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  
  // Check if user has Core access
  const userTier = await getUserTierAccess(userId);
  
  if (!canAccessFeature(userTier, 'core')) {
    return NextResponse.json(
      { error: 'Upgrade to Core to use this feature' },
      { status: 403 }
    );
  }

  // Process request for Core+ users
}
```

---

## Hook 7: Monitor Subscription Events

**Location:** `packages/social-feeds/src/app/api/stripe/webhook/route.ts` (already implemented ✅)

**Webhook events handled:**
- `customer.subscription.created` → Trial starts
- `customer.subscription.updated` → Status changes
- `customer.subscription.deleted` → User cancelled
- `invoice.payment_succeeded` → Charged on day 8
- `invoice.payment_failed` → Payment failed

**Already implemented:** ✅ No additional code needed

---

## Hook 8: Cancel Subscription from App

**Location:** When user clicks "Cancel Subscription" button

```typescript
async function cancelSubscription(userId: string) {
  try {
    const response = await fetch('/api/stripe/cancel-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const data = await response.json();
    
    toast.success(
      `Subscription cancelled. Access until ${new Date(data.currentPeriodEnd * 1000).toLocaleDateString()}`
    );
    
    // Refresh subscription status
    window.location.reload();
  } catch (error) {
    toast.error('Failed to cancel subscription');
  }
}
```

**Already implemented:** ✅ In `SubscriptionSettings` component

---

## Summary: All API Endpoints

### 1. **POST** `/api/stripe/checkout`
Create checkout session with 7-day trial
```json
{
  "tier": "starter|core|premium",
  "email": "user@example.com",
  "userId": "uuid"
}
```

### 2. **POST** `/api/stripe/cancel-subscription`
Cancel user's subscription
```json
{
  "userId": "uuid"
}
```

### 3. **GET** `/api/stripe/get-subscription?userId=uuid`
Fetch user's subscription info

### 4. **POST** `/api/stripe/webhook`
Receive Stripe events (automatic - no direct calls needed)

---

## Complete Integration Flow

```
User Signup
    ↓
Select Tier → Click "Start Trial"
    ↓
POST /api/stripe/checkout
    ↓
Stripe Checkout (payment + billing address)
    ↓
User confirms → Redirect to dashboard
    ↓
Webhook: customer.subscription.created
    ↓
Database: subscription_status = "trialing"
    ↓
Day 1-7: User has full tier access
    ↓
Day 8: Stripe auto-charges
    ↓
Webhook: invoice.payment_succeeded
    ↓
Database: subscription_status = "active"
    ↓
User continues monthly
    ↓
(Optional) User clicks "Cancel"
    ↓
POST /api/stripe/cancel-subscription
    ↓
Database: subscription_status = "canceled"
    ↓
Access maintained until period end
```

---

## Testing Endpoints Locally

### Test Checkout
```bash
curl -X POST http://localhost:3000/api/stripe/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "core",
    "email": "test@example.com",
    "userId": "user-123"
  }'
```

### Test Get Subscription
```bash
curl http://localhost:3000/api/stripe/get-subscription?userId=user-123
```

### Test Cancel Subscription
```bash
curl -X POST http://localhost:3000/api/stripe/cancel-subscription \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-123"}'
```

### Test Webhook Locally
```bash
# Using Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook

# In another terminal, trigger test event
stripe trigger customer.subscription.created
```

---

## Ready to Deploy

1. ✅ All hooks implemented
2. ✅ All endpoints created
3. ✅ Database migration ready
4. ✅ Webhook handler ready
5. ⏳ Awaiting: Stripe products & environment variables
