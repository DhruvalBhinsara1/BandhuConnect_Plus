-- Final Fix for Constraint Violation
-- Use the existing assignment instead of trying to update the target one

-- 1. Find the existing active assignment for this pilgrim
SELECT 'Finding existing active assignment:' as info;
SELECT 
    a.id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    a.assigned,
    pv.name as volunteer_name
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
WHERE a.pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'::UUID
AND a.status IN ('pending', 'accepted', 'in_progress')
ORDER BY a.created_at DESC
LIMIT 1;

-- 2. Complete the problematic assignment (the one without pilgrim_id)
UPDATE assignments 
SET 
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
WHERE id = '3ebabf0f-a12f-4d18-be5d-f3a2e19a9462'::UUID;

-- 3. Ensure the existing assignment has the correct volunteer
-- (Update the existing assignment to use the volunteer from the problematic one)
UPDATE assignments 
SET 
    volunteer_id = (
        SELECT volunteer_id 
        FROM assignments 
        WHERE id = '3ebabf0f-a12f-4d18-be5d-f3a2e19a9462'::UUID
    ),
    assigned = true,
    updated_at = NOW()
WHERE pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'::UUID
AND status IN ('pending', 'accepted', 'in_progress');

-- 4. Verify the final state
SELECT 'Final active assignment:' as info;
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
WHERE a.pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'::UUID
AND a.status IN ('pending', 'accepted', 'in_progress');

-- 5. Test the function
SELECT 'Testing get_my_assignment function:' as test;
SELECT * FROM get_my_assignment();
