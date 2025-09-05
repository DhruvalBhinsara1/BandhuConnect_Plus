-- Check current assignment state to understand the mismatch

-- 1. Check Dhruval's current assignment
SELECT 
    'Current assignment for Dhruval:' as info,
    a.id,
    a.request_id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    a.assigned,
    pv.name as volunteer_name,
    ar.title as request_title,
    ar.created_at as request_created
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
LEFT JOIN assistance_requests ar ON a.request_id = ar.id
WHERE a.pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
AND a.status IN ('pending', 'accepted', 'in_progress')
ORDER BY a.updated_at DESC;

-- 2. Check the "Guidance" assistance request
SELECT 
    'Guidance assistance request:' as info,
    id,
    user_id,
    title,
    status,
    created_at
FROM assistance_requests 
WHERE id = 'c422e2f7-6792-4523-80da-49ce67663a36';

-- 3. Check Dr. Raj Patel's profile
SELECT 
    'Dr. Raj Patel profile:' as info,
    id,
    name,
    role
FROM profiles 
WHERE name LIKE '%Raj%';

-- 4. Check Dr. Priya Sharma's profile  
SELECT 
    'Dr. Priya Sharma profile:' as info,
    id,
    name,
    role
FROM profiles 
WHERE name LIKE '%Priya%';
