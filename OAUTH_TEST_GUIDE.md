# 🧪 OAuth Test Guide - Verify Everything Works

Before posting, make sure OAuth flows work correctly.

---

## Step 1: Verify Routes Are Accessible

```bash
# Check the routes exist
curl http://localhost:3000/api/auth/twitter
curl http://localhost:3000/api/auth/tiktok
curl http://localhost:3000/api/auth/youtube
curl http://localhost:3000/api/auth/pinterest

# Should see: OAuth redirect (HTTP 307) or "Client ID not configured"
```

---

## Step 2: Test with Missing Credentials (Expected to Fail)

When credentials are not set, you should see error messages:

```
GET http://localhost:3000/api/auth/twitter
Response: 400 Bad Request
{
  "error": "Twitter credentials not configured. Go to Settings → API Keys..."
}
```

This is correct behavior! It means:
- ✅ Routes are working
- ✅ Validation is in place
- ✅ Error handling is correct

---

## Step 3: Add Test Credentials

For testing, use dummy credentials first:

**Update `.env.livecheck`:**

```bash
TWITTER_CLIENT_ID="test_id_12345"
TWITTER_CLIENT_SECRET="test_secret_12345"
TIKTOK_CLIENT_ID="test_id_67890"
TIKTOK_CLIENT_SECRET="test_secret_67890"
YOUTUBE_CLIENT_ID="test_id_abcde"
YOUTUBE_CLIENT_SECRET="test_secret_abcde"
PINTEREST_CLIENT_ID="test_id_fghij"
PINTEREST_CLIENT_SECRET="test_secret_fghij"
```

Then restart server:
```bash
npm run dev
```

---

## Step 4: Test OAuth Initiation

Now test that the routes redirect correctly:

```bash
# Should redirect to Twitter OAuth
curl -L http://localhost:3000/api/auth/twitter \
  -H "Cookie: next-auth.session-token=..."

# You'll see a redirect to:
# https://twitter.com/i/oauth2/authorize?client_id=...&redirect_uri=...
```

---

## Step 5: Complete OAuth Flow (Manual)

### For X (Twitter):

1. Start dev server: `npm run dev`
2. Open browser to: http://localhost:3000
3. Log in to your test account
4. Navigate to Connections page
5. Click "Connect X (Twitter)"
6. You'll be redirected to Twitter login
7. Enter Twitter credentials
8. Click "Authorize"
9. You should be redirected back to `/connections?success=twitter`

### Check Database:

```bash
psql $DATABASE_URL

SELECT id, provider, name FROM "ExternalConnection" 
WHERE provider = 'twitter' 
ORDER BY "createdAt" DESC LIMIT 1;

# Should show your connection!
```

---

## Step 6: Verify Connection Data

Once OAuth succeeds, check the stored connection:

```bash
psql $DATABASE_URL

SELECT 
  id,
  provider,
  name,
  credentials
FROM "ExternalConnection" 
WHERE provider = 'twitter' 
LIMIT 1;

# credentials should contain:
# {
#   "accessToken": "...",
#   "refreshToken": "...",
#   "username": "@yourhandle",
#   "twitterId": "123456789",
#   "connectedAt": "2024-..."
# }
```

---

## Step 7: Test Token Refresh (for supported platforms)

Some platforms support token refresh. Test it:

```bash
# Query refresh token
SELECT credentials::json->>'refreshToken' FROM "ExternalConnection" 
WHERE provider = 'twitter' LIMIT 1;

# Should return a token (if OAuth granted offline access)
```

---

## Step 8: Test Error Handling

Test various error scenarios:

### Missing Environment Variables

1. Remove `TWITTER_CLIENT_ID` from `.env.livecheck`
2. Restart server
3. Try to visit `/api/auth/twitter`
4. Should see error: "Twitter credentials not configured"

### Invalid OAuth Code

Test callback with invalid code:

```
GET /api/auth/twitter/callback?code=invalid&state=...
```

Should redirect to `/connections?error=...`

