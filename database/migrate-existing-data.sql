-- Migrate existing data to secure location tracking system
-- Based on your actual database structure

-- Step 1: Copy all profiles to secure users table
INSERT INTO users (id, name, phone, role, is_active, created_at, updated_at)
SELECT 
  id, 
  name, 
  phone, 
  role, 
  COALESCE(is_active, true),
  created_at,
  updated_at
FROM profiles
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = EXCLUDED.updated_at;

-- Step 2: First, let's check what columns exist in assignments table
-- Update existing assignments to add pilgrim_id where missing
UPDATE assignments 
SET pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44' -- Dhruval Bhinsara (pilgrim)
WHERE volunteer_id = 'a81c0e62-4bec-4552-bca3-b158c6afa790' -- Dr. Raj Patel
  AND pilgrim_id IS NULL;

UPDATE assignments 
SET pilgrim_id = 'c9bb6562-d3f2-4cfa-9dbd-6b2003f1e5f3' -- Mohan Lal (pilgrim)  
WHERE volunteer_id = '94a30dff-3caa-4d15-8537-0f8b58ef640a' -- Priya Sharma
  AND pilgrim_id IS NULL;

UPDATE assignments 
SET pilgrim_id = '91fb4194-d5d8-4eac-8dc7-cc479b7fef17' -- Ramesh Gupta (pilgrim)
WHERE volunteer_id = 'b4872fa6-d200-45f8-a127-92d3e922602f' -- Sneha V Joshi  
  AND pilgrim_id IS NULL;

-- Step 3: Create new assignment if none exist with pilgrim_id
INSERT INTO assignments (pilgrim_id, volunteer_id, is_active, assigned_at)
SELECT 
  '5595c83a-55ef-426e-a10e-28ff9b70ce44', -- Dhruval Bhinsara (pilgrim)
  'a81c0e62-4bec-4552-bca3-b158c6afa790', -- Dr. Raj Patel (volunteer)
  true,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM assignments 
  WHERE pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44' 
    AND volunteer_id = 'a81c0e62-4bec-4552-bca3-b158c6afa790'
    AND is_active = true
);

-- Step 4: Clear old locations and add fresh sample locations for all assigned users
DELETE FROM locations WHERE user_id IN (
  SELECT DISTINCT pilgrim_id FROM assignments WHERE is_active = true AND pilgrim_id IS NOT NULL
  UNION
  SELECT DISTINCT volunteer_id FROM assignments WHERE is_active = true AND volunteer_id IS NOT NULL
);

-- Step 4b: Add sample locations for all assigned users
WITH assigned_users AS (
  SELECT DISTINCT pilgrim_id as user_id, 'pilgrim' as role FROM assignments WHERE is_active = true AND pilgrim_id IS NOT NULL
  UNION
  SELECT DISTINCT volunteer_id as user_id, 'volunteer' as role FROM assignments WHERE is_active = true AND volunteer_id IS NOT NULL
)
INSERT INTO locations (user_id, latitude, longitude, accuracy, speed, bearing, last_updated)
SELECT 
  user_id,
  -- Different locations for pilgrims vs volunteers
  CASE 
    WHEN role = 'pilgrim' THEN 37.7749 + (RANDOM() * 0.005) -- Pilgrims closer together
    ELSE 37.7849 + (RANDOM() * 0.005) -- Volunteers slightly north
  END as latitude,
  CASE 
    WHEN role = 'pilgrim' THEN -122.4194 + (RANDOM() * 0.005)
    ELSE -122.4094 + (RANDOM() * 0.005)
  END as longitude,
  5.0 + (RANDOM() * 15), -- Accuracy 5-20m
  RANDOM() * 3, -- Speed 0-3 m/s
  RANDOM() * 360, -- Random bearing
  NOW() - (RANDOM() * INTERVAL '5 minutes') -- Recent locations within 5 minutes
FROM assigned_users
ON CONFLICT (user_id) DO UPDATE SET
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  accuracy = EXCLUDED.accuracy,
  speed = EXCLUDED.speed,
  bearing = EXCLUDED.bearing,
  last_updated = EXCLUDED.last_updated;

-- Verification queries
SELECT 'Migrated Users:' as info;
SELECT COUNT(*) as total_users, role, COUNT(*) as count_by_role
FROM users 
GROUP BY role
ORDER BY role;

SELECT 'Active Assignments:' as info;
SELECT 
  a.id,
  p.name as pilgrim_name,
  v.name as volunteer_name,
  a.assigned_at
FROM assignments a
JOIN users p ON a.pilgrim_id = p.id
JOIN users v ON a.volunteer_id = v.id
WHERE a.is_active = true
ORDER BY a.assigned_at DESC;

SELECT 'Location Data:' as info;
SELECT 
  u.name,
  u.role,
  l.latitude,
  l.longitude,
  l.last_updated
FROM locations l
JOIN users u ON l.user_id = u.id
ORDER BY u.role, u.name;
