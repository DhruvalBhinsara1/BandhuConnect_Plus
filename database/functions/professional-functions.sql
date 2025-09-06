-- =============================================================================
-- BandhuConnect+ Professional Database Functions
-- Version: 2.1.0
-- Last Updated: September 6, 2025
-- Description: Production-ready database functions for platform operations
-- =============================================================================

-- =============================================================================
-- LOCATION MANAGEMENT FUNCTIONS
-- =============================================================================

-- Function to safely update user location with validation
CREATE OR REPLACE FUNCTION update_user_location_safe(
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_accuracy DECIMAL DEFAULT NULL,
    p_altitude DECIMAL DEFAULT NULL,
    p_heading DECIMAL DEFAULT NULL,
    p_speed DECIMAL DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    location_id UUID;
    result_json JSON;
BEGIN
    -- Validate input coordinates
    IF p_latitude IS NULL OR p_longitude IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Latitude and longitude are required',
            'error_code', 'INVALID_COORDINATES'
        );
    END IF;
    
    IF p_latitude NOT BETWEEN -90 AND 90 OR p_longitude NOT BETWEEN -180 AND 180 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid coordinate values',
            'error_code', 'OUT_OF_RANGE'
        );
    END IF;
    
    -- Validate user exists and is authenticated
    IF auth.uid() IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not authenticated',
            'error_code', 'NOT_AUTHENTICATED'
        );
    END IF;
    
    -- Update or insert location
    INSERT INTO user_locations (
        user_id, latitude, longitude, accuracy, altitude, heading, speed, is_active, last_updated
    ) VALUES (
        auth.uid(), p_latitude, p_longitude, p_accuracy, p_altitude, p_heading, p_speed, true, NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        accuracy = EXCLUDED.accuracy,
        altitude = EXCLUDED.altitude,
        heading = EXCLUDED.heading,
        speed = EXCLUDED.speed,
        is_active = true,
        last_updated = NOW()
    RETURNING id INTO location_id;
    
    -- Return success response
    RETURN json_build_object(
        'success', true,
        'location_id', location_id,
        'message', 'Location updated successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to update location: ' || SQLERRM,
            'error_code', 'UPDATE_FAILED'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate distance between two geographic points
CREATE OR REPLACE FUNCTION calculate_distance_meters(
    lat1 DECIMAL, 
    lon1 DECIMAL, 
    lat2 DECIMAL, 
    lon2 DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    -- Validate coordinates
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
        RETURN NULL;
    END IF;
    
    IF lat1 NOT BETWEEN -90 AND 90 OR lat2 NOT BETWEEN -90 AND 90 OR
       lon1 NOT BETWEEN -180 AND 180 OR lon2 NOT BETWEEN -180 AND 180 THEN
        RETURN NULL;
    END IF;
    
    -- Calculate distance using PostGIS
    RETURN ST_Distance(
        ST_Point(lon1, lat1)::geography,
        ST_Point(lon2, lat2)::geography
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- ASSIGNMENT MANAGEMENT FUNCTIONS
-- =============================================================================

-- Function to find available volunteers near a location
CREATE OR REPLACE FUNCTION find_nearby_volunteers(
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_max_distance_meters INTEGER DEFAULT 5000,
    p_required_skills TEXT[] DEFAULT NULL,
    p_request_type request_type DEFAULT 'general'
) RETURNS TABLE (
    volunteer_id UUID,
    volunteer_name TEXT,
    volunteer_email TEXT,
    distance_meters DECIMAL,
    volunteer_skills TEXT[],
    volunteer_rating DECIMAL,
    last_location_update TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.email,
        calculate_distance_meters(p_latitude, p_longitude, ul.latitude, ul.longitude),
        p.skills,
        p.rating,
        ul.last_updated
    FROM profiles p
    JOIN user_locations ul ON p.id = ul.user_id
    WHERE p.role = 'volunteer'
      AND p.volunteer_status = 'available'
      AND p.is_active = true
      AND ul.is_active = true
      AND calculate_distance_meters(p_latitude, p_longitude, ul.latitude, ul.longitude) <= p_max_distance_meters
      AND (p_required_skills IS NULL OR p.skills && p_required_skills) -- Skills overlap check
      AND ul.last_updated > NOW() - INTERVAL '30 minutes' -- Recent location update
      -- Exclude volunteers with recent assignments
      AND NOT EXISTS (
          SELECT 1 FROM assignments a 
          WHERE a.volunteer_id = p.id 
          AND a.status IN ('pending', 'accepted', 'in_progress')
      )
    ORDER BY 
        -- Prioritize by skills match, then distance, then rating
        CASE WHEN p_required_skills IS NOT NULL AND p.skills && p_required_skills THEN 0 ELSE 1 END,
        calculate_distance_meters(p_latitude, p_longitude, ul.latitude, ul.longitude),
        p.rating DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically assign volunteer to request
CREATE OR REPLACE FUNCTION auto_assign_volunteer(
    p_request_id UUID,
    p_assignment_strategy TEXT DEFAULT 'nearest_available'
) RETURNS JSON AS $$
DECLARE
    request_record assistance_requests%ROWTYPE;
    selected_volunteer_id UUID;
    assignment_id UUID;
    result_json JSON;
BEGIN
    -- Get request details
    SELECT * INTO request_record 
    FROM assistance_requests 
    WHERE id = p_request_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Request not found or not in pending status',
            'error_code', 'REQUEST_NOT_AVAILABLE'
        );
    END IF;
    
    -- Find best volunteer based on strategy
    IF p_assignment_strategy = 'nearest_available' THEN
        SELECT volunteer_id INTO selected_volunteer_id
        FROM find_nearby_volunteers(
            ST_Y(request_record.location::geometry),
            ST_X(request_record.location::geometry),
            5000, -- 5km radius
            NULL, -- No specific skills required for general strategy
            request_record.type
        )
        LIMIT 1;
    ELSIF p_assignment_strategy = 'best_match' THEN
        -- Strategy prioritizing skills and rating
        SELECT volunteer_id INTO selected_volunteer_id
        FROM find_nearby_volunteers(
            ST_Y(request_record.location::geometry),
            ST_X(request_record.location::geometry),
            10000, -- Larger radius for better matches
            CASE request_record.type
                WHEN 'medical' THEN ARRAY['medical', 'first_aid']
                WHEN 'navigation' THEN ARRAY['guide', 'local_knowledge']
                WHEN 'emergency' THEN ARRAY['emergency_response', 'crisis_management']
                ELSE NULL
            END,
            request_record.type
        )
        ORDER BY volunteer_rating DESC
        LIMIT 1;
    END IF;
    
    -- Check if volunteer was found
    IF selected_volunteer_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No available volunteers found for this request',
            'error_code', 'NO_VOLUNTEERS_AVAILABLE'
        );
    END IF;
    
    -- Create assignment
    INSERT INTO assignments (
        request_id,
        volunteer_id,
        status,
        assignment_method,
        assigned_at
    ) VALUES (
        p_request_id,
        selected_volunteer_id,
        'pending',
        'auto',
        NOW()
    ) RETURNING id INTO assignment_id;
    
    -- Update request status
    UPDATE assistance_requests 
    SET status = 'assigned', 
        assignment_method = 'auto',
        updated_at = NOW()
    WHERE id = p_request_id;
    
    -- Update volunteer status
    UPDATE profiles 
    SET volunteer_status = 'busy', 
        updated_at = NOW()
    WHERE id = selected_volunteer_id;
    
    RETURN json_build_object(
        'success', true,
        'assignment_id', assignment_id,
        'volunteer_id', selected_volunteer_id,
        'strategy_used', p_assignment_strategy,
        'message', 'Volunteer assigned successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Assignment failed: ' || SQLERRM,
            'error_code', 'ASSIGNMENT_FAILED'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ANALYTICS AND REPORTING FUNCTIONS
-- =============================================================================

-- Function to get platform analytics
CREATE OR REPLACE FUNCTION get_platform_analytics(
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMPTZ DEFAULT NOW()
) RETURNS JSON AS $$
DECLARE
    total_requests INTEGER;
    completed_requests INTEGER;
    auto_assignments INTEGER;
    manual_assignments INTEGER;
    avg_response_time INTERVAL;
    success_rate DECIMAL;
    analytics_json JSON;
BEGIN
    -- Calculate key metrics
    SELECT COUNT(*) INTO total_requests
    FROM assistance_requests
    WHERE created_at BETWEEN p_start_date AND p_end_date;
    
    SELECT COUNT(*) INTO completed_requests
    FROM assistance_requests
    WHERE created_at BETWEEN p_start_date AND p_end_date
    AND status = 'completed';
    
    SELECT COUNT(*) INTO auto_assignments
    FROM assignments a
    JOIN assistance_requests ar ON a.request_id = ar.id
    WHERE ar.created_at BETWEEN p_start_date AND p_end_date
    AND a.assignment_method = 'auto';
    
    SELECT COUNT(*) INTO manual_assignments
    FROM assignments a
    JOIN assistance_requests ar ON a.request_id = ar.id
    WHERE ar.created_at BETWEEN p_start_date AND p_end_date
    AND a.assignment_method = 'manual';
    
    -- Calculate average response time
    SELECT AVG(a.assigned_at - ar.created_at) INTO avg_response_time
    FROM assignments a
    JOIN assistance_requests ar ON a.request_id = ar.id
    WHERE ar.created_at BETWEEN p_start_date AND p_end_date
    AND a.assigned_at IS NOT NULL;
    
    -- Calculate success rate
    IF total_requests > 0 THEN
        success_rate := (completed_requests::DECIMAL / total_requests) * 100;
    ELSE
        success_rate := 0;
    END IF;
    
    -- Build analytics JSON
    analytics_json := json_build_object(
        'period', json_build_object(
            'start_date', p_start_date,
            'end_date', p_end_date
        ),
        'requests', json_build_object(
            'total', total_requests,
            'completed', completed_requests,
            'success_rate_percent', ROUND(success_rate, 2)
        ),
        'assignments', json_build_object(
            'auto_assignments', auto_assignments,
            'manual_assignments', manual_assignments,
            'total_assignments', auto_assignments + manual_assignments
        ),
        'performance', json_build_object(
            'avg_response_time_minutes', EXTRACT(EPOCH FROM avg_response_time) / 60,
            'success_rate', success_rate
        ),
        'generated_at', NOW()
    );
    
    RETURN analytics_json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- MAINTENANCE AND CLEANUP FUNCTIONS
-- =============================================================================

-- Function to clean up old inactive records
CREATE OR REPLACE FUNCTION cleanup_inactive_data(
    p_days_old INTEGER DEFAULT 30
) RETURNS JSON AS $$
DECLARE
    cleaned_locations INTEGER;
    cleaned_notifications INTEGER;
    result_json JSON;
BEGIN
    -- Clean up old location updates (keep most recent per user)
    WITH recent_locations AS (
        SELECT DISTINCT ON (user_id) user_id, id
        FROM user_locations
        ORDER BY user_id, last_updated DESC
    )
    DELETE FROM user_locations
    WHERE id NOT IN (SELECT id FROM recent_locations)
    AND last_updated < NOW() - (p_days_old || ' days')::INTERVAL;
    
    GET DIAGNOSTICS cleaned_locations = ROW_COUNT;
    
    -- Clean up old read notifications
    DELETE FROM notifications
    WHERE is_read = true
    AND created_at < NOW() - (p_days_old || ' days')::INTERVAL;
    
    GET DIAGNOSTICS cleaned_notifications = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'cleaned_locations', cleaned_locations,
        'cleaned_notifications', cleaned_notifications,
        'cleanup_date', NOW(),
        'retention_days', p_days_old
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Cleanup failed: ' || SQLERRM,
            'error_code', 'CLEANUP_FAILED'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- SECURITY AND VALIDATION FUNCTIONS
-- =============================================================================

-- Function to validate user permissions for operation
CREATE OR REPLACE FUNCTION check_user_permission(
    p_operation TEXT,
    p_target_user_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    current_user_role user_role;
    target_user_role user_role;
BEGIN
    -- Get current user role
    SELECT role INTO current_user_role
    FROM profiles
    WHERE id = auth.uid();
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Admin can do everything
    IF current_user_role = 'admin' THEN
        RETURN true;
    END IF;
    
    -- Check specific operation permissions
    CASE p_operation
        WHEN 'view_all_users' THEN
            RETURN current_user_role = 'admin';
        WHEN 'modify_user' THEN
            -- Users can modify themselves, admins can modify anyone
            RETURN current_user_role = 'admin' OR auth.uid() = p_target_user_id;
        WHEN 'assign_volunteer' THEN
            RETURN current_user_role IN ('admin', 'volunteer');
        WHEN 'create_request' THEN
            RETURN current_user_role IN ('pilgrim', 'admin');
        WHEN 'view_analytics' THEN
            RETURN current_user_role = 'admin';
        ELSE
            RETURN false;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- NOTIFICATION FUNCTIONS
-- =============================================================================

-- Function to create system notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_title TEXT,
    p_body TEXT,
    p_type TEXT,
    p_data JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id,
        title,
        body,
        type,
        data,
        is_read,
        created_at
    ) VALUES (
        p_user_id,
        p_title,
        p_body,
        p_type,
        p_data,
        false,
        NOW()
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- END OF FUNCTIONS
-- =============================================================================

-- Grant necessary permissions for function execution
GRANT EXECUTE ON FUNCTION update_user_location_safe TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_distance_meters TO authenticated;
GRANT EXECUTE ON FUNCTION find_nearby_volunteers TO authenticated;
GRANT EXECUTE ON FUNCTION auto_assign_volunteer TO authenticated;
GRANT EXECUTE ON FUNCTION get_platform_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_permission TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