### Invalid State Parameter

Test callback with mismatched state:

```
GET /api/auth/twitter/callback?code=...&state=invalid
```

Should redirect to `/connections?error=invalid_state`

---

## Step 9: Verify All 4 Platforms

Repeat Steps 4-8 for each platform:
- ✅ Twitter/X
- ✅ TikTok  
- ✅ YouTube
- ✅ Pinterest

---

## Testing Checklist

### Setup
- [ ] All 4 OAuth apps created on platforms
- [ ] Credentials added to `.env.livecheck`
- [ ] Database synced with new schema
- [ ] Dev server running: `npm run dev`

### Route Accessibility
- [ ] GET `/api/auth/twitter` → Redirect or error
- [ ] GET `/api/auth/tiktok` → Redirect or error
- [ ] GET `/api/auth/youtube` → Redirect or error
- [ ] GET `/api/auth/pinterest` → Redirect or error

### OAuth Flow (Per Platform)
- [ ] Click "Connect" button
- [ ] Redirected to platform login
- [ ] Authorize app
- [ ] Redirected back with success
- [ ] Connection appears in UI
- [ ] Connection saved in database

### Error Handling
- [ ] Missing credentials → Clear error message
- [ ] Invalid code → Error redirect
- [ ] Invalid state → Error redirect
- [ ] Network error → Handled gracefully

### Data Storage
- [ ] Credentials stored in database
- [ ] Access token present
- [ ] Refresh token present (if supported)
- [ ] Username saved
- [ ] Platform ID saved

---

## Expected Database Records

After completing OAuth for all 4 platforms, you should have:

```sql
SELECT provider, COUNT(*) FROM "ExternalConnection" GROUP BY provider;

-- Expected output:
-- twitter      | 1
-- tiktok       | 1
-- youtube      | 1
-- pinterest    | 1
```

---

## Common Issues During Testing

### Issue: "Redirect URL mismatch"
**Fix:** Ensure redirect URL in platform settings exactly matches:
```
http://localhost:3000/api/auth/[platform]/callback
https://yourdomain.com/api/auth/[platform]/callback
```

### Issue: Credentials not loading
**Fix:** 
1. Verify `.env.livecheck` has values
2. Restart dev server
3. Check `process.env.TWITTER_CLIENT_ID` in browser console

### Issue: OAuth doesn't redirect back
**Fix:**
1. Check `NEXTAUTH_URL` in `.env.livecheck`
2. Verify you're logged in to app
3. Check browser console for CORS errors

### Issue: Connection not saving
**Fix:**
1. Verify database connection works
2. Check user ID is correct in session
3. Look for database errors in server console

### Issue: "State mismatch" error
**Fix:**
1. Clear browser cookies
2. Try again
3. Check that request comes from same origin

---

## Test Success Criteria

You'll know it's working when:

✅ All 4 OAuth routes respond correctly
✅ Clicking "Connect [Platform]" redirects to platform
✅ After authorization, you're redirected back to app
✅ Connection appears in Connections list
✅ Connection data is saved in database
✅ Error messages are clear and helpful
✅ Logging shows successful token exchange

---

## Next Steps After Testing

Once OAuth flows work:

1. **Implement Posting Functions** (see `PLATFORM_POSTING_EXAMPLES.md`)
2. **Add Workflow Nodes** (see `IMPLEMENTATION_SUMMARY.md`)
3. **Test End-to-End** (create workflow and post to platform)
4. **Deploy to Production**

---

## Debug Commands

```bash
# Check environment variables
echo $TWITTER_CLIENT_ID
echo $TWITTER_CLIENT_SECRET

# Test database connection
psql $DATABASE_URL

# View recent connections
SELECT * FROM "ExternalConnection" ORDER BY "createdAt" DESC LIMIT 5;

# View recent errors
npm run dev 2>&1 | grep -i error

# Clear browser cookies
# Chrome DevTools → Application → Cookies → Delete all
```

---

Good luck with testing! 🚀
