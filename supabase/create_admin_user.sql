-- Create Admin User for BandhuConnect+
-- Email: dhruvalbhinsara460@gmail.com
-- Phone: 9913238080

-- This script creates an admin profile after the user is created in Supabase Auth
-- Run this after creating the user through Supabase Dashboard or Auth API

-- Insert admin profile (replace USER_ID with the actual UUID from auth.users)
INSERT INTO public.profiles (
    id,
    name,
    phone,
    role,
    skills,
    age,
    updated_at
) VALUES (
    -- You'll need to replace this with the actual user ID from auth.users table
    -- after creating the user in Supabase Dashboard
    'USER_ID_FROM_AUTH_USERS',
    'Dhruval Bhinsara',
    '9913238080',
    'admin',
    ARRAY['administration', 'management', 'coordination'],
    NULL, -- Age is optional
    now()
);

-- Alternative: If you want to find and update an existing user by email
-- First, you would need to get the user ID from auth.users:
-- SELECT id FROM auth.users WHERE email = 'dhruvalbhinsara460@gmail.com';

-- Then use that ID to insert the profile:
-- INSERT INTO public.profiles (id, name, phone, role, skills, updated_at)
-- SELECT 
--     id,
--     'Dhruval Bhinsara',
--     '9913238080',
--     'admin'::public.user_role,
--     ARRAY['administration', 'management', 'coordination'],
--     now()
-- FROM auth.users 
-- WHERE email = 'dhruvalbhinsara460@gmail.com';
