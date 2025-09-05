-- Check for existing active assignments for Dhruval that are blocking new assignment creation

-- 1. Find all assignments for Dhruval (pilgrim_id)
SELECT 
    'Existing assignments for Dhruval:' as info,
    a.id,
    a.status,
    a.assigned_at,
    a.completed_at,
    a.cancelled_at,
    ar.title as request_title,
    pv.name as volunteer_name
FROM assignments a
LEFT JOIN assistance_requests ar ON a.request_id = ar.id
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
WHERE a.pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
ORDER BY a.assigned_at DESC;

-- 2. Check constraint definition
SELECT 
    'Constraint details:' as info,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'idx_assignments_unique_active_pilgrim';

-- 3. Find active statuses that might be blocking
SELECT DISTINCT status 
FROM assignments 
WHERE pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44';
