# 🔐 OAuth Credentials - Paste Your Credentials Here

After creating the OAuth apps, paste your credentials below.

---

## 1. X (Twitter) Credentials

From: https://developer.twitter.com/en/portal/dashboard → Keys and Tokens

```
TWITTER_CLIENT_ID=

TWITTER_CLIENT_SECRET=
```

---

## 2. TikTok Credentials

From: https://developers.tiktok.com → App Information

```
TIKTOK_CLIENT_ID=

TIKTOK_CLIENT_SECRET=
```

---

## 3. YouTube Credentials

From: https://console.cloud.google.com → Credentials

```
YOUTUBE_CLIENT_ID=

YOUTUBE_CLIENT_SECRET=
```

---

## 4. Pinterest Credentials

From: https://developers.pinterest.com → My apps → Credentials

```
PINTEREST_CLIENT_ID=

PINTEREST_CLIENT_SECRET=
```

---

## How to Use

1. Fill in all 8 values above
2. Copy each pair
3. Open `.env.livecheck` in your project
4. Paste into corresponding environment variables
5. Save the file
6. Restart dev server: `npm run dev`

---

## Example

If you got:

From Twitter:
- Client ID: `abc123xyz`
- Client Secret: `secret456`

You would add to `.env.livecheck`:
```
TWITTER_CLIENT_ID=abc123xyz
TWITTER_CLIENT_SECRET=secret456
```

---

**Need help creating the apps?** See `CREATE_OAUTH_APPS.md`
