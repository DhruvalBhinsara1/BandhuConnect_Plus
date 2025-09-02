-- Complete setup script for location tracking functionality
-- Run this in your Supabase SQL Editor to enable map features

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can view all user locations" ON user_locations;
DROP POLICY IF EXISTS "Users can view own location" ON user_locations;
DROP POLICY IF EXISTS "Volunteers can see assigned pilgrim locations" ON user_locations;
DROP POLICY IF EXISTS "Pilgrims can see assigned volunteer locations" ON user_locations;
DROP POLICY IF EXISTS "Users can manage own location" ON user_locations;

-- Drop existing triggers first (they depend on functions)
DROP TRIGGER IF EXISTS update_user_locations_timestamp ON user_locations;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS update_user_location(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);
DROP FUNCTION IF EXISTS deactivate_user_location();
DROP FUNCTION IF EXISTS get_all_active_locations();
DROP FUNCTION IF EXISTS update_location_timestamp();

-- Create user_locations table for real-time location tracking
CREATE TABLE IF NOT EXISTS user_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  altitude DOUBLE PRECISION,
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_active ON user_locations(is_active);
CREATE INDEX IF NOT EXISTS idx_user_locations_updated ON user_locations(last_updated);

-- Enable RLS
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_locations

-- Admin can see all locations
CREATE POLICY "Admins can view all user locations" ON user_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Users can view their own location
CREATE POLICY "Users can view own location" ON user_locations
  FOR SELECT USING (user_id = auth.uid());

-- Volunteers can see pilgrim locations for their assigned requests
CREATE POLICY "Volunteers can see assigned pilgrim locations" ON user_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'volunteer'
    ) AND
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN assistance_requests ar ON a.request_id = ar.id
      WHERE a.volunteer_id = auth.uid()
      AND ar.user_id = user_locations.user_id
      AND a.status IN ('accepted', 'in_progress')
    )
  );

-- Pilgrims can see volunteer locations for their requests
CREATE POLICY "Pilgrims can see assigned volunteer locations" ON user_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'pilgrim'
    ) AND
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN assistance_requests ar ON a.request_id = ar.id
      WHERE ar.user_id = auth.uid()
      AND a.volunteer_id = user_locations.user_id
      AND a.status IN ('accepted', 'in_progress')
    )
  );

-- Users can insert/update their own location
CREATE POLICY "Users can manage own location" ON user_locations
  FOR ALL USING (user_id = auth.uid());

-- Function to update user location
CREATE OR REPLACE FUNCTION update_user_location(
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_accuracy DOUBLE PRECISION DEFAULT NULL,
  p_heading DOUBLE PRECISION DEFAULT NULL,
  p_speed DOUBLE PRECISION DEFAULT NULL,
  p_altitude DOUBLE PRECISION DEFAULT NULL
) RETURNS user_locations AS $$
DECLARE
  result user_locations;
BEGIN
  INSERT INTO user_locations (
    user_id, latitude, longitude, accuracy, heading, speed, altitude, last_updated
  ) VALUES (
    auth.uid(), p_latitude, p_longitude, p_accuracy, p_heading, p_speed, p_altitude, NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    accuracy = EXCLUDED.accuracy,
    heading = EXCLUDED.heading,
    speed = EXCLUDED.speed,
    altitude = EXCLUDED.altitude,
    last_updated = NOW(),
    is_active = true
  RETURNING * INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deactivate user location (when they go offline)
CREATE OR REPLACE FUNCTION deactivate_user_location() RETURNS void AS $$
BEGIN
  UPDATE user_locations 
  SET is_active = false, last_updated = NOW()
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active locations with user info for admin view
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
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ul.id as location_id,
    ul.user_id,
    p.name as user_name,
    p.role as user_role,
    ul.latitude,
    ul.longitude,
    ul.accuracy,
    ul.last_updated,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'request_id', ar.id,
          'request_title', ar.title,
          'assignment_id', a.id,
          'assignment_status', a.status,
          'pilgrim_name', CASE WHEN p.role = 'volunteer' THEN pp.name ELSE NULL END,
          'volunteer_name', CASE WHEN p.role = 'pilgrim' THEN pv.name ELSE NULL END
        )
      ) FILTER (WHERE a.id IS NOT NULL),
      '[]'::jsonb
    ) as assignment_info
  FROM user_locations ul
  JOIN profiles p ON ul.user_id = p.id
  LEFT JOIN assignments a ON (
    (p.role = 'volunteer' AND a.volunteer_id = ul.user_id AND a.status IN ('accepted', 'in_progress')) OR
    (p.role = 'pilgrim' AND EXISTS (
      SELECT 1 FROM assistance_requests ar2 
      WHERE ar2.user_id = ul.user_id 
      AND ar2.id = a.request_id 
      AND a.status IN ('accepted', 'in_progress')
    ))
  )
  LEFT JOIN assistance_requests ar ON a.request_id = ar.id
  LEFT JOIN profiles pp ON (p.role = 'volunteer' AND ar.user_id = pp.id)
  LEFT JOIN profiles pv ON (p.role = 'pilgrim' AND a.volunteer_id = pv.id)
  WHERE ul.is_active = true 
  AND ul.last_updated > NOW() - INTERVAL '10 minutes'
  GROUP BY ul.id, ul.user_id, p.name, p.role, ul.latitude, ul.longitude, ul.accuracy, ul.last_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update last_updated timestamp
CREATE OR REPLACE FUNCTION update_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_locations_timestamp
  BEFORE UPDATE ON user_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_location_timestamp();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_locations TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_location TO authenticated;
GRANT EXECUTE ON FUNCTION deactivate_user_location TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_active_locations TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Location tracking setup completed successfully!';
  RAISE NOTICE 'You can now use the map features in your BandhuConnect+ app.';
END $$;
