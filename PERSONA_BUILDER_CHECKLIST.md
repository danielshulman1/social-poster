# Persona Builder Implementation Checklist

Complete this checklist to ensure your persona builder is fully set up and working.

## ✅ Database Setup

- [ ] Run SQL migration from `supabase/migrations/20260412_create_user_personas.sql`
- [ ] Verify three tables exist in Supabase:
  - [ ] `user_personas`
  - [ ] `user_onboarding_progress`
  - [ ] `user_social_connections`
- [ ] Verify RLS policies are enabled on all tables
- [ ] Test RLS policies with a test user query

## ✅ Environment Variables

- [ ] Copy `.env.example` to `.env.local` in frontend directory
- [ ] Fill in Supabase credentials:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (for server-side operations if needed)
- [ ] Fill in OpenAI API key:
  - [ ] `OPENAI_API_KEY`
- [ ] Fill in OAuth credentials (or mark as optional if not using):
  - [ ] `FACEBOOK_APP_ID` & `FACEBOOK_APP_SECRET`
  - [ ] `INSTAGRAM_APP_ID` & `INSTAGRAM_APP_SECRET`
  - [ ] `LINKEDIN_APP_ID` & `LINKEDIN_APP_SECRET`
- [ ] Set `NEXT_PUBLIC_APP_URL`:
  - [ ] Local: `http://localhost:3000`
  - [ ] Production: Your Vercel domain

## ✅ Dependencies

- [ ] Run `pnpm install` in frontend directory
- [ ] Verify installation of:
  - [ ] `@supabase/supabase-js`
  - [ ] `openai`
- [ ] Verify Node modules don't have errors: `pnpm ls` in frontend directory

## ✅ File Structure

Created files should exist at:
- [ ] `frontend/src/lib/supabase.ts` - Supabase client and types
- [ ] `frontend/src/components/onboarding/interview-step.tsx` - Interview component
- [ ] `frontend/src/components/onboarding/posts-step.tsx` - Posts collection component
- [ ] `frontend/src/components/onboarding/persona-confirmation.tsx` - Confirmation page
- [ ] `frontend/src/app/onboarding/page.tsx` - Main onboarding orchestrator
- [ ] `frontend/src/app/api/onboarding/generate-persona/route.ts` - Persona generation API
- [ ] `frontend/src/app/api/oauth/initiate/route.ts` - OAuth initiation
- [ ] `frontend/src/app/api/oauth/callback/route.ts` - OAuth callback handler
- [ ] `frontend/.env.example` - Environment variable template
- [ ] `PERSONA_BUILDER_SETUP.md` - Setup documentation
- [ ] `PERSONA_BUILDER_CHECKLIST.md` - This checklist

## ✅ OAuth Setup (if using social media imports)

For each platform you want to support:

### Facebook
- [ ] Create app at https://developers.facebook.com/
- [ ] Get App ID and App Secret
- [ ] Add Facebook Login product
- [ ] Set redirect URIs:
  - [ ] `http://localhost:3000/api/oauth/callback?platform=facebook`
  - [ ] `https://yourdomain.com/api/oauth/callback?platform=facebook`
- [ ] Copy credentials to `.env.local`

### Instagram
- [ ] Create app at https://developers.instagram.com/
- [ ] Get App ID and App Secret
- [ ] Add Instagram Basic Display
- [ ] Set redirect URIs (same as Facebook pattern)
- [ ] Copy credentials to `.env.local`

### LinkedIn
- [ ] Create app at https://www.linkedin.com/developers/apps
- [ ] Get App ID and App Secret
- [ ] Set redirect URLs (same pattern as above)
- [ ] Copy credentials to `.env.local`

## ✅ Local Testing

- [ ] Start dev server: `pnpm dev` in frontend directory
- [ ] Navigation tests:
  - [ ] Can access `/onboarding` when logged in
  - [ ] Redirects to login if not authenticated
  - [ ] Redirects to dashboard if onboarding already complete

### Interview Step Testing
- [ ] All 12 questions display correctly
- [ ] Progress bar increases with each question
- [ ] "Previous" button disabled on first question
- [ ] "Next" button works (Ctrl+Enter shortcut)
- [ ] Answers are saved when moving between questions
- [ ] Can go back and edit answers
- [ ] All fields have correct placeholder text

