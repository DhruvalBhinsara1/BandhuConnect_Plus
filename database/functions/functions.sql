-- BandhuConnect+ Database Functions
-- Custom PostgreSQL functions for complex operations

-- =============================================
-- DISTANCE AND LOCATION FUNCTIONS
-- =============================================

-- Function to find nearest volunteers to a location
CREATE OR REPLACE FUNCTION find_nearest_volunteers(
    target_lat DECIMAL,
    target_lng DECIMAL,
    max_distance_meters INTEGER DEFAULT 10000,
    required_skills TEXT[] DEFAULT NULL,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    volunteer_id UUID,
    name VARCHAR,
    phone VARCHAR,
    skills TEXT[],
    volunteer_status volunteer_status,
    rating DECIMAL,
    distance_meters DECIMAL,
    latitude DECIMAL,
    longitude DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.phone,
        p.skills,
        p.volunteer_status,
        p.rating,
        ST_Distance(p.location, ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326))::DECIMAL as distance_meters,
        ST_Y(p.location::geometry)::DECIMAL as latitude,
        ST_X(p.location::geometry)::DECIMAL as longitude
    FROM profiles p
    WHERE p.role = 'volunteer'
        AND p.volunteer_status = 'available'
        AND p.is_active = true
        AND ST_DWithin(p.location, ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326), max_distance_meters)
        AND (required_skills IS NULL OR p.skills && required_skills)
    ORDER BY distance_meters
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update volunteer location and status
CREATE OR REPLACE FUNCTION update_volunteer_location(
    volunteer_id UUID,
    lat DECIMAL,
    lng DECIMAL,
    new_status volunteer_status DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update profile location
    UPDATE profiles 
    SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326),
        volunteer_status = COALESCE(new_status, volunteer_status),
        updated_at = NOW()
    WHERE id = volunteer_id AND role = 'volunteer';
    
    -- Insert location update record
    INSERT INTO location_updates (user_id, location, accuracy, created_at)
    VALUES (volunteer_id, ST_SetSRID(ST_MakePoint(lng, lat), 4326), 5.0, NOW());
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- REQUEST ASSIGNMENT FUNCTIONS
-- =============================================

-- Function to auto-assign request to best volunteer
CREATE OR REPLACE FUNCTION auto_assign_request(
    request_id UUID
)
RETURNS UUID AS $$
DECLARE
    request_record assistance_requests%ROWTYPE;
    best_volunteer_id UUID;
    assignment_id UUID;
BEGIN
    -- Get request details
    SELECT * INTO request_record FROM assistance_requests WHERE id = request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found';
    END IF;
    
    -- Find best volunteer based on location, skills, and rating
    SELECT volunteer_id INTO best_volunteer_id
    FROM find_nearest_volunteers(
        ST_Y(request_record.location::geometry),
        ST_X(request_record.location::geometry),
        15000, -- 15km radius
        ARRAY[request_record.type::TEXT]
    )
    ORDER BY rating DESC, distance_meters ASC
    LIMIT 1;
    
    IF best_volunteer_id IS NULL THEN
        RAISE EXCEPTION 'No available volunteers found';
    END IF;
    
    -- Create assignment
    INSERT INTO assignments (request_id, volunteer_id, status, assigned_at)
    VALUES (request_id, best_volunteer_id, 'pending', NOW())
    RETURNING id INTO assignment_id;
    
    -- Update request status
    UPDATE assistance_requests 
    SET status = 'assigned', updated_at = NOW()
    WHERE id = request_id;
    
    -- Update volunteer status to busy
    UPDATE profiles 
    SET volunteer_status = 'busy', updated_at = NOW()
    WHERE id = best_volunteer_id;
    
    RETURN assignment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to complete assignment and update ratings
