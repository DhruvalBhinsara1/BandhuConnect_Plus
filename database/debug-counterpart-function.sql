-- Debug why get_counterpart_location() returns no results despite active assignment and location data

-- Step 1: Test the function directly
SELECT 'Direct function test:' as section;
SELECT * FROM get_counterpart_location();

-- Step 2: Check the assignment logic step by step
SELECT 'Active assignments:' as section;
SELECT 
    a.id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    a.assigned,
    ar.user_id as request_user_id
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
WHERE a.status IN ('pending', 'accepted', 'in_progress')
AND a.assigned = true;

-- Step 3: Check user_locations with assignment matching
SELECT 'Location data with assignment check:' as section;
SELECT 
    ul.user_id,
    ul.latitude,
    ul.longitude,
    ul.is_active,
    ul.last_updated,
    'Assignment exists:' as assignment_check,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM assignments a 
            JOIN assistance_requests ar ON a.request_id = ar.id 
            WHERE a.status IN ('pending', 'accepted', 'in_progress')
            AND a.assigned = true
            AND (
                (a.volunteer_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44' AND ar.user_id = ul.user_id) OR
                (ar.user_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44' AND a.volunteer_id = ul.user_id)
            )
        ) THEN 'YES - Should be returned'
        ELSE 'NO - Will be filtered out'
    END as should_return_for_pilgrim,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM assignments a 
            JOIN assistance_requests ar ON a.request_id = ar.id 
            WHERE a.status IN ('pending', 'accepted', 'in_progress')
            AND a.assigned = true
            AND (
                (a.volunteer_id = 'a81c0e62-4bec-4552-bca3-b158c6afa790' AND ar.user_id = ul.user_id) OR
                (ar.user_id = 'a81c0e62-4bec-4552-bca3-b158c6afa790' AND a.volunteer_id = ul.user_id)
            )
        ) THEN 'YES - Should be returned'
        ELSE 'NO - Will be filtered out'
    END as should_return_for_volunteer
FROM user_locations ul
WHERE ul.is_active = true
AND ul.user_id IN ('5595c83a-55ef-426e-a10e-28ff9b70ce44', 'a81c0e62-4bec-4552-bca3-b158c6afa790')
ORDER BY ul.last_updated DESC;

-- Step 4: Test the exact query from the function manually
SELECT 'Manual query test (as pilgrim 5595c83a):' as section;
SELECT 
    ul.user_id,
    ul.latitude,
    ul.longitude,
    ul.accuracy,
    ul.speed,
    ul.heading as bearing,
    ul.last_updated,
    EXTRACT(EPOCH FROM (NOW() - ul.last_updated))::INTEGER / 60 as minutes_ago
FROM user_locations ul
WHERE ul.is_active = true
AND EXISTS (
    SELECT 1 FROM assignments a 
    JOIN assistance_requests ar ON a.request_id = ar.id 
    WHERE a.status IN ('pending', 'accepted', 'in_progress')
    AND a.assigned = true
    AND (
        -- If current user is volunteer, get pilgrim's location
        (a.volunteer_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44' AND ar.user_id = ul.user_id) OR
        -- If current user is pilgrim, get volunteer's location  
        (ar.user_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44' AND a.volunteer_id = ul.user_id)
    )
)
ORDER BY ul.last_updated DESC
LIMIT 1;
