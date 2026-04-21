# ✅ Stripe Deployment Checklist

## Status: READY FOR PRODUCTION

All Stripe integration is complete and ready to deploy!

---

## What's Already Done ✅

### Code
- ✅ Stripe checkout endpoint (`/api/stripe/checkout`)
- ✅ Webhook handler for auto-charge on day 8 (`/api/stripe/webhook`)
- ✅ Cancellation API (`/api/stripe/cancel-subscription`)
- ✅ Subscription status checking (`/api/stripe/get-subscription`)
- ✅ SubscriptionSettings component for settings pages
- ✅ Utility functions for tier access checking
- ✅ Database migration ready

### Products & Pricing ✅
- ✅ Starter: £27.99/month - `price_1TOg7zL5hf1GNiJP7YeJa8vB`
- ✅ Core: £47.00/month - `price_1TOg8HL5hf1GNiJPjOlW0UPz`
- ✅ Premium: £97.00/month - `price_1TOg92L5hf1GNiJP4oBFAfFD`

### Keys & Webhooks ✅
- ✅ Public Key: `pk_live_51S5PRGL5hf1GNiJPyL3kjSyhmO6GIwKX7KeFH6vaFpQVFG72QvTAYeTJ5NvyhWNP5iyxJnlRphwSD4t4IB2ulaX200qyhFh69F`
- ✅ Webhook Secrets: Both configured

---

## One-Time Setup Required

### Step 1: Get Your Secret Key
1. Go to https://dashboard.stripe.com/apikeys
2. Find "Secret Key" section
3. Copy the `sk_live_...` key
4. **SAVE IT** - you only need this once

### Step 2: Add to Hosting Platform

**For Vercel:**
1. Go to https://vercel.com/dashboard
2. Select your project → Settings → Environment Variables
3. Add new variable: `STRIPE_SECRET_KEY`
4. Paste your secret key
5. Click Save
6. Trigger a redeploy (git push or manual)

**For Other Platforms (Railway, Heroku, etc):**
1. Go to your platform's environment variables section
2. Add `STRIPE_SECRET_KEY` with the full sk_live_ key
3. Deploy

### Step 3: Set Other Variables (if not already set)

Add these if not already configured:
```
STRIPE_PRICE_STARTER=price_1TOg7zL5hf1GNiJP7YeJa8vB
STRIPE_PRICE_CORE=price_1TOg8HL5hf1GNiJPjOlW0UPz
STRIPE_PRICE_PREMIUM=price_1TOg92L5hf1GNiJP4oBFAfFD
STRIPE_WEBHOOK_SECRET=whsec_WvmlYRqrXC3hBdrulesWsDgeNL06lrQL
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51S5PRGL5hf1GNiJPyL3kjSyhmO6GIwKX7KeFH6vaFpQVFG72QvTAYeTJ5NvyhWNP5iyxJnlRphwSD4t4IB2ulaX200qyhFh69F
NEXT_PUBLIC_APP_URL=https://socialposter.easy-ai.co.uk
```

### Step 4: Database Migration

Run this SQL in your Supabase/PostgreSQL database:

```bash
psql -U postgres -h your_host your_database < database/migrations/050_add_stripe_subscriptions.sql
```

Or in Supabase Console → SQL Editor:
```sql
-- Paste contents of: database/migrations/050_add_stripe_subscriptions.sql
```

---

## Testing (Before Full Launch)

### Test 1: Checkout Flow
1. Go to https://socialposter.easy-ai.co.uk/signup
2. Select a tier
3. Click "Start Free Trial (Payment Required)"
4. Should redirect to Stripe checkout
5. Use test card: `4242 4242 4242 4242`
6. Complete checkout
7. Should redirect back to `/dashboard?payment=success`

### Test 2: Webhook
1. Check Stripe dashboard → Webhooks
2. Click your webhook endpoint
3. Look for events in "Events" tab
4. Should see `customer.subscription.created` event
5. Check Status: ✅ OK

### Test 3: Subscription in Database
```sql
SELECT 
  email,
  subscription_tier,
  subscription_status,
  trial_ends_at,
  created_at
FROM users
WHERE subscription_status IN ('trialing', 'active')
ORDER BY created_at DESC;
```

Should show your test user with:
- `subscription_tier`: `starter`, `core`, or `premium`
- `subscription_status`: `trialing`
- `trial_ends_at`: 7 days from now

### Test 4: Settings Page
1. Go to `/settings` or wherever you added `<SubscriptionSettings>`
2. Should show:
   - Current tier
   - "Free [Tier] Trial until [Date]"
   - Cancel Subscription button

---

## Day 8 - First Charge

### What Happens Automatically:
1. On day 8 at ~midnight UTC, Stripe charges the card
2. `invoice.payment_succeeded` webhook fires
3. Database updates `subscription_status` to `active`
4. User continues with full access

### Monitor the First Charge:
1. Check Stripe → Invoices
2. Look for test customer
3. Status should be "Paid"
4. Check database again - status should be `active`

---

## Production Checklist

- [ ] STRIPE_SECRET_KEY added to hosting platform
- [ ] All STRIPE_PRICE_* variables configured
- [ ] STRIPE_WEBHOOK_SECRET configured
- [ ] Database migration run
- [ ] Test signup flow works
- [ ] Test webhook is receiving events
- [ ] SubscriptionSettings component added to settings page
- [ ] Test cancellation flow works
- [ ] No errors in logs
- [ ] Verified day 8 charge will work (check Stripe test invoice)

---

## Security Notes

### Never Do This:
- ❌ Never commit `STRIPE_SECRET_KEY` to git
- ❌ Never share your secret key
- ❌ Never use test keys in production
- ❌ Never hardcode keys in code

### Safe Practices:
- ✅ Only add keys to hosting platform environment variables
- ✅ Use different keys for test vs production
- ✅ Rotate keys periodically
- ✅ Monitor webhook events in Stripe dashboard

---

## Support & Debugging

### Webhook not receiving events?
1. Check Stripe → Webhooks
2. Click endpoint → "Events" tab
3. Look for failed deliveries (red 🔴)
4. Click to see error details
5. Fix the issue and manually retry

### Payment not charging on day 8?
1. Check if card is in Stripe system
2. Check Stripe → Invoices (should be there 24h before charge)
3. Check webhook logs
4. Verify `invoice.payment_succeeded` event received

### User not seeing active status?
1. Check database: `SELECT * FROM subscription_logs WHERE user_id = 'xxx'`
2. Look for `subscription_updated` event
3. Check webhook was received (Stripe dashboard)
4. Verify database migration ran

### Test With These Cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires 3D Secure: `4000 0025 0000 3010`

---

## Next Steps

1. **Today:** Get your secret key and add to hosting
2. **Tomorrow:** Run database migration
3. **This week:** Test entire signup → charge flow
4. **This week:** Verify webhook receives events
5. **Next week:** Monitor first customer trial end
6. **Day 8:** First automated charge happens 🎉

---

## Contact & Help

All documentation files available:
- `STRIPE_SETUP.md` - Original detailed guide
- `STRIPE_PRODUCTS.md` - Product specs (now with your IDs!)
- `STRIPE_HOOKS.md` - All integration hooks
- `STRIPE_DEPLOYMENT.md` - This file

You're ready to go! 🚀
