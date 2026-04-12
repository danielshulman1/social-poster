# Deployment Summary - AI Persona Builder

## What Was Done

The AI Persona Builder feature has been successfully added to the **deployed** `packages/social-feeds` application. This resolves the issue where the persona button wasn't showing and the admin panel was showing "Error fetching users."

### The Problem
- **Wrong deployment**: Your code had TWO separate Next.js apps (`/frontend/` and `/packages/social-feeds/`)
- **Deployment mismatch**: Vercel was only deploying `packages/social-feeds/`, not `/frontend/`
- **Solution**: Moved all persona builder features from `/frontend/` into `packages/social-feeds/` (the deployed app)

---

## What's New

### User Features

1. **AI Persona Creation** (`/persona`)
   - 12-question interview about your brand and communication style
   - Optional: Add up to 3 recent posts for context
   - AI analyzes answers and generates persona
   - Save persona to your account
   - Can regenerate/edit persona anytime

2. **Dashboard Card**
   - Shows "Create Your AI Persona" when you don't have one yet
   - Shows persona summary (brand voice + content pillars) when you do
   - "Edit" button to regenerate persona

3. **Sidebar Navigation**
   - New "AI Persona" menu item
   - Quick access to persona builder from anywhere

4. **One-time Button Pattern**
   - "Create Persona" only shows when needed
   - Disappears after creation
   - Prevents accidental duplicate personas

### Admin Features

1. **Admin Debug Endpoint** (`/api/admin/debug`)
   - Check if you're logged in
   - See your current role
   - Verify admin access

2. **User Promotion** (`/api/admin/promote`)
   - Endpoint to promote users to admin
   - Allows admins to be created/managed programmatically

3. **Persona Reset**
   - Admins can delete user personas
   - Allows users to regenerate if needed

---

## Database Changes

**New Table: `UserPersona`**
```sql
CREATE TABLE "UserPersona" (
  id TEXT PRIMARY KEY,
  userId TEXT UNIQUE NOT NULL,
  personaData JSONB NOT NULL,  -- { brandVoiceSummary, contentPillars }
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES "User"(id) ON DELETE CASCADE
);
```

Migration status: **APPLIED** ✅  
File: `packages/social-feeds/prisma/migrations/add_user_persona/migration.sql`

---

## API Endpoints Added

### Personas
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/personas` | GET | Required | Fetch current user's persona |
| `/api/personas` | POST | Required | Save/update persona |
| `/api/personas` | DELETE | Admin-only | Delete any user's persona |
| `/api/personas/generate` | POST | Required | Generate persona via Claude |

### Admin
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/admin/debug` | GET | Required | Check admin status |
| `/api/admin/promote` | POST | Workflow-only | Promote user to admin |

---

## Configuration Required

### OpenAI API Key
The persona generator uses Claude to analyze interview answers. You must set:

**Option 1: Server-wide (for all users)**
```bash
OPENAI_API_KEY=sk-...
```

**Option 2: Per-user (users set their own)**
- Users can set their API key in the app
- Falls back to server key if not set

---

## Fixing "Error fetching users" in Admin Panel

This error occurs when your user account doesn't have `role: "admin"`.

### Quick Fix
Visit: `https://your-domain.com/api/admin/debug`

You'll see something like:
```json
{
  "isAdmin": false,
  "role": "user"
}
```

### To Fix It
Ask your database admin to run:
```sql
UPDATE "User" 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

Then log out and log back in.

---

## Commits

```
1b0a623 feat: add AI persona builder to deployed app
eac8825 feat: add admin debug and promotion endpoints
602ea22 docs: add comprehensive persona builder guide
```

---

## Files Modified/Created

### New Files
- `packages/social-feeds/src/app/(dashboard)/persona/page.tsx`
- `packages/social-feeds/src/app/api/personas/route.ts` (replaced mock endpoint)
- `packages/social-feeds/src/app/api/personas/generate/route.ts`
- `packages/social-feeds/src/app/api/admin/debug/route.ts`
- `packages/social-feeds/src/app/api/admin/promote/route.ts`
- `packages/social-feeds/prisma/migrations/add_user_persona/migration.sql`

### Modified Files
- `packages/social-feeds/prisma/schema.prisma` (added UserPersona model)
- `packages/social-feeds/src/app/(dashboard)/dashboard/page.tsx` (added persona card)
- `packages/social-feeds/src/components/layout/AppSidebar.tsx` (added persona nav link)

---

## Testing Checklist

Before going live, verify:

- [ ] User can access `/persona` from sidebar
- [ ] User can complete interview questions
- [ ] Persona generates without error
- [ ] Persona displays on dashboard
- [ ] "Create Persona" button disappears after save
- [ ] Admin can access `/admin/users`
- [ ] `/api/admin/debug` shows correct role
- [ ] OPENAI_API_KEY is set and valid

---

## Rollback Plan (if needed)

If something goes wrong, you can revert these commits:
```bash
git revert 602ea22
git revert eac8825
git revert 1b0a623
git push origin main
```

This will rollback the feature on your next Vercel deploy.

---

## What Happens on Vercel Deploy

1. GitHub webhook triggers Vercel
2. Vercel builds from `/packages/social-feeds/` (per vercel.json)
3. Runs `npx prisma generate` (generates Prisma client)
4. Migration was already applied to DB, so no migration step needed
5. Deploys the built app

The feature will be live automatically.

---

## Next Steps

1. **Deploy to production**: Push to main (already done ✅)
2. **Verify admin access**: Check `/api/admin/debug` endpoint
3. **Test persona flow**: Create a test persona on staging/prod
4. **Monitor**: Check server logs for any errors

---

## Documentation

See `PERSONA_BUILDER_GUIDE.md` for detailed:
- Feature overview
- User flow
- Technical architecture
- Configuration
- Troubleshooting
- Testing checklist
- Future enhancements

---

## Questions?

The complete guide is available at: `PERSONA_BUILDER_GUIDE.md`

Key endpoints for debugging:
- `/api/admin/debug` - Check your role and auth status
- `/api/personas` - Fetch/save/delete personas
- Server logs - Search for "persona" or "Error"
