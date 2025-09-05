-- Create the assignment with proper error handling

-- First, let's try the INSERT and see if there are any errors
INSERT INTO assignments (
    id,
    request_id,
    volunteer_id,
    pilgrim_id,
    status,
    assigned_at,
    assigned
) VALUES (
    gen_random_uuid(),
    '8eae7554-5010-46a4-931f-edf7c93b85be',
    'a81c0e62-4bec-4552-bca3-b158c6afa790',
    '5595c83a-55ef-426e-a10e-28ff9b70ce44',
    'pending',
    NOW(),
    true
) RETURNING id, status, assigned_at;

-- Verify the assignment was created
SELECT 
    'Assignment created successfully:' as info,
    a.id,
    a.status,
    a.assigned_at,
    ar.title as request_title,
    pv.name as volunteer_name,
    pu.name as pilgrim_name
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
JOIN profiles pv ON a.volunteer_id = pv.id
JOIN users pu ON a.pilgrim_id = pu.id
WHERE a.request_id = '8eae7554-5010-46a4-931f-edf7c93b85be'
ORDER BY a.assigned_at DESC
LIMIT 1;
