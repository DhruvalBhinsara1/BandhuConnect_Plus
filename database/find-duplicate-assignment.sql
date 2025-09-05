-- Find the duplicate assignment causing the constraint violation

-- 1. Check for existing assignments with the same request_id + volunteer_id
SELECT 
    'Existing assignments with same request_id + volunteer_id:' as info,
    a.id,
    a.request_id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    a.created_at
FROM assignments a
WHERE a.request_id = 'c422e2f7-6792-4523-80da-49ce67663a36'
AND a.volunteer_id = 'a81c0e62-4bec-4552-bca3-b158c6afa790'
ORDER BY a.created_at;

-- 2. Check all assignments for this request
SELECT 
    'All assignments for Guidance request:' as info,
    a.id,
    a.request_id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    pv.name as volunteer_name,
    pu.name as pilgrim_name
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
LEFT JOIN users pu ON a.pilgrim_id = pu.id
WHERE a.request_id = 'c422e2f7-6792-4523-80da-49ce67663a36'
ORDER BY a.created_at;

-- 3. Check all assignments for Dr. Raj
SELECT 
    'All assignments for Dr. Raj:' as info,
    a.id,
    a.request_id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    ar.title as request_title
FROM assignments a
LEFT JOIN assistance_requests ar ON a.request_id = ar.id
WHERE a.volunteer_id = 'a81c0e62-4bec-4552-bca3-b158c6afa790'
ORDER BY a.created_at;
