-- =============================================================================
-- BandhuConnect+ Professional Demo Data Setup
-- Version: 2.1.0 - Updated September 6, 2025
-- Description: Creates realistic demo data with general location references
-- =============================================================================

-- This file creates demo data compatible with your ACTUAL database schema
-- Based on production database structure analysis

-- =============================================================================
-- ANALYSIS OF CURRENT DATABASE STRUCTURE:
-- =============================================================================
-- ✅ profiles.id references auth.users(id) (confirmed)
-- ✅ You already have existing auth users and profiles
-- ✅ assistance_requests.location is PostGIS geometry (not lat/lng columns)
-- ✅ profiles has skills ARRAY, location geometry, address text columns
-- ✅ All enum types are working: user_role, request_type, priority_level, etc.
-- ✅ Current data: Production-ready database with demo environment

-- =============================================================================
-- STEP 1: CLEAN UP EXISTING DEMO DATA (preserve real users!)
-- =============================================================================

-- Clean up demo data but preserve actual user accounts
DELETE FROM user_locations WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%@demo.com'
);

DELETE FROM assignments WHERE request_id IN (
    SELECT id FROM assistance_requests WHERE user_id IN (
        SELECT id FROM profiles WHERE email LIKE '%@demo.com'
    )
);

DELETE FROM assistance_requests WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%@demo.com'
);

-- Note: Keep existing profiles that are linked to auth.users
-- We'll only add NEW demo data that references existing auth users

-- =============================================================================
-- STEP 2: CREATE ASSISTANCE REQUESTS (General Campus Area)
-- =============================================================================

-- Use existing demo profiles for creating requests
INSERT INTO assistance_requests (
    id, 
    user_id, 
    type, 
    title, 
    description, 
    priority, 
    status, 
    location, 
    address,
    estimated_duration,
    assignment_method,
    created_at
) VALUES 
    address, 
    estimated_duration, 
    created_at
) VALUES

-- Medical request from existing Ramesh Gupta
(
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'ramesh.elderly@demo.com'),
    'medical'::request_type,
    'Elderly person needs medical assistance at Parul University',
    'My grandfather is feeling dizzy and needs immediate medical attention near Parul University campus medical center',
    'high'::priority_level,
    'pending'::request_status,
    ST_GeogFromText('POINT(72.7794 22.2587)'), -- Parul University coordinates
    'Medical Center, Parul University, Vadodara',
    30,
    NOW() - INTERVAL '5 minutes'
),

-- Lost person request from existing Sunita Devi  
(
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'sunita.family@demo.com'),
    'lost_person'::request_type,
    'Lost child near Parul University library',
    'My 8-year-old son got separated from our group near the Parul University library. He is wearing a red shirt and blue shorts. Please help!',
    'high'::priority_level,
    'pending'::request_status,
    ST_GeogFromText('POINT(72.7784 22.2597)'), -- Near university library
    'Library Area, Parul University, Vadodara',
    45,
    NOW() - INTERVAL '3 minutes'
),

-- Sanitation request from existing Mohan Prasad
(
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'mohan.lost@demo.com'),
    'sanitation'::request_type,
    'Restroom facilities need attention at Engineering Block',
    'The restroom near the Parul University engineering block is out of order and needs urgent repair.',
    'medium'::priority_level,
    'pending'::request_status,
    ST_GeogFromText('POINT(72.7804 22.2577)'), -- Engineering block area
    'Engineering Block, Parul University, Vadodara',
    60,
    NOW() - INTERVAL '10 minutes'
),

-- Guidance request using existing foreign user profile
(
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'sara.translator@demo.com' LIMIT 1),
    'guidance'::request_type,
    'Need directions to Parul University hostel accommodation',
    'We are new international students and cannot find our allocated hostel. Need someone to guide us from the main Parul University campus.',
    'medium'::priority_level,
    'pending'::request_status,
    ST_GeogFromText('POINT(72.7814 22.2567)'), -- Campus hostel area
    'Student Information Center, Parul University, Vadodara',
    20,
    NOW() - INTERVAL '7 minutes'
),

-- Emergency crowd management
(
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'ramesh.elderly@demo.com'),
    'crowd_management'::request_type,
    'Overcrowding at Parul University canteen',
    'There is dangerous overcrowding at the main canteen during lunch hour. Someone might get hurt.',
    'high'::priority_level,
    'pending'::request_status,
    ST_GeogFromText('POINT(72.7774 22.2607)'), -- Campus canteen area
    'Main Canteen, Parul University, Vadodara',
    90,
    NOW() - INTERVAL '2 minutes'
),

-- COMPLETED REQUESTS (for statistics and success rate testing)
(
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'mohan.lost@demo.com'),
    'guidance'::request_type,
    'Found lost belongings at Parul University',
    'Someone helped me find my lost bag with important documents near the campus security office. Thank you!',
    'low'::priority_level,
    'completed'::request_status,
    ST_GeogFromText('POINT(72.7798 22.2582)'), -- Campus security office
    'Security Office, Parul University, Vadodara',
    15,
    NOW() - INTERVAL '2 hours'
),

(
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'sunita.family@demo.com'),
    'medical'::request_type,
    'First aid provided at Parul University sports complex',
    'Volunteer provided excellent first aid when my friend fainted near the sports complex. Very grateful!',
    'medium'::priority_level,
    'completed'::request_status,
    ST_GeogFromText('POINT(72.7792 22.2588)'), -- Sports complex area
    'Sports Complex, Parul University, Vadodara',
    25,
    NOW() - INTERVAL '4 hours'
);

