# SCHEMA-COMPATIBLE DEMO SETUP - BandhuConnect+ v2.1.0

## 🏗️ **Two-Step Setup Process**

Based on your current database schema, demo setup requires **two steps** because `auth.users` should be managed by Supabase Auth API, not direct SQL inserts.

## 📋 **STEP 1: Create Auth Users (Manual)**

### Option A: Supabase Dashboard

1. Go to **Authentication > Users** in Supabase Dashboard
2. Click **"Add User"** for each demo account
3. Use these credentials:

| Email                      | Password    | Role      |
| -------------------------- | ----------- | --------- |
| dr.rajesh.medical@demo.com | password123 | Volunteer |
| priya.guide@demo.com       | password123 | Volunteer |
| amit.security@demo.com     | password123 | Volunteer |
| ravi.maintenance@demo.com  | password123 | Volunteer |
| sara.translator@demo.com   | password123 | Volunteer |
| ramesh.elderly@demo.com    | password123 | Pilgrim   |
| sunita.family@demo.com     | password123 | Pilgrim   |
| mohan.lost@demo.com        | password123 | Pilgrim   |
| geeta.foreign@demo.com     | password123 | Pilgrim   |
| vijay.emergency@demo.com   | password123 | Pilgrim   |
| kavita.disabled@demo.com   | password123 | Pilgrim   |
| arjun.student@demo.com     | password123 | Pilgrim   |
| lakshmi.group@demo.com     | password123 | Pilgrim   |
| admin@bandhuconnect.com    | admin123    | Admin     |

### Option B: Programmatic Creation (JavaScript)

```javascript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const demoUsers = [
  { email: "dr.rajesh.medical@demo.com", password: "password123" },
  { email: "priya.guide@demo.com", password: "password123" },
  // ... add all users
];

for (const user of demoUsers) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
  });
  console.log(`Created user: ${user.email}`, data?.user?.id);
}
```

## 📋 **STEP 2: Run SQL Demo Setup**

After creating auth users, run `SCHEMA_COMPATIBLE_DEMO_SETUP.sql` in Supabase SQL Editor.

### What This Script Creates:

- ✅ **14 Demo Profiles** (5 volunteers, 8 pilgrims, 1 admin)
- ✅ **13 User Locations** (real GPS coordinates)
- ✅ **10 Assistance Requests** (6 pending, 4 completed)
- ✅ **4 Assignments** (for success rate testing)

### Schema Compatibility:

- ✅ Uses correct enum types from your schema
- ✅ Compatible with your current table structure
- ✅ Handles PostGIS geography properly
- ✅ Creates proper foreign key relationships

## 📋 **STEP 3: Link Profiles to Auth Users**

After running the SQL script, you'll need to update the `user_id` field in profiles:

```sql
-- Update profiles with auth user IDs
UPDATE profiles
SET user_id = (
    SELECT id FROM auth.users
    WHERE email = profiles.email
)
WHERE email LIKE '%@demo.com' OR email = 'admin@bandhuconnect.com';
```

## 🔍 **Verification Queries**

### Check Auth Users Created:

```sql
SELECT email, id, email_confirmed_at
FROM auth.users
WHERE email LIKE '%@demo.com' OR email = 'admin@bandhuconnect.com'
ORDER BY email;
```

### Check Profiles Linked:

```sql
SELECT p.email, p.name, p.role,
       p.user_id IS NOT NULL as has_auth_link
FROM profiles p
WHERE p.email LIKE '%@demo.com' OR email = 'admin@bandhuconnect.com'
ORDER BY p.role, p.email;
```

### Check Complete Setup:

```sql
SELECT
    p.email,
    p.name,
    p.role,
    au.id as auth_user_id,
    p.user_id = au.id as properly_linked
FROM profiles p
LEFT JOIN auth.users au ON p.email = au.email
WHERE p.email LIKE '%@demo.com' OR p.email = 'admin@bandhuconnect.com'
ORDER BY p.role, p.email;
```

## 🎯 **Expected Results**

After complete setup:

- **14 auth.users** with confirmed emails
- **14 profiles** linked to auth users
- **13 user_locations** for tracking
- **10 assistance_requests** (mix of pending/completed)
- **4 assignments** for success rate calculations

## 🚨 **Common Issues & Solutions**

### Issue: "user_id cannot be null"

**Solution**: Ensure auth users are created first, then run the linking query

### Issue: "enum type not found"

**Solution**: Check that your database has the required enum types:

- `user_role`
- `volunteer_status`
- `request_type`
- `request_status`
- `priority_level`
- `assignment_status`

### Issue: "PostGIS function not found"

**Solution**: Ensure PostGIS extension is enabled:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

## 🔐 **Security Notes**

- Demo passwords are simple for testing only
- All demo accounts clearly marked with @demo.com domain
- Remove demo accounts before production deployment
- Auth users have proper email confirmation set
- Profiles maintain proper role-based access control

## 🚀 **Quick Start Commands**

```bash
# 1. Create auth users via Supabase Dashboard or API
# 2. Run the demo setup SQL
# 3. Link profiles to auth users
UPDATE profiles SET user_id = (SELECT id FROM auth.users WHERE email = profiles.email)
WHERE email LIKE '%@demo.com' OR email = 'admin@bandhuconnect.com';
```

This setup ensures compatibility with your current schema while providing a complete demo environment! 🎉
