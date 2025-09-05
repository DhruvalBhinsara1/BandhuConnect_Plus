-- Verify completion state is properly reflected for both users

-- 1. Check assignment completion details
SELECT 
    'Assignment completion details:' as info,
    a.id,
    a.status,
    a.completed_at,
    a.completion_latitude,
    a.completion_longitude,
    ar.status as request_status,
    ar.title as request_title
FROM assignments a
LEFT JOIN assistance_requests ar ON a.request_id = ar.id
WHERE a.id = '4bff26bb-cfa7-44af-ba5b-03bd8d447253';

-- 2. Check what volunteer app should see (no active assignments)
SELECT 
    'Volunteer app query (should be empty):' as info,
    COUNT(*) as active_assignments
FROM assignments 
WHERE volunteer_id = 'a81c0e62-4bec-4552-bca3-b158c6afa790'
AND status IN ('pending', 'accepted', 'in_progress');

-- 3. Check what pilgrim app should see (completed request)
SELECT 
    'Pilgrim app query (should show completed):' as info,
    ar.id,
    ar.title,
    ar.status,
    ar.created_at
FROM assistance_requests ar
WHERE ar.user_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
ORDER BY ar.created_at DESC
LIMIT 5;
