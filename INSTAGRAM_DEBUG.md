# Instagram Account Integration - Debugging Session

## Objective
Get Instagram accounts to appear in the workflow editor dropdown for posting. Instagram accounts are linked in Meta Business Suite but were not being detected during the Facebook OAuth callback.

## Problem Summary
- User has Instagram account "easyai6" linked to Facebook page "Easy-AI" in Meta Business Suite
- Facebook OAuth flow was succeeding and saving the Facebook page connection
- Instagram accounts were NOT being saved to the database
- Result: Instagram account didn't appear in workflow editor dropdown

## Root Cause Analysis

### Issue 1: Missing OAuth Scopes
**Attempted Fix:** Added `instagram_graph_user_profile` scope to Facebook OAuth request
- **Result:** ❌ FAILED - Invalid scope error from Facebook
- **Lesson:** Instagram scopes don't work in standard OAuth login flow

**Attempted Fix:** Replaced with `instagram_basic` scope
- **Result:** ❌ FAILED - Also invalid scope
- **Lesson:** Instagram permissions must be configured differently than Facebook page scopes

### Issue 2: API Endpoint Permissions
**Testing:** Used `/test/facebook` endpoint to test three methods:
1. Direct `instagram_business_account` field in `/me/accounts` response
   - **Result:** ❌ Field not returned in response
   
2. Separate page query: `GET /{page-id}?fields=instagram_business_account` with page access token
   - **Result:** ❌ Returned page ID only, not Instagram data
   
3. User token endpoint: `GET /me/instagram_business_accounts`
   - **Result:** ❌ Error 100: "(#100) Tried accessing nonexisting field (instagram_business_accounts)"

**Root Cause:** Missing required permissions in the OAuth flow

## Debugging Steps Taken

### Step 1: Initial Implementation
- Created callback route to fetch pages via `/me/accounts`
- Attempted three fallback methods to fetch Instagram accounts
- Added detailed console logging for each step

### Step 2: Production Logging
Deployed detailed step-by-step logging:
```javascript
console.log('Step 1 - Direct instagram_business_account field:', { igId });
console.log('Step 2 - Separate Instagram fetch result:', JSON.stringify(igPageData));
console.log('Step 3 - Instagram accounts via user token:', JSON.stringify(igAccountsData));
```

**Production Logs Revealed:**
- Step 1: `igId: undefined` (field not present)
- Step 2: Response `{"id":"659088833948673"}` (page ID, not Instagram data)
- Step 3: Error 100 (endpoint doesn't exist for user)

### Step 3: Scope Experiments
1. Tried `instagram_graph_user_profile` → Invalid scope error
2. Tried `instagram_basic` → Invalid scope error
3. Reverted to original scopes: `pages_show_list,pages_manage_posts,pages_manage_metadata,pages_read_engagement,business_management`

### Step 4: Token-Based Approach
**Theory:** User token (not page token) should have Instagram permissions
- Method 1: Query page with user token: `GET /{page-id}?fields=instagram_business_account` using `finalUserToken`
- Method 2: Fallback to `GET /me/instagram_business_accounts` with user token

**Deployment:** Deployed this approach but caused issues with connections disappearing

### Step 5: Rollback
- Reverted to commit `b86357c` (last known good state)
- Restored user's connections

## Current State
- ✅ Facebook page connections are saving correctly
- ✅ OAuth flow completes successfully
- ❌ Instagram accounts are still not being detected
- 🟡 Need to investigate why `/me/instagram_business_accounts` endpoint returns Error 100

## What We Know
1. **Instagram IS linked** in Meta Business Suite to the page "Easy-AI"
2. **Page is being saved** correctly to database
3. **User token IS being created** (long-lived token from OAuth flow)
4. **Facebook Graph API limitations:**
   - Page access token can't see linked Instagram account
   - User token throws Error 100 on `/me/instagram_business_accounts`
   - Direct `instagram_business_account` field not returned in `/me/accounts`

## Next Steps to Try

### Option 1: Different API Endpoint
Research if there's an alternative Meta Graph endpoint for fetching Instagram accounts linked to pages:
- `/v19.0/{page-id}/instagram_accounts` (if exists)
- `/v19.0/{page-id}/connected_instagram_accounts` (if exists)

### Option 2: Check Account Type
Verify if the Instagram account needs to be a "Business Account" not just a regular account:
- May require different API endpoint or permissions
- May require Instagram Business Account to be formally connected via Meta Business Manager

### Option 3: Use Business Manager API
Try querying through the Business Manager endpoint instead:
- `GET /{business-account-id}/instagram_business_accounts`

### Option 4: Facebook App Permissions
Check if the Facebook App needs specific permissions configured in the app settings:
- Go to Facebook Developers
- Check "Instagram Basic Display" permission status
- Verify Instagram Business Account permissions

## Code Commits Made
```
40bb18e fix: use user token to fetch Instagram accounts from linked pages (REVERTED)
b86357c fix: simplify Instagram account fetching using only page access token
0a2fc79 fix: use correct instagram_basic scope instead of invalid instagram_graph_user_profile
f215ac3 fix: add instagram_graph_user_profile scope to Facebook OAuth request
103efb8 debug: add detailed logging for Instagram account detection steps
```

## Files Modified
- `packages/social-feeds/src/app/api/auth/facebook/route.ts` - OAuth scope experiments
- `packages/social-feeds/src/app/api/auth/facebook/callback/route.ts` - Instagram detection methods
- `packages/social-feeds/src/app/api/test/facebook/route.ts` - Created for testing (removed before final deployment)

## Lessons Learned
1. Instagram scopes can't be added to standard Facebook OAuth login flow
2. Page access tokens have limited permissions for Instagram data
3. The `/me/instagram_business_accounts` endpoint may require specific permissions not available through standard OAuth
4. Detailed logging is essential - the production logs showed exactly which method was failing

## Recommendations for Next Session
1. Check Meta Developer documentation for "Instagram Account Linking API"
2. Verify Instagram Business Account is properly set up in Meta Business Manager
3. Test with Meta's Graph API Explorer to manually query Instagram accounts
4. Consider if a different authentication method (App-to-App) is needed instead of user OAuth
