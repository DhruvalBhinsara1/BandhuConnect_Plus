-- Direct Fix for Unique Constraint Violation
-- Complete existing active assignments for this pilgrim first

-- 1. Check what assignments exist for pilgrim 5595c83a-55ef-426e-a10e-28ff9b70ce44
SELECT 'Existing active assignments for pilgrim:' as info;
SELECT 
    a.id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    a.assigned,
    a.created_at
FROM assignments a
WHERE a.pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'::UUID
AND a.status IN ('pending', 'accepted', 'in_progress')
ORDER BY a.created_at DESC;

-- 2. Complete ALL existing active assignments for this pilgrim
UPDATE assignments 
SET 
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
WHERE pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'::UUID
AND status IN ('pending', 'accepted', 'in_progress');

-- 3. Now update the target assignment (which has volunteer but no pilgrim)
UPDATE assignments 
SET 
    pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'::UUID,
    assigned = true,
    updated_at = NOW()
WHERE id = '3ebabf0f-a12f-4d18-be5d-f3a2e19a9462'::UUID;

-- 4. Verify the result
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
WHERE a.id = '3ebabf0f-a12f-4d18-be5d-f3a2e19a9462'::UUID;

-- 5. Test the function
SELECT 'Testing get_my_assignment function:' as test;
SELECT * FROM get_my_assignment();
