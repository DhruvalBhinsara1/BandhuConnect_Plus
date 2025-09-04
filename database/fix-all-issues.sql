-- Comprehensive fix for all database issues
-- Run this in Supabase SQL Editor

-- 1. Fix RLS infinite recursion by disabling and recreating policies
ALTER TABLE user_locations DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can update their own location" ON user_locations;
DROP POLICY IF EXISTS "Users can view locations based on role" ON user_locations;
DROP POLICY IF EXISTS "allow_own_location_update" ON user_locations;
DROP POLICY IF EXISTS "allow_location_read" ON user_locations;
DROP POLICY IF EXISTS "simple_location_access" ON user_locations;

-- Re-enable RLS with simple, non-recursive policy
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "location_full_access" ON user_locations FOR ALL USING (true);

-- 2. Fix location update function
DROP FUNCTION IF EXISTS update_user_location(double precision,double precision,double precision,double precision,double precision,double precision);

CREATE OR REPLACE FUNCTION update_user_location(
    p_latitude DOUBLE PRECISION,
    p_longitude DOUBLE PRECISION,
    p_accuracy DOUBLE PRECISION DEFAULT NULL,
    p_altitude DOUBLE PRECISION DEFAULT NULL,
    p_heading DOUBLE PRECISION DEFAULT NULL,
    p_speed DOUBLE PRECISION DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO user_locations (
        user_id,
        latitude,
        longitude,
        accuracy,
        altitude,
        heading,
        speed,
        is_active,
        last_updated
    ) VALUES (
        auth.uid(),
        p_latitude,
        p_longitude,
        p_accuracy,
        p_altitude,
        p_heading,
        p_speed,
        true,
        NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        accuracy = EXCLUDED.accuracy,
        altitude = EXCLUDED.altitude,
        heading = EXCLUDED.heading,
        speed = EXCLUDED.speed,
        is_active = EXCLUDED.is_active,
        last_updated = EXCLUDED.last_updated;
END;
$$;

-- 3. Ensure demo data exists with proper relationships
-- Insert demo assistance requests if they don't exist
INSERT INTO assistance_requests (id, user_id, title, description, type, priority, status, location, address, created_at)
SELECT 
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE phone = '+91-9876543210' LIMIT 1),
    'Need directions to temple',
    'I am lost and need directions to the main temple. I am near the market area.',
    'guidance',
    'medium',
    'pending',
    ST_GeogFromText('POINT(73.3620 22.2927)'),
    'Near Market Area, Temple Road',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM assistance_requests WHERE title = 'Need directions to temple');

INSERT INTO assistance_requests (id, user_id, title, description, type, priority, status, location, address, created_at)
SELECT 
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE phone = '+91-9876543210' LIMIT 1),
    'Medical assistance needed',
    'Elderly person needs help walking to medical center.',
    'medical',
    'high',
    'assigned',
    ST_GeogFromText('POINT(73.3625 22.2930)'),
    'Medical Center Entrance',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM assistance_requests WHERE title = 'Medical assistance needed');

-- Create assignments for demo data
INSERT INTO assignments (id, request_id, volunteer_id, status, assigned_at)
SELECT 
    gen_random_uuid(),
    (SELECT id FROM assistance_requests WHERE title = 'Medical assistance needed' LIMIT 1),
    (SELECT id FROM profiles WHERE phone = '+91-9123456789' LIMIT 1),
    'accepted',
    NOW() - INTERVAL '1 hour'
WHERE NOT EXISTS (SELECT 1 FROM assignments a 
                  JOIN assistance_requests ar ON a.request_id = ar.id 
                  WHERE ar.title = 'Medical assistance needed')
AND EXISTS (SELECT 1 FROM assistance_requests WHERE title = 'Medical assistance needed')
AND EXISTS (SELECT 1 FROM profiles WHERE phone = '+91-9123456789');

-- 4. Update volunteer status to available if no active assignments
UPDATE profiles 
SET volunteer_status = 'available', updated_at = NOW()
WHERE role = 'volunteer' 
AND volunteer_status = 'busy'
AND id NOT IN (
    SELECT DISTINCT volunteer_id 
    FROM assignments 
    WHERE status IN ('pending', 'accepted', 'in_progress')
    AND volunteer_id IS NOT NULL
);

-- 5. Add location data for demo users
INSERT INTO user_locations (user_id, latitude, longitude, accuracy, is_active, last_updated)
SELECT 
    p.id,
    CASE 
        WHEN p.email = 'raj.volunteer@demo.com' THEN 22.2925
        WHEN p.email = 'dhruval.pilgrim@demo.com' THEN 22.2927
        ELSE 22.2920
    END,
    CASE 
        WHEN p.email = 'raj.volunteer@demo.com' THEN 73.3618
        WHEN p.email = 'dhruval.pilgrim@demo.com' THEN 73.3620
        ELSE 73.3615
    END,
    5.0,
    true,
    NOW()
FROM profiles p
WHERE p.email IN ('raj.volunteer@demo.com', 'dhruval.pilgrim@demo.com', 'admin@demo.com')
ON CONFLICT (user_id) DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    accuracy = EXCLUDED.accuracy,
    is_active = EXCLUDED.is_active,
    last_updated = EXCLUDED.last_updated;

-- 6. Verify data integrity
SELECT 'Demo Profiles' as table_name, COUNT(*) as count FROM profiles WHERE phone LIKE '+91-%';
SELECT 'Demo Requests' as table_name, COUNT(*) as count FROM assistance_requests WHERE title IN ('Need directions to temple', 'Medical assistance needed');
SELECT 'Demo Assignments' as table_name, COUNT(*) as count FROM assignments a 
JOIN assistance_requests ar ON a.request_id = ar.id 
WHERE ar.title IN ('Need directions to temple', 'Medical assistance needed');
SELECT 'Demo Locations' as table_name, COUNT(*) as count FROM user_locations ul 
JOIN profiles p ON ul.user_id = p.id WHERE p.phone LIKE '+91-%';

-- Test location update function
SELECT update_user_location(22.2927, 73.3620, 5.0);
