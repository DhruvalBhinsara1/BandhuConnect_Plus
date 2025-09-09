-- Demo Data Set 3: Crowd Management & Sanitation Scenarios with Authentication
-- Parul University Location: 22.3039° N, 73.1813° E
-- All locations within 1km radius

-- =============================================================================
-- STEP 1: CREATE AUTHENTICATED USERS IN AUTH SYSTEM
-- =============================================================================

-- Create auth users for volunteers (Set 3)
INSERT INTO auth.users (
   instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at
) VALUES 
-- Volunteer 1
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'arjun.reddy.demo3@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Captain Arjun Reddy"}', false, now(), now(), '+91-9876543201', now(), '', '', now(), '', 0, now(), '', now(), false, null),
-- Volunteer 2
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'anjali.nair.demo3@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Anjali Nair"}', false, now(), now(), '+91-9876543202', now(), '', '', now(), '', 0, now(), '', now(), false, null),
-- Volunteer 3
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'rohit.chauhan.demo3@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Rohit Chauhan"}', false, now(), now(), '+91-9876543203', now(), '', '', now(), '', 0, now(), '', now(), false, null),
-- Volunteer 4
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'kavya.iyer.demo3@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Kavya Iyer"}', false, now(), now(), '+91-9876543204', now(), '', '', now(), '', 0, now(), '', now(), false, null),
-- Volunteer 5
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'manish.patel.demo3@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Manish Patel"}', false, now(), now(), '+91-9876543205', now(), '', '', now(), '', 0, now(), '', now(), false, null);

-- Create auth users for pilgrims (Set 3)
INSERT INTO auth.users (
   instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at
) VALUES 
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'gopal.krishnan.demo3@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Gopal Krishnan"}', false, now(), now(), '+91-9876540201', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'kamala.devi.demo3@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Kamala Devi"}', false, now(), now(), '+91-9876540202', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'balram.singh.demo3@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Balram Singh"}', false, now(), now(), '+91-9876540203', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'urmila.sharma.demo3@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Urmila Sharma"}', false, now(), now(), '+91-9876540204', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'raman.pillai.demo3@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Raman Pillai"}', false, now(), now(), '+91-9876540205', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'shanti.agarwal.demo3@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Shanti Agarwal"}', false, now(), now(), '+91-9876540206', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'krishna.murthy.demo3@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Krishna Murthy"}', false, now(), now(), '+91-9876540207', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sarla.devi.demo3@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Sarla Devi"}', false, now(), now(), '+91-9876540208', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'rajendra.kumar.demo3@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Rajendra Kumar"}', false, now(), now(), '+91-9876540209', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'ganga.prasad.demo3@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Ganga Prasad"}', false, now(), now(), '+91-9876540210', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'vidya.sagar.demo3@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Vidya Sagar"}', false, now(), now(), '+91-9876540211', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sumitra.devi.demo3@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Sumitra Devi"}', false, now(), now(), '+91-9876540212', now(), '', '', now(), '', 0, now(), '', now(), false, null);

-- =============================================================================
-- STEP 2: CREATE PROFILES LINKED TO AUTH USERS
-- =============================================================================

-- Create Demo Volunteers (Set 3) - Now linked to auth users
INSERT INTO profiles (id, name, email, phone, role, is_active, volunteer_status, skills, created_at, updated_at) 
SELECT 
    au.id,
    JSON_VALUE(au.raw_user_meta_data, '$.name'),
    au.email,
    au.phone,
    'volunteer'::public.user_role,
    CASE 
        WHEN au.email LIKE '%manish.patel%' THEN false
        ELSE true
    END,
    CASE 
        WHEN au.email LIKE '%rohit.chauhan%' THEN 'busy'::public.volunteer_status
        WHEN au.email LIKE '%manish.patel%' THEN 'offline'::public.volunteer_status
        ELSE 'available'::public.volunteer_status
    END,
    CASE 
        WHEN au.email LIKE '%arjun.reddy%' THEN ARRAY['crowd_management', 'emergency', 'guidance']
        WHEN au.email LIKE '%anjali.nair%' THEN ARRAY['sanitation', 'crowd_management', 'guidance']
        WHEN au.email LIKE '%rohit.chauhan%' THEN ARRAY['crowd_management', 'lost_person', 'emergency']
        WHEN au.email LIKE '%kavya.iyer%' THEN ARRAY['sanitation', 'medical', 'guidance']
        WHEN au.email LIKE '%manish.patel%' THEN ARRAY['crowd_management', 'sanitation', 'emergency']
    END,
    NOW(),
    NOW()
