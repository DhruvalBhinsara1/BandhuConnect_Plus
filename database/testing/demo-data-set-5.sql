-- Demo Data Set 5: Large Scale Event Management Scenarios with Authentication
-- Parul University Location: 22.3039° N, 73.1813° E
-- All locations within 1km radius

-- =============================================================================
-- STEP 1: CREATE AUTHENTICATED USERS IN AUTH SYSTEM
-- =============================================================================

-- Create auth users for volunteers (Set 5)
INSERT INTO auth.users (
   instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at
) VALUES 
-- Volunteer 1
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'ramesh.thakur.demo5@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Col. Ramesh Thakur"}', false, now(), now(), '+91-9876543401', now(), '', '', now(), '', 0, now(), '', now(), false, null),
-- Volunteer 2
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'mary.joseph.demo5@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Sister Mary Joseph"}', false, now(), now(), '+91-9876543402', now(), '', '', now(), '', 0, now(), '', now(), false, null),
-- Volunteer 3
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sachin.more.demo5@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Engineer Sachin More"}', false, now(), now(), '+91-9876543403', now(), '', '', now(), '', 0, now(), '', now(), false, null),
-- Volunteer 4
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'rekha.desai.demo5@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Teacher Rekha Desai"}', false, now(), now(), '+91-9876543404', now(), '', '', now(), '', 0, now(), '', now(), false, null),
-- Volunteer 5
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'priyanka.shah.demo5@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Nurse Priyanka Shah"}', false, now(), now(), '+91-9876543405', now(), '', '', now(), '', 0, now(), '', now(), false, null),
-- Volunteer 6
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'vikash.chief.demo5@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Security Chief Vikash"}', false, now(), now(), '+91-9876543406', now(), '', '', now(), '', 0, now(), '', now(), false, null);

-- Create auth users for pilgrims (Set 5)
INSERT INTO auth.users (
   instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at
) VALUES 
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'babulal.sharma.demo5@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Babulal Sharma"}', false, now(), now(), '+91-9876540401', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'savitri.devi.demo5@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Savitri Devi"}', false, now(), now(), '+91-9876540402', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'jagannath.prasad.demo5@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Jagannath Prasad"}', false, now(), now(), '+91-9876540403', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'mahavir.singh.demo5@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Mahavir Singh"}', false, now(), now(), '+91-9876540404', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'gayatri.bai.demo5@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Gayatri Bai"}', false, now(), now(), '+91-9876540405', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'tulsiram.yadav.demo5@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Tulsiram Yadav"}', false, now(), now(), '+91-9876540406', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'indira.kumari.demo5@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Indira Kumari"}', false, now(), now(), '+91-9876540407', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'banwari.lal.demo5@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Banwari Lal"}', false, now(), now(), '+91-9876540408', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sudama.prasad.demo5@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Sudama Prasad"}', false, now(), now(), '+91-9876540409', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'draupadi.devi.demo5@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Draupadi Devi"}', false, now(), now(), '+91-9876540410', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'hanuman.das.demo5@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Hanuman Das"}', false, now(), now(), '+91-9876540411', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sushila.devi.demo5@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Sushila Devi"}', false, now(), now(), '+91-9876540412', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'ramchandra.jha.demo5@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Ramchandra Jha"}', false, now(), now(), '+91-9876540413', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'kaushalya.mata.demo5@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Kaushalya Mata"}', false, now(), now(), '+91-9876540414', now(), '', '', now(), '', 0, now(), '', now(), false, null),
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'bhishma.pitamah.demo5@example.com', crypt('password123', gen_salt('bf')), now(), '', now(), '', now(), '', '', now(), now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Bhishma Pitamah"}', false, now(), now(), '+91-9876540415', now(), '', '', now(), '', 0, now(), '', now(), false, null);

-- =============================================================================
-- STEP 2: CREATE PROFILES LINKED TO AUTH USERS
-- =============================================================================

