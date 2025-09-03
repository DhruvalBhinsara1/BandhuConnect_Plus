-- Debug script to check assignments and location data
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check if there are any assignments in the database
SELECT 'ASSIGNMENTS CHECK' as check_type;
SELECT 
  a.id as assignment_id,
  a.status,
  a.volunteer_id,
  a.created_at,
  ar.id as request_id,
  ar.user_id as pilgrim_id,
  ar.title,
  pv.name as volunteer_name,
  pp.name as pilgrim_name
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
LEFT JOIN profiles pp ON ar.user_id = pp.id
ORDER BY a.created_at DESC
LIMIT 10;

-- 2. Check user locations data
SELECT 'LOCATION DATA CHECK' as check_type;
SELECT 
  ul.id,
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

-- 3. Check profiles and roles
SELECT 'PROFILES CHECK' as check_type;
SELECT 
  id,
  name,
  role,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- 4. Test the pilgrim location function with a specific volunteer ID
-- Replace 'YOUR_VOLUNTEER_ID' with an actual volunteer ID from the profiles table
SELECT 'FUNCTION TEST - PILGRIM LOCATIONS' as check_type;
-- SELECT * FROM get_pilgrim_locations_for_volunteer('YOUR_VOLUNTEER_ID');

-- 5. Test the volunteer location function with a specific pilgrim ID  
-- Replace 'YOUR_PILGRIM_ID' with an actual pilgrim ID from the profiles table
SELECT 'FUNCTION TEST - VOLUNTEER LOCATIONS' as check_type;
-- SELECT * FROM get_volunteer_locations_for_pilgrim('YOUR_PILGRIM_ID');

-- 6. Check if functions exist
SELECT 'FUNCTIONS CHECK' as check_type;
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name IN (
  'get_pilgrim_locations_for_volunteer',
  'get_volunteer_locations_for_pilgrim',
  'get_assigned_users_without_location'
)
AND routine_schema = 'public';