FROM auth.users au 
WHERE au.email IN ('arjun.reddy.demo3@example.com', 'anjali.nair.demo3@example.com', 'rohit.chauhan.demo3@example.com', 'kavya.iyer.demo3@example.com', 'manish.patel.demo3@example.com');

-- Create Demo Pilgrims (Set 3) - Now linked to auth users
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
    'gopal.krishnan.demo3@example.com', 'kamala.devi.demo3@example.com', 'balram.singh.demo3@example.com',
    'urmila.sharma.demo3@example.com', 'raman.pillai.demo3@example.com', 'shanti.agarwal.demo3@example.com',
    'krishna.murthy.demo3@example.com', 'sarla.devi.demo3@example.com', 'rajendra.kumar.demo3@example.com',
    'ganga.prasad.demo3@example.com', 'vidya.sagar.demo3@example.com', 'sumitra.devi.demo3@example.com'
);

-- =============================================================================
-- STEP 3: CREATE ASSISTANCE REQUESTS
-- =============================================================================

-- Create Assistance Requests (Set 3) - Crowd Management & Sanitation Focus
INSERT INTO assistance_requests (id, user_id, type, title, description, priority, status, location, address, created_at, updated_at) 
SELECT 
    gen_random_uuid(),
    p.id,
    CASE 
        WHEN p.email LIKE '%gopal.krishnan%' THEN 'crowd_management'
        WHEN p.email LIKE '%kamala.devi%' THEN 'sanitation'
        WHEN p.email LIKE '%balram.singh%' THEN 'crowd_management'
        WHEN p.email LIKE '%urmila.sharma%' THEN 'sanitation'
        WHEN p.email LIKE '%raman.pillai%' THEN 'crowd_management'
        WHEN p.email LIKE '%shanti.agarwal%' THEN 'sanitation'
        WHEN p.email LIKE '%krishna.murthy%' THEN 'crowd_management'
        WHEN p.email LIKE '%sarla.devi%' THEN 'sanitation'
        WHEN p.email LIKE '%rajendra.kumar%' THEN 'crowd_management'
        WHEN p.email LIKE '%ganga.prasad%' THEN 'sanitation'
        WHEN p.email LIKE '%vidya.sagar%' THEN 'crowd_management'
        WHEN p.email LIKE '%sumitra.devi%' THEN 'sanitation'
    END::public.request_type,
    CASE 
        WHEN p.email LIKE '%gopal.krishnan%' THEN 'Massive Crowd Surge at Entrance'
        WHEN p.email LIKE '%kamala.devi%' THEN 'Washroom Overflow Emergency'
        WHEN p.email LIKE '%balram.singh%' THEN 'Food Queue Fights'
        WHEN p.email LIKE '%urmila.sharma%' THEN 'Garbage Overflow Health Hazard'
        WHEN p.email LIKE '%raman.pillai%' THEN 'Bus Terminal Overcrowding'
        WHEN p.email LIKE '%shanti.agarwal%' THEN 'Contaminated Water Supply'
        WHEN p.email LIKE '%krishna.murthy%' THEN 'Uncontrolled Stage Crowd'
        WHEN p.email LIKE '%sarla.devi%' THEN 'Locked Toilet Facilities'
        WHEN p.email LIKE '%rajendra.kumar%' THEN 'Registration Desk Chaos'
        WHEN p.email LIKE '%ganga.prasad%' THEN 'Food Court Litter Problem'
        WHEN p.email LIKE '%vidya.sagar%' THEN 'Exit Gate Bottleneck'
        WHEN p.email LIKE '%sumitra.devi%' THEN 'Hand Washing Station Emergency'
    END,
    CASE 
        WHEN p.email LIKE '%gopal.krishnan%' THEN 'Massive crowd surge at main entrance. People are getting crushed and panicking.'
        WHEN p.email LIKE '%kamala.devi%' THEN 'All washrooms in Block E are overflowing and unusable. Urgent cleaning needed.'
        WHEN p.email LIKE '%balram.singh%' THEN 'Queue management needed at food distribution point. People are fighting for place.'
        WHEN p.email LIKE '%urmila.sharma%' THEN 'Garbage overflow and bad smell near accommodation area. Health hazard for pilgrims.'
        WHEN p.email LIKE '%raman.pillai%' THEN 'Overcrowding at bus boarding point. Need proper queue system to avoid stampede.'
        WHEN p.email LIKE '%shanti.agarwal%' THEN 'Water supply contaminated in hostel block. Many people getting sick after drinking.'
        WHEN p.email LIKE '%krishna.murthy%' THEN 'Uncontrolled crowd at main stage area. Security needed before someone gets hurt.'
        WHEN p.email LIKE '%sarla.devi%' THEN 'Toilets locked and no cleaning staff available. Long queues forming and people are upset.'
        WHEN p.email LIKE '%rajendra.kumar%' THEN 'People pushing and shoving at registration desk. Elderly and children getting hurt.'
        WHEN p.email LIKE '%ganga.prasad%' THEN 'Food waste and litter everywhere in eating area. Attracting insects and creating mess.'
        WHEN p.email LIKE '%vidya.sagar%' THEN 'Bottleneck at exit gate causing dangerous crowding. Need immediate crowd control.'
        WHEN p.email LIKE '%sumitra.devi%' THEN 'Hand washing stations are empty and soap dispensers broken. Hygiene emergency.'
    END,
    CASE 
        WHEN p.email LIKE '%gopal.krishnan%' OR p.email LIKE '%kamala.devi%' OR p.email LIKE '%raman.pillai%' OR p.email LIKE '%shanti.agarwal%' OR p.email LIKE '%vidya.sagar%' THEN 'high'
        WHEN p.email LIKE '%balram.singh%' OR p.email LIKE '%urmila.sharma%' OR p.email LIKE '%krishna.murthy%' OR p.email LIKE '%sarla.devi%' OR p.email LIKE '%rajendra.kumar%' OR p.email LIKE '%sumitra.devi%' THEN 'medium'
        ELSE 'low'
    END::public.priority_level,
    'pending'::public.request_status,
    CASE 
        WHEN p.email LIKE '%gopal.krishnan%' THEN ST_SetSRID(ST_MakePoint(73.1816, 22.3044), 4326)::geography
        WHEN p.email LIKE '%kamala.devi%' THEN ST_SetSRID(ST_MakePoint(73.1811, 22.3039), 4326)::geography
        WHEN p.email LIKE '%balram.singh%' THEN ST_SetSRID(ST_MakePoint(73.1822, 22.3042), 4326)::geography
        WHEN p.email LIKE '%urmila.sharma%' THEN ST_SetSRID(ST_MakePoint(73.1809, 22.3038), 4326)::geography
        WHEN p.email LIKE '%raman.pillai%' THEN ST_SetSRID(ST_MakePoint(73.1825, 22.3047), 4326)::geography
        WHEN p.email LIKE '%shanti.agarwal%' THEN ST_SetSRID(ST_MakePoint(73.1814, 22.3033), 4326)::geography
        WHEN p.email LIKE '%krishna.murthy%' THEN ST_SetSRID(ST_MakePoint(73.1817, 22.3051), 4326)::geography
        WHEN p.email LIKE '%sarla.devi%' THEN ST_SetSRID(ST_MakePoint(73.1808, 22.3029), 4326)::geography
        WHEN p.email LIKE '%rajendra.kumar%' THEN ST_SetSRID(ST_MakePoint(73.1820, 22.3045), 4326)::geography
        WHEN p.email LIKE '%ganga.prasad%' THEN ST_SetSRID(ST_MakePoint(73.1815, 22.3040), 4326)::geography
        WHEN p.email LIKE '%vidya.sagar%' THEN ST_SetSRID(ST_MakePoint(73.1819, 22.3036), 4326)::geography
        WHEN p.email LIKE '%sumitra.devi%' THEN ST_SetSRID(ST_MakePoint(73.1812, 22.3049), 4326)::geography
    END,
    CASE 
        WHEN p.email LIKE '%gopal.krishnan%' THEN 'University Main Entrance Gate'
        WHEN p.email LIKE '%kamala.devi%' THEN 'University Academic Block E'
        WHEN p.email LIKE '%balram.singh%' THEN 'University Dining Hall'
        WHEN p.email LIKE '%urmila.sharma%' THEN 'University Guest House Complex'
        WHEN p.email LIKE '%raman.pillai%' THEN 'University Bus Terminal'
        WHEN p.email LIKE '%shanti.agarwal%' THEN 'University Hostel Block F'
        WHEN p.email LIKE '%krishna.murthy%' THEN 'University Central Stage'
        WHEN p.email LIKE '%sarla.devi%' THEN 'University Recreation Center'
        WHEN p.email LIKE '%rajendra.kumar%' THEN 'University Registration Office'
        WHEN p.email LIKE '%ganga.prasad%' THEN 'University Food Court Area'
        WHEN p.email LIKE '%vidya.sagar%' THEN 'University Exit Gate B'
        WHEN p.email LIKE '%sumitra.devi%' THEN 'University Health Center'
    END,
    NOW(),
    NOW()
