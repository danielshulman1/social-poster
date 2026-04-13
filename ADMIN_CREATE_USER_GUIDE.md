# Admin Create User Guide

## Overview
Admins can create new users and add them to their organization. This feature includes role assignment, password management, and admin access control.

## Accessing the Feature

### 1. Navigate to Admin Dashboard
- Go to `/dashboard/admin`
- Only users with admin access can view this page
- Non-admin users will see an "Admin Access Required" error

### 2. Locate the "Create User" Button
- Found in the **Team Members** section (left column)
- Look for the button labeled "+ Create User"
- Click to open the Create User modal

## Creating a User

### Form Fields

#### **Email** (Required)
- Must be a valid email address
- If the email already exists in the system:
  - The existing user will be added to your organization
  - Their password can be updated if provided
- If it's a new email:
  - A new user account will be created

#### **First Name** (Optional)
- User's first name
- Helps identify users in the team list

#### **Last Name** (Optional)
- User's last name
- Displayed alongside first name in the team list

#### **Password** (Required)
- Minimum 8 characters
- Must be provided for new users
- For existing users being added to your org, password is optional (they can use their existing one)
- Password should be strong and secure

#### **Role** (Optional)
- Default: `Member`
- Options:
  - **Member**: Regular user with access to dashboards and basic features
  - **Manager**: User with management capabilities
  - **Admin**: Full administrative access to the organization (see "Grant admin access" checkbox below)

#### **Grant Admin Access** (Optional Checkbox)
- Check this box to make the user an organization admin
- Admins can:
  - Create, edit, and delete users
  - Manage organization settings
  - View all organization activity and analytics
  - Reset user passwords
  - Activate/deactivate users
  - Create organization-wide tasks

## Submission and Validation

### Before Clicking "Create User"
- Email is required
- Password is required (minimum 8 characters)
- Email format must be valid

### Validation Rules
- **User Limit**: Organization has a maximum number of users based on subscription tier
  - If you've reached the limit, you'll see an error message
  - You'll need to upgrade your subscription to add more users
- **Existing Users**: If the email already exists in your organization, you'll see an error
- **Password Requirements**: 
  - Minimum 8 characters
  - Must be provided for new users

### Success Message
- After successful creation, you'll see: "User created successfully!"
- The modal will close automatically
- The team members list will refresh to show the new user

## Managing Created Users

### User Card Features
After creating a user, you'll see their card in the Team Members section showing:
- User name (or email if name not provided)
- Email address
- Activity metrics (drafts, tasks, actions in last 7 days)
- Admin badge (if applicable)
- Inactive badge (if user is deactivated)

### Actions Available (Click "..." menu on user card)

#### **Reset Password**
- Set a new password for the user
- Minimum 8 characters
- User will need to use this new password on next login

#### **Activate/Deactivate**
- Toggle user's active status
- Inactive users cannot sign in
- Useful for temporarily disabling access without removing the user

#### **Remove User**
- Permanently removes user from organization
- Confirmation required before deletion
- Cannot be undone without re-inviting the user

## User Limits and Subscription Tiers

### Organization User Limit
- Each organization has a maximum number of users based on subscription tier
- The admin page displays: **Active Users: X / Y** (current / max)
- When you reach the limit, you cannot create new users

### Upgrading User Limit
- To add more users beyond your organization's limit:
  1. Go to your subscription/billing settings
  2. Upgrade to a higher tier
  3. Return to admin page to create more users

## Best Practices

### 1. Use Meaningful Names
- Always include first and last names when possible
- Makes it easier to identify users in the dashboard

### 2. Strong Passwords
- Use unique, complex passwords for new users
- Consider using a password manager
- Advise users to change their password on first login (if available)

### 3. Role Assignment
- Assign appropriate roles based on responsibility
- Not all users need admin access
- Use "Member" role as default for regular team members

### 4. Admin Access
- Limit admin access to trusted team members
- Only grant admin access when necessary
- Regularly review who has admin access

### 5. Deactivation vs Deletion
- Use Deactivate for temporarily disabled access
- Use Remove User only when you're sure you don't need the account
- Deactivated users can be reactivated later

## Troubleshooting

### "User limit reached" Error
- Your organization has reached its maximum user capacity
- Solution: Upgrade your subscription plan or remove inactive users

### "User is already part of this organization" Error
- The email you entered is already a member
- Solution: Use a different email or check if they're already added

### "Password must be at least 8 characters" Error
- The password you entered is less than 8 characters
- Solution: Enter a stronger password with at least 8 characters

### Form Won't Submit
- Email field is required and must be valid
- Password field is required and must be at least 8 characters
- Solution: Check all required fields (marked with *)

## API Details (For Developers)

### Endpoint
```
POST /api/admin/users
```

### Request Body
```json
{
  "email": "user@company.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "member",
  "isAdmin": false
}
```

### Response
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@company.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "member",
    "isAdmin": false
  }
}
```

### Error Responses
- **400**: Invalid input (missing required fields, invalid format)
- **403**: Admin access required or user limit reached
- **500**: Server error

## Activity Logging

When a user is created:
- An activity entry is recorded in the Activity Feed
- Shows: "Admin added user [email] to organization"
- Appears in the Admin Dashboard Activity Feed section
- Timestamp recorded for audit purposes

## Security Considerations

### Password Storage
- Passwords are hashed using argon2 before storage
- Never stored in plain text
- Cannot be retrieved, only reset

### Admin Access
- Admin creation requires existing admin authentication
- Cannot be done by regular users
- All user creations are logged in activity feed

### Organization Isolation
- Users can only be added to organizations where the admin has access
- Users created in one organization are isolated from others
- Subscriptions and user limits are per-organization

## Common Scenarios

### Scenario 1: Add Team Member
1. Go to Admin Dashboard
2. Click "+ Create User"
3. Enter email: `jane@company.com`
4. First Name: `Jane`, Last Name: `Smith`
5. Password: Strong password
6. Role: `Member` (default)
7. Leave "Grant admin access" unchecked
8. Click "Create User"

### Scenario 2: Add New Organization Admin
1. Go to Admin Dashboard
2. Click "+ Create User"
3. Enter email: `admin@company.com`
4. First Name: `Bob`, Last Name: `Johnson`
5. Password: Strong password
6. Role: `Admin`
7. Check "Grant admin access"
8. Click "Create User"

### Scenario 3: Re-add Existing User to Organization
1. Go to Admin Dashboard
2. Click "+ Create User"
3. Enter email: `existing@company.com` (existing email)
4. Password: Can be skipped if user has existing password, or provide new one to reset
5. Set desired role
6. Click "Create User"
7. User is now part of the organization

## Performance Notes

- Creating a user typically takes 1-2 seconds
- Team list updates immediately after creation
- Activity feed updates reflect new user creation
- Organization stats update in real-time

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review the error message carefully
3. Ensure all required fields are filled correctly
4. Verify you have admin access
5. Check organization user limit hasn't been reached
