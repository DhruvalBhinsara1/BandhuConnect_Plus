-- Auto Assignment Helper Functions for BandhuConnect+

-- Function to extract coordinates from geography point
CREATE OR REPLACE FUNCTION get_coordinates_from_geography(geo_point GEOGRAPHY)
RETURNS TABLE (latitude DOUBLE PRECISION, longitude DOUBLE PRECISION) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ST_Y(geo_point::geometry) as latitude,
        ST_X(geo_point::geometry) as longitude;
END;
$$ LANGUAGE plpgsql;

-- Enhanced auto assignment function with scoring algorithm
CREATE OR REPLACE FUNCTION auto_assign_request_enhanced(
    p_request_id UUID,
    p_max_distance_meters INTEGER DEFAULT 10000,
    p_min_match_score DECIMAL DEFAULT 0.6
)
RETURNS TABLE (
    success BOOLEAN,
    assigned_volunteer_id UUID,
    assignment_id UUID,
    match_score DECIMAL,
    message TEXT
) AS $$
DECLARE
    v_request assistance_requests%ROWTYPE;
    v_request_lat DOUBLE PRECISION;
    v_request_lng DOUBLE PRECISION;
    v_best_volunteer RECORD;
    v_assignment_id UUID;
    v_required_skills TEXT[];
