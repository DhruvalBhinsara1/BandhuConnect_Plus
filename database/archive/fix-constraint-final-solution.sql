-- Final fix for the duplicate constraint issue

-- 1. First, find and delete any duplicate assignments
DELETE FROM assignments 
WHERE request_id = 'c422e2f7-6792-4523-80da-49ce67663a36'
AND volunteer_id = 'a81c0e62-4bec-4552-bca3-b158c6afa790'
AND id != '4bff26bb-cfa7-44af-ba5b-03bd8d447253';

-- 2. Now safely update the main assignment
UPDATE assignments 
SET 
    volunteer_id = 'a81c0e62-4bec-4552-bca3-b158c6afa790',
    request_id = 'c422e2f7-6792-4523-80da-49ce67663a36',
    updated_at = NOW()
WHERE id = '4bff26bb-cfa7-44af-ba5b-03bd8d447253';

-- 3. Verify the final result
SELECT 
    'Final assignment state:' as info,
    a.id,
    a.volunteer_id,
    a.pilgrim_id,
    a.request_id,
    a.status,
    'Should work in both apps now' as result
FROM assignments a
WHERE a.id = '4bff26bb-cfa7-44af-ba5b-03bd8d447253';
