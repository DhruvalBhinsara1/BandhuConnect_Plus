-- Demo Data Set 4: Mixed Emergency & Special Needs Scenarios with Authentication
-- Parul University Location: 22.3039° N, 73.1813° E
-- All locations within 1km radius

-- =============================================================================
-- STEP 1: CREATE AUTHENTICATED USERS IN AUTH SYSTEM
-- =============================================================================

-- Create auth users for volunteers (Set 4)
INSERT INTO auth.users (
   instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at
) VALUES 
-- Volunteer 1
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sunita.rao.demo4@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Dr. Sunita Rao"}', false, now(), now(), '+91-9876543301', now(), '', '', now(), '', 0, now(), '', now(), false, null),
-- Volunteer 2
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'ashwin.kulkarni.demo4@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Ashwin Kulkarni"}', false, now(), now(), '+91-9876543302', now(), '', '', now(), '', 0, now(), '', now(), false, null),
-- Volunteer 3
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'preeti.jain.demo4@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Preeti Jain"}', false, now(), now(), '+91-9876543303', now(), '', '', now(), '', 0, now(), '', now(), false, null),
-- Volunteer 4
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sunil.yadav.demo4@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Sunil Yadav"}', false, now(), now(), '+91-9876543304', now(), '', '', now(), '', 0, now(), '', now(), false, null);

-- Create auth users for pilgrims (Set 4)
INSERT INTO auth.users (
   instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at
) VALUES 
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'shyam.bihari.demo4@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Shyam Bihari"}', false, now(), now(), '+91-9876540301', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'parvati.nanda.demo4@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Parvati Nanda"}', false, now(), now(), '+91-9876540302', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'mukesh.pandey.demo4@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Mukesh Pandey"}', false, now(), now(), '+91-9876540303', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'lalita.singh.demo4@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Lalita Singh"}', false, now(), now(), '+91-9876540304', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'narayan.das.demo4@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Narayan Das"}', false, now(), now(), '+91-9876540305', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'shakuntala.devi.demo4@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Shakuntala Devi"}', false, now(), now(), '+91-9876540306', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'hansraj.gupta.demo4@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Hansraj Gupta"}', false, now(), now(), '+91-9876540307', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'rukmani.bai.demo4@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Rukmani Bai"}', false, now(), now(), '+91-9876540308', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'govind.lal.demo4@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Govind Lal"}', false, now(), now(), '+91-9876540309', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'kamala.bai.demo4@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Kamala Bai"}', false, now(), now(), '+91-9876540310', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'mohan.das.demo4@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Mohan Das"}', false, now(), now(), '+91-9876540311', now(), '', '', now(), '', 0, now(), '', now(), false, null);

-- =============================================================================
-- STEP 2: CREATE PROFILES LINKED TO AUTH USERS
-- =============================================================================

-- Create Demo Volunteers (Set 4) - Now linked to auth users
INSERT INTO profiles (id, name, email, phone, role, is_active, volunteer_status, skills, created_at, updated_at) 
SELECT 
    au.id,
    JSON_VALUE(au.raw_user_meta_data, '$.name'),
    au.email,
    au.phone,
    'volunteer'::user_role,
    true,
    CASE 
        WHEN au.email LIKE '%ashwin.kulkarni%' THEN 'busy'::volunteer_status
        ELSE 'available'::volunteer_status
    END,
    CASE 
        WHEN au.email LIKE '%sunita.rao%' THEN ARRAY['medical', 'emergency', 'lost_person']
        WHEN au.email LIKE '%ashwin.kulkarni%' THEN ARRAY['guidance', 'crowd_management', 'sanitation']
        WHEN au.email LIKE '%preeti.jain%' THEN ARRAY['emergency', 'medical', 'guidance']
        WHEN au.email LIKE '%sunil.yadav%' THEN ARRAY['lost_person', 'crowd_management', 'emergency']
    END,
    NOW(),
    NOW()
FROM auth.users au 
WHERE au.email IN ('sunita.rao.demo4@example.com', 'ashwin.kulkarni.demo4@example.com', 'preeti.jain.demo4@example.com', 'sunil.yadav.demo4@example.com');

