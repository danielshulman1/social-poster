# 📱 Create OAuth Apps - Step-by-Step

I'll help you create all 4 OAuth apps. Follow these steps exactly.

---

## 1. X (Twitter) OAuth App

### Go to Developer Portal
1. Open: https://developer.twitter.com/en/portal/dashboard
2. Log in with your Twitter account (or create one)
3. Click "Create App" (or "Create an app")

### Fill in App Details
- **App name**: "Easy AI App" (or your app name)
- **App description**: "Social media automation app"
- **Website URL**: https://social-feeds-app.vercel.app
- **Use case**: "I am building an automation app"

### Select App Type
- Choose: **Native App**

### Set OAuth Permissions
1. Go to **Settings → Authentication Settings**
2. Enable **OAuth 2.0**
3. Under **App Permissions**, select:
   - ✅ Read
   - ✅ Write
   - ✅ Direct messages

### Add Redirect URLs
1. Under **OAuth 2.0 Redirect URIs**, click **Add**
2. Add both URLs:
   ```
   https://social-feeds-app.vercel.app/api/auth/twitter/callback
   http://localhost:3000/api/auth/twitter/callback
   ```

### Get Credentials
1. Go to **Keys and Tokens**
2. Click **Generate** under OAuth 2.0 Client ID and Client Secret
3. Copy both values

**Your Twitter Credentials:**
```
TWITTER_CLIENT_ID = [paste here]
TWITTER_CLIENT_SECRET = [paste here]
```

---

## 2. TikTok OAuth App

### Go to Developer Portal
1. Open: https://developers.tiktok.com
2. Click "Manage apps"
3. Click "Create app"

### Fill in App Details
- **App name**: "Easy AI App"
- **App category**: "Business Service"
- **App description**: "Social media automation"

### Select App Type
- Choose: **Web application**

### Add Redirect URLs
1. Under **Redirect URL**, click **Edit**
2. Add both URLs:
   ```
   https://social-feeds-app.vercel.app/api/auth/tiktok/callback
   http://localhost:3000/api/auth/tiktok/callback
   ```

### Get Credentials
1. Go to **App Information**
2. You'll see:
   - Client Key
   - Client Secret
3. Copy both values

**Your TikTok Credentials:**
```
TIKTOK_CLIENT_ID = [paste Client Key here]
TIKTOK_CLIENT_SECRET = [paste Client Secret here]
```

---

## 3. YouTube OAuth App

### Go to Google Cloud Console
1. Open: https://console.cloud.google.com
2. Log in with your Google account

### Create Project
1. Click the project dropdown at the top
2. Click "New Project"
3. **Project name**: "Easy AI App"
4. Click "Create"
5. Wait for project to be created

### Enable YouTube API
1. Go to **APIs & Services → Enabled APIs & Services**
2. Click **+ Enable APIs and Services**
3. Search for "YouTube Data API v3"
4. Click it
5. Click "Enable"

### Create OAuth Credentials
1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials**
3. Choose **OAuth 2.0 Client ID**
4. Choose application type: **Web application**
5. Under **Authorized redirect URIs**, click **Add URI**
6. Add both URLs:
   ```
   https://social-feeds-app.vercel.app/api/auth/youtube/callback
   http://localhost:3000/api/auth/youtube/callback
   ```
7. Click "Create"

### Get Credentials
1. A popup will show your credentials
2. Copy:
   - Client ID
   - Client Secret

**Your YouTube Credentials:**
```
YOUTUBE_CLIENT_ID = [paste here]
YOUTUBE_CLIENT_SECRET = [paste here]
```

---

## 4. Pinterest OAuth App

### Go to Developer Portal
1. Open: https://developers.pinterest.com
2. Log in with your Pinterest account (or create one)
3. Go to **My apps**

### Create App
1. Click **Create app**
2. **App name**: "Easy AI App"
3. **App description**: "Social media automation"
4. Accept terms
5. Click **Create app**

### Configure App
1. Under **App credentials**, you'll see:
   - App ID
   - App Secret
2. Copy both values

### Add Redirect URLs
1. Under **Redirect URIs**, click **Add redirect URI**
2. Add:
   ```
   https://social-feeds-app.vercel.app/api/auth/pinterest/callback
   ```
3. Click **Add redirect URI** again
4. Add:
   ```
   http://localhost:3000/api/auth/pinterest/callback
   ```

**Your Pinterest Credentials:**
```
PINTEREST_CLIENT_ID = [paste App ID here]
PINTEREST_CLIENT_SECRET = [paste App Secret here]
```

---

## ✅ Collect All Credentials

After creating all 4 apps, you should have:

```
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=

TIKTOK_CLIENT_ID=
TIKTOK_CLIENT_SECRET=

YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=

PINTEREST_CLIENT_ID=
PINTEREST_CLIENT_SECRET=
```

---

## Next Step

Once you have all 8 credentials:

1. Open `.env.livecheck` file
2. Replace the empty values with your credentials
3. Save the file
4. Restart dev server: `npm run dev`
5. Follow `OAUTH_TEST_GUIDE.md` to test

---

## Time Estimate

- X (Twitter): 5 minutes
- TikTok: 5 minutes
- YouTube: 5 minutes
- Pinterest: 5 minutes

**Total: 20 minutes**

---

## Troubleshooting

### "I can't find the credentials"
- Make sure you're on the right page
- Look for "Client ID" and "Client Secret" or "App ID" and "App Secret"
- They might be under "Keys" or "Credentials"

### "Redirect URI not working"
- Make sure URLs match exactly
- Include the trailing slash if shown
- Include both http:// and https://

### "App not approved"
- Some platforms require verification
- For testing, most apps work immediately
- If stuck, try with a business account

---

**Ready to create the apps?** Start with X (Twitter) above! 🚀
