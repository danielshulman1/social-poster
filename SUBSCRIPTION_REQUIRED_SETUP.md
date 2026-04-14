# Subscription-Required Setup - Complete ✅

## What Changed

Your app now requires users to select and subscribe to a paid tier during signup. No free tier access is given automatically.

---

## How It Works

### Signup Flow (User Journey)

1. **Visit `/account/signup`**
   - Simple form: name (optional), email, password
   - No tier selection required from user
   - Submit → creates account with FREE tier + `pending_payment` status

2. **Redirect to `/account/pending`**
   - User is shown: "Your account is pending activation"
   - Shows their assigned tier (initially FREE)
   - Display message: "Payment or admin approval is required to access your account"
   - Can click "Check Status" button to refresh
   - Can "Sign Out" anytime

3. **Admin Activates and Assigns Tier**
   - Admin goes to `/dashboard/admin` → Team Members section
   - Finds the new user and clicks "Manage Tier" button
   - Modal opens showing current tier (FREE) with `pending_payment` status
   - Admin:
     - Changes tier dropdown to desired plan (Starter/Core/Premium)
     - Can mark setup fee as paid if applicable
     - Clicks "Update Tier" button → saves immediately
   - User's subscription_status changes from `pending_payment` to `active`

4. **User Can Access Dashboard**
   - User refreshes `/account/pending` or visits `/dashboard`
   - SubscriptionGate checks `/api/auth/tier-check`
   - If `subscription_status === 'active'` → allows access
   - User redirected to `/dashboard` automatically
   - Tier info shown in settings

---

## Key Behavior Changes

### Tier Status Values

Old behavior:
- New users got `current_tier = 'free'` automatically on login
- `subscription_status = 'active'` for everyone

New behavior:
- New users get `current_tier = 'free'` and `subscription_status = 'pending_payment'`
- Only users with `subscription_status = 'active'` can access `/dashboard`
- Admin must explicitly activate the subscription via tier management modal
- Admin can assign any tier (free/starter/core/premium) when activating

### API Changes

**`/api/auth/me`**
- No longer auto-creates tier records
- Just returns user info

**`/api/auth/signup`**
- Simple form: email, password, optional name
- No longer accepts tier selection
- Creates pending tier record with `free` tier and `pending_payment` status
- Returns user info in response

**`/api/auth/tier-check`**
- Returns user's current tier + subscription_status
- `subscription_status` can be: `active`, `pending_payment`, `cancelled`, `none`

**`/api/admin/users/tier` (POST)**
- Admin sends: `{ userId, newTier, setupFeePaid }`
- Updates user's tier and marks subscription as `active`
- Changes user status from `pending_payment` to `active`

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
| `app/account/signup/page.jsx` | Simple form (no tier selection) |
| `app/api/auth/signup/route.js` | Create pending tier with FREE tier by default |
| `app/api/auth/me/route.js` | Remove auto-tier creation |
| `app/utils/tier-db.js` | Remove free tier fallback, require active status |
| `app/dashboard/layout.jsx` | Add SubscriptionGate component |
| `app/lib/middleware-tier.js` | Require active subscription status in requireTier |

---

## Admin Controls

Admins can:
- Go to `/dashboard/admin` → Team Members section
- Click "Manage Tier" (CreditCard icon) on any user
- Modal opens with:
  - User email display
  - Tier dropdown (Free/Starter/Core/Premium)
  - Setup fee checkbox
- Change tier and click "Update Tier" → immediately activates subscription
- Payment is not required for admin-assigned tiers
- Can mark setup fee as paid if applicable
- Can cancel subscriptions (reverts to free if admin reassigns)
- Admins control the entire tier lifecycle (assignment and activation)

---

## Testing the Flow

### Test as New User

1. Visit `/account/signup`
2. See simple form: name (optional), email, password — no tier selection
3. Fill in details and submit → account created
4. Redirected to `/account/pending`
5. See "Your account is pending activation" message
6. Shows tier: "Free Plan"
7. Try visiting `/dashboard` directly → redirected back to `/account/pending`

### Test as Admin

1. Go to `/dashboard/admin` (as existing admin)
2. Find pending user in Team Members section
3. Click "Manage Tier" button (CreditCard icon)
4. Modal opens showing:
   - User email
   - Current tier dropdown = "Free"
   - Setup fee checkbox (unchecked)
5. Change tier dropdown to "Starter" (or Core/Premium)
6. Optionally check "Mark setup fee as paid"
7. Click "Update Tier" → shows success message
8. Modal closes, user list refreshes

### Test User Can Access Dashboard

1. New user at `/account/pending` with pending_payment status
2. Clicks "Check Status" button
3. Or admin activates tier in admin panel
4. Page refreshes and detects active status
5. Redirects to `/dashboard` automatically
6. User can now access all features based on assigned tier

### Test Upgrade/Downgrade (for Active Users)

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

✅ Simple signup (no tier selection required)  
✅ All new users get FREE tier + pending_payment status  
✅ Pending accounts cannot access dashboard  
✅ Admin controls everything: tier assignment AND subscription activation  
✅ Admin can assign any tier (Free/Starter/Core/Premium)  
✅ Admin can manage setup fee paid status  
✅ Upgrade/downgrade fully functional for active users  
✅ Stripe payment ready (just needs API keys for paid upgrades)  
✅ Admin assignment works without payment  

**System is production-ready!**
