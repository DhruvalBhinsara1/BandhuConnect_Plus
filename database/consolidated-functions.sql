-- BandhuConnect+ Consolidated Database Functions
-- Essential functions for all apps (Pilgrim, Volunteer, Admin)
-- Updated: 2025-09-04

-- =============================================
-- AUTO-ASSIGNMENT FUNCTIONS
-- =============================================

-- Enhanced auto-assignment with skill matching and workload balancing
CREATE OR REPLACE FUNCTION auto_assign_request_enhanced(
    p_request_id UUID,
    p_max_distance_km DECIMAL DEFAULT 15.0,
    p_min_match_score DECIMAL DEFAULT 0.6
)
RETURNS TABLE (
    success BOOLEAN,
    assignment_id UUID,
    volunteer_id UUID,
    volunteer_name VARCHAR(255),
    match_score DECIMAL,
    distance_km DECIMAL,
    message TEXT
) AS $$
DECLARE
    v_request assistance_requests%ROWTYPE;
    v_best_volunteer RECORD;
    v_assignment_id UUID;
    v_current_assignments INTEGER;
BEGIN
    -- Get request details
    SELECT * INTO v_request FROM assistance_requests WHERE id = p_request_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::VARCHAR(255), 0::DECIMAL, 0::DECIMAL, 'Request not found'::TEXT;
        RETURN;
    END IF;
    
    -- Find best available volunteer with skill matching
    SELECT 
        p.id,
        p.name,
        p.skills,
        p.rating,
        ST_Distance(p.location, v_request.location) / 1000.0 as distance_km,
        -- Calculate match score based on skills, rating, and distance
        CASE 
            WHEN p.skills && ARRAY[v_request.type::TEXT] THEN 0.5
            ELSE 0.0
        END +
        CASE 
            WHEN p.rating > 4.0 THEN 0.3
            WHEN p.rating > 3.0 THEN 0.2
            ELSE 0.1
        END +
        CASE 
            WHEN ST_Distance(p.location, v_request.location) / 1000.0 < 5.0 THEN 0.2
            WHEN ST_Distance(p.location, v_request.location) / 1000.0 < 10.0 THEN 0.1
            ELSE 0.0
        END as match_score,
        (SELECT COUNT(*) FROM assignments a WHERE a.volunteer_id = p.id AND a.status IN ('pending', 'accepted', 'in_progress')) as current_assignments
    INTO v_best_volunteer
    FROM profiles p
    WHERE p.role = 'volunteer'
        AND p.volunteer_status = 'available'
        AND p.is_active = true
        AND p.location IS NOT NULL
        AND ST_Distance(p.location, v_request.location) / 1000.0 <= p_max_distance_km
        AND (SELECT COUNT(*) FROM assignments a WHERE a.volunteer_id = p.id AND a.status IN ('pending', 'accepted', 'in_progress')) < 3
    ORDER BY match_score DESC, current_assignments ASC, ST_Distance(p.location, v_request.location) ASC
    LIMIT 1;
    
    IF NOT FOUND OR v_best_volunteer.match_score < p_min_match_score THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::VARCHAR(255), 
                           COALESCE(v_best_volunteer.match_score, 0::DECIMAL), 
                           COALESCE(v_best_volunteer.distance_km, 0::DECIMAL),
                           'No suitable volunteers found with sufficient match score'::TEXT;
        RETURN;
    END IF;
    
    -- Create assignment
    INSERT INTO assignments (request_id, volunteer_id, status, assigned_at)
    VALUES (p_request_id, v_best_volunteer.id, 'pending', NOW())
    RETURNING id INTO v_assignment_id;
    
    -- Update request status
    UPDATE assistance_requests 
    SET status = 'assigned', updated_at = NOW()
    WHERE id = p_request_id;
    
    -- Update volunteer status
    UPDATE profiles 
    SET volunteer_status = CASE 
        WHEN v_best_volunteer.current_assignments >= 2 THEN 'busy'::volunteer_status
        ELSE volunteer_status
    END,
    updated_at = NOW()
    WHERE id = v_best_volunteer.id;
    
    RETURN QUERY SELECT true, v_assignment_id, v_best_volunteer.id, v_best_volunteer.name::VARCHAR(255), 
                       v_best_volunteer.match_score, v_best_volunteer.distance_km,
                       'Successfully assigned to volunteer'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Batch auto-assignment function
CREATE OR REPLACE FUNCTION batch_auto_assign_requests(
    p_max_assignments INTEGER DEFAULT 10,
    p_min_match_score DECIMAL DEFAULT 0.6
)
RETURNS TABLE (
    request_id UUID,
    success BOOLEAN,
    volunteer_name VARCHAR(255),
    match_score DECIMAL,
    message TEXT
) AS $$
DECLARE
    v_request RECORD;
    v_assignment_result RECORD;
    v_processed INTEGER := 0;
BEGIN
    -- Process pending requests in priority order
    FOR v_request IN 
        SELECT id, title, type, priority 
        FROM assistance_requests 
        WHERE status = 'pending'
        ORDER BY 
            CASE priority 
                WHEN 'high' THEN 1 
                WHEN 'medium' THEN 2 
                WHEN 'low' THEN 3 
            END,
            created_at ASC
        LIMIT p_max_assignments
    LOOP
        -- Try to auto-assign this request
        SELECT * INTO v_assignment_result
        FROM auto_assign_request_enhanced(v_request.id, 15.0, p_min_match_score)
        LIMIT 1;
        
        RETURN QUERY SELECT v_request.id, v_assignment_result.success, 
                           v_assignment_result.volunteer_name, v_assignment_result.match_score,
                           v_assignment_result.message;
        
        v_processed := v_processed + 1;
        
        -- Small delay to prevent overwhelming the system
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    IF v_processed = 0 THEN
        RETURN QUERY SELECT NULL::UUID, false, NULL::VARCHAR(255), 0::DECIMAL, 'No pending requests found'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- BULK COMPLETION FUNCTIONS
