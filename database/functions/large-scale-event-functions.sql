-- =============================================================================
-- BandhuConnect+ Enhanced Auto-Assignment for Large-Scale Events
-- Version: 2.4.0
-- Last Updated: September 9, 2025
-- Description: Robust matching algorithms for high-volume events like Mahakumbh
-- =============================================================================

-- =============================================================================
-- LARGE-SCALE EVENT AUTO-ASSIGNMENT FUNCTIONS
-- =============================================================================

-- Enhanced volunteer finder with adaptive criteria for high-demand scenarios
CREATE OR REPLACE FUNCTION find_nearest_volunteers(
    target_lat DECIMAL,
    target_lng DECIMAL,
    max_distance_meters INTEGER DEFAULT 15000,
    required_skills TEXT[],
    limit_count INTEGER DEFAULT 20,
    event_mode BOOLEAN DEFAULT FALSE
) RETURNS TABLE (
    volunteer_id UUID,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    skills TEXT[],
    volunteer_status volunteer_status,
    rating DECIMAL,
    distance_meters DECIMAL,
    current_assignments INTEGER,
    availability_score DECIMAL,
    priority_tier INTEGER
) AS $$
DECLARE
    max_radius INTEGER;
    min_rating DECIMAL;
    max_assignments INTEGER;
