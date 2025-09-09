-- Demo Data Set 2: Lost Person & Guidance Scenarios with Authentication
-- Parul University Location: 22.3039° N, 73.1813° E
-- All locations within 1km radius

-- =============================================================================
-- STEP 1: CREATE AUTHENTICATED USERS IN AUTH SYSTEM
-- =============================================================================

-- Create auth users for volunteers (Set 2)
INSERT INTO auth.users (
   instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at
) VALUES 
-- Volunteer 1
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'vikram.singh.demo2@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Inspector Vikram Singh"}', false, now(), now(), '+91-9876543101', now(), '', '', now(), '', 0, now(), '', now(), false, null),
-- Volunteer 2  
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'meera.gupta.demo2@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Meera Gupta"}', false, now(), now(), '+91-9876543102', now(), '', '', now(), '', 0, now(), '', now(), false, null),
-- Volunteer 3
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'ravi.acharya.demo2@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Ravi Acharya"}', false, now(), now(), '+91-9876543103', now(), '', '', now(), '', 0, now(), '', now(), false, null),
-- Volunteer 4
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sita.devi.demo2@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Sita Devi"}', false, now(), now(), '+91-9876543104', now(), '', '', now(), '', 0, now(), '', now(), false, null);

-- Create auth users for pilgrims (Set 2)
INSERT INTO auth.users (
   instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at
) VALUES 
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'bharat.mehta.demo2@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Bharat Mehta"}', false, now(), now(), '+91-9876540101', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'lata.chandra.demo2@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Lata Chandra"}', false, now(), now(), '+91-9876540102', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'omprakash.yadav.demo2@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Omprakash Yadav"}', false, now(), now(), '+91-9876540103', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'pushpa.kumari.demo2@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Pushpa Kumari"}', false, now(), now(), '+91-9876540104', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'jagdish.prasad.demo2@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Jagdish Prasad"}', false, now(), now(), '+91-9876540105', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'manju.devi.demo2@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Manju Devi"}', false, now(), now(), '+91-9876540106', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'vinod.kumar.demo2@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Vinod Kumar"}', false, now(), now(), '+91-9876540107', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sarita.joshi.demo2@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Sarita Joshi"}', false, now(), now(), '+91-9876540108', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'mahesh.tiwari.demo2@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Mahesh Tiwari"}', false, now(), now(), '+91-9876540109', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'radha.agrawal.demo2@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Radha Agrawal"}', false, now(), now(), '+91-9876540110', now(), '', '', now(), '', 0, now(), '', now(), false, null);

-- =============================================================================
-- STEP 2: CREATE PROFILES LINKED TO AUTH USERS
-- =============================================================================

-- Create Demo Volunteers (Set 2) - Now linked to auth users
INSERT INTO profiles (id, name, email, phone, role, is_active, volunteer_status, skills, created_at, updated_at) 
SELECT 
    au.id,
    JSON_VALUE(au.raw_user_meta_data, '$.name'),
    au.email,
    au.phone,
    'volunteer'::public.user_role,
    true,
    CASE 
        WHEN au.email LIKE '%ravi.acharya%' THEN 'busy'::public.volunteer_status
        ELSE 'available'::public.volunteer_status
    END,
    CASE 
        WHEN au.email LIKE '%vikram.singh%' THEN ARRAY['lost_person', 'emergency', 'crowd_management']
        WHEN au.email LIKE '%meera.gupta%' THEN ARRAY['guidance', 'lost_person', 'sanitation']  
        WHEN au.email LIKE '%ravi.acharya%' THEN ARRAY['guidance', 'crowd_management', 'emergency']
        WHEN au.email LIKE '%sita.devi%' THEN ARRAY['guidance', 'medical', 'lost_person']
    END,
    NOW(),
    NOW()
FROM auth.users au 
WHERE au.email IN ('vikram.singh.demo2@example.com', 'meera.gupta.demo2@example.com', 'ravi.acharya.demo2@example.com', 'sita.devi.demo2@example.com');

