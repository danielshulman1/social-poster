# 🚀 IMMEDIATE ACTIONS - Complete These Now

Your code is deployed to GitHub and Vercel is building.  
Complete these 4 steps to go live. **Expected time: 30-45 minutes**

---

## ✅ ACTION 1: Add Environment Variables in Vercel (5 min)

### Where
https://vercel.com/dashboard → Your Project → Settings → Environment Variables

### What to Add

Copy and paste these exactly. Replace values with your actual keys.

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

OPENAI_API_KEY=sk-proj-... (mark as SENSITIVE)

NEXT_PUBLIC_APP_URL=https://your-project-name.vercel.app
```

### How to Get These

**Supabase**:
1. Go to https://app.supabase.com/project/[your-id]/settings/api
2. Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy `anon key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**OpenAI**:
1. Go to https://platform.openai.com/account/api-keys
2. Create new key
3. Copy it → `OPENAI_API_KEY`

**Vercel Domain**:
1. Go to https://vercel.com/dashboard
2. Find your project domain
3. Should look like: `social-poster-[random].vercel.app`
4. Use that → `NEXT_PUBLIC_APP_URL`

### Don't Forget
- Mark `OPENAI_API_KEY` as SENSITIVE (check the box)
- Click "Save" after adding each variable

---

## ✅ ACTION 2: Run Database Migration (5 min)

### Where
https://app.supabase.com/project/[your-id]/sql

### What to Do

1. Click "New query"
2. Open the file: `supabase/migrations/20260412_create_user_personas.sql`
3. Copy entire contents (all ~150 lines)
4. Paste into Supabase SQL editor
5. Click "Run"

### What This Does
Creates 3 tables:
- `user_personas` - Stores generated personas
- `user_onboarding_progress` - Tracks progress
- `user_social_connections` - Stores OAuth tokens

All with security policies and indexes included.

---

## ✅ ACTION 3: Update OAuth Redirect URIs (10 min - OPTIONAL)

### Only needed if you're using Facebook/Instagram/LinkedIn

Once your Vercel deployment is live (you'll have a URL), add these redirect URIs:

#### Facebook
1. Go to https://developers.facebook.com/apps/
2. Find your app
3. Add Redirect URI:
   ```
   https://YOUR_VERCEL_DOMAIN/api/oauth/callback?platform=facebook
   ```

#### Instagram  
1. Go to https://developers.instagram.com/
2. Find your app
3. Add Redirect URI:
   ```
   https://YOUR_VERCEL_DOMAIN/api/oauth/callback?platform=instagram
   ```

#### LinkedIn
1. Go to https://www.linkedin.com/developers/
2. Find your app  
3. Add Redirect URL:
   ```
   https://YOUR_VERCEL_DOMAIN/api/oauth/callback?platform=linkedin
   ```

---

## ✅ ACTION 4: Test Deployment (10 min)

### Wait for Build to Complete
1. Go to https://vercel.com/dashboard
2. Check your "social-poster" project
3. Wait for build to say "Ready" (usually 2-5 minutes)

### Test the Flow
1. Visit: `https://YOUR_VERCEL_DOMAIN/onboarding`
2. Log in with test account (Supabase Auth)
3. Complete the interview (answer 12 questions)
4. Add some posts (paste or upload)
5. Wait for persona generation (~20 seconds)
6. See results with sample posts

### Verify Database
1. Go to https://app.supabase.com/project/[id]/editor
2. Click `user_personas` table
3. You should see your test persona data

### Check for Errors
- Open browser DevTools (F12)
- Look at Console tab
- Should see NO red error messages

---

## 🎯 Success Checklist

When all these are true, you're live:

- [ ] Vercel build says "Ready"
- [ ] Environment variables added in Vercel
- [ ] Supabase migration executed
- [ ] Can access `/onboarding` without errors
- [ ] Can answer all 12 interview questions
- [ ] Can upload posts
- [ ] Persona generates (takes ~20 seconds)
- [ ] Can see results with sample posts
- [ ] Data appears in `user_personas` table
- [ ] No red errors in browser console

---

## 🆘 If Something Goes Wrong

### "Supabase connection error"
- Check `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Check they're set in Vercel dashboard

### "OpenAI API key invalid"  
- Check key at https://platform.openai.com/account/api-keys
- Copy exact key (no extra spaces)
- Make sure it's marked as SENSITIVE in Vercel

### "RLS policy violation"
- User must be logged in
- Check Supabase auth is working
- Run migration SQL again if needed

### "OAuth redirect mismatch"
- Check URL matches exactly (including query params)
- Don't forget `?platform=facebook` etc
- Update in ALL 3 OAuth apps

### "Database tables don't exist"
- Go to Supabase SQL editor
- Run the migration SQL again
- Check it ran without errors

---

## 📞 Help

Still stuck? Check these docs:

- **5-min setup**: `QUICKSTART.md`
- **Detailed guide**: `PERSONA_BUILDER_SETUP.md`
- **Troubleshooting**: `PERSONA_BUILDER_SETUP.md` (see end)
- **Architecture**: `ARCHITECTURE.md`
- **Complete reference**: `QUICK_REFERENCE.txt`

---

## ⏱️ Timeline

| Action | Time | Status |
|--------|------|--------|
| 1. Env vars | 5 min | 👈 START HERE |
| 2. Migration | 5 min | Then this |
| 3. OAuth URIs | 10 min | If needed |
| 4. Test | 10 min | Final step |
| **TOTAL** | **30-45 min** | **Live!** |

---

**Everything is ready. Just complete these 4 steps and you're live!** 🎉

Questions? All answers are in the documentation files in your repo.
