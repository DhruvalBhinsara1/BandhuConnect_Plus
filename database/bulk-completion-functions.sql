-- Bulk Completion Functions for BandhuConnect+
-- Provides safe bulk operations for marking requests as completed

-- Function to mark all assistance requests as completed (Admin only)
CREATE OR REPLACE FUNCTION mark_all_requests_completed()
RETURNS TABLE (
    updated_count INTEGER,
    updated_request_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    request_ids UUID[];
    update_count INTEGER;
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    -- Get all non-completed request IDs
    SELECT ARRAY_AGG(id) INTO request_ids
    FROM assistance_requests
    WHERE status NOT IN ('completed', 'cancelled');

    -- Update all pending/assigned/in_progress requests to completed
    UPDATE assistance_requests 
    SET 
        status = 'completed',
        updated_at = NOW()
    WHERE status NOT IN ('completed', 'cancelled');

    GET DIAGNOSTICS update_count = ROW_COUNT;

    -- Also update related assignments to completed
    UPDATE assignments 
    SET 
        status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE request_id = ANY(request_ids) 
    AND status NOT IN ('completed', 'cancelled');

    RETURN QUERY SELECT update_count, COALESCE(request_ids, ARRAY[]::UUID[]);
END;
$$;

-- Function to mark requests as completed by type (Admin only)
CREATE OR REPLACE FUNCTION mark_requests_completed_by_type(
    p_request_type request_type
)
RETURNS TABLE (
    updated_count INTEGER,
    updated_request_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    request_ids UUID[];
    update_count INTEGER;
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    -- Get request IDs of specified type
    SELECT ARRAY_AGG(id) INTO request_ids
    FROM assistance_requests
    WHERE type = p_request_type 
    AND status NOT IN ('completed', 'cancelled');

    -- Update requests of specified type to completed
    UPDATE assistance_requests 
    SET 
        status = 'completed',
        updated_at = NOW()
    WHERE type = p_request_type 
    AND status NOT IN ('completed', 'cancelled');

    GET DIAGNOSTICS update_count = ROW_COUNT;

    -- Update related assignments
    UPDATE assignments 
    SET 
        status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE request_id = ANY(request_ids) 
    AND status NOT IN ('completed', 'cancelled');

    RETURN QUERY SELECT update_count, COALESCE(request_ids, ARRAY[]::UUID[]);
END;
$$;

-- Function to mark requests as completed by priority (Admin only)
CREATE OR REPLACE FUNCTION mark_requests_completed_by_priority(
    p_priority priority_level
)
RETURNS TABLE (
    updated_count INTEGER,
    updated_request_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    request_ids UUID[];
    update_count INTEGER;
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    -- Get request IDs of specified priority
    SELECT ARRAY_AGG(id) INTO request_ids
    FROM assistance_requests
    WHERE priority = p_priority 
    AND status NOT IN ('completed', 'cancelled');

    -- Update requests of specified priority to completed
    UPDATE assistance_requests 
    SET 
        status = 'completed',
        updated_at = NOW()
    WHERE priority = p_priority 
    AND status NOT IN ('completed', 'cancelled');

    GET DIAGNOSTICS update_count = ROW_COUNT;

    -- Update related assignments
    UPDATE assignments 
    SET 
        status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE request_id = ANY(request_ids) 
    AND status NOT IN ('completed', 'cancelled');

    RETURN QUERY SELECT update_count, COALESCE(request_ids, ARRAY[]::UUID[]);
END;
$$;

-- Function to get completion statistics (Admin only)
CREATE OR REPLACE FUNCTION get_completion_stats()
RETURNS TABLE (
    total_requests INTEGER,
    pending_requests INTEGER,
    assigned_requests INTEGER,
    in_progress_requests INTEGER,
    completed_requests INTEGER,
    cancelled_requests INTEGER,
    completion_percentage DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_requests,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::INTEGER as pending_requests,
        COUNT(CASE WHEN status = 'assigned' THEN 1 END)::INTEGER as assigned_requests,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END)::INTEGER as in_progress_requests,
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::INTEGER as completed_requests,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::INTEGER as cancelled_requests,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(CASE WHEN status = 'completed' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 2)
            ELSE 0.00
        END as completion_percentage
    FROM assistance_requests;
END;
$$;

-- Grant execute permissions to authenticated users (RLS will handle admin check)
GRANT EXECUTE ON FUNCTION mark_all_requests_completed() TO authenticated;
GRANT EXECUTE ON FUNCTION mark_requests_completed_by_type(request_type) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_requests_completed_by_priority(priority_level) TO authenticated;
GRANT EXECUTE ON FUNCTION get_completion_stats() TO authenticated;
