-- Check Assignment Structure and Fix Data
-- The assignment has volunteer but no pilgrim - this needs to be fixed

-- 1. Check the assistance_requests table to find the pilgrim
SELECT 'Assistance Requests:' as info;
SELECT 
    ar.id as request_id,
    ar.user_id as pilgrim_id,
    ar.title,
    ar.status as request_status,
    u.name as pilgrim_name
FROM assistance_requests ar
LEFT JOIN users u ON ar.user_id = u.id
ORDER BY ar.created_at DESC
LIMIT 3;

-- 2. Check if the assignment is linked to a request
SELECT 'Assignment with Request Link:' as info;
SELECT 
    a.id as assignment_id,
    a.volunteer_id,
    a.pilgrim_id,
    a.request_id,
    a.status,
    ar.user_id as request_pilgrim_id,
    ar.title as request_title
FROM assignments a
LEFT JOIN assistance_requests ar ON a.request_id = ar.id
WHERE a.status IN ('pending', 'accepted', 'in_progress')
ORDER BY a.assigned_at DESC;

-- 3. Fix the assignment by updating pilgrim_id from the linked request
UPDATE assignments 
SET pilgrim_id = (
    SELECT ar.user_id 
    FROM assistance_requests ar 
    WHERE ar.id = assignments.request_id
)
WHERE pilgrim_id IS NULL 
AND request_id IS NOT NULL
AND status IN ('pending', 'accepted', 'in_progress');

-- 4. Verify the fix
SELECT 'Fixed Assignment Data:' as info;
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
ORDER BY a.assigned_at DESC;
