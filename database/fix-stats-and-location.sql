-- Fix request statistics and location tracking

-- First, ensure we have the PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Function to get live pilgrim statistics
CREATE OR REPLACE FUNCTION get_live_pilgrim_stats(
    p_pilgrim_id UUID
) RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'total_requests', COUNT(DISTINCT ar.id),
        'active_requests', COUNT(DISTINCT CASE WHEN ar.status IN ('pending', 'assigned', 'in_progress') THEN ar.id END),
        'completed_requests', COUNT(DISTINCT CASE WHEN ar.status = 'completed' THEN ar.id END),
        'total_volunteers', COUNT(DISTINCT a.volunteer_id),
        'average_response_time', EXTRACT(epoch FROM AVG(a.accepted_at - ar.created_at) FILTER (WHERE a.accepted_at IS NOT NULL)),
        'last_request_time', MAX(ar.created_at),
        'current_location', CASE 
            WHEN MAX(ul.last_updated) > NOW() - INTERVAL '10 minutes'
            THEN jsonb_build_object(
                'latitude', ul.latitude,
                'longitude', ul.longitude,
                'accuracy', ul.accuracy,
                'last_updated', ul.last_updated
            )
            ELSE NULL
        END
    ) INTO result
    FROM profiles p
    LEFT JOIN assistance_requests ar ON ar.user_id = p.id
    LEFT JOIN assignments a ON ar.id = a.request_id
    LEFT JOIN user_locations ul ON p.id = ul.user_id
    WHERE p.id = p_pilgrim_id
    GROUP BY p.id, ul.latitude, ul.longitude, ul.accuracy, ul.last_updated;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate accurate distance between points
CREATE OR REPLACE FUNCTION calculate_accurate_distance(
    lat1 float8,
    lon1 float8,
    lat2 float8,
    lon2 float8,
    units text DEFAULT 'km'
) RETURNS float8 AS $$
DECLARE
    dist float8;
    rad_lat1 float8;
    rad_lat2 float8;
    rad_delta_lon float8;
    R float8;
BEGIN
    -- Convert latitude and longitude to radians
    rad_lat1 := radians(lat1);
    rad_lat2 := radians(lat2);
    rad_delta_lon := radians(lon2 - lon1);
    
    -- Earth's radius in kilometers
    R := 6371;
    
    -- Haversine formula
    dist := 2 * R * asin(
        sqrt(
            sin((rad_lat2 - rad_lat1)/2)^2 +
            cos(rad_lat1) * cos(rad_lat2) * sin(rad_delta_lon/2)^2
        )
    );
    
    -- Convert to meters if requested
    IF units = 'meters' THEN
        dist := dist * 1000;
    END IF;
    
    RETURN round(dist::numeric, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get location details with reverse geocoding
CREATE OR REPLACE FUNCTION get_location_details(
    p_latitude float8,
    p_longitude float8
) RETURNS jsonb AS $$
BEGIN
    RETURN jsonb_build_object(
        'coordinates', jsonb_build_object(
            'latitude', p_latitude,
            'longitude', p_longitude
        ),
        'formatted_address', 'Location data available',
        'accuracy', CASE 
            WHEN p_latitude IS NOT NULL AND p_longitude IS NOT NULL 
            THEN 'high'
            ELSE 'low'
        END
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get active request details with location
CREATE OR REPLACE FUNCTION get_active_request_details(
    p_request_id UUID
) RETURNS TABLE (
    request_id UUID,
    pilgrim_id UUID,
    pilgrim_name TEXT,
    request_type TEXT,
    priority TEXT,
    location jsonb,
    distance_km float8,
    created_at TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ar.id,
        ar.user_id,
        p.name,
        ar.type::TEXT,
        ar.priority::TEXT,
        jsonb_build_object(
            'latitude', ST_Y(ar.location::geometry),
            'longitude', ST_X(ar.location::geometry),
            'accuracy', COALESCE(ul.accuracy, 0),
            'last_updated', ul.last_updated
        ),
        COALESCE(
            calculate_accurate_distance(
                ST_Y(ar.location::geometry),
                ST_X(ar.location::geometry),
                ul.latitude,
                ul.longitude
            ),
            0
        ),
        ar.created_at,
        COALESCE(ul.last_updated, ar.updated_at)
    FROM assistance_requests ar
    JOIN profiles p ON ar.user_id = p.id
    LEFT JOIN user_locations ul ON p.id = ul.user_id
    WHERE ar.id = p_request_id
    AND ar.status IN ('pending', 'assigned', 'in_progress');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update location with background tracking status
CREATE OR REPLACE FUNCTION update_location_with_tracking(
    p_user_id UUID,
    p_latitude float8,
    p_longitude float8,
    p_accuracy float8,
    p_is_background boolean DEFAULT false
) RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    INSERT INTO user_locations (
        user_id,
        latitude,
        longitude,
        accuracy,
        is_active,
        tracking_type,
        last_updated
    ) VALUES (
        p_user_id,
        p_latitude,
        p_longitude,
        p_accuracy,
        true,
        CASE WHEN p_is_background THEN 'background' ELSE 'foreground' END,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        accuracy = EXCLUDED.accuracy,
        is_active = true,
        tracking_type = EXCLUDED.tracking_type,
        last_updated = EXCLUDED.last_updated
    RETURNING jsonb_build_object(
        'location_id', id,
        'user_id', user_id,
        'latitude', latitude,
        'longitude', longitude,
        'accuracy', accuracy,
        'tracking_type', tracking_type,
        'last_updated', last_updated
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or update the user_locations table
DO $$ 
BEGIN
    -- Add tracking_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_locations' 
        AND column_name = 'tracking_type'
    ) THEN
        ALTER TABLE user_locations 
        ADD COLUMN tracking_type text DEFAULT 'foreground';
    END IF;
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_live_pilgrim_stats TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_accurate_distance TO authenticated;
GRANT EXECUTE ON FUNCTION get_location_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_request_details TO authenticated;
GRANT EXECUTE ON FUNCTION update_location_with_tracking TO authenticated;