-- Create Demo Volunteers (Set 5) - Now linked to auth users
INSERT INTO profiles (id, name, email, phone, role, is_active, volunteer_status, skills, created_at, updated_at) 
SELECT 
    au.id,
    JSON_VALUE(au.raw_user_meta_data, '$.name'),
    au.email,
    au.phone,
    'volunteer'::user_role,
    true,
    CASE 
        WHEN au.email LIKE '%sachin.more%' OR au.email LIKE '%vikash.chief%' THEN 'busy'::volunteer_status
        ELSE 'available'::volunteer_status
    END,
    CASE 
        WHEN au.email LIKE '%ramesh.thakur%' THEN ARRAY['crowd_management', 'emergency', 'guidance']
        WHEN au.email LIKE '%mary.joseph%' THEN ARRAY['medical', 'guidance', 'lost_person']
        WHEN au.email LIKE '%sachin.more%' THEN ARRAY['sanitation', 'crowd_management', 'emergency']
        WHEN au.email LIKE '%rekha.desai%' THEN ARRAY['guidance', 'lost_person', 'crowd_management']
        WHEN au.email LIKE '%priyanka.shah%' THEN ARRAY['medical', 'emergency', 'sanitation']
        WHEN au.email LIKE '%vikash.chief%' THEN ARRAY['crowd_management', 'emergency', 'lost_person']
    END,
    NOW(),
    NOW()
FROM auth.users au 
WHERE au.email IN ('ramesh.thakur.demo5@example.com', 'mary.joseph.demo5@example.com', 'sachin.more.demo5@example.com', 'rekha.desai.demo5@example.com', 'priyanka.shah.demo5@example.com', 'vikash.chief.demo5@example.com');

-- Create Demo Pilgrims (Set 5) - Now linked to auth users
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
    'babulal.sharma.demo5@example.com', 'savitri.devi.demo5@example.com', 'jagannath.prasad.demo5@example.com',
    'mahavir.singh.demo5@example.com', 'gayatri.bai.demo5@example.com', 'tulsiram.yadav.demo5@example.com',
    'indira.kumari.demo5@example.com', 'banwari.lal.demo5@example.com', 'sudama.prasad.demo5@example.com',
    'draupadi.devi.demo5@example.com', 'hanuman.das.demo5@example.com', 'sushila.devi.demo5@example.com',
    'ramchandra.jha.demo5@example.com', 'kaushalya.mata.demo5@example.com', 'bhishma.pitamah.demo5@example.com'
);

-- =============================================================================
-- STEP 3: CREATE ASSISTANCE REQUESTS
-- =============================================================================