CREATE OR REPLACE FUNCTION complete_assignment(
    assignment_id UUID,
    rating INTEGER DEFAULT NULL,
    feedback TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    assignment_record assignments%ROWTYPE;
    volunteer_id UUID;
BEGIN
    -- Get assignment details
    SELECT * INTO assignment_record FROM assignments WHERE id = assignment_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Assignment not found';
    END IF;
    
    volunteer_id := assignment_record.volunteer_id;
    
    -- Update assignment
    UPDATE assignments 
    SET status = 'completed',
        completed_at = NOW(),
        rating = complete_assignment.rating,
        feedback = complete_assignment.feedback,
        updated_at = NOW()
    WHERE id = assignment_id;
    
    -- Update request status
    UPDATE assistance_requests 
    SET status = 'completed', updated_at = NOW()
    WHERE id = assignment_record.request_id;
    
    -- Update volunteer status back to available
    UPDATE profiles 
    SET volunteer_status = 'available', updated_at = NOW()
    WHERE id = volunteer_id;
    
    -- Update volunteer rating if provided
    IF rating IS NOT NULL THEN
        UPDATE profiles 
        SET rating = (rating * total_ratings + complete_assignment.rating) / (total_ratings + 1),
            total_ratings = total_ratings + 1,
            updated_at = NOW()
        WHERE id = volunteer_id;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- NOTIFICATION FUNCTIONS
-- =============================================

-- Function to create notification for user
CREATE OR REPLACE FUNCTION create_notification(
    user_id UUID,
    title TEXT,
    body TEXT,
    notification_type TEXT,
    data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, title, body, type, data, created_at)
    VALUES (user_id, title, body, notification_type, data, NOW())
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to notify volunteers about new request
CREATE OR REPLACE FUNCTION notify_nearby_volunteers(
    request_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    request_record assistance_requests%ROWTYPE;
    volunteer_record RECORD;
    notification_count INTEGER := 0;
BEGIN
    -- Get request details
    SELECT * INTO request_record FROM assistance_requests WHERE id = request_id;
    
    -- Find nearby volunteers
    FOR volunteer_record IN
        SELECT volunteer_id, name, distance_meters
        FROM find_nearest_volunteers(
            ST_Y(request_record.location::geometry),
            ST_X(request_record.location::geometry),
            20000, -- 20km radius for notifications
            ARRAY[request_record.type::TEXT]
        )
    LOOP
        -- Create notification for each volunteer
        PERFORM create_notification(
            volunteer_record.volunteer_id,
            'New Request Available',
            'A new ' || request_record.type || ' request is available near you',
            'new_request',
            jsonb_build_object(
                'request_id', request_id,
                'distance_meters', volunteer_record.distance_meters,
                'priority', request_record.priority
            )
        );
        
        notification_count := notification_count + 1;
    END LOOP;
    
    RETURN notification_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ANALYTICS FUNCTIONS
-- =============================================

-- Function to get volunteer performance metrics
CREATE OR REPLACE FUNCTION get_volunteer_metrics(
    volunteer_id UUID,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_assignments INTEGER,
    completed_assignments INTEGER,
    completion_rate DECIMAL,
    average_rating DECIMAL,
    average_response_time_minutes DECIMAL,
    average_completion_time_minutes DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_assignments,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END)::INTEGER as completed_assignments,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (COUNT(CASE WHEN a.status = 'completed' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL * 100)
            ELSE 0 
        END as completion_rate,
        AVG(a.rating)::DECIMAL as average_rating,
        AVG(EXTRACT(EPOCH FROM (a.accepted_at - a.assigned_at))/60)::DECIMAL as average_response_time_minutes,
        AVG(EXTRACT(EPOCH FROM (a.completed_at - a.started_at))/60)::DECIMAL as average_completion_time_minutes
    FROM assignments a
    WHERE a.volunteer_id = get_volunteer_metrics.volunteer_id
        AND a.assigned_at >= NOW() - INTERVAL '1 day' * days_back;
END;
$$ LANGUAGE plpgsql;

-- Function to get system statistics
CREATE OR REPLACE FUNCTION get_system_stats(
    days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
    total_requests INTEGER,
    pending_requests INTEGER,
    active_requests INTEGER,
    completed_requests INTEGER,
    total_volunteers INTEGER,
    available_volunteers INTEGER,
    busy_volunteers INTEGER,
    average_response_time_minutes DECIMAL,
    completion_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM assistance_requests 
         WHERE created_at >= NOW() - INTERVAL '1 day' * days_back) as total_requests,
        (SELECT COUNT(*)::INTEGER FROM assistance_requests WHERE status = 'pending') as pending_requests,
        (SELECT COUNT(*)::INTEGER FROM assistance_requests WHERE status IN ('assigned', 'in_progress')) as active_requests,
        (SELECT COUNT(*)::INTEGER FROM assistance_requests 
         WHERE status = 'completed' AND updated_at >= NOW() - INTERVAL '1 day' * days_back) as completed_requests,
        (SELECT COUNT(*)::INTEGER FROM profiles WHERE role = 'volunteer' AND is_active = true) as total_volunteers,
        (SELECT COUNT(*)::INTEGER FROM profiles WHERE role = 'volunteer' AND volunteer_status = 'available') as available_volunteers,
        (SELECT COUNT(*)::INTEGER FROM profiles WHERE role = 'volunteer' AND volunteer_status = 'busy') as busy_volunteers,
        (SELECT AVG(EXTRACT(EPOCH FROM (accepted_at - assigned_at))/60)::DECIMAL 
         FROM assignments WHERE assigned_at >= NOW() - INTERVAL '1 day' * days_back) as average_response_time_minutes,
        (SELECT 
            CASE 
                WHEN COUNT(*) > 0 THEN 
                    (COUNT(CASE WHEN status = 'completed' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL * 100)
                ELSE 0 
            END
         FROM assistance_requests 
         WHERE created_at >= NOW() - INTERVAL '1 day' * days_back) as completion_rate;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGER FUNCTIONS
-- =============================================

-- Function to automatically notify volunteers when new request is created
CREATE OR REPLACE FUNCTION trigger_notify_volunteers()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify for pending requests
    IF NEW.status = 'pending' THEN
        PERFORM notify_nearby_volunteers(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notifications when assignment status changes
CREATE OR REPLACE FUNCTION trigger_assignment_notifications()
RETURNS TRIGGER AS $$
DECLARE
    request_record assistance_requests%ROWTYPE;
    volunteer_record profiles%ROWTYPE;
BEGIN
    -- Get related records
    SELECT * INTO request_record FROM assistance_requests WHERE id = NEW.request_id;
    SELECT * INTO volunteer_record FROM profiles WHERE id = NEW.volunteer_id;
    
    -- Notify requester about assignment updates
    IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
        PERFORM create_notification(
            request_record.user_id,
            'Volunteer Assigned',
            volunteer_record.name || ' has accepted your request and is on the way',
            'volunteer_assigned',
            jsonb_build_object('assignment_id', NEW.id, 'volunteer_id', NEW.volunteer_id)
        );
    ELSIF NEW.status = 'in_progress' AND (OLD.status IS NULL OR OLD.status != 'in_progress') THEN
        PERFORM create_notification(
            request_record.user_id,
            'Help in Progress',
            volunteer_record.name || ' has started working on your request',
            'request_in_progress',
            jsonb_build_object('assignment_id', NEW.id)
        );
    ELSIF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        PERFORM create_notification(
            request_record.user_id,
            'Request Completed',
            'Your request has been completed. Please rate the service.',
            'request_completed',
            jsonb_build_object('assignment_id', NEW.id, 'can_rate', true)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS notify_volunteers_on_new_request ON assistance_requests;
CREATE TRIGGER notify_volunteers_on_new_request
    AFTER INSERT ON assistance_requests
    FOR EACH ROW
    EXECUTE FUNCTION trigger_notify_volunteers();

DROP TRIGGER IF EXISTS assignment_status_notifications ON assignments;
CREATE TRIGGER assignment_status_notifications
    AFTER INSERT OR UPDATE ON assignments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_assignment_notifications();