FROM profiles p 
WHERE p.email LIKE '%.demo3@example.com' AND p.role = 'pilgrim';

-- =============================================================================
-- STEP 4: UPDATE USER LOCATIONS
-- =============================================================================

-- Update User Locations Table - Link to authenticated users
INSERT INTO user_locations (user_id, latitude, longitude, accuracy, last_updated, is_active) 
SELECT 
    p.id,
    CASE 
        WHEN p.email LIKE '%arjun.reddy%' THEN 22.3043
        WHEN p.email LIKE '%anjali.nair%' THEN 22.3037
        WHEN p.email LIKE '%rohit.chauhan%' THEN 22.3048
        WHEN p.email LIKE '%kavya.iyer%' THEN 22.3035
        WHEN p.email LIKE '%manish.patel%' THEN 22.3041
        WHEN p.email LIKE '%gopal.krishnan%' THEN 22.3044
        WHEN p.email LIKE '%kamala.devi%' THEN 22.3039
        WHEN p.email LIKE '%balram.singh%' THEN 22.3042
        WHEN p.email LIKE '%urmila.sharma%' THEN 22.3038
        WHEN p.email LIKE '%raman.pillai%' THEN 22.3047
        WHEN p.email LIKE '%shanti.agarwal%' THEN 22.3033
        WHEN p.email LIKE '%krishna.murthy%' THEN 22.3051
        WHEN p.email LIKE '%sarla.devi%' THEN 22.3029
        WHEN p.email LIKE '%rajendra.kumar%' THEN 22.3045
        WHEN p.email LIKE '%ganga.prasad%' THEN 22.3040
        WHEN p.email LIKE '%vidya.sagar%' THEN 22.3036
        WHEN p.email LIKE '%sumitra.devi%' THEN 22.3049
    END,
    CASE 
        WHEN p.email LIKE '%arjun.reddy%' THEN 73.1814
        WHEN p.email LIKE '%anjali.nair%' THEN 73.1818
        WHEN p.email LIKE '%rohit.chauhan%' THEN 73.1810
        WHEN p.email LIKE '%kavya.iyer%' THEN 73.1821
        WHEN p.email LIKE '%manish.patel%' THEN 73.1807
        WHEN p.email LIKE '%gopal.krishnan%' THEN 73.1816
        WHEN p.email LIKE '%kamala.devi%' THEN 73.1811
        WHEN p.email LIKE '%balram.singh%' THEN 73.1822
        WHEN p.email LIKE '%urmila.sharma%' THEN 73.1809
        WHEN p.email LIKE '%raman.pillai%' THEN 73.1825
        WHEN p.email LIKE '%shanti.agarwal%' THEN 73.1814
        WHEN p.email LIKE '%krishna.murthy%' THEN 73.1817
        WHEN p.email LIKE '%sarla.devi%' THEN 73.1808
        WHEN p.email LIKE '%rajendra.kumar%' THEN 73.1820
        WHEN p.email LIKE '%ganga.prasad%' THEN 73.1815
        WHEN p.email LIKE '%vidya.sagar%' THEN 73.1819
        WHEN p.email LIKE '%sumitra.devi%' THEN 73.1812
    END,
    10.0,
    NOW(),
    true
