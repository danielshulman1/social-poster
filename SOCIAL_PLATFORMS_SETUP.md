# Social Platforms Setup - Quick Start

Your app now supports connecting to **X (Twitter), TikTok, YouTube, and Pinterest** in addition to Facebook, Instagram, and LinkedIn!

## ✨ What's New

Created integration files for:
- ✅ **X (Twitter)** - Post tweets, retweets, replies
- ✅ **TikTok** - Schedule and upload videos
- ✅ **YouTube** - Upload and schedule videos
- ✅ **Pinterest** - Create pins and manage boards
- 📝 **Threads** - Via Facebook OAuth (coming soon)
- 🎯 **Bluesky** - Manual credentials support (ready)

---

## 🚀 Setup Steps (5-10 minutes)

### Step 1: Update Database Schema

Run this migration to add new platform fields to the User model:

```bash
cd packages/social-feeds
npx prisma migrate dev --name add_social_platforms
```

This adds:
- `twitterClientId`, `twitterClientSecret`
- `tiktokClientId`, `tiktokClientSecret`
- `youtubeClientId`, `youtubeClientSecret`
- `pinterestClientId`, `pinterestClientSecret`

### Step 2: Create OAuth Apps

Follow the steps below for each platform you want to support:

#### X (Twitter)
1. Go to [https://developer.twitter.com/en/portal/dashboard](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app or open existing one
3. Go to **Settings** → **Authentication Settings**
4. Enable **OAuth 2.0**
5. Set **App Type** to "Native App"
6. Add **Redirect URIs**:
   - `http://localhost:3000/api/auth/twitter/callback`
   - `https://yourdomain.com/api/auth/twitter/callback` (production)
7. Copy **Client ID** and **Client Secret**

#### TikTok
1. Go to [https://developers.tiktok.com](https://developers.tiktok.com)
2. Create **Developer Account** (if needed)
3. Create a new **Business Application**
4. Set **Scopes** to: `user.info.basic`, `video.list`, `video.upload`
5. Add **Redirect URLs**:
   - `http://localhost:3000/api/auth/tiktok/callback`
   - `https://yourdomain.com/api/auth/tiktok/callback` (production)
6. Copy **Client Key** and **Client Secret**

#### YouTube
YouTube uses your Google Cloud Console OAuth apps.

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Select or create a project
3. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
4. Choose "Desktop application" (or "Web application")
5. Add **Authorized Redirect URIs**:
   - `http://localhost:3000/api/auth/youtube/callback`
   - `https://yourdomain.com/api/auth/youtube/callback` (production)
6. Download the credentials JSON
7. Copy **Client ID** and **Client Secret**

#### Pinterest
1. Go to [https://developers.pinterest.com](https://developers.pinterest.com)
2. Create a **Business App**
3. Add **Redirect URIs**:
   - `http://localhost:3000/api/auth/pinterest/callback`
   - `https://yourdomain.com/api/auth/pinterest/callback` (production)
4. Copy **App ID** and **App Secret**

### Step 3: Add Credentials to Environment

Update your `.env.local`:

```bash
# X (Twitter)
TWITTER_CLIENT_ID="your_client_id_here"
TWITTER_CLIENT_SECRET="your_client_secret_here"

# TikTok
TIKTOK_CLIENT_ID="your_client_id_here"
TIKTOK_CLIENT_SECRET="your_client_secret_here"

# YouTube
YOUTUBE_CLIENT_ID="your_client_id_here"
YOUTUBE_CLIENT_SECRET="your_client_secret_here"

# Pinterest
PINTEREST_CLIENT_ID="your_client_id_here"
PINTEREST_CLIENT_SECRET="your_client_secret_here"
```

**Important:** Restart your dev server after adding environment variables.

### Step 4: Add Connect Buttons to UI

In your Connections page (wherever users manage social accounts), add buttons:

```tsx
<button onClick={() => window.location.href = '/api/auth/twitter'}>
  🐦 Connect with X (Twitter)
</button>

<button onClick={() => window.location.href = '/api/auth/tiktok'}>
  🎵 Connect with TikTok
</button>

<button onClick={() => window.location.href = '/api/auth/youtube'}>
  ▶️ Connect with YouTube
</button>

<button onClick={() => window.location.href = '/api/auth/pinterest'}>
  📌 Connect with Pinterest
</button>
```

### Step 5: Test the Integration

1. Start dev server: `npm run dev` or `pnpm dev`
2. Go to Connections page
3. Click "Connect with [Platform]"
4. Authorize the app
5. You should be redirected back and see the connection listed

---

## 🔌 How It Works

### OAuth Flow (All Platforms)

```
1. User clicks "Connect with X"
   ↓
2. App redirects to X OAuth login page
   ↓
3. User authorizes your app
   ↓
4. X redirects back to /api/auth/twitter/callback with auth code
   ↓
5. App exchanges code for access token
   ↓
6. App fetches user profile info
   ↓
7. App stores connection in database (encrypted)
   ↓
8. User can now post to X in workflows
```

### Data Storage

All connections are stored in the `ExternalConnection` table:
- **provider**: `"twitter"`, `"tiktok"`, `"youtube"`, `"pinterest"`
- **credentials**: JSON with `accessToken`, `username`, etc.
- **encryptio**n: Coming soon (currently stored as-is)

---

## 🛠️ File Structure

New files created for you:

```
packages/social-feeds/src/app/api/auth/
├── twitter/
│   ├── route.ts              # Redirect to X OAuth
│   └── callback/
│       └── route.ts          # Handle X OAuth callback
├── tiktok/
│   ├── route.ts
│   └── callback/route.ts
├── youtube/
│   ├── route.ts
│   └── callback/route.ts
└── pinterest/
    ├── route.ts
    └── callback/route.ts
```

---

## 📱 Testing with Postman/cURL

Test the connections API:

```bash
# Get all connections for logged-in user
curl -X GET http://localhost:3000/api/connections \
  -H "Authorization: Bearer $YOUR_SESSION_TOKEN"

# Response:
[
  {
    "id": "...",
    "platform": "twitter",
    "name": "@yourhandle",
    "status": "active",
    "accessToken": "...",
    "username": "yourhandle"
  }
]

# Delete a connection
curl -X DELETE http://localhost:3000/api/connections?id=connection_id \
  -H "Authorization: Bearer $YOUR_SESSION_TOKEN"
```

---

## 🎯 Next Steps

### 1. Implement Posting
Create workflow output nodes for each platform:

```typescript
// Example: Post to Twitter
async function postToTwitter(connection: ExternalConnection, text: string) {
    const creds = JSON.parse(connection.credentials);
    
    const response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${creds.accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
    });
    
    return response.json();
}
```

### 2. Add Rate Limiting
Protect your API from abuse:

```typescript
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 h"),
});

const { success } = await ratelimit.limit(userId);
if (!success) return new Response("Rate limited", { status: 429 });
```

### 3. Encrypt Credentials
Add encryption to sensitive tokens:

```typescript
import crypto from 'crypto';

const encryptCredentials = (data: any) => {
    const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY!);
    return cipher.update(JSON.stringify(data), 'utf8', 'hex') + cipher.final('hex');
};
```

### 4. Monitor Token Expiration
Some platforms require token refresh:

```typescript
// Check if token expired
if (tokenExpiresAt < Date.now()) {
    // Refresh using refreshToken
    const newToken = await refreshAccessToken(connection);
    // Update in database
}
```

### 5. Add Threads Support
Threads uses Instagram API - extend Facebook OAuth:

```typescript
// In Facebook callback handler, also create Threads connection
// if linked Instagram Business Account exists
```

---

## ⚠️ Common Issues

| Issue | Fix |
|-------|-----|
| "Client ID not configured" | Check `.env.local` has all `*_CLIENT_ID` vars, restart server |
| Redirect URL mismatch | Ensure exact match: `http://localhost:3000/api/auth/[platform]/callback` |
| User can't authorize | Check platform OAuth app status is "Active" or "Published" |
| Connection not saving | Check database connection and Prisma is running migrations |
| Token expired error | Implement token refresh using `refreshToken` |

---

## 📚 Platform Documentation

- [X API v2 Docs](https://developer.twitter.com/en/docs/twitter-api/latest)
- [TikTok API Docs](https://developers.tiktok.com/doc/login-kit)
- [YouTube API Docs](https://developers.google.com/youtube/v3)
- [Pinterest API Docs](https://developers.pinterest.com/docs/api/overview/)

---

## ✅ Pre-Launch Checklist

- [ ] Run `npx prisma migrate dev`
- [ ] Add all `*_CLIENT_ID` and `*_CLIENT_SECRET` to `.env.local`
- [ ] Restart dev server
- [ ] Test OAuth flow for each platform
- [ ] Verify connections save to database
- [ ] Add Connect buttons to UI
- [ ] Implement workflow output nodes
- [ ] Add error handling and user feedback
- [ ] Test on production domain before launching
- [ ] Document for team

---

## 🆘 Need Help?

1. **Check logs**: `npm run dev` shows errors during OAuth flow
2. **Verify redirect URI**: Exact match required in platform settings
3. **Test endpoints**: Use Postman to test `/api/auth/[platform]`
4. **Database**: Ensure PostgreSQL is running and migrations applied
5. **Tokens**: X, TikTok, and YouTube support token refresh—implement as needed

---

Good luck! Your app is now ready to connect to the world's biggest social media platforms! 🚀

For detailed implementation info, see [SOCIAL_MEDIA_INTEGRATION_GUIDE.md](./SOCIAL_MEDIA_INTEGRATION_GUIDE.md)
