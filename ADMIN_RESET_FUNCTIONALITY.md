# Admin Reset Functionality - Implementation Guide

Complete guide for the admin reset feature that lets admins reset user onboarding from the admin panel.

---

## 📋 Overview

Admins can now reset a user's onboarding directly from the admin tier management panel. When a reset is triggered:

✅ Onboarding flag is cleared (`onboarding_complete = false`)
✅ Persona data is deleted
✅ Posts analysed count is reset to 0
✅ User's account, tier, and setup fee status remain unchanged
✅ An audit log entry is created with admin notes
✅ User receives email notification

---

## 🗂️ Files Added/Modified

### New Files

1. **`utils/admin-logs.js`** (140 lines)
   - Database operations for audit logging
   - Log admin actions to database
   - Query logs by user, admin, or action type

2. **`api/admin/users/reset-onboarding/route.js`** (80 lines)
   - API endpoint to handle reset requests
   - Verifies admin access
   - Clears persona data
   - Sends email notification
   - Logs the action

3. **`lib/email.js`** (150 lines)
   - Email templates and sending logic
   - Onboarding reset notification email
   - Tier upgrade confirmation email
   - Supports Supabase email, SendGrid, or Nodemailer

4. **`database/migrations/002_create_admin_logs_table.sql`** (30 lines)
   - Creates `admin_logs` table
   - Stores audit trail of admin actions
   - Includes indexes for performance

### Modified Files

5. **`components/AdminTierManagement.jsx`** (+50 lines)
   - Added "Reset Onboarding" button
   - New `handleResetOnboarding()` function
   - Prompts admin for optional reason
   - Shows success/error messages

---

## 🚀 Setup Instructions

### 1. Run Database Migration

Execute the SQL to create the audit logging table:

```bash
# Supabase Dashboard
# 1. Go to SQL Editor
# 2. Copy contents of: database/migrations/002_create_admin_logs_table.sql
# 3. Click "Run"
```

Or via psql:
```bash
psql -U postgres -h your-host -d your-db < database/migrations/002_create_admin_logs_table.sql
```

### 2. Configure Email Provider (Optional but Recommended)

Choose one email provider:

**Option A: Supabase Email (Built-in)**
```bash
# Supabase handles email - no additional setup needed
# Configure in Supabase Dashboard → Authentication → Email Templates
```

**Option B: SendGrid**
```bash
# Add to .env.local or Vercel environment variables
SENDGRID_API_KEY=sg_your_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

**Option C: Custom SMTP**
```bash
# Add to environment variables
SMTP_URL=smtp://username:password@smtp.server.com:587
SMTP_FROM=noreply@yourdomain.com
```

### 3. Verify Admin Panel Access

The reset button is already integrated into `AdminTierManagement.jsx`. To access it:

1. Go to `/admin/tiers` page (if using the provided admin page)
2. Select a user from the list
3. Scroll down to "Additional Actions" section
4. Click "Reset Onboarding"

---

## 💡 How It Works

### User Flow

```
Admin clicks "Reset Onboarding"
        ↓
Admin enters optional reason (or skips)
        ↓
Request sent to /api/admin/users/reset-onboarding
        ↓
Server verifies admin permissions
        ↓
Clear persona data from database
        ↓
Create audit log entry
        ↓
Send email notification to user
        ↓
Show success message to admin
        ↓
