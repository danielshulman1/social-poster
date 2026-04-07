# 🚀 Deployment Steps - Get Social Integration Live

Follow these steps to deploy your social media integrations to production.

---

## Phase 1: Local Testing (Done First)

### 1. Test OAuth Routes Locally

```bash
cd packages/social-feeds
npm run dev
```

1. Go to http://localhost:3000
2. Log in
3. Go to Connections
4. Click "Connect X (Twitter)"
5. Verify OAuth flow works
6. Check connection saved to database

### 2. Test All 4 Platforms

- [ ] X (Twitter) OAuth works
- [ ] TikTok OAuth works
- [ ] YouTube OAuth works
- [ ] Pinterest OAuth works

See `OAUTH_TEST_GUIDE.md` for detailed testing.

---

## Phase 2: Prepare for Production

### 1. Get Real OAuth Credentials

For each platform, create OAuth apps with **production** redirect URLs:

#### X (Twitter)
- Go: https://developer.twitter.com/en/portal/dashboard
- Create app
- Add redirect URL: `https://social-feeds-app.vercel.app/api/auth/twitter/callback`
- Copy Client ID and Secret

#### TikTok
- Go: https://developers.tiktok.com
- Create app
- Add redirect URL: `https://social-feeds-app.vercel.app/api/auth/tiktok/callback`
- Copy Client Key and Secret

#### YouTube
- Go: https://console.cloud.google.com
- Create OAuth app
- Add redirect URL: `https://social-feeds-app.vercel.app/api/auth/youtube/callback`
- Copy Client ID and Secret

#### Pinterest
- Go: https://developers.pinterest.com
- Create app
- Add redirect URL: `https://social-feeds-app.vercel.app/api/auth/pinterest/callback`
- Copy App ID and Secret

### 2. Add to Vercel Environment Variables

1. Go to: https://vercel.com/daniels-projects/social-feeds-app/settings/environment-variables
2. Add the following variables:
   - `TWITTER_CLIENT_ID`
   - `TWITTER_CLIENT_SECRET`
   - `TIKTOK_CLIENT_ID`
   - `TIKTOK_CLIENT_SECRET`
   - `YOUTUBE_CLIENT_ID`
   - `YOUTUBE_CLIENT_SECRET`
   - `PINTEREST_CLIENT_ID`
   - `PINTEREST_CLIENT_SECRET`

**Make sure they're available for Production environment!**

---

## Phase 3: Commit and Push

### 1. Commit Your Changes

```bash
cd "c:\Users\danie\OneDrive\Documents\app  builds\New folder"

git status

# Should show:
# - Modified: packages/social-feeds/prisma/schema.prisma ✓
# - Modified: .env.example ✓
# - Untracked: packages/social-feeds/src/app/api/auth/twitter/
# - Untracked: packages/social-feeds/src/app/api/auth/tiktok/
# - Untracked: packages/social-feeds/src/app/api/auth/youtube/
# - Untracked: packages/social-feeds/src/app/api/auth/pinterest/
# - Untracked: Documentation files (MAKE_IT_WORK.md, etc.)

git add packages/social-feeds/prisma/schema.prisma
git add packages/social-feeds/src/app/api/auth/
git add .env.example
git add *.md
git add *.txt

git commit -m "feat: add OAuth integrations for X, TikTok, YouTube, Pinterest"

git push origin main
```

### 2. Verify Build Succeeds

Vercel will auto-build. Check at:
https://vercel.com/daniels-projects/social-feeds-app/deployments

It should:
- ✅ Install dependencies
- ✅ Build successfully
- ✅ Deploy to production

---

## Phase 4: Test Production

### 1. Test OAuth on Production Domain

1. Go to: https://social-feeds-app.vercel.app
2. Log in with test account
3. Go to Connections
4. Click "Connect X (Twitter)"
5. Should redirect to Twitter OAuth
6. Authorize
7. Should redirect back to app
8. Connection should appear in list

### 2. Verify Connection in Production Database

```bash
# Connect to production database
psql $DATABASE_URL

SELECT * FROM "ExternalConnection" 
WHERE provider = 'twitter' 
ORDER BY "createdAt" DESC LIMIT 1;

# Should show your connection with accessToken
```

### 3. Test All 4 Platforms

- [ ] X (Twitter) - Full flow works
- [ ] TikTok - Full flow works
- [ ] YouTube - Full flow works
- [ ] Pinterest - Full flow works

---

## Phase 5: Add UI Elements (If Needed)

If you haven't already, add "Connect" buttons to your Connections page:

Find: `packages/social-feeds/src/app/(authenticated)/connections/page.tsx`

Add buttons:

```tsx
<div className="space-y-4">
  {/* Existing content */}
  
  {/* New Social Platforms Section */}
  <h2 className="text-xl font-bold mt-8">Social Media Platforms</h2>
  
  <div className="grid grid-cols-2 gap-4">
    <button 
      onClick={() => window.location.href = '/api/auth/twitter'}
      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
    >
      🐦 Connect X
    </button>
    
    <button 
      onClick={() => window.location.href = '/api/auth/tiktok'}
      className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded"
    >
      🎵 Connect TikTok
    </button>
    
    <button 
      onClick={() => window.location.href = '/api/auth/youtube'}
      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
    >
      ▶️ Connect YouTube
    </button>
    
    <button 
      onClick={() => window.location.href = '/api/auth/pinterest'}
      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
    >
      📌 Connect Pinterest
    </button>
  </div>
</div>
```

