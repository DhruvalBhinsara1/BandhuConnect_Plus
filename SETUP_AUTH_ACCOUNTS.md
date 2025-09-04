# Setup Authentication Accounts for Demo

## Step 1: Create Auth Users in Supabase Dashboard

Go to **Supabase Dashboard** → **Authentication** → **Users** → **Add user**

Create these accounts with **Auto Confirm User** ✅ enabled:

### Volunteer Accounts:
1. **Dr. Rajesh Patel**
   - Email: `dr.rajesh.medical@demo.com`
   - Password: `password123`
   - Auto Confirm: ✅

2. **Priya Sharma** 
   - Email: `priya.guide@demo.com`
   - Password: `password123`
   - Auto Confirm: ✅

3. **Amit Kumar**
   - Email: `amit.security@demo.com`
   - Password: `password123`
   - Auto Confirm: ✅

### Pilgrim Accounts:
4. **Ramesh Gupta**
   - Email: `ramesh.elderly@demo.com`
   - Password: `password123`
   - Auto Confirm: ✅

5. **Sunita Devi**
   - Email: `sunita.family@demo.com`
   - Password: `password123`
   - Auto Confirm: ✅

### Admin Account:
6. **Admin User**
   - Email: `admin@bandhuconnect.com`
   - Password: `admin123`
   - Auto Confirm: ✅

## Step 2: Run Profile Creation Script

After creating auth users, run `database/create-auth-accounts.sql` to create matching profiles.

## Step 3: Update Profile IDs

After creating auth users, you need to update the profile IDs to match:

```sql
-- Get the actual auth user IDs
SELECT id, email FROM auth.users WHERE email LIKE '%@demo.com' OR email = 'admin@bandhuconnect.com';

-- Update profiles with correct IDs (replace the UUIDs with actual ones from above query)
UPDATE profiles SET id = 'ACTUAL_AUTH_USER_ID' WHERE email = 'dr.rajesh.medical@demo.com';
UPDATE profiles SET id = 'ACTUAL_AUTH_USER_ID' WHERE email = 'priya.guide@demo.com';
-- ... repeat for all accounts
```

## Step 4: Test Login

Try logging in with:
- `dr.rajesh.medical@demo.com` / `password123`
- `ramesh.elderly@demo.com` / `password123`
- `admin@bandhuconnect.com` / `admin123`

## Quick Alternative: Use Existing Accounts

If you have existing accounts in your Supabase, check what's available:

```sql
SELECT 
    au.email,
    p.name,
    p.role
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email_confirmed_at IS NOT NULL
ORDER BY p.role;
```

Use any existing confirmed accounts for testing instead of creating new ones.