-- Create Demo Pilgrims (Set 4) - Now linked to auth users
INSERT INTO profiles (id, name, email, phone, role, is_active, created_at, updated_at)
SELECT 
    au.id,
    JSON_VALUE(au.raw_user_meta_data, '$.name'),
    au.email,
    au.phone,
    'pilgrim'::user_role,
    true,
    NOW(),
    NOW()
FROM auth.users au 
WHERE au.email IN (
    'shyam.bihari.demo4@example.com', 'parvati.nanda.demo4@example.com', 'mukesh.pandey.demo4@example.com',
    'lalita.singh.demo4@example.com', 'narayan.das.demo4@example.com', 'shakuntala.devi.demo4@example.com',
    'hansraj.gupta.demo4@example.com', 'rukmani.bai.demo4@example.com', 'govind.lal.demo4@example.com',
    'kamala.bai.demo4@example.com', 'mohan.das.demo4@example.com'
);

-- =============================================================================
-- STEP 3: CREATE ASSISTANCE REQUESTS
-- =============================================================================

-- Create Assistance Requests (Set 4) - Mixed Emergency & Special Needs Focus
INSERT INTO assistance_requests (id, user_id, type, title, description, priority, status, location, address, created_at, updated_at) 
SELECT 
    gen_random_uuid(),
    p.id,
    CASE 
        WHEN p.email LIKE '%shyam.bihari%' THEN 'emergency'
        WHEN p.email LIKE '%parvati.nanda%' THEN 'guidance'
        WHEN p.email LIKE '%mukesh.pandey%' THEN 'medical'
        WHEN p.email LIKE '%lalita.singh%' THEN 'lost_person'
        WHEN p.email LIKE '%narayan.das%' THEN 'emergency'
        WHEN p.email LIKE '%shakuntala.devi%' THEN 'guidance'
        WHEN p.email LIKE '%hansraj.gupta%' THEN 'medical'
        WHEN p.email LIKE '%rukmani.bai%' THEN 'emergency'
        WHEN p.email LIKE '%govind.lal%' THEN 'lost_person'
        WHEN p.email LIKE '%kamala.bai%' THEN 'medical'
        WHEN p.email LIKE '%mohan.das%' THEN 'guidance'
    END::request_type,
    CASE 
        WHEN p.email LIKE '%shyam.bihari%' THEN 'Diabetic Emergency'
        WHEN p.email LIKE '%parvati.nanda%' THEN 'Blind Person Navigation Help'
        WHEN p.email LIKE '%mukesh.pandey%' THEN 'Pregnant Woman Labor Pains'
        WHEN p.email LIKE '%lalita.singh%' THEN 'Alzheimer Patient Missing'
        WHEN p.email LIKE '%narayan.das%' THEN 'Heart Attack Symptoms'
        WHEN p.email LIKE '%shakuntala.devi%' THEN 'Sign Language Interpreter Needed'
        WHEN p.email LIKE '%hansraj.gupta%' THEN 'Epileptic Seizure Emergency'
        WHEN p.email LIKE '%rukmani.bai%' THEN 'Wheelchair Breakdown Emergency'
        WHEN p.email LIKE '%govind.lal%' THEN 'Mentally Challenged Adult Missing'
        WHEN p.email LIKE '%kamala.bai%' THEN 'Severe Allergic Reaction'
        WHEN p.email LIKE '%mohan.das%' THEN 'Foreign Pilgrim Translator Needed'
    END,
    CASE 
        WHEN p.email LIKE '%shyam.bihari%' THEN 'Diabetic emergency - person unconscious, needs immediate insulin and medical attention.'
        WHEN p.email LIKE '%parvati.nanda%' THEN 'Blind person needs assistance to navigate from registration to accommodation area.'
        WHEN p.email LIKE '%mukesh.pandey%' THEN 'Pregnant woman experiencing labor pains. Need emergency medical transport.'
        WHEN p.email LIKE '%lalita.singh%' THEN 'Elderly man with Alzheimer walked away from family. May not remember his name or address.'
        WHEN p.email LIKE '%narayan.das%' THEN 'Heart attack symptoms in 60-year-old man. Chest pain, sweating, difficulty breathing.'
        WHEN p.email LIKE '%shakuntala.devi%' THEN 'Deaf and mute person needs sign language interpreter for registration process.'
        WHEN p.email LIKE '%hansraj.gupta%' THEN 'Epileptic seizure in young adult. Person is unconscious and needs immediate medical care.'
        WHEN p.email LIKE '%rukmani.bai%' THEN 'Wheelchair broke down and elderly disabled person is stranded. Cannot move independently.'
        WHEN p.email LIKE '%govind.lal%' THEN 'Mentally challenged adult has wandered off. Family is extremely worried and searching.'
        WHEN p.email LIKE '%kamala.bai%' THEN 'Severe allergic reaction to food. Person has swollen face and difficulty breathing.'
        WHEN p.email LIKE '%mohan.das%' THEN 'Non-Hindi speaking foreign pilgrim needs translator for emergency medical consultation.'
    END,
    CASE 
        WHEN p.email LIKE '%shyam.bihari%' OR p.email LIKE '%mukesh.pandey%' OR p.email LIKE '%lalita.singh%' OR p.email LIKE '%narayan.das%' OR p.email LIKE '%hansraj.gupta%' OR p.email LIKE '%govind.lal%' OR p.email LIKE '%kamala.bai%' THEN 'high'
        ELSE 'medium'
    END::priority_level,
    'pending'::request_status,
    CASE 
        WHEN p.email LIKE '%shyam.bihari%' THEN ST_SetSRID(ST_MakePoint(73.1815, 22.3043), 4326)::geography
        WHEN p.email LIKE '%parvati.nanda%' THEN ST_SetSRID(ST_MakePoint(73.1819, 22.3040), 4326)::geography
        WHEN p.email LIKE '%mukesh.pandey%' THEN ST_SetSRID(ST_MakePoint(73.1812, 22.3037), 4326)::geography
        WHEN p.email LIKE '%lalita.singh%' THEN ST_SetSRID(ST_MakePoint(73.1821, 22.3050), 4326)::geography
        WHEN p.email LIKE '%narayan.das%' THEN ST_SetSRID(ST_MakePoint(73.1810, 22.3034), 4326)::geography
        WHEN p.email LIKE '%shakuntala.devi%' THEN ST_SetSRID(ST_MakePoint(73.1814, 22.3048), 4326)::geography
        WHEN p.email LIKE '%hansraj.gupta%' THEN ST_SetSRID(ST_MakePoint(73.1823, 22.3031), 4326)::geography
        WHEN p.email LIKE '%rukmani.bai%' THEN ST_SetSRID(ST_MakePoint(73.1808, 22.3052), 4326)::geography
        WHEN p.email LIKE '%govind.lal%' THEN ST_SetSRID(ST_MakePoint(73.1816, 22.3035), 4326)::geography
        WHEN p.email LIKE '%kamala.bai%' THEN ST_SetSRID(ST_MakePoint(73.1811, 22.3044), 4326)::geography
        WHEN p.email LIKE '%mohan.das%' THEN ST_SetSRID(ST_MakePoint(73.1825, 22.3039), 4326)::geography
    END,
    CASE 
        WHEN p.email LIKE '%shyam.bihari%' THEN 'University Emergency Medical Post'
        WHEN p.email LIKE '%parvati.nanda%' THEN 'University Registration Desk'
        WHEN p.email LIKE '%mukesh.pandey%' THEN 'University Women Rest Area'
        WHEN p.email LIKE '%lalita.singh%' THEN 'University Senior Citizens Zone'
        WHEN p.email LIKE '%narayan.das%' THEN 'University Meditation Hall'
        WHEN p.email LIKE '%shakuntala.devi%' THEN 'University Special Needs Counter'
        WHEN p.email LIKE '%hansraj.gupta%' THEN 'University Youth Activity Center'
        WHEN p.email LIKE '%rukmani.bai%' THEN 'University Accessibility Ramp'
        WHEN p.email LIKE '%govind.lal%' THEN 'University Recreation Ground'
        WHEN p.email LIKE '%kamala.bai%' THEN 'University Community Kitchen'
        WHEN p.email LIKE '%mohan.das%' THEN 'University International Help Desk'
    END,
    NOW(),
    NOW()
