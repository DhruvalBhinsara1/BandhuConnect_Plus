-- Debug why volunteer app shows "No Active Assignment" while pilgrim app shows assignment exists

-- 1. Check current assignment state
SELECT 
    'Current assignment:' as info,
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
ORDER BY a.updated_at DESC;

-- 2. Check Dr. Raj Patel's user ID vs profile ID
SELECT 'Dr. Raj in users:' as info, id, name FROM users WHERE name LIKE '%Raj%';
SELECT 'Dr. Raj in profiles:' as info, id, name FROM profiles WHERE name LIKE '%Raj%';

-- 3. Test get_my_assignment function for Dr. Raj's user ID
-- This simulates what the volunteer app would see
SELECT 'Assignment function test for Raj user ID:' as test;
-- We can't directly call the function with a specific user, but we can check the logic

-- 4. Check if there's a mismatch between user authentication and profile lookup
SELECT 
    'Assignment visibility check:' as info,
    a.id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    CASE 
        WHEN a.volunteer_id = 'a81c0e62-4bec-4552-bca3-b158c6afa790' THEN 'Matches Raj user ID'
        ELSE 'Does not match Raj user ID'
    END as raj_match
FROM assignments a
WHERE a.status IN ('pending', 'accepted', 'in_progress');
