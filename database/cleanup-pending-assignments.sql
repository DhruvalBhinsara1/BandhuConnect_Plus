-- Cleanup script to remove all pending assignments and reset task states
-- Run this to clear any stuck pending assignments that might cause issues

-- 1. Delete all pending assignments
DELETE FROM assignments WHERE status = 'pending';

-- 2. Reset any assistance requests that were assigned but now have no assignments back to open
UPDATE assistance_requests 
SET status = 'pending', updated_at = NOW()
WHERE status = 'assigned' 
AND id NOT IN (
    SELECT DISTINCT request_id 
    FROM assignments 
    WHERE status IN ('accepted', 'in_progress', 'completed')
);

-- 3. Reset volunteer status to available if they have no active assignments
UPDATE profiles 
SET volunteer_status = 'available', updated_at = NOW()
WHERE volunteer_status = 'busy'
AND id NOT IN (
    SELECT DISTINCT volunteer_id 
    FROM assignments 
    WHERE status IN ('accepted', 'in_progress')
);

-- 4. Show cleanup results
SELECT 
    'Remaining assignments' as table_name,
    status::text,
    COUNT(*) as count
FROM assignments 
GROUP BY status
UNION ALL
SELECT 
    'Assistance requests' as table_name,
    status::text,
    COUNT(*) as count
FROM assistance_requests 
GROUP BY status
ORDER BY table_name, status;