-- =============================================================================
-- STEP 3: UPDATE USER LOCATIONS TO PARUL UNIVERSITY AREA
-- =============================================================================

-- Update existing demo users' locations to Parul University campus
UPDATE user_locations 
SET 
    latitude = 22.2587, 
    longitude = 72.7794,
    accuracy = 5.0,
    last_updated = NOW()
WHERE user_id = (SELECT id FROM profiles WHERE email = 'dr.rajesh.medical@demo.com');

UPDATE user_locations 
SET 
    latitude = 22.2577, 
    longitude = 72.7804,
    accuracy = 4.0,
    last_updated = NOW()
WHERE user_id = (SELECT id FROM profiles WHERE email = 'priya.guide@demo.com');

UPDATE user_locations 
SET 
    latitude = 22.2597, 
    longitude = 72.7784,
    accuracy = 3.0,
    last_updated = NOW()
WHERE user_id = (SELECT id FROM profiles WHERE email = 'amit.security@demo.com');

UPDATE user_locations 
SET 
    latitude = 22.2567, 
    longitude = 72.7814,
    accuracy = 6.0,
    last_updated = NOW()
WHERE user_id = (SELECT id FROM profiles WHERE email = 'ravi.maintenance@demo.com');

-- Add user locations for demo users who don't have them yet
INSERT INTO user_locations (user_id, latitude, longitude, accuracy, is_active, last_updated)
SELECT 
    p.id,
    CASE p.email
        WHEN 'sara.translator@demo.com' THEN 22.2607
        WHEN 'ramesh.elderly@demo.com' THEN 22.2590
        WHEN 'sunita.family@demo.com' THEN 22.2580
        WHEN 'mohan.lost@demo.com' THEN 22.2593
        ELSE 22.2587 -- Default Parul University location
    END as latitude,
    CASE p.email
        WHEN 'sara.translator@demo.com' THEN 72.7774
        WHEN 'ramesh.elderly@demo.com' THEN 72.7790
        WHEN 'sunita.family@demo.com' THEN 72.7800
        WHEN 'mohan.lost@demo.com' THEN 72.7788
        ELSE 72.7794 -- Default Parul University location
    END as longitude,
    5.0 as accuracy,
    true as is_active,
    NOW() as last_updated
FROM profiles p
WHERE p.email LIKE '%@demo.com'
AND p.id NOT IN (SELECT user_id FROM user_locations WHERE user_id IS NOT NULL);

-- =============================================================================
-- STEP 4: CREATE ASSIGNMENTS FOR SUCCESS RATE TESTING
-- =============================================================================

-- Create assignments for completed requests
INSERT INTO assignments (id, request_id, volunteer_id, assigned_at, status, completed_at)
SELECT 
    gen_random_uuid(),
    ar.id,
    (SELECT id FROM profiles WHERE email = 'priya.guide@demo.com'),
    ar.created_at + INTERVAL '5 minutes',
    'completed'::assignment_status,
    ar.created_at + INTERVAL '20 minutes'
FROM assistance_requests ar
JOIN profiles p ON ar.user_id = p.id
WHERE p.email = 'mohan.lost@demo.com' 
AND ar.status = 'completed'::request_status
AND ar.title LIKE '%lost belongings%'

UNION ALL

SELECT 
    gen_random_uuid(),
    ar.id,
    (SELECT id FROM profiles WHERE email = 'dr.rajesh.medical@demo.com'),
    ar.created_at + INTERVAL '3 minutes',
    'completed'::assignment_status,
    ar.created_at + INTERVAL '28 minutes'
FROM assistance_requests ar
JOIN profiles p ON ar.user_id = p.id
WHERE p.email = 'sunita.family@demo.com' 
AND ar.status = 'completed'::request_status
AND ar.title LIKE '%First aid%';

-- =============================================================================
-- VERIFICATION AND SUCCESS CONFIRMATION
-- =============================================================================

-- Display summary of created demo data
SELECT 'PARUL UNIVERSITY DEMO SETUP COMPLETED SUCCESSFULLY!' as status;

SELECT 
    'Total Profiles' as category,
    COUNT(*) as count
FROM profiles 

UNION ALL

SELECT 
    'Demo Profiles' as category,
    COUNT(*) as count
FROM profiles 
WHERE email LIKE '%@demo.com'

UNION ALL

SELECT 
    'User Locations (All)' as category,
    COUNT(*) as count
FROM user_locations

UNION ALL

SELECT 
    'Assistance Requests (All)' as category,
    COUNT(*) as count
FROM assistance_requests

UNION ALL

SELECT 
    'New Parul University Requests' as category,
    COUNT(*) as count
FROM assistance_requests ar
JOIN profiles p ON ar.user_id = p.id
WHERE p.email LIKE '%@demo.com'
AND ar.address LIKE '%Parul University%'

UNION ALL

SELECT 
    'Assignments Created' as category,
    COUNT(*) as count
FROM assignments;

-- Show recent requests for Parul University
SELECT 
    'RECENT PARUL UNIVERSITY REQUESTS' as info,
    ar.title,
    ar.type,
    ar.priority,
    ar.status,
    p.name as requester,
    ar.address,
    ar.created_at
FROM assistance_requests ar
JOIN profiles p ON ar.user_id = p.id
WHERE ar.address LIKE '%Parul University%'
ORDER BY ar.created_at DESC;

SELECT 'Demo environment is ready for Parul University campus testing!' as final_message;
