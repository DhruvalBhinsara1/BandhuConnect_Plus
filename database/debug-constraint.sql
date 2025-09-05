-- Debug the unique constraint issue
-- Find out what assignments exist that are causing the constraint violation

-- 1. Check the actual constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'assignments' 
AND conname LIKE '%unique%pilgrim%';

-- 2. Check ALL assignments for Dhruval
SELECT 
    'All assignments for Dhruval:' as info,
    id,
    pilgrim_id,
    volunteer_id,
    status,
    assigned,
    created_at,
    updated_at
FROM assignments 
WHERE pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
ORDER BY created_at DESC;

-- 3. Check what the constraint is actually checking
-- Look for assignments that would violate the unique constraint
SELECT 
    'Potential constraint violations:' as info,
    pilgrim_id,
    status,
    assigned,
    COUNT(*) as count
FROM assignments 
WHERE pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
GROUP BY pilgrim_id, status, assigned
HAVING COUNT(*) > 1;

-- 4. Check if there are assignments with NULL status or other edge cases
SELECT 
    'Edge case assignments:' as info,
    id,
    pilgrim_id,
    status,
    assigned,
    created_at
FROM assignments 
WHERE pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
AND (status IS NULL OR assigned IS NULL);

-- 5. Test what would happen if we try to insert
SELECT 
    'Would this insert violate constraint?' as test,
    pilgrim_id,
    status,
    assigned
FROM assignments 
WHERE pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
AND status IN ('pending', 'accepted', 'in_progress')
AND assigned = true;
