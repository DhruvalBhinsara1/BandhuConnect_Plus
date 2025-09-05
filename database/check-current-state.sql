-- Check Current Assignment State
-- See what happened to the assignments after the fix

-- 1. Check all assignments for both users
SELECT 'All assignments in system:' as info;
SELECT 
    a.id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    a.assigned,
    a.created_at,
    a.updated_at,
    pv.name as volunteer_name,
    pu.name as pilgrim_name
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
LEFT JOIN users pu ON a.pilgrim_id = pu.id
ORDER BY a.created_at DESC
LIMIT 10;

-- 2. Check specifically for active assignments
SELECT 'Active assignments:' as info;
SELECT 
    a.id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    a.assigned,
    pv.name as volunteer_name,
    pu.name as pilgrim_name
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
LEFT JOIN users pu ON a.pilgrim_id = pu.id
WHERE a.status IN ('pending', 'accepted', 'in_progress')
ORDER BY a.created_at DESC;

-- 3. Test the get_my_assignment function
SELECT 'Testing get_my_assignment function:' as info;
SELECT * FROM get_my_assignment();

-- 4. Check if there are any assistance requests
SELECT 'Assistance requests:' as info;
SELECT 
    ar.id,
    ar.user_id,
    ar.status,
    ar.title,
    ar.created_at,
    u.name as requester_name
FROM assistance_requests ar
LEFT JOIN users u ON ar.user_id = u.id
WHERE ar.status IN ('pending', 'assigned', 'in_progress', 'completed')
ORDER BY ar.created_at DESC
LIMIT 5;
