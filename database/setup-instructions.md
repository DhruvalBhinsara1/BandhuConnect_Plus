# BandhuConnect+ Database Setup Instructions

## Step 1: Create Database Schema

1. Go to your Supabase project: https://davzzcbzkkadygykxxam.supabase.co
2. Navigate to **SQL Editor**
3. Run the `schema.sql` file first to create all tables and types

## Step 2: Create Auth Users

Before inserting profiles, you need to create users in Supabase Auth. You have two options:

### Option A: Create Users via Supabase Dashboard
1. Go to **Authentication** > **Users** in Supabase dashboard
2. Click **Add User** and create these test users:
   - **Admin**: admin@bandhuconnect.com, password: admin123
   - **Volunteer 1**: raj.patel@example.com, password: volunteer123
   - **Volunteer 2**: priya.sharma@example.com, password: volunteer123
   - **Pilgrim 1**: ramesh.gupta@example.com, password: pilgrim123

### Option B: Use SQL to Create Auth Users
Run this in Supabase SQL Editor (replace with actual emails you want):

```sql
-- Create auth users (this will generate real UUIDs)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@bandhuconnect.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);
```

## Step 3: Get Real User UUIDs

After creating users, get their actual UUIDs:

```sql
SELECT id, email FROM auth.users ORDER BY created_at DESC;
```

## Step 4: Update Seed Data

Replace the hardcoded UUIDs in `seed-data.sql` with the real UUIDs from Step 3.

## Step 5: Run Database Functions

Run the `functions.sql` file to create all custom functions and triggers.

## Step 6: Insert Seed Data

Finally, run the updated `seed-data.sql` file with real UUIDs.

## Alternative: Simplified Seed Data

If you want to skip the complex seed data, here's a minimal version that only creates the admin user profile after you create the auth user:
