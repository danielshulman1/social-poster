# Social Media Integration Guide
## Adding X (Twitter), TikTok, Threads, and Other Platforms

This guide covers how to add support for connecting to X (formerly Twitter), TikTok, Threads, YouTube, Pinterest, Bluesky, and other social media platforms to your app.

---

## 📋 Current Status

### ✅ Already Implemented
- **Facebook & Instagram** - Full OAuth support with multi-page selection
- **LinkedIn** - OAuth with personal + organization pages
- **Google** - OAuth for authentication

### 🚀 Ready to Implement
- **X (Twitter)** - OAuth 2.0 + Posts API v2
- **TikTok** - OAuth + Video Upload API
- **Threads** - Meta platform (Instagram API integration)
- **YouTube** - OAuth + Videos API
- **Pinterest** - OAuth + Boards API
- **Bluesky** - Public API (no OAuth yet)

---

## 🏗️ Architecture Overview

Your app uses a flexible connection system:
1. **OAuth Flow** → Redirects user to platform → Returns auth code
2. **Token Exchange** → App exchanges code for access token
3. **Profile Fetch** → Get user/page info
4. **Database Storage** → Store credentials in `ExternalConnection` table
5. **Workflow Integration** → Use connections in post workflows

All platforms follow the same pattern as LinkedIn's implementation.

---

## 🚀 Implementation Steps

### Step 1: Create OAuth Apps

