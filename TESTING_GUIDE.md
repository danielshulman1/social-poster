# Social Media Integration Testing Guide

## 🧪 Complete Testing Checklist

---

## Phase 1: Setup Verification

### Test Database Migration
```bash
# 1. Run migration
cd packages/social-feeds
npx prisma migrate dev --name add_social_platforms

# 2. Verify new fields exist
psql $DATABASE_URL
\d "User"
# Should show new fields like twitterClientId, tiktokClientId, etc.
```

✅ **Success:** New fields appear in User table

### Test Environment Variables
```bash
# 1. Check .env.local has all credentials
cat .env.local | grep -E "TWITTER|TIKTOK|YOUTUBE|PINTEREST"

# 2. Expected output
TWITTER_CLIENT_ID=abc123...
TWITTER_CLIENT_SECRET=def456...
# (etc for all 4 platforms)

# 3. Restart server
npm run dev
```

✅ **Success:** Server starts without "missing credentials" errors

---

## Phase 2: OAuth Flow Testing

### Test Twitter OAuth
```
1. Open http://localhost:3000
2. Go to Connections tab
3. Click "Connect with X (Twitter)"
4. Authorize the app
5. Check redirected to /connections?success=twitter
6. Check connection appears in list
7. Verify details:
   - platform: "twitter"
   - name: "@yourhandle"
   - username: "yourhandle"
```

✅ **Success:** Connection saved to database

**Verify in database:**
```bash
psql $DATABASE_URL

SELECT * FROM "ExternalConnection" 
WHERE provider = 'twitter' AND "userId" = 'your-user-id';

# Should show:
# - id: uuid
# - userId: your-user-id
# - provider: "twitter"
# - name: "@yourhandle"
# - credentials: {accessToken, refreshToken, username, ...}
```

### Test TikTok OAuth
Repeat above steps with TikTok:
```
1. Click "Connect with TikTok"
2. Authorize
3. Verify connection saved
4. Check credentials contain: accessToken, username, tiktokId
```

### Test YouTube OAuth
```
1. Click "Connect with YouTube"
2. Google sign-in appears
3. Authorize app
4. Verify connection saved with googleId and email
```

### Test Pinterest OAuth
```
1. Click "Connect with Pinterest"
2. Authorize
3. Check credentials contain: accessToken, username
```

---

## Phase 3: Connection Management Testing

### Test Get Connections
```bash
# Test API endpoint
curl -X GET http://localhost:3000/api/connections \
  -H "Cookie: your_session_cookie"

# Expected response:
[
  {
    "id": "conn-123",
    "platform": "twitter",
    "name": "@yourhandle",
    "status": "active",
    "accessToken": "...",
    "username": "yourhandle"
  },
  ...
]
```

✅ **Success:** All connections returned

### Test Delete Connection
```bash
# Delete a connection
curl -X DELETE "http://localhost:3000/api/connections?id=conn-123" \
  -H "Cookie: your_session_cookie"

# Verify deleted
curl -X GET http://localhost:3000/api/connections \
  -H "Cookie: your_session_cookie"

# Should not appear in list
```

✅ **Success:** Connection deleted from database

### Test Disconnect & Reconnect
```
1. Go to Connections
2. Click "Disconnect" on Twitter
3. Verify removed from list
4. Click "Connect with X" again
5. Authorize
6. Should have new token
```

✅ **Success:** Tokens updated, only one active connection per platform per user

---

## Phase 4: Posting Functionality Testing

### Test Twitter Posting
```typescript
// In a test file or API route
import { postToTwitter } from '@/lib/post-handlers';

const result = await postToTwitter(
    'connection-id-from-above',
    'Hello world! This is a test tweet'
);

console.log(result);
// Should output:
// { success: true, tweetId: '123456789', url: 'https://twitter.com/...' }

// Verify tweet appears on your Twitter account
```

✅ **Success:** Tweet appears on Twitter

### Test Tweet with Image
```typescript
import { uploadMediaToTwitter, postTweetWithMedia } from '@/lib/post-handlers';

// Upload image
const mediaId = await uploadMediaToTwitter(
    connectionId,
    imageBuffer
);

// Post with image
const result = await postTweetWithMedia(
    connectionId,
    'Check this out!',
    [mediaId]
);
```