-- Create Demo Pilgrims (Set 2) - Now linked to auth users  
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
    'bharat.mehta.demo2@example.com', 'lata.chandra.demo2@example.com', 'omprakash.yadav.demo2@example.com',
    'pushpa.kumari.demo2@example.com', 'jagdish.prasad.demo2@example.com', 'manju.devi.demo2@example.com', 
    'vinod.kumar.demo2@example.com', 'sarita.joshi.demo2@example.com', 'mahesh.tiwari.demo2@example.com',
    'radha.agrawal.demo2@example.com'
);

-- =============================================================================
-- STEP 3: CREATE ASSISTANCE REQUESTS 
-- =============================================================================

-- Create Assistance Requests (Set 2) - Lost Person & Guidance Focus
INSERT INTO assistance_requests (id, user_id, type, title, description, priority, status, location, address, created_at, updated_at) 
SELECT 
    gen_random_uuid(),
    p.id,
    CASE 
        WHEN p.email LIKE '%bharat.mehta%' THEN 'lost_person'
        WHEN p.email LIKE '%lata.chandra%' THEN 'guidance'
        WHEN p.email LIKE '%omprakash.yadav%' THEN 'lost_person'
        WHEN p.email LIKE '%pushpa.kumari%' THEN 'guidance'
        WHEN p.email LIKE '%jagdish.prasad%' THEN 'lost_person'
        WHEN p.email LIKE '%manju.devi%' THEN 'guidance'
        WHEN p.email LIKE '%vinod.kumar%' THEN 'lost_person'
        WHEN p.email LIKE '%sarita.joshi%' THEN 'guidance'
        WHEN p.email LIKE '%mahesh.tiwari%' THEN 'guidance'
        WHEN p.email LIKE '%radha.agrawal%' THEN 'lost_person'
    END::public.request_type,
    CASE 
        WHEN p.email LIKE '%bharat.mehta%' THEN 'Missing Wife in Crowd'
        WHEN p.email LIKE '%lata.chandra%' THEN 'Need Registration Help'
        WHEN p.email LIKE '%omprakash.yadav%' THEN 'Lost Teenage Daughter'
        WHEN p.email LIKE '%pushpa.kumari%' THEN 'Wheelchair Accessible Restroom'
        WHEN p.email LIKE '%jagdish.prasad%' THEN 'Elderly Father Missing'
        WHEN p.email LIKE '%manju.devi%' THEN 'Special Needs Center Location'
        WHEN p.email LIKE '%vinod.kumar%' THEN 'Missing Person with Walking Stick'
        WHEN p.email LIKE '%sarita.joshi%' THEN 'Lost and Found Office'
        WHEN p.email LIKE '%mahesh.tiwari%' THEN 'Bus Stop Direction'
        WHEN p.email LIKE '%radha.agrawal%' THEN 'Missing 12-year-old Grandson'
    END,
    CASE 
        WHEN p.email LIKE '%bharat.mehta%' THEN 'My wife got separated in the crowd 30 minutes ago. She is 65 years old, wearing white saree.'
        WHEN p.email LIKE '%lata.chandra%' THEN 'First time visiting. Need help finding the registration desk for senior citizens.'
        WHEN p.email LIKE '%omprakash.yadav%' THEN 'Lost my teenage daughter (16 years) in the crowd. She has long black hair, wearing pink kurta.'
        WHEN p.email LIKE '%pushpa.kumari%' THEN 'Cannot find wheelchair accessible restroom facilities. Urgent need for disabled person.'
        WHEN p.email LIKE '%jagdish.prasad%' THEN 'My elderly father (80 years) wandered off. He has memory issues and may be confused.'
        WHEN p.email LIKE '%manju.devi%' THEN 'Need directions to special needs assistance center. Carrying disabled child.'
        WHEN p.email LIKE '%vinod.kumar%' THEN 'Missing person: 45-year-old man with walking stick, wearing yellow shirt. Last seen 1 hour ago.'
        WHEN p.email LIKE '%sarita.joshi%' THEN 'Looking for lost and found office. Lost important documents and mobile phone.'
        WHEN p.email LIKE '%mahesh.tiwari%' THEN 'Need help finding bus stop for return journey to Ahmedabad. Have heavy luggage.'
        WHEN p.email LIKE '%radha.agrawal%' THEN 'My 12-year-old grandson is missing for 45 minutes. He was playing near the fountain.'
    END,
    CASE 
        WHEN p.email LIKE '%bharat.mehta%' OR p.email LIKE '%omprakash.yadav%' OR p.email LIKE '%jagdish.prasad%' OR p.email LIKE '%radha.agrawal%' THEN 'high'
        WHEN p.email LIKE '%pushpa.kumari%' OR p.email LIKE '%manju.devi%' OR p.email LIKE '%vinod.kumar%' THEN 'medium'
        ELSE 'low'
    END::public.priority_level,
    'pending'::public.request_status,
    CASE 
        WHEN p.email LIKE '%bharat.mehta%' THEN ST_SetSRID(ST_MakePoint(73.1817, 22.3042), 4326)::geography
        WHEN p.email LIKE '%lata.chandra%' THEN ST_SetSRID(ST_MakePoint(73.1813, 22.3038), 4326)::geography
        WHEN p.email LIKE '%omprakash.yadav%' THEN ST_SetSRID(ST_MakePoint(73.1819, 22.3044), 4326)::geography
        WHEN p.email LIKE '%pushpa.kumari%' THEN ST_SetSRID(ST_MakePoint(73.1808, 22.3036), 4326)::geography
        WHEN p.email LIKE '%jagdish.prasad%' THEN ST_SetSRID(ST_MakePoint(73.1824, 22.3048), 4326)::geography
        WHEN p.email LIKE '%manju.devi%' THEN ST_SetSRID(ST_MakePoint(73.1811, 22.3030), 4326)::geography
        WHEN p.email LIKE '%vinod.kumar%' THEN ST_SetSRID(ST_MakePoint(73.1815, 22.3050), 4326)::geography
        WHEN p.email LIKE '%sarita.joshi%' THEN ST_SetSRID(ST_MakePoint(73.1806, 22.3032), 4326)::geography
        WHEN p.email LIKE '%mahesh.tiwari%' THEN ST_SetSRID(ST_MakePoint(73.1821, 22.3046), 4326)::geography
        WHEN p.email LIKE '%radha.agrawal%' THEN ST_SetSRID(ST_MakePoint(73.1812, 22.3041), 4326)::geography
    END,
    CASE 
        WHEN p.email LIKE '%bharat.mehta%' THEN 'Near University Main Auditorium'
        WHEN p.email LIKE '%lata.chandra%' THEN 'University Entrance Plaza'
        WHEN p.email LIKE '%omprakash.yadav%' THEN 'Near University Sports Complex'
        WHEN p.email LIKE '%pushpa.kumari%' THEN 'University Administration Block'
        WHEN p.email LIKE '%jagdish.prasad%' THEN 'University Garden Area'
        WHEN p.email LIKE '%manju.devi%' THEN 'University Parking Lot D'
        WHEN p.email LIKE '%vinod.kumar%' THEN 'University Central Lawn'
        WHEN p.email LIKE '%sarita.joshi%' THEN 'University Library Building'
        WHEN p.email LIKE '%mahesh.tiwari%' THEN 'University Transport Hub'
        WHEN p.email LIKE '%radha.agrawal%' THEN 'University Central Fountain'
    END,
    NOW(),
    NOW()
