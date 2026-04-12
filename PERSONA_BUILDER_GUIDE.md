# AI Persona Builder - Implementation Guide

## Overview

The AI Persona Builder is now fully integrated into the deployed `packages/social-feeds` application. Users can create a personalized AI persona based on their brand voice and communication style, which can be used to generate consistent social media content.

---

## Features

✅ **Multi-step persona creation** - 12-question interview + optional post samples  
✅ **AI-powered generation** - Uses Claude API to analyze answers and create persona  
✅ **Persistent storage** - Personas saved to PostgreSQL database  
✅ **Dashboard display** - Shows persona on main dashboard with edit capability  
✅ **Admin control** - Admins can reset user personas via DELETE endpoint  
✅ **One-time button** - "Create Persona" only shows when user has no persona  

---

## User Flow

```
1. User logs in → Goes to /dashboard
2. No persona exists → "Create Your AI Persona" card shown
3. User clicks button → Navigates to /persona
4. Multi-step form:
   - Step 1: Answer 12 interview questions
   - Step 2: Optionally add up to 3 recent posts
   - Step 3: AI generates persona
   - Step 4: Review and save persona
5. Persona saved → Redirected to /dashboard
6. Dashboard now shows persona summary (button gone)
7. User can click "Edit" to go back to /persona and regenerate
```

---

## Technical Architecture

### Database Schema

```sql
CREATE TABLE "UserPersona" (
  id TEXT PRIMARY KEY,
  userId TEXT UNIQUE NOT NULL,
  personaData JSONB NOT NULL,  -- stores { brandVoiceSummary, contentPillars }
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES "User"(id) ON DELETE CASCADE
);
```

Migrated via: `packages/social-feeds/prisma/migrations/add_user_persona/migration.sql`

### API Endpoints

#### `GET /api/personas`
- **Auth**: Required (session or workflow)
- **Response**: User's persona or null
```json
{
  "id": "cuid123",
  "userId": "user123",
  "personaData": {
    "brandVoiceSummary": "...",
    "contentPillars": ["...", "..."]
  },
  "createdAt": "2026-04-12T...",
  "updatedAt": "2026-04-12T..."
}
```

#### `POST /api/personas`
- **Auth**: Required (session or workflow)
- **Body**: `{ personaData: { brandVoiceSummary, contentPillars } }`
- **Response**: Saved persona object

#### `DELETE /api/personas?userId=<userId>`
- **Auth**: Required + Admin-only
- **Response**: `{ message: "Persona deleted" }`

#### `POST /api/personas/generate`
- **Auth**: Required (session or workflow)
- **Body**: 
  ```json
  {
    "interviewAnswers": [
      { "question": "...", "answer": "..." },
      ...
    ],
    "postSamples": ["post1", "post2"]  // optional
  }
  ```
- **Response**: 
  ```json
  {
    "brandVoiceSummary": "...",
    "contentPillars": ["pillar1", "pillar2"]
  }
  ```
