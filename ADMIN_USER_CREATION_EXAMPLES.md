# Admin Create User - Example Use Cases

## Example 1: Onboarding a New Team Member

### Scenario
Sarah, the organization admin, needs to add a new team member named Alex to the platform.

### Steps

1. **Log in to Admin Dashboard**
   ```
   Navigate to: /dashboard/admin
   ```

2. **Click "Create User" Button**
   ```
   Location: Team Members section, top-right corner
   ```

3. **Fill in the Form**
   ```
   Email:              alex.johnson@company.com
   First Name:         Alex
   Last Name:          Johnson
   Password:           C0mpl3x!P@ss
   Role:               Member (default)
   Grant Admin Access: ☐ (unchecked)
   ```

4. **Click "Create User"**
   ```
   Modal closes
   Success message: "User created successfully!"
   ```

5. **Share Login Details**
   ```
   Email: alex.johnson@company.com
   Password: C0mpl3x!P@ss
   
   Note: Send through secure channel
   Alex should change password on first login
   ```

### Result
- Alex can now log in to the platform
- Alex is a regular Member with access to dashboards
- Alex cannot manage users or access admin features
- Alex's creation is logged in Activity Feed

---

## Example 2: Adding a New Organization Admin

### Scenario
The company is growing and needs another admin to help manage users. David, a trusted manager, should be promoted to admin.

### Steps

1. **Navigate to Admin Dashboard**
   ```
   /dashboard/admin
   ```

2. **Click "Create User"**

3. **Fill Form for Admin**
   ```
   Email:              david.williams@company.com
   First Name:         David
   Last Name:          Williams
   Password:           Str0ng!Admin#Pass
   Role:               Admin
   Grant Admin Access: ☑ (checked)
   ```

4. **Submit**
   ```
   User created successfully!
   ```

5. **Communicate Admin Privileges**
   ```
   Email David:
   "You now have admin access to manage the organization.
   You can create users, manage roles, and view activity logs."
   ```

### Result
- David is now a full admin
- David can create, edit, and delete users
- David can reset passwords
- David can view the admin dashboard
- David can manage organization settings

---

## Example 3: Re-adding a Former Employee

### Scenario
A team member, Maria, left the company 6 months ago. The company rehired her, and Sarah needs to add her back to the platform.

### Situation
Maria already has a user account in the system from her previous employment, but she's not in the organization.

### Steps

1. **Go to Admin Dashboard**

2. **Click "Create User"**

3. **Enter Maria's Details**
   ```
   Email:              maria.garcia@company.com
   First Name:         Maria
   Last Name:          Garcia
   Password:           NewP@ss2024!
   Role:               Member
   Grant Admin Access: ☐
   ```

4. **Submit Form**
   ```
   ✓ User created successfully!
   ```

5. **Note About What Happened**
   ```
   Backend detected Maria's email already exists
   Instead of creating new account:
   - Updated her password with the new one
   - Added her to the organization
   - Marked her as active
   - Logged the action
   ```

### Result
- Maria can log in with the new password
- Maria has her previous profile data intact
- Maria is back with full access to the platform
- Action logged in Activity Feed

---

## Example 4: Building a New Department

### Scenario
Sarah is setting up a new customer success department with 5 team members. She creates them all one by one.

### Team to Add
```
1. Emily Harrison    - emily.h@company.com     - Manager
2. James Peterson   - james.p@company.com     - Member
3. Lisa Chen        - lisa.c@company.com      - Member
4. Robert Taylor    - robert.t@company.com    - Member
5. Sophie Miller    - sophie.m@company.com    - Member
```

### Process

**User 1: Emily Harrison (Manager)**
```
Email:      emily.h@company.com
First Name: Emily
Last Name:  Harrison
Password:   ManagerPass!123
Role:       Manager
Admin:      ☐
```
Create → Success ✓

**User 2: James Peterson (Member)**
```
Email:      james.p@company.com
First Name: James
Last Name:  Peterson
Password:   MemberPass!456
Role:       Member
Admin:      ☐
```
Create → Success ✓