### Posts Step Testing
- [ ] Can paste individual posts
- [ ] Can upload `.txt` file with multiple posts
- [ ] Can upload `.csv` file with posts
- [ ] Manual posts appear in preview
- [ ] Can delete posts from preview
- [ ] Post count shows correctly
- [ ] OAuth buttons appear (if configured)
- [ ] Can skip without adding posts

### Persona Generation Testing
- [ ] Persona generation starts after posts step
- [ ] Loading animation shows during generation
- [ ] Takes 10-30 seconds (normal for API calls)
- [ ] Check OpenAI usage in dashboard increased

### Confirmation Step Testing
- [ ] Persona data displays correctly
- [ ] All sections render without errors:
  - [ ] Brand voice summary
  - [ ] Writing style details
  - [ ] Content pillars
  - [ ] Power words/phrases
  - [ ] Words to avoid
  - [ ] Sample posts for each platform
- [ ] Can copy sample posts (copy button)
- [ ] Can download persona as JSON
- [ ] "Go to Dashboard" button navigates correctly

## ✅ Database Verification

After completing onboarding flow, verify data in Supabase:

```sql
-- Check persona was saved
SELECT id, user_id, onboarding_complete FROM user_personas 
WHERE user_id = '[test-user-id]';

-- Should return 1 row with onboarding_complete = true

-- Check interview data
SELECT interview_data FROM user_personas 
WHERE user_id = '[test-user-id]';

-- Should show all interview answers as JSON

-- Check posts were saved
SELECT posts_analysed_count FROM user_personas 
WHERE user_id = '[test-user-id]';

-- Should show number of posts analyzed

-- Check progress record was cleaned up
SELECT COUNT(*) FROM user_onboarding_progress 
WHERE user_id = '[test-user-id]';

-- Should return 0 (cleaned up after completion)
```

Checklist for DB verification:
- [ ] `user_personas` record created with complete persona_data
- [ ] `interview_data` saved with all answers
- [ ] `platforms_connected` array populated if applicable
- [ ] `posts_analysed_count` correct
- [ ] `onboarding_complete` is true
- [ ] `user_onboarding_progress` cleaned up after completion
- [ ] Timestamps are recent and correct

## ✅ Vercel Deployment

- [ ] Push code to GitHub
- [ ] Verify Vercel deployment triggers
- [ ] Add all environment variables in Vercel settings:
  - [ ] All `NEXT_PUBLIC_*` variables
  - [ ] All secret variables (OpenAI key, OAuth secrets)
  - [ ] Mark secrets appropriately
- [ ] Wait for deployment to complete
- [ ] Test onboarding flow on production URL
- [ ] Update OAuth redirect URIs in OAuth app dashboards:
  - [ ] Facebook: Add `https://yourdomain.vercel.app/api/oauth/callback?platform=facebook`
  - [ ] Instagram: Add same pattern for Instagram
  - [ ] LinkedIn: Add same pattern for LinkedIn
- [ ] Test OAuth flow on production (if using)

## ✅ Payment/Access Control (TODO)

These are not yet implemented but should be added:

- [ ] Add `setup_fee_paid` check to `/onboarding` page
- [ ] Redirect unpaid users to payment page
- [ ] Prevent onboarding access for unpaid users
- [ ] Display progress indicator on payment page (steps 0-1 vs 2-4)

Implementation suggestion in `frontend/src/app/onboarding/page.tsx`:
```typescript
// Check if user has paid setup fee
const setupFeePaid = user.metadata?.setup_fee_paid ?? false;
if (!setupFeePaid) {
  router.push('/payment?redirect=/onboarding');
}
```

## ✅ Email Confirmation (TODO)

After persona generation, send confirmation email:

- [ ] Integrate Supabase email or SendGrid
- [ ] Create email template with:
  - [ ] Persona summary
  - [ ] Next steps (posts will begin in 24 hours)
  - [ ] Link to dashboard
- [ ] Send email in `generate-persona` API route after successful save

