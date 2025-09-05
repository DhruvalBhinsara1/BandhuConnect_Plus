-- Diagnose and Fix Assignment Creation Issues
-- This script identifies the foreign key problems and creates the assignment correctly

-- 1. Check if users exist in both tables
SELECT 'Dhruval in users table:' as section;
SELECT id, name, role FROM users WHERE id = '5595c83a-55ef-426e-a10e-28ff9b70ce44';

SELECT 'Dhruval in profiles table:' as section;
SELECT id, name, role FROM profiles WHERE id = '5595c83a-55ef-426e-a10e-28ff9b70ce44';

SELECT 'Dr. Raj in users table:' as section;
SELECT id, name, role FROM users WHERE id = 'a81c0e62-4bec-4552-bca3-b158c6afa790';

SELECT 'Dr. Raj in profiles table:' as section;
SELECT id, name, role FROM profiles WHERE id = 'a81c0e62-4bec-4552-bca3-b158c6afa790';

-- 2. Check if assistance request was created
SELECT 'Assistance Request Status:' as section;
SELECT id, user_id, title, status, created_at 
FROM assistance_requests 
WHERE user_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44';

-- 3. Check existing assignments
SELECT 'Current Assignments:' as section;
SELECT id, request_id, volunteer_id, pilgrim_id, status, assigned, created_at
FROM assignments 
WHERE volunteer_id = 'a81c0e62-4bec-4552-bca3-b158c6afa790' 
   OR pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44';

-- 4. Create user in users table if missing (for pilgrim_id foreign key)
INSERT INTO users (id, name, role, created_at, updated_at)
SELECT 
    '5595c83a-55ef-426e-a10e-28ff9b70ce44',
    'Dhruval Bhinsara',
    'pilgrim'::user_role,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
);

-- 5. Create assistance request if missing
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
    '5595c83a-55ef-426e-a10e-28ff9b70ce44',
    'general'::request_type,
    'Location Tracking Request',
    'Request for volunteer assistance with location tracking',
    ST_GeogFromText('POINT(72.5714 23.0225)'),
    'pending'::request_status,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM assistance_requests 
    WHERE user_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
);

-- 6. Create the assignment with correct foreign keys
WITH request_data AS (
    SELECT id as request_id
    FROM assistance_requests 
    WHERE user_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
    ORDER BY created_at DESC
    LIMIT 1
)
INSERT INTO assignments (
    id,
    request_id,
    volunteer_id,  -- References profiles.id
    pilgrim_id,    -- References users.id
    status,
    assigned,
    created_at,
    assigned_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    r.request_id,
    'a81c0e62-4bec-4552-bca3-b158c6afa790', -- Dr. Raj (must exist in profiles)
    '5595c83a-55ef-426e-a10e-28ff9b70ce44', -- Dhruval (must exist in users)
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

-- 7. Verify final result
SELECT 'Final Assignment Verification:' as section;
SELECT 
    a.id as assignment_id,
    a.request_id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    a.assigned,
    pv.name as volunteer_name,
    pu.name as pilgrim_name
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
LEFT JOIN users pu ON a.pilgrim_id = pu.id
WHERE a.volunteer_id = 'a81c0e62-4bec-4552-bca3-b158c6afa790'
AND a.pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44';

-- 8. Test get_my_assignment logic for both users
SELECT 'Pilgrim Assignment Query Result:' as section;
SELECT 
    a.id as assignment_id,
    pv.id as counterpart_id,
    pv.name as counterpart_name,
    pv.role as counterpart_role,
    CASE WHEN a.status IN ('pending', 'accepted', 'in_progress') THEN true ELSE false END as is_active,
    a.assigned
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
JOIN profiles pv ON a.volunteer_id = pv.id
WHERE ar.user_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
AND a.status IN ('pending', 'accepted', 'in_progress')
AND a.assigned = true;

SELECT 'Volunteer Assignment Query Result:' as section;
SELECT 
    a.id as assignment_id,
    pu.id as counterpart_id,
    pu.name as counterpart_name,
    'pilgrim' as counterpart_role,
    CASE WHEN a.status IN ('pending', 'accepted', 'in_progress') THEN true ELSE false END as is_active,
    a.assigned
FROM assignments a
JOIN users pu ON a.pilgrim_id = pu.id
WHERE a.volunteer_id = 'a81c0e62-4bec-4552-bca3-b158c6afa790'
AND a.status IN ('pending', 'accepted', 'in_progress')
AND a.assigned = true;
