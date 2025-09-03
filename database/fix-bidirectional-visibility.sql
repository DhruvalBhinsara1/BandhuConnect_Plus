-- Fix bi-directional visibility for BandhuConnect+
-- This script updates the location sharing functions and creates test assignments

-- First, update the location sharing functions with correct table names and enum values
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
        WHERE (ha.volunteer_id = ul.user_id OR hr.user_id = ul.user_id)
        AND ha.status IN ('accepted', 'in_progress')
      ),
      '[]'::jsonb
    ) as assignment_info
  FROM (
    SELECT DISTINCT ON (ul.user_id) 
      ul.id, ul.user_id, ul.latitude, ul.longitude, ul.accuracy, ul.last_updated
    FROM user_locations ul
    ORDER BY ul.user_id, ul.last_updated DESC
  ) ul
  JOIN profiles u ON ul.user_id = u.id
  ORDER BY u.role, u.name;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_pilgrim_locations_for_volunteer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_volunteer_locations_for_pilgrim(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_active_locations() TO authenticated;

-- Now create test assignments to verify bi-directional visibility
DO $$
DECLARE
    volunteer_user_id UUID;
    pilgrim_user_id UUID;
    request_id UUID;
    assignment_id UUID;
BEGIN
    -- Find a volunteer user
    SELECT id INTO volunteer_user_id 
    FROM profiles 
    WHERE role = 'volunteer' 
    AND is_active = true 
    LIMIT 1;
    
    -- Find a pilgrim user
    SELECT id INTO pilgrim_user_id 
    FROM profiles 
    WHERE role = 'pilgrim' 
    AND is_active = true 
    LIMIT 1;
    
    -- Only proceed if we have both users
    IF volunteer_user_id IS NOT NULL AND pilgrim_user_id IS NOT NULL THEN
        
        -- Create a test assistance request from the pilgrim
        INSERT INTO assistance_requests (
            user_id,
            type,
            title,
            description,
            priority,
            status,
            location,
            address
        ) VALUES (
            pilgrim_user_id,
            'guidance',
            'Need help finding temple entrance',
            'I am lost and need directions to the main temple entrance',
            'medium',
            'in_progress',
            ST_SetSRID(ST_MakePoint(72.5680, 23.0320), 4326),
            'Near Main Temple Area'
        ) RETURNING id INTO request_id;
        
        -- Create assignment linking volunteer to pilgrim's request
        INSERT INTO assignments (
            request_id,
            volunteer_id,
            status,
            assigned_at,
            accepted_at
        ) VALUES (
            request_id,
            volunteer_user_id,
            'accepted',
            NOW() - INTERVAL '5 minutes',
            NOW() - INTERVAL '2 minutes'
        ) RETURNING id INTO assignment_id;
        
        -- Update both users' locations to be active
        INSERT INTO user_locations (user_id, latitude, longitude, is_active, last_updated)
        VALUES 
            (volunteer_user_id, 23.0325, 72.5685, true, NOW()),
            (pilgrim_user_id, 23.0320, 72.5680, true, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            is_active = true,
            last_updated = NOW();
        
        RAISE NOTICE 'Test assignment created successfully!';
        RAISE NOTICE 'Request ID: %, Assignment ID: %', request_id, assignment_id;
        RAISE NOTICE 'Volunteer: % should see Pilgrim: %', volunteer_user_id, pilgrim_user_id;
        RAISE NOTICE 'Pilgrim: % should see Volunteer: %', pilgrim_user_id, volunteer_user_id;
        
    ELSE
        RAISE NOTICE 'Could not find both volunteer and pilgrim users';
        RAISE NOTICE 'Volunteer found: %, Pilgrim found: %', 
            (volunteer_user_id IS NOT NULL), (pilgrim_user_id IS NOT NULL);
    END IF;
END $$;

-- Verify the assignment was created and test the functions
SELECT 
    ar.title as request_title,
    p1.name as pilgrim_name,
    p2.name as volunteer_name,
    a.status as assignment_status,
    a.assigned_at,
    a.accepted_at
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
JOIN profiles p1 ON ar.user_id = p1.id
JOIN profiles p2 ON a.volunteer_id = p2.id
WHERE a.status IN ('accepted', 'in_progress')
ORDER BY a.assigned_at DESC
LIMIT 5;