BEGIN
    -- Get request details
    SELECT * INTO v_request 
    FROM assistance_requests 
    WHERE id = p_request_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID, 0.0::DECIMAL, 'Request not found or not pending';
        RETURN;
    END IF;
    
    -- Extract coordinates from request location
    SELECT ST_Y(v_request.location::geometry), ST_X(v_request.location::geometry) 
    INTO v_request_lat, v_request_lng;
    
    -- Determine required skills based on request type
    v_required_skills := CASE v_request.type
        WHEN 'medical' THEN ARRAY['medical', 'emergency']
        WHEN 'guidance' THEN ARRAY['guidance', 'general']
        WHEN 'emergency' THEN ARRAY['emergency', 'medical']
        WHEN 'crowd_management' THEN ARRAY['crowd_management', 'general']
        WHEN 'lost_person' THEN ARRAY['lost_person', 'guidance', 'general']
        WHEN 'sanitation' THEN ARRAY['sanitation', 'general']
        WHEN 'general' THEN ARRAY['general']
        ELSE ARRAY['general']
    END;
    
    -- Find best matching volunteer with scoring
    SELECT * INTO v_best_volunteer FROM (
        SELECT 
            p.id as volunteer_id,
            p.name,
            p.phone,
            p.skills,
            p.volunteer_status,
            p.rating,
            ST_Distance(p.location, v_request.location) as distance_meters,
            -- Calculate comprehensive match score
            (
                -- Skill match score (40% weight)
                CASE 
                    WHEN p.skills IS NULL THEN 0.3
                    WHEN p.skills && v_required_skills THEN 
                        LEAST(1.0, (
                            SELECT COUNT(*) * 1.0 / array_length(v_required_skills, 1)
                            FROM unnest(v_required_skills) skill
                            WHERE EXISTS (
                                SELECT 1 FROM unnest(p.skills) vol_skill 
                                WHERE vol_skill ILIKE '%' || skill || '%'
                            )
                        ) + 
                        (
                            SELECT COUNT(*) * 0.1
                            FROM unnest(p.skills) vol_skill
                            WHERE vol_skill ILIKE '%' || v_request.type || '%'
                        ))
                    ELSE 0.3
                END * 0.4 +
                
                -- Distance score (30% weight)
                CASE 
                    WHEN ST_Distance(p.location, v_request.location) <= 1000 THEN 1.0
                    WHEN ST_Distance(p.location, v_request.location) <= 3000 THEN 0.8
                    WHEN ST_Distance(p.location, v_request.location) <= 5000 THEN 0.6
                    WHEN ST_Distance(p.location, v_request.location) <= 10000 THEN 0.4
                    ELSE 0.2
                END * 0.3 +
                
                -- Availability score (20% weight)
                (CASE p.volunteer_status
                    WHEN 'available' THEN 1.0
                    WHEN 'busy' THEN 0.3
                    WHEN 'offline' THEN 0.1
                    ELSE 0.5
                END + COALESCE(p.rating, 0.0) / 5.0 * 0.2) * 0.2 +
                
                -- Priority urgency bonus (10% weight)
                CASE v_request.priority
                    WHEN 'high' THEN 1.0
                    WHEN 'medium' THEN 0.7
                    WHEN 'low' THEN 0.4
                    ELSE 0.5
                END * 0.1
            ) as calculated_match_score
        FROM profiles p
        WHERE p.role = 'volunteer'
            AND p.is_active = true
            AND p.volunteer_status IN ('available', 'busy')
            AND (p.location IS NULL OR ST_DWithin(p.location, v_request.location, p_max_distance_meters))
        ORDER BY calculated_match_score DESC, 
                 CASE WHEN p.volunteer_status = 'available' THEN 0 ELSE 1 END,
                 ST_Distance(p.location, v_request.location)
        LIMIT 1
    ) scored_volunteers
    WHERE calculated_match_score >= p_min_match_score;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID, 0.0::DECIMAL, 
            'No suitable volunteers found with minimum match score of ' || (p_min_match_score * 100)::TEXT || '%';
        RETURN;
    END IF;
    
    -- Create assignment
    INSERT INTO assignments (
        id,
        request_id,
        volunteer_id,
        status,
        assigned_at
    ) VALUES (
        gen_random_uuid(),
        p_request_id,
        v_best_volunteer.volunteer_id,
        'pending',
        NOW()
    ) RETURNING id INTO v_assignment_id;
    
    -- Update request status
    UPDATE assistance_requests 
    SET status = 'assigned', updated_at = NOW()
    WHERE id = p_request_id;
    
    -- Update volunteer status to busy
    UPDATE profiles 
    SET volunteer_status = 'busy', updated_at = NOW()
    WHERE id = v_best_volunteer.volunteer_id;
    
    -- Create notification for volunteer
    INSERT INTO notifications (
        user_id,
        title,
        body,
        type,
        data,
        created_at
    ) VALUES (
        v_best_volunteer.volunteer_id,
        'New Task Assignment',
        'You have been automatically assigned to: ' || v_request.title,
        'assignment',
        json_build_object(
            'request_id', p_request_id,
            'assignment_id', v_assignment_id,
            'priority', v_request.priority,
            'auto_assigned', true
        ),
        NOW()
    );
    
    -- Return success result
    RETURN QUERY SELECT 
        TRUE, 
        v_best_volunteer.volunteer_id, 
        v_assignment_id, 
        v_best_volunteer.calculated_match_score,
        'Successfully auto-assigned to ' || v_best_volunteer.name || ' (Match: ' || 
        ROUND(v_best_volunteer.calculated_match_score * 100, 1)::TEXT || '%)';
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-assign multiple pending requests
CREATE OR REPLACE FUNCTION batch_auto_assign_requests(
    p_max_assignments INTEGER DEFAULT 10,
    p_min_match_score DECIMAL DEFAULT 0.6
)
RETURNS TABLE (
    request_id UUID,
    success BOOLEAN,
    assigned_volunteer_id UUID,
    assignment_id UUID,
    match_score DECIMAL,
    message TEXT
) AS $$
DECLARE
    v_request_record RECORD;
    v_assignment_result RECORD;
    v_assignments_made INTEGER := 0;