*[Repeat for Lisa, Robert, and Sophie]*

### Result After Completion
- 5 new team members added to organization
- 1 manager with enhanced permissions
- 4 regular members
- All 5 activities logged in feed
- All can sign in immediately
- Organization user count increases from X to X+5

### Activity Feed Shows
```
👤 Admin added user emily.h@company.com to organization
👤 Admin added user james.p@company.com to organization
👤 Admin added user lisa.c@company.com to organization
👤 Admin added user robert.t@company.com to organization
👤 Admin added user sophie.m@company.com to organization
```

---

## Example 5: Handling Organization User Limit

### Scenario
TechCorp is on a "Growth" plan that allows 50 users. They currently have 49 users and want to add one more.

### Steps

1. **Check Current Status**
   ```
   Admin Dashboard shows:
   Active Users: 49 / 50 (one slot remaining)
   ```

2. **Create New User (Success Case)**
   ```
   Email:      new.employee@techcorp.com
   Password:   Welcome!2024
   Role:       Member
   Admin:      ☐
   
   Click "Create User"
   ✓ Success! Now: 50 / 50
   ```

3. **Attempt to Create Another (Limit Reached)**
   ```
   Email:      another.user@techcorp.com
   Password:   Welcome!2024
   Role:       Member
   Admin:      ☐
   
   Click "Create User"
   ✗ Error: "User limit reached. Your organization is 
              limited to 50 users. Please upgrade your 
              subscription."
   ```

4. **Upgrade Solution**
   ```
   Option A: Deactivate an inactive user first
             Then create new user
   
   Option B: Upgrade subscription to higher tier
             (e.g., "Enterprise" plan with 100 users)
             Then create new user
   ```

### Result
- Sarah understands the limit
- Sarah either removes/deactivates a user OR upgrades
- Once capacity exists, new users can be created
- Clear feedback prevents confusion

---

## Example 6: Deactivating vs. Deleting Users

### Scenario
An employee is taking a 3-month leave of absence. Sarah needs to temporarily disable their access.

### User Actions (Click "..." on User Card)

**Option 1: Deactivate (Recommended)**
```
Employee: Tom Baker
Action: Click "..." → "Deactivate"
Result:
  ✓ Tom cannot log in
  ✓ Tom still appears in user list
  ✓ Tom can be reactivated easily
  ✓ Tom's data is preserved
  ✓ Takes 1 second
```

**After Leave Ends**
```
Click "..." → "Activate"
Result:
  ✓ Tom can log in again
  ✓ Tom's data is intact
  ✓ No disruption
```

### Why Not Delete?

**Option 2: Remove User (Not Recommended for Temporary)**
```
Action: Click "..." → "Remove User"
Confirmation: "Remove Tom Baker?"
Result:
  ✗ Tom deleted permanently
  ✗ Tom's data may be removed
  ✗ To bring back: Must create new user
  ✗ Activity history lost
  ⚠️ Only use for permanent removals
```

### Best Practice Recommendation
```
Temporary absence (< 1 year)
  → Use DEACTIVATE

Permanent removal
  → Use REMOVE USER

User role change
  → CREATE new user with new role
     (Cannot change role after creation)
```

---

## Example 7: Resetting a Forgotten Password

### Scenario
Jennifer lost her password and can't log in. Sarah, the admin, resets it.

### Steps

1. **Go to Admin Dashboard**
   ```
   /dashboard/admin
   ```

2. **Find Jennifer's User Card**
   ```
   Team Members section
   Scroll to find: jennifer.lee@company.com
   ```

3. **Click "..." Menu**
   ```
   Appears top-right of her user card
   ```

4. **Select "Reset Password"**
   ```
   Modal opens with form
   User: Jennifer Lee (jennifer.lee@company.com)
   ```

5. **Enter New Password**
   ```
   New Password: TempPass!2024
   (Sarah will send this to Jennifer securely)
   ```

6. **Click "Reset"**
   ```
   ✓ Password reset successfully!
   ```

