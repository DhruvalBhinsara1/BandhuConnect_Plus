-- Function to calculate distance between two points in kilometers
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DOUBLE PRECISION,
    lon1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION,
    lon2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
DECLARE
    R CONSTANT DOUBLE PRECISION := 6371; -- Earth's radius in kilometers
    dlat DOUBLE PRECISION;
    dlon DOUBLE PRECISION;
    a DOUBLE PRECISION;
    c DOUBLE PRECISION;
BEGIN
    -- Convert degrees to radians
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    lat1 := radians(lat1);
    lat2 := radians(lat2);

    -- Haversine formula
    a := (sin(dlat/2))^2 + cos(lat1) * cos(lat2) * (sin(dlon/2))^2;
    c := 2 * asin(sqrt(a));
    RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get locations with distance for volunteers
CREATE OR REPLACE FUNCTION get_request_locations_with_distance(
    p_volunteer_id UUID
) RETURNS TABLE (
    request_id UUID,
    pilgrim_id UUID,
    pilgrim_name TEXT,
    request_type TEXT,
    request_status TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    distance_km DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    WITH volunteer_location AS (
        SELECT latitude, longitude
        FROM user_locations
        WHERE user_id = p_volunteer_id
        AND is_active = true
        LIMIT 1
    )
    SELECT 
        ar.id as request_id,
        ar.user_id as pilgrim_id,
        p.name as pilgrim_name,
        ar.type::TEXT as request_type,
        ar.status::TEXT as request_status,
        ST_Y(ar.location::geometry) as latitude,
        ST_X(ar.location::geometry) as longitude,
        CASE 
            WHEN vl.latitude IS NOT NULL AND vl.longitude IS NOT NULL 
            THEN calculate_distance(
                vl.latitude, vl.longitude,
                ST_Y(ar.location::geometry), ST_X(ar.location::geometry)
            )
            ELSE NULL
        END as distance_km,
        ar.created_at
    FROM assistance_requests ar
    JOIN profiles p ON ar.user_id = p.id
    CROSS JOIN volunteer_location vl
    WHERE ar.status = 'pending'
    ORDER BY 
        CASE 
            WHEN vl.latitude IS NOT NULL AND vl.longitude IS NOT NULL 
            THEN calculate_distance(
                vl.latitude, vl.longitude,
                ST_Y(ar.location::geometry), ST_X(ar.location::geometry)
            )
            ELSE NULL
        END ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
