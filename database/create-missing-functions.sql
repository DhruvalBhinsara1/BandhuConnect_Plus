-- Create missing functions required for notifications and volunteer matching
-- Run this in Supabase SQL Editor before running sample data

-- Drop existing functions if they exist with different signatures
DROP FUNCTION IF EXISTS find_nearest_volunteers(decimal, decimal, integer, text[], integer);
DROP FUNCTION IF EXISTS find_nearest_volunteers(double precision, double precision, integer, text[], integer);

-- Function to find nearest volunteers to a location
CREATE OR REPLACE FUNCTION find_nearest_volunteers(
    target_lat DOUBLE PRECISION,
    target_lng DOUBLE PRECISION,
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
        COALESCE(p.rating, 0.0) as rating,
        ST_Distance(p.location, ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326))::DECIMAL as distance_meters,
        ST_Y(p.location::geometry)::DECIMAL as latitude,
        ST_X(p.location::geometry)::DECIMAL as longitude
    FROM profiles p
    WHERE p.role = 'volunteer'
        AND p.volunteer_status IN ('available', 'busy')
        AND p.is_active = true
        AND (p.location IS NULL OR ST_DWithin(p.location, ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326), max_distance_meters))
        AND (required_skills IS NULL OR p.skills && required_skills OR p.skills IS NULL)
    ORDER BY 
        CASE WHEN p.volunteer_status = 'available' THEN 0 ELSE 1 END,
        distance_meters
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Drop existing function if it exists with different signature
DROP FUNCTION IF EXISTS notify_nearby_volunteers(uuid);

-- Function to notify nearby volunteers about new requests
CREATE OR REPLACE FUNCTION notify_nearby_volunteers(request_id UUID)
RETURNS VOID AS $$
DECLARE
    request_record assistance_requests%ROWTYPE;
    volunteer_record RECORD;
    notification_message TEXT;
BEGIN
    -- Get request details
    SELECT * INTO request_record FROM assistance_requests WHERE id = request_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Create notification message
    notification_message := format('New %s request: %s', request_record.type, request_record.title);
    
    -- Find nearby volunteers (only if request has location)
    IF request_record.location IS NOT NULL THEN
        FOR volunteer_record IN
            SELECT volunteer_id, name, distance_meters
            FROM find_nearest_volunteers(
                ST_Y(request_record.location::geometry),
                ST_X(request_record.location::geometry),
                20000, -- 20km radius for notifications
                ARRAY[request_record.type::TEXT]
            )
        LOOP
            -- Insert notification for each nearby volunteer
            INSERT INTO notifications (
                id,
                user_id,
                title,
                body,
                type,
                data,
                created_at
            ) VALUES (
                gen_random_uuid(),
                volunteer_record.volunteer_id,
                'New Request Available',
                notification_message,
                'request',
                jsonb_build_object(
                    'request_id', request_id,
                    'distance_meters', volunteer_record.distance_meters
                ),
                NOW()
            );
        END LOOP;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Drop existing function if it exists with different signature
DROP FUNCTION IF EXISTS auto_assign_request(uuid);

-- Function to auto-assign requests to best available volunteer
CREATE OR REPLACE FUNCTION auto_assign_request(request_id UUID)
RETURNS UUID AS $$
DECLARE
    request_record assistance_requests%ROWTYPE;
    best_volunteer_id UUID;
    assignment_id UUID;
BEGIN
    -- Get request details
    SELECT * INTO request_record FROM assistance_requests WHERE id = request_id;
    
    IF NOT FOUND OR request_record.status != 'pending' THEN
        RETURN NULL;
    END IF;
    
    -- Find best volunteer based on location, skills, and availability
    IF request_record.location IS NOT NULL THEN
        SELECT volunteer_id INTO best_volunteer_id
        FROM find_nearest_volunteers(
            ST_Y(request_record.location::geometry),
            ST_X(request_record.location::geometry),
            15000, -- 15km radius
            ARRAY[request_record.type::TEXT],
            1 -- limit to 1
        )
        WHERE volunteer_status = 'available'
        LIMIT 1;
    ELSE
        -- If no location, find any available volunteer with matching skills
        SELECT id INTO best_volunteer_id
        FROM profiles
        WHERE role = 'volunteer'
            AND volunteer_status = 'available'
            AND is_active = true
            AND (skills && ARRAY[request_record.type::TEXT] OR skills IS NULL)
        ORDER BY rating DESC NULLS LAST
        LIMIT 1;
    END IF;
    
    -- Create assignment if volunteer found
    IF best_volunteer_id IS NOT NULL THEN
        assignment_id := gen_random_uuid();
        
        INSERT INTO assignments (
            id,
            request_id,
            volunteer_id,
            status,
            assigned_at,
            created_at,
            updated_at
        ) VALUES (
            assignment_id,
            request_id,
            best_volunteer_id,
            'assigned',
            NOW(),
            NOW(),
            NOW()
        );
        
        -- Update request status
        UPDATE assistance_requests 
        SET status = 'assigned', updated_at = NOW()
        WHERE id = request_id;
        
        -- Update volunteer status to busy
        UPDATE profiles 
        SET volunteer_status = 'busy', updated_at = NOW()
        WHERE id = best_volunteer_id;
        
        RETURN assignment_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger first, then function
DROP TRIGGER IF EXISTS notify_volunteers_trigger ON assistance_requests;
DROP TRIGGER IF EXISTS notify_volunteers_on_new_request ON assistance_requests;
DROP FUNCTION IF EXISTS trigger_notify_volunteers() CASCADE;

-- Trigger function for new requests
CREATE OR REPLACE FUNCTION trigger_notify_volunteers()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify for new pending requests
    IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
        PERFORM notify_nearby_volunteers(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for assistance_requests (if not exists)
DROP TRIGGER IF EXISTS notify_volunteers_trigger ON assistance_requests;
CREATE TRIGGER notify_volunteers_trigger
    AFTER INSERT ON assistance_requests
    FOR EACH ROW
    EXECUTE FUNCTION trigger_notify_volunteers();

-- Display success message
SELECT 'Missing functions created successfully!' as message;
