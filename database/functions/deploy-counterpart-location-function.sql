-- Deploy get_counterpart_location function for bi-directional location visibility
-- This function is required for users to see their assigned counterpart's location

-- Drop existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS get_counterpart_location();

CREATE OR REPLACE FUNCTION get_counterpart_location()
RETURNS TABLE (
    user_id UUID,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    accuracy DOUBLE PRECISION,
    speed DOUBLE PRECISION,
    bearing DOUBLE PRECISION,
    last_updated TIMESTAMPTZ,
    minutes_ago INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
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
            (a.volunteer_id = auth.uid() AND ar.user_id = ul.user_id) OR
            -- If current user is pilgrim, get volunteer's location  
            (ar.user_id = auth.uid() AND a.volunteer_id = ul.user_id)
        )
    )
    ORDER BY ul.last_updated DESC
    LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_counterpart_location() TO authenticated;

-- Test the function works for both users
SELECT 'Testing get_counterpart_location function:' as section;

-- Test as pilgrim (should return volunteer location)
SELECT 'Test results:' as test_section;
SELECT * FROM get_counterpart_location();

-- Verify user_locations table has data
SELECT 'Current user_locations data:' as section;
SELECT 
    ul.user_id,
    u.name,
    p.role,
    ul.latitude,
    ul.longitude,
    ul.is_active,
    ul.last_updated,
    EXTRACT(EPOCH FROM (NOW() - ul.last_updated))::INTEGER / 60 as minutes_ago
FROM user_locations ul
JOIN users u ON ul.user_id = u.id
JOIN profiles p ON ul.user_id = p.id
WHERE ul.is_active = true
ORDER BY ul.last_updated DESC;
