-- Fix UUID Format Error
-- The UUID format is missing a character

-- 1. Check what assignments exist for this pilgrim (with correct UUID)
SELECT 'Existing assignments for pilgrim:' as info;
SELECT 
    a.id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    a.assigned,
    pv.name as volunteer_name
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
WHERE a.pilgrim_id = '55595c83a-55ef-426e-a10e-28ff9b70ce44'::UUID
ORDER BY a.created_at DESC;

-- 2. Check all active assignments
SELECT 'All active assignments:' as info;
SELECT 
    a.id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    a.request_id,
    pv.name as volunteer_name,
    pu.name as pilgrim_name
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
LEFT JOIN users pu ON a.pilgrim_id = pu.id
WHERE a.status IN ('pending', 'accepted', 'in_progress')
ORDER BY a.created_at DESC;

-- 3. Find the correct pilgrim UUID from users table
SELECT 'Finding correct pilgrim UUID:' as info;
SELECT id, name FROM users WHERE name LIKE '%Dhruval%' OR name LIKE '%Bhinsara%';

-- 4. Update assignment with correct pilgrim_id (use the UUID from step 3)
-- First, let's see what request this assignment is linked to
SELECT 'Assignment request link:' as info;
SELECT 
    a.id as assignment_id,
    a.request_id,
    ar.user_id as request_pilgrim_id,
    u.name as pilgrim_name
FROM assignments a
LEFT JOIN assistance_requests ar ON a.request_id = ar.id
LEFT JOIN users u ON ar.user_id = u.id
WHERE a.id = '3ebabf0f-a12f-4d18-be5d-f3a2e19a9462'::UUID;

-- 5. Update the assignment with the pilgrim_id from the linked request
UPDATE assignments 
SET pilgrim_id = (
    SELECT ar.user_id 
    FROM assistance_requests ar 
    WHERE ar.id = assignments.request_id
),
updated_at = NOW()
WHERE id = '3ebabf0f-a12f-4d18-be5d-f3a2e19a9462'::UUID
AND pilgrim_id IS NULL;

-- 6. Verify the fix
SELECT 'Final assignment state:' as info;
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
WHERE a.id = '3ebabf0f-a12f-4d18-be5d-f3a2e19a9462'::UUID;

-- 7. Test the function
SELECT 'Testing get_my_assignment function:' as test;
SELECT * FROM get_my_assignment();