Then commit and push:
```bash
git add packages/social-feeds/src/app/(authenticated)/connections/page.tsx
git commit -m "feat: add UI buttons for social platform connections"
git push origin main
```

---

## Phase 6: Monitor Production (First 24 Hours)

### 1. Check Vercel Analytics

https://vercel.com/daniels-projects/social-feeds-app/analytics

Look for:
- No 500 errors
- OAuth routes working
- Fast response times

### 2. Check Application Logs

```bash
# In Vercel dashboard, go to:
# Deployments → Latest → Logs

# Look for any OAuth-related errors
```

### 3. Test Full OAuth Flow

Try completing full OAuth flow again:
1. Clear browser cookies
2. Log in fresh
3. Connect to each platform
4. Verify connections appear

### 4. Database Verification

```bash
# Query all connections created in last 24 hours
SELECT provider, COUNT(*) 
FROM "ExternalConnection" 
WHERE "createdAt" > NOW() - INTERVAL '1 day'
GROUP BY provider;

# Should show new connections
```

---

## Phase 7: Next Steps (After Deployment)

### 1. Implement Posting Functions

See `PLATFORM_POSTING_EXAMPLES.md` for code to:
- Post tweets
- Upload TikTok videos
- Upload YouTube videos
- Create Pinterest pins

### 2. Add Workflow Nodes

Add output nodes to workflow builder for each platform.

### 3. Test End-to-End

Create workflow that:
1. Gets content from input
2. Posts to each platform
3. Returns success/error

### 4. Scale to Other Platforms

Using the same pattern, add:
- Threads (via Instagram API)
- Bluesky (via public API)
- LinkedIn (enhance existing)

---

## Troubleshooting Deployment

### Issue: Build Fails

```
Error: Cannot find module...
```

**Fix:**
1. Check all imports are correct
2. Run locally first: `npm run build`
3. Check environment variables are set in Vercel

### Issue: OAuth Redirect URL Mismatch

```
Redirect URL mismatch error from platform
```

**Fix:**
1. Go to platform OAuth app settings
2. Verify redirect URL is exactly: `https://social-feeds-app.vercel.app/api/auth/[platform]/callback`
3. No trailing slashes, exact match required

### Issue: Credentials Not Loading

```
Twitter credentials not configured
```

**Fix:**
1. Go to Vercel environment variables
2. Verify `TWITTER_CLIENT_ID` is set
3. Set for **Production** environment
4. Re-deploy or wait for next deployment

### Issue: Database Connection Fails

```
ECONNREFUSED or connection timeout
```

**Fix:**
1. Verify `DATABASE_URL` is correct in Vercel
2. Check Supabase database is online
3. Verify IP whitelist (if applicable)

---

## Deployment Checklist

### Pre-Deployment
- [ ] OAuth apps created on all 4 platforms
- [ ] Production redirect URLs added to platforms
- [ ] Credentials added to `.env.livecheck`
- [ ] Tested locally - all OAuth flows work
- [ ] Commit message is clear
- [ ] No secrets in code (only env vars)

### Deployment
- [ ] Code pushed to `main` branch
- [ ] Vercel build succeeds
- [ ] No build errors or warnings
- [ ] Environment variables set in Vercel
- [ ] Deployment shows "Ready"

### Post-Deployment
- [ ] Test OAuth on production domain
- [ ] All 4 platforms work
- [ ] Connections save to database
- [ ] No 500 errors in logs
- [ ] Monitor for 24 hours
- [ ] Add UI buttons (if needed)

### Ready for Users
- [ ] Users can see "Connect" buttons
- [ ] Full OAuth flow works
- [ ] Connections appear in account
- [ ] No console errors
- [ ] Performance is good

---

## Success Criteria

Deployment is successful when:

✅ OAuth routes respond correctly (no errors)
✅ OAuth redirects to platform login
✅ After authorization, user is redirected back
✅ Connection is saved to database
✅ All 4 platforms work
✅ No console errors on app
✅ No 500 errors in Vercel logs
✅ Vercel shows "Ready" status

---

## Timeline

| Phase | Task | Time |
|-------|------|------|
| 1 | Local testing | 30 min |
| 2 | Create OAuth apps | 20 min |
| 3 | Add to Vercel | 5 min |
| 4 | Commit & push | 5 min |
| 5 | Test production | 15 min |
| 6 | Monitor | 24 hours |
| 7 | Next steps | 1-2 weeks |

**Total: ~1.5 hours + 24-hour monitoring**

---

## Contact & Support

If you hit issues:

1. Check `OAUTH_TEST_GUIDE.md` - covers common issues
2. Check `MAKE_IT_WORK.md` - step-by-step guide
3. Check application logs in Vercel
4. Check platform OAuth app settings
5. Verify environment variables are set

---

**You're ready to deploy!** 🚀

Follow this guide and your social media integrations will be live within the hour!