BEGIN
    -- Process pending requests by priority and creation time
    FOR v_request_record IN 
        SELECT id, title, priority, created_at
        FROM assistance_requests 
        WHERE status = 'pending'
        ORDER BY 
            CASE priority 
                WHEN 'high' THEN 1 
                WHEN 'medium' THEN 2 
                WHEN 'low' THEN 3 
                ELSE 4 
            END,
            created_at ASC
        LIMIT p_max_assignments
    LOOP
        -- Try to auto-assign this request
        SELECT * INTO v_assignment_result
        FROM auto_assign_request_enhanced(
            v_request_record.id,
            10000, -- 10km max distance
            p_min_match_score
        );
        
        -- Return the result
        RETURN QUERY SELECT 
            v_request_record.id,
            v_assignment_result.success,
            v_assignment_result.assigned_volunteer_id,
            v_assignment_result.assignment_id,
            v_assignment_result.match_score,
            v_assignment_result.message;
        
        -- Count successful assignments
        IF v_assignment_result.success THEN
            v_assignments_made := v_assignments_made + 1;
        END IF;
        
        -- Add small delay to prevent overwhelming the system
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    -- Log batch assignment summary
    INSERT INTO notifications (
        user_id,
        title,
        body,
        type,
        data,
        created_at
    )
    SELECT 
        id,
        'Batch Auto-Assignment Complete',
        'Processed ' || p_max_assignments::TEXT || ' requests, made ' || v_assignments_made::TEXT || ' assignments',
        'system',
        json_build_object('batch_size', p_max_assignments, 'assignments_made', v_assignments_made),
        NOW()
    FROM profiles 
    WHERE role = 'admin' 
    LIMIT 1;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-assign high priority requests immediately
CREATE OR REPLACE FUNCTION trigger_auto_assign_high_priority()
RETURNS TRIGGER AS $$
BEGIN
    -- Only auto-assign high priority requests
    IF NEW.priority = 'high' AND NEW.status = 'pending' THEN
        -- Use pg_notify to trigger background auto-assignment
        PERFORM pg_notify('auto_assign_request', json_build_object(
            'request_id', NEW.id,
            'priority', NEW.priority,
            'type', NEW.type
        )::text);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for high priority auto-assignment
DROP TRIGGER IF EXISTS auto_assign_high_priority_trigger ON assistance_requests;
CREATE TRIGGER auto_assign_high_priority_trigger
    AFTER INSERT ON assistance_requests
    FOR EACH ROW
    EXECUTE FUNCTION trigger_auto_assign_high_priority();

-- Function to get auto-assignment statistics
CREATE OR REPLACE FUNCTION get_auto_assignment_stats(
    p_days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
    total_requests INTEGER,
    auto_assigned INTEGER,
    manual_assigned INTEGER,
    unassigned INTEGER,
    avg_match_score DECIMAL,
    success_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH assignment_stats AS (
        SELECT 
            ar.id,
            ar.status,
            a.id IS NOT NULL as has_assignment,
            CASE 
                WHEN n.data->>'auto_assigned' = 'true' THEN 'auto'
                WHEN a.id IS NOT NULL THEN 'manual'
                ELSE 'unassigned'
            END as assignment_type,
            COALESCE((n.data->>'match_score')::DECIMAL, 0) as match_score
        FROM assistance_requests ar
        LEFT JOIN assignments a ON ar.id = a.request_id
        LEFT JOIN notifications n ON a.volunteer_id = n.user_id 
            AND n.type = 'assignment' 
            AND n.data->>'request_id' = ar.id::text
        WHERE ar.created_at >= NOW() - INTERVAL '1 day' * p_days_back
    )
    SELECT 
        COUNT(*)::INTEGER as total_requests,
        COUNT(*) FILTER (WHERE assignment_type = 'auto')::INTEGER as auto_assigned,
        COUNT(*) FILTER (WHERE assignment_type = 'manual')::INTEGER as manual_assigned,
        COUNT(*) FILTER (WHERE assignment_type = 'unassigned')::INTEGER as unassigned,
        AVG(match_score) FILTER (WHERE assignment_type = 'auto') as avg_match_score,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                COUNT(*) FILTER (WHERE assignment_type IN ('auto', 'manual'))::DECIMAL / COUNT(*)::DECIMAL
            ELSE 0
        END as success_rate
    FROM assignment_stats;
END;
$$ LANGUAGE plpgsql;
