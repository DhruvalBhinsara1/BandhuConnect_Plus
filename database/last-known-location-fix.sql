-- Enhanced bi-directional visibility with last known locations
-- Always shows the most recent GPS coordinate for assigned users

CREATE OR REPLACE FUNCTION get_pilgrim_locations_for_volunteer(p_volunteer_id UUID)
RETURNS TABLE (
  location_id UUID,
  user_id UUID,
  user_name TEXT,
  user_role TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  last_updated TIMESTAMP WITH TIME ZONE,
  assignment_info JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ul.id as location_id,
    ul.user_id,
    u.name as user_name,
    u.role::text as user_role,
    ul.latitude,
    ul.longitude,
    ul.accuracy,
    ul.last_updated,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'request_id', hr.id,
            'request_title', hr.title,
            'assignment_id', ha.id,
            'assignment_status', ha.status,
            'pilgrim_name', pu.name,
            'volunteer_name', vu.name
          )
        )
        FROM assignments ha
        JOIN assistance_requests hr ON ha.request_id = hr.id
        LEFT JOIN profiles pu ON hr.user_id = pu.id
        LEFT JOIN profiles vu ON ha.volunteer_id = vu.id
        WHERE ha.volunteer_id = p_volunteer_id 
        AND hr.user_id = ul.user_id
        AND ha.status IN ('accepted', 'in_progress')
      ),
      '[]'::jsonb
    ) as assignment_info
  FROM (
    -- Get most recent location for each assigned pilgrim
    SELECT DISTINCT ON (ul.user_id) 
      ul.id, ul.user_id, ul.latitude, ul.longitude, ul.accuracy, ul.last_updated
    FROM user_locations ul
    WHERE ul.user_id IN (
      SELECT hr.user_id 
      FROM assignments ha
      JOIN assistance_requests hr ON ha.request_id = hr.id
      WHERE ha.volunteer_id = p_volunteer_id
      AND ha.status IN ('accepted', 'in_progress')
    )
    ORDER BY ul.user_id, ul.last_updated DESC
  ) ul
  JOIN profiles u ON ul.user_id = u.id
  WHERE u.role = 'pilgrim';
END;
$$;

CREATE OR REPLACE FUNCTION get_volunteer_locations_for_pilgrim(p_pilgrim_id UUID)
RETURNS TABLE (
  location_id UUID,
  user_id UUID,
  user_name TEXT,
  user_role TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  last_updated TIMESTAMP WITH TIME ZONE,
  assignment_info JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ul.id as location_id,
    ul.user_id,
    u.name as user_name,
    u.role::text as user_role,
    ul.latitude,
    ul.longitude,
    ul.accuracy,
    ul.last_updated,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'request_id', hr.id,
            'request_title', hr.title,
            'assignment_id', ha.id,
            'assignment_status', ha.status,
            'pilgrim_name', pu.name,
            'volunteer_name', vu.name
          )
        )
        FROM assignments ha
        JOIN assistance_requests hr ON ha.request_id = hr.id
        LEFT JOIN profiles pu ON hr.user_id = pu.id
        LEFT JOIN profiles vu ON ha.volunteer_id = vu.id
        WHERE ha.volunteer_id = ul.user_id
        AND hr.user_id = p_pilgrim_id
        AND ha.status IN ('accepted', 'in_progress')
      ),
      '[]'::jsonb
    ) as assignment_info
  FROM (
    -- Get most recent location for each assigned volunteer
    SELECT DISTINCT ON (ul.user_id) 
      ul.id, ul.user_id, ul.latitude, ul.longitude, ul.accuracy, ul.last_updated
    FROM user_locations ul
    WHERE ul.user_id IN (
      SELECT ha.volunteer_id 
      FROM assignments ha
      JOIN assistance_requests hr ON ha.request_id = hr.id
      WHERE hr.user_id = p_pilgrim_id
      AND ha.status IN ('accepted', 'in_progress')
    )
    ORDER BY ul.user_id, ul.last_updated DESC
  ) ul
  JOIN profiles u ON ul.user_id = u.id
  WHERE u.role = 'volunteer';
END;
$$;

-- Function to get assigned users without location data (for fallback handling)
CREATE OR REPLACE FUNCTION get_assigned_users_without_location(p_user_id UUID, p_user_role TEXT)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  user_role TEXT,
  assignment_info JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_user_role = 'volunteer' THEN
    -- Get assigned pilgrims without location data
    RETURN QUERY
    SELECT 
      u.id as user_id,
      u.name as user_name,
      u.role::text as user_role,
      jsonb_build_array(
        jsonb_build_object(
          'request_id', hr.id,
          'request_title', hr.title,
          'assignment_id', ha.id,
          'assignment_status', ha.status,
          'pilgrim_name', u.name,
          'volunteer_name', vu.name
        )
      ) as assignment_info
    FROM assignments ha
    JOIN assistance_requests hr ON ha.request_id = hr.id
    JOIN profiles u ON hr.user_id = u.id
    LEFT JOIN profiles vu ON ha.volunteer_id = vu.id
    WHERE ha.volunteer_id = p_user_id
    AND ha.status IN ('accepted', 'in_progress')
    AND u.role = 'pilgrim'
    AND NOT EXISTS (
      SELECT 1 FROM user_locations ul WHERE ul.user_id = u.id
    );
    
  ELSIF p_user_role = 'pilgrim' THEN
    -- Get assigned volunteers without location data
    RETURN QUERY
    SELECT 
      u.id as user_id,
      u.name as user_name,
      u.role::text as user_role,
      jsonb_build_array(
        jsonb_build_object(
          'request_id', hr.id,
          'request_title', hr.title,
          'assignment_id', ha.id,
          'assignment_status', ha.status,
          'pilgrim_name', pu.name,
          'volunteer_name', u.name
        )
      ) as assignment_info
    FROM assignments ha
    JOIN assistance_requests hr ON ha.request_id = hr.id
    JOIN profiles u ON ha.volunteer_id = u.id
    LEFT JOIN profiles pu ON hr.user_id = pu.id
    WHERE hr.user_id = p_user_id
    AND ha.status IN ('accepted', 'in_progress')
    AND u.role = 'volunteer'
    AND NOT EXISTS (
      SELECT 1 FROM user_locations ul WHERE ul.user_id = u.id
    );
  END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_pilgrim_locations_for_volunteer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_volunteer_locations_for_pilgrim(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_assigned_users_without_location(UUID, TEXT) TO authenticated;
