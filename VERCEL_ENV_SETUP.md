# Vercel Environment Variables Setup

## Required Environment Variables

Your app needs these environment variables in Vercel to build and run:

### Database (Supabase)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Get from:
1. Go to https://app.supabase.com
2. Select your project
3. Settings → API
4. Copy "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
5. Copy "service_role secret" → `SUPABASE_SERVICE_ROLE_KEY`

### Stripe (Live Keys)
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[YOUR_PUBLISHABLE_KEY]
STRIPE_SECRET_KEY=sk_live_[YOUR_SECRET_KEY]
STRIPE_PRICE_STARTER=price_[YOUR_STARTER_PRICE_ID]
STRIPE_PRICE_CORE=price_[YOUR_CORE_PRICE_ID]
STRIPE_PRICE_PREMIUM=price_[YOUR_PREMIUM_PRICE_ID]
STRIPE_WEBHOOK_SECRET=whsec_[YOUR_WEBHOOK_SECRET]
```

### App Configuration
```
NEXT_PUBLIC_APP_URL=https://socialposter.easy-ai.co.uk
```

---

## Add to Vercel

### Step 1: Go to Vercel Dashboard
1. https://vercel.com/dashboard
2. Select "social-poster" project
3. Click "Settings"
4. Click "Environment Variables"

### Step 2: Add Each Variable
For each variable above:
1. Click "+ Add New"
2. Enter variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
3. Enter the value
4. Select which environments: Production, Preview, Development
5. Click "Save"

### Step 3: Redeploy
1. Go to "Deployments" tab
2. Find the failed deployment
3. Click the three dots (...)
4. Click "Redeploy"
5. Wait for build to complete

---

## Order to Add Variables

**Add in this order:**

1. ✅ `NEXT_PUBLIC_SUPABASE_URL`
2. ✅ `SUPABASE_SERVICE_ROLE_KEY`
3. ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (already have)
4. ✅ `STRIPE_SECRET_KEY` (get from Stripe)
5. ✅ `STRIPE_PRICE_STARTER`
6. ✅ `STRIPE_PRICE_CORE`
7. ✅ `STRIPE_PRICE_PREMIUM`
8. ✅ `STRIPE_WEBHOOK_SECRET`
9. ✅ `NEXT_PUBLIC_APP_URL`

---

## Quick Lookup

### Supabase Values
```
Project: https://app.supabase.com/projects
Settings → API → Project URL
Settings → API → service_role secret
```

### Already Have From Stripe
```
Public Key: pk_live_[YOUR_PUBLISHABLE_KEY]
Secret Key: sk_live_... (from dashboard)
Price IDs: price_[...]
Webhook Secret: whsec_[YOUR_WEBHOOK_SECRET]
```

---

## Verify Setup

After adding all variables and redeploying:

1. Check build log - should complete without "supabaseUrl is required" error
2. Visit https://socialposter.easy-ai.co.uk
3. Try signup flow
4. Check Stripe dashboard for webhook events

---

## Troubleshooting

### "supabaseUrl is required" error
- Missing `NEXT_PUBLIC_SUPABASE_URL`
- Double-check the value is exactly correct
- Redeploy after adding

### "Service role key invalid" error
- Wrong `SUPABASE_SERVICE_ROLE_KEY`
- Make sure it's the "service_role secret", not "anon key"
- Get from: Settings → API → scroll down to service_role

### Stripe webhook not working
- Check `STRIPE_WEBHOOK_SECRET` is correct
- Verify `STRIPE_SECRET_KEY` is set
- Check Stripe dashboard for webhook delivery logs
