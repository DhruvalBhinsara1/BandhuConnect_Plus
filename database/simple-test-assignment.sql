-- Simple test to create one assignment with real user IDs from your app
-- Run this in Supabase SQL Editor after checking your actual user IDs

-- First, check what users exist in your system
SELECT 'Current users in system:' as info;
SELECT id, name, email, role FROM profiles ORDER BY created_at DESC LIMIT 10;

-- Check if there are any existing assignments
SELECT 'Existing assignments:' as info;
SELECT 
  a.id,
  a.status,
  ar.title,
  pp.name as pilgrim_name,
  pv.name as volunteer_name
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
JOIN profiles pp ON ar.user_id = pp.id
JOIN profiles pv ON a.volunteer_id = pv.id
LIMIT 5;

-- Check existing location data
SELECT 'Current location data:' as info;
SELECT 
  ul.user_id,
  p.name,
  p.role,
  ul.latitude,
  ul.longitude,
  ul.last_updated,
  ul.is_active
FROM user_locations ul
JOIN profiles p ON ul.user_id = p.id
ORDER BY ul.last_updated DESC
LIMIT 10;

-- Instructions for manual assignment creation:
-- 1. Copy a real pilgrim user ID from the first query above
-- 2. Copy a real volunteer user ID from the first query above  
-- 3. Replace the UUIDs below with your actual user IDs
-- 4. Uncomment and run the INSERT statements

/*
-- Create assistance request (replace pilgrim_user_id with actual ID)
INSERT INTO assistance_requests (id, user_id, title, description, request_type, status, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'YOUR_PILGRIM_USER_ID_HERE', -- Replace with actual pilgrim ID
  'Test request for debugging',
  'This is a test request to debug location visibility',
  'navigation',
  'open',
  NOW(),
  NOW()
);

-- Create assignment (replace both user IDs with actual IDs)
INSERT INTO assignments (id, request_id, volunteer_id, status, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM assistance_requests WHERE title = 'Test request for debugging' LIMIT 1),
  'YOUR_VOLUNTEER_USER_ID_HERE', -- Replace with actual volunteer ID
  'accepted',
  NOW(),
  NOW()
);
*/

-- Test the functions after creating assignment (replace with actual IDs)
-- SELECT * FROM get_volunteer_locations_for_pilgrim('YOUR_PILGRIM_USER_ID_HERE');
-- SELECT * FROM get_pilgrim_locations_for_volunteer('YOUR_VOLUNTEER_USER_ID_HERE');