#### X (Twitter)
1. Go to [developer.twitter.com/en/portal/dashboard](https://developer.twitter.com/en/portal/dashboard)
2. Create a new App → Choose "Production"
3. Copy:
   - **Client ID**
   - **Client Secret**
4. In "App Settings" → OAuth 2.0 Redirect URLs:
   - Add: `http://localhost:3000/api/auth/twitter/callback`
   - Add: `https://yourdomain.com/api/auth/twitter/callback`

#### TikTok
1. Go to [developers.tiktok.com](https://developers.tiktok.com)
2. Create Business Account → New App
3. Copy:
   - **Client Key**
   - **Client Secret**
4. Add Redirect URL:
   - `http://localhost:3000/api/auth/tiktok/callback`
   - `https://yourdomain.com/api/auth/tiktok/callback`

#### Threads
Uses Instagram's API, configure in your existing Facebook App:
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Open your Facebook App
3. Add "Threads" product
4. Threads shares credentials with Instagram

#### YouTube
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create OAuth 2.0 credential (Desktop/Web App)
3. Copy:
   - **Client ID**
   - **Client Secret**
4. Add Redirect URL:
   - `http://localhost:3000/api/auth/youtube/callback`

#### Pinterest
1. Go to [developers.pinterest.com](https://developers.pinterest.com)
2. Create Business App
3. Copy:
   - **App ID**
   - **App Secret**
4. Add Redirect URL:
   - `http://localhost:3000/api/auth/pinterest/callback`

#### Bluesky
1. Go to [bsky.app](https://bsky.app) - Create account
2. Go to Settings → Developer → App Passwords
3. Generate new password (this is your "access token")
4. Store handle and password (users will add manually)

### Step 2: Update User Model (Database)

Add fields to store platform-specific credentials in [packages/social-feeds/prisma/schema.prisma](packages/social-feeds/prisma/schema.prisma):

```prisma
model User {
  // ... existing fields ...

  // X (Twitter)
  twitterClientId        String?
  twitterClientSecret    String?

  // TikTok
  tiktokClientId         String?
  tiktokClientSecret     String?

  // YouTube
  youtubeClientId        String?
  youtubeClientSecret    String?

  // Pinterest
  pinterestClientId      String?
  pinterestClientSecret  String?

  // Threads - uses existing facebookAppId/facebookAppSecret
  // Bluesky - users add manually
}
```

Then run:
```bash
cd packages/social-feeds
npx prisma migrate dev --name add_social_platforms
```

### Step 3: Update Environment Variables

Add to [.env.example](.env.example):

```bash
# ============================================================================
# X (TWITTER)
# ============================================================================
TWITTER_CLIENT_ID="your_twitter_client_id_here"
TWITTER_CLIENT_SECRET="your_twitter_client_secret_here"

# ============================================================================
# TIKTOK
# ============================================================================
TIKTOK_CLIENT_ID="your_tiktok_client_id_here"
TIKTOK_CLIENT_SECRET="your_tiktok_client_secret_here"

# ============================================================================
# YOUTUBE
# ============================================================================
YOUTUBE_CLIENT_ID="your_youtube_client_id_here"
YOUTUBE_CLIENT_SECRET="your_youtube_client_secret_here"

# ============================================================================
# PINTEREST
# ============================================================================
PINTEREST_CLIENT_ID="your_pinterest_client_id_here"
PINTEREST_CLIENT_SECRET="your_pinterest_client_secret_here"

# ============================================================================
# THREADS
# ============================================================================
# Uses existing FACEBOOK_APP_ID and FACEBOOK_APP_SECRET

# ============================================================================
# BLUESKY
# ============================================================================
# Users will add credentials manually via Settings → API Keys
```

### Step 4: Create OAuth Route Handlers

Create files following the LinkedIn pattern:

#### X (Twitter)
**File:** `packages/social-feeds/src/app/api/auth/twitter/route.ts`

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

const normalizeEnv = (value?: string | null) =>
    (value || "").trim().replace(/^["']|["']$/g, "");

const getAppBaseUrl = (requestUrl: string) => {
    const configuredBase =
        normalizeEnv(process.env.NEXTAUTH_URL) ||
        normalizeEnv(process.env.NEXT_PUBLIC_APP_URL);

    if (configuredBase) return configuredBase;

    const vercelUrl = normalizeEnv(process.env.VERCEL_URL);
    if (vercelUrl) {
        return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
    }

    try {
        return new URL(requestUrl).origin;
    } catch {
        return "";
    }
};

export async function GET(req: Request) {
    const baseUrl = getAppBaseUrl(req.url) || 'http://localhost:3000';
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return NextResponse.redirect(new URL('/login', baseUrl));
    }

    // Read user's Twitter credentials from DB
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { twitterClientId: true, twitterClientSecret: true },
    });

    if (!user?.twitterClientId || !user?.twitterClientSecret) {
        return NextResponse.json(
            { error: "Twitter credentials not configured. Go to Settings → API Keys to add your Twitter Client ID and Secret." },
            { status: 400 }
        );
    }

    const redirectUri = `${baseUrl}/api/auth/twitter/callback`;
    const codeChallenge = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    
    const state = Buffer.from(JSON.stringify({ userId: session.user.id })).toString('base64');
    
    const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', user.twitterClientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'tweet.read tweet.write users.read follows.read follows.write');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    return NextResponse.redirect(authUrl.toString());
}
```

**File:** `packages/social-feeds/src/app/api/auth/twitter/callback/route.ts`

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const normalizeEnv = (value?: string | null) =>
    (value || "").trim().replace(/^["']|["']$/g, "");

const getAppBaseUrl = (requestUrl: string) => {
    const configuredBase =
        normalizeEnv(process.env.NEXTAUTH_URL) ||
        normalizeEnv(process.env.NEXT_PUBLIC_APP_URL);

    if (configuredBase) return configuredBase;

    const vercelUrl = normalizeEnv(process.env.VERCEL_URL);
    if (vercelUrl) {
        return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
    }

    try {
        return new URL(requestUrl).origin;
    } catch {
        return "";
    }
};

export async function GET(req: Request) {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    const baseUrl = getAppBaseUrl(req.url) || 'http://localhost:3000';

    if (error) {
        return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
        return NextResponse.redirect(`${baseUrl}/connections?error=missing_params`);
    }

    let userId: string;
    try {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
        userId = decoded.userId;
    } catch {
        return NextResponse.redirect(`${baseUrl}/connections?error=invalid_state`);
    }

    // Read user's Twitter credentials
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { twitterClientId: true, twitterClientSecret: true },
    });

    if (!user?.twitterClientId || !user?.twitterClientSecret) {
        return NextResponse.redirect(`${baseUrl}/connections?error=missing_twitter_config`);
    }

    const redirectUri = `${baseUrl}/api/auth/twitter/callback`;

    try {
        // Exchange code for access token
        const tokenRes = await fetch('https://twitter.com/2/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                client_id: user.twitterClientId,
                client_secret: user.twitterClientSecret,
            }),
        });

        const tokenData = await tokenRes.json();
        if (!tokenRes.ok || !tokenData.access_token) {
            console.error('Twitter token error:', tokenData);
            return NextResponse.redirect(`${baseUrl}/connections?error=token_failed`);
        }

        // Get user profile
        const profileRes = await fetch('https://api.twitter.com/2/users/me', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
        });
        const profileData = await profileRes.json();

        if (!profileRes.ok || !profileData.data?.id) {
            console.error('Twitter profile error:', profileData);
            return NextResponse.redirect(`${baseUrl}/connections?error=twitter_profile_failed`);
        }

        const displayName = profileData.data.name || profileData.data.username || 'Twitter Account';
        const twitterId = profileData.data.id;
        const twitterHandle = profileData.data.username;

        // Keep one active Twitter connection per user
        await prisma.externalConnection.deleteMany({
            where: { userId, provider: 'twitter' },
        });

        // Save connection
        await prisma.externalConnection.create({
            data: {
                userId,
                provider: 'twitter',
                name: `@${twitterHandle}`,
                credentials: JSON.stringify({
                    accessToken: tokenData.access_token,
                    refreshToken: tokenData.refresh_token,
                    expiresIn: tokenData.expires_in,
                    username: twitterHandle,
                    twitterId,
                    connectedAt: new Date().toISOString(),
                }),
            },
        });

        return NextResponse.redirect(`${baseUrl}/connections?success=twitter`);
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'twitter_callback_failed';
        console.error('Twitter callback error:', err);
        return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(errorMessage)}`);
    }
}
```

#### Similar files needed for:
- **TikTok** - `packages/social-feeds/src/app/api/auth/tiktok/{route.ts,callback/route.ts}`
- **YouTube** - `packages/social-feeds/src/app/api/auth/youtube/{route.ts,callback/route.ts}`
- **Pinterest** - `packages/social-feeds/src/app/api/auth/pinterest/{route.ts,callback/route.ts}`
- **Threads** - Extend existing Facebook route (reuse Facebook OAuth)

(See API references below for platform-specific endpoints and scopes)

### Step 5: Update Settings UI

In your Connections page (`packages/social-feeds/src/app/connections` or similar), add buttons for each platform:

```tsx
// Add these buttons alongside existing Facebook/LinkedIn buttons
<button onClick={() => window.location.href = '/api/auth/twitter'}>
  Connect with X (Twitter)
