-- Debug Function Execution
-- Check why get_my_assignment() returns no results

-- 1. Check current user context
SELECT 'Current Auth Context:' as section;
SELECT auth.uid() as current_user_id, auth.role() as current_role;

-- 2. Check if current user exists in profiles
SELECT 'User Profile Check:' as section;
SELECT id, name, role, email 
FROM profiles 
WHERE id = auth.uid();

-- 3. Check assignments for current user
SELECT 'Direct Assignment Check:' as section;
SELECT 
    a.id,
    a.status,
    a.assigned,
    a.volunteer_id,
    a.pilgrim_id,
    a.assigned_at,
    CASE 
        WHEN a.volunteer_id = auth.uid() THEN 'USER_IS_VOLUNTEER'
        WHEN a.pilgrim_id = auth.uid() THEN 'USER_IS_PILGRIM'
        ELSE 'USER_NOT_IN_ASSIGNMENT'
    END as user_role_in_assignment
FROM assignments a
WHERE a.volunteer_id = auth.uid() 
   OR a.pilgrim_id = auth.uid()
ORDER BY a.assigned_at DESC;

-- 4. Check assignments with active status
SELECT 'Active Assignments Check:' as section;
SELECT 
    a.id,
    a.status,
    a.assigned,
    a.volunteer_id,
    a.pilgrim_id,
    pv.name as volunteer_name,
    pu.name as pilgrim_name
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
LEFT JOIN users pu ON a.pilgrim_id = pu.id
WHERE a.status IN ('pending', 'accepted', 'in_progress')
ORDER BY a.assigned_at DESC;

-- 5. Test function step by step
SELECT 'Function Logic Test:' as section;

-- Check if user exists in profiles
SELECT 'Profile exists:' as check_step,
       EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()) as result;

-- Check user role
SELECT 'User role:' as check_step,
       role as result
FROM profiles 
WHERE id = auth.uid();

-- For volunteer: check assignments
SELECT 'Volunteer assignments:' as check_step;
SELECT 
    a.id,
    a.pilgrim_id,
    pu.name as pilgrim_name,
    a.status,
    CASE WHEN a.status IN ('pending', 'accepted', 'in_progress') THEN true ELSE false END as is_active
FROM assignments a
JOIN users pu ON a.pilgrim_id = pu.id
WHERE a.volunteer_id = auth.uid()
AND a.status IN ('pending', 'accepted', 'in_progress')
ORDER BY a.assigned_at DESC
LIMIT 1;

-- For pilgrim: check assignments via requests
SELECT 'Pilgrim assignments:' as check_step;
SELECT 
    a.id,
    a.volunteer_id,
    pv.name as volunteer_name,
    pv.role,
    a.status,
    CASE WHEN a.status IN ('pending', 'accepted', 'in_progress') THEN true ELSE false END as is_active
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
JOIN profiles pv ON a.volunteer_id = pv.id
WHERE ar.user_id = auth.uid()
AND a.status IN ('pending', 'accepted', 'in_progress')
ORDER BY a.assigned_at DESC
LIMIT 1;