FROM profiles p 
WHERE p.email LIKE '%.demo4@example.com' AND p.role = 'pilgrim';

-- =============================================================================
-- STEP 4: UPDATE USER LOCATIONS
-- =============================================================================

-- Update User Locations Table - Link to authenticated users
INSERT INTO user_locations (user_id, latitude, longitude, accuracy, last_updated, is_active) 
SELECT 
    p.id,
    CASE 
        WHEN p.email LIKE '%sunita.rao%' THEN 22.3041
        WHEN p.email LIKE '%ashwin.kulkarni%' THEN 22.3038
        WHEN p.email LIKE '%preeti.jain%' THEN 22.3046
        WHEN p.email LIKE '%sunil.yadav%' THEN 22.3033
        WHEN p.email LIKE '%shyam.bihari%' THEN 22.3043
        WHEN p.email LIKE '%parvati.nanda%' THEN 22.3040
        WHEN p.email LIKE '%mukesh.pandey%' THEN 22.3037
        WHEN p.email LIKE '%lalita.singh%' THEN 22.3050
        WHEN p.email LIKE '%narayan.das%' THEN 22.3034
        WHEN p.email LIKE '%shakuntala.devi%' THEN 22.3048
        WHEN p.email LIKE '%hansraj.gupta%' THEN 22.3031
        WHEN p.email LIKE '%rukmani.bai%' THEN 22.3052
        WHEN p.email LIKE '%govind.lal%' THEN 22.3035
        WHEN p.email LIKE '%kamala.bai%' THEN 22.3044
        WHEN p.email LIKE '%mohan.das%' THEN 22.3039
    END,
    CASE 
        WHEN p.email LIKE '%sunita.rao%' THEN 73.1813
        WHEN p.email LIKE '%ashwin.kulkarni%' THEN 73.1820
        WHEN p.email LIKE '%preeti.jain%' THEN 73.1809
        WHEN p.email LIKE '%sunil.yadav%' THEN 73.1817
        WHEN p.email LIKE '%shyam.bihari%' THEN 73.1815
        WHEN p.email LIKE '%parvati.nanda%' THEN 73.1819
        WHEN p.email LIKE '%mukesh.pandey%' THEN 73.1812
        WHEN p.email LIKE '%lalita.singh%' THEN 73.1821
        WHEN p.email LIKE '%narayan.das%' THEN 73.1810
        WHEN p.email LIKE '%shakuntala.devi%' THEN 73.1814
        WHEN p.email LIKE '%hansraj.gupta%' THEN 73.1823
        WHEN p.email LIKE '%rukmani.bai%' THEN 73.1808
        WHEN p.email LIKE '%govind.lal%' THEN 73.1816
        WHEN p.email LIKE '%kamala.bai%' THEN 73.1811
        WHEN p.email LIKE '%mohan.das%' THEN 73.1825
    END,
    10.0,
    NOW(),
    true