</button>

<button onClick={() => window.location.href = '/api/auth/tiktok'}>
  Connect with TikTok
</button>

<button onClick={() => window.location.href = '/api/auth/youtube'}>
  Connect with YouTube
</button>

<button onClick={() => window.location.href = '/api/auth/pinterest'}>
  Connect with Pinterest
</button>

<button onClick={() => window.location.href = '/api/auth/threads'}>
  Connect with Threads
</button>
```

### Step 6: Update Workflow Output Nodes

In your workflow builder, add output nodes for new platforms:
- **Twitter Output Node** - Post tweets, replies
- **TikTok Output Node** - Schedule videos
- **YouTube Output Node** - Upload/schedule videos
- **Pinterest Output Node** - Create pins
- **Threads Output Node** - Post to Threads

---

## 📚 Platform-Specific Implementation Details

### X (Twitter) / Posts API v2

**OAuth Scopes:**
```
tweet.read tweet.write users.read follows.read follows.write offline.access
```

**Post a Tweet:**
```bash
curl -X POST https://api.twitter.com/2/tweets \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Your tweet text here"}'
```

**Required fields in credentials:**
- `accessToken` - Bearer token
- `refreshToken` - For token refresh
- `username` - Twitter handle

---

### TikTok

**OAuth Scopes:**
```
user.info.basic video.list video.upload
```

**Upload Video:**
```bash
# First, initialize upload
curl -X POST https://open.tiktokapis.com/v1/post/publish/video/init/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source_info": {
      "source": "FILE_UPLOAD",
      "video_size": 12345
    },
    "post_info": {
      "title": "My TikTok Video",
      "privacy_level": "PUBLIC_TO_EVERYONE"
    }
  }'

# Upload file
# Then complete the upload
```

**Required fields:**
- `accessToken` - Bearer token
- `username` - TikTok handle
- `userId` - TikTok user ID

---

### Threads (via Instagram)

Uses your existing Facebook OAuth setup. Add:

**Get Instagram ID from Facebook:**
```bash
curl -X GET "https://graph.instagram.com/v18.0/me/instagram_business_account" \
  -H "Authorization: Bearer $PAGE_ACCESS_TOKEN"
```

**Post to Threads:**
```bash
curl -X POST https://graph.instagram.com/v18.0/{INSTAGRAM_BUSINESS_ACCOUNT_ID}/threads \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "media_type=TEXT&text=Hello Threads!"
```

**Note:** Threads API is still in early access. Use same credentials as Instagram.

---

### YouTube

**OAuth Scopes:**
```
https://www.googleapis.com/auth/youtube.upload
https://www.googleapis.com/auth/youtube
```

**Upload Video:**
```bash
curl -X POST https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "snippet": {
      "title": "My Video Title",
      "description": "Video description",
      "tags": ["tag1", "tag2"]
    },
    "status": {
      "privacyStatus": "PUBLIC"
    }
  }'
