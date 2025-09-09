-- Demo Data Set 1: Medical Emergency Scenarios with Authentication
-- Parul University Location: 22.3039° N, 73.1813° E
-- All locations within 1km radius

-- =============================================================================
-- STEP 1: CREATE AUTHENTICATED USERS IN AUTH SYSTEM
-- =============================================================================

-- Create auth users for volunteers (Set 1)
INSERT INTO auth.users (
   instance_id,
   id,
   aud,
   role,
   email,
   encrypted_password,
   email_confirmed_at,
   confirmation_token,
   confirmation_sent_at,
   recovery_token,
   recovery_sent_at,
   email_change_token_new,
   email_change,
   email_change_sent_at,
   last_sign_in_at,
   raw_app_meta_data,
   raw_user_meta_data,
   is_super_admin,
   created_at,
   updated_at,
   phone,
   phone_confirmed_at,
   phone_change,
   phone_change_token,
   phone_change_sent_at,
   email_change_token_current,
   email_change_confirm_status,
   banned_until,
   reauthentication_token,
   reauthentication_sent_at,
   is_sso_user,
   deleted_at
) VALUES 
-- Volunteer 1
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'rajesh.patel.demo1@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Dr. Rajesh Patel"}', false, now(), now(), '+91-9876543001', now(), '', '', now(), '', 0, now(), '', now(), false, null),
-- Volunteer 2  
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'priya.sharma.demo1@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Priya Sharma"}', false, now(), now(), '+91-9876543002', now(), '', '', now(), '', 0, now(), '', now(), false, null),
-- Volunteer 3
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'amit.kumar.demo1@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Amit Kumar"}', false, now(), now(), '+91-9876543003', now(), '', '', now(), '', 0, now(), '', now(), false, null);

-- Create auth users for pilgrims (Set 1)
INSERT INTO auth.users (
   instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at
) VALUES 
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'ramesh.agarwal.demo1@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Ramesh Agarwal"}', false, now(), now(), '+91-9876540001', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sunita.devi.demo1@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Sunita Devi"}', false, now(), now(), '+91-9876540002', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'mohan.singh.demo1@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Mohan Singh"}', false, now(), now(), '+91-9876540003', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'geeta.patel.demo1@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Geeta Patel"}', false, now(), now(), '+91-9876540004', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'harish.sharma.demo1@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Harish Sharma"}', false, now(), now(), '+91-9876540005', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'kavita.jain.demo1@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Kavita Jain"}', false, now(), now(), '+91-9876540006', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'suresh.kumar.demo1@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Suresh Kumar"}', false, now(), now(), '+91-9876540007', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'anita.verma.demo1@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Anita Verma"}', false, now(), now(), '+91-9876540008', now(), '', '', now(), '', 0, now(), '', now(), false, null);

-- =============================================================================
-- STEP 2: CREATE PROFILES LINKED TO AUTH USERS
-- =============================================================================

-- Create Demo Volunteers (Set 1) - Now linked to auth users
INSERT INTO profiles (id, name, email, phone, role, is_active, volunteer_status, skills, created_at, updated_at) 
SELECT 
    au.id,
    JSON_VALUE(au.raw_user_meta_data, '$.name'),
    au.email,
    au.phone,
    'volunteer'::public.user_role,
    true,
    CASE 
        WHEN au.email LIKE '%amit.kumar%' THEN 'busy'::public.volunteer_status
        ELSE 'available'::public.volunteer_status
    END,
    CASE 
        WHEN au.email LIKE '%rajesh.patel%' THEN ARRAY['medical', 'emergency', 'guidance']
        WHEN au.email LIKE '%priya.sharma%' THEN ARRAY['guidance', 'crowd_management', 'sanitation']  
        WHEN au.email LIKE '%amit.kumar%' THEN ARRAY['emergency', 'lost_person', 'guidance']
    END,
    NOW(),
    NOW()
FROM auth.users au 
WHERE au.email IN ('rajesh.patel.demo1@example.com', 'priya.sharma.demo1@example.com', 'amit.kumar.demo1@example.com');

-- Create Demo Pilgrims (Set 1) - Now linked to auth users  
INSERT INTO profiles (id, name, email, phone, role, is_active, created_at, updated_at)
SELECT 
    au.id,
    JSON_VALUE(au.raw_user_meta_data, '$.name'),
    au.email,
    au.phone,
    'pilgrim'::public.user_role,
    true,
    NOW(),
    NOW()
FROM auth.users au 
WHERE au.email IN (
    'ramesh.agarwal.demo1@example.com', 'sunita.devi.demo1@example.com', 'mohan.singh.demo1@example.com',
    'geeta.patel.demo1@example.com', 'harish.sharma.demo1@example.com', 'kavita.jain.demo1@example.com', 
    'suresh.kumar.demo1@example.com', 'anita.verma.demo1@example.com'
);

