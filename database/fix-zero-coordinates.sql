-- Fix the (0,0) coordinate issue for Dhruval Bhinsara
-- The pilgrim location is showing as (0,0) instead of Parul University coordinates

-- Update the existing location record for Dhruval Bhinsara with correct Parul University coordinates
UPDATE locations 
SET 
  latitude = 22.3039,
  longitude = 73.1812,
  accuracy = 8.5,
  speed = 0.0,
  bearing = 0.0,
  last_updated = NOW() - INTERVAL '1 minute'
WHERE user_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44';

-- Verify the fix
SELECT 
  u.name,
  u.role,
  l.latitude,
  l.longitude,
  l.last_updated,
  EXTRACT(EPOCH FROM (NOW() - l.last_updated))/60 as minutes_ago
FROM locations l
JOIN users u ON l.user_id = u.id
WHERE u.id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
ORDER BY l.last_updated DESC;
