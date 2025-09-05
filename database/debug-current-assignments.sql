-- Debug Current Assignment Status
-- Check what assignments exist and their current state

SELECT 'Current Assignments in Database' as section;

-- Check all assignments
SELECT 
    a.id,
    a.status,
    a.assigned,
    a.volunteer_id,
    a.pilgrim_id,
    a.request_id,
    a.assigned_at,
    pv.name as volunteer_name,
    pu.name as pilgrim_name,
    ar.title as request_title
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
LEFT JOIN users pu ON a.pilgrim_id = pu.id
LEFT JOIN assistance_requests ar ON a.request_id = ar.id
ORDER BY a.assigned_at DESC;

-- Test the get_my_assignment function for both users
SELECT 'Testing get_my_assignment function' as section;

-- Test for volunteer (assuming Dr. Raj Patel)
SELECT 'For Volunteer Dr. Raj Patel:' as test_user;
SELECT * FROM get_my_assignment() 
WHERE EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND name = 'Dr. Raj Patel' 
    AND role = 'volunteer'
);

-- Check if function exists
SELECT 'Function exists check:' as check_type;
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'get_my_assignment';

-- Check RLS policies on assignments table
SELECT 'RLS Policies on assignments:' as policy_check;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'assignments';
