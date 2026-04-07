# Social Media Integration - Quick Reference

## 📋 TL;DR Setup (5 minutes)

### 1. Create OAuth Apps
Visit each platform and create an app:
- [X/Twitter](https://developer.twitter.com/en/portal/dashboard)
- [TikTok](https://developers.tiktok.com)
- [YouTube](https://console.cloud.google.com)
- [Pinterest](https://developers.pinterest.com)

Add redirect URL (for each):
```
http://localhost:3000/api/auth/[platform]/callback
https://yourdomain.com/api/auth/[platform]/callback
```

### 2. Add to `.env.local`
```bash
TWITTER_CLIENT_ID=...
TWITTER_CLIENT_SECRET=...
TIKTOK_CLIENT_ID=...
TIKTOK_CLIENT_SECRET=...
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...
PINTEREST_CLIENT_ID=...
PINTEREST_CLIENT_SECRET=...
```

### 3. Run Migration
```bash
cd packages/social-feeds
npx prisma migrate dev --name add_social_platforms
```

### 4. Restart Dev Server
```bash
npm run dev
```

### 5. Add Connect Buttons
In your Connections page:
```tsx
<button onClick={() => window.location.href = '/api/auth/twitter'}>
  Connect Twitter
</button>
```

### 6. Test
Click button → authorize → check connections list

---

## 🔗 API Endpoints

### OAuth Flow
```
GET /api/auth/[platform]           → Redirect to platform
GET /api/auth/[platform]/callback  → Handle OAuth callback
```

### Connection Management
```
GET  /api/connections              → List user's connections
POST /api/connections              → Add manual connection
DELETE /api/connections?id=...     → Delete connection
```

---

## 📱 Posting Code

### Quick Post to Twitter
```typescript
import { postToTwitter } from '@/lib/post-handlers';

await postToTwitter(connectionId, 'Hello world!');
```

### Other Platforms
See `PLATFORM_POSTING_EXAMPLES.md` for:
- TikTok video upload
- YouTube video upload
- Pinterest pin creation
- Bluesky posting

---

## 🔑 Platform Info

| Platform | Auth Type | Rate Limit | Refresh Token | Media |
|----------|-----------|-----------|---|---|
| X/Twitter | OAuth 2.0 | 300/15min | ✅ | Image, Video |
| TikTok | OAuth 2.0 | 1000/hr | ✅ | Video only |
| YouTube | OAuth 2.0 | 10K/day | ✅ | Video |
| Pinterest | OAuth 2.0 | 200/hr | ❌ | Image, Gif |

---

## 📂 Files Created

```
packages/social-feeds/src/app/api/auth/
├── twitter/{route.ts, callback/route.ts}
├── tiktok/{route.ts, callback/route.ts}
├── youtube/{route.ts, callback/route.ts}
└── pinterest/{route.ts, callback/route.ts}
```

Database schema updated in:
```
packages/social-feeds/prisma/schema.prisma
```

---

## 🧪 Test OAuth Flow

1. Add credentials to `.env.local`
2. Restart server
3. Click "Connect [Platform]"
4. Authorize the app
5. Should redirect back with success

---

## ✅ Checklist

- [ ] Create 4 OAuth apps
- [ ] Copy credentials to `.env.local`
- [ ] Run migration: `npx prisma migrate dev`
- [ ] Restart dev server: `npm run dev`
- [ ] Add Connect buttons to UI
- [ ] Test OAuth flow for each
- [ ] Implement posting functions
- [ ] Test workflow integration
- [ ] Deploy to production

---

## 🐛 Common Issues

| Issue | Fix |
|-------|-----|
| "Client ID not configured" | Check `.env.local`, restart server |
| Redirect URL mismatch | Ensure exact match in platform settings |
| Connection not saving | Check database, run migration |
| Token expired | Implement token refresh (see examples) |
| Rate limited | Implement queue/backoff strategy |

---

## 📚 Full Documentation

- **Setup Guide:** `SOCIAL_PLATFORMS_SETUP.md`
- **Code Examples:** `PLATFORM_POSTING_EXAMPLES.md`
- **Architecture:** `SOCIAL_MEDIA_INTEGRATION_GUIDE.md`
- **Implementation:** `IMPLEMENTATION_SUMMARY.md`

---

## 🚀 Ready to go!

Your app can now connect to:
- ✅ X (Twitter)
- ✅ TikTok
- ✅ YouTube
- ✅ Pinterest
- ✅ Facebook & Instagram (existing)
- ✅ LinkedIn (existing)

Plus Threads and Bluesky with manual setup.

---

**Time needed:** 5 min setup + 10 min testing = 15 minutes to go live 🎉
