-- Fix the completed assignment to allow new assignment creation

-- 1. Check the constraint definition to understand what makes an assignment "active"
SELECT 
    'Constraint definition:' as info,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'idx_assignments_unique_active_pilgrim';

-- 2. Update the completed assignment to set is_active = false
UPDATE assignments 
SET is_active = false, updated_at = NOW()
WHERE pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44' 
AND status = 'completed'
AND is_active = true;

-- 3. Verify the update
SELECT 
    'Updated assignments:' as info,
    id,
    status,
    is_active,
    completed_at
FROM assignments 
WHERE pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
ORDER BY assigned_at DESC;
