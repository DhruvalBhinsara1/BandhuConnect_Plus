-- Fix the volunteer ID mismatch so Dr. Raj can see his assignment

-- 1. Update the assignment to use Dr. Raj's correct user ID
UPDATE assignments 
SET 
    volunteer_id = 'a81c0e62-4bec-4552-bca3-b158c6afa790',
    updated_at = NOW()
WHERE id = '4bff26bb-cfa7-44af-ba5b-03bd8d447253';

-- 2. Verify the fix
SELECT 
    'Fixed assignment:' as info,
    a.id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    CASE 
        WHEN a.volunteer_id = 'a81c0e62-4bec-4552-bca3-b158c6afa790' THEN 'NOW matches Raj user ID - will show in app'
        ELSE 'Still does not match'
    END as raj_match
FROM assignments a
WHERE a.id = '4bff26bb-cfa7-44af-ba5b-03bd8d447253';

-- 3. Check both users can see the assignment
SELECT 
    'Assignment visibility for both users:' as info,
    a.id,
    a.volunteer_id as raj_id,
    a.pilgrim_id as dhruval_id,
    a.status,
    'Both should see assignment now' as result
FROM assignments a
WHERE a.id = '4bff26bb-cfa7-44af-ba5b-03bd8d447253';
