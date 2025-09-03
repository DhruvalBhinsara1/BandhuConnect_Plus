-- Check location data for existing assigned users
-- Run this in Supabase SQL Editor

-- 1. Get user IDs from existing assignments
SELECT 'Users in assignments:' as info
UNION ALL
SELECT DISTINCT 
  CONCAT(pp.name, ' (pilgrim) -> ', pv.name, ' (volunteer)') as assignment_pair
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
JOIN profiles pp ON ar.user_id = pp.id
JOIN profiles pv ON a.volunteer_id = pv.id
WHERE a.status IN ('accepted', 'in_progress');

-- 2. Check which of these users have location data
SELECT 'Location data for assigned users:' as info
UNION ALL
SELECT 
  CONCAT(p.name, ' (', p.role, ') - ', 
    CASE 
      WHEN ul.id IS NULL THEN 'NO LOCATION DATA'
      ELSE CONCAT('HAS LOCATION: ', ul.latitude::text, ', ', ul.longitude::text)
    END
  ) as user_location_status
FROM profiles p
LEFT JOIN user_locations ul ON p.id = ul.user_id
WHERE p.id IN (
  SELECT ar.user_id FROM assignments a
  JOIN assistance_requests ar ON a.request_id = ar.id
  WHERE a.status IN ('accepted', 'in_progress')
  UNION
  SELECT a.volunteer_id FROM assignments a
  WHERE a.status IN ('accepted', 'in_progress')
)
ORDER BY user_location_status;

-- 3. Get actual user IDs for testing
SELECT 'Real User IDs for testing:' as info
UNION ALL
SELECT CONCAT('Pilgrim ID: ', ar.user_id::text, ' (', pp.name, ')')
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
JOIN profiles pp ON ar.user_id = pp.id
WHERE a.status IN ('accepted', 'in_progress')
LIMIT 1
UNION ALL
SELECT CONCAT('Volunteer ID: ', a.volunteer_id::text, ' (', pv.name, ')')
FROM assignments a
JOIN profiles pv ON a.volunteer_id = pv.id
WHERE a.status IN ('accepted', 'in_progress')
LIMIT 1;
