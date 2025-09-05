-- Fix assignment to use Dr. Raj Patel (who is in users table, not profiles)

-- 1. Check if Dr. Raj Patel has a profile entry
SELECT 
    'Dr. Raj Patel profile check:' as info,
    id,
    name,
    role
FROM profiles 
WHERE id = 'a81c0e62-4bec-4552-bca3-b158c6afa790';

-- 2. Create profile for Dr. Raj Patel if it doesn't exist
INSERT INTO profiles (id, name, role, created_at, updated_at)
SELECT 
    'a81c0e62-4bec-4552-bca3-b158c6afa790',
    'Dr. Raj Patel',
    'volunteer',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = 'a81c0e62-4bec-4552-bca3-b158c6afa790'
);

-- 3. Update the assignment to use Dr. Raj Patel
UPDATE assignments 
SET 
    volunteer_id = 'a81c0e62-4bec-4552-bca3-b158c6afa790',
    request_id = 'c422e2f7-6792-4523-80da-49ce67663a36',
    updated_at = NOW()
WHERE id = '4bff26bb-cfa7-44af-ba5b-03bd8d447253';

-- 4. Verify the final assignment
SELECT 
    'Final assignment verification:' as info,
    a.id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    pv.name as volunteer_name,
    pu.name as pilgrim_name,
    ar.title as request_title
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
LEFT JOIN users pu ON a.pilgrim_id = pu.id
LEFT JOIN assistance_requests ar ON a.request_id = ar.id
WHERE a.id = '4bff26bb-cfa7-44af-ba5b-03bd8d447253';