-- =============================================

-- Check admin permissions
CREATE OR REPLACE FUNCTION check_admin_permissions(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id AND role = 'admin' AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get completion statistics
CREATE OR REPLACE FUNCTION get_completion_stats()
RETURNS TABLE (
    total_requests INTEGER,
    pending_requests INTEGER,
    in_progress_requests INTEGER,
    completed_requests INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM assistance_requests) as total_requests,
        (SELECT COUNT(*)::INTEGER FROM assistance_requests WHERE status = 'pending') as pending_requests,
        (SELECT COUNT(*)::INTEGER FROM assistance_requests WHERE status IN ('assigned', 'in_progress')) as in_progress_requests,
        (SELECT COUNT(*)::INTEGER FROM assistance_requests WHERE status = 'completed') as completed_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bulk mark requests as completed
CREATE OR REPLACE FUNCTION bulk_mark_requests_completed(admin_user_id UUID)
RETURNS TABLE (
    success BOOLEAN,
    updated_count INTEGER,
    message TEXT
) AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    -- Check admin permissions
    IF NOT check_admin_permissions(admin_user_id) THEN
        RETURN QUERY SELECT false, 0, 'Access denied: Admin privileges required'::TEXT;
        RETURN;
    END IF;
    
    -- Update all non-completed requests
    UPDATE assistance_requests 
    SET status = 'completed', updated_at = NOW()
    WHERE status IN ('pending', 'assigned', 'in_progress');
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    -- Update related assignments
    UPDATE assignments 
    SET status = 'completed', completed_at = NOW(), updated_at = NOW()
    WHERE status IN ('pending', 'accepted', 'in_progress');
    
    -- Reset volunteer statuses
    UPDATE profiles 
    SET volunteer_status = 'available', updated_at = NOW()
    WHERE role = 'volunteer' AND volunteer_status = 'busy';
    
    RETURN QUERY SELECT true, v_updated_count, 
                       FORMAT('Successfully marked %s requests as completed', v_updated_count)::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- LOCATION TRACKING FUNCTIONS
-- =============================================

-- Update user location with upsert
CREATE OR REPLACE FUNCTION update_user_location(
    p_user_id UUID,
    p_latitude NUMERIC(10,8),
    p_longitude NUMERIC(11,8),
    p_accuracy NUMERIC(10,2) DEFAULT NULL,
    p_altitude NUMERIC(10,2) DEFAULT NULL,
    p_heading NUMERIC(5,2) DEFAULT NULL,
    p_speed NUMERIC(10,2) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO user_locations (
        user_id, latitude, longitude, accuracy, altitude, heading, speed, last_updated
    ) VALUES (
        p_user_id, p_latitude, p_longitude, p_accuracy, p_altitude, p_heading, p_speed, NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        accuracy = EXCLUDED.accuracy,
        altitude = EXCLUDED.altitude,
        heading = EXCLUDED.heading,
        speed = EXCLUDED.speed,
        last_updated = NOW(),
        is_active = true;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get active locations for real-time tracking
CREATE OR REPLACE FUNCTION get_active_locations()
RETURNS TABLE (
    user_id UUID,
    user_name VARCHAR(255),
    user_role VARCHAR(255),
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8),
    accuracy NUMERIC(10,2),
    last_updated TIMESTAMP WITH TIME ZONE,
    is_stale BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ul.user_id,
        p.name::VARCHAR(255) as user_name,
        p.role::VARCHAR(255) as user_role,
        ul.latitude,
        ul.longitude,
        ul.accuracy,
        ul.last_updated,
        (ul.last_updated < NOW() - INTERVAL '2 minutes') as is_stale
    FROM user_locations ul
    JOIN profiles p ON ul.user_id = p.id
    WHERE ul.is_active = true
    AND p.is_active = true
    ORDER BY ul.last_updated DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- NOTIFICATION FUNCTIONS
-- =============================================

-- Create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_title VARCHAR(255),
    p_body TEXT,
    p_type VARCHAR(50),
    p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, title, body, type, data)
    VALUES (p_user_id, p_title, p_body, p_type, p_data)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ANALYTICS FUNCTIONS
-- =============================================

-- Get system dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
    total_users INTEGER,
    active_volunteers INTEGER,
    total_requests_today INTEGER,
    completed_requests_today INTEGER,
    pending_requests INTEGER,
    active_assignments INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM profiles WHERE is_active = true) as total_users,
        (SELECT COUNT(*)::INTEGER FROM profiles WHERE role = 'volunteer' AND volunteer_status = 'available') as active_volunteers,
        (SELECT COUNT(*)::INTEGER FROM assistance_requests WHERE DATE(created_at) = CURRENT_DATE) as total_requests_today,
        (SELECT COUNT(*)::INTEGER FROM assistance_requests WHERE DATE(updated_at) = CURRENT_DATE AND status = 'completed') as completed_requests_today,
        (SELECT COUNT(*)::INTEGER FROM assistance_requests WHERE status = 'pending') as pending_requests,
        (SELECT COUNT(*)::INTEGER FROM assignments WHERE status IN ('pending', 'accepted', 'in_progress')) as active_assignments;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
