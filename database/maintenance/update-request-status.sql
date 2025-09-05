-- Sync Assistance Request Status with Active Assignments
-- This script fixes the common issue where assignments are reactivated (status = 'accepted', 'in_progress') 
-- but the corresponding assistance requests still show as 'completed', causing dashboard count mismatches

-- STEP 1: Show all assignments that are active but have completed assistance requests
SELECT 'Active Assignments with Completed Requests (ISSUE):' as section;
SELECT 
    a.id as assignment_id,
    a.request_id,
    a.status as assignment_status,
    a.assigned,
    ar.status as request_status,
    ar.title,
    ar.user_id,
    u.name as pilgrim_name,
    pv.name as volunteer_name
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
JOIN users u ON ar.user_id = u.id
JOIN profiles pv ON a.volunteer_id = pv.id
WHERE a.status IN ('pending', 'accepted', 'in_progress') 
  AND a.assigned = true
  AND ar.status = 'completed'
ORDER BY a.updated_at DESC;

-- STEP 2: Update all assistance requests to match their active assignment status
UPDATE assistance_requests 
SET 
    status = CASE 
        WHEN a.status = 'pending' THEN 'pending'
        WHEN a.status = 'accepted' THEN 'in_progress'  
        WHEN a.status = 'in_progress' THEN 'in_progress'
        ELSE assistance_requests.status
    END,
    updated_at = NOW()
FROM assignments a
WHERE assistance_requests.id = a.request_id
  AND a.status IN ('pending', 'accepted', 'in_progress')
  AND a.assigned = true
  AND assistance_requests.status = 'completed';

-- STEP 3: Verify all assignments now have matching request statuses
SELECT 'Fixed: Active Assignments with Synced Request Status:' as section;
SELECT 
    a.id as assignment_id,
    a.request_id,
    a.status as assignment_status,
    a.assigned,
    ar.status as request_status,
    ar.title,
    ar.user_id,
    u.name as pilgrim_name,
    pv.name as volunteer_name
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
JOIN users u ON ar.user_id = u.id
JOIN profiles pv ON a.volunteer_id = pv.id
WHERE a.status IN ('pending', 'accepted', 'in_progress') 
  AND a.assigned = true
ORDER BY a.updated_at DESC;

-- STEP 4: Show summary of request status counts for verification
SELECT 'Request Status Summary:' as section;
SELECT 
    ar.status,
    COUNT(*) as count
FROM assistance_requests ar
GROUP BY ar.status
ORDER BY ar.status;
