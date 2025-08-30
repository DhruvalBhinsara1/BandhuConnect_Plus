-- Create RPC functions for admin operations to bypass RLS
-- These functions run with elevated privileges to allow admin operations

-- Function to update volunteer status
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
SECURITY DEFINER -- This allows the function to run with elevated privileges
AS $$
BEGIN
  -- Update the volunteer profile
  UPDATE profiles 
  SET 
    is_active = new_is_active,
    volunteer_status = new_volunteer_status,
    updated_at = NOW()
  WHERE profiles.id = volunteer_id
    AND role = 'volunteer';
  
  -- Return the updated volunteer data
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

-- Function to delete assistance request and related assignments
CREATE OR REPLACE FUNCTION delete_assistance_request(
  request_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete related assignments first
  DELETE FROM assignments WHERE assignments.request_id = delete_assistance_request.request_id;
  
  -- Delete the assistance request
  DELETE FROM assistance_requests WHERE id = delete_assistance_request.request_id;
  
  -- Return true if successful
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Return false if there was an error
    RETURN FALSE;
END;
$$;

-- Grant execute permissions to authenticated users (admin will be authenticated)
GRANT EXECUTE ON FUNCTION update_volunteer_status(UUID, BOOLEAN, volunteer_status) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_assistance_request(UUID) TO authenticated;