-- Create Assistance Requests (Set 5) - Large Scale Event Management Focus
INSERT INTO assistance_requests (id, user_id, type, title, description, priority, status, location, address, created_at, updated_at) 
SELECT 
    gen_random_uuid(),
    p.id,
    CASE 
        WHEN p.email LIKE '%babulal.sharma%' OR p.email LIKE '%mahavir.singh%' OR p.email LIKE '%hanuman.das%' OR p.email LIKE '%ramchandra.jha%' THEN 'emergency'
        WHEN p.email LIKE '%savitri.devi%' OR p.email LIKE '%tulsiram.yadav%' OR p.email LIKE '%sushila.devi%' THEN 'crowd_management'
        WHEN p.email LIKE '%jagannath.prasad%' OR p.email LIKE '%sudama.prasad%' OR p.email LIKE '%kaushalya.mata%' THEN 'medical'
        WHEN p.email LIKE '%gayatri.bai%' OR p.email LIKE '%bhishma.pitamah%' THEN 'lost_person'
        WHEN p.email LIKE '%indira.kumari%' OR p.email LIKE '%banwari.lal%' THEN 'sanitation'
        ELSE 'guidance'
    END::request_type,
    CASE 
        WHEN p.email LIKE '%babulal.sharma%' THEN 'Structural Collapse Emergency'
        WHEN p.email LIKE '%savitri.devi%' THEN 'Stampede Risk at Ceremony'
        WHEN p.email LIKE '%jagannath.prasad%' THEN 'Mass Food Poisoning'
        WHEN p.email LIKE '%mahavir.singh%' THEN 'Fire Outbreak in Tents'
        WHEN p.email LIKE '%gayatri.bai%' THEN 'Missing School Children Group'
        WHEN p.email LIKE '%tulsiram.yadav%' THEN 'Waste Management Crisis'
        WHEN p.email LIKE '%indira.kumari%' THEN 'Vehicle Access Control'
        WHEN p.email LIKE '%banwari.lal%' THEN 'Power Outage Emergency'
        WHEN p.email LIKE '%sudama.prasad%' THEN 'Heat Stroke Cases'
        WHEN p.email LIKE '%draupadi.devi%' THEN 'Communication System Failure'
        WHEN p.email LIKE '%hanuman.das%' THEN 'Security Threat Alert'
        WHEN p.email LIKE '%sushila.devi%' THEN 'Traffic Jam Crisis'
        WHEN p.email LIKE '%ramchandra.jha%' THEN 'Water Contamination'
        WHEN p.email LIKE '%kaushalya.mata%' THEN 'Multiple Maternity Emergency'
        WHEN p.email LIKE '%bhishma.pitamah%' THEN 'Dementia Patient Missing'
    END,
    CASE 
        WHEN p.email LIKE '%babulal.sharma%' THEN 'Multiple people trapped in collapsed temporary structure. Rescue operation needed urgently.'
        WHEN p.email LIKE '%savitri.devi%' THEN 'Stampede risk at main ceremonial area. Thousands of people pushing towards stage.'
        WHEN p.email LIKE '%jagannath.prasad%' THEN 'Mass food poisoning incident. Multiple people vomiting and having stomach cramps.'
        WHEN p.email LIKE '%mahavir.singh%' THEN 'Fire outbreak in accommodation tent. People evacuating, some with burn injuries.'
        WHEN p.email LIKE '%gayatri.bai%' THEN 'Group of 15 children from school group missing after cultural program ended.'
        WHEN p.email LIKE '%tulsiram.yadav%' THEN 'Complete breakdown of waste management system. Garbage everywhere, hygiene crisis.'
        WHEN p.email LIKE '%indira.kumari%' THEN 'Uncontrolled entry of vehicles into pedestrian area. Risk of accidents.'
        WHEN p.email LIKE '%banwari.lal%' THEN 'Power outage during night event. Complete darkness, people panicking and falling.'
        WHEN p.email LIKE '%sudama.prasad%' THEN 'Heat stroke cases increasing rapidly. Temperature very high, many people collapsing.'
        WHEN p.email LIKE '%draupadi.devi%' THEN 'Communication system failed. Thousands of people cannot find their groups or way back.'
        WHEN p.email LIKE '%hanuman.das%' THEN 'Security threat reported. Suspicious activity near VIP area, evacuation may be needed.'
        WHEN p.email LIKE '%sushila.devi%' THEN 'Traffic jam with thousands of buses. Pilgrims stranded for hours without food or water.'
        WHEN p.email LIKE '%ramchandra.jha%' THEN 'Water contamination detected in main supply. Risk of cholera outbreak among pilgrims.'
        WHEN p.email LIKE '%kaushalya.mata%' THEN 'Maternity emergency during event. Multiple pregnant women in labor need immediate care.'
        WHEN p.email LIKE '%bhishma.pitamah%' THEN 'Elderly pilgrim with dementia missing for 3 hours. Last seen near main entrance.'
    END,
    CASE 
        WHEN p.email LIKE '%babulal.sharma%' OR p.email LIKE '%savitri.devi%' OR p.email LIKE '%jagannath.prasad%' OR p.email LIKE '%mahavir.singh%' OR p.email LIKE '%gayatri.bai%' OR p.email LIKE '%indira.kumari%' OR p.email LIKE '%banwari.lal%' OR p.email LIKE '%hanuman.das%' OR p.email LIKE '%ramchandra.jha%' OR p.email LIKE '%kaushalya.mata%' OR p.email LIKE '%bhishma.pitamah%' THEN 'high'
        ELSE 'medium'
    END::priority_level,
    'pending'::request_status,
    CASE 
        WHEN p.email LIKE '%babulal.sharma%' THEN ST_SetSRID(ST_MakePoint(73.1814, 22.3041), 4326)::geography
        WHEN p.email LIKE '%savitri.devi%' THEN ST_SetSRID(ST_MakePoint(73.1817, 22.3037), 4326)::geography
        WHEN p.email LIKE '%jagannath.prasad%' THEN ST_SetSRID(ST_MakePoint(73.1811, 22.3044), 4326)::geography
        WHEN p.email LIKE '%mahavir.singh%' THEN ST_SetSRID(ST_MakePoint(73.1821, 22.3040), 4326)::geography
        WHEN p.email LIKE '%gayatri.bai%' THEN ST_SetSRID(ST_MakePoint(73.1809, 22.3047), 4326)::geography
        WHEN p.email LIKE '%tulsiram.yadav%' THEN ST_SetSRID(ST_MakePoint(73.1815, 22.3034), 4326)::geography
        WHEN p.email LIKE '%indira.kumari%' THEN ST_SetSRID(ST_MakePoint(73.1813, 22.3051), 4326)::geography
        WHEN p.email LIKE '%banwari.lal%' THEN ST_SetSRID(ST_MakePoint(73.1819, 22.3032), 4326)::geography
        WHEN p.email LIKE '%sudama.prasad%' THEN ST_SetSRID(ST_MakePoint(73.1816, 22.3049), 4326)::geography
        WHEN p.email LIKE '%draupadi.devi%' THEN ST_SetSRID(ST_MakePoint(73.1822, 22.3038), 4326)::geography
        WHEN p.email LIKE '%hanuman.das%' THEN ST_SetSRID(ST_MakePoint(73.1808, 22.3043), 4326)::geography
        WHEN p.email LIKE '%sushila.devi%' THEN ST_SetSRID(ST_MakePoint(73.1824, 22.3035), 4326)::geography
        WHEN p.email LIKE '%ramchandra.jha%' THEN ST_SetSRID(ST_MakePoint(73.1811, 22.3052), 4326)::geography
        WHEN p.email LIKE '%kaushalya.mata%' THEN ST_SetSRID(ST_MakePoint(73.1818, 22.3030), 4326)::geography
        WHEN p.email LIKE '%bhishma.pitamah%' THEN ST_SetSRID(ST_MakePoint(73.1812, 22.3046), 4326)::geography
    END,
    CASE 
        WHEN p.email LIKE '%babulal.sharma%' THEN 'University Temporary Pavilion Area'
        WHEN p.email LIKE '%savitri.devi%' THEN 'University Main Ceremonial Ground'
        WHEN p.email LIKE '%jagannath.prasad%' THEN 'University Community Dining Complex'
        WHEN p.email LIKE '%mahavir.singh%' THEN 'University Temporary Accommodation Zone'
        WHEN p.email LIKE '%gayatri.bai%' THEN 'University Cultural Performance Arena'
        WHEN p.email LIKE '%tulsiram.yadav%' THEN 'University Waste Management Area'
        WHEN p.email LIKE '%indira.kumari%' THEN 'University Vehicle Control Zone'
        WHEN p.email LIKE '%banwari.lal%' THEN 'University Main Event Amphitheater'
        WHEN p.email LIKE '%sudama.prasad%' THEN 'University Open Ground Area'
        WHEN p.email LIKE '%draupadi.devi%' THEN 'University Information Central Hub'
        WHEN p.email LIKE '%hanuman.das%' THEN 'University VIP Security Zone'
        WHEN p.email LIKE '%sushila.devi%' THEN 'University Bus Parking Terminus'
        WHEN p.email LIKE '%ramchandra.jha%' THEN 'University Water Treatment Plant'
        WHEN p.email LIKE '%kaushalya.mata%' THEN 'University Women Medical Center'
        WHEN p.email LIKE '%bhishma.pitamah%' THEN 'University Main Entrance Security'
    END,
    NOW(),
    NOW()
