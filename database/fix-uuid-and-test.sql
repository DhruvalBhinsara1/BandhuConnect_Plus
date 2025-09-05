-- Fix UUID Format and Test Function
-- The previous UUID format was incorrect, let's fix and test properly

-- First, let's find the actual user IDs from the database
SELECT 'Current User IDs in System:' as section;
SELECT id, name, role, email FROM profiles ORDER BY created_at DESC;

-- Get assignment data with proper UUIDs
SELECT 'Current Assignments with UUIDs:' as section;
SELECT 
    a.id as assignment_id,
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
ORDER BY a.assigned_at DESC;

-- Test the debug function with current auth user (no parameters)
SELECT 'Testing debug function with current auth user:' as test_case;
SELECT * FROM get_my_assignment_debug();

-- Test original function
SELECT 'Testing original function:' as test_case;
SELECT * FROM get_my_assignment();

-- Check current auth context
SELECT 'Current Auth Context:' as section;
SELECT 
    auth.uid() as current_user_id, 
    auth.role() as current_role,
    p.name as user_name,
    p.role as user_role
FROM profiles p 
WHERE p.id = auth.uid();

-- Manual test for volunteer logic
SELECT 'Manual Volunteer Test:' as section;
SELECT 
    a.id,
    a.pilgrim_id,
    pu.name as pilgrim_name,
    'pilgrim' as counterpart_role,
    CASE WHEN a.status IN ('pending', 'accepted', 'in_progress') THEN true ELSE false END as is_active,
    true as assigned
FROM assignments a
JOIN users pu ON a.pilgrim_id = pu.id
JOIN profiles pv ON a.volunteer_id = pv.id
WHERE pv.role = 'volunteer'
AND a.status IN ('pending', 'accepted', 'in_progress')
ORDER BY a.assigned_at DESC
LIMIT 1;

-- Manual test for pilgrim logic  
SELECT 'Manual Pilgrim Test:' as section;
SELECT 
    a.id,
    a.volunteer_id,
    pv.name as volunteer_name,
    pv.role as counterpart_role,
    CASE WHEN a.status IN ('pending', 'accepted', 'in_progress') THEN true ELSE false END as is_active,
    true as assigned
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
JOIN profiles pv ON a.volunteer_id = pv.id
JOIN profiles pp ON ar.user_id = pp.id
WHERE pp.role = 'pilgrim'
AND a.status IN ('pending', 'accepted', 'in_progress')
ORDER BY a.assigned_at DESC
LIMIT 1;
