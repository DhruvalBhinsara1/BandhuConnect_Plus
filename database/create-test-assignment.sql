-- Create Test Assignment for Secure Location Tracking
-- This script uses your existing auth users to create assignments

-- Step 1: Copy existing profiles to users table (if they don't exist)
INSERT INTO users (id, name, phone, role, is_active)
SELECT p.id, p.name, p.phone, p.role, COALESCE(p.is_active, true)
FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p.id);

-- Step 2: Create assignment using first available pilgrim and volunteer
WITH available_users AS (
  SELECT 
    (SELECT id FROM users WHERE role = 'pilgrim' LIMIT 1) as pilgrim_id,
    (SELECT id FROM users WHERE role = 'volunteer' LIMIT 1) as volunteer_id
)
INSERT INTO assignments (pilgrim_id, volunteer_id, is_active, assigned_at)
SELECT pilgrim_id, volunteer_id, true, NOW()
FROM available_users
WHERE pilgrim_id IS NOT NULL AND volunteer_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Step 3: Add sample locations for assigned users
WITH assigned_users AS (
  SELECT DISTINCT pilgrim_id as user_id FROM assignments WHERE is_active = true
  UNION
  SELECT DISTINCT volunteer_id as user_id FROM assignments WHERE is_active = true
)
INSERT INTO locations (user_id, latitude, longitude, accuracy, speed, bearing, last_updated)
SELECT 
  user_id,
  37.7749 + (RANDOM() * 0.01), -- Random location near San Francisco
  -122.4194 + (RANDOM() * 0.01),
  10.0 + (RANDOM() * 20), -- Random accuracy 10-30m
  RANDOM() * 5, -- Random speed 0-5 m/s
  RANDOM() * 360, -- Random bearing
  NOW()
FROM assigned_users
ON CONFLICT (user_id) DO UPDATE SET
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  accuracy = EXCLUDED.accuracy,
  speed = EXCLUDED.speed,
  bearing = EXCLUDED.bearing,
  last_updated = EXCLUDED.last_updated;

-- Verify the test data
SELECT 'Test Users:' as info;
SELECT id, name, role, is_active FROM users WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);

SELECT 'Test Assignment:' as info;
SELECT a.id, u1.name as pilgrim_name, u2.name as volunteer_name, a.is_active
FROM assignments a
JOIN users u1 ON a.pilgrim_id = u1.id
JOIN users u2 ON a.volunteer_id = u2.id
WHERE a.id = '33333333-3333-3333-3333-333333333333';

SELECT 'Test Locations:' as info;
SELECT l.user_id, u.name, l.latitude, l.longitude, l.last_updated
FROM locations l
JOIN users u ON l.user_id = u.id
WHERE l.user_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);
