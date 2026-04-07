# 🎯 Action Plan - Step-by-Step Implementation

This is your complete action plan to get social media integration live.

---

## TODAY - Setup Phase (1.5 hours)

### Task 1: Create OAuth Apps (20 minutes)
**Document:** [`CREATE_OAUTH_APPS.md`](./CREATE_OAUTH_APPS.md)

Follow these steps for each platform:

1. **X (Twitter)** (5 min)
   - Go to: https://developer.twitter.com/en/portal/dashboard
   - Create app "Easy AI App"
   - Enable OAuth 2.0
   - Add redirect URLs
   - Copy Client ID and Secret

2. **TikTok** (5 min)
   - Go to: https://developers.tiktok.com
   - Create app "Easy AI App"
   - Add redirect URLs
   - Copy Client Key and Secret

3. **YouTube** (5 min)
   - Go to: https://console.cloud.google.com
   - Create project "Easy AI App"
   - Enable YouTube Data API
   - Create OAuth credential
   - Copy Client ID and Secret

4. **Pinterest** (5 min)
   - Go to: https://developers.pinterest.com
   - Create app "Easy AI App"
   - Add redirect URLs
   - Copy App ID and Secret

**Output:** 8 credential pairs (ID + Secret for each platform)

---

### Task 2: Add Credentials Locally (10 minutes)
**Document:** [`CREDENTIALS_TEMPLATE.md`](./CREDENTIALS_TEMPLATE.md)

1. Open `.env.livecheck`
2. Find these lines:
   ```
   TWITTER_CLIENT_ID=""
   TWITTER_CLIENT_SECRET=""
   TIKTOK_CLIENT_ID=""
   TIKTOK_CLIENT_SECRET=""
   YOUTUBE_CLIENT_ID=""
   YOUTUBE_CLIENT_SECRET=""
   PINTEREST_CLIENT_ID=""
   PINTEREST_CLIENT_SECRET=""
   ```
3. Fill in your 8 credentials
4. Save file

---

### Task 3: Deploy to Vercel (5 minutes)

1. Go to: https://vercel.com/daniels-projects/social-feeds-app/settings/environment-variables
2. Add all 8 variables (mark as Production)
3. Save

**Verify:** They appear in the Production environment

---

### Task 4: Test Locally (30 minutes)
**Document:** [`OAUTH_TEST_GUIDE.md`](./OAUTH_TEST_GUIDE.md)

1. Restart dev server: `npm run dev`
2. Open http://localhost:3000
3. Log in to your test account
4. Go to Connections page
5. Test each platform:
   - [ ] Click "Connect X (Twitter)"
     - Redirects to Twitter
     - Can authorize
     - Returns to app with success message
   - [ ] Click "Connect with TikTok"
     - Same flow
   - [ ] Click "Connect with YouTube"
     - Same flow
   - [ ] Click "Connect with Pinterest"
     - Same flow

**Success:** All 4 appear in your connections list

---

### Task 5: Verify Database (5 minutes)

```bash
psql $DATABASE_URL

SELECT provider, COUNT(*) FROM "ExternalConnection" 
WHERE provider IN ('twitter', 'tiktok', 'youtube', 'pinterest')
GROUP BY provider;
```

**Expected:**
```
 provider  | count
-----------+-------
 twitter   |   1
 tiktok    |   1
 youtube   |   1
 pinterest |   1
```

---

## AFTER SETUP - Test Production (30 minutes)

### Task 6: Deploy Code
```bash
git status
git add .
git commit -m "feat: add OAuth integrations for X, TikTok, YouTube, Pinterest"
git push origin main
```

**Wait:** Vercel builds and deploys (usually 2-3 minutes)

### Task 7: Test Production
**Document:** [`DEPLOYMENT_STEPS.md`](./DEPLOYMENT_STEPS.md)

1. Go to: https://social-feeds-app.vercel.app
2. Log in with test account
3. Go to Connections page
4. Repeat the same OAuth tests:
   - Test X (Twitter)
   - Test TikTok
   - Test YouTube
   - Test Pinterest

**Success:** All 4 work on production domain

---

## OPTIONAL - Implement Posting (1-2 weeks)

### Task 8: Implement Posting Functions
**Document:** [`PLATFORM_POSTING_EXAMPLES.md`](./PLATFORM_POSTING_EXAMPLES.md)

Create functions to post to each platform:

