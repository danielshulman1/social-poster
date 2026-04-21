# Stripe Products & Pricing Configuration

## Exact Products to Create in Stripe Dashboard

### Product 1: Social Poster Starter Plan
**Name:** Social Poster Starter  
**Description:** 3 posts per week across 3 core platforms

**Pricing:**
- **Price ID:** `price_1QaXxXXXXXXXXXXX` (you'll get this from Stripe)
- **Amount:** £27.99 (in pence: 2799)
- **Currency:** GBP
- **Billing Interval:** Monthly
- **Recurring:** Yes
- **Trial Period:** DO NOT SET (handled at checkout)

---

### Product 2: Social Poster Core
**Name:** Social Poster Core  
**Description:** 5 posts per week across 3 core platforms

**Pricing:**
- **Price ID:** `price_1QaXxYYYYYYYYYYY` (you'll get this from Stripe)
- **Amount:** £47.00 (in pence: 4700)
- **Currency:** GBP
- **Billing Interval:** Monthly
- **Recurring:** Yes
- **Trial Period:** DO NOT SET (handled at checkout)

---

### Product 3: Social Poster Premium
**Name:** Social Poster Premium  
**Description:** 7 posts per day across 5 platforms (Facebook, Instagram, LinkedIn, TikTok, Twitter/X)

**Pricing:**
- **Price ID:** `price_1QaXxZZZZZZZZZZZ` (you'll get this from Stripe)
- **Amount:** £97.00 (in pence: 9700)
- **Currency:** GBP
- **Billing Interval:** Monthly
- **Recurring:** Yes
- **Trial Period:** DO NOT SET (handled at checkout)

---

## Step-by-Step: Create Products in Stripe Dashboard

### How to Create Each Product

1. Go to https://dashboard.stripe.com/products
2. Click "+ Add product"
3. Enter product details (use above)
4. Click "Add pricing"
5. Select "Recurring"
6. Enter amount in pounds (27.99, 47.00, 97.00)
7. Set billing period: "Monthly"
8. Click "Save product"
9. **COPY the Price ID** (starts with `price_`)

### Finding Your Price IDs

After creating products:
1. Go to Products dashboard
2. Click each product
3. Look for "Pricing" section
4. You'll see: `Price ID: price_1QaXxXXXXXXXXXXX`
5. Copy exactly as shown

---

## Environment Variables to Set

After getting your Price IDs, add these to your `.env.local`:

See `.env.stripe.template` in the root directory for the exact format.

**You'll need to fill in:**
1. `STRIPE_SECRET_KEY` - Get from https://dashboard.stripe.com/apikeys
2. `STRIPE_PUBLIC_KEY` - Get from https://dashboard.stripe.com/apikeys
3. `STRIPE_PRICE_STARTER` - Get from https://dashboard.stripe.com/products (Starter product)
4. `STRIPE_PRICE_CORE` - Get from https://dashboard.stripe.com/products (Core product)
5. `STRIPE_PRICE_PREMIUM` - Get from https://dashboard.stripe.com/products (Premium product)
6. `STRIPE_WEBHOOK_SECRET` - Get from https://dashboard.stripe.com/webhooks (after creating endpoint)
7. `NEXT_PUBLIC_APP_URL=https://socialposter.easy-ai.co.uk`

---

## Webhook Setup

### Create Webhook Endpoint

1. Go to https://dashboard.stripe.com/webhooks
2. Click "+ Add endpoint"
3. Enter URL: `https://socialposter.easy-ai.co.uk/api/stripe/webhook`
4. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Click endpoint you just created
7. Copy "Signing secret" 
8. Add to env vars as `STRIPE_WEBHOOK_SECRET`

---

## Test Keys (Development Only)

For testing locally, use test keys instead:

```env
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Get from: https://dashboard.stripe.com/apikeys (toggle "View test data")

Test card numbers:
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Expiry:** Any future date (e.g., 12/25)
- **CVC:** Any 3 digits (e.g., 123)

---

## Stripe Dashboard Links (Save These!)

- **Products:** https://dashboard.stripe.com/products
- **API Keys:** https://dashboard.stripe.com/apikeys
- **Webhooks:** https://dashboard.stripe.com/webhooks
- **Customers:** https://dashboard.stripe.com/customers
- **Invoices:** https://dashboard.stripe.com/invoices
- **Test Data:** Toggle in top-left of dashboard

---

## Complete Setup Checklist

- [ ] Create Product 1: Starter (£27.99/mo)
  - Copy Price ID: _______________
- [ ] Create Product 2: Core (£47.00/mo)
  - Copy Price ID: _______________
- [ ] Create Product 3: Premium (£97.00/mo)
  - Copy Price ID: _______________
- [ ] Get Secret API Key from https://dashboard.stripe.com/apikeys
  - Copy: `sk_live_` _______________
- [ ] Get Publishable Key from https://dashboard.stripe.com/apikeys
  - Copy: `pk_live_` _______________
- [ ] Create webhook endpoint for `/api/stripe/webhook`
  - Copy webhook secret: `whsec_` _______________
- [ ] Add all to `.env.local`
- [ ] Test with test keys in development
- [ ] Deploy to production with live keys
