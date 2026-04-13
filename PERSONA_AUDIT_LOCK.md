# Persona Audit Lock Feature

## Overview

The Persona Audit Lock feature ensures that users can only run their persona audit **once**, preventing abuse and ensuring data integrity. Admins can authorize additional audit runs when needed.

---

## How It Works

### User Perspective

1. **First Audit (Always Allowed)**
   - User creates persona via interview
   - Audit runs and completes
   - `auditUsed` is set to `true`
   - ✅ Persona saved and displayed

2. **Second Attempt (Locked)**
   - User tries to create persona again
   - System detects `auditUsed = true` and `auditAuthorizedAt = null`
   - ❌ Returns 403 error: "Persona audit has already been used. Admin authorization required to run again."
   - User sees locked message on `/persona` page
   - Message says: "Contact your administrator to authorize another audit run"

3. **After Admin Authorizes**
   - Admin clicks "Authorize" button in admin panel
   - `auditAuthorizedAt` is set to current timestamp
   - User is notified (or sees banner on `/persona`)
   - ✅ User can now run audit one more time

4. **After Second Run**
   - User completes second audit
   - `auditUsed` stays `true`
   - `auditAuthorizedAt` is reset to `null`
   - ❌ Locked again, must be re-authorized

### Admin Perspective

**View Audit Status** (Admin Users Page at `/admin/users`)
| Status | Badge | Meaning | Action |
|--------|-------|---------|--------|
| No persona | — | User hasn't created persona yet | None |
| Active | Green | First audit available to run | None |
| Authorized | Yellow | Admin authorized, waiting for user | None |
| Locked | Red | Audit already used, no authorization | "Authorize" button |

**Actions**
- Click "Authorize" button next to a locked audit
- That user gets one more audit run
- After they run it, it locks again

---

## Database Schema

### UserPersona Model

```prisma
model UserPersona {
  id                 String   @id @default(cuid())
  userId             String   @unique
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  personaData        Json     // The actual persona data
  auditUsed          Boolean  @default(false)    // Has audit been used?
  auditAuthorizedAt  DateTime?                  // When admin authorized re-run (if at all)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

### State Transitions

```
[START]
  ↓
auditUsed=false, auditAuthorizedAt=null
  ↓
User runs audit
  ↓
auditUsed=true, auditAuthorizedAt=null
  ↓
[LOCKED] ← User tries again → 403 Error
  ↓
Admin clicks "Authorize"
  ↓
auditUsed=true, auditAuthorizedAt=now()
  ↓
User runs audit again
  ↓
auditUsed=true, auditAuthorizedAt=null
  ↓
[LOCKED AGAIN] ← Cycle repeats
```

---

## API Endpoints

### 1. `POST /api/personas/generate`

**Before**: Check audit lock
```typescript
const existing = await prisma.userPersona.findUnique({ where: { userId } });
if (existing?.auditUsed && !existing?.auditAuthorizedAt) {
  return 403: 'Persona audit has already been used. Admin authorization required.'
}
```

**After**: Mark as used and clear authorization
```typescript
await prisma.userPersona.upsert({
  update: {
    personaData,
    auditUsed: true,
    auditAuthorizedAt: null  // Clear after using
  },
  create: {
    userId,
    personaData,
    auditUsed: true
  }
});
```

**Response**: Generated persona (or 403 if locked)

---

### 2. `GET /api/personas`

**New Response Format**:
```json
{
  "id": "cuid123",
  "userId": "user123",
  "personaData": { ... },
  "auditUsed": true,
  "auditAuthorizedAt": null,
  "auditStatus": {
    "used": true,
    "authorizedAt": null,
    "locked": true,
    "canRun": false
  }
}
```

Frontend uses `auditStatus` to show locked state.

---

### 3. `POST /api/admin/personas/authorize` ⭐ NEW

**Admin-only endpoint** to authorize one more audit run.

**Request**:
```bash
POST /api/admin/personas/authorize
Content-Type: application/json

