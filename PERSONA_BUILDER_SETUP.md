# AI Persona Builder - Complete Setup Guide

This guide walks you through setting up the AI-powered persona builder onboarding flow in your Next.js app on Vercel.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Supabase Setup](#step-1-supabase-setup)
3. [Step 2: Environment Variables](#step-2-environment-variables)
4. [Step 3: Install Dependencies](#step-3-install-dependencies)
5. [Step 4: OAuth Setup](#step-4-oauth-setup)
6. [Step 5: Deploy to Vercel](#step-5-deploy-to-vercel)
7. [Testing the Flow](#testing-the-flow)
8. [Database Schema](#database-schema)

---

## Prerequisites

- Supabase account (https://supabase.com)
- OpenAI API key (https://platform.openai.com)
- (Optional) Facebook Developer App for social imports
- (Optional) LinkedIn Developer App for social imports
- (Optional) Instagram Developer App for social imports
- Vercel account for deployment

---

## Step 1: Supabase Setup

### 1.1 Create Tables

Run the migration SQL from `supabase/migrations/20260412_create_user_personas.sql` in your Supabase SQL editor:

1. Go to your Supabase project: https://app.supabase.com/project/[your-project-id]/sql
2. Click "New query"
3. Copy and paste the entire SQL migration file
4. Click "Run"

This creates:
- `user_personas` - Stores generated brand personas
- `user_onboarding_progress` - Tracks onboarding progress
- `user_social_connections` - Stores OAuth tokens for social platforms

### 1.2 Enable Row Level Security (RLS)

The migration includes RLS policies. Verify they're enabled:

1. Go to each table in your Supabase dashboard
2. Click the "Auth" tab
3. Ensure all policies are enabled

### 1.3 Get Your Credentials

1. Go to Settings → API
2. Copy your:
   - `Project URL` → Use as `NEXT_PUBLIC_SUPABASE_URL`
   - `anon key` → Use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → Use as `SUPABASE_SERVICE_ROLE_KEY` (server-only)

---

## Step 2: Environment Variables

### 2.1 Local Development

1. Copy `.env.example` to `.env.local` in the `frontend` directory:
   ```bash
   cp frontend/.env.example frontend/.env.local
   ```

2. Fill in all required values (see sections below)

### 2.2 Vercel Deployment

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add all variables from your `.env.local` file
4. Make sure to mark sensitive values (those with `_KEY` or `_SECRET`)

---

## Step 3: Install Dependencies

```bash
cd frontend

# Install new dependencies
pnpm install

# Or if using npm/yarn
npm install
# yarn install
```

The following packages are added:
- `@supabase/supabase-js` - Supabase client
- `openai` - OpenAI API client

---

## Step 4: OAuth Setup

### 4.1 Facebook/Meta OAuth

1. Go to https://developers.facebook.com/
2. Create or select your app
3. Add "Facebook Login" product
4. Set OAuth Redirect URIs to:
   ```
   https://yourdomain.com/api/oauth/callback?platform=facebook
   http://localhost:3000/api/oauth/callback?platform=facebook
   ```
5. Copy your `App ID` and `App Secret` to `.env.local`

### 4.2 Instagram OAuth

1. Go to https://developers.instagram.com/
2. Create or select your app
3. Add Instagram Basic Display
4. Set OAuth Redirect URIs to:
   ```
   https://yourdomain.com/api/oauth/callback?platform=instagram
   http://localhost:3000/api/oauth/callback?platform=instagram
   ```
5. Copy your `App ID` and `App Secret` to `.env.local`

### 4.3 LinkedIn OAuth

1. Go to https://www.linkedin.com/developers/apps
2. Create a new app
3. Add "Sign In with LinkedIn" product
4. Set Redirect URLs to:
   ```
   https://yourdomain.com/api/oauth/callback?platform=linkedin
   http://localhost:3000/api/oauth/callback?platform=linkedin
   ```
5. Copy your `App ID` and `App Secret` to `.env.local`

### 4.4 Update API Routes

In `src/app/api/oauth/callback/route.ts`, you may need to update the token exchange logic for your specific platforms. The current implementation is a template.

---

## Step 5: Deploy to Vercel

### 5.1 Push to GitHub

```bash
git add .
git commit -m "feat: add persona builder onboarding flow"
git push origin main
```

### 5.2 Deploy

If your Vercel is connected to GitHub:
1. Go to your Vercel dashboard
2. Your deployment should start automatically
3. Add environment variables in Vercel project settings
4. Wait for deployment to complete

Or deploy via CLI:
```bash
pnpm install -g vercel
vercel env pull
# Edit .env.local with production values
vercel --prod
```

### 5.3 Update OAuth Redirect URIs

Once your Vercel domain is live, update all OAuth apps to include your production redirect URLs:
```
https://your-vercel-app.vercel.app/api/oauth/callback?platform=facebook
https://your-vercel-app.vercel.app/api/oauth/callback?platform=instagram
https://your-vercel-app.vercel.app/api/oauth/callback?platform=linkedin
```

---

## Testing the Flow

### 1. Test Locally

```bash
cd frontend
pnpm dev
```

Navigate to `http://localhost:3000/onboarding`

### 2. Test Interview Step

- User completes all 12 interview questions
- Answers are saved to `user_onboarding_progress` table
- Should advance to posts step

### 3. Test Posts Step

Option A - Manual Upload:
- Paste sample posts
- Upload a .txt or .csv file
- Posts appear in preview

Option B - OAuth:
- Click "Connect Facebook/Instagram/LinkedIn"
- Authenticate with platform
- (Note: Actual post fetching requires additional API implementation)

### 4. Test Persona Generation

- After posts step, click "Continue to Persona Generation"
- Should see loading state
- OpenAI API generates persona (check OpenAI usage in your dashboard)
- Persona confirmation page displays results

### 5. Verify Database

Check Supabase:
```sql
-- View generated persona
SELECT * FROM user_personas WHERE user_id = 'your-user-id';

-- View onboarding progress
SELECT * FROM user_onboarding_progress WHERE user_id = 'your-user-id';

-- View social connections
SELECT user_id, platform FROM user_social_connections;
```

---

## Database Schema

### user_personas

Stores the complete AI-generated brand persona.

```sql
id              UUID          -- Primary key
user_id         UUID          -- Foreign key to auth.users
persona_data    JSONB         -- Full PersonaData JSON object
interview_data  JSONB         -- Answers from interview questions
platforms_connected TEXT[]    -- ['facebook', 'instagram', 'linkedin']
posts_analysed_count INTEGER  -- Number of posts analyzed
onboarding_complete BOOLEAN   -- Whether onboarding finished
created_at      TIMESTAMP     -- When persona was created
updated_at      TIMESTAMP     -- Last update time
```

### user_onboarding_progress

Tracks progress through the onboarding flow (supports resuming).

```sql
id                UUID          -- Primary key
user_id           UUID          -- Foreign key to auth.users (UNIQUE)
current_step      INTEGER       -- 1: interview, 2: posts, 3: generating, 4: confirmation
interview_responses JSONB       -- Partial or complete InterviewData
collected_posts   JSONB         -- Array of CollectedPost objects
created_at        TIMESTAMP     -- When progress record created
updated_at        TIMESTAMP     -- Last update time
```

### user_social_connections

Stores OAuth credentials for social media platforms.

```sql
id                 UUID          -- Primary key
user_id            UUID          -- Foreign key to auth.users
platform           VARCHAR(50)   -- 'facebook', 'instagram', or 'linkedin'
access_token       TEXT          -- OAuth access token
refresh_token      TEXT          -- OAuth refresh token (if available)
platform_user_id   VARCHAR(255)  -- User ID on the platform
posts_imported_count INTEGER     -- Number of posts imported
last_synced_at     TIMESTAMP     -- Last time posts were fetched
created_at         TIMESTAMP     -- When connection created
updated_at         TIMESTAMP     -- Last update time
```

---

## TypeScript Types Reference

All types are defined in `src/lib/supabase.ts`:

```typescript
interface PersonaData {
  brandVoiceSummary: string;
  writingStyle: { postLength, emojiUsage, punctuationHabits, paragraphStructure };
  recurringThemes: string[];
  powerWordsAndPhrases: string[];
  wordsToAvoid: string[];
  idealPostStructures: { [platform]: string };
  hashtagStyle: string;
  engagementStyle: string;
  contentPillars: string[];
  samplePosts: { [platform]: string };
}

interface InterviewData {
  businessDescription: string;
  problemsSolved: string;
  brandPersonality: string;
  toneOfVoice: string;
  topicsToPostAbout: string;
  topicsToAvoid: string;
  achievements: string;
  phraseFrequency: string;
  phrasesToAvoid: string;
  idealCustomer: string;
  platformsActive: string[];
  businessGoals: string;
}

interface CollectedPost {
  content: string;
  platform?: string;
  datePosted?: string;
  hashtags?: string[];
  engagement?: { likes?, comments? };
}
```

---

## OpenAI API Costs

The persona generation uses:
- Model: `claude-3-5-sonnet-20241022`
- Input: ~2000-3000 tokens (interview + posts)
- Output: ~1500-2000 tokens (persona JSON)
- Cost: ~$0.03-0.05 per persona generation

Monitor at: https://platform.openai.com/account/billing/usage

---

## Troubleshooting

### "Missing Supabase environment variables"

- Verify `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart dev server after adding env vars

### OAuth redirect fails

- Check that redirect URI in OAuth app settings matches your URL exactly
- Verify `NEXT_PUBLIC_APP_URL` is set correctly
- For localhost, use `http://localhost:3000` (not https)

### Persona generation fails with timeout

- Check OpenAI API status at https://status.openai.com/
- Verify your API key is valid and has available quota
- Large post collections (100+) may take longer

### RLS policy errors

- Ensure user is authenticated (check Supabase auth)
- Verify RLS policies are enabled on all three tables
- Check that policies have `auth.uid() = user_id` conditions

### Database connection errors

- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check that your IP is not blocked by Supabase firewall (unlikely, but possible)
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set for server-side operations

---

## Next Steps

After completing this setup:

1. **Update Payment Check**: Ensure users can only access `/onboarding` if `setup_fee_paid` is true
2. **Email Notifications**: Send confirmation email after persona generation
3. **Post Generation**: Implement actual social media post generation using the persona
4. **Dashboard**: Build dashboard showing generated posts and persona stats
5. **Persona Updates**: Allow users to update their persona if needed

---

## Support

For issues with:
- **Supabase**: Check https://supabase.com/docs
- **OpenAI**: Check https://platform.openai.com/docs
- **Next.js**: Check https://nextjs.org/docs
- **OAuth**: Check platform-specific developer docs
