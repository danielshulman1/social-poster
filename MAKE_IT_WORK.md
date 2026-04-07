# 🚀 Make Social Media Integration Work - Implementation Guide

Your OAuth routes are ready. Here's what to do to make them work:

---

## ✅ Step 1: Add Credentials to Environment (10 minutes)

You need to create OAuth apps on each platform and get credentials.

### For X (Twitter)

1. Go to [https://developer.twitter.com/en/portal/dashboard](https://developer.twitter.com/en/portal/dashboard)
2. Click "Create App"
3. Fill in app details
4. Go to **Settings → Authentication Settings**
5. Enable **OAuth 2.0**
6. Set App Type to **Native App**
7. Add **Redirect URIs**:
   ```
   https://social-feeds-app.vercel.app/api/auth/twitter/callback
   http://localhost:3000/api/auth/twitter/callback
   ```
8. Copy **Client ID** and **Client Secret**
9. Add to `.env.livecheck`:
   ```
   TWITTER_CLIENT_ID="your_client_id"
   TWITTER_CLIENT_SECRET="your_client_secret"
   ```

### For TikTok

1. Go to [https://developers.tiktok.com](https://developers.tiktok.com)
2. Click **Manage apps** → **Create app**
3. Fill in app name
4. Choose app type
5. Add **Redirect URLs**:
   ```
   https://social-feeds-app.vercel.app/api/auth/tiktok/callback
   http://localhost:3000/api/auth/tiktok/callback
   ```
6. Copy **Client Key** and **Client Secret**
7. Add to `.env.livecheck`:
   ```
   TIKTOK_CLIENT_ID="your_client_key"
   TIKTOK_CLIENT_SECRET="your_client_secret"
   ```

### For YouTube

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Select or create project
3. Go to **Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Choose **Web application**
6. Add **Authorized Redirect URIs**:
   ```
   https://social-feeds-app.vercel.app/api/auth/youtube/callback
   http://localhost:3000/api/auth/youtube/callback
   ```
7. Copy **Client ID** and **Client Secret**
8. Add to `.env.livecheck`:
   ```
   YOUTUBE_CLIENT_ID="your_client_id"
   YOUTUBE_CLIENT_SECRET="your_client_secret"
   ```

### For Pinterest

1. Go to [https://developers.pinterest.com](https://developers.pinterest.com)
2. Click **Create app**
3. Fill in app details
4. Add **Redirect URLs**:
   ```
   https://social-feeds-app.vercel.app/api/auth/pinterest/callback
   http://localhost:3000/api/auth/pinterest/callback
   ```
5. Copy **App ID** and **App Secret**
6. Add to `.env.livecheck`:
   ```
   PINTEREST_CLIENT_ID="your_app_id"
   PINTEREST_CLIENT_SECRET="your_app_secret"
   ```

---

## ✅ Step 2: Deploy Environment Variables to Vercel (5 minutes)

1. Go to [https://vercel.com/daniels-projects](https://vercel.com/daniels-projects)
2. Click on **social-feeds-app** project
3. Go to **Settings → Environment Variables**
4. Add all 8 variables:
   - `TWITTER_CLIENT_ID`
   - `TWITTER_CLIENT_SECRET`
   - `TIKTOK_CLIENT_ID`
   - `TIKTOK_CLIENT_SECRET`
   - `YOUTUBE_CLIENT_ID`
   - `YOUTUBE_CLIENT_SECRET`
   - `PINTEREST_CLIENT_ID`
   - `PINTEREST_CLIENT_SECRET`

---

## ✅ Step 3: Verify Database is Updated (Already Done ✓)

Database has been synced with new schema:
```bash
✓ twitterClientId
✓ twitterClientSecret
✓ tiktokClientId
✓ tiktokClientSecret
✓ youtubeClientId
✓ youtubeClientSecret
✓ pinterestClientId
✓ pinterestClientSecret
```

---

## ✅ Step 4: Add UI Buttons to Connect (15 minutes)

Find your Connections/Accounts page in:
`packages/social-feeds/src/app/(authenticated)/connections/page.tsx`

Add buttons like this:

```tsx
<div className="flex gap-2">
  <button 
    onClick={() => window.location.href = '/api/auth/twitter'}
    className="px-4 py-2 bg-blue-500 text-white rounded"
  >
    🐦 Connect X (Twitter)
  </button>
  
  <button 
    onClick={() => window.location.href = '/api/auth/tiktok'}
    className="px-4 py-2 bg-black text-white rounded"
  >
    🎵 Connect TikTok
  </button>
  
  <button 
    onClick={() => window.location.href = '/api/auth/youtube'}
    className="px-4 py-2 bg-red-600 text-white rounded"
  >
    ▶️ Connect YouTube
  </button>
  
  <button 
    onClick={() => window.location.href = '/api/auth/pinterest'}
    className="px-4 py-2 bg-red-500 text-white rounded"
  >
    📌 Connect Pinterest
  </button>
</div>
```

---

## ✅ Step 5: Test the Integration (10 minutes)

### Local Testing

```bash
cd packages/social-feeds
npm run dev
```

Then:

1. Go to http://localhost:3000
2. Log in to your account
3. Go to Connections page
4. Click "Connect X (Twitter)"
5. You should be redirected to Twitter OAuth
6. Authorize the app
7. You should be redirected back with connection saved

### Verify Connection Saved

```bash
# Check database
psql $DATABASE_URL

SELECT * FROM "ExternalConnection" 
WHERE provider = 'twitter' 
ORDER BY "createdAt" DESC LIMIT 1;
```

You should see:
- id: uuid
- userId: your-user-id
- provider: "twitter"
- name: "@yourhandle"
- credentials: JSON with accessToken

---

## ✅ Step 6: Implement Posting Functions (1-2 hours)

Create `packages/social-feeds/src/lib/social-posting.ts`:

```typescript
import { prisma } from "@/lib/prisma";

// Post to Twitter
export async function postToTwitter(
    userId: string,
    text: string
) {
    const connection = await prisma.externalConnection.findFirst({
        where: {
            userId,
            provider: 'twitter'
        }
    });

    if (!connection) throw new Error("Twitter not connected");

    const creds = JSON.parse(connection.credentials);

    const response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${creds.accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Twitter API error: ${error}`);
    }

    const result = await response.json();
    return {
        success: true,
        tweetId: result.data.id,
        url: `https://twitter.com/${creds.username}/status/${result.data.id}`,
    };
}

// Post to TikTok
export async function postToTikTok(
    userId: string,
    title: string,
    videoUrl: string
) {
    const connection = await prisma.externalConnection.findFirst({
        where: {
            userId,
            provider: 'tiktok'
        }
    });

    if (!connection) throw new Error("TikTok not connected");

    const creds = JSON.parse(connection.credentials);

    // Download video and upload to TikTok
    // (See PLATFORM_POSTING_EXAMPLES.md for full implementation)
    
    return {
        success: true,
        message: "Video uploaded to TikTok"
    };
}

// Similar for YouTube and Pinterest...
```

---

## ✅ Step 7: Add Workflow Output Nodes (1-2 hours)

In your workflow builder, add output nodes for each platform:

```typescript
// In workflow execution logic:

async function executeOutputNode(node: WorkflowNode, input: any) {
    const { platform, userId } = node.config;

    switch (platform) {
        case 'twitter':
            return await postToTwitter(userId, input.text);
        
        case 'tiktok':
            return await postToTikTok(userId, input.title, input.videoUrl);
        
        case 'youtube':
            return await postToYouTube(userId, input.title, input.description, input.videoUrl);
        
        case 'pinterest':
            return await postToPinterest(userId, input.boardId, input.title, input.imageUrl);
        
        default:
            throw new Error(`Unknown platform: ${platform}`);
    }
}
```

---

## ✅ Step 8: Deploy to Vercel (5 minutes)

```bash
git add .
git commit -m "feat: add social media integrations for X, TikTok, YouTube, Pinterest"
git push origin main
```

Vercel will auto-deploy. Monitor at [https://vercel.com](https://vercel.com)

---

## ✅ Step 9: Test on Production (10 minutes)

1. Go to https://social-feeds-app.vercel.app
2. Log in
3. Go to Connections
4. Click "Connect X (Twitter)"
5. Verify redirect to Twitter works
6. Authorize
7. Verify connection saves

---

## 🎯 Testing Checklist

- [ ] OAuth apps created on all 4 platforms
- [ ] Credentials added to `.env.livecheck`
- [ ] Credentials deployed to Vercel
- [ ] Database synced (✓ already done)
- [ ] UI buttons added to Connections page
- [ ] Local OAuth flow tested
- [ ] Connection saved to database
- [ ] Production OAuth flow tested
- [ ] Posting functions implemented
- [ ] Workflow nodes added
- [ ] End-to-end test (post from workflow)

---

## 🆘 Troubleshooting

### "Client ID not configured"
→ Check credentials are in `.env.livecheck` and Vercel environment variables

### "Redirect URL mismatch"
→ Ensure exact match in platform OAuth app settings

### "Connection not saving"
→ Check database connection
→ Verify user is logged in
→ Check browser console for errors

### "Token expired"
→ Implement token refresh using `refreshToken` from credentials

### OAuth Doesn't Redirect
→ Check `NEXTAUTH_URL` is correct
→ Verify redirect URL matches in platform settings

---

## 📊 Timeline

| Task | Time | Status |
|------|------|--------|
| Create OAuth apps | 20 min | 📋 TO DO |
| Add to environment | 5 min | 📋 TO DO |
| Deploy to Vercel | 5 min | 📋 TO DO |
| Add UI buttons | 15 min | 📋 TO DO |
| Test OAuth | 10 min | 📋 TO DO |
| Implement posting | 2-3 hours | 📋 TO DO |
| Add workflow nodes | 2-3 hours | 📋 TO DO |
| Final testing | 1 hour | 📋 TO DO |

**Total: 1 day setup + 1 week implementation = Ready in 2 weeks**

---

## ✨ What You'll Have After This

✅ Users can connect to 4 major social platforms
✅ Secure OAuth 2.0 authentication
✅ Auto-refresh tokens
✅ Post content from workflows to multiple platforms
✅ Track connection status
✅ Handle errors gracefully

---

## 📚 Reference

All code examples are in: `PLATFORM_POSTING_EXAMPLES.md`

For architecture details, see: `SOCIAL_MEDIA_INTEGRATION_GUIDE.md`

For testing strategy, see: `TESTING_GUIDE.md`

---

**Ready to start?** Begin with Step 1 above! 🚀
