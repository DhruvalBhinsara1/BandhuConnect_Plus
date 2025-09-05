-- Verify Assignment Creation and Test get_my_assignment Function
-- This script checks if the assignment was created and tests the database functions

-- Check if assignment was created successfully
SELECT 'Created Assignment Verification:' as section;
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
WHERE a.volunteer_id = 'a81c0e62-4bec-4552-bca3-b158c6afa790'
AND a.pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
ORDER BY a.created_at DESC;

-- Check assistance request that should be linked
SELECT 'Linked Assistance Request:' as section;
SELECT 
    ar.id,
    ar.user_id,
    ar.title,
    ar.status,
    ar.created_at,
    p.name as requester_name,
    p.role as requester_role
FROM assistance_requests ar
JOIN profiles p ON ar.user_id = p.id
WHERE ar.user_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
ORDER BY ar.created_at DESC;

-- Test what get_my_assignment would return for pilgrim logic
SELECT 'Expected get_my_assignment Result for Pilgrim:' as section;
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

-- Test what get_my_assignment would return for volunteer logic
SELECT 'Expected get_my_assignment Result for Volunteer:' as section;
SELECT 
    a.id as assignment_id,
    pp.id as counterpart_id,
    pp.name as counterpart_name,
    'pilgrim' as counterpart_role,
    CASE WHEN a.status IN ('pending', 'accepted', 'in_progress') THEN true ELSE false END as is_active,
    a.assigned
FROM assignments a
JOIN profiles pp ON a.pilgrim_id = pp.id
WHERE a.volunteer_id = 'a81c0e62-4bec-4552-bca3-b158c6afa790'
AND a.status IN ('pending', 'accepted', 'in_progress')
AND a.assigned = true;
