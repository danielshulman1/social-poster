# ✅ Ready to Test - AI Persona Builder

## Status: COMPLETE ✅

All features have been implemented and committed. The code is ready for deployment to production.

---

## What to Test

### 1. **Create AI Persona** (5-10 minutes)

1. Log in to your deployed app
2. Go to **Dashboard** (or click `/dashboard`)
3. You should see a card that says **"Create Your AI Persona"**
4. Click the button → Goes to `/persona` page
5. Fill out all 12 interview questions
6. (Optional) Add up to 3 recent posts
7. Click **"Generate Persona"**
8. AI should generate a persona with:
   - Brand voice summary (2-3 sentences)
   - Content pillars (4-5 topics)
9. Review the result
10. Click **"Save & Continue"**
11. Should redirect back to dashboard
12. Persona card should now show the summary
13. "Create Persona" button should be **gone**

### 2. **Edit/Regenerate Persona** (3 minutes)

1. From dashboard, click **"Edit"** on the persona card
2. Should go back to `/persona` page
3. Click **"Start Over"** to clear and regenerate
4. Answer questions differently
5. Generate new persona
6. Should see different summary

### 3. **Admin Features** (5 minutes)

#### Check Admin Status
1. Visit: `/api/admin/debug`
2. Should show your auth status and role
3. If `isAdmin` is `false`, you need to be promoted

#### Access Admin Panel
1. Go to `/admin/users`
2. If you're not admin, should see 403 Forbidden error
3. If you ARE admin, should see list of all users

#### Reset User Persona (Admin Only)
1. As admin, on the users list, find a user with a persona
2. Should see a "Reset Persona" button or action
3. Click to delete their persona
4. That user can now create a new persona

### 4. **Navigation** (2 minutes)

1. Check sidebar - should have new **"AI Persona"** menu item
2. Click it - should go to `/persona`
3. From any page in the dashboard, can access it

---

## Key Features Checklist

- [ ] Regular user can create persona
- [ ] "Create Persona" button shows only when needed
- [ ] Persona persists after save
- [ ] Dashboard shows persona summary
- [ ] User can regenerate/edit persona
- [ ] Admin can reset any user's persona
- [ ] `/api/admin/debug` works and shows correct role
- [ ] Navigation includes "AI Persona" link
- [ ] All API endpoints return proper status codes

---

## Error States to Test

### What if something fails?

**Persona generation fails:**
- You'll see an error message
- Can try again
- Check that `OPENAI_API_KEY` is set in environment

**Can't see admin panel:**
- Visit `/api/admin/debug`
- Check if `isAdmin` is `false`
- If so, ask admin to promote you
- Or ask database admin to run:
  ```sql
  UPDATE "User" SET role = 'admin' WHERE email = 'your-email@example.com';
  ```

**Persona button always shows:**
- Database issue or API error
- Check browser console for network errors
- Check server logs for `/api/personas` failures

---

## API Endpoints (Manual Testing)

If you want to test APIs directly:

### Get Current User's Persona
```bash
curl -X GET https://your-domain.com/api/personas \
  -H "Cookie: next-auth.session-token=..." 
```

### Generate Persona
```bash
curl -X POST https://your-domain.com/api/personas/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "interviewAnswers": [
      {"question": "What is your name?", "answer": "John Doe"}
    ]
  }'
```

### Admin Debug
```bash
curl -X GET https://your-domain.com/api/admin/debug \
  -H "Cookie: next-auth.session-token=..."
```

---

## What's Different from `/frontend/`?

The new persona builder in `/packages/social-feeds/`:

| Aspect | `/frontend/` | `/packages/social-feeds/` |
|--------|-------------|------------------------|
| Auth | Supabase | next-auth + Prisma |
| Database | Supabase | PostgreSQL + Prisma |
| Stored in | Supabase tables | Prisma UserPersona model |
| Deployment | NOT deployed | Deployed on Vercel |
| Integrated with | Standalone | Existing workflows app |

---

## Configuration Notes

### Required Environment Variables
```
OPENAI_API_KEY=sk-...  # For persona generation
```

If you need per-user API keys:
- They're stored in `User.openaiApiKey`
- Persona generation uses user's key first, then falls back to server key

---

## Deployment

The code is **already committed and pushed**:

```
5fdf1a7 docs: add deployment summary for persona builder feature
602ea22 docs: add comprehensive persona builder guide
eac8825 feat: add admin debug and promotion endpoints
1b0a623 feat: add AI persona builder to deployed app
```

Next steps:
1. ✅ Code is committed to main
2. ✅ All tests pass locally
3. ⏳ Wait for Vercel to auto-deploy (if set up)
4. 🧪 Test on production
5. ✅ Done!

---

## Quick Links

- **Feature Guide**: `PERSONA_BUILDER_GUIDE.md`
- **Deployment Summary**: `DEPLOYMENT_SUMMARY.md`
- **Dashboard**: `/dashboard`
- **Persona Builder**: `/persona`
- **Admin Panel**: `/admin/users`
- **Debug Endpoint**: `/api/admin/debug`

---

## Success Criteria

You'll know it's working when:

✅ Dashboard shows persona card (either create button or summary)  
✅ Can complete interview and generate persona  
✅ Persona persists across page reloads  
✅ Admin can manage users  
✅ No errors in browser console  
✅ No 500 errors in server logs  

---

## Ready to Deploy?

**Yes!** All code is committed, tested, and ready for Vercel.

Once you push to Vercel (which likely happens automatically), the feature will be live.

### Verify it's working:
1. Visit `/dashboard` → Should see persona card
2. Click "Create Persona" or "Edit"
3. Complete the flow
4. Everything should work!

---

## Questions?

See the comprehensive guide at: `PERSONA_BUILDER_GUIDE.md`

For quick debugging: Visit `/api/admin/debug` while logged in.
