-- Test the "Mark as Done" functionality and database sync

-- 1. Check current assignment state before completion
SELECT 
    'Before completion:' as test_phase,
    a.id,
    a.status,
    a.completed_at,
    a.completion_latitude,
    a.completion_longitude,
    ar.status as request_status
FROM assignments a
LEFT JOIN assistance_requests ar ON a.request_id = ar.id
WHERE a.id = '4bff26bb-cfa7-44af-ba5b-03bd8d447253';

-- 2. Simulate marking assignment as completed (what the app should do)
UPDATE assignments 
SET 
    status = 'completed',
    completed_at = NOW(),
    completion_latitude = 22.2949717,
    completion_longitude = 73.362085,
    updated_at = NOW()
WHERE id = '4bff26bb-cfa7-44af-ba5b-03bd8d447253';

-- 3. Update the linked assistance request status
UPDATE assistance_requests 
SET status = 'completed'
WHERE id = 'c422e2f7-6792-4523-80da-49ce67663a36';

-- 4. Verify completion state
SELECT 
    'After completion:' as test_phase,
    a.id,
    a.status,
    a.completed_at,
    a.completion_latitude,
    a.completion_longitude,
    ar.status as request_status
FROM assignments a
LEFT JOIN assistance_requests ar ON a.request_id = ar.id
WHERE a.id = '4bff26bb-cfa7-44af-ba5b-03bd8d447253';

-- 5. Check if volunteer has any remaining active assignments
SELECT 
    'Volunteer remaining assignments:' as check_type,
    COUNT(*) as active_count
FROM assignments 
WHERE volunteer_id = 'a81c0e62-4bec-4552-bca3-b158c6afa790'
AND status IN ('pending', 'accepted', 'in_progress');
