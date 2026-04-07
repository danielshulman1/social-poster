# ▶️ START NOW - Immediate Actions

This is what you need to do RIGHT NOW. No reading, just do it.

---

## NEXT 20 MINUTES: Create OAuth Apps

You need to create 4 OAuth apps and get 8 credentials.

### Step 1: X (Twitter) - 5 minutes

1. Go to: https://developer.twitter.com/en/portal/dashboard
2. Log in (or create account)
3. Click "Create App"
4. Name: "Easy AI App"
5. Description: "Social media automation"
6. Go to Settings → Authentication Settings
7. Enable OAuth 2.0
8. Add these redirect URLs:
   - `https://social-feeds-app.vercel.app/api/auth/twitter/callback`
   - `http://localhost:3000/api/auth/twitter/callback`
9. Go to Keys and Tokens
10. Generate Client ID and Client Secret
11. **COPY BOTH AND SAVE SOMEWHERE**

```
TWITTER_CLIENT_ID = [PASTE HERE]
TWITTER_CLIENT_SECRET = [PASTE HERE]
```

---

### Step 2: TikTok - 5 minutes

1. Go to: https://developers.tiktok.com
2. Click "Manage apps" → "Create app"
3. Name: "Easy AI App"
4. Category: "Business Service"
5. Add redirect URLs:
   - `https://social-feeds-app.vercel.app/api/auth/tiktok/callback`
   - `http://localhost:3000/api/auth/tiktok/callback`
6. Copy Client Key and Client Secret
7. **SAVE BOTH**

```
TIKTOK_CLIENT_ID = [PASTE HERE]
TIKTOK_CLIENT_SECRET = [PASTE HERE]
```

---

### Step 3: YouTube - 5 minutes

1. Go to: https://console.cloud.google.com
2. Log in with Google account
3. Click project dropdown → New Project
4. Name: "Easy AI App"
5. Wait for creation
6. Go to APIs & Services → Enable APIs
7. Search "YouTube Data API v3"
8. Enable it
9. Go to Credentials
10. Create OAuth 2.0 Web Application
11. Add redirect URLs:
    - `https://social-feeds-app.vercel.app/api/auth/youtube/callback`
    - `http://localhost:3000/api/auth/youtube/callback`
12. Copy Client ID and Secret
13. **SAVE BOTH**

```
YOUTUBE_CLIENT_ID = [PASTE HERE]
YOUTUBE_CLIENT_SECRET = [PASTE HERE]
```

---

### Step 4: Pinterest - 5 minutes

1. Go to: https://developers.pinterest.com
2. Log in (or create account)
3. Go to My apps
4. Create app
5. Name: "Easy AI App"
6. Copy App ID and App Secret
7. Add redirect URLs:
   - `https://social-feeds-app.vercel.app/api/auth/pinterest/callback`
   - `http://localhost:3000/api/auth/pinterest/callback`
8. **SAVE BOTH**

```
PINTEREST_CLIENT_ID = [PASTE HERE]
PINTEREST_CLIENT_SECRET = [PASTE HERE]
```

---

## NEXT 5 MINUTES: Add to .env.livecheck

1. Open file: `.env.livecheck`
2. Find this section:
   ```
   # ============================================================================
   # SOCIAL MEDIA PLATFORMS
   # ============================================================================
   # X (TWITTER)
   TWITTER_CLIENT_ID=""
   TWITTER_CLIENT_SECRET=""

   # TIKTOK
   TIKTOK_CLIENT_ID=""
   TIKTOK_CLIENT_SECRET=""

   # YOUTUBE
   YOUTUBE_CLIENT_ID=""
   YOUTUBE_CLIENT_SECRET=""

   # PINTEREST
   PINTEREST_CLIENT_ID=""
   PINTEREST_CLIENT_SECRET=""
   ```

3. Replace the empty quotes with your credentials:
   ```
   TWITTER_CLIENT_ID="your_twitter_id"
   TWITTER_CLIENT_SECRET="your_twitter_secret"
   # ... etc
   ```

4. **SAVE FILE**

---

## NEXT 5 MINUTES: Deploy to Vercel

1. Go to: https://vercel.com/daniels-projects/social-feeds-app/settings/environment-variables
2. Add 8 new environment variables:
   - Name: `TWITTER_CLIENT_ID`, Value: [your ID]
   - Name: `TWITTER_CLIENT_SECRET`, Value: [your secret]
   - Name: `TIKTOK_CLIENT_ID`, Value: [your ID]
   - Name: `TIKTOK_CLIENT_SECRET`, Value: [your secret]
   - Name: `YOUTUBE_CLIENT_ID`, Value: [your ID]
   - Name: `YOUTUBE_CLIENT_SECRET`, Value: [your secret]
   - Name: `PINTEREST_CLIENT_ID`, Value: [your ID]
   - Name: `PINTEREST_CLIENT_SECRET`, Value: [your secret]

3. Make sure each one is set for **Production** environment
4. **SAVE**

---

## NEXT: Restart Dev Server

```bash
npm run dev
```

Wait for it to start. Should say "ready in X seconds".

---

## NEXT: Test Locally

1. Go to http://localhost:3000
2. Log in
3. Go to Connections page
4. Click "Connect with X (Twitter)"
5. You should be redirected to Twitter
6. Log in and authorize
7. You should be back in the app
8. You should see your Twitter connection in the list

Repeat for TikTok, YouTube, Pinterest.

---

## Done! ✅

If all 4 tested successfully, you're ready for production.

Next:
1. Push code: `git push origin main`
2. Wait for Vercel deployment
3. Test on https://social-feeds-app.vercel.app

---

## Stuck?

Check these documents:
- **Creating apps:** [`CREATE_OAUTH_APPS.md`](./CREATE_OAUTH_APPS.md)
- **Testing:** [`OAUTH_TEST_GUIDE.md`](./OAUTH_TEST_GUIDE.md)
- **Deployment:** [`DEPLOYMENT_STEPS.md`](./DEPLOYMENT_STEPS.md)

---

## Timeline

```
Databases already synced:     0 min ✅
Create 4 OAuth apps:         20 min
Add to .env.livecheck:        5 min
Deploy to Vercel:             5 min
Test locally:                30 min
─────────────────────────────
Total:                       60 min
```

**1 hour from now you'll have working OAuth!**

---

**Ready?** Start with Step 1 above! 🚀
