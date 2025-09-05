-- Test get_my_assignment Function with Live User Authentication
-- This script tests the function as it would be called from the app

-- First, let's see what auth.uid() would return (this won't work in SQL editor but shows the concept)
-- SELECT auth.uid() as current_auth_uid;

-- Test the function directly (this will use the SQL editor's auth context)
SELECT 'Testing get_my_assignment() function:' as section;
SELECT * FROM get_my_assignment();

-- Check what user profile exists for Dhruval
SELECT 'Dhruval Profile Check:' as section;
SELECT id, name, role, email FROM profiles 
WHERE id = '5595c83a-55ef-426e-a10e-28ff9b70ce44';

-- Check if there's an assignment for Dhruval as pilgrim (assistance request path)
SELECT 'Assignment via Assistance Request (Pilgrim Logic):' as section;
SELECT 
    a.id as assignment_id,
    a.request_id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    a.assigned,
    ar.user_id as request_user_id,
    pv.name as volunteer_name,
    pv.role as volunteer_role
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
JOIN profiles pv ON a.volunteer_id = pv.id
WHERE ar.user_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
AND a.status IN ('pending', 'accepted', 'in_progress')
AND a.assigned = true;

-- Check if there's an assignment for Dhruval as volunteer (direct assignment path)
SELECT 'Assignment as Volunteer (Volunteer Logic):' as section;
SELECT 
    a.id as assignment_id,
    a.request_id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    a.assigned,
    pu.name as pilgrim_name
FROM assignments a
JOIN users pu ON a.pilgrim_id = pu.id
WHERE a.volunteer_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
AND a.status IN ('pending', 'accepted', 'in_progress')
AND a.assigned = true;

-- Check all assignments involving Dhruval
SELECT 'All Assignments Involving Dhruval:' as section;
SELECT 
    a.id,
    a.request_id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    a.assigned,
    a.created_at,
    CASE 
        WHEN a.volunteer_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44' THEN 'Dhruval is Volunteer'
        WHEN a.pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44' THEN 'Dhruval is Pilgrim'
        ELSE 'Other'
    END as dhruval_role_in_assignment
FROM assignments a
WHERE a.volunteer_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
   OR a.pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
ORDER BY a.created_at DESC;

-- Check assistance requests for Dhruval
SELECT 'Assistance Requests by Dhruval:' as section;
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
