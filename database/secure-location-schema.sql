-- BandhuConnect+ Secure Location Tracking Schema
-- Designed for strict role separation and privacy via RLS
-- Follows the three-entity model: Users, Assignments, Locations

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create role enum (hardcoded in app builds)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('pilgrim', 'volunteer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. USERS TABLE (simplified profiles)
-- Stores identity and role only - minimal data exposure
CREATE TABLE IF NOT EXISTS users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ASSIGNMENTS TABLE (direct pilgrim-volunteer pairing)
-- Simple 1:1 relationship between pilgrim and volunteer
CREATE TABLE IF NOT EXISTS assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pilgrim_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. LOCATIONS TABLE (latest coordinates only)
-- Stores only the most recent location per user
CREATE TABLE IF NOT EXISTS locations (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
    latitude NUMERIC(10,8) NOT NULL,
    longitude NUMERIC(11,8) NOT NULL,
    accuracy NUMERIC(10,2),
    speed NUMERIC(10,2),
    bearing NUMERIC(5,2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent invalid coordinates
    CONSTRAINT valid_latitude CHECK (latitude >= -90 AND latitude <= 90),
    CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180),
    CONSTRAINT valid_accuracy CHECK (accuracy >= 0)
);

-- Create performance indexes (conditional creation)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_locations_updated ON locations(last_updated DESC);

-- Add missing columns to existing tables if they don't exist
DO $$ 
BEGIN
    -- Add is_active column to assignments if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assignments' AND column_name = 'is_active') THEN
        ALTER TABLE assignments ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Add pilgrim_id column to assignments if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assignments' AND column_name = 'pilgrim_id') THEN
        ALTER TABLE assignments ADD COLUMN pilgrim_id UUID REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add volunteer_id column to assignments if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assignments' AND column_name = 'volunteer_id') THEN
        ALTER TABLE assignments ADD COLUMN volunteer_id UUID REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add is_active column to users if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'is_active') THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Clean up duplicate assignments before creating unique constraints
DO $$
BEGIN
    -- Clean up duplicate active assignments for volunteers
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'assignments' AND column_name = 'volunteer_id') THEN
        
        -- Keep only the most recent assignment per volunteer
        DELETE FROM assignments a1 
        WHERE EXISTS (
            SELECT 1 FROM assignments a2 
            WHERE a2.volunteer_id = a1.volunteer_id 
            AND a2.id != a1.id 
            AND COALESCE(a2.assigned_at, a2.created_at) > COALESCE(a1.assigned_at, a1.created_at)
        );
        
        -- Keep only the most recent assignment per pilgrim  
        DELETE FROM assignments a1 
        WHERE EXISTS (
            SELECT 1 FROM assignments a2 
            WHERE a2.pilgrim_id = a1.pilgrim_id 
            AND a2.id != a1.id 
            AND COALESCE(a2.assigned_at, a2.created_at) > COALESCE(a1.assigned_at, a1.created_at)
        );
    END IF;
END $$;

-- Create conditional indexes after ensuring columns exist and cleaning duplicates
DO $$
BEGIN
    -- Create indexes only if columns exist
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'is_active') THEN
        CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'assignments' AND column_name = 'is_active') THEN
        CREATE INDEX IF NOT EXISTS idx_assignments_active ON assignments(is_active);
        CREATE INDEX IF NOT EXISTS idx_assignments_pilgrim_active ON assignments(pilgrim_id) WHERE is_active = true;
        CREATE INDEX IF NOT EXISTS idx_assignments_volunteer_active ON assignments(volunteer_id) WHERE is_active = true;
        
        -- Create unique constraints for active assignments (after cleanup)
        CREATE UNIQUE INDEX IF NOT EXISTS idx_assignments_unique_active_pilgrim 
            ON assignments(pilgrim_id) WHERE is_active = true AND pilgrim_id IS NOT NULL;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_assignments_unique_active_volunteer 
            ON assignments(volunteer_id) WHERE is_active = true AND volunteer_id IS NOT NULL;
    END IF;
END $$;

-- Updated timestamp triggers
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER assignments_updated_at BEFORE UPDATE ON assignments 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Location update trigger (always updates timestamp on any change)
CREATE OR REPLACE FUNCTION update_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER locations_updated_at BEFORE UPDATE ON locations 
    FOR EACH ROW EXECUTE FUNCTION update_location_timestamp();

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- STRICT RLS POLICIES FOR PRIVACY