User sees onboarding UI on next login
```

### Data Changes

**Before Reset:**
```javascript
{
  user_id: 123,
  onboarding_complete: true,
  persona_data: { /* full persona JSON */ },
  posts_analysed_count: 45,
  created_at: "2024-04-01",
  updated_at: "2024-04-05"
}
```

**After Reset:**
```javascript
{
  user_id: 123,
  onboarding_complete: false,      // ← cleared
  persona_data: null,               // ← cleared
  posts_analysed_count: 0,          // ← reset
  created_at: "2024-04-01",        // ← unchanged
  updated_at: "2024-04-11"         // ← updated
}
```

**Unchanged:**
- User tier
- Setup fee paid status
- Account active status

---

## 📚 API Reference

### Reset Onboarding Endpoint

**POST** `/api/admin/users/reset-onboarding`

#### Request

```javascript
{
  "userId": 123,
  "reason": "User requested to redo persona (optional)"
}
```

#### Response (Success)

```javascript
{
  "success": true,
  "message": "Onboarding reset for user john@example.com",
  "user": {
    "id": 123,
    "email": "john@example.com"
  },
  "logEntry": {
    "id": 456,
    "action": "persona_reset",
    "createdAt": "2024-04-11T14:30:00Z"
  }
}
```

#### Response (Error)

```javascript
{
  "error": "User not found" // or other error message
}
```

#### Status Codes

- `200` - Reset successful
- `400` - Missing userId parameter
- `403` - Not authorized (not an admin)
- `404` - User not found
- `500` - Server error

---

## 🗂️ Database Schema

### admin_logs Table

```sql
CREATE TABLE admin_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES users(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,        -- 'persona_reset', 'tier_upgrade', etc
  reason TEXT,                         -- Optional notes from admin
  metadata JSONB,                      -- Additional data as JSON
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Indexes:
├── idx_admin_logs_user_id
├── idx_admin_logs_admin_id
├── idx_admin_logs_action
└── idx_admin_logs_created_at
```

### Example Log Entry

```json
{
  "id": 1,
  "admin_id": 1,
  "user_id": 123,
  "action": "persona_reset",
  "reason": "User requested fresh persona analysis",
  "metadata": {
    "previousStatus": "onboarding_complete (if existed)",
    "newStatus": "onboarding_reset",
    "timestamp": "2024-04-11T14:30:00Z"
  },
  "created_at": "2024-04-11T14:30:00Z"
}
```

---

## 📧 Email Notification

When onboarding is reset, user receives email:

**Subject:** "Your Persona Has Been Reset"

**Content:**
```
Hi [User],

Your AI persona has been reset by our team.

Reason: [Admin's reason or generic message]

This means you can go back through the onboarding process
to create a fresh persona for your AI. All your account 
settings, tier, and subscription remain active.

When you're ready, log in to your dashboard and you'll be
guided back to the beginning of the onboarding flow.

[Dashboard Button]
```

The email template is in `lib/email.js` and can be customized.

---

## 🔐 Security & Permissions

### Authorization Check

```javascript
// Only users with is_admin = true can reset
const adminUser = await requireAdmin(request);
if (!adminUser) {
  return Response.json({ error: 'Unauthorized' }, { status: 403 });
}
```

### Audit Trail

Every reset is logged:
- Who reset it (admin_id)
- Who was affected (user_id)
- When it happened (timestamp)
- Why it was reset (optional reason)
- Additional metadata

### Access Control

Only admins see the reset button in the admin panel. Regular users cannot access:
- `/api/admin/users/reset-onboarding`
- The reset button in AdminTierManagement component

---

## 🛠️ Helper Functions

### Log an Admin Action

```javascript
import { logAdminAction } from '@/utils/admin-logs';

await logAdminAction(
  adminId,           // who did it
  userId,            // who was affected
  'persona_reset',   // what action
  'User requested',  // optional reason
  { extra: 'data' }  // optional metadata
);
```

### Get Logs for a User

```javascript
import { getAdminLogsForUser } from '@/utils/admin-logs';

const logs = await getAdminLogsForUser(userId);
// Returns: [
//   { id: 1, admin_id: 1, action: 'persona_reset', reason: '...', ... },
//   { id: 2, admin_id: 1, action: 'tier_upgrade', reason: null, ... },
//   ...
// ]
```

### Query All Logs

```javascript
import { getAdminLogs } from '@/utils/admin-logs';

const logs = await getAdminLogs({
  action: 'persona_reset',
  adminId: 1,
  startDate: new Date('2024-04-01')
});
```

### Send Reset Email

```javascript
import { sendOnboardingResetEmail } from '@/lib/email';

await sendOnboardingResetEmail({
  email: 'user@example.com',
  adminName: 'admin@example.com',
  reason: 'User requested fresh start'
});
```

---

## ✅ Testing Checklist

### Manual Testing

- [ ] Admin can see "Reset Onboarding" button in admin panel
- [ ] Clicking button prompts for optional reason
- [ ] Can submit with reason or leave blank
- [ ] Success message appears
- [ ] User's persona data is cleared in database
- [ ] Check admin_logs table has new entry
- [ ] User receives notification email
- [ ] User onboarding_complete flag is false after reset
- [ ] User tier and setup_fee_paid remain unchanged

### Edge Cases

- [ ] Reset for user who hasn't started onboarding (graceful handling)
- [ ] Reset with special characters in reason
- [ ] Multiple resets of same user (all logged)
- [ ] Email failure doesn't break API response
- [ ] Non-admin can't access reset endpoint (403 response)

---

## 🔄 Integration with Tier System

The reset functionality works alongside the tier system:

```javascript
// Both can be managed from admin panel
<AdminTierManagement />

// Within AdminTierManagement:
├── Tier management
│   ├── View current tier
│   ├── Update tier
│   └── Cancel subscription
└── Onboarding management
    ├── Reset onboarding
    └── (audit logs)
```

A user can:
- Be on any tier (FREE, STARTER, CORE, PREMIUM)
- Have setup fee paid or unpaid
- Have onboarding complete or incomplete
- Have their onboarding reset independently of tier

---

## 📊 Admin Audit Dashboard (Optional Enhancement)

To see all admin activity, create a dashboard page:

```javascript
// app/admin/audit-logs/page.jsx

import { getAdminLogs } from '@/utils/admin-logs';

export async function AdminAuditLogsPage() {
  const logs = await getAdminLogs();
  
  return (
    <div>
      <h1>Audit Logs</h1>
      <table>
        <tr>
          <th>Timestamp</th>
          <th>Admin</th>
          <th>User</th>
          <th>Action</th>
          <th>Reason</th>
        </tr>
        {logs.map(log => (
          <tr key={log.id}>
            <td>{new Date(log.created_at).toLocaleString()}</td>
            <td>{log.admin_email}</td>
            <td>{log.user_email}</td>
            <td>{log.action}</td>
            <td>{log.reason}</td>
          </tr>
        ))}
      </table>
    </div>
  );
}
```

---

## 🚨 Troubleshooting

### Email Not Sending

**Problem:** Reset completes but user doesn't get email

**Solutions:**
1. Check email provider is configured (SENDGRID_API_KEY, SMTP_URL, etc)
2. Check email address in users table is correct
3. Check spam/junk folder
4. Test email manually: `await sendOnboardingResetEmail({...})`

### Admin Can't See Reset Button

**Problem:** Reset button not visible in admin panel

**Solutions:**
1. Verify user has `is_admin = true` in org_members
2. Check AdminTierManagement component is imported correctly
3. Clear browser cache
4. Verify you're using updated AdminTierManagement.jsx

### Permission Denied Error

**Problem:** Reset returns 403 Unauthorized

**Solutions:**
1. Verify your auth token is valid
2. Check user role: `SELECT is_admin FROM org_members WHERE user_id = YOUR_ID`
3. Check Authorization header format: `Bearer YOUR_TOKEN`

### Admin Logs Not Created

**Problem:** Reset works but no log entry

**Solutions:**
1. Run migration 002 to create admin_logs table
2. Check table exists: `SELECT * FROM admin_logs LIMIT 1;`
3. Verify admin_id in your auth context is correct

---

## 📝 Customization

### Change Email Template

Edit `lib/email.js` function `generateOnboardingResetEmailHTML()`:

```javascript
function generateOnboardingResetEmailHTML(adminName, reason) {
  return `
    <!-- Your custom HTML here -->
  `;
}
```

### Add to Other Admin Actions

The logging pattern works for any admin action:

```javascript
// When admin upgrades a user
await logAdminAction(adminId, userId, 'tier_upgrade', reason, {
  oldTier: 'FREE',
  newTier: 'PREMIUM'
});

// When admin cancels subscription
await logAdminAction(adminId, userId, 'subscription_cancelled', reason);

// When admin resets password
await logAdminAction(adminId, userId, 'password_reset', reason);
```

### Change Reset Button Behavior

In `AdminTierManagement.jsx`, modify `handleResetOnboarding()`:

```javascript
async function handleResetOnboarding() {
  // Add custom logic here
  // e.g., require confirmation, log extra data, etc
}
```

---

## 🎓 Learning Path

1. **Setup** (5 min)
   - Run database migration
   - Configure email provider (optional)

2. **Test** (10 min)
   - Access admin panel
   - Try resetting a test user
   - Verify email received

3. **Monitor** (optional)
   - Check admin_logs table for audit trail
   - Create audit dashboard for visibility

4. **Customize** (as needed)
   - Update email templates
   - Add to other admin actions
   - Create advanced logging reports

---

## ✨ Summary

The admin reset functionality is now fully integrated:

✅ UI button in admin panel
✅ API endpoint with proper auth
✅ Database logging for audit trail
✅ Email notification to users
✅ User tier/subscription unaffected
✅ Full error handling

Users can now be sent back to onboarding while keeping their paid status intact!

---

**Next Step:** Implement the AI Persona Builder onboarding flow (see separate documentation)
