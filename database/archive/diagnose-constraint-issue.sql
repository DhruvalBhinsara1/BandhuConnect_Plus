-- Diagnose Constraint Issue
-- Find out exactly what's causing the unique constraint violation

-- 1. Check ALL assignments for this pilgrim (including completed ones)
SELECT 'ALL assignments for pilgrim 5595c83a-55ef-426e-a10e-28ff9b70ce44:' as info;
SELECT 
    a.id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    a.assigned,
    a.created_at,
    a.updated_at
FROM assignments a
WHERE a.pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'::UUID
ORDER BY a.created_at DESC;

-- 2. Check the target assignment that we're trying to update
SELECT 'Target assignment (3ebabf0f-a12f-4d18-be5d-f3a2e19a9462):' as info;
SELECT 
    a.id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    a.assigned,
    a.created_at
FROM assignments a
WHERE a.id = '3ebabf0f-a12f-4d18-be5d-f3a2e19a9462'::UUID;

-- 3. Check if the constraint exists and what it covers
SELECT 'Constraint details:' as info;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'idx_assignments_unique_active_pilgrim';

-- 4. Find ANY active assignments with this pilgrim_id
SELECT 'Any active assignments with this pilgrim_id:' as info;
SELECT 
    a.id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    a.assigned
FROM assignments a
WHERE a.pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'::UUID
AND a.status IN ('pending', 'accepted', 'in_progress');

-- 5. Alternative approach - use the existing assignment instead of creating a new one
SELECT 'Existing assignment that could be used:' as info;
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
