-- Location sharing functions for role-based visibility
-- Pilgrims see volunteers, volunteers see pilgrims, admins see all

-- Function for volunteers to see pilgrim locations (ONLY assigned pilgrims)
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
    u.role as user_role,
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
  FROM user_locations ul
  JOIN profiles u ON ul.user_id = u.id
  WHERE ul.is_active = true
  AND u.role = 'pilgrim'
  AND ul.last_updated > NOW() - INTERVAL '1 hour'
  -- ONLY show pilgrims assigned to this volunteer
  AND EXISTS (
    SELECT 1 FROM assignments ha
    JOIN assistance_requests hr ON ha.request_id = hr.id
    WHERE ha.volunteer_id = p_volunteer_id
    AND hr.user_id = ul.user_id
    AND ha.status IN ('accepted', 'in_progress')
  );
END;
$$;

-- Function for pilgrims to see volunteer locations (ONLY assigned volunteer)
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
    u.role as user_role,
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
  FROM user_locations ul
  JOIN profiles u ON ul.user_id = u.id
  WHERE ul.is_active = true
  AND u.role = 'volunteer'
  AND ul.last_updated > NOW() - INTERVAL '1 hour'
  -- ONLY show volunteer assigned to this pilgrim
  AND EXISTS (
    SELECT 1 FROM assignments ha
    JOIN assistance_requests hr ON ha.request_id = hr.id
    WHERE ha.volunteer_id = ul.user_id
    AND hr.user_id = p_pilgrim_id
    AND ha.status IN ('accepted', 'in_progress')
  );
END;
$$;

-- Function for admins to see all active locations
CREATE OR REPLACE FUNCTION get_all_active_locations()
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
    u.role as user_role,
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
        WHERE (ha.volunteer_id = ul.user_id OR hr.user_id = ul.user_id)
        AND ha.status IN ('accepted', 'in_progress')
      ),
      '[]'::jsonb
    ) as assignment_info
  FROM user_locations ul
  JOIN profiles u ON ul.user_id = u.id
  WHERE ul.is_active = true
  AND ul.last_updated > NOW() - INTERVAL '1 hour' -- Only show recent locations
  ORDER BY u.role, u.name;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_pilgrim_locations_for_volunteer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_volunteer_locations_for_pilgrim(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_active_locations() TO authenticated;
