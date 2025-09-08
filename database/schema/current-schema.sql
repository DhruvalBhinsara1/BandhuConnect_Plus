-- BandhuConnect+ Current Database Schema
-- Updated: September 2025
-- This file reflects the current production state of the database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Custom types
CREATE TYPE user_role AS ENUM ('pilgrim', 'volunteer', 'admin');
CREATE TYPE volunteer_status AS ENUM ('available', 'busy', 'offline');
CREATE TYPE request_status AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE assignment_status AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');
CREATE TYPE request_type AS ENUM ('medical', 'navigation', 'emergency', 'general', 'food', 'accommodation');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');

-- Profiles table (main user data)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'pilgrim',
    volunteer_status volunteer_status DEFAULT 'offline',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User locations table (real-time location tracking)
CREATE TABLE user_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(8, 2),
    altitude DECIMAL(8, 2),
    heading DECIMAL(5, 2),
    speed DECIMAL(5, 2),
    is_active BOOLEAN DEFAULT true,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Assistance requests table
CREATE TABLE assistance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type request_type NOT NULL DEFAULT 'general',
    priority priority_level NOT NULL DEFAULT 'medium',
    status request_status NOT NULL DEFAULT 'pending',
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    location_description TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignments table (volunteer-pilgrim assignments)
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES assistance_requests(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status assignment_status NOT NULL DEFAULT 'pending',
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    UNIQUE(request_id)
);

-- Indexes for performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_volunteer_status ON profiles(volunteer_status);
CREATE INDEX idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX idx_user_locations_active ON user_locations(is_active);
CREATE INDEX idx_assistance_requests_status ON assistance_requests(status);
CREATE INDEX idx_assistance_requests_user_id ON assistance_requests(user_id);
CREATE INDEX idx_assignments_volunteer_id ON assignments(volunteer_id);
CREATE INDEX idx_assignments_request_id ON assignments(request_id);
CREATE INDEX idx_assignments_status ON assignments(status);

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- User locations policies
CREATE POLICY "Users can view relevant locations" ON user_locations FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM assignments a 
        JOIN assistance_requests ar ON a.request_id = ar.id 
        WHERE (a.volunteer_id = auth.uid() AND ar.user_id = user_locations.user_id)
           OR (ar.user_id = auth.uid() AND a.volunteer_id = user_locations.user_id)
    )
);

CREATE POLICY "Users can update own location" ON user_locations FOR ALL USING (user_id = auth.uid());

-- Assistance requests policies  
CREATE POLICY "Users can view relevant requests" ON assistance_requests FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM assignments WHERE request_id = assistance_requests.id AND volunteer_id = auth.uid())
);

CREATE POLICY "Pilgrims can manage own requests" ON assistance_requests FOR ALL USING (user_id = auth.uid());

-- Assignments policies
CREATE POLICY "Users can view relevant assignments" ON assignments FOR SELECT USING (
    volunteer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM assistance_requests WHERE id = assignments.request_id AND user_id = auth.uid())
);

CREATE POLICY "Volunteers can update assignments" ON assignments FOR UPDATE USING (volunteer_id = auth.uid());

-- Functions for location tracking
CREATE OR REPLACE FUNCTION update_user_location(
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_accuracy DECIMAL DEFAULT NULL,
    p_altitude DECIMAL DEFAULT NULL,
    p_heading DECIMAL DEFAULT NULL,
    p_speed DECIMAL DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    location_id UUID;
BEGIN
    INSERT INTO user_locations (
        user_id, latitude, longitude, accuracy, altitude, heading, speed, is_active, last_updated
    ) VALUES (
        auth.uid(), p_latitude, p_longitude, p_accuracy, p_altitude, p_heading, p_speed, true, NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        accuracy = EXCLUDED.accuracy,
        altitude = EXCLUDED.altitude,
        heading = EXCLUDED.heading,
        speed = EXCLUDED.speed,
        is_active = true,
        last_updated = NOW()
    RETURNING id INTO location_id;
    
    RETURN location_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get assignment locations
CREATE OR REPLACE FUNCTION get_assignment_locations(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    user_role user_role,
    latitude DECIMAL,
    longitude DECIMAL,
    accuracy DECIMAL,
    last_updated TIMESTAMPTZ,
    assignment_info JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
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
                    'assignment_id', a.id,
                    'request_id', a.request_id,
                    'status', a.status,
                    'request_title', ar.title
                )
            ) FILTER (WHERE a.id IS NOT NULL),
            '[]'::jsonb
        ) as assignment_info
    FROM user_locations ul
    JOIN profiles p ON ul.user_id = p.id
    LEFT JOIN assignments a ON (
        (a.volunteer_id = ul.user_id AND EXISTS (
            SELECT 1 FROM assistance_requests ar2 WHERE ar2.id = a.request_id AND ar2.user_id = COALESCE(p_user_id, auth.uid())
        )) OR
        (a.volunteer_id = COALESCE(p_user_id, auth.uid()) AND EXISTS (
            SELECT 1 FROM assistance_requests ar2 WHERE ar2.id = a.request_id AND ar2.user_id = ul.user_id
        ))
    )
    LEFT JOIN assistance_requests ar ON a.request_id = ar.id
    WHERE ul.is_active = true
    AND (
        ul.user_id = COALESCE(p_user_id, auth.uid()) OR
        EXISTS (
            SELECT 1 FROM assignments a2 
            JOIN assistance_requests ar2 ON a2.request_id = ar2.id 
            WHERE (a2.volunteer_id = COALESCE(p_user_id, auth.uid()) AND ar2.user_id = ul.user_id)
               OR (ar2.user_id = COALESCE(p_user_id, auth.uid()) AND a2.volunteer_id = ul.user_id)
        )
    )
    GROUP BY ul.user_id, p.name, p.role, ul.latitude, ul.longitude, ul.accuracy, ul.last_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assistance_requests_updated_at BEFORE UPDATE ON assistance_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