FROM profiles p 
WHERE p.email LIKE '%.demo5@example.com' AND p.role = 'pilgrim';

-- =============================================================================
-- STEP 4: UPDATE USER LOCATIONS
-- =============================================================================

-- Update User Locations Table - Link to authenticated users
INSERT INTO user_locations (user_id, latitude, longitude, accuracy, last_updated, is_active) 
SELECT 
    p.id,
    CASE 
        WHEN p.email LIKE '%ramesh.thakur%' THEN 22.3039
        WHEN p.email LIKE '%mary.joseph%' THEN 22.3042
        WHEN p.email LIKE '%sachin.more%' THEN 22.3036
        WHEN p.email LIKE '%rekha.desai%' THEN 22.3045
        WHEN p.email LIKE '%priyanka.shah%' THEN 22.3033
        WHEN p.email LIKE '%vikash.chief%' THEN 22.3050
        WHEN p.email LIKE '%babulal.sharma%' THEN 22.3041
        WHEN p.email LIKE '%savitri.devi%' THEN 22.3037
        WHEN p.email LIKE '%jagannath.prasad%' THEN 22.3044
        WHEN p.email LIKE '%mahavir.singh%' THEN 22.3040
        WHEN p.email LIKE '%gayatri.bai%' THEN 22.3047
        WHEN p.email LIKE '%tulsiram.yadav%' THEN 22.3034
        WHEN p.email LIKE '%indira.kumari%' THEN 22.3051
        WHEN p.email LIKE '%banwari.lal%' THEN 22.3032
        WHEN p.email LIKE '%sudama.prasad%' THEN 22.3049
        WHEN p.email LIKE '%draupadi.devi%' THEN 22.3038
        WHEN p.email LIKE '%hanuman.das%' THEN 22.3043
        WHEN p.email LIKE '%sushila.devi%' THEN 22.3035
        WHEN p.email LIKE '%ramchandra.jha%' THEN 22.3052
        WHEN p.email LIKE '%kaushalya.mata%' THEN 22.3030
        WHEN p.email LIKE '%bhishma.pitamah%' THEN 22.3046
    END,
    CASE 
        WHEN p.email LIKE '%ramesh.thakur%' THEN 73.1813
        WHEN p.email LIKE '%mary.joseph%' THEN 73.1810
        WHEN p.email LIKE '%sachin.more%' THEN 73.1816
        WHEN p.email LIKE '%rekha.desai%' THEN 73.1818
        WHEN p.email LIKE '%priyanka.shah%' THEN 73.1812
        WHEN p.email LIKE '%vikash.chief%' THEN 73.1820
        WHEN p.email LIKE '%babulal.sharma%' THEN 73.1814
        WHEN p.email LIKE '%savitri.devi%' THEN 73.1817
        WHEN p.email LIKE '%jagannath.prasad%' THEN 73.1811
        WHEN p.email LIKE '%mahavir.singh%' THEN 73.1821
        WHEN p.email LIKE '%gayatri.bai%' THEN 73.1809
        WHEN p.email LIKE '%tulsiram.yadav%' THEN 73.1815
        WHEN p.email LIKE '%indira.kumari%' THEN 73.1813
        WHEN p.email LIKE '%banwari.lal%' THEN 73.1819
        WHEN p.email LIKE '%sudama.prasad%' THEN 73.1816
        WHEN p.email LIKE '%draupadi.devi%' THEN 73.1822
        WHEN p.email LIKE '%hanuman.das%' THEN 73.1808
        WHEN p.email LIKE '%sushila.devi%' THEN 73.1824
        WHEN p.email LIKE '%ramchandra.jha%' THEN 73.1811
        WHEN p.email LIKE '%kaushalya.mata%' THEN 73.1818
        WHEN p.email LIKE '%bhishma.pitamah%' THEN 73.1812
    END,
    10.0,
    NOW(),
    true