FROM profiles p 
WHERE p.email LIKE '%.demo3@example.com';

/*
-- CLEANUP SCRIPT FOR DEMO DATA SET 3 (WITH AUTHENTICATION)
-- Run this to completely remove all demo data from this set

-- Delete assistance requests first (due to foreign key constraints)
DELETE FROM assistance_requests 
WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demo3@example.com'
);

-- Delete user locations
DELETE FROM user_locations 
WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demo3@example.com'
);

-- Delete assignments if any exist
DELETE FROM assignments 
WHERE volunteer_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demo3@example.com'
) OR request_id IN (
    SELECT id FROM assistance_requests WHERE user_id IN (
        SELECT id FROM profiles WHERE email LIKE '%.demo3@example.com'
    )
);

-- Delete profiles
DELETE FROM profiles WHERE email LIKE '%.demo3@example.com';

-- Delete auth users (this will cascade delete profiles due to foreign key)
DELETE FROM auth.users WHERE email LIKE '%.demo3@example.com';

-- Verify cleanup
SELECT COUNT(*) as remaining_demo_profiles FROM profiles WHERE email LIKE '%.demo3@example.com';
SELECT COUNT(*) as remaining_demo_auth_users FROM auth.users WHERE email LIKE '%.demo3@example.com';
SELECT COUNT(*) as remaining_demo_requests FROM assistance_requests WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demo3@example.com'
);
SELECT COUNT(*) as remaining_demo_locations FROM user_locations WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demo3@example.com'
);
*/
