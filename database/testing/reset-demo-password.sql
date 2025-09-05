-- Reset password for demo account
-- Run this in Supabase SQL Editor to set a known password

UPDATE auth.users 
SET encrypted_password = crypt('password123', gen_salt('bf'))
WHERE email = 'dr.rajesh.medical@demo.com';

-- Verify the update
SELECT 
    email,
    encrypted_password IS NOT NULL as has_password,
    email_confirmed_at IS NOT NULL as confirmed,
    updated_at
FROM auth.users 
WHERE email = 'dr.rajesh.medical@demo.com';

-- Alternative: Create a fresh account with known password
-- If the above doesn't work, delete and recreate:

-- DELETE FROM auth.users WHERE email = 'dr.rajesh.medical@demo.com';
-- DELETE FROM profiles WHERE email = 'dr.rajesh.medical@demo.com';

-- INSERT INTO auth.users (
--     instance_id, id, aud, role, email, encrypted_password, 
--     email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
--     is_super_admin, created_at, updated_at
-- ) VALUES (
--     '00000000-0000-0000-0000-000000000000',
--     '11111111-1111-1111-1111-111111111111',
--     'authenticated',
--     'authenticated',
--     'dr.rajesh.medical@demo.com',
--     crypt('password123', gen_salt('bf')),
--     NOW(),
--     '{"provider": "email", "providers": ["email"]}',
--     '{}',
--     FALSE,
--     NOW(),
--     NOW()
-- );

-- INSERT INTO profiles (id, name, email, phone, role, skills, volunteer_status, is_active) 
-- VALUES (
--     '11111111-1111-1111-1111-111111111111',
--     'Dr. Rajesh Patel',
--     'dr.rajesh.medical@demo.com',
--     '+91-9123456701',
--     'volunteer',
--     ARRAY['medical', 'first_aid', 'emergency'],
--     'available',
--     true
-- );
