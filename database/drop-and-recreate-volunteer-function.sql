-- Drop the existing function first
DROP FUNCTION IF EXISTS update_volunteer_status(uuid,boolean,volunteer_status);

-- Recreate with correct return type
CREATE OR REPLACE FUNCTION update_volunteer_status(
  volunteer_id UUID,
  new_is_active BOOLEAN,
  new_volunteer_status volunteer_status
)
RETURNS TABLE(
  id UUID,
  name VARCHAR(255),
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
