# AI Persona Builder - Complete Implementation Guide

Full guide for building an AI-powered persona creation flow that interviews users and analyzes their social media posts.

---

## 🎯 System Overview

The persona builder is a 5-step onboarding flow that:

1. **Interview** - AI asks user about their business, brand, voice, content
2. **Collect Posts** - User uploads existing posts (manual) or connects social accounts (OAuth)
3. **Analyze** - System pulls posts from connected platforms
4. **Build** - OpenAI GPT creates detailed persona from interview + posts
5. **Confirm** - Show persona summary and sample posts to user

Result: A detailed JSON persona stored in Supabase that can be used to guide future AI-generated posts.

---

## 📋 Architecture

```
Entry Point: /onboarding
    ↓
[Gate: Check setup_fee_paid & onboarding_complete]
    ↓
Step 1: Interview
    └─ AI asks questions one at a time
    └─ Store answers in memory
    └─ Progress saved to DB
    ↓
Step 2: Collect Posts  
    ├─ Option A: Manual upload (txt/csv)
    ├─ Option B: OAuth connections (Facebook, Instagram, LinkedIn)
    └─ Store choice in DB
    ↓
Step 3: Analyze
    ├─ Manual: Parse uploaded file
    ├─ OAuth: Call social media APIs
    └─ Store posts + metadata in DB
    ↓
Step 4: Build Persona
    └─ Send interview + posts to OpenAI
    └─ Get structured persona JSON
    └─ Save to user_personas table
    ↓
Step 5: Confirm
    └─ Show persona summary
    └─ Show sample posts
    └─ Redirect to dashboard
    ↓
Set: onboarding_complete = true
```

---

## 📁 Files to Create

This implementation requires:

### Database Schemas
1. `database/migrations/003_create_user_personas_table.sql`
2. `database/migrations/004_create_interview_progress_table.sql`

### Database Operations
3. `app/utils/persona-db.js` - Persona CRUD operations
4. `app/utils/interview-db.js` - Interview progress tracking

### Onboarding Pages
5. `app/onboarding/page.jsx` - Main onboarding route
6. `app/onboarding/interview/page.jsx` - Step 1: Interview
7. `app/onboarding/collect-posts/page.jsx` - Step 2: Collect posts
8. `app/onboarding/build/page.jsx` - Step 3/4: Build persona
9. `app/onboarding/confirm/page.jsx` - Step 5: Confirmation

### Components
10. `app/components/PersonaBuilder/InterviewChat.jsx` - AI chat interface
11. `app/components/PersonaBuilder/PostUploader.jsx` - File/text upload
12. `app/components/PersonaBuilder/OAuthConnector.jsx` - Social media links
13. `app/components/PersonaBuilder/PersonaSummary.jsx` - Persona display

### API Routes
14. `app/api/onboarding/interview/chat/route.js` - AI interview endpoint
15. `app/api/onboarding/posts/upload/route.js` - Handle file upload
16. `app/api/onboarding/posts/analyze/route.js` - Analyze posts
17. `app/api/onboarding/persona/build/route.js` - Call OpenAI
18. `app/api/onboarding/persona/save/route.js` - Save persona
19. `app/api/integrations/facebook/callback/route.js` - Facebook OAuth
20. `app/api/integrations/instagram/callback/route.js` - Instagram OAuth
21. `app/api/integrations/linkedin/callback/route.js` - LinkedIn OAuth
22. `app/api/integrations/posts/fetch/route.js` - Fetch posts from APIs

### Utilities
23. `app/lib/openai-persona.js` - OpenAI persona generation
24. `app/lib/social-media-fetch.js` - Fetch posts from APIs
25. `app/lib/post-parser.js` - Parse uploaded files

---

## ⚙️ Environment Variables Required

Add these to your `.env.local` and Vercel deployment:

```bash
# OpenAI
OPENAI_API_KEY=sk_test_...

# Facebook/Instagram
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_REDIRECT_URI=https://yourdomain.com/api/integrations/facebook/callback

# LinkedIn
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_REDIRECT_URI=https://yourdomain.com/api/integrations/linkedin/callback

# App URLs
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

---

## 🚀 Quick Start

This guide is split into multiple parts:

1. **Database Setup** - Create tables and schema
2. **Core Logic** - Utilities and helper functions
3. **Interview Flow** - Step 1 implementation
4. **Post Collection** - Steps 2-3 implementation
5. **Persona Generation** - Steps 4-5 implementation
6. **OAuth Integration** - Social media connections

Each section builds on the previous one.

---

## 📊 Data Models

### user_personas Table

```sql
CREATE TABLE user_personas (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  persona_data JSONB NOT NULL,          -- Full structured persona
  platforms_connected VARCHAR(100)[],   -- ['facebook', 'instagram', 'linkedin']
  posts_analysed_count INTEGER DEFAULT 0,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### interview_progress Table

```sql
CREATE TABLE interview_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 1,       -- 1=interview, 2=collect, 3=analyze, 4=build, 5=confirm
  interview_answers JSONB DEFAULT '{}'::jsonb,  -- Store interview Q&As
  posts_choice VARCHAR(50),              -- 'manual' or 'oauth'
  collected_posts JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Persona JSON Structure

```javascript
{
  "brandVoice": {
    "summary": "String: 2-3 sentences describing overall tone",
    "tone": ["formal", "casual", "inspirational", "educational"],
    "personality": ["professional", "friendly", "authoritative", "relatable"]
  },
  "writingStyle": {
    "postLength": "short|medium|long",
    "useEmojis": true,
    "punctuationStyle": "description",
    "paragraphStructure": "description"
  },
  "themes": [
    {
      "topic": "Business growth",
      "keywords": ["scaling", "revenue", "team"],
      "frequency": "weekly"
    }
  ],
  "powerWords": ["amazing", "incredible", "transform"],
  "avoidWords": ["maybe", "possibly"],
  "contentPillars": ["Business tips", "Success stories", "Industry insights"],
  "platformGuides": {
    "facebook": {
      "postStructure": "Narrative with CTA",
      "samplePost": "..."
    },
    "instagram": {
      "postStructure": "Hashtag-heavy with emojis",
      "samplePost": "..."
    },
    "linkedin": {
      "postStructure": "Professional insights with takeaway",
      "samplePost": "..."
    }
  },
  "hashtags": {
    "style": "lowercase",
    "frequency": "5-10 per post",
    "examples": ["#entrepreneurship", "#growth"]
  },
  "engagementStyle": {
    "asksQuestions": true,
    "usesCallsToAction": true,
    "respondsToCom ments": true
  }
}
```

---

## 🎬 Typical User Journey

### Day 1: Onboarding
```
1. User pays £47 setup fee
2. Redirected to /onboarding
3. AI interviews user (10 minutes)
   - "What does your business do?"
   - "What's your brand personality?"
   - [... 8 more questions]
4. User chooses to upload posts or connect accounts
5. System collects/analyzes posts
6. OpenAI builds persona
7. User sees persona summary
8. Account marked as onboarded
9. Dashboard available
```

### Future Posts
```
When user creates posts via dashboard:
1. New post content generated by AI
2. Persona used to style the post
3. Post sounds exactly like user's voice
4. Published to connected platforms
```

---

## 🔐 Security Considerations

1. **Setup Fee Gate** - Verify `setup_fee_paid = true` before allowing onboarding
2. **One-Time Flow** - If `onboarding_complete = true`, redirect to dashboard
3. **OAuth Security** - Use PKCE flow, validate state tokens, store tokens securely
4. **File Upload** - Validate file types (txt, csv only), size limits, scan for malware
5. **API Keys** - Never expose OpenAI/social media keys to frontend
6. **Progress Storage** - Encrypt sensitive interview data if needed

---

## 📈 Next Steps

Start with **Part 1: Database Setup** in the next documentation file.

This is a large feature, so it's broken into logical sections:

1. **Database Schema** (5 min)
2. **Core Utilities** (15 min)
3. **Interview Flow** (20 min)
4. **Post Collection** (20 min)
5. **Persona Generation** (15 min)
6. **OAuth Integration** (25 min)

---

**Total implementation time: ~2-3 hours**

Start with migrations, then utilities, then UI flow. The flow is linear so you can test each step.

---

See individual documentation files for detailed implementation of each part.