FROM profiles p 
WHERE p.email LIKE '%.demo2@example.com' AND p.role = 'pilgrim';

-- =============================================================================
-- STEP 4: UPDATE USER LOCATIONS
-- =============================================================================

-- Update User Locations Table - Link to authenticated users
INSERT INTO user_locations (user_id, latitude, longitude, accuracy, last_updated, is_active) 
SELECT 
    p.id,
    CASE 
        WHEN p.email LIKE '%vikram.singh%' THEN 22.3040
        WHEN p.email LIKE '%meera.gupta%' THEN 22.3046
        WHEN p.email LIKE '%ravi.acharya%' THEN 22.3034
        WHEN p.email LIKE '%sita.devi%' THEN 22.3052
        WHEN p.email LIKE '%bharat.mehta%' THEN 22.3042
        WHEN p.email LIKE '%lata.chandra%' THEN 22.3038
        WHEN p.email LIKE '%omprakash.yadav%' THEN 22.3044
        WHEN p.email LIKE '%pushpa.kumari%' THEN 22.3036
        WHEN p.email LIKE '%jagdish.prasad%' THEN 22.3048
        WHEN p.email LIKE '%manju.devi%' THEN 22.3030
        WHEN p.email LIKE '%vinod.kumar%' THEN 22.3050
        WHEN p.email LIKE '%sarita.joshi%' THEN 22.3032
        WHEN p.email LIKE '%mahesh.tiwari%' THEN 22.3046
        WHEN p.email LIKE '%radha.agrawal%' THEN 22.3041
    END,
    CASE 
        WHEN p.email LIKE '%vikram.singh%' THEN 73.1816
        WHEN p.email LIKE '%meera.gupta%' THEN 73.1811
        WHEN p.email LIKE '%ravi.acharya%' THEN 73.1822
        WHEN p.email LIKE '%sita.devi%' THEN 73.1809
        WHEN p.email LIKE '%bharat.mehta%' THEN 73.1817
        WHEN p.email LIKE '%lata.chandra%' THEN 73.1813
        WHEN p.email LIKE '%omprakash.yadav%' THEN 73.1819
        WHEN p.email LIKE '%pushpa.kumari%' THEN 73.1808
        WHEN p.email LIKE '%jagdish.prasad%' THEN 73.1824
        WHEN p.email LIKE '%manju.devi%' THEN 73.1811
        WHEN p.email LIKE '%vinod.kumar%' THEN 73.1815
        WHEN p.email LIKE '%sarita.joshi%' THEN 73.1806
        WHEN p.email LIKE '%mahesh.tiwari%' THEN 73.1821
        WHEN p.email LIKE '%radha.agrawal%' THEN 73.1812
    END,
    10.0,
    NOW(),
    true
