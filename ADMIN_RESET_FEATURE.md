# Admin Reset Feature - Dashboard

## 🎯 Overview

The "Create AI Persona" button now:
- ✅ **Shows once** - Only visible if user has NO persona
- ✅ **Hides after use** - Disappears once persona is created
- ✅ **Admin can reset** - Admins can delete personas to let users recreate

---

## 📍 User Flow

### Regular User
```
1. User logs in
2. Goes to /dashboard
3. Sees "No Persona Yet" box with "Create AI Persona" button
4. Clicks button → goes to /onboarding
5. Completes onboarding
6. Persona is created and saved
7. Back on dashboard, button DISAPPEARS
8. Now shows persona summary instead
```

### Admin User (Same as Above + Reset Option)
```
1-7. (Same as regular user)
8. Admin sees "Admin: Reset Persona" link
9. Can click to delete persona
10. After deletion, button reappears for user to recreate
```

---

## 🔧 How to Set Up Admin Access

### Step 1: Add Environment Variable to Vercel

Go to: **https://vercel.com/dashboard** → Your Project → Settings → Environment Variables

Add this variable:
```
NEXT_PUBLIC_ADMIN_EMAILS=your-email@example.com,other-admin@example.com
```

**Example:**
```
NEXT_PUBLIC_ADMIN_EMAILS=admin@socialposter.co.uk,support@socialposter.co.uk
```

Multiple admins? Separate with commas (no spaces).

### Step 2: Redeploy

Vercel will automatically rebuild with the new environment variable.

---

## 💡 What Admins Can Do

### View Admin Option
- Log in as admin user (email in NEXT_PUBLIC_ADMIN_EMAILS)
- Go to /dashboard
- If persona exists, you'll see "Admin: Reset Persona" link at bottom right

### Reset a Persona
1. Click "Admin: Reset Persona"
2. Confirmation box appears
3. Click "Delete Persona" to confirm
4. Persona is deleted from database
5. User can now create a new one

### Why You Might Reset
- User wants to create a new persona (old one wasn't good)
- Testing the feature
- User's business changed significantly
- Want to re-analyze their posts

---

## 🔍 Technical Details

### Code Location
`frontend/src/app/dashboard/page.tsx`

### How It Works
```typescript
// Check if user is admin
const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',');
const userIsAdmin = adminEmails.includes(user.email || '');

// Show button only if NO persona
{!persona && <button>Create AI Persona</button>}

// Show reset only if persona exists AND user is admin
{persona && isAdmin && <button>Admin: Reset Persona</button>}
```

### Database Changes
- Deletes row from `user_personas` table
- Does NOT delete interview or social connection data
- User can complete onboarding again
- New persona will be fresh analysis

---

## ✨ Features

✅ **One-time button** - Creates opportunity, not spam  
✅ **Admin override** - Can reset for testing/support  
✅ **Clear UI** - Admin link only shows to admins  
✅ **Confirmation** - Can't accidentally delete persona  
✅ **Environment based** - Easy to add/remove admins  
✅ **Public env var** - Safe to use (just email list)  

---

## 📋 Testing Checklist

- [ ] Regular user: Button shows with no persona
- [ ] Regular user: Button hides after creation
- [ ] Admin user: Can see "Admin: Reset Persona" link
- [ ] Admin user: Can click link to show confirmation
- [ ] Admin user: Can click "Delete Persona" to reset
- [ ] After reset: Button reappears for user
- [ ] Non-admin: Does NOT see admin link
- [ ] Redeploy: Works after adding NEXT_PUBLIC_ADMIN_EMAILS

---

## 🚀 Live Features

✅ Dashboard shows/hides button based on persona status  
✅ Admin reset functionality active  
✅ User can create persona once via onboarding  
✅ Admin can reset if needed  

---

## 📞 Support

**To add an admin:**
1. Get their email
2. Add to NEXT_PUBLIC_ADMIN_EMAILS in Vercel
3. Redeploy
4. They can now reset personas

**To remove an admin:**
1. Remove email from NEXT_PUBLIC_ADMIN_EMAILS
2. Redeploy

No code changes needed! 🎉
