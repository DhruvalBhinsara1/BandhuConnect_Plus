-- Minimal Test - Just Basic Queries
-- No functions, just direct data checks

-- Check assignments exist
SELECT COUNT(*) FROM assignments;

-- Check active assignments  
SELECT COUNT(*) FROM assignments WHERE status IN ('pending', 'accepted', 'in_progress');

-- Show assignment data
SELECT 
    a.id,
    a.volunteer_id, 
    a.pilgrim_id,
    a.status,
    a.assigned
FROM assignments a
WHERE a.status IN ('pending', 'accepted', 'in_progress')
LIMIT 3;
