-- Function to get pilgrim request statistics
CREATE OR REPLACE FUNCTION get_pilgrim_request_stats(
    p_pilgrim_id UUID
) RETURNS TABLE (
    total_requests INTEGER,
    pending_requests INTEGER,
    assigned_requests INTEGER,
    completed_requests INTEGER,
    total_volunteers INTEGER,
    average_response_time INTERVAL,
    average_completion_time INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT ar.id)::INTEGER as total_requests,
        COUNT(DISTINCT CASE WHEN ar.status = 'pending' THEN ar.id END)::INTEGER as pending_requests,
        COUNT(DISTINCT CASE WHEN ar.status IN ('assigned', 'in_progress') THEN ar.id END)::INTEGER as assigned_requests,
        COUNT(DISTINCT CASE WHEN ar.status = 'completed' THEN ar.id END)::INTEGER as completed_requests,
        COUNT(DISTINCT a.volunteer_id)::INTEGER as total_volunteers,
        AVG(a.accepted_at - a.assigned_at) FILTER (WHERE a.accepted_at IS NOT NULL) as average_response_time,
        AVG(a.completed_at - a.started_at) FILTER (WHERE a.completed_at IS NOT NULL) as average_completion_time
    FROM assistance_requests ar
    LEFT JOIN assignments a ON ar.id = a.request_id
    WHERE ar.user_id = p_pilgrim_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get real-time request summary
CREATE OR REPLACE FUNCTION get_request_summary(
    p_request_id UUID
) RETURNS TABLE (
    request_status TEXT,
    volunteer_name TEXT,
    volunteer_rating DECIMAL,
    assignment_duration INTERVAL,
    distance_km DOUBLE PRECISION,
    last_location_update TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ar.status::TEXT as request_status,
        p.name as volunteer_name,
        p.rating as volunteer_rating,
        CASE 
            WHEN a.completed_at IS NOT NULL THEN a.completed_at - a.started_at
            WHEN a.started_at IS NOT NULL THEN NOW() - a.started_at
            ELSE NULL
        END as assignment_duration,
        calculate_distance(
            ST_Y(ar.location::geometry), 
            ST_X(ar.location::geometry),
            ul.latitude,
            ul.longitude
        ) as distance_km,
        ul.last_updated as last_location_update
    FROM assistance_requests ar
    LEFT JOIN assignments a ON ar.id = a.request_id
    LEFT JOIN profiles p ON a.volunteer_id = p.id
    LEFT JOIN user_locations ul ON p.id = ul.user_id
    WHERE ar.id = p_request_id
    AND (ul.is_active = true OR ul.is_active IS NULL)
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get assignment metrics for pilgrims
CREATE OR REPLACE FUNCTION get_pilgrim_assignment_metrics(
    p_pilgrim_id UUID,
    p_days_back INTEGER DEFAULT 30
) RETURNS TABLE (
    successful_assignments INTEGER,
    cancelled_assignments INTEGER,
    average_wait_time INTERVAL,
    average_completion_time INTERVAL,
    favorite_volunteers TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH assignment_stats AS (
        SELECT
            COUNT(*) FILTER (WHERE a.status = 'completed')::INTEGER as completed,
            COUNT(*) FILTER (WHERE a.status = 'cancelled')::INTEGER as cancelled,
            AVG(a.accepted_at - ar.created_at) FILTER (WHERE a.accepted_at IS NOT NULL) as avg_wait,
            AVG(a.completed_at - a.started_at) FILTER (WHERE a.completed_at IS NOT NULL) as avg_completion,
            array_agg(DISTINCT p.name) FILTER (
                WHERE a.status = 'completed' 
                AND (a.rating IS NULL OR a.rating >= 4)
            ) as favorite_vols
        FROM assistance_requests ar
        LEFT JOIN assignments a ON ar.id = a.request_id
        LEFT JOIN profiles p ON a.volunteer_id = p.id
        WHERE ar.user_id = p_pilgrim_id
        AND ar.created_at >= NOW() - (p_days_back || ' days')::INTERVAL
    )
    SELECT
        completed,
        cancelled,
        avg_wait,
        avg_completion,
        favorite_vols
    FROM assignment_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_pilgrim_request_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_request_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_pilgrim_assignment_metrics TO authenticated;
