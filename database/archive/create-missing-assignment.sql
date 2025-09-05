-- Create Missing Assignment Between Pilgrim and Volunteer
-- This script creates the assignment relationship that enables bi-directional location visibility

-- First, check current table relationships and user data
SELECT 'User IDs in users table:' as section;
SELECT id, name, role FROM users 
WHERE id IN ('5595c83a-55ef-426e-a10e-28ff9b70ce44', 'a81c0e62-4bec-4552-bca3-b158c6afa790');

SELECT 'User IDs in profiles table:' as section;
SELECT id, name, role FROM profiles 
WHERE id IN ('5595c83a-55ef-426e-a10e-28ff9b70ce44', 'a81c0e62-4bec-4552-bca3-b158c6afa790');

-- Check existing assistance requests from Dhruval (pilgrim)
SELECT 'Existing Assistance Requests from Dhruval:' as section;
SELECT 
    id,
    user_id,
    title,
    description,
    status,
    created_at
FROM assistance_requests 
WHERE user_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
ORDER BY created_at DESC;

-- Create assistance request if none exists (user_id references profiles.id)
INSERT INTO assistance_requests (
    id,
    user_id,
    type,
    title,
    description,
    location,
    status,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    '5595c83a-55ef-426e-a10e-28ff9b70ce44', -- References profiles.id
    'general'::request_type,
    'Location Tracking Request',
    'Request for volunteer assistance with location tracking',
    ST_GeogFromText('POINT(72.5714 23.0225)'), -- Default location (Ahmedabad) as geography
    'pending'::request_status,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM assistance_requests 
    WHERE user_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
);

-- Get the assistance request ID (either existing or newly created)
WITH request_data AS (
    SELECT id as request_id
    FROM assistance_requests 
    WHERE user_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
    ORDER BY created_at DESC
    LIMIT 1
)
-- Create the assignment linking pilgrim to volunteer
-- Note: pilgrim_id references users.id, volunteer_id references profiles.id
INSERT INTO assignments (
    id,
    request_id,
    volunteer_id,
    pilgrim_id,
    status,
    assigned,
    created_at,
    assigned_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    r.request_id,
    'a81c0e62-4bec-4552-bca3-b158c6afa790', -- Dr. Raj Patel (volunteer) - references profiles.id
    '5595c83a-55ef-426e-a10e-28ff9b70ce44', -- Dhruval Bhinsara (pilgrim) - references users.id
    'accepted'::assignment_status,
    true,
    NOW(),
    NOW(),
    NOW()
FROM request_data r
WHERE NOT EXISTS (
    SELECT 1 FROM assignments 
    WHERE volunteer_id = 'a81c0e62-4bec-4552-bca3-b158c6afa790'
    AND pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
);

-- Verify the assignment was created
SELECT 'Created Assignment:' as section;
SELECT 
    a.id as assignment_id,
    a.request_id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    a.assigned,
    a.created_at,
    a.assigned_at,
    pv.name as volunteer_name,
    pp.name as pilgrim_name
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
LEFT JOIN profiles pp ON a.pilgrim_id = pp.id
WHERE a.volunteer_id = 'a81c0e62-4bec-4552-bca3-b158c6afa790'
AND a.pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44';

-- Test the get_my_assignment function for both users
SELECT 'Testing get_my_assignment for Pilgrim (Dhruval):' as section;
-- This should be run while authenticated as Dhruval
-- SELECT * FROM get_my_assignment();

SELECT 'Testing get_my_assignment for Volunteer (Dr. Raj):' as section;
-- This should be run while authenticated as Dr. Raj
-- SELECT * FROM get_my_assignment();

-- Show current user locations for both users
SELECT 'Current User Locations:' as section;
SELECT 
    ul.user_id,
    p.name,
    p.role,
    ul.latitude,
    ul.longitude,
    ul.last_updated,
    EXTRACT(EPOCH FROM (NOW() - ul.last_updated))/60 as minutes_ago
FROM user_locations ul
JOIN profiles p ON ul.user_id = p.id
WHERE ul.user_id IN (
    '5595c83a-55ef-426e-a10e-28ff9b70ce44', -- Dhruval (pilgrim)
    'a81c0e62-4bec-4552-bca3-b158c6afa790'  -- Dr. Raj (volunteer)
)
ORDER BY ul.last_updated DESC;