```

---

### Pinterest

**OAuth Scopes:**
```
boards:read user_accounts:read pins:create pins:read
```

**Create a Pin:**
```bash
curl -X POST https://api.pinterest.com/v5/pins \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "board_id": "123456789",
    "title": "My Pin Title",
    "description": "Pin description",
    "link": "https://example.com",
    "media_upload": {
      "upload_id": "abcd1234"
    }
  }'
```

---

### Bluesky

No OAuth yet - users add manually. Create a manual credentials form:

**Storage format:**
```json
{
  "handle": "user.bsky.social",
  "appPassword": "xxxx-xxxx-xxxx-xxxx"
}
```

**Post to Bluesky:**
```bash
# First authenticate
curl -X POST https://bsky.social/xrpc/com.atproto.server.createSession \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "user.bsky.social",
    "password": "appPassword"
  }'

# Then create a post
curl -X POST https://bsky.social/xrpc/com.atproto.repo.createRecord \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "repo": "did:key:...",
    "collection": "app.bsky.feed.post",
    "record": {
      "$type": "app.bsky.feed.post",
      "text": "Your post text",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }'
```

---

## 🔒 Security Considerations

1. **Never commit secrets** - Use `.env.local` for development
2. **Encrypt credentials in database** - Consider adding encryption to `ExternalConnection.credentials`
3. **Token rotation** - Implement automatic refresh for tokens with expiry
4. **Scopes** - Request minimum required scopes for each platform
5. **PKCE** - Used for X (Twitter) to prevent code interception

Example encryption:
```typescript
import crypto from 'crypto';

const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
const encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex') + cipher.final('hex');
```

---

## 🧪 Testing

### Manual Testing Steps:

1. **Add platform credentials** to `.env.local`
2. **Run migrations**: `npx prisma migrate dev`
3. **Start dev server**: `npm run dev` or `pnpm dev`
4. **Go to Connections** tab
5. **Click "Connect [Platform]"** button
6. **Authorize** the app
7. **Verify** connection appears in list
8. **Test posting** in workflow

### API Testing:

```bash
# Test Twitter connection
curl -X GET http://localhost:3000/api/connections \
  -H "Cookie: your_session_cookie"

# Manual token entry
curl -X POST http://localhost:3000/api/connections \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "bluesky",
    "name": "My Bluesky",
    "handle": "user.bsky.social",
    "appPassword": "xxxx-xxxx-xxxx-xxxx"
  }'
```

---

## 📊 API Rate Limits

| Platform | Limit | Window |
|----------|-------|--------|
| X/Twitter | 300 | 15 min |
| TikTok | 1000 | 1 hour |
| YouTube | 10,000 | 1 day |
| Pinterest | 200 | 1 hour |
| Bluesky | 1000 | 5 min |

Add rate limiting to your API:
```typescript
import Ratelimit from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 h"),
});

const { success } = await ratelimit.limit(userId);
if (!success) return new Response('Rate limited', { status: 429 });
```

---

## ✅ Checklist

- [ ] Create OAuth apps for all platforms
- [ ] Add client IDs and secrets to `.env.example`
- [ ] Update Prisma schema with new fields
- [ ] Run database migration
- [ ] Create OAuth route handlers for each platform
- [ ] Create callback handlers for each platform
- [ ] Update Connections UI with new buttons
- [ ] Add workflow output nodes for new platforms
- [ ] Test each integration with manual OAuth flow
- [ ] Test posting to each platform
- [ ] Add error handling and user feedback
- [ ] Document in README
- [ ] Deploy and test on production domain
- [ ] Add to CI/CD environment variables

---

## 📖 Additional Resources

- [OAuth 2.0 Flow](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [PKCE for Single Page Apps](https://datatracker.ietf.org/doc/html/rfc7636)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Client ID not configured" | Check `.env.local` has `TWITTER_CLIENT_ID=...` and server is restarted |
| Callback URL mismatch | Ensure redirect URI in OAuth app exactly matches `/api/auth/[platform]/callback` |
| Token expired error | Implement token refresh using `refreshToken` for platforms that support it |
| User can't see connection | Check database query in `/api/connections` GET endpoint |
| Post fails silently | Add logging to workflow execution and check platform API responses |

---

Good luck! 🚀 Your app will soon be connected to all major social platforms!
