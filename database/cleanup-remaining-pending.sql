-- Clean up remaining pending assignments that weren't caught by the first cleanup
-- These appear to be specific assignment IDs that are still showing as pending

-- Delete specific pending assignments that are still showing up
DELETE FROM assignments WHERE id IN (
    'dd256d35-c7d4-442f-818e-db290254c641',
    '4b395f2f-c745-4ad1-8876-aa0ebc44a9ae',
    '1e287348-f629-46de-9b6f-f71960260903'
);

-- Clean up any other remaining pending assignments
DELETE FROM assignments WHERE status = 'pending';

-- Reset assistance requests that lost their assignments
UPDATE assistance_requests 
SET status = 'pending', updated_at = NOW()
WHERE status = 'assigned' 
AND id NOT IN (
    SELECT DISTINCT request_id 
    FROM assignments 
    WHERE status IN ('accepted', 'in_progress', 'completed')
);

-- Reset volunteer status to available if they have no active assignments
UPDATE profiles 
SET volunteer_status = 'available', updated_at = NOW()
WHERE volunteer_status = 'busy'
AND id NOT IN (
    SELECT DISTINCT volunteer_id 
    FROM assignments 
    WHERE status IN ('accepted', 'in_progress')
);

-- Show final cleanup results
SELECT 
    'Final assignments' as table_name,
    status::text,
    COUNT(*) as count
FROM assignments 
GROUP BY status
UNION ALL
SELECT 
    'Final requests' as table_name,
    status::text,
    COUNT(*) as count
FROM assistance_requests 
GROUP BY status
ORDER BY table_name, status;
