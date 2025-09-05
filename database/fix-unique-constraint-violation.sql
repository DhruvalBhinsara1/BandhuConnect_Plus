-- Fix Unique Constraint Violation for Pilgrim Assignments
-- Handle duplicate active assignments for pilgrim_id

-- 1. Check all assignments for this pilgrim
SELECT 'All assignments for pilgrim 5595c83a-55ef-426e-a10e-28ff9b70ce44:' as info;
SELECT 
    a.id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    a.assigned,
    a.request_id,
    a.created_at,
    pv.name as volunteer_name
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
WHERE a.pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'::UUID
ORDER BY a.created_at DESC;

-- 2. Check which assignments are considered "active" by the constraint
SELECT 'Active assignments for this pilgrim:' as info;
SELECT 
    a.id,
    a.volunteer_id,
    a.status,
    a.assigned,
    a.created_at
FROM assignments a
WHERE a.pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'::UUID
AND a.status IN ('pending', 'accepted', 'in_progress')
ORDER BY a.created_at DESC;

-- 3. Complete older duplicate assignments, keep the most recent one
UPDATE assignments 
SET 
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
WHERE pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'::UUID
AND status IN ('pending', 'accepted', 'in_progress')
AND id != (
    -- Keep the most recent assignment
    SELECT id FROM assignments 
    WHERE pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'::UUID
    AND status IN ('pending', 'accepted', 'in_progress')
    ORDER BY created_at DESC 
    LIMIT 1
);

-- 4. Now update the remaining assignment with correct data
UPDATE assignments 
SET 
    pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'::UUID,
    assigned = true,
    updated_at = NOW()
WHERE id = '3ebabf0f-a12f-4d18-be5d-f3a2e19a9462'::UUID
AND pilgrim_id IS NULL;

-- 5. Verify the fix
SELECT 'Final assignment state:' as info;
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
AND a.status IN ('pending', 'accepted', 'in_progress')
ORDER BY a.created_at DESC;

-- 6. Test the function
SELECT 'Testing get_my_assignment function:' as test;
SELECT * FROM get_my_assignment();
