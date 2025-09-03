-- Fix location coordinates - replace old India coordinates with San Francisco coordinates

-- Clear old locations for assigned users
DELETE FROM locations WHERE user_id IN (
  SELECT DISTINCT pilgrim_id FROM assignments WHERE is_active = true AND pilgrim_id IS NOT NULL
  UNION
  SELECT DISTINCT volunteer_id FROM assignments WHERE is_active = true AND volunteer_id IS NOT NULL
);

-- Add fresh San Francisco locations for testing
INSERT INTO locations (user_id, latitude, longitude, accuracy, speed, bearing, last_updated)
VALUES 
  -- Dhruval Bhinsara (pilgrim) - Mission District
  ('5595c83a-55ef-426e-a10e-28ff9b70ce44', 37.7749, -122.4194, 8.5, 0.0, 0.0, NOW() - INTERVAL '30 seconds'),
  -- Dr. Raj Patel (volunteer) - Union Square  
  ('a81c0e62-4bec-4552-bca3-b158c6afa790', 37.7879, -122.4075, 12.3, 0.0, 0.0, NOW() - INTERVAL '45 seconds'),
  -- Sunita Guide (volunteer) - Fisherman's Wharf
  ('5f121537-9b20-4029-8bdc-c054678f9a2f', 37.8080, -122.4177, 15.2, 0.0, 0.0, NOW() - INTERVAL '60 seconds'),
  -- Mohan Lal (pilgrim) - Castro District
  ('c9bb6562-d3f2-4cfa-9dbd-6b2003f1e5f3', 37.7609, -122.4350, 10.1, 0.0, 0.0, NOW() - INTERVAL '90 seconds'),
  -- Priya Sharma (volunteer) - Chinatown
  ('94a30dff-3caa-4d15-8537-0f8b58ef640a', 37.7941, -122.4078, 7.8, 0.0, 0.0, NOW() - INTERVAL '2 minutes'),
  -- Ramesh Gupta (pilgrim) - SOMA
  ('91fb4194-d5d8-4eac-8dc7-cc479b7fef17', 37.7849, -122.4094, 9.2, 0.0, 0.0, NOW() - INTERVAL '3 minutes'),
  -- Sneha V Joshi (volunteer) - Financial District
  ('b4872fa6-d200-45f8-a127-92d3e922602f', 37.7946, -122.3999, 11.5, 0.0, 0.0, NOW() - INTERVAL '4 minutes');

-- Verification: Check updated locations
SELECT 
  u.name,
  u.role,
  l.latitude,
  l.longitude,
  l.last_updated,
  EXTRACT(EPOCH FROM (NOW() - l.last_updated))/60 as minutes_ago
FROM locations l
JOIN users u ON l.user_id = u.id
WHERE u.id IN (
  SELECT DISTINCT pilgrim_id FROM assignments WHERE is_active = true AND pilgrim_id IS NOT NULL
  UNION
  SELECT DISTINCT volunteer_id FROM assignments WHERE is_active = true AND volunteer_id IS NOT NULL
)
ORDER BY u.role, u.name;