{
  "userId": "user123"
}
```

**Response**:
```json
{
  "message": "User authorized for one more persona audit",
  "persona": {
    "userId": "user123",
    "auditUsed": true,
    "authorizedAt": "2026-04-13T12:34:56.789Z"
  }
}
```

**Validations**:
- ✅ Admin-only (403 if not admin)
- ✅ User must have a persona (404 if not)
- ✅ Audit must be used (400 if not used yet)
- ✅ Sets `auditAuthorizedAt` to NOW

---

### 4. `GET /api/admin/users`

**Updated Response** includes persona status:
```json
{
  "id": "user123",
  "email": "user@example.com",
  ...
  "persona": {
    "hasPersona": true,
    "auditUsed": true,
    "authorizedAt": null,
    "locked": true,
    "canAuthorize": true  // Has used their audit
  }
}
```

---

## Frontend Implementation

### `/persona` Page Changes

**Locked State** (when `auditUsed=true` AND `auditAuthorizedAt=null`):
```tsx
{auditStatus?.locked && step !== 4 && (
  <Card className="border-red-200 bg-red-50">
    <CardTitle>Persona Audit Locked</CardTitle>
    <CardDescription>
      Your persona audit has already been used. 
      Contact your administrator to authorize another audit run.
    </CardDescription>
  </Card>
)}
```

**Authorized State** (when `auditAuthorizedAt !== null` AND NOT locked):
```tsx
{auditStatus?.authorizedAt && !auditStatus?.locked && (
  <Card className="border-yellow-200 bg-yellow-50">
    <CardTitle>Audit Re-authorized by Admin</CardTitle>
    <CardDescription>
      Your administrator has authorized one more persona audit. 
      Complete the form below to regenerate.
    </CardDescription>
  </Card>
)}
```

**Interview Form**: Only shows if `!auditStatus?.locked`

---

### Admin Users Page Changes

**New Column**: "Persona Audit"

**Status Badges**:
- **—** (grey): No persona created yet
- **Active** (green): Audit available to run
- **Authorized** (yellow): Admin authorized, waiting for user
- **Locked** (red): Audit used, needs authorization

**Action Button**:
- Shows "Authorize" button next to locked audits
- Admin clicks → Sets authorization → User can run once more

---

## Use Cases

### Use Case 1: User Wants to Regenerate Persona
1. User creates persona (audit used)
2. Later, wants to update persona
3. Tries to regenerate
4. Gets message: "Contact admin"
5. Admin clicks "Authorize" in `/admin/users`
6. User gets notification (optional, see below)
7. User comes back to `/persona` and sees "Re-authorized" banner
8. User completes interview again
9. New persona saved, audit locks again

### Use Case 2: Persona Quality Control
1. Admin reviews user's persona (in admin panel future feature)
2. Thinks it needs updating
3. Clicks "Authorize"
4. User regenerates with better interview answers
5. Admin validates new persona

### Use Case 3: Abuse Prevention
1. Malicious user tries to generate 100 personas
2. First one succeeds
3. Second attempt: 403 Forbidden
4. User is blocked from further attempts

---

## Admin Workflow

### Step 1: Check Admin Panel
- Go to `/admin/users`
- Look for red "Locked" badges in "Persona Audit" column

### Step 2: Review User (Optional)
- Click user's email to see details
- Review their current persona
- Decide if re-authorization is needed

### Step 3: Authorize
- Click "Authorize" button next to "Locked" badge
- Confirmation toast: "User authorized for one more persona audit"
- Badge changes from red → yellow "Authorized"

### Step 4: User Runs Audit (Optional)
- User sees "Re-authorized" banner on `/persona`
- User completes interview
- New persona generated and saved
- Badge goes back to red "Locked"

---

## Error Messages

### User-Facing

**Locked State**:
```
Persona Audit Locked
Your persona audit has already been used. 
Contact your administrator to authorize another audit run.
```

**Generation Attempt While Locked**:
```
403 Forbidden
Persona audit has already been used. 
Admin authorization required to run again.
```

### Admin-Facing

**If user has no persona**:
```
404 Not Found
User has no persona
```

**If audit not yet used**:
```
400 Bad Request
User has not used their audit yet
```

---

## Testing Checklist

- [ ] User can create persona first time (audit runs)
- [ ] User can see persona on dashboard after first run
- [ ] User tries to create persona again → 403 error
- [ ] `/persona` page shows "Locked" message when audit used
- [ ] Admin sees "Locked" badge in `/admin/users`
- [ ] Admin clicks "Authorize" button
- [ ] Badge changes to "Authorized" (yellow)
- [ ] User sees "Re-authorized" banner on `/persona`
- [ ] User can run audit second time
- [ ] After second run, badge goes back to "Locked" (red)
- [ ] Process can repeat (authorize → run → lock → repeat)

---

## Future Enhancements

- [ ] Email notification to user when admin authorizes
- [ ] Audit history: show all audit runs and timestamps
- [ ] Approval workflow: admin reviews before authorizing
- [ ] Rate limiting: limit authorizations per period
- [ ] Analytics: track how often users need re-authorization
- [ ] Bulk operations: authorize multiple users at once
- [ ] Audit logging: track who authorized and when

---

## Configuration

No additional environment variables needed. Feature uses existing database and auth system.

---

## Migration Details

**File**: `prisma/migrations/add_persona_audit_lock/migration.sql`

```sql
ALTER TABLE "UserPersona"
  ADD COLUMN "auditUsed" BOOLEAN NOT NULL DEFAULT false;
  
ALTER TABLE "UserPersona"
  ADD COLUMN "auditAuthorizedAt" TIMESTAMP(3);
```

**Applied**: Yes ✅ (via Node script)

---

## Security Considerations

✅ **Admin-only authorization**: Only users with `role='admin'` can authorize  
✅ **Per-user lock**: Audit lock is per-user, not global  
✅ **One-time authorization**: Each auth allows exactly one run, then locks again  
✅ **Clear audit trail**: `auditAuthorizedAt` timestamp shows when auth was given  
✅ **No bypass**: System checks lock on every generation attempt  

---

## Troubleshooting

### User sees "Locked" but should be authorized

**Possible causes**:
- Admin authorized but user hasn't refreshed page
- Authorization timestamp wasn't saved properly

**Solution**:
- User: Refresh page (`F5` or `Cmd+Shift+R`)
- Admin: Check that `auditAuthorizedAt` is not null in DB:
  ```sql
  SELECT * FROM "UserPersona" WHERE "userId" = 'xxx';
  ```

### Admin "Authorize" button not working

**Possible causes**:
- Admin doesn't have proper role
- API endpoint not deployed
- Network error

**Solution**:
- Check `/api/admin/debug` → verify `isAdmin = true`
- Check browser console for error details
- Check server logs for API errors

### User can still generate when locked

**Root cause**: Bug in generation check

**Fix**: Verify `generate/route.ts` has the lock check at the top of POST handler

---

## Commit History

```
aa90cbb feat: add persona audit lock and admin re-authorization
```

All code is committed and ready for deployment.
