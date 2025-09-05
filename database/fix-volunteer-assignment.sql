-- Fix the assignment to use Dr. Raj Patel instead of Priya Sharma

-- 1. Find Dr. Raj Patel's profile ID
SELECT 
    'Dr. Raj Patel profile:' as info,
    id,
    name,
    role
FROM profiles 
WHERE name LIKE '%Raj%' AND role = 'volunteer';

-- 2. Update the current assignment to use Dr. Raj Patel
UPDATE assignments 
SET 
    volunteer_id = (SELECT id FROM profiles WHERE name LIKE '%Raj%' AND role = 'volunteer' LIMIT 1),
    request_id = 'c422e2f7-6792-4523-80da-49ce67663a36',
    updated_at = NOW()
WHERE id = '4bff26bb-cfa7-44af-ba5b-03bd8d447253';

-- 3. Verify the update
SELECT 
    'Updated assignment:' as info,
    a.id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    pv.name as volunteer_name,
    ar.title as request_title
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
LEFT JOIN assistance_requests ar ON a.request_id = ar.id
WHERE a.id = '4bff26bb-cfa7-44af-ba5b-03bd8d447253';
