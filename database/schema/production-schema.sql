-- =============================================================================
-- BandhuConnect+ Professional Database Schema
-- Version: 2.2.0
-- Last Updated: September 14, 2025
-- Description: Complete database schema for volunteer assistance platform
-- =============================================================================

-- Enable necessary PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =============================================================================
-- CUSTOM ENUM TYPES
-- =============================================================================

-- User role types for access control
CREATE TYPE user_role AS ENUM ('pilgrim', 'volunteer', 'admin');

-- Volunteer availability status
CREATE TYPE volunteer_status AS ENUM ('available', 'busy', 'offline');

-- Request status lifecycle management
CREATE TYPE request_status AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled');

-- Assignment status tracking
CREATE TYPE assignment_status AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');

-- Request categories for different types of assistance
CREATE TYPE request_type AS ENUM (
    'medical', 
    'emergency', 
    'lost_person', 
    'navigation', 
    'sanitation', 
    'crowd_management', 
    'guidance', 
    'general'
);

-- Priority levels for request handling
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Profiles table: Main user data (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'pilgrim',
    avatar_url TEXT,
    skills TEXT[], -- Array of volunteer skills
    location GEOGRAPHY(POINT, 4326), -- PostGIS location data
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    volunteer_status volunteer_status DEFAULT 'offline',
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_ratings INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time location tracking table
CREATE TABLE IF NOT EXISTS user_locations (
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Assistance requests table
CREATE TABLE IF NOT EXISTS assistance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type request_type NOT NULL DEFAULT 'general',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority priority_level DEFAULT 'medium',
    status request_status DEFAULT 'pending',
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    address TEXT,
    photo_url TEXT,
    estimated_duration INTEGER, -- Duration in minutes
    assignment_method TEXT DEFAULT 'auto', -- 'auto' or 'manual'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Volunteer assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES assistance_requests(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status assignment_status DEFAULT 'pending',
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    assignment_method TEXT DEFAULT 'auto', -- Track how assignment was made
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(request_id, volunteer_id)
);

-- =============================================================================
-- COMMUNICATION TABLES
-- =============================================================================

-- Chat channels for group communication
CREATE TABLE IF NOT EXISTS chat_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT DEFAULT 'general', -- 'general', 'emergency', 'request_specific'
    request_id UUID REFERENCES assistance_requests(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages for channel communication
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text', -- 'text', 'image', 'location', 'system'
    metadata JSONB, -- Additional data like coordinates, image URLs
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Direct messages for private communication
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    metadata JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL, -- 'request_assigned', 'request_completed', 'message', etc.
    data JSONB, -- Additional notification data
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- DEVICE & LOCATION MANAGEMENT TABLES
-- =============================================================================

-- Device management for push notifications
CREATE TABLE IF NOT EXISTS user_devices (
    device_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_name TEXT,
    device_token TEXT UNIQUE, -- FCM/APNS token for push notifications
    last_active TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, device_token) -- Prevent duplicate tokens per user
);

-- Basic location tracking (legacy/simple version)
CREATE TABLE IF NOT EXISTS locations (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(8, 2),
    speed DECIMAL(5, 2),
    bearing DECIMAL(5, 2),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Advanced location updates with PostGIS
CREATE TABLE IF NOT EXISTS location_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    accuracy DECIMAL(8, 2),
    speed DECIMAL(5, 2),
    heading DECIMAL(5, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

-- Profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_profiles_volunteer_status ON profiles(volunteer_status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

-- User location indexes
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_active ON user_locations(is_active);
CREATE INDEX IF NOT EXISTS idx_user_locations_updated ON user_locations(last_updated DESC);

-- Device indexes
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_active ON user_devices(is_active);
CREATE INDEX IF NOT EXISTS idx_user_devices_user_active ON user_devices(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_devices_user_token ON user_devices(user_id, device_token);

-- Location tracking indexes
CREATE INDEX IF NOT EXISTS idx_locations_updated ON locations(last_updated DESC);

-- Location updates indexes
CREATE INDEX IF NOT EXISTS idx_location_updates_user_id ON location_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_location_updates_created_at ON location_updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_location_updates_location ON location_updates USING GIST(location);

-- Assistance request indexes
CREATE INDEX IF NOT EXISTS idx_assistance_requests_user_id ON assistance_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_assistance_requests_status ON assistance_requests(status);
CREATE INDEX IF NOT EXISTS idx_assistance_requests_type ON assistance_requests(type);
CREATE INDEX IF NOT EXISTS idx_assistance_requests_location ON assistance_requests USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_assistance_requests_created ON assistance_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assistance_requests_priority ON assistance_requests(priority);

-- Assignment indexes
CREATE INDEX IF NOT EXISTS idx_assignments_request_id ON assignments(request_id);
CREATE INDEX IF NOT EXISTS idx_assignments_volunteer_id ON assignments(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_at ON assignments(assigned_at DESC);

-- Communication indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_id ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver ON direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Function to update user location
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

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL, lon1 DECIMAL, 
    lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    RETURN ST_Distance(
        ST_Point(lon1, lat1)::geography,
        ST_Point(lon2, lat2)::geography
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_updates ENABLE ROW LEVEL SECURITY;

-- Profile policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- User location policies
CREATE POLICY "Users can view relevant locations" ON user_locations FOR SELECT USING (
    -- Users can see their own location
    user_id = auth.uid() OR
    -- Volunteers can see locations of their assigned pilgrims
    EXISTS (
        SELECT 1 FROM assignments a 
        JOIN assistance_requests ar ON a.request_id = ar.id 
        WHERE a.volunteer_id = auth.uid() AND ar.user_id = user_locations.user_id 
        AND a.status IN ('accepted', 'in_progress')
    ) OR
    -- Pilgrims can see locations of their assigned volunteers
    EXISTS (
        SELECT 1 FROM assignments a 
        JOIN assistance_requests ar ON a.request_id = ar.id 
        WHERE ar.user_id = auth.uid() AND a.volunteer_id = user_locations.user_id 
        AND a.status IN ('accepted', 'in_progress')
    ) OR
    -- Admins can see all locations
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can manage own location" ON user_locations FOR ALL USING (user_id = auth.uid());

-- Assistance request policies
CREATE POLICY "Users can view relevant requests" ON assistance_requests FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM assignments WHERE request_id = assistance_requests.id AND volunteer_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Pilgrims can manage own requests" ON assistance_requests FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all requests" ON assistance_requests FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Assignment policies
CREATE POLICY "Users can view relevant assignments" ON assignments FOR SELECT USING (
    volunteer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM assistance_requests WHERE id = assignments.request_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Volunteers can update assignments" ON assignments FOR UPDATE USING (volunteer_id = auth.uid());
CREATE POLICY "Admins can manage all assignments" ON assignments FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Communication policies
CREATE POLICY "Users can view relevant channels" ON chat_channels FOR SELECT USING (true);
CREATE POLICY "Users can view relevant messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Users can send messages" ON chat_messages FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users can view relevant direct messages" ON direct_messages FOR SELECT USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
);
CREATE POLICY "Users can send direct messages" ON direct_messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Notification policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Device management policies
CREATE POLICY "Users can view own devices" ON user_devices FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own devices" ON user_devices FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own devices" ON user_devices FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own devices" ON user_devices FOR DELETE USING (auth.uid() = user_id);

-- Location tracking policies
CREATE POLICY "locations_own" ON locations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "locations_assigned_counterpart" ON locations FOR SELECT USING (
    (EXISTS ( SELECT 1
       FROM assignments
      WHERE ((assignments.pilgrim_id = auth.uid()) AND (assignments.volunteer_id = locations.user_id) AND (assignments.is_active = true)))) OR 
    (EXISTS ( SELECT 1
       FROM assignments
      WHERE ((assignments.volunteer_id = auth.uid()) AND (assignments.pilgrim_id = locations.user_id) AND (assignments.is_active = true)))) OR 
    (EXISTS ( SELECT 1
       FROM profiles
      WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role))))
);
CREATE POLICY "locations_insert_own" ON locations FOR INSERT WITH CHECK (true);
CREATE POLICY "locations_update_own" ON locations FOR UPDATE USING (auth.uid() = user_id);

-- Location updates policies
CREATE POLICY "Users can view location updates" ON location_updates FOR SELECT USING (true);
CREATE POLICY "Users can insert own location" ON location_updates FOR INSERT WITH CHECK (true);

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE profiles IS 'Main user profiles extending Supabase auth.users';
COMMENT ON TABLE user_locations IS 'Real-time location tracking for all users';
COMMENT ON TABLE assistance_requests IS 'Requests for assistance from users';
COMMENT ON TABLE assignments IS 'Volunteer assignments to assistance requests';
COMMENT ON TABLE chat_channels IS 'Group communication channels';
COMMENT ON TABLE chat_messages IS 'Messages within chat channels';
COMMENT ON TABLE direct_messages IS 'Private messages between users';
COMMENT ON TABLE notifications IS 'System notifications for users';
COMMENT ON TABLE user_devices IS 'Device tokens for push notifications';
COMMENT ON TABLE locations IS 'Basic location tracking for users';
COMMENT ON TABLE location_updates IS 'Advanced PostGIS location updates';

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