## ✅ Post Generation (TODO)

Set up actual social media post generation:

- [ ] Create new API route: `/api/onboarding/generate-posts`
- [ ] Input: `userId` and `numberOfPosts`
- [ ] Call OpenAI with persona + content pillars
- [ ] Save posts to `posts` table
- [ ] Create queue/cron job to generate posts 24h after onboarding
- [ ] Update dashboard to display generated posts

## ✅ Dashboard Display (TODO)

- [ ] Create dashboard page showing:
  - [ ] Current persona summary
  - [ ] Generated posts
  - [ ] Edit persona button
  - [ ] Post publishing/scheduling options
  - [ ] Stats (posts generated, engagement, etc)

## ✅ Error Monitoring

- [ ] Set up error logging (Sentry/LogRocket/equivalent)
- [ ] Monitor API errors
- [ ] Monitor auth issues
- [ ] Set up alerts for:
  - [ ] OpenAI API failures
  - [ ] Supabase connection errors
  - [ ] High error rates

## ✅ Performance

- [ ] Test with slow network (DevTools throttling)
- [ ] Verify loading states display properly
- [ ] Measure persona generation time
- [ ] Check database query performance
- [ ] Optimize images (if any)

## ✅ Security

- [ ] Verify RLS policies prevent other users accessing data
- [ ] Test with multiple accounts
- [ ] Verify API keys are never exposed:
  - [ ] OPENAI_API_KEY server-side only
  - [ ] OAuth secrets server-side only
  - [ ] Check frontend bundle for leaked keys: `npm run build && grep -r "sk-" .next/`
- [ ] CORS headers correct (if needed)
- [ ] Rate limiting on API routes (TODO - recommended to add)
- [ ] Input validation on all API routes

## ✅ Accessibility

- [ ] Test with keyboard navigation only
- [ ] Test with screen reader (NVDA/JAWS)
- [ ] Verify color contrast meets WCAG standards
- [ ] Form labels associated with inputs
- [ ] Error messages accessible
- [ ] Mobile responsive design works

## ✅ Cross-browser Testing

- [ ] Chrome / Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari (iPhone)
- [ ] Chrome Mobile (Android)

## ✅ Documentation

- [ ] Setup guide complete: `PERSONA_BUILDER_SETUP.md`
- [ ] Code comments in complex sections
- [ ] API examples documented: `src/lib/persona-api-examples.md`
- [ ] Environment variables documented: `.env.example`
- [ ] Updated project README with onboarding flow info

## 🎉 Completion

When all checkboxes are complete:
- [ ] All tests pass
- [ ] No console errors
- [ ] No Vercel deployment errors
- [ ] Database is being populated correctly
- [ ] Users can complete full flow without errors
- [ ] Ready for user onboarding!

---

## Quick Test Script

For testing via API directly:

```bash
# 1. Set environment variables
export OPENAI_API_KEY="sk-..."
export NEXT_PUBLIC_APP_URL="http://localhost:3000"

# 2. Start dev server
cd frontend && pnpm dev

# 3. Test in browser
# Navigate to http://localhost:3000/onboarding

# 4. Or test API directly with curl:
curl -X POST http://localhost:3000/api/onboarding/generate-persona \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-id",
    "interviewData": {"businessDescription": "Test business..."},
    "posts": [{"content": "Sample post"}]
  }'
```

## Common Issues & Solutions

### Issue: "Missing Supabase environment variables"
**Solution:** Ensure `.env.local` has both SUPABASE env vars and restart dev server

### Issue: OpenAI "Invalid API key"
**Solution:** Check key is valid at https://platform.openai.com/account/api-keys, regenerate if needed

### Issue: OAuth redirects to error page
**Solution:** Verify redirect URI in OAuth app settings matches exactly, including domain and query params

### Issue: RLS policy errors on insert
**Solution:** Ensure user is authenticated and `auth.uid()` matches the `user_id` being inserted

### Issue: Persona generation timeout
**Solution:** Try with fewer posts (under 20), check OpenAI status page for outages

### Issue: File upload not working
**Solution:** Verify file is `.txt` or `.csv`, check browser console for errors

---

Good luck! 🚀