- **Model**: Claude 3.5 Sonnet (via `OPENAI_API_KEY` or user's API key)

### Frontend Pages

#### `/persona` (Persona Builder)
- **File**: `src/app/(dashboard)/persona/page.tsx`
- **Type**: Client component
- **Features**:
  - Step 1: Interview form (12 questions)
  - Step 2: Optional post samples (3 fields)
  - Step 3: Loading state while generating
  - Step 4: Review and save persona
  - Checks for existing persona on mount
  - Can regenerate by starting over

#### Dashboard Integration
- **File**: `src/app/(dashboard)/dashboard/page.tsx`
- **Added**:
  - Persona card showing summary (if exists)
  - "Create Your AI Persona" call-to-action (if not exists)
  - Edit button to go back to `/persona`
  - Fetches persona on dashboard mount

#### Sidebar Navigation
- **File**: `src/components/layout/AppSidebar.tsx`
- **Added**: "AI Persona" menu item (links to `/persona`)

---

## Setup & Configuration

### Prerequisites
- OpenAI API key (in `OPENAI_API_KEY` env var or user's `openaiApiKey` field in DB)
- PostgreSQL database with `UserPersona` table (migration already run)

### Environment Variables
```bash
OPENAI_API_KEY=sk-...  # For server-side persona generation
```

### User's API Key (Optional)
Each user can set their own OpenAI API key in `User.openaiApiKey`. If set, persona generation will use that key instead of the server key. This allows users to control costs and usage.

---

## Admin Features

### View Admin Status
Visit `/api/admin/debug` while logged in to see:
- Whether you're authenticated
- Your current role
- Whether you can access admin panel

**Example response:**
```json
{
  "status": "authenticated",
  "auth": {
    "userId": "user123",
    "email": "admin@example.com",
    "role": "admin",
    "source": "session"
  },
  "user": {
    "id": "user123",
    "email": "admin@example.com",
    "role": "admin"
  },
  "isAdmin": true,
  "canAccessAdminPanel": true
}
```

### Promote User to Admin
Use the `/api/admin/promote` endpoint (requires workflow secret):

```bash
curl -X POST http://localhost:3000/api/admin/promote \
  -H "Content-Type: application/json" \
  -H "x-workflow-secret: <WORKFLOW_INTERNAL_SECRET>" \
  -d '{"email": "user@example.com"}'
```

### Reset User's Persona
Admin can delete any user's persona via:

```bash
DELETE /api/personas?userId=<userId>
```

This allows users to regenerate their persona if they want to update it.

---

## Troubleshooting

### "Error fetching users" in Admin Panel

This means the logged-in user doesn't have `role: "admin"` in the database.

**Solution:**
1. Check your role: Visit `/api/admin/debug`
2. If `isAdmin` is `false`, you need to be promoted to admin
3. Ask the system administrator to promote you using `/api/admin/promote`
4. Or update the database directly:
   ```sql
   UPDATE "User" SET role = 'admin' WHERE email = 'your-email@example.com';
   ```

### Persona generation fails

**Common causes:**
1. `OPENAI_API_KEY` not set or invalid
2. User's `openaiApiKey` is invalid
3. Network issue calling OpenAI API

**Solution:**
- Check server logs for API error
- Verify API key is valid: `curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models`
- Try again after fixing API key

### Persona button shows but shouldn't

The dashboard fetches `/api/personas` and shows the button if response is `null` or an empty body. If the route is failing:
- Check browser network tab for the request status
- If 401: User not authenticated (re-login)
- If 500: Check server logs

---

## Files Changed

### New Files
- `packages/social-feeds/src/app/(dashboard)/persona/page.tsx` - Persona builder page
- `packages/social-feeds/src/app/api/personas/route.ts` - Main personas API (GET/POST/DELETE)
- `packages/social-feeds/src/app/api/personas/generate/route.ts` - AI generation endpoint
- `packages/social-feeds/src/app/api/admin/debug/route.ts` - Debug endpoint
- `packages/social-feeds/src/app/api/admin/promote/route.ts` - Admin promotion endpoint
- `packages/social-feeds/prisma/migrations/add_user_persona/migration.sql` - Database migration

### Modified Files
- `packages/social-feeds/prisma/schema.prisma` - Added `UserPersona` model
- `packages/social-feeds/src/app/(dashboard)/dashboard/page.tsx` - Added persona card
- `packages/social-feeds/src/components/layout/AppSidebar.tsx` - Added "AI Persona" nav link

---

## Testing Checklist

- [ ] Regular user: Can access `/persona`
- [ ] Regular user: Can complete interview (all 12 questions required)
- [ ] Regular user: Can skip post samples (optional)
- [ ] Regular user: Persona generates successfully
- [ ] Regular user: Persona saves to database
- [ ] Regular user: Dashboard shows persona after save
- [ ] Regular user: "Create Persona" button disappears after save
- [ ] Regular user: Can click "Edit" to regenerate persona
- [ ] Admin user: Can access `/admin/users`
- [ ] Admin user: Can see list of all users
- [ ] Admin user: Can click "Reset Persona" button on a user
- [ ] Admin user: Persona is deleted, user can create new one
- [ ] Non-admin: Cannot access `/admin/users` (gets 403)
- [ ] `/api/admin/debug` shows correct role
- [ ] Persona data persists across page reloads

---

## Future Enhancements

- [ ] Auto-import posts from connected social accounts
- [ ] Use persona to generate post suggestions
- [ ] A/B test different persona variations
- [ ] Track which persona was used for each post
- [ ] Allow users to have multiple personas (per platform)
- [ ] Persona editing interface (not just regeneration)
- [ ] Export persona as JSON/template

---

## Support

For issues or questions:
1. Check `/api/admin/debug` endpoint for auth status
2. Review server logs for detailed error messages
3. Verify database migration ran: Check if `UserPersona` table exists
4. Ensure OpenAI API key is valid and has quota
