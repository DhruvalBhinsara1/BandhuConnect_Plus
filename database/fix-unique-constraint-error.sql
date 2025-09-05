-- Fix Unique Constraint Error
-- The error shows pilgrim_id already exists in another assignment

-- 1. Check what assignments exist for this pilgrim
SELECT 'Existing assignments for pilgrim:' as info;
SELECT 
    a.id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    a.assigned,
    pv.name as volunteer_name
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
WHERE a.pilgrim_id = '55595c83a-55ef-426e-a10e-28ff9b70ce44'
ORDER BY a.created_at DESC;

-- 2. Check all active assignments
SELECT 'All active assignments:' as info;
SELECT 
    a.id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    a.request_id,
    pv.name as volunteer_name,
    pu.name as pilgrim_name
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
LEFT JOIN users pu ON a.pilgrim_id = pu.id
WHERE a.status IN ('pending', 'accepted', 'in_progress')
ORDER BY a.created_at DESC;

-- 3. Instead of UPDATE, let's complete/cancel the duplicate assignment
-- Mark any duplicate assignments as completed to avoid constraint violation
UPDATE assignments 
SET status = 'completed', 
    updated_at = NOW()
WHERE pilgrim_id = '55595c83a-55ef-426e-a10e-28ff9b70ce44'
AND status IN ('pending', 'accepted', 'in_progress')
AND id != '3ebabf0f-a12f-4d18-be5d-f3a2e19a9462';  -- Keep our main assignment

-- 4. Now update the main assignment with the pilgrim_id
UPDATE assignments 
SET pilgrim_id = '55595c83a-55ef-426e-a10e-28ff9b70ce44',
    updated_at = NOW()
WHERE id = '3ebabf0f-a12f-4d18-be5d-f3a2e19a9462'
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
WHERE a.id = '3ebabf0f-a12f-4d18-be5d-f3a2e19a9462';

-- 6. Test the function again
SELECT 'Testing get_my_assignment function:' as test;
SELECT * FROM get_my_assignment();