✅ **Success:** Tweet with image posted

### Test TikTok Video Upload
```typescript
import { initTikTokVideoUpload, uploadTikTokVideo, completeTikTokVideoUpload } from '@/lib/post-handlers';

// 1. Initialize
const { uploadId, uploadToken } = await initTikTokVideoUpload(
    connectionId,
    videoBuffer.length,
    'My awesome TikTok'
);

// 2. Upload video
await uploadTikTokVideo(uploadToken, videoBuffer);

// 3. Complete upload
const result = await completeTikTokVideoUpload(connectionId, uploadToken);

// Check TikTok account - video should be processing
```

✅ **Success:** Video upload initiated on TikTok

### Test YouTube Upload
```typescript
import { uploadYouTubeVideo } from '@/lib/post-handlers';

const result = await uploadYouTubeVideo(
    connectionId,
    videoBuffer,
    'My YouTube Video',
    'This is a test video description'
);

console.log(result);
// { success: true, videoId: '...', url: 'https://youtu.be/...' }

// Verify video appears in YouTube Studio
```

✅ **Success:** Video appears in YouTube Studio (processing)

### Test Pinterest Pin Creation
```typescript
import { createPinterestPin, getPinterestBoards } from '@/lib/post-handlers';

// 1. Get boards
const boards = await getPinterestBoards(connectionId);
console.log(boards); // [{ id: '...', name: 'My Board' }, ...]

// 2. Create pin
const result = await createPinterestPin(
    connectionId,
    boards[0].id,
    'My Awesome Pin',
    'This is a cool pin',
    'https://example.com/image.jpg',
    'https://example.com'
);

// Verify pin appears on board
```

✅ **Success:** Pin appears on Pinterest board

---

## Phase 5: Error Handling Testing

### Test Missing Credentials
```typescript
// Remove credentials from .env.local temporarily
// Try to connect

// Expected: 
// GET /api/auth/twitter returns:
// { error: "Twitter credentials not configured..." }
```

✅ **Success:** Clear error message

### Test Invalid Token
```typescript
// Manually edit connection in database
UPDATE "ExternalConnection" 
SET credentials = '{"accessToken":"invalid"}' 
WHERE id = 'connection-id';

// Try to post
const result = await postToTwitter(connectionId, 'test');

// Expected: Error about invalid token
```

✅ **Success:** Error handled gracefully

### Test Rate Limiting
```typescript
// Post rapidly to same endpoint

for (let i = 0; i < 100; i++) {
    await postToTwitter(connectionId, `Tweet ${i}`);
}

// After rate limit hit:
// Error: "Rate limited. Please try again later."
```

✅ **Success:** Rate limiting prevents errors (or at least detected)

### Test Network Error
```typescript
// Temporarily disconnect from internet
// Try to post

// Expected: Network timeout error
```

✅ **Success:** Network errors handled

---

## Phase 6: Workflow Integration Testing

### Test Workflow Output Node

**Scenario 1: Simple Text Post**
```
[Input: "Hello world"]
    ↓
[Twitter Output Node]
    - Connection: Select saved connection
    - Content: text from input
    ↓
[Result: Tweet posted with link]
```

✅ **Success:** Workflow executes and post succeeds

**Scenario 2: Multiple Platforms**
```
[Input: "Check this out"]
    ↓
[Twitter Output]
    ↓
[TikTok Output]
    ↓
[YouTube Output]
    ↓
[Result: All 3 posts created]
```

✅ **Success:** Multi-platform posting works

**Scenario 3: Error Handling**
```
[Bad Data Input]
    ↓
[Twitter Output] ← Invalid token
    ↓
[Error: "Token expired"]
    ↓
[Workflow fails with clear error]
```

✅ **Success:** Error message displayed to user

---

## Phase 7: Production Testing

### Pre-Deployment Checklist
```bash
# 1. Build succeeds
npm run build

# 2. No console errors
npm run dev
# Check browser console for errors

# 3. Database migrations applied
npx prisma migrate status

# 4. All tests pass
npm test

# 5. Environment vars set
echo $TWITTER_CLIENT_ID
```

### Deploy to Staging
```bash
# 1. Update OAuth redirect URLs to staging domain
# 2. Push code to staging
# 3. Run migrations on staging DB
# 4. Test OAuth flow on staging domain
# 5. Verify redirect URLs work
```

