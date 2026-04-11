# Quick Start: Deploy & Test Everything

## 5-Minute Setup

### 1. Add Stripe Environment Variables

**Vercel Project Settings → Environment Variables:**

```
STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for dev)
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_CORE=price_...
STRIPE_PRICE_PREMIUM=price_...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 2. Create Stripe Products (1-minute)

Go to Stripe Dashboard → Products:
- New Product: "Starter Plan" → Price: £47/month → Get `price_xxx`
- New Product: "Core Plan" → Price: £97/month → Get `price_xxx`
- New Product: "Premium Plan" → Price: £197/month → Get `price_xxx`

Copy price IDs into env vars above.

### 3. Set Webhook Endpoint

Stripe Dashboard → Webhooks:
- Endpoint: `https://yourdomain.com/api/stripe/webhook`
- Events: `checkout.session.completed`, `customer.subscription.deleted`
- Copy signing secret → `STRIPE_WEBHOOK_SECRET`

### 4. Deploy

```bash
git add .
git commit -m "Add Stripe + persona builder"
git push
# Vercel auto-deploys
```

---

## Test Locally (5 minutes)

```bash
# Start dev server
npm run dev

# 1. Sign in to http://localhost:3000
# 2. Go to /dashboard/settings
# 3. Click "Upgrade Plan"
# 4. Select tier → "Upgrade Now"
# 5. **Stop here** - local doesn't have Stripe webhook

# To test full flow:
# - Use Stripe test keys instead
# - Test card: 4242 4242 4242 4242 (exp: 12/34, CVC: 123)
```

---

## Test Persona Builder (2 minutes)

```bash
# In database, ensure:
UPDATE user_tiers SET setup_fee_paid = true WHERE user_id = YOUR_ID;

# Then visit:
http://localhost:3000/onboarding/persona

# Flow:
# 1. Answer 12 questions (30 seconds)
# 2. Upload/paste posts (15 seconds)
# 3. Review generated persona (15 seconds)
# 4. Confirm → redirects to dashboard
```

---

## File Reference

| File | Purpose | Edit For |
|------|---------|----------|
| `OnboardingProgress.jsx` | Step indicator | Change step count (default: 5) |
| `PersonaInterview.jsx` | Interview questions | Question styling, validation |
| `PostUploader.jsx` | Post upload UI | File formats, limits |
| `PersonaPreview.jsx` | Persona display | Layout, fields shown |
| `/onboarding/persona/page.jsx` | Orchestrator | Redirect URLs, auth checks |
| `UpgradePlanModal.jsx` | Tier selection | Tier features, pricing display |
| `TierStatusCard.jsx` | Current tier display | Layout, action buttons |
| `/dashboard/settings/page.jsx` | Settings page | Profile fields, sections |
| `/api/stripe/create-checkout/route.js` | Checkout | Stripe metadata, URLs |
| `/api/stripe/webhook/route.js` | Webhook handler | Event types, DB updates |
| `/api/stripe/portal/route.js` | Billing portal | Return URLs |

---

## Environment Variables Checklist

```bash
# Stripe (required for payments)
STRIPE_SECRET_KEY=                    ☐
STRIPE_WEBHOOK_SECRET=                ☐
STRIPE_PRICE_STARTER=                 ☐
STRIPE_PRICE_CORE=                    ☐
STRIPE_PRICE_PREMIUM=                 ☐

# App (for redirects)
NEXT_PUBLIC_APP_URL=                  ☐

# Already set (from earlier)
OPENAI_API_KEY=                       ✅
DATABASE_URL=                         ✅
JWT_SECRET=                           ✅
```

---

## API Endpoints Added

### Persona Builder (Backend Already Complete)
```
POST /api/onboarding/interview/start      # Get first question
POST /api/onboarding/interview/answer     # Submit answer
POST /api/onboarding/posts/upload         # Upload posts
POST /api/onboarding/persona/build        # Generate persona
POST /api/onboarding/persona/save         # Save & complete
```

### Stripe (Just Added)
```
POST /api/stripe/create-checkout          # Create Stripe session
POST /api/stripe/webhook                  # Handle Stripe events
POST /api/stripe/portal                   # Billing portal link
```

---

## Database Tables (All Already Exist)

```sql
-- Check with:
\dt user_tiers;
\dt user_personas;
\dt interview_progress;
\dt admin_logs;
```

---

## Component Hierarchy

```
/onboarding/persona/page.jsx (Main Orchestrator)
├── OnboardingProgress (Step indicator)
├── PersonaInterview (Step 1)
├── PostUploader (Step 2)
└── PersonaPreview (Step 4, with loading)

/dashboard/settings/page.jsx
└── TierStatusCard
    └── UpgradePlanModal
```

---

## Common Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Check for TypeScript errors (if applicable)
npm run type-check

# Run tests (if set up)
npm test

# Format code
npm run format

# Deploy
git push origin main
# Vercel auto-deploys
```

---

## Test Cards (Stripe)

| Card | Use For |
|------|---------|
| 4242 4242 4242 4242 | Success payments |
| 4000 0000 0000 0002 | Decline payments |
| 5555 5555 5555 4444 | Non-Visa cards |
| 3782 822463 10005 | American Express |

**Exp:** Any future date  
**CVC:** Any 3 digits

---

## Monitoring

### Check Stripe Webhook Logs
Stripe Dashboard → Webhooks → Endpoint → Logs

### Check App Logs (Vercel)
Vercel Dashboard → Deployment → Logs

### Check Database
```sql
-- Recent tier updates
SELECT * FROM user_tiers ORDER BY updated_at DESC LIMIT 10;

-- Webhook events in admin_logs
SELECT * FROM admin_logs WHERE action = 'stripe_payment' ORDER BY created_at DESC;
```

---

## Troubleshooting

### Payment works but tier doesn't update
1. Check webhook logs in Stripe
2. Verify `STRIPE_WEBHOOK_SECRET` matches
3. Check `/api/stripe/webhook` logs
4. Verify user_id in session matches

### Persona builder shows "Setup fee required"
1. Check `user_tiers.setup_fee_paid = true`
2. Or manually mark as paid in admin panel

### Stripe checkout redirects to error
1. Verify price IDs in env vars
2. Check Stripe account status
3. Ensure account has products created

### Component not rendering
1. Check `localStorage.getItem('auth_token')`
2. Verify API responses (check Network tab)
3. Check browser console for errors

---

## Next: What's Ready to Customize

✅ **Everything works out of the box**, but you can customize:

1. **Tier pricing** → `tier-config.js`
2. **Interview questions** → `openai-persona.js`
3. **Post upload limits** → `post-parser.js` validation
4. **Email templates** → `email.js`
5. **UI colors/styling** → Tailwind classes throughout

---

**Status: 🚀 READY FOR PRODUCTION**

All systems integrated. Deploy and test!