-- =============================================================================
-- STEP 3: CREATE ASSISTANCE REQUESTS 
-- =============================================================================

-- Create Assistance Requests (Set 1) - Medical Emergency Focus
INSERT INTO assistance_requests (id, user_id, type, title, description, priority, status, location, address, created_at, updated_at) 
SELECT 
    gen_random_uuid(),
    p.id,
    CASE 
        WHEN p.email LIKE '%ramesh.agarwal%' THEN 'medical'
        WHEN p.email LIKE '%sunita.devi%' THEN 'medical'
        WHEN p.email LIKE '%mohan.singh%' THEN 'emergency'
        WHEN p.email LIKE '%geeta.patel%' THEN 'guidance'
        WHEN p.email LIKE '%harish.sharma%' THEN 'lost_person'
        WHEN p.email LIKE '%kavita.jain%' THEN 'sanitation'
        WHEN p.email LIKE '%suresh.kumar%' THEN 'medical'
        WHEN p.email LIKE '%anita.verma%' THEN 'crowd_management'
    END::public.request_type,
    CASE 
        WHEN p.email LIKE '%ramesh.agarwal%' THEN 'Father Having Chest Pain'
        WHEN p.email LIKE '%sunita.devi%' THEN 'Child Injury - Bleeding Knee'
        WHEN p.email LIKE '%mohan.singh%' THEN 'Lost Diabetes Medication'
        WHEN p.email LIKE '%geeta.patel%' THEN 'Need Directions to Event Venue'
        WHEN p.email LIKE '%harish.sharma%' THEN 'Missing 8-year-old Son'
        WHEN p.email LIKE '%kavita.jain%' THEN 'Toilet Facilities Issue'
        WHEN p.email LIKE '%suresh.kumar%' THEN 'Elderly Woman Feeling Dizzy'
        WHEN p.email LIKE '%anita.verma%' THEN 'Food Distribution Overcrowding'
    END,
    CASE 
        WHEN p.email LIKE '%ramesh.agarwal%' THEN 'My father (age 75) is having chest pain and difficulty breathing. Need immediate medical attention.'
        WHEN p.email LIKE '%sunita.devi%' THEN 'Child fell down and has a bleeding wound on knee. Need first aid assistance.'
        WHEN p.email LIKE '%mohan.singh%' THEN 'Lost my medication for diabetes. Need urgent help to find medical store or doctor.'
        WHEN p.email LIKE '%geeta.patel%' THEN 'Cannot find the way to main event venue. Carrying heavy luggage with elderly mother.'
        WHEN p.email LIKE '%harish.sharma%' THEN 'My 8-year-old son is missing for last 20 minutes. He was wearing blue shirt and black pants.'
        WHEN p.email LIKE '%kavita.jain%' THEN 'Toilet facilities are not clean and lack water supply. Many pilgrims facing issues.'
        WHEN p.email LIKE '%suresh.kumar%' THEN 'Elderly woman feeling dizzy and nauseous. Need medical check-up.'
        WHEN p.email LIKE '%anita.verma%' THEN 'Overcrowding at food distribution area. People are pushing and some may get hurt.'
    END,
    CASE 
        WHEN p.email LIKE '%ramesh.agarwal%' OR p.email LIKE '%mohan.singh%' OR p.email LIKE '%harish.sharma%' THEN 'high'
        ELSE 'medium'
    END::public.priority_level,
    'pending'::public.request_status,
    CASE 
        WHEN p.email LIKE '%ramesh.agarwal%' THEN ST_SetSRID(ST_MakePoint(73.1815, 22.3041), 4326)::geography
        WHEN p.email LIKE '%sunita.devi%' THEN ST_SetSRID(ST_MakePoint(73.1810, 22.3037), 4326)::geography
        WHEN p.email LIKE '%mohan.singh%' THEN ST_SetSRID(ST_MakePoint(73.1820, 22.3043), 4326)::geography
        WHEN p.email LIKE '%geeta.patel%' THEN ST_SetSRID(ST_MakePoint(73.1805, 22.3035), 4326)::geography
        WHEN p.email LIKE '%harish.sharma%' THEN ST_SetSRID(ST_MakePoint(73.1823, 22.3047), 4326)::geography
        WHEN p.email LIKE '%kavita.jain%' THEN ST_SetSRID(ST_MakePoint(73.1812, 22.3033), 4326)::geography
        WHEN p.email LIKE '%suresh.kumar%' THEN ST_SetSRID(ST_MakePoint(73.1818, 22.3049), 4326)::geography
        WHEN p.email LIKE '%anita.verma%' THEN ST_SetSRID(ST_MakePoint(73.1807, 22.3031), 4326)::geography
    END,
    CASE 
        WHEN p.email LIKE '%ramesh.agarwal%' THEN 'Near Parul University Main Gate, Building A'
        WHEN p.email LIKE '%sunita.devi%' THEN 'Parul University Campus Ground'
        WHEN p.email LIKE '%mohan.singh%' THEN 'Near University Library'
        WHEN p.email LIKE '%geeta.patel%' THEN 'University Parking Area B'
        WHEN p.email LIKE '%harish.sharma%' THEN 'Near University Canteen'
        WHEN p.email LIKE '%kavita.jain%' THEN 'University Hostel Block C'
        WHEN p.email LIKE '%suresh.kumar%' THEN 'University Medical Center Entrance'
        WHEN p.email LIKE '%anita.verma%' THEN 'University Food Court'
    END,
    NOW(),
    NOW()
