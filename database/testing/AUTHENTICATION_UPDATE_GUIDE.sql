-- AUTHENTICATION UPDATE SCRIPT FOR ALL DEMO SETS
-- Run this script to update all 5 demo data sets with proper Supabase authentication
-- This script contains the essential authentication setup that should be added to each demo file

-- =============================================================================
-- AUTHENTICATION TEMPLATE FOR DEMO DATA SETS
-- =============================================================================

-- STEP 1: Create authenticated users in auth.users table
-- Template structure for each demo set:

/*
INSERT INTO auth.users (
   instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at
) VALUES 
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'user.email@demoX.example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "User Name"}', false, now(), now(), '+91-XXXXXXXXXX', now(), '', '', now(), '', 0, now(), '', now(), false, null);
*/

-- STEP 2: Create profiles linked to auth users
-- Template structure:

/*
INSERT INTO profiles (id, name, email, phone, role, is_active, volunteer_status, skills, created_at, updated_at) 
SELECT 
    au.id,
    JSON_VALUE(au.raw_user_meta_data, '$.name'),
    au.email,
    au.phone,
    'volunteer',  -- or 'pilgrim'
    true,
    'available',  -- for volunteers
    ARRAY['skill1', 'skill2', 'skill3'],  -- for volunteers
    NOW(),
    NOW()
FROM auth.users au 
WHERE au.email LIKE '%.demoX@example.com';
*/

-- STEP 3: Create assistance requests linked to authenticated pilgrims
-- Template structure:

/*
INSERT INTO assistance_requests (id, user_id, request_type, description, urgency_level, status, location_lat, location_lng, location_description, created_at, updated_at) 
SELECT 
    'demo-request-X-' || LPAD((ROW_NUMBER() OVER ())::text, 3, '0'),
    p.id,
    'request_type',
    'Description text',
    'urgency_level',
    'pending',
    latitude,
    longitude,
    'Location description',
    NOW(),
    NOW()
FROM profiles p 
WHERE p.email LIKE '%.demoX@example.com' AND p.role = 'pilgrim';
*/

-- STEP 4: Create user locations
-- Template structure:

/*
INSERT INTO user_locations (user_id, latitude, longitude, accuracy, timestamp, is_active) 
SELECT 
    p.id,
    latitude_value,
    longitude_value,
    10.0,
    NOW(),
    true
FROM profiles p 
WHERE p.email LIKE '%.demoX@example.com';
*/

-- =============================================================================
-- UPDATED CLEANUP SCRIPT TEMPLATE
-- =============================================================================

/*
-- CLEANUP SCRIPT FOR DEMO DATA SET X (WITH AUTHENTICATION)
-- Run this to completely remove all demo data from this set

-- Delete assistance requests first (due to foreign key constraints)
DELETE FROM assistance_requests 
WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demoX@example.com'
);

-- Delete user locations
DELETE FROM user_locations 
WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demoX@example.com'
);

-- Delete assignments if any exist
DELETE FROM assignments 
WHERE volunteer_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demoX@example.com'
) OR request_id IN (
    SELECT id FROM assistance_requests WHERE user_id IN (
        SELECT id FROM profiles WHERE email LIKE '%.demoX@example.com'
    )
);

-- Delete profiles
DELETE FROM profiles WHERE email LIKE '%.demoX@example.com';

-- Delete auth users (this will cascade delete profiles due to foreign key)
DELETE FROM auth.users WHERE email LIKE '%.demoX@example.com';

-- Verify cleanup
SELECT COUNT(*) as remaining_demo_profiles FROM profiles WHERE email LIKE '%.demoX@example.com';
SELECT COUNT(*) as remaining_demo_auth_users FROM auth.users WHERE email LIKE '%.demoX@example.com';
SELECT COUNT(*) as remaining_demo_requests FROM assistance_requests WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demoX@example.com'
);
SELECT COUNT(*) as remaining_demo_locations FROM user_locations WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demoX@example.com'
);
*/

-- =============================================================================
-- DEMO SET AUTHENTICATION STATUS
-- =============================================================================

-- ✅ Demo Set 1: UPDATED with authentication
-- ✅ Demo Set 2: UPDATED with authentication  
-- ⚠️  Demo Set 3: NEEDS UPDATE with authentication
-- ⚠️  Demo Set 4: NEEDS UPDATE with authentication
-- ⚠️  Demo Set 5: NEEDS UPDATE with authentication

-- =============================================================================
-- INSTRUCTIONS FOR MANUAL UPDATE
-- =============================================================================

/*
For each remaining demo set (3, 4, 5):

1. Replace the INSERT INTO profiles statements with auth user creation first:
   - Create auth.users entries with gen_random_uuid() for id
   - Use crypt('password123', gen_salt('bf')) for encrypted_password
   - Set proper metadata with user names

2. Update profiles INSERT to use SELECT from auth.users:
   - Link id to auth.users.id 
   - Extract name from JSON_VALUE(au.raw_user_meta_data, '$.name')
   - Filter by email pattern

3. Update assistance_requests to use dynamic user_id:
   - SELECT user_id from profiles WHERE email LIKE pattern
   - Use CASE statements for conditional values

4. Update user_locations similarly

5. Update cleanup script to delete from auth.users and use email pattern filtering

All demo users will have password: 'password123'
All demo users will be properly authenticated through Supabase auth system
*/