FROM profiles p 
WHERE p.email LIKE '%.demo2@example.com';

/*
-- CLEANUP SCRIPT FOR DEMO DATA SET 2 (WITH AUTHENTICATION)
-- Run this to completely remove all demo data from this set

-- Delete assistance requests first (due to foreign key constraints)
DELETE FROM assistance_requests 
WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demo2@example.com'
);

-- Delete user locations
DELETE FROM user_locations 
WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demo2@example.com'
);

-- Delete assignments if any exist
DELETE FROM assignments 
WHERE volunteer_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demo2@example.com'
) OR request_id IN (
    SELECT id FROM assistance_requests WHERE user_id IN (
        SELECT id FROM profiles WHERE email LIKE '%.demo2@example.com'
    )
);

-- Delete profiles
DELETE FROM profiles WHERE email LIKE '%.demo2@example.com';

-- Delete auth users (this will cascade delete profiles due to foreign key)
DELETE FROM auth.users WHERE email LIKE '%.demo2@example.com';

-- Verify cleanup
SELECT COUNT(*) as remaining_demo_profiles FROM profiles WHERE email LIKE '%.demo2@example.com';
SELECT COUNT(*) as remaining_demo_auth_users FROM auth.users WHERE email LIKE '%.demo2@example.com';
SELECT COUNT(*) as remaining_demo_requests FROM assistance_requests WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demo2@example.com'
);
SELECT COUNT(*) as remaining_demo_locations FROM user_locations WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demo2@example.com'
);
*/
