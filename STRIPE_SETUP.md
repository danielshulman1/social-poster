# Stripe Setup Guide - 7-Day Free Trial + Auto-Charge on Day 8

## Overview

This guide sets up Stripe payments for Social Poster with:
- ✅ 7-day free trial (no card required initially)
- ✅ Automatic charge on day 8
- ✅ Three tiers: Starter (£27.99), Core (£47), Premium (£97)
- ✅ Automatic subscription management
- ✅ Webhook-based payment handling

## Files Created

### 1. Database Migration
**File:** `database/migrations/050_add_stripe_subscriptions.sql`

Adds subscription fields to users table:
- `stripe_customer_id` - Stripe customer identifier
- `stripe_subscription_id` - Stripe subscription identifier
- `subscription_tier` - Current tier (free/starter/core/premium)
- `subscription_status` - Status (trialing, active, canceled, etc)
- `trial_ends_at` - When 7-day trial ends
- `subscription_ends_at` - When subscription renews

### 2. Stripe Checkout API
**File:** `packages/social-feeds/src/app/api/stripe/checkout/route.ts`

Creates checkout sessions with 7-day trial:
- Endpoint: `POST /api/stripe/checkout`
- Accepts: `{ tier, email, userId }`
- Returns: Stripe checkout URL

### 3. Stripe Webhook Handler
**File:** `packages/social-feeds/src/app/api/stripe/webhook/route.ts`

Handles Stripe events:
- `customer.subscription.created` - Trial period starts
- `invoice.payment_succeeded` - Charge on day 8 (automatic)
- `invoice.payment_failed` - Handle payment failures
- `customer.subscription.updated` - Status changes
- `customer.subscription.deleted` - Cancellation

### 4. Subscription Utilities
**File:** `packages/social-feeds/src/lib/subscription.ts`

Helper functions:
- `getUserSubscription()` - Get user's subscription info
- `isSubscriptionActive()` - Check if trial or paid
- `getDaysUntilCharge()` - Days remaining in trial
- `getSubscriptionStatus()` - Human-readable status

## Setup Steps

### Step 1: Set Environment Variables

Add to `.env.local` or your hosting environment:

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Stripe Price IDs (from Stripe Dashboard)
STRIPE_PRICE_STARTER=price_xxxxxxxxxxxxx
STRIPE_PRICE_CORE=price_xxxxxxxxxxxxx
STRIPE_PRICE_PREMIUM=price_xxxxxxxxxxxxx

# App URLs
NEXT_PUBLIC_APP_URL=https://socialposter.easy-ai.co.uk
```

### Step 2: Create Stripe Products & Prices

1. Go to https://dashboard.stripe.com/products
2. Create 3 products:
   - **Starter** - £27.99/month
   - **Core** - £47/month
   - **Premium** - £97/month
3. For each product:
   - Set billing interval: Monthly
   - Copy the Price ID and add to env vars
   - These will NOT have trial period (we set it at checkout)

### Step 3: Create Webhook Endpoint

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. URL: `https://socialposter.easy-ai.co.uk/api/stripe/webhook`
4. Events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy webhook secret and add to env vars

### Step 4: Run Database Migration

```bash
psql -U postgres -h your_db_host your_db_name < database/migrations/050_add_stripe_subscriptions.sql
```

Or in Supabase console:
- Go to SQL Editor
- Run the migration SQL

### Step 5: Deploy

Push code to production:

```bash
git add .
git commit -m "feat: add Stripe subscription integration with 7-day trial"
git push origin main
```

## How It Works

### Day 0 - User Signs Up
1. User selects tier (Starter/Core/Premium)
2. Clicks "Start 7-Day Free Trial"
3. Redirected to Stripe checkout
4. **No payment method required**
5. Creates subscription with 7-day trial period
6. Webhook creates subscription record in DB
7. User has instant access to selected tier

### Day 1-7 - Trial Period
- User has full access to their tier
- No charge yet
- Can cancel anytime without payment
- Database tracks `trial_ends_at` date

