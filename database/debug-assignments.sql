-- Debug Assignment Detection Issues
-- This script helps identify why get_my_assignment() isn't working

-- 1. Check current user profile
SELECT 'Current User Profile:' as debug_section;
SELECT id, name, role, created_at 
FROM profiles 
WHERE id = '5595c83a-55ef-426e-a10e-28ff9b70ce44';

-- 2. Check all assignments for this user (as pilgrim)
SELECT 'Assignments where user is pilgrim:' as debug_section;
SELECT 
    a.id as assignment_id,
    a.status,
    a.assigned,
    a.pilgrim_id,
    a.volunteer_id,
    ar.user_id as request_user_id,
    ar.description,
    a.created_at,
    a.assigned_at
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
WHERE ar.user_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
ORDER BY a.created_at DESC;

-- 3. Check all assignments for this user (as volunteer)
SELECT 'Assignments where user is volunteer:' as debug_section;
SELECT 
    a.id as assignment_id,
    a.status,
    a.assigned,
    a.pilgrim_id,
    a.volunteer_id,
    ar.user_id as request_user_id,
    ar.description,
    a.created_at,
    a.assigned_at
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
WHERE a.volunteer_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
ORDER BY a.created_at DESC;

-- 4. Test the get_my_assignment function directly
SELECT 'Testing get_my_assignment function:' as debug_section;
-- Note: This won't work in SQL editor as it uses auth.uid(), but shows the structure

-- 5. Check assistance requests for this user
SELECT 'Assistance requests for this user:' as debug_section;
SELECT 
    ar.id,
    ar.user_id,
    ar.description,
    ar.status,
    ar.created_at
FROM assistance_requests ar
WHERE ar.user_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
ORDER BY ar.created_at DESC;

-- 6. Check for any active assignments with pending/accepted/in_progress status
SELECT 'All active assignments with assigned=true:' as debug_section;
SELECT 
    a.id as assignment_id,
    a.status,
    a.assigned,
    a.pilgrim_id,
    a.volunteer_id,
    ar.user_id as request_user_id,
    p_pilgrim.name as pilgrim_name,
    p_volunteer.name as volunteer_name,
    ar.description
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
LEFT JOIN profiles p_pilgrim ON a.pilgrim_id = p_pilgrim.id
LEFT JOIN profiles p_volunteer ON a.volunteer_id = p_volunteer.id
WHERE a.status IN ('pending', 'accepted', 'in_progress')
AND a.assigned = true
ORDER BY a.created_at DESC;

-- 7. Check user_locations for both users
SELECT 'User locations:' as debug_section;
SELECT 
    ul.user_id,
    p.name,
    p.role,
    ul.latitude,
    ul.longitude,
    ul.is_active,
    ul.last_updated
FROM user_locations ul
JOIN profiles p ON ul.user_id = p.id
WHERE ul.is_active = true
ORDER BY ul.last_updated DESC;
