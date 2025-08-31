-- RPC function to update volunteer profiles (bypasses RLS)
-- This function allows admin users to update volunteer profile information

CREATE OR REPLACE FUNCTION update_volunteer_profile(
  profile_id UUID,
  profile_name TEXT,
  profile_email TEXT,
  profile_phone TEXT,
  profile_skills TEXT[]
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  email TEXT,
  phone TEXT,
  skills TEXT[],
  updated_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the profile and return the updated row
  RETURN QUERY
  UPDATE profiles 
  SET 
    name = profile_name,
    email = profile_email,
    phone = profile_phone,
    skills = profile_skills,
    updated_at = NOW()
  WHERE profiles.id = profile_id
  RETURNING 
    profiles.id,
    profiles.name,
    profiles.email,
    profiles.phone,
    profiles.skills,
    profiles.updated_at;
    
  -- If no rows were updated, it means the profile doesn't exist
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile with ID % not found', profile_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_volunteer_profile TO authenticated;
