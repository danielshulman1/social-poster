# Persona Builder - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 16)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           ONBOARDING PAGE (/onboarding)                    │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │ │
│  │  │  Interview   │→ │ Posts Upload │→ │ Persona Review   │ │ │
│  │  │  (12 Qs)     │  │ & OAuth      │  │ & Confirmation   │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘ │ │
│  │       ↓                   ↓                    ↓             │ │
│  │  Saves State        Analyzes Posts      Displays Result   │ │
│  └────────────────────────────────────────────────────────────┘ │
│         ↓                                         ↓              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              API ROUTES (src/app/api/)                     │ │
│  │                                                             │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │ /api/oauth/initiate      - Start OAuth flow         │ │ │
│  │  │ /api/oauth/callback      - Handle OAuth response    │ │ │
│  │  │ /api/onboarding/         - Generate persona         │ │ │
│  │  │   generate-persona                                   │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│         ↓                                         ↓              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │          SUPABASE CLIENT (src/lib/supabase.ts)             │ │
│  │                                                             │ │
│  │  • User Authentication                                     │ │
│  │  • Database Operations (CRUD)                              │ │
│  │  • Type Definitions                                        │ │
│  │  • RLS Policy Enforcement                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    ↓                 ↓
           ┌──────────────┐   ┌──────────────┐
           │  SUPABASE    │   │   OpenAI     │
           │  Database    │   │   API        │
           └──────────────┘   └──────────────┘
```

## Data Flow Diagram

```
USER STARTS ONBOARDING
        ↓
   ┌─────────────────────────────────────────┐
   │ Check Authentication & RLS Policy       │
   │ (Supabase Auth + user_id verification)  │
   └─────────────────────────────────────────┘
        ↓
   ┌─────────────────────────────────────────┐
   │ STEP 1: INTERVIEW                       │
   │ • Load 12 questions                     │
   │ • User answers each question            │
   │ • Save to user_onboarding_progress      │
   └─────────────────────────────────────────┘
        ↓
   ┌─────────────────────────────────────────┐
   │ STEP 2: COLLECT POSTS                   │
   │ Option A: Manual Upload (txt/csv)       │
   │ Option B: OAuth → Social APIs           │
   │ Store posts in user_onboarding_progress │
   └─────────────────────────────────────────┘
        ↓
   ┌─────────────────────────────────────────┐
   │ STEP 3: PERSONA GENERATION              │
   │                                         │
   │ Frontend sends to API:                  │
   │ • interviewData (InterviewData)         │
   │ • posts (CollectedPost[])               │
   │ • userId                                │
   │                                         │
   │ API processes:                          │
   │ • Formats prompt with all data          │
   │ • Calls OpenAI Claude 3.5 Sonnet        │
   │ • Parses JSON response                  │
   │ • Saves PersonaData to database         │
   └─────────────────────────────────────────┘
        ↓
   ┌─────────────────────────────────────────┐
   │ STEP 4: CONFIRMATION                    │
   │ • Display persona_data JSON             │
   │ • Show sample posts                     │
   │ • Allow download                        │
   │ • Redirect to dashboard                 │
   └─────────────────────────────────────────┘
```

## Component Structure

```
/onboarding (Page)
    │
    ├─→ InterviewStep
    │       │
    │       ├─ State: currentQuestion, answers
    │       ├─ Event: onComplete → updateOnboardingProgress
    │       └─ Render: Questions 1-12
    │
    ├─→ PostsStep
    │       │
    │       ├─ Tabs:
    │       │   ├─ Manual (textarea + file upload)
    │       │   └─ OAuth (connect FB/IG/LinkedIn)
    │       │
    │       ├─ State: posts[], activeTab
    │       ├─ Event: onComplete → call generate-persona API
    │       └─ Display: Post preview list
    │
    ├─→ LoadingState
    │       │
    │       └─ Shows spinner during generation
    │
    └─→ PersonaConfirmation
            │
            ├─ Props: persona, platforms, postsCount
            ├─ Display:
            │   ├─ Brand Voice Summary
            │   ├─ Writing Style
            │   ├─ Content Pillars
            │   ├─ Power Words
            │   ├─ Sample Posts
            │   └─ Action Buttons
            │
            └─ Events: Download, Dashboard Navigation
```

## Database Schema Relationships

```
┌─────────────────────────┐
│    auth.users           │
│  (Supabase Auth)        │
│                         │
│  id (UUID)              │
│  email                  │
│  created_at             │
└──────────────┬──────────┘
               │
        ┌──────┴──────┬──────────────┬─────────────────┐
        │             │              │                 │
        ↓             ↓              ↓                 ↓
    ┌────────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────────┐
    │user_personas│ │user_onboarding│user_social_  │
    │            │ │_progress  │connections      │
    │id (PK)     │ │           │                 │
    │user_id (FK)│ │id (PK)    │id (PK)          │
    │persona_data│ │user_id(FK)│user_id (FK)     │
    │interview.. │ │current_step│platform        │
    │platforms.  │ │interview_.. │access_token   │
    │posts_count │ │collected_posts│refresh_token│
    │created_at  │ │created_at │created_at       │
    │updated_at  │ │updated_at │updated_at       │
    └────────────┘ └──────────┘ └──────────────┘
```

## API Request/Response Flow

```
FRONTEND                           BACKEND                    EXTERNAL

User answers                       API checks
all 12 questions                   authentication
        │                                 │
        ├─ updateOnboardingProgress      │
        │  (Supabase)                    │
        │                                │