7. **Communicate New Password**
   ```
   Send to Jennifer through secure channel:
   "Your password has been reset to: TempPass!2024
    Please change it to something secure on first login"
   ```

### Result
- Jennifer can now log in with new password
- Jennifer should change it to her own secure password
- Password reset is logged in Activity Feed

---

## Example 8: Full Team Management Workflow

### Complete Onboarding Process for a New 3-Person Team

**Day 1: Initial Setup**
```
1. Create Team Lead
   Name: Alex Martinez
   Email: alex.m@company.com
   Role: Manager
   Admin: ☐
   
2. Create Team Member 1
   Name: Casey Smith
   Email: casey.s@company.com
   Role: Member
   Admin: ☐
   
3. Create Team Member 2
   Name: Jordan Lee
   Email: jordan.l@company.com
   Role: Member
   Admin: ☐
```

**Day 2: Distribution**
```
Send credentials:
Team Lead:     alex.m@company.com / TempPassword1
Member 1:      casey.s@company.com / TempPassword2
Member 2:      jordan.l@company.com / TempPassword3

Request: Change passwords on first login
```

**Day 3: First Login Verification**
```
Check Activity Feed to see who's logged in:
✓ Alex Martinez signed in
✓ Casey Smith signed in
✓ Jordan Lee signed in

All team members activated!
```

**Ongoing Management**
```
Monitor team activity
Create org-wide tasks for them
Monitor performance through Activity Feed
Deactivate if they leave
Re-activate if they return
```

---

## Quick Copy-Paste Templates

### Template 1: Basic Team Member
```
Email:      [firstname.lastname]@company.com
First Name: [First Name]
Last Name:  [Last Name]
Password:   [Generate strong password]
Role:       Member
Admin:      ☐
```

### Template 2: Team Manager
```
Email:      [firstname.lastname]@company.com
First Name: [First Name]
Last Name:  [Last Name]
Password:   [Generate strong password]
Role:       Manager
Admin:      ☐
```

### Template 3: Organization Admin
```
Email:      [firstname.lastname]@company.com
First Name: [First Name]
Last Name:  [Last Name]
Password:   [Generate strong password]
Role:       Admin
Admin:      ☑
```

---

## Batch User Creation Checklist

If creating multiple users at once:

```
Preparation:
☐ Gather all team member information
☐ Generate strong passwords
☐ Create a list for reference
☐ Have secure communication channel ready

Creation:
☐ Go to Admin Dashboard
☐ For each user:
  ☐ Click "Create User"
  ☐ Fill all required fields
  ☐ Click "Create User"
  ☐ Verify success message
☐ Download/save credential list

Distribution:
☐ Send emails/credentials through secure channel
☐ Request password change on first login
☐ Confirm all users can access platform

Verification:
☐ Check Activity Feed for all creations
☐ Verify user count updated
☐ Monitor for first logins
☐ Follow up with new users
```

---

## Troubleshooting Common Issues

### Issue 1: Can't Find Create User Button
**Location**: Team Members section (left side of admin dashboard)  
**Button Text**: "+ Create User" in top-right of section  
**If not visible**: You may not have admin access

### Issue 2: Form Won't Submit
**Check**:
- Email field is filled and valid format
- Password is at least 8 characters
- Click "Create User" button (not Enter key)

### Issue 3: User Limit Reached
**Solution**:
- Deactivate unused users, OR
- Remove inactive users, OR
- Upgrade subscription to higher tier

### Issue 4: User Already Exists Error
**Means**: Email is already in your organization
**Solution**: Use different email address

### Issue 5: "Admin access required" Error
**Means**: You don't have admin permissions
**Solution**: Ask your organization admin to create users

---

## Summary

The "Create User" feature is straightforward:

1. **Click button** → Open form
2. **Fill fields** → Email, password, name, role
3. **Submit** → User created instantly
4. **Share creds** → Send securely to new user
5. **Monitor** → Check Activity Feed

**You're ready to start managing users!**
