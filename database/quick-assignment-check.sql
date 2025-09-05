-- Quick Assignment Check
-- Simple queries to verify assignment data exists

-- Check if assignments table has data
SELECT 'Assignment Count:' as info, COUNT(*) as count FROM assignments;

-- Check active assignments
SELECT 'Active Assignment Count:' as info, COUNT(*) as count 
FROM assignments 
WHERE status IN ('pending', 'accepted', 'in_progress');

-- Show all assignments with user info
SELECT 
    a.id,
    a.status,
    a.assigned,
    pv.name as volunteer_name,
    pu.name as pilgrim_name,
    ar.title as request_title
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id  
LEFT JOIN users pu ON a.pilgrim_id = pu.id
LEFT JOIN assistance_requests ar ON a.request_id = ar.id
ORDER BY a.created_at DESC
LIMIT 5;
