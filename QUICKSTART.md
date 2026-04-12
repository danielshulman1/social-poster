# Persona Builder - Quick Start (5 Minutes)

Can't wait to get started? Follow this quick start guide.

## 1. Get API Keys (2 minutes)

### Supabase
1. Go to https://app.supabase.com → Your Project → Settings → API
2. Copy **Project URL** and **anon key**

### OpenAI
1. Go to https://platform.openai.com/account/api-keys
2. Create new key
3. Copy it

## 2. Set Environment Variables (1 minute)

```bash
cd frontend
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

(OAuth keys optional - skip them if not using social imports)

## 3. Create Database Tables (1 minute)

1. Go to Supabase SQL Editor
2. Copy entire `supabase/migrations/20260412_create_user_personas.sql`
3. Paste and run
4. Done!

## 4. Install & Run (1 minute)

```bash
# From frontend directory
pnpm install
pnpm dev
```

Then visit: http://localhost:3000/onboarding

## That's it! 🎉

You now have a working persona builder.

---

## Quick Testing Checklist

- [ ] Can access `/onboarding`
- [ ] Interview loads with questions
- [ ] Can enter answers
- [ ] Posts step shows
- [ ] Can paste/upload posts
- [ ] Can see sample posts preview
- [ ] Persona generation starts
- [ ] Confirmation page shows
- [ ] Data in Supabase looks right

## Full Setup

For OAuth, email, payment integration, and more:
👉 See `PERSONA_BUILDER_SETUP.md`

## Implementation Details

For API docs, examples, and data structures:
👉 See `frontend/src/lib/persona-api-examples.md`

## Deployment

To deploy to Vercel:
1. Push to GitHub
2. Connect to Vercel
3. Add env vars
4. Done!

Full instructions: `PERSONA_BUILDER_SETUP.md` → "Step 5: Deploy to Vercel"

---

**Need help?** Check `PERSONA_BUILDER_CHECKLIST.md` for troubleshooting.
