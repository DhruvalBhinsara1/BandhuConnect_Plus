# Admin User Setup Instructions

## Create Admin User: dhruvalbhinsara460@gmail.com

### Step 1: Create User in Supabase Dashboard

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication** → **Users**
3. Click **"Add user"** or **"Invite user"**
4. Enter:
   - **Email**: `dhruvalbhinsara460@gmail.com`
   - **Password**: Choose a secure password
   - **Auto Confirm User**: ✅ (check this box)

### Step 2: Add Admin Profile

After creating the user, you need to add the profile data:

1. Go to **Database** → **Table Editor**
2. Select the **profiles** table
3. Click **"Insert"** → **"Insert row"**
4. Fill in:
   - **id**: Copy the user ID from the auth.users table (from Step 1)
   - **name**: `Dhruval Bhinsara`
   - **phone**: `9913238080`
   - **role**: `admin`
   - **skills**: `["administration", "management", "coordination"]`
   - **updated_at**: Leave as default (now())

### Alternative: Using SQL Editor

1. Go to **SQL Editor** in Supabase Dashboard
2. First, find the user ID:
```sql
SELECT id, email FROM auth.users WHERE email = 'dhruvalbhinsara460@gmail.com';
```

3. Then insert the profile (replace `USER_ID` with the actual ID from step 2):
```sql
INSERT INTO public.profiles (
    id,
    name,
    phone,
    role,
    skills,
    updated_at
) VALUES (
    'USER_ID_FROM_PREVIOUS_QUERY',
    'Dhruval Bhinsara',
    '9913238080',
    'admin',
    ARRAY['administration', 'management', 'coordination'],
    now()
);
```

### Step 3: Test Admin Login

1. Go to your admin dashboard at `http://localhost:3000`
2. Click **"Admin Login"**
3. Enter:
   - **Email**: `dhruvalbhinsara460@gmail.com`
   - **Password**: (the password you set in Step 1)

### Verification

After successful login, you should:
- Be redirected to the dashboard
- See "Welcome to the BandhuConnect+ Admin Dashboard"
- Have access to admin features

## Security Notes

- The admin user will have full access to the system
- Make sure to use a strong password
- Consider enabling 2FA in Supabase for additional security
- The phone number `9913238080` is stored in the profile for contact purposes
