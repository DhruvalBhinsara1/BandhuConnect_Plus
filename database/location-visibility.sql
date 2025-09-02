-- Function to get locations of pilgrims assigned to a volunteer
CREATE OR REPLACE FUNCTION get_volunteer_assigned_locations(p_volunteer_id uuid)
RETURNS TABLE (
  location_id uuid,
  user_id uuid,
  user_name text,
  user_role text,
  latitude double precision,
  longitude double precision,
  accuracy double precision,
  last_updated timestamp with time zone,
  assignment_info jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ul.id as location_id,
    ul.user_id,
    p.full_name as user_name,
    p.role as user_role,
    ul.latitude,
    ul.longitude,
    ul.accuracy,
    ul.last_updated,
    jsonb_agg(
      jsonb_build_object(
        'request_id', r.id,
        'request_title', r.title,
        'assignment_id', a.id,
        'assignment_status', a.status,
        'pilgrim_name', pp.full_name
      )
    ) as assignment_info
  FROM user_locations ul
  JOIN profiles p ON p.user_id = ul.user_id
  JOIN assistance_requests r ON r.user_id = ul.user_id
  JOIN assignments a ON a.request_id = r.id
  JOIN profiles pp ON pp.user_id = r.user_id
  WHERE a.volunteer_id = p_volunteer_id
    AND ul.is_active = true
    AND p.role = 'pilgrim'
  GROUP BY ul.id, ul.user_id, p.full_name, p.role, ul.latitude, ul.longitude, ul.accuracy, ul.last_updated;
END;
$$;

-- Function to get location of volunteer assigned to a pilgrim
CREATE OR REPLACE FUNCTION get_pilgrim_assigned_locations(p_pilgrim_id uuid)
RETURNS TABLE (
  location_id uuid,
  user_id uuid,
  user_name text,
  user_role text,
  latitude double precision,
  longitude double precision,
  accuracy double precision,
  last_updated timestamp with time zone,
  assignment_info jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ul.id as location_id,
    ul.user_id,
    p.full_name as user_name,
    p.role as user_role,
    ul.latitude,
    ul.longitude,
    ul.accuracy,
    ul.last_updated,
    jsonb_agg(
      jsonb_build_object(
        'request_id', r.id,
        'request_title', r.title,
        'assignment_id', a.id,
        'assignment_status', a.status,
        'volunteer_name', pv.full_name
      )
    ) as assignment_info
  FROM user_locations ul
  JOIN profiles p ON p.user_id = ul.user_id
  JOIN assignments a ON a.volunteer_id = ul.user_id
  JOIN assistance_requests r ON r.id = a.request_id AND r.user_id = p_pilgrim_id
  JOIN profiles pv ON pv.user_id = a.volunteer_id
  WHERE ul.is_active = true
    AND p.role = 'volunteer'
  GROUP BY ul.id, ul.user_id, p.full_name, p.role, ul.latitude, ul.longitude, ul.accuracy, ul.last_updated;
END;
$$;

-- Add RLS policies to ensure data security
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own location"
  ON user_locations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view assigned locations"
  ON user_locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
  SELECT 1 
  FROM assignments a
  JOIN assistance_requests r ON r.id = a.request_id
  WHERE (a.volunteer_id = auth.uid() AND r.user_id = user_locations.user_id)
  OR (r.user_id = auth.uid() AND a.volunteer_id = user_locations.user_id)
    )
  );

CREATE POLICY "Users can update their own location"
  ON user_locations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