FROM profiles p 
WHERE p.email LIKE '%.demo4@example.com';

/*
-- CLEANUP SCRIPT FOR DEMO DATA SET 4 (WITH AUTHENTICATION)
-- Run this to completely remove all demo data from this set

-- Delete assistance requests first (due to foreign key constraints)
DELETE FROM assistance_requests 
WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demo4@example.com'
);

-- Delete user locations
DELETE FROM user_locations 
WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demo4@example.com'
);

-- Delete assignments if any exist
DELETE FROM assignments 
WHERE volunteer_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demo4@example.com'
) OR request_id IN (
    SELECT id FROM assistance_requests WHERE user_id IN (
        SELECT id FROM profiles WHERE email LIKE '%.demo4@example.com'
    )
);

-- Delete profiles
DELETE FROM profiles WHERE email LIKE '%.demo4@example.com';

-- Delete auth users (this will cascade delete profiles due to foreign key)
DELETE FROM auth.users WHERE email LIKE '%.demo4@example.com';

-- Verify cleanup
SELECT COUNT(*) as remaining_demo_profiles FROM profiles WHERE email LIKE '%.demo4@example.com';
SELECT COUNT(*) as remaining_demo_auth_users FROM auth.users WHERE email LIKE '%.demo4@example.com';
SELECT COUNT(*) as remaining_demo_requests FROM assistance_requests WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demo4@example.com'
);
SELECT COUNT(*) as remaining_demo_locations FROM user_locations WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demo4@example.com'
);
*/
