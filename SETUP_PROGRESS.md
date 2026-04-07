# 📋 Setup Progress Tracker

Track your progress as you set up the OAuth apps.

---

## Phase 1: Create OAuth Apps (20 minutes)

### X (Twitter)
Steps to complete:
- [ ] Go to https://developer.twitter.com/en/portal/dashboard
- [ ] Create app with name "Easy AI App"
- [ ] Enable OAuth 2.0
- [ ] Add redirect URLs:
  - [ ] https://social-feeds-app.vercel.app/api/auth/twitter/callback
  - [ ] http://localhost:3000/api/auth/twitter/callback
- [ ] Copy Client ID
- [ ] Copy Client Secret

**Time: 5 minutes**

### TikTok
Steps to complete:
- [ ] Go to https://developers.tiktok.com
- [ ] Create app with name "Easy AI App"
- [ ] Add redirect URLs:
  - [ ] https://social-feeds-app.vercel.app/api/auth/tiktok/callback
  - [ ] http://localhost:3000/api/auth/tiktok/callback
- [ ] Copy Client Key (as TIKTOK_CLIENT_ID)
- [ ] Copy Client Secret (as TIKTOK_CLIENT_SECRET)

**Time: 5 minutes**

### YouTube
Steps to complete:
- [ ] Go to https://console.cloud.google.com
- [ ] Create new project "Easy AI App"
- [ ] Enable YouTube Data API v3
- [ ] Create OAuth 2.0 Web Application credential
- [ ] Add redirect URLs:
  - [ ] https://social-feeds-app.vercel.app/api/auth/youtube/callback
  - [ ] http://localhost:3000/api/auth/youtube/callback
- [ ] Copy Client ID
- [ ] Copy Client Secret

**Time: 5 minutes**

### Pinterest
Steps to complete:
- [ ] Go to https://developers.pinterest.com
- [ ] Create app with name "Easy AI App"
- [ ] Add redirect URLs:
  - [ ] https://social-feeds-app.vercel.app/api/auth/pinterest/callback
  - [ ] http://localhost:3000/api/auth/pinterest/callback
- [ ] Copy App ID (as PINTEREST_CLIENT_ID)
- [ ] Copy App Secret (as PINTEREST_CLIENT_SECRET)

**Time: 5 minutes**

---

## Phase 2: Add Credentials to Environment (5 minutes)

- [ ] Open `.env.livecheck`
- [ ] Add TWITTER_CLIENT_ID
- [ ] Add TWITTER_CLIENT_SECRET
- [ ] Add TIKTOK_CLIENT_ID
- [ ] Add TIKTOK_CLIENT_SECRET
- [ ] Add YOUTUBE_CLIENT_ID
- [ ] Add YOUTUBE_CLIENT_SECRET
- [ ] Add PINTEREST_CLIENT_ID
- [ ] Add PINTEREST_CLIENT_SECRET
- [ ] Save file

**Use CREDENTIALS_TEMPLATE.md to help**

---

## Phase 3: Deploy to Vercel (5 minutes)

- [ ] Go to https://vercel.com/daniels-projects/social-feeds-app/settings/environment-variables
- [ ] Add TWITTER_CLIENT_ID (Production)
- [ ] Add TWITTER_CLIENT_SECRET (Production)
- [ ] Add TIKTOK_CLIENT_ID (Production)
- [ ] Add TIKTOK_CLIENT_SECRET (Production)
- [ ] Add YOUTUBE_CLIENT_ID (Production)
- [ ] Add YOUTUBE_CLIENT_SECRET (Production)
- [ ] Add PINTEREST_CLIENT_ID (Production)
- [ ] Add PINTEREST_CLIENT_SECRET (Production)

---

## Phase 4: Test Locally (30 minutes)

- [ ] Start dev server: `npm run dev`
- [ ] Go to http://localhost:3000
- [ ] Log in to account
- [ ] Go to Connections page
- [ ] Click "Connect with X (Twitter)"
  - [ ] Redirects to Twitter
  - [ ] Can authorize
  - [ ] Returns to app
  - [ ] Connection appears
- [ ] Click "Connect with TikTok"
  - [ ] Redirects to TikTok
  - [ ] Can authorize
  - [ ] Returns to app
  - [ ] Connection appears
- [ ] Click "Connect with YouTube"
  - [ ] Redirects to YouTube
  - [ ] Can authorize
  - [ ] Returns to app
  - [ ] Connection appears
- [ ] Click "Connect with Pinterest"
  - [ ] Redirects to Pinterest
  - [ ] Can authorize
  - [ ] Returns to app
  - [ ] Connection appears

---

## Phase 5: Verify in Database (5 minutes)

```bash
psql $DATABASE_URL

SELECT provider, COUNT(*) FROM "ExternalConnection" GROUP BY provider;
```

Expected output:
```
 provider  | count
-----------+-------
 twitter   |   1
 tiktok    |   1
 youtube   |   1
 pinterest |   1
```

- [ ] Twitter connection in database
- [ ] TikTok connection in database
- [ ] YouTube connection in database
- [ ] Pinterest connection in database

---

## Phase 6: Deploy to Production (10 minutes)

- [ ] Push code: `git push origin main`
- [ ] Wait for Vercel deployment
- [ ] Go to https://social-feeds-app.vercel.app
- [ ] Log in
- [ ] Test OAuth on production
  - [ ] X (Twitter) works
  - [ ] TikTok works
  - [ ] YouTube works
  - [ ] Pinterest works

---

## Summary

| Phase | Status | Time | Notes |
|-------|--------|------|-------|
| 1. Create OAuth Apps | ⬜ TODO | 20 min | Use CREATE_OAUTH_APPS.md |
| 2. Add Credentials | ⬜ TODO | 5 min | Use CREDENTIALS_TEMPLATE.md |
| 3. Deploy to Vercel | ⬜ TODO | 5 min | Add 8 env vars |
| 4. Test Locally | ⬜ TODO | 30 min | Test all 4 platforms |
| 5. Verify Database | ⬜ TODO | 5 min | Query connections |
| 6. Deploy & Test | ⬜ TODO | 10 min | Test production |

**Total Time: ~75 minutes to fully working OAuth!**

---

## Next Steps

1. **Read CREATE_OAUTH_APPS.md** - Detailed steps for each platform
2. **Create the 4 OAuth apps** - 20 minutes
3. **Fill CREDENTIALS_TEMPLATE.md** - Paste your credentials
4. **Update .env.livecheck** - Add all credentials
5. **Deploy to Vercel** - Add to environment variables
6. **Test** - Follow OAUTH_TEST_GUIDE.md

---

**Questions?** Check the relevant guide:
- Setup issues → CREATE_OAUTH_APPS.md
- Testing issues → OAUTH_TEST_GUIDE.md
- Deployment issues → DEPLOYMENT_STEPS.md

**Let's go!** 🚀