BEGIN
    -- Adaptive parameters based on event mode
    IF event_mode THEN
        -- For large-scale events, be much more flexible
        max_radius := GREATEST(max_distance_meters, 50000); -- At least 50km for events
        min_rating := 0.0; -- Accept any rating during events
        max_assignments := 5; -- Allow more assignments per volunteer
    ELSE
        max_radius := max_distance_meters;
        min_rating := 2.0; -- Normal minimum rating
        max_assignments := 3; -- Standard assignment limit
    END IF;

    RETURN QUERY
    WITH volunteer_data AS (
        SELECT 
            p.id,
            p.name,
            p.email,
            p.phone,
            p.skills,
            p.volunteer_status,
            COALESCE(p.rating, 3.0) as rating,
            COALESCE(
                calculate_distance_meters(target_lat, target_lng, ul.latitude, ul.longitude),
                8000 -- Default reasonable distance if location unavailable
            ) as distance_meters,
            COALESCE(
                (SELECT COUNT(*) FROM assignments a 
                 WHERE a.volunteer_id = p.id 
                 AND a.status IN ('pending', 'accepted', 'in_progress')), 
                0
            ) as current_assignments,
            -- Calculate availability score based on multiple factors
            CASE 
                WHEN p.volunteer_status = 'available' THEN 1.0
                WHEN p.volunteer_status = 'busy' AND event_mode THEN 0.7 -- More lenient during events
                WHEN p.volunteer_status = 'busy' THEN 0.4
                WHEN p.volunteer_status = 'offline' AND event_mode THEN 0.5 -- Include offline during events
                WHEN p.volunteer_status = 'offline' THEN 0.2
                ELSE 0.1
            END as availability_score,
            -- Priority tier for assignment order
            CASE 
                WHEN p.volunteer_status = 'available' AND COALESCE(p.rating, 3.0) >= 4.0 THEN 1 -- Top tier
                WHEN p.volunteer_status = 'available' THEN 2 -- Good volunteers
                WHEN p.volunteer_status = 'busy' AND event_mode AND COALESCE(p.rating, 3.0) >= 4.0 THEN 2 -- High-rated busy volunteers during events
                WHEN p.volunteer_status = 'busy' AND event_mode THEN 3 -- Regular busy volunteers during events
                WHEN p.volunteer_status = 'offline' AND event_mode THEN 4 -- Offline volunteers during events
                ELSE 5 -- Last resort
            END as priority_tier
        FROM profiles p
        LEFT JOIN user_locations ul ON p.id = ul.user_id AND ul.is_active = true
        WHERE p.role = 'volunteer'
            AND p.is_active = true
            AND COALESCE(p.rating, 3.0) >= min_rating
            AND (
                ul.latitude IS NULL OR 
                calculate_distance_meters(target_lat, target_lng, ul.latitude, ul.longitude) <= max_radius
            )
            AND (
                SELECT COUNT(*) FROM assignments a 
                WHERE a.volunteer_id = p.id 
                AND a.status IN ('pending', 'accepted', 'in_progress')
            ) <= max_assignments
            -- Include more volunteer statuses during event mode
            AND (
                NOT event_mode AND p.volunteer_status IN ('available', 'busy') OR
                event_mode AND p.volunteer_status IN ('available', 'busy', 'offline')
            )
    ),
    skill_matched AS (
        SELECT 
            *,
            -- Enhanced skill matching score
            CASE 
                WHEN array_length(required_skills, 1) IS NULL OR array_length(required_skills, 1) = 0 THEN 0.8 -- No specific skills required
                WHEN skills && required_skills THEN 1.0 -- Direct skill match
                WHEN EXISTS (
                    SELECT 1 FROM unnest(required_skills) rs(skill) 
                    WHERE EXISTS (
                        SELECT 1 FROM unnest(skills) vs(v_skill) 
                        WHERE vs.v_skill ILIKE '%' || rs.skill || '%' 
                        OR rs.skill ILIKE '%' || vs.v_skill || '%'
                    )
                ) THEN 0.6 -- Partial skill match
                ELSE 0.4 -- No skill match but willing to help
            END as skill_match_score
        FROM volunteer_data
    )
    SELECT 
        sm.id,
        sm.name,
        sm.email,
        sm.phone,
        sm.skills,
        sm.volunteer_status,
        sm.rating,
        sm.distance_meters,
        sm.current_assignments,
        sm.availability_score,
        sm.priority_tier
    FROM skill_matched sm
    ORDER BY 
        -- Multi-tier ordering for optimal assignment
        sm.priority_tier ASC,                    -- First by priority tier
        sm.skill_match_score DESC,               -- Then by skill relevance
        sm.availability_score DESC,              -- Then by availability
        sm.current_assignments ASC,              -- Prefer less loaded volunteers
        sm.distance_meters ASC,                  -- Finally by distance
        sm.rating DESC                           -- Break ties with rating
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced auto-assignment function with event-mode capabilities
CREATE OR REPLACE FUNCTION auto_assign_volunteer_enhanced(
    p_request_id UUID,
    p_max_distance INTEGER DEFAULT 15000,
    p_min_score DECIMAL DEFAULT 0.25,
    p_event_mode BOOLEAN DEFAULT FALSE
) RETURNS TABLE (
    success BOOLEAN,
    assignment_id UUID,
    volunteer_id UUID,
    volunteer_name VARCHAR(255),
    match_score DECIMAL,
    distance_km DECIMAL,
    message TEXT,
    assignment_tier TEXT
) AS $$
DECLARE
    v_request assistance_requests%ROWTYPE;
    v_volunteers RECORD;
    v_best_volunteer RECORD;
    v_assignment_id UUID;
    v_final_score DECIMAL;
    v_adaptive_threshold DECIMAL;
    v_assignment_tier TEXT;
    v_request_location geometry;
    volunteer_count INTEGER;
