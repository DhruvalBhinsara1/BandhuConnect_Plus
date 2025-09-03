-- Migration: Fix function return types to match database schema
-- This migration safely drops and recreates functions with correct types

-- Step 1: Drop existing functions (safe because they will be recreated)
DROP FUNCTION IF EXISTS get_pilgrim_locations_for_volunteer(UUID);
DROP FUNCTION IF EXISTS get_volunteer_locations_for_pilgrim(UUID);
DROP FUNCTION IF EXISTS get_assigned_users_without_location(UUID, TEXT);

-- Step 2: Recreate functions with correct VARCHAR(255) types to match profiles table schema

CREATE OR REPLACE FUNCTION get_pilgrim_locations_for_volunteer(p_volunteer_id UUID)
RETURNS TABLE (
  location_id UUID,
  user_id UUID,
  user_name VARCHAR(255),
  user_role user_role,
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
  -- First get assigned pilgrims with location data
  SELECT 
    ul.id as location_id,
    ul.user_id as user_id,
    u.name as user_name,
    u.role as user_role,
    ul.latitude,
    ul.longitude,
    ul.accuracy,
    ul.created_at as last_updated,
    jsonb_build_object(
      'assignment_id', a.id,
      'status', a.status,
      'assigned_at', a.assigned_at,
      'request_type', ar.type,
      'priority', ar.priority
    ) as assignment_info
  FROM (
    SELECT DISTINCT ON (ul_inner.user_id) 
      ul_inner.id, ul_inner.user_id, ul_inner.latitude, ul_inner.longitude, ul_inner.accuracy, ul_inner.created_at
    FROM user_locations ul_inner
    WHERE ul_inner.created_at >= NOW() - INTERVAL '24 hours'
    ORDER BY ul_inner.user_id, ul_inner.created_at DESC
  ) ul
  JOIN profiles u ON ul.user_id = u.id
  JOIN assignments a ON a.volunteer_id = p_volunteer_id AND a.status IN ('pending', 'accepted', 'in_progress')
  LEFT JOIN assistance_requests ar ON a.request_id = ar.id AND ar.user_id = ul.user_id
  WHERE u.role = 'pilgrim'
    AND ar.user_id = ul.user_id

  UNION ALL

  -- Then get assigned pilgrims without location data as placeholders
  SELECT 
    gen_random_uuid() as location_id,
    u.id as user_id,
    u.name as user_name,
    u.role as user_role,
    0.0 as latitude,
    0.0 as longitude,
    NULL as accuracy,
    NOW() as last_updated,
    jsonb_build_object(
      'assignment_id', a.id,
      'status', a.status,
      'assigned_at', a.assigned_at,
      'request_type', ar.type,
      'priority', ar.priority,
      'is_placeholder', true
    ) as assignment_info
  FROM profiles u
  JOIN assignments a ON a.volunteer_id = p_volunteer_id AND a.status IN ('pending', 'accepted', 'in_progress')
  LEFT JOIN assistance_requests ar ON a.request_id = ar.id AND ar.user_id = u.id
  WHERE u.role = 'pilgrim'
    AND ar.user_id = u.id
    AND NOT EXISTS (
      SELECT 1 FROM user_locations ul 
      WHERE ul.user_id = u.id 
      AND ul.created_at >= NOW() - INTERVAL '24 hours'
    );
END;
$$;

CREATE OR REPLACE FUNCTION get_volunteer_locations_for_pilgrim(p_pilgrim_id UUID)
RETURNS TABLE (
  location_id UUID,
  user_id UUID,
  user_name VARCHAR(255),
  user_role user_role,
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
    ul.user_id as user_id,
    u.name as user_name,
    u.role as user_role,
    ul.latitude,
    ul.longitude,
    ul.accuracy,
    ul.created_at as last_updated,
    jsonb_build_object(
      'assignment_id', a.id,
      'status', a.status,
      'assigned_at', a.assigned_at,
      'request_type', ar.type,
      'priority', ar.priority
    ) as assignment_info
  FROM (
    SELECT DISTINCT ON (ul_inner.user_id) 
      ul_inner.id, ul_inner.user_id, ul_inner.latitude, ul_inner.longitude, ul_inner.accuracy, ul_inner.created_at
    FROM user_locations ul_inner
    WHERE ul_inner.created_at >= NOW() - INTERVAL '24 hours'
    ORDER BY ul_inner.user_id, ul_inner.created_at DESC
  ) ul
  JOIN profiles u ON ul.user_id = u.id
  LEFT JOIN assignments a ON a.volunteer_id = ul.user_id AND a.status IN ('pending', 'accepted', 'in_progress')
  LEFT JOIN assistance_requests ar ON a.request_id = ar.id AND ar.user_id = p_pilgrim_id
  WHERE u.role = 'volunteer'
    AND a.id IS NOT NULL;
END;
$$;

CREATE OR REPLACE FUNCTION get_assigned_users_without_location(p_user_id UUID, p_user_role TEXT)
RETURNS TABLE (
  user_id UUID,
  user_name VARCHAR(255),
  user_role user_role,
  assignment_info JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_user_role = 'volunteer' THEN
    -- Show pilgrims assigned to this volunteer who don't have recent locations
    RETURN QUERY
    SELECT 
      u.id as user_id,
      u.name as user_name,
      u.role as user_role,
      jsonb_build_object(
        'assignment_id', a.id,
        'status', a.status,
        'assigned_at', a.assigned_at,
        'request_type', hr.type,
        'priority', hr.priority
      ) as assignment_info
    FROM profiles u
    JOIN assignments a ON a.volunteer_id = p_user_id
    JOIN assistance_requests ar ON a.request_id = ar.id AND ar.user_id = u.id
    JOIN assistance_requests hr ON a.request_id = hr.id
    LEFT JOIN user_locations ul ON ul.user_id = u.id AND ul.created_at >= NOW() - INTERVAL '24 hours'
      AND a.status IN ('pending', 'accepted', 'in_progress')
      AND ul.id IS NULL;
      
  ELSIF p_user_role = 'pilgrim' THEN
    -- Show volunteers assigned to this pilgrim who don't have recent locations
    RETURN QUERY
    SELECT 
      u.id as user_id,
      u.name as user_name,
      u.role as user_role,
      jsonb_build_object(
        'assignment_id', a.id,
        'status', a.status,
        'assigned_at', a.assigned_at,
        'request_type', hr.type,
        'priority', hr.priority
      ) as assignment_info
    FROM profiles u
    JOIN assignments a ON a.volunteer_id = u.id
    JOIN assistance_requests ar ON a.request_id = ar.id AND ar.user_id = p_user_id
    JOIN assistance_requests hr ON a.request_id = hr.id
    LEFT JOIN user_locations ul ON ul.user_id = u.id AND ul.created_at >= NOW() - INTERVAL '24 hours'
      AND a.status IN ('pending', 'accepted', 'in_progress')
      AND ul.id IS NULL;
  END IF;
END;
$$;

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION get_pilgrim_locations_for_volunteer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_volunteer_locations_for_pilgrim(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_assigned_users_without_location(UUID, TEXT) TO authenticated;

-- Step 4: Add comments for documentation
COMMENT ON FUNCTION get_pilgrim_locations_for_volunteer(UUID) IS 'Returns pilgrim locations visible to a specific volunteer based on assignments';
COMMENT ON FUNCTION get_volunteer_locations_for_pilgrim(UUID) IS 'Returns volunteer locations visible to a specific pilgrim based on assignments';
COMMENT ON FUNCTION get_assigned_users_without_location(UUID, TEXT) IS 'Returns assigned users who do not have recent location data';
