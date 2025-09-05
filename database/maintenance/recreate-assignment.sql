-- Recreate Assignment from Scratch
-- Create a new working assignment for testing

-- 1. First, clean up any existing assignments
DELETE FROM assignments WHERE status = 'completed';

-- 2. Get the user IDs we need
SELECT 'User IDs:' as info;
SELECT 'Volunteer (Dr. Raj):' as type, id, name FROM profiles WHERE name LIKE '%Raj%';
SELECT 'Pilgrim (Dhruval):' as type, id, name FROM users WHERE name LIKE '%Dhruval%';

-- 3. Create assignment linked to existing assistance request
INSERT INTO assignments (
    request_id,
    volunteer_id,
    pilgrim_id,
    status,
    assigned,
    created_at,
    updated_at
) VALUES (
    'c422e2f7-6792-4523-80da-49ce67663a36'::UUID,
    (SELECT id FROM profiles WHERE name LIKE '%Raj%' LIMIT 1),
    '5595c83a-55ef-426e-a10e-28ff9b70ce44'::UUID,
    'pending',
    true,
    NOW(),
    NOW()
);

-- 4. Verify the new assignment
SELECT 'New assignment created:' as info;
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
WHERE a.status = 'pending'
ORDER BY a.created_at DESC
LIMIT 1;

-- 5. Test the function
SELECT 'Testing get_my_assignment function:' as test;
SELECT * FROM get_my_assignment();
