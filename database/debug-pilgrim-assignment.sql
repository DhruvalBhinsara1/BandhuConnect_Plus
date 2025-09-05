-- Debug Pilgrim Assignment Issue
-- Check why pilgrim app shows "No active requests" despite assignment existing

-- 1. Check current authenticated user context
SELECT 'Current auth context:' as info;
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role;

-- 2. Find pilgrim user ID (Dhruval)
SELECT 'Finding pilgrim user:' as info;
SELECT id, name, email FROM users WHERE name LIKE '%Dhruval%' OR email LIKE '%dhruval%';

-- 3. Check assignments for pilgrim
SELECT 'Assignments for pilgrim:' as info;
SELECT 
    a.id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    a.assigned,
    a.request_id,
    pv.name as volunteer_name,
    pu.name as pilgrim_name
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
LEFT JOIN users pu ON a.pilgrim_id = pu.id
WHERE a.pilgrim_id = (SELECT id FROM users WHERE name LIKE '%Dhruval%' LIMIT 1)
ORDER BY a.created_at DESC;

-- 4. Test get_my_assignment function for pilgrim
SELECT 'Testing function for pilgrim (if authenticated):' as info;
SELECT * FROM get_my_assignment();

-- 5. Check if pilgrim has profile in profiles table
SELECT 'Pilgrim profile check:' as info;
SELECT p.id, p.name, p.role 
FROM profiles p 
WHERE p.id = (SELECT id FROM users WHERE name LIKE '%Dhruval%' LIMIT 1);

-- 6. Manual query to simulate what function should return for pilgrim
SELECT 'Manual pilgrim assignment query:' as info;
SELECT 
    a.id as assignment_id,
    a.volunteer_id as counterpart_id,
    pv.name as counterpart_name,
    pv.role as counterpart_role,
    true as is_active,
    COALESCE(a.assigned, true) as assigned
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
WHERE a.pilgrim_id = (SELECT id FROM users WHERE name LIKE '%Dhruval%' LIMIT 1)
AND a.status IN ('pending', 'accepted', 'in_progress')
AND a.volunteer_id IS NOT NULL
ORDER BY a.assigned_at DESC
LIMIT 1;