FROM profiles p 
WHERE p.email IN (
    'ramesh.agarwal.demo1@example.com', 'sunita.devi.demo1@example.com', 'mohan.singh.demo1@example.com',
    'geeta.patel.demo1@example.com', 'harish.sharma.demo1@example.com', 'kavita.jain.demo1@example.com', 
    'suresh.kumar.demo1@example.com', 'anita.verma.demo1@example.com'
);

-- =============================================================================
-- STEP 4: UPDATE USER LOCATIONS
-- =============================================================================

-- Update User Locations Table - Link to authenticated users
INSERT INTO user_locations (user_id, latitude, longitude, accuracy, last_updated, is_active) 
SELECT 
    p.id,
    CASE 
        WHEN p.email LIKE '%rajesh.patel%' THEN 22.3045
        WHEN p.email LIKE '%priya.sharma%' THEN 22.3032
        WHEN p.email LIKE '%amit.kumar%' THEN 22.3051
        WHEN p.email LIKE '%ramesh.agarwal%' THEN 22.3041
        WHEN p.email LIKE '%sunita.devi%' THEN 22.3037
        WHEN p.email LIKE '%mohan.singh%' THEN 22.3043
        WHEN p.email LIKE '%geeta.patel%' THEN 22.3035
        WHEN p.email LIKE '%harish.sharma%' THEN 22.3047
        WHEN p.email LIKE '%kavita.jain%' THEN 22.3033
        WHEN p.email LIKE '%suresh.kumar%' THEN 22.3049
        WHEN p.email LIKE '%anita.verma%' THEN 22.3031
    END,
    CASE 
        WHEN p.email LIKE '%rajesh.patel%' THEN 73.1820
        WHEN p.email LIKE '%priya.sharma%' THEN 73.1808
        WHEN p.email LIKE '%amit.kumar%' THEN 73.1825
        WHEN p.email LIKE '%ramesh.agarwal%' THEN 73.1815
        WHEN p.email LIKE '%sunita.devi%' THEN 73.1810
        WHEN p.email LIKE '%mohan.singh%' THEN 73.1820
        WHEN p.email LIKE '%geeta.patel%' THEN 73.1805
        WHEN p.email LIKE '%harish.sharma%' THEN 73.1823
        WHEN p.email LIKE '%kavita.jain%' THEN 73.1812
        WHEN p.email LIKE '%suresh.kumar%' THEN 73.1818
        WHEN p.email LIKE '%anita.verma%' THEN 73.1807
    END,
    10.0,
    NOW(),
    true
FROM profiles p 
WHERE p.email LIKE '%.demo1@example.com';

/*
-- CLEANUP SCRIPT FOR DEMO DATA SET 1 (WITH AUTHENTICATION)
-- Run this to completely remove all demo data from this set

-- Delete assistance requests first (due to foreign key constraints)
DELETE FROM assistance_requests 
WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demo1@example.com'
);

-- Delete user locations
DELETE FROM user_locations 
WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demo1@example.com'
);

-- Delete assignments if any exist
DELETE FROM assignments 
WHERE volunteer_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demo1@example.com'
) OR request_id IN (
    SELECT id FROM assistance_requests WHERE user_id IN (
        SELECT id FROM profiles WHERE email LIKE '%.demo1@example.com'
    )
);

-- Delete profiles
DELETE FROM profiles WHERE email LIKE '%.demo1@example.com';

-- Delete auth users (this will cascade delete profiles due to foreign key)
DELETE FROM auth.users WHERE email LIKE '%.demo1@example.com';

-- Verify cleanup
SELECT COUNT(*) as remaining_demo_profiles FROM profiles WHERE email LIKE '%.demo1@example.com';
SELECT COUNT(*) as remaining_demo_auth_users FROM auth.users WHERE email LIKE '%.demo1@example.com';
SELECT COUNT(*) as remaining_demo_requests FROM assistance_requests WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demo1@example.com'
);
SELECT COUNT(*) as remaining_demo_locations FROM user_locations WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demo1@example.com'
);
*/