### Deploy to Production
```bash
# 1. Update OAuth redirect URLs to production domain
# 2. Push code to production
# 3. Run migrations on production DB
# 4. Set environment variables
# 5. Test OAuth flow on production
# 6. Monitor errors for 24 hours
```

---

## 📊 Performance Testing

### Load Test: Many Connections
```bash
# Create 1000 test connections
for i in {1..1000}; do
    curl -X POST /api/connections \
      -d "{platform: 'twitter', name: 'test-$i', ...}"
done

# Query all connections
curl /api/connections

# Should respond in <100ms with good indexing
```

### Load Test: Many Posts
```bash
# Post 100 times rapidly
for i in {1..100}; do
    postToTwitter(connectionId, "Test $i")
done

# Monitor:
# - API rate limiting works
# - Database doesn't lock up
# - No memory leaks
```

---

## 🔍 Monitoring & Observability

### Logs to Check
```bash
# 1. OAuth initiation
[GET] /api/auth/twitter
→ Logs state, codeVerifier, redirectUri

# 2. OAuth callback
[GET] /api/auth/twitter/callback?code=...
→ Logs token exchange, profile fetch

# 3. Posting
[POST] Post to Twitter
→ Logs response from API, success/error
```

### Metrics to Track
- OAuth success rate: `(successful_callbacks / total_initiations)`
- Post success rate: `(successful_posts / total_attempts)`
- Average response time: `(total_time / request_count)`
- Token refresh success rate: `(successful_refreshes / total_refreshes)`

---

## ✅ Full Test Coverage

### Automated Tests (Optional)
```typescript
// __tests__/social-oauth.test.ts

describe('Twitter OAuth', () => {
  it('should redirect to Twitter OAuth', async () => {
    const response = await GET('/api/auth/twitter');
    expect(response.status).toBe(307);
    expect(response.headers.location).toContain('twitter.com');
  });

  it('should handle callback and save connection', async () => {
    const response = await GET('/api/auth/twitter/callback?code=...');
    expect(response.status).toBe(307);
    
    const connection = await prisma.externalConnection.findFirst({
      where: { provider: 'twitter' }
    });
    expect(connection).toBeDefined();
  });

  it('should post to Twitter', async () => {
    const result = await postToTwitter(connectionId, 'test');
    expect(result.success).toBe(true);
    expect(result.url).toMatch(/twitter.com/);
  });
});
```

---

## 🐛 Debugging Tips

### Enable Prisma Logging
```bash
export DEBUG="prisma:*"
npm run dev
```

### Enable Next.js Debugging
```bash
DEBUG=nextjs:* npm run dev
```

### Check OAuth State
```typescript
// Add logging to route.ts
console.log('OAuth state:', { userId, codeVerifier, redirectUri });
```

### Inspect Database
```bash
psql $DATABASE_URL
SELECT * FROM "ExternalConnection" LIMIT 10;
SELECT * FROM "User" WHERE id = 'user-id';
```

---

## 📋 Test Results Template

```
Date: 2024-01-15
Tester: [Your name]

✅ Phase 1: Setup Verification
  - Database migration: PASS
  - Environment variables: PASS
  - Server starts: PASS

✅ Phase 2: OAuth Flow
  - Twitter OAuth: PASS
  - TikTok OAuth: PASS
  - YouTube OAuth: PASS
  - Pinterest OAuth: PASS

✅ Phase 3: Connection Management
  - Get connections: PASS
  - Delete connection: PASS
  - Reconnect: PASS

✅ Phase 4: Posting
  - Twitter post: PASS
  - Tweet with image: PASS
  - TikTok upload: PASS
  - YouTube upload: PASS
  - Pinterest pin: PASS

✅ Phase 5: Error Handling
  - Missing credentials: PASS
  - Invalid token: PASS
  - Network error: PASS

✅ Phase 6: Workflow Integration
  - Single platform: PASS
  - Multi-platform: PASS
  - Error handling: PASS

✅ Phase 7: Production Ready
  - Build: PASS
  - Tests: PASS
  - Deployment: PASS

Overall: READY FOR PRODUCTION ✨
```

---

Good luck with testing! Let me know if you hit any issues. 🚀
