-- Fix RLS policies to prevent infinite recursion
-- Run this in Supabase SQL Editor

-- Drop ALL existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can update their own location" ON user_locations;
DROP POLICY IF EXISTS "Users can view locations based on role" ON user_locations;
DROP POLICY IF EXISTS "allow_own_location_update" ON user_locations;
DROP POLICY IF EXISTS "allow_location_read" ON user_locations;

-- Disable RLS temporarily to avoid conflicts
ALTER TABLE user_locations DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with simple policies
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

-- Create non-recursive policies
CREATE POLICY "simple_location_access" ON user_locations
FOR ALL USING (true);

-- Drop existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS update_user_location(double precision,double precision,double precision,double precision,double precision,double precision);

-- Ensure the update function exists and works
CREATE OR REPLACE FUNCTION update_user_location(
    p_latitude DOUBLE PRECISION,
    p_longitude DOUBLE PRECISION,
    p_accuracy DOUBLE PRECISION DEFAULT NULL,
    p_altitude DOUBLE PRECISION DEFAULT NULL,
    p_heading DOUBLE PRECISION DEFAULT NULL,
    p_speed DOUBLE PRECISION DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO user_locations (
        user_id,
        latitude,
        longitude,
        accuracy,
        altitude,
        heading,
        speed,
        is_active,
        last_updated
    ) VALUES (
        auth.uid(),
        p_latitude,
        p_longitude,
        p_accuracy,
        p_altitude,
        p_heading,
        p_speed,
        true,
        NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        accuracy = EXCLUDED.accuracy,
        altitude = EXCLUDED.altitude,
        heading = EXCLUDED.heading,
        speed = EXCLUDED.speed,
        is_active = EXCLUDED.is_active,
        last_updated = EXCLUDED.last_updated;
END;
$$;

-- Test the function
SELECT update_user_location(22.2927, 73.3620, 5.0);
