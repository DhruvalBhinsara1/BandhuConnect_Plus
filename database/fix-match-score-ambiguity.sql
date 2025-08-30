-- Fix match_score column ambiguity in auto-assignment function
-- This replaces the problematic function with a corrected version

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
    
    -- Extract coordinates from request location (handle NULL location)
    IF v_request.location IS NOT NULL THEN
        SELECT ST_Y(v_request.location::geometry), ST_X(v_request.location::geometry) 
        INTO v_request_lat, v_request_lng;
    ELSE
        v_request_lat := 0.0;
        v_request_lng := 0.0;
    END IF;
    
    -- Determine required skills based on simplified request type
    v_required_skills := CASE v_request.type
        WHEN 'lost_person' THEN ARRAY['search_rescue', 'crowd_management', 'communication', 'local_knowledge']
        WHEN 'medical' THEN ARRAY['medical', 'first_aid', 'healthcare', 'emergency']
        WHEN 'guidance' THEN ARRAY['local_knowledge', 'tour_guide', 'navigation', 'language']
        WHEN 'sanitation' THEN ARRAY['cleaning', 'sanitation', 'maintenance', 'hygiene']
        WHEN 'crowd_management' THEN ARRAY['crowd_management', 'security', 'communication']
        WHEN 'emergency' THEN ARRAY['emergency', 'first_aid', 'crisis_management', 'medical']
        WHEN 'general' THEN ARRAY['general', 'assistance', 'support']
        ELSE ARRAY['general', 'assistance', 'support']
    END;
    
    -- Find best matching volunteer with scoring (using CTE to avoid ambiguity)
    WITH volunteer_scores AS (
        SELECT 
            p.id as volunteer_id,
            p.name,
            p.phone,
            p.skills,
            p.volunteer_status,
            COALESCE(p.rating, 0.0) as rating,
            COALESCE(ST_Distance(p.location, v_request.location), 0) as distance_meters,
            -- Calculate comprehensive match score
            (
                -- Skill match score (40% weight)
                CASE 
                    WHEN p.skills IS NULL THEN 0.3
                    WHEN p.skills && v_required_skills THEN 
                        LEAST(1.0, (
                            SELECT COUNT(*) * 1.0 / GREATEST(array_length(v_required_skills, 1), 1)
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
                
                -- Distance score (30% weight) - handle NULL locations
                CASE 
                    WHEN p.location IS NULL OR v_request.location IS NULL THEN 0.5
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
            AND (p.location IS NULL OR v_request.location IS NULL OR 
                 ST_DWithin(p.location, v_request.location, p_max_distance_meters))
            -- Prevent double assignment: exclude volunteers already assigned to pending/active requests
            AND NOT EXISTS (
                SELECT 1 FROM assignments a 
                JOIN assistance_requests ar ON a.request_id = ar.id
                WHERE a.volunteer_id = p.id 
                AND ar.status IN ('assigned', 'in_progress')
                AND a.status IN ('pending', 'accepted', 'in_progress')
            )
    )
    SELECT * INTO v_best_volunteer FROM volunteer_scores
    WHERE calculated_match_score >= p_min_match_score
    ORDER BY calculated_match_score DESC, 
             CASE WHEN volunteer_status = 'available' THEN 0 ELSE 1 END,
             distance_meters
    LIMIT 1;
    
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
    
    -- Create notification for volunteer (only if notifications table exists)
    BEGIN
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
                'auto_assigned', true,
                'match_score', v_best_volunteer.calculated_match_score
            ),
            NOW()
        );
    EXCEPTION
        WHEN others THEN
            -- Ignore notification errors, assignment still succeeds
            NULL;
    END;
    
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
