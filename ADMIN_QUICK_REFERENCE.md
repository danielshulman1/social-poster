# Admin Create User - Quick Reference Card

## How to Create a User (5 Steps)

```
1. Navigate to /dashboard/admin
   ↓
2. Click "+ Create User" button in Team Members section
   ↓
3. Fill in required fields:
   - Email (required)
   - Password (required, min 8 chars)
   - First Name (optional)
   - Last Name (optional)
   ↓
4. Set options:
   - Role: Member / Manager / Admin
   - Grant admin access: Check if needed
   ↓
5. Click "Create User"
```

## Required Fields
| Field | Format | Example |
|-------|--------|---------|
| Email | Valid email | user@company.com |
| Password | Min 8 chars | MyP@ssw0rd |

## Optional Fields
| Field | Options | Default |
|-------|---------|---------|
| First Name | Any text | (empty) |
| Last Name | Any text | (empty) |
| Role | Member, Manager, Admin | Member |
| Admin Access | Yes/No checkbox | No |

## User Actions (Click "..." on user card)
- **🔐 Reset Password** - Set new password
- **✓/✗ Activate/Deactivate** - Toggle user access
- **🗑️ Remove User** - Permanently delete from org

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| Email and password required | Missing required field | Fill both fields |
| Password must be at least 8 characters | Password too short | Use 8+ characters |
| User is already part of this organization | Email already in org | Use different email |
| User limit reached | At subscription maximum | Upgrade plan |

## User Limit
```
Current: X / Y users
    ↓
If X = Y → Cannot add more users
           → Need to upgrade subscription
```

## Permission Requirements
✅ Must have admin access  
✅ Must be organization member  
✅ Cannot be used by regular users

## API Endpoint (for developers)
```
POST /api/admin/users
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "email": "user@company.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "member",
  "isAdmin": false
}
```

## Roles Explained

| Role | Permissions |
|------|-------------|
| **Member** | Access dashboard, create tasks, view personal data |
| **Manager** | All member permissions + manage team tasks |
| **Admin** | All permissions + user management, org settings |

## Role Comparison

| Action | Member | Manager | Admin |
|--------|--------|---------|-------|
| View Dashboard | ✅ | ✅ | ✅ |
| Create Tasks | ✅ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |
| Reset Passwords | ❌ | ❌ | ✅ |
| Manage Organization | ❌ | ❌ | ✅ |
| View Activity Log | ❌ | ❌ | ✅ |

## Best Practices Checklist

- [ ] Verify email is correct before creating
- [ ] Use strong passwords (8+ chars, mixed case, numbers, symbols)
- [ ] Only grant admin access when necessary
- [ ] Review user list regularly for inactive accounts
- [ ] Deactivate instead of deleting when possible
- [ ] Document admin access grants for security

## Keyboard Shortcuts
| Action | Shortcut |
|--------|----------|
| Open Create User modal | (none - use button) |
| Close modal | Esc key |
| Submit form | Enter or Click button |

## Stats Available on Admin Dashboard
- **Active Users**: X / Y (current / max)
- **Drafts (7d)**: Total drafts created this week
- **Open Tasks**: Organization-wide open tasks
- **Emails (7d)**: Emails processed this week

## Need Help?
- Check form error messages
- Ensure all required fields are filled
- Verify you have admin access
- Check organization user limit
- Review Activity Feed for past creations