### Day 8 - First Charge
- Stripe automatically charges payment method
- `invoice.payment_succeeded` webhook fires
- Database updates `subscription_status` to "active"
- User continues with access

### Ongoing - Monthly Renewal
- Stripe charges every 30 days
- Webhooks update database
- If payment fails, status becomes "payment_failed"
- User receives Stripe email reminders

### User Cancels
- `customer.subscription.deleted` webhook fires
- `subscription_status` becomes "canceled"
- `subscription_tier` resets to "free"
- User loses access after current period ends

## Testing

### Test in Development

1. Use Stripe test keys (sk_test_...)
2. Test card numbers: https://stripe.com/docs/testing
3. Card for success: `4242 4242 4242 4242`
4. Card for failure: `4000 0000 0000 0002`

### Test the Flow

```bash
# 1. Start local dev server
npm run dev

# 2. Go to signup at http://localhost:3000/signup

# 3. Create account with test tier

# 4. Click "Start 7-Day Free Trial"

# 5. Use test card 4242 4242 4242 4242

# 6. Check database for subscription records
```

### Test Webhook Locally

Use Stripe CLI:

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Authenticate
stripe login

# Forward webhooks to local app
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test event
stripe trigger customer.subscription.created
```

## Database Queries

### Check User's Subscription

```sql
SELECT 
  id,
  email,
  subscription_tier,
  subscription_status,
  trial_ends_at,
  subscription_ends_at
FROM users
WHERE id = 'user_id';
```

### Check Subscription Logs

```sql
SELECT * FROM subscription_logs
WHERE user_id = 'user_id'
ORDER BY created_at DESC;
```

### Find Users in Trial

```sql
SELECT id, email, trial_ends_at
FROM users
WHERE subscription_status = 'trialing'
  AND trial_ends_at > NOW();
```

### Find Expired Trials

```sql
SELECT id, email, trial_ends_at
FROM users
WHERE subscription_status = 'trialing'
  AND trial_ends_at < NOW();
```

## Frontend Integration

### In Signup Page

When user clicks "Start 7-Day Free Trial":

```typescript
const response = await fetch('/api/stripe/checkout', {
  method: 'POST',
  body: JSON.stringify({
    tier: selectedTier,
    email: userEmail,
    userId: userId,
  }),
});

const { url } = await response.json();
window.location.href = url; // Redirect to Stripe
```

### Check User's Status

```typescript
import { getUserSubscription, getSubscriptionStatus } from '@/lib/subscription';

const subscription = await getUserSubscription(userId);
const status = getSubscriptionStatus(subscription);

if (status.status === 'trialing') {
  console.log(`${status.daysLeft} days left in trial`);
} else if (status.status === 'active') {
  console.log('Subscription is active');
}
```

### Protect Features by Tier

```typescript
import { isSubscriptionActive } from '@/lib/subscription';

const canUseFeature = await isSubscriptionActive(userId);

if (!canUseFeature) {
  // Redirect to upgrade page
}
```

## Troubleshooting

### Webhook not receiving events?
- Check webhook URL is publicly accessible
- Verify webhook secret in env vars
- Check Stripe dashboard for failed deliveries
- Test with `stripe trigger` command

### Payment not charging on day 8?
- Verify product has monthly billing interval
- Check trial_period_days is set to 7
- Ensure payment method is on file
- Check webhook logs for `invoice.payment_succeeded`

### User not seeing active status?
- Check webhook received `invoice.payment_succeeded`
- Verify database update with SQL query above
- Check `subscription_logs` table for events

### Can't find Stripe keys?
- Go to https://dashboard.stripe.com/apikeys
- Copy Secret Key (starts with sk_live_ or sk_test_)
- Copy Publishable Key (starts with pk_live_ or pk_test_)

## Support

For issues:
1. Check Stripe dashboard logs
2. Check database logs in Supabase
3. Check server logs for errors
4. Test with Stripe CLI

## Next Steps

After setup is live:
1. Monitor webhook deliveries in Stripe
2. Test with real payment method
3. Set up email notifications for failures
4. Add dunning (retry) logic for failed payments
5. Monitor churn and trial-to-paid conversion rate