FROM profiles p 
WHERE p.email LIKE '%.demo5@example.com';

/*
-- CLEANUP SCRIPT FOR DEMO DATA SET 5 (WITH AUTHENTICATION)
-- Run this to completely remove all demo data from this set

-- Delete assistance requests first (due to foreign key constraints)
DELETE FROM assistance_requests 
WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demo5@example.com'
);

-- Delete user locations
DELETE FROM user_locations 
WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demo5@example.com'
);

-- Delete assignments if any exist
DELETE FROM assignments 
WHERE volunteer_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demo5@example.com'
) OR request_id IN (
    SELECT id FROM assistance_requests WHERE user_id IN (
        SELECT id FROM profiles WHERE email LIKE '%.demo5@example.com'
    )
);

-- Delete profiles
DELETE FROM profiles WHERE email LIKE '%.demo5@example.com';

-- Delete auth users (this will cascade delete profiles due to foreign key)
DELETE FROM auth.users WHERE email LIKE '%.demo5@example.com';

-- Verify cleanup
SELECT COUNT(*) as remaining_demo_profiles FROM profiles WHERE email LIKE '%.demo5@example.com';
SELECT COUNT(*) as remaining_demo_auth_users FROM auth.users WHERE email LIKE '%.demo5@example.com';
SELECT COUNT(*) as remaining_demo_requests FROM assistance_requests WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demo5@example.com'
);
SELECT COUNT(*) as remaining_demo_locations FROM user_locations WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%.demo5@example.com'
);
*/
