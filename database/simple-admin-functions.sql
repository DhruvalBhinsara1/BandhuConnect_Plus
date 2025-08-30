-- Simple admin functions to bypass RLS
CREATE OR REPLACE FUNCTION update_volunteer_status(
  volunteer_id UUID,
  new_is_active BOOLEAN,
  new_volunteer_status volunteer_status
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  volunteer_status volunteer_status,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles 
  SET 
    is_active = new_is_active,
    volunteer_status = new_volunteer_status,
    updated_at = NOW()
  WHERE profiles.id = volunteer_id
    AND role = 'volunteer';
  
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.volunteer_status,
    p.is_active
  FROM profiles p
  WHERE p.id = volunteer_id;
END;
$$;

CREATE OR REPLACE FUNCTION delete_assistance_request(
  request_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM assignments WHERE assignments.request_id = delete_assistance_request.request_id;
  DELETE FROM assistance_requests WHERE id = delete_assistance_request.request_id;
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;
