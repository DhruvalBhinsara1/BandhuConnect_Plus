-- Check Specific Assignment Data for Dhruval Bhinsara (Pilgrim)
-- User ID: 5595c83a-55ef-426e-a10e-28ff9b70ce44

-- 1. Check all assistance requests for this pilgrim
SELECT 'Assistance Requests for Dhruval (Pilgrim):' as section;
SELECT 
    ar.id as request_id,
    ar.user_id,
    ar.description,
    ar.status as request_status,
    ar.created_at,
    p.name as requester_name,
    p.role as requester_role
FROM assistance_requests ar
JOIN profiles p ON ar.user_id = p.id
WHERE ar.user_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
ORDER BY ar.created_at DESC;

-- 2. Check all assignments linked to these requests
SELECT 'Assignments for Dhruval''s Requests:' as section;
SELECT 
    a.id as assignment_id,
    a.request_id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status as assignment_status,
    a.assigned,
    a.created_at,
    a.assigned_at,
    pv.name as volunteer_name,
    pv.role as volunteer_role
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
WHERE ar.user_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
ORDER BY a.created_at DESC;

-- 3. Check assignments where Dhruval might be the volunteer (just in case)
SELECT 'Assignments where Dhruval is Volunteer:' as section;
SELECT 
    a.id as assignment_id,
    a.request_id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status as assignment_status,
    a.assigned,
    a.created_at,
    ar.user_id as request_user_id,
    p.name as requester_name
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
LEFT JOIN profiles p ON ar.user_id = p.id
WHERE a.volunteer_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
ORDER BY a.created_at DESC;

-- 4. Check what the get_my_assignment function should return for pilgrim
SELECT 'Expected Assignment Data for Pilgrim Logic:' as section;
SELECT 
    a.id as assignment_id,
    a.volunteer_id as counterpart_id,
    pv.name as counterpart_name,
    pv.role as counterpart_role,
    CASE WHEN a.status IN ('pending', 'accepted', 'in_progress') THEN true ELSE false END as is_active,
    a.assigned
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
JOIN profiles pv ON a.volunteer_id = pv.id
WHERE ar.user_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
AND a.status IN ('pending', 'accepted', 'in_progress')
AND a.assigned = true
ORDER BY a.assigned_at DESC
LIMIT 1;

-- 5. Check what the get_my_assignment function should return for volunteer
SELECT 'Expected Assignment Data for Volunteer Logic:' as section;
SELECT 
    a.id as assignment_id,
    ar.user_id as counterpart_id,
    pp.name as counterpart_name,
    pp.role as counterpart_role,
    CASE WHEN a.status IN ('pending', 'accepted', 'in_progress') THEN true ELSE false END as is_active,
    a.assigned
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
JOIN profiles pp ON ar.user_id = pp.id
WHERE a.volunteer_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
AND a.status IN ('pending', 'accepted', 'in_progress')
AND a.assigned = true
ORDER BY a.assigned_at DESC
LIMIT 1;