User uploads posts                 API validates
or connects OAuth                  input data
        │                                 │
        ├─ POST /api/onboarding/         │
        │        generate-persona        │
        │                          ┌─────┴──────┐
        │                          │             │
        │                          │   OpenAI    │
        │                          │   (Claude)  │
        │                          │             │
        │                          ├─ Format prompt
        │                          ├─ Call API
        │                          ├─ Parse response
        │                          │             │
        │                          │     Returns │
        │                          │     JSON    │
        │                          │             │
        │                          └─────┬───────┘
        │                                │
        │                          Save to Supabase
        │                                │
        │                    ┌───────────┴────────────┐
        │                    │                        │
        │                    ↓                        ↓
        │            user_personas         user_onboarding
        │            (complete)            _progress (delete)
        │                    │                        │
        ├─ GET /api/onboarding/──────────────────────┘
        │         [persona data]
        │
User sees                    Response JSON
persona                      ┌─────────────┐
        │          ├────────→│PersonaData │
        │          │         │{complete}  │
        └──────────┘         └─────────────┘
```

## Security & Authentication Flow

```
USER VISIT /onboarding
        │
        ↓
┌─────────────────────────────────────┐
│ Check Supabase.auth.getUser()       │
│ (Client-side auth check)            │
└─────────────────────────────────────┘
        │
        ├─ YES: User logged in ─→ Continue to onboarding
        │
        └─ NO: Not logged in ──→ Redirect to /login
                                 with redirect=/onboarding


ON API REQUESTS (/api/onboarding/generate-persona)
        │
        ↓
┌─────────────────────────────────────┐
│ Check Authorization Header          │
│ Verify JWT token                    │
└─────────────────────────────────────┘
        │
        ├─ VALID: Process request
        │       │
        │       ↓
        │  ┌─────────────────────────────┐
        │  │ RLS Policy Check             │
        │  │ ON DATABASE INSERT/UPDATE    │
        │  │ auth.uid() == user_id        │
        │  └─────────────────────────────┘
        │       │
        │       ├─ ALLOWED: Save data
        │       └─ DENIED: 403 Forbidden
        │
        └─ INVALID: 401 Unauthorized
```

## File Operations Flow

```
USER UPLOADS FILE (.txt or .csv)
        │
        ↓
┌──────────────────────────────┐
│ Browser FileReader API       │
│ Read file as text            │
└──────────────────────────────┘
        │
        ↓
┌──────────────────────────────┐
│ Parse lines                  │
│ Split by newline             │
│ Filter empty lines           │
└──────────────────────────────┘
        │
        ↓
┌──────────────────────────────┐
│ Map to CollectedPost[]       │
│ {content, datePosted}        │
└──────────────────────────────┘
        │
        ↓
ADD TO STATE & DISPLAY IN PREVIEW
```

## OpenAI Integration

```
INTERVIEW DATA + POSTS
        │
        ├─ Format comprehensive prompt
        │  • Business description
        │  • All interview answers
        │  • All collected posts
        │  • Output format requirements
        │
        ↓
POST TO OpenAI API
│
├─ Model: claude-3-5-sonnet-20241022
├─ Max tokens: 2000
├─ Temperature: Default (0.7)
│
↓
RECEIVE RESPONSE
│
├─ Extract text from message
├─ Remove markdown code blocks if present
├─ Parse JSON
├─ Validate schema
│
↓
RETURN PersonaData OBJECT
{
  brandVoiceSummary: "...",
  writingStyle: {...},
  recurringThemes: [...],
  ...
}
```

## Technology Stack

```
Frontend:
├─ Next.js 16 (App Router)
├─ React 19 + React DOM
├─ TypeScript 5
├─ Tailwind CSS 4
├─ Lucide React (Icons)
└─ Markdown Rendering

Backend:
├─ Next.js API Routes
├─ Supabase PostgreSQL
├─ Supabase Auth
└─ OpenAI API Client

External Services:
├─ Supabase (Auth, DB, RLS)
├─ OpenAI (Claude API)
├─ Facebook Graph API (optional)
├─ Instagram Graph API (optional)
└─ LinkedIn API (optional)

Deployment:
└─ Vercel (Next.js hosting)
```

## Performance & Scalability

```
Request Handling:
├─ Interview save: <100ms
├─ Posts upload: <1s (for 50 posts)
├─ Persona generation: 10-30s (OpenAI)
└─ Database query: <100ms (with indexes)

Database Optimization:
├─ Indexes on user_id (all tables)
├─ Indexes on created_at
├─ JSON indexing on persona_data
└─ RLS policies efficient

OpenAI Optimization:
├─ Single API call per persona
├─ Configurable max tokens
├─ Error handling & retry logic
└─ Cost: $0.03-0.05 per persona

Scalability:
├─ Supabase free tier: 500k ops/month
├─ OpenAI: Pay per token
├─ Vercel: Serverless auto-scaling
└─ Database: Grows horizontally
```

## Error Handling Paths

```
AUTHENTICATION ERROR
  ↓
Redirect to /login

SUPABASE CONNECTION ERROR
  ↓
Display error message
Suggest retry

OPENAI API ERROR
  ↓
Show user-friendly message
Suggest trying again later

RLS POLICY VIOLATION
  ↓
Return 403 Forbidden
Log for debugging

VALIDATION ERROR
  ↓
Return 400 Bad Request
Include error details

RATE LIMIT ERROR
  ↓
Return 429 Too Many Requests
Suggest retry with backoff
```

---

This architecture ensures:
- ✅ Security (RLS, authentication, authorization)
- ✅ Scalability (serverless, indexed database)
- ✅ Performance (optimized queries, caching)
- ✅ Maintainability (clear separation of concerns)
- ✅ Type Safety (TypeScript throughout)
- ✅ User Experience (loading states, error handling)
