-- Create test data for debugging bi-directional visibility
-- Run this in Supabase SQL Editor

-- First, let's create test users if they don't exist
INSERT INTO profiles (id, name, email, role, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Test Pilgrim', 'test.pilgrim@example.com', 'pilgrim', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Test Volunteer', 'test.volunteer@example.com', 'volunteer', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Create a test assistance request
INSERT INTO assistance_requests (id, user_id, title, description, request_type, status, created_at, updated_at)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111', -- pilgrim
  'Need help finding temple',
  'Lost and need directions to main temple',
  'navigation',
  'open',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Create an assignment
INSERT INTO assignments (id, request_id, volunteer_id, status, created_at, updated_at)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  '33333333-3333-3333-3333-333333333333', -- request
  '22222222-2222-2222-2222-222222222222', -- volunteer
  'accepted',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = NOW();

-- Create location data for both users
INSERT INTO user_locations (id, user_id, latitude, longitude, accuracy, last_updated, is_active)
VALUES 
  (
    '55555555-5555-5555-5555-555555555555',
    '11111111-1111-1111-1111-111111111111', -- pilgrim
    23.0225, -- Ahmedabad coordinates (example)
    72.5714,
    10.0,
    NOW() - INTERVAL '5 minutes', -- 5 minutes ago
    true
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    '22222222-2222-2222-2222-222222222222', -- volunteer
    23.0245, -- Slightly different coordinates (nearby)
    72.5734,
    15.0,
    NOW() - INTERVAL '2 minutes', -- 2 minutes ago
    true
  )
ON CONFLICT (id) DO UPDATE SET
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  accuracy = EXCLUDED.accuracy,
  last_updated = EXCLUDED.last_updated,
  is_active = EXCLUDED.is_active;

-- Test the functions with our test data
SELECT 'Testing pilgrim locations for volunteer:' as test;
SELECT * FROM get_pilgrim_locations_for_volunteer('22222222-2222-2222-2222-222222222222');

SELECT 'Testing volunteer locations for pilgrim:' as test;
SELECT * FROM get_volunteer_locations_for_pilgrim('11111111-1111-1111-1111-111111111111');

-- Show the created data
SELECT 'Created assignments:' as info;
SELECT 
  a.id as assignment_id,
  a.status,
  ar.title,
  pp.name as pilgrim_name,
  pv.name as volunteer_name
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
JOIN profiles pp ON ar.user_id = pp.id
JOIN profiles pv ON a.volunteer_id = pv.id
WHERE a.id = '44444444-4444-4444-4444-444444444444';

SELECT 'Created locations:' as info;
SELECT 
  ul.user_id,
  p.name,
  p.role,
  ul.latitude,
  ul.longitude,
  ul.last_updated
FROM user_locations ul
JOIN profiles p ON ul.user_id = p.id
WHERE ul.user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