BEGIN
    -- Get request details
    SELECT * INTO v_request FROM assistance_requests WHERE id = p_request_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::VARCHAR(255), 
                           0::DECIMAL, 0::DECIMAL, 'Request not found or not pending'::TEXT, 'NONE'::TEXT;
        RETURN;
    END IF;

    -- Extract coordinates from request location
    BEGIN
        v_request_location := v_request.location::geometry;
        IF v_request_location IS NULL THEN
            RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::VARCHAR(255), 
                               0::DECIMAL, 0::DECIMAL, 'Invalid request location'::TEXT, 'NONE'::TEXT;
            RETURN;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::VARCHAR(255), 
                               0::DECIMAL, 0::DECIMAL, 'Could not parse request location'::TEXT, 'NONE'::TEXT;
            RETURN;
    END;

    -- Adaptive threshold based on event mode and request priority
    IF p_event_mode THEN
        v_adaptive_threshold := CASE 
            WHEN v_request.priority = 'high' THEN 0.10    -- Very low threshold for emergencies
            WHEN v_request.priority = 'medium' THEN 0.15  -- Low threshold for medium priority
            ELSE 0.20                                      -- Still low threshold for regular requests
        END;
    ELSE
        v_adaptive_threshold := p_min_score;
    END IF;

    -- Get required skills based on request type
    WITH request_skills AS (
        SELECT CASE v_request.type
            WHEN 'medical' THEN ARRAY['medical', 'first_aid', 'health', 'nurse', 'doctor']
            WHEN 'navigation' THEN ARRAY['guide', 'local_knowledge', 'directions', 'navigation']
            WHEN 'emergency' THEN ARRAY['emergency_response', 'crisis_management', 'first_aid']
            WHEN 'food' THEN ARRAY['food_service', 'cooking', 'distribution']
            WHEN 'accommodation' THEN ARRAY['accommodation', 'hospitality', 'lodging']
            WHEN 'transportation' THEN ARRAY['transportation', 'driving', 'logistics']
            ELSE ARRAY[]::TEXT[]
        END as skills
    ),
    volunteer_candidates AS (
        -- Find volunteers with multiple search strategies
        SELECT * FROM find_nearest_volunteers(
            ST_Y(v_request_location),
            ST_X(v_request_location),
            p_max_distance,
            (SELECT skills FROM request_skills),
            30, -- Increased candidate pool
            p_event_mode
        )
    ),
    scored_volunteers AS (
        SELECT 
            vc.*,
            -- Comprehensive scoring algorithm
            (
                -- Skill matching (30% weight, reduced for event flexibility)
                CASE 
                    WHEN array_length((SELECT skills FROM request_skills), 1) IS NULL THEN 0.8
                    WHEN vc.skills && (SELECT skills FROM request_skills) THEN 1.0
                    WHEN EXISTS (
                        SELECT 1 FROM unnest((SELECT skills FROM request_skills)) rs(skill) 
                        WHERE EXISTS (
                            SELECT 1 FROM unnest(vc.skills) vs(v_skill) 
                            WHERE vs.v_skill ILIKE '%' || rs.skill || '%'
                        )
                    ) THEN 0.6
                    ELSE 0.4
                END * 0.30 +
                
                -- Distance scoring (20% weight, reduced for events)
                CASE 
                    WHEN vc.distance_meters <= 1000 THEN 1.0
                    WHEN vc.distance_meters <= 5000 THEN 0.8
                    WHEN vc.distance_meters <= 15000 THEN 0.6
                    WHEN vc.distance_meters <= 30000 THEN 0.4
                    WHEN vc.distance_meters <= 50000 THEN 0.2
                    ELSE 0.1
                END * 0.20 +
                
                -- Availability and workload (35% weight, increased importance)
                (vc.availability_score * 
                 (1.0 - LEAST(vc.current_assignments * 0.15, 0.6)) -- Workload penalty
                ) * 0.35 +
                
                -- Rating and reliability (15% weight)
                (LEAST(vc.rating / 5.0, 1.0)) * 0.15
                
            ) AS calculated_score,
            
            -- Determine assignment tier
            CASE vc.priority_tier
                WHEN 1 THEN 'OPTIMAL'
                WHEN 2 THEN 'GOOD'
                WHEN 3 THEN 'ACCEPTABLE'
                WHEN 4 THEN 'EMERGENCY_FALLBACK'
                ELSE 'LAST_RESORT'
            END AS tier
        FROM volunteer_candidates vc
    )
    SELECT 
        sv.volunteer_id,
        sv.name,
        sv.calculated_score,
        sv.distance_meters,
        sv.tier,
        sv.current_assignments
    INTO v_best_volunteer
    FROM scored_volunteers sv
    WHERE sv.calculated_score >= v_adaptive_threshold
    ORDER BY sv.calculated_score DESC, sv.current_assignments ASC
    LIMIT 1;

    -- Check if we found a suitable volunteer
    IF v_best_volunteer.volunteer_id IS NULL THEN
        -- Get total volunteer count for diagnostic message
        SELECT COUNT(*) INTO volunteer_count FROM find_nearest_volunteers(
            ST_Y(v_request_location),
            ST_X(v_request_location),
            CASE WHEN p_event_mode THEN 100000 ELSE p_max_distance END, -- Expand search in event mode
            ARRAY[]::TEXT[],
            100,
            p_event_mode
        );
        
        RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::VARCHAR(255), 
                           0::DECIMAL, 0::DECIMAL, 
                           FORMAT('No suitable volunteers found. Searched %s volunteers within %skm. Consider manual assignment or expanding criteria.', 
                                  volunteer_count, p_max_distance/1000)::TEXT, 
                           'NONE'::TEXT;
        RETURN;
    END IF;

    -- Create assignment
    INSERT INTO assignments (request_id, volunteer_id, status, assignment_method, assigned_at, created_at)
    VALUES (p_request_id, v_best_volunteer.volunteer_id, 'pending', 'auto_enhanced', NOW(), NOW())
    RETURNING id INTO v_assignment_id;
    
    -- Update request status
    UPDATE assistance_requests 
    SET status = 'assigned', 
        assignment_method = 'auto_enhanced',
        updated_at = NOW()
    WHERE id = p_request_id;
    
    -- Update volunteer status strategically
    UPDATE profiles 
    SET volunteer_status = CASE 
        WHEN v_best_volunteer.current_assignments >= 2 THEN 'busy'::volunteer_status
        WHEN volunteer_status = 'offline' THEN 'busy'::volunteer_status -- Activate offline volunteers
        ELSE volunteer_status
    END,
    updated_at = NOW()
    WHERE id = v_best_volunteer.volunteer_id;
    
    RETURN QUERY SELECT true, v_assignment_id, v_best_volunteer.volunteer_id, 
                       v_best_volunteer.name::VARCHAR(255), 
                       v_best_volunteer.calculated_score, 
                       (v_best_volunteer.distance_meters / 1000.0)::DECIMAL,
                       FORMAT('Successfully assigned to %s (%s tier, %.1f%% match)', 
                              v_best_volunteer.name, v_best_volunteer.tier, 
                              v_best_volunteer.calculated_score * 100)::TEXT,
                       v_best_volunteer.tier::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Intelligent batch assignment for high-volume scenarios