-- Users table policies (minimal exposure)
CREATE POLICY "users_own_profile" ON users FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "users_assigned_counterpart" ON users FOR SELECT 
    USING (
        -- Pilgrims can see their assigned volunteer's basic info
        (role = 'volunteer' AND EXISTS (
            SELECT 1 FROM assignments 
            WHERE volunteer_id = users.id 
            AND pilgrim_id = auth.uid() 
            AND is_active = true
        )) OR
        -- Volunteers can see their assigned pilgrim's basic info
        (role = 'pilgrim' AND EXISTS (
            SELECT 1 FROM assignments 
            WHERE pilgrim_id = users.id 
            AND volunteer_id = auth.uid() 
            AND is_active = true
        )) OR
        -- Admins can see all users
        (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    );

CREATE POLICY "users_update_own" ON users FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON users FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Assignments table policies (strict pairing visibility)
CREATE POLICY "assignments_view_own" ON assignments FOR SELECT 
    USING (
        auth.uid() = pilgrim_id OR 
        auth.uid() = volunteer_id OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "assignments_admin_manage" ON assignments FOR ALL 
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Locations table policies (CORE SECURITY - only assigned pairs can see each other)
CREATE POLICY "locations_own" ON locations FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "locations_assigned_counterpart" ON locations FOR SELECT 
    USING (
        -- Pilgrims can see their assigned volunteer's location
        EXISTS (
            SELECT 1 FROM assignments 
            WHERE pilgrim_id = auth.uid() 
            AND volunteer_id = locations.user_id 
            AND is_active = true
        ) OR
        -- Volunteers can see their assigned pilgrim's location
        EXISTS (
            SELECT 1 FROM assignments 
            WHERE volunteer_id = auth.uid() 
            AND pilgrim_id = locations.user_id 
            AND is_active = true
        ) OR
        -- Admins can see all locations
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "locations_insert_own" ON locations FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "locations_update_own" ON locations FOR UPDATE 
    USING (auth.uid() = user_id);

-- Automatic cleanup function (30-day retention)
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Remove inactive assignments older than 30 days
    DELETE FROM assignments 
    WHERE is_active = false 
    AND updated_at < NOW() - INTERVAL '30 days';
    
    -- Remove locations for users who haven't updated in 30 days
    DELETE FROM locations 
    WHERE last_updated < NOW() - INTERVAL '30 days';
    
    -- Log cleanup
    RAISE NOTICE 'Cleaned up old assignment and location data';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (requires pg_cron extension in production)
-- SELECT cron.schedule('cleanup-old-data', '0 2 * * *', 'SELECT cleanup_old_data();');

-- Helper functions for app queries
CREATE OR REPLACE FUNCTION get_my_assignment()
RETURNS TABLE (
    assignment_id UUID,
    counterpart_id UUID,
    counterpart_name VARCHAR(255),
    counterpart_role user_role,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        CASE 
            WHEN a.pilgrim_id = auth.uid() THEN a.volunteer_id
            ELSE a.pilgrim_id
        END as counterpart_id,
        u.name as counterpart_name,
        u.role as counterpart_role,
        a.is_active
    FROM assignments a
    JOIN users u ON (
        CASE 
            WHEN a.pilgrim_id = auth.uid() THEN u.id = a.volunteer_id
            ELSE u.id = a.pilgrim_id
        END
    )
    WHERE (a.pilgrim_id = auth.uid() OR a.volunteer_id = auth.uid())
    AND a.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_counterpart_location()
RETURNS TABLE (
    user_id UUID,
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8),
    accuracy NUMERIC(10,2),
    speed NUMERIC(10,2),
    bearing NUMERIC(5,2),
    last_updated TIMESTAMP WITH TIME ZONE,
    minutes_ago INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.user_id,
        l.latitude,
        l.longitude,
        l.accuracy,
        l.speed,
        l.bearing,
        l.last_updated,
        EXTRACT(EPOCH FROM (NOW() - l.last_updated))::INTEGER / 60 as minutes_ago
    FROM locations l
    WHERE l.user_id IN (
        SELECT 
            CASE 
                WHEN a.pilgrim_id = auth.uid() THEN a.volunteer_id
                ELSE a.pilgrim_id
            END
        FROM assignments a
        WHERE (a.pilgrim_id = auth.uid() OR a.volunteer_id = auth.uid())
        AND a.is_active = true
    )
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
