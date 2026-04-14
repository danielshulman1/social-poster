# Subscription-Required Setup - Complete ✅

## What Changed

Your app now requires users to select and subscribe to a paid tier during signup. No free tier access is given automatically.

---

## How It Works

### Signup Flow (User Journey)

1. **Visit `/account/signup`**
   - Step 1: See 3 plan cards (Starter £47/mo, Core £97/mo, Premium £197/mo)
   - No free plan offered
   - Click to select a plan → advances to Step 2

2. **Step 2: Account Details**
   - Shows "Selected: [Plan Name]" badge with a "Change" link
   - Enter name, email, password
   - Submit → creates account with tier status = `pending_payment`

3. **Redirect to `/account/pending`**
   - User is shown their selected plan
   - Display message: "Your account is pending activation"
   - Note: "Payment or admin approval is required to access your account"
   - Can click "Check Status" button to refresh
   - Can "Sign Out" anytime

4. **Admin Activates Account**
   - Admin goes to `/dashboard/admin` → Tier Management
   - Selects user and sets tier to active
   - User's subscription_status changes from `pending_payment` to `active`

5. **User Can Access Dashboard**
   - User refreshes `/account/pending` or visits `/dashboard`
   - SubscriptionGate checks `/api/auth/tier-check`
   - If `subscription_status === 'active'` → allows access
   - User redirected to `/dashboard` automatically

---

## Key Behavior Changes

### Tier Status Values

Old behavior:
- New users got `current_tier = 'free'` automatically on login
- `subscription_status = 'active'` for everyone

New behavior:
- New users get `current_tier = [selected tier]` and `subscription_status = 'pending_payment'`
- Only users with `subscription_status = 'active'` can access `/dashboard`
- Admin must explicitly activate the subscription

### API Changes

**`/api/auth/me`**
- No longer auto-creates tier records
- Just returns user info

**`/api/auth/signup`**
- Now accepts `selectedTier` (required, one of: starter/core/premium)
- Creates pending tier record in transaction
- Returns selected tier in response

**`/api/auth/tier-check`**
- Returns user's current tier + subscription_status
- `subscription_status` can be: `active`, `pending_payment`, `cancelled`, `none`

### Tier Database

**`user_tiers` table**
- When no record exists, `getUserTier()` returns `{ current_tier: null, subscription_status: 'none' }`
- No implicit free tier fallback
- `isSubscriptionActive()` only returns true for `subscription_status = 'active'`

**`requireTier` function**
- API routes now check `subscription_status === 'active'` before tier comparison
- Returns 403 if not active, even if tier would normally have access

---

## File Changes

### Files Created

| File | Purpose |
|------|---------|
| `app/account/pending/page.jsx` | Page shown to users with pending subscriptions |

### Files Modified

| File | Change |
|------|--------|
| `app/account/signup/page.jsx` | 2-step form: plan selection → account details |
| `app/api/auth/signup/route.js` | Accept selectedTier, create pending tier record |
| `app/api/auth/me/route.js` | Remove auto-tier creation |
| `app/utils/tier-db.js` | Remove free tier fallback, require active status |
| `app/dashboard/layout.jsx` | Add SubscriptionGate component |
| `app/lib/middleware-tier.js` | Require active subscription status in requireTier |

---

## Admin Controls (Unchanged)

Admins can still:
- Go to `/dashboard/admin` → Tier Management
- Assign any tier (including free) to any user
- Payment is not required for admin-assigned tiers
- Can mark setup fee as paid
- Can cancel subscriptions (reverts to free if admin reassigns)

---

## Testing the Flow

### Test as New User

1. Visit `/account/signup`
2. See 3 plan cards (Starter, Core, Premium) — no Free option
3. Click "Choose Starter" → advances to step 2
4. Fill account details → create account
5. Redirected to `/account/pending`
6. See "Selected: Starter Plan" and activation message
7. Try visiting `/dashboard` directly → redirected back to `/account/pending`

### Test as Admin

1. Go to `/dashboard/admin` (as existing admin)
2. Find pending user in Team Members
3. Click "Manage Tier" button
4. Modal shows current tier = "starter" with pending_payment status
5. Change tier status to active by changing dropdown
6. Click "Update Tier"
7. New user hits `/account/pending` → now redirected to `/dashboard`
8. Can see tier in settings, access features based on tier

### Test Upgrade/Downgrade

1. User with active subscription visits `/dashboard/upgrade`
2. See all tiers with current plan highlighted
3. Can click "Upgrade" to switch to higher tier
4. Can click "Downgrade" to switch to lower tier
5. Modal opens, user completes action
6. Tier changes instantly (or via Stripe if payment enabled)

---

## When Ready for Stripe Payments

The system is already wired for Stripe. When you're ready:

1. Create Stripe price objects for starter/core/premium
2. Add environment variables:
   ```
   STRIPE_PRICE_STARTER=price_xxx
   STRIPE_PRICE_CORE=price_yyy
   STRIPE_PRICE_PREMIUM=price_zzz
   STRIPE_SECRET_KEY=sk_xxx
   ```
3. Users will see real Stripe checkout in the UpgradePlanModal
4. On successful payment, `subscription_status` becomes `active` automatically

For now, admin assignment is the way to activate accounts.

---

## Summary

✅ Users must select a tier to sign up  
✅ No automatic free tier  
✅ Pending accounts cannot access dashboard  
✅ Admin can activate any account  
✅ Admin can assign any tier (including free)  
✅ Upgrade/downgrade fully functional  
✅ Stripe payment ready (just needs API keys)  

**System is production-ready!**