CREATE OR REPLACE FUNCTION batch_auto_assign_enhanced(
    p_max_assignments INTEGER DEFAULT 50,
    p_event_mode BOOLEAN DEFAULT FALSE,
    p_priority_filter TEXT DEFAULT 'all' -- 'high', 'medium', 'low', 'all'
) RETURNS TABLE (
    request_id UUID,
    success BOOLEAN,
    volunteer_name VARCHAR(255),
    match_score DECIMAL,
    assignment_tier TEXT,
    message TEXT
) AS $$
DECLARE
    v_request RECORD;
    v_assignment_result RECORD;
    v_processed INTEGER := 0;
    v_successful INTEGER := 0;
    v_priority_clause TEXT;
BEGIN
    -- Build priority filter clause
    v_priority_clause := CASE p_priority_filter
        WHEN 'high' THEN 'AND priority = ''high'''
        WHEN 'medium' THEN 'AND priority = ''medium'''
        WHEN 'low' THEN 'AND priority = ''low'''
        ELSE ''
    END;
    
    -- Process pending requests with intelligent ordering
    FOR v_request IN EXECUTE FORMAT('
        SELECT id, title, type, priority, created_at
        FROM assistance_requests 
        WHERE status = ''pending''
        %s
        ORDER BY 
            CASE priority 
                WHEN ''high'' THEN 1 
                WHEN ''medium'' THEN 2 
                WHEN ''low'' THEN 3 
            END,
            created_at ASC
        LIMIT %s', v_priority_clause, p_max_assignments)
    LOOP
        -- Try enhanced auto-assignment
        SELECT * INTO v_assignment_result
        FROM auto_assign_volunteer_enhanced(
            v_request.id, 
            CASE WHEN p_event_mode THEN 50000 ELSE 15000 END, -- Larger radius for events
            CASE WHEN p_event_mode THEN 0.10 ELSE 0.25 END,   -- Lower threshold for events
            p_event_mode
        )
        LIMIT 1;
        
        IF v_assignment_result.success THEN
            v_successful := v_successful + 1;
        END IF;
        
        RETURN QUERY SELECT v_request.id, v_assignment_result.success, 
                           v_assignment_result.volunteer_name, v_assignment_result.match_score,
                           v_assignment_result.assignment_tier, v_assignment_result.message;
        
        v_processed := v_processed + 1;
        
        -- Brief pause to prevent system overload
        PERFORM pg_sleep(0.05);
    END LOOP;
    
    -- Log batch completion
    INSERT INTO admin_logs (action, details, created_at)
    VALUES ('batch_auto_assign_enhanced', 
            FORMAT('Processed %s requests, %s successful assignments (%.1f%% success rate) in %s mode', 
                   v_processed, v_successful, 
                   CASE WHEN v_processed > 0 THEN (v_successful::DECIMAL / v_processed * 100) ELSE 0 END,
                   CASE WHEN p_event_mode THEN 'EVENT' ELSE 'NORMAL' END),
            NOW());
    
    IF v_processed = 0 THEN
        RETURN QUERY SELECT NULL::UUID, false, NULL::VARCHAR(255), 0::DECIMAL, 
                           'NONE'::TEXT, 'No pending requests found with specified criteria'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dynamic volunteer availability expansion for emergency situations
CREATE OR REPLACE FUNCTION emergency_volunteer_activation(
    p_event_area_lat DECIMAL,
    p_event_area_lng DECIMAL,
    p_radius_km INTEGER DEFAULT 100,
    p_activation_message TEXT DEFAULT 'Emergency volunteer activation for large-scale event'
) RETURNS TABLE (
    activated_volunteers INTEGER,
    notified_volunteers INTEGER,
    expanded_capacity INTEGER,
    message TEXT
) AS $$
DECLARE
    v_activated INTEGER := 0;
    v_notified INTEGER := 0;
    v_capacity_increase INTEGER := 0;
BEGIN
    -- Activate offline volunteers in the area
    UPDATE profiles SET 
        volunteer_status = 'available'::volunteer_status,
        updated_at = NOW()
    WHERE role = 'volunteer'
        AND is_active = true
        AND volunteer_status = 'offline'
        AND EXISTS (
            SELECT 1 FROM user_locations ul 
            WHERE ul.user_id = profiles.id 
            AND calculate_distance_meters(p_event_area_lat, p_event_area_lng, ul.latitude, ul.longitude) <= (p_radius_km * 1000)
        );
    
    GET DIAGNOSTICS v_activated = ROW_COUNT;
    
    -- Create notifications for all volunteers in the area
    INSERT INTO notifications (user_id, title, message, type, created_at)
    SELECT p.id, 
           'Emergency Volunteer Activation',
           p_activation_message || ' - Your help is needed in your area.',
           'emergency',
           NOW()
    FROM profiles p
    JOIN user_locations ul ON p.id = ul.user_id
    WHERE p.role = 'volunteer'
        AND p.is_active = true
        AND calculate_distance_meters(p_event_area_lat, p_event_area_lng, ul.latitude, ul.longitude) <= (p_radius_km * 1000);
    
    GET DIAGNOSTICS v_notified = ROW_COUNT;
    
    -- Calculate capacity increase (allow more assignments per volunteer)
    UPDATE profiles SET 
        metadata = COALESCE(metadata, '{}'::jsonb) || 
                  jsonb_build_object('max_assignments', 5, 'event_mode', true, 'activated_at', NOW())
    WHERE role = 'volunteer'
        AND is_active = true
        AND EXISTS (
            SELECT 1 FROM user_locations ul 
            WHERE ul.user_id = profiles.id 
            AND calculate_distance_meters(p_event_area_lat, p_event_area_lng, ul.latitude, ul.longitude) <= (p_radius_km * 1000)
        );
    
    GET DIAGNOSTICS v_capacity_increase = ROW_COUNT;
    
    -- Log emergency activation
    INSERT INTO admin_logs (action, details, created_at)
    VALUES ('emergency_volunteer_activation', 
            FORMAT('Activated %s offline volunteers, notified %s total volunteers, expanded capacity for %s volunteers within %skm of event location', 
                   v_activated, v_notified, v_capacity_increase, p_radius_km),
            NOW());
    
    RETURN QUERY SELECT v_activated, v_notified, v_capacity_increase,
                       FORMAT('Emergency activation complete: %s volunteers activated, %s notified, capacity expanded for %s volunteers', 
                              v_activated, v_notified, v_capacity_increase)::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Event statistics and volunteer utilization monitoring
CREATE OR REPLACE FUNCTION get_event_volunteer_stats(
    p_event_area_lat DECIMAL,
    p_event_area_lng DECIMAL,
    p_radius_km INTEGER DEFAULT 50
) RETURNS JSON AS $$
DECLARE
    result_json JSON;
    total_volunteers INTEGER;
    available_volunteers INTEGER;
    busy_volunteers INTEGER;
    offline_volunteers INTEGER;
    overloaded_volunteers INTEGER;
    avg_assignments DECIMAL;
    coverage_percentage DECIMAL;
BEGIN
    -- Calculate volunteer statistics in the event area
    WITH volunteer_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE volunteer_status = 'available') as available,
            COUNT(*) FILTER (WHERE volunteer_status = 'busy') as busy,
            COUNT(*) FILTER (WHERE volunteer_status = 'offline') as offline,
            AVG((SELECT COUNT(*) FROM assignments a WHERE a.volunteer_id = p.id AND a.status IN ('pending', 'accepted', 'in_progress'))) as avg_assignments
        FROM profiles p
        LEFT JOIN user_locations ul ON p.id = ul.user_id
        WHERE p.role = 'volunteer'
            AND p.is_active = true
            AND (ul.user_id IS NULL OR 
                 calculate_distance_meters(p_event_area_lat, p_event_area_lng, ul.latitude, ul.longitude) <= (p_radius_km * 1000))
    ),
    overload_stats AS (
        SELECT COUNT(*) as overloaded
        FROM profiles p
        WHERE p.role = 'volunteer'
            AND p.is_active = true
            AND (SELECT COUNT(*) FROM assignments a WHERE a.volunteer_id = p.id AND a.status IN ('pending', 'accepted', 'in_progress')) >= 3
            AND EXISTS (
                SELECT 1 FROM user_locations ul 
                WHERE ul.user_id = p.id 
                AND calculate_distance_meters(p_event_area_lat, p_event_area_lng, ul.latitude, ul.longitude) <= (p_radius_km * 1000)
            )
    )
    SELECT vs.total, vs.available, vs.busy, vs.offline, vs.avg_assignments, os.overloaded
    INTO total_volunteers, available_volunteers, busy_volunteers, offline_volunteers, avg_assignments, overloaded_volunteers
    FROM volunteer_stats vs, overload_stats os;
    
    -- Calculate coverage percentage (available + partially available busy volunteers)
    coverage_percentage := CASE 
        WHEN total_volunteers > 0 THEN 
            ((available_volunteers + (busy_volunteers * 0.3)) / total_volunteers * 100)
        ELSE 0 
    END;
    
    result_json := json_build_object(
        'event_area', json_build_object(
            'center_lat', p_event_area_lat,
            'center_lng', p_event_area_lng,
            'radius_km', p_radius_km
        ),
        'volunteer_distribution', json_build_object(
            'total_volunteers', total_volunteers,
            'available', available_volunteers,
            'busy', busy_volunteers,
            'offline', offline_volunteers,
            'overloaded', overloaded_volunteers
        ),
        'utilization_metrics', json_build_object(
            'average_assignments_per_volunteer', ROUND(avg_assignments, 2),
            'coverage_percentage', ROUND(coverage_percentage, 1),
            'capacity_status', CASE 
                WHEN coverage_percentage >= 70 THEN 'GOOD'
                WHEN coverage_percentage >= 40 THEN 'MODERATE'
                WHEN coverage_percentage >= 20 THEN 'LOW'
                ELSE 'CRITICAL'
            END
        ),
        'recommendations', json_build_object(
            'expand_search_radius', CASE WHEN coverage_percentage < 30 THEN true ELSE false END,
            'activate_offline_volunteers', CASE WHEN coverage_percentage < 40 THEN true ELSE false END,
            'increase_assignment_limits', CASE WHEN coverage_percentage < 20 THEN true ELSE false END,
            'emergency_recruitment', CASE WHEN coverage_percentage < 15 THEN true ELSE false END
        ),
        'generated_at', NOW()
    );
    
    RETURN result_json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
