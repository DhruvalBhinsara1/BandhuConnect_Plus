-- Check Existing Assignment and Test get_my_assignment Function
-- Since assignment already exists, let's verify it and test the functions

-- Find the existing assignment for Dhruval (pilgrim)
SELECT 'Existing Assignment for Dhruval:' as section;
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
    pv.role as volunteer_role,
    pu.name as pilgrim_name,
    pu.role as pilgrim_role
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
LEFT JOIN users pu ON a.pilgrim_id = pu.id
WHERE a.pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
ORDER BY a.created_at DESC;

-- Check the linked assistance request
SELECT 'Linked Assistance Request:' as section;
SELECT 
    ar.id,
    ar.user_id,
    ar.title,
    ar.status,
    ar.created_at,
    p.name as requester_name
FROM assistance_requests ar
JOIN profiles p ON ar.user_id = p.id
JOIN assignments a ON a.request_id = ar.id
WHERE a.pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44';

-- Test get_my_assignment logic for PILGRIM (Dhruval)
SELECT 'Pilgrim get_my_assignment Result:' as section;
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

-- Test get_my_assignment logic for VOLUNTEER (Dr. Raj)
SELECT 'Volunteer get_my_assignment Result:' as section;
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

-- Show current user locations to confirm both users are active
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