```typescript
// packages/social-feeds/src/lib/social-posting.ts

export async function postToTwitter(userId: string, text: string) {
  // Get connection from database
  // Exchange for access token
  // POST to Twitter API
  // Return success/error
}

// Repeat for TikTok, YouTube, Pinterest
```

See PLATFORM_POSTING_EXAMPLES.md for complete code.

---

### Task 9: Add Workflow Output Nodes

Add buttons/nodes to your workflow builder to post to each platform.

---

### Task 10: Test End-to-End

Create workflow that:
1. Gets text input
2. Posts to all 4 platforms
3. Shows links to posts

---

## Timeline

| Task | Time | Status |
|------|------|--------|
| Create OAuth apps | 20 min | 🔄 NOW |
| Add credentials | 10 min | 🔄 TODAY |
| Deploy to Vercel | 5 min | 🔄 TODAY |
| Test locally | 30 min | 🔄 TODAY |
| Verify database | 5 min | 🔄 TODAY |
| Deploy code | 5 min | 🔄 TODAY |
| Test production | 15 min | 🔄 TODAY |
| **Setup subtotal** | **1.5 hrs** | |
| | | |
| Implement posting | 4-6 hrs | 📅 THIS WEEK |
| Add workflow nodes | 2-3 hrs | 📅 THIS WEEK |
| Testing & polish | 2-3 hrs | 📅 THIS WEEK |
| **Total** | **2-3 weeks** | |

---

## Current Step: CREATE OAUTH APPS

### Right Now:

1. **Open:** [`CREATE_OAUTH_APPS.md`](./CREATE_OAUTH_APPS.md)
2. **Follow steps** for each platform
3. **Copy credentials** as you get them
4. **Paste into:** [`CREDENTIALS_TEMPLATE.md`](./CREDENTIALS_TEMPLATE.md)

**Expected time:** 20 minutes

---

## Success Criteria

✅ All 4 OAuth apps created
✅ All 8 credentials obtained
✅ Credentials added to `.env.livecheck`
✅ Credentials deployed to Vercel
✅ OAuth tested locally for all 4 platforms
✅ Connections saved to database
✅ OAuth tested on production
✅ No console errors
✅ No 500 errors

---

## Commands You'll Need

```bash
# Start dev server
npm run dev

# View environment variables
cat .env.livecheck

# Check database
psql $DATABASE_URL

# Verify connections
SELECT * FROM "ExternalConnection" LIMIT 10;

# Deploy
git push origin main

# View Vercel logs
# https://vercel.com/daniels-projects/social-feeds-app/deployments
```

---

## Documents Reference

| Document | Purpose | When to Use |
|----------|---------|------------|
| [`CREATE_OAUTH_APPS.md`](./CREATE_OAUTH_APPS.md) | Create OAuth apps | FIRST - now |
| [`CREDENTIALS_TEMPLATE.md`](./CREDENTIALS_TEMPLATE.md) | Store credentials | After creating apps |
| [`OAUTH_TEST_GUIDE.md`](./OAUTH_TEST_GUIDE.md) | Test OAuth flows | After adding credentials |
| [`DEPLOYMENT_STEPS.md`](./DEPLOYMENT_STEPS.md) | Deploy to production | After testing locally |
| [`PLATFORM_POSTING_EXAMPLES.md`](./PLATFORM_POSTING_EXAMPLES.md) | Code examples | After OAuth works |
| [`SETUP_PROGRESS.md`](./SETUP_PROGRESS.md) | Track progress | Throughout setup |

---

## Next Immediate Action

**👉 Open and follow:** [`CREATE_OAUTH_APPS.md`](./CREATE_OAUTH_APPS.md)

Start with X (Twitter). Follow the exact steps. Should take 5 minutes per platform.

Once you have all 8 credentials, come back and:
1. Fill [`CREDENTIALS_TEMPLATE.md`](./CREDENTIALS_TEMPLATE.md)
2. Update `.env.livecheck`
3. Deploy to Vercel
4. Test

---

## Questions During Setup?

- **Can't find credentials?** → Check [`CREATE_OAUTH_APPS.md`](./CREATE_OAUTH_APPS.md) troubleshooting
- **OAuth not working?** → Check [`OAUTH_TEST_GUIDE.md`](./OAUTH_TEST_GUIDE.md)
- **Need to deploy?** → Check [`DEPLOYMENT_STEPS.md`](./DEPLOYMENT_STEPS.md)

---

**You're ready!** 🚀

Start with the first document now.

Total time to working OAuth: 1.5 hours
