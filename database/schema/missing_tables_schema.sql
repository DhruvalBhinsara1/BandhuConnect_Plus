-- ================================================
-- 📱 MISSING SCHEMA: Device & Location Management
-- ================================================
-- These tables should be added to your schema files
-- NOTE: These tables ALREADY EXIST in your database!
-- This file is for DOCUMENTATION purposes only.

-- Device management for push notifications
-- STATUS: ✅ ALREADY EXISTS IN DATABASE
CREATE TABLE IF NOT EXISTS user_devices (
    device_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_name TEXT,
    device_token TEXT, -- FCM/APNS token for push notifications
    last_active TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Basic location tracking (legacy/simple version)
-- STATUS: ✅ ALREADY EXISTS IN DATABASE
CREATE TABLE IF NOT EXISTS locations (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(8, 2),
    speed DECIMAL(5, 2),
    bearing DECIMAL(5, 2),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id)
);

-- Advanced location updates with PostGIS
-- STATUS: ✅ ALREADY EXISTS IN DATABASE (but empty)
CREATE TABLE IF NOT EXISTS location_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    accuracy DECIMAL(8, 2),
    speed DECIMAL(5, 2),
    heading DECIMAL(5, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance (only create if they don't exist)
-- NOTE: These may already exist in your database
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_active ON user_devices(is_active);
CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations(user_id);
CREATE INDEX IF NOT EXISTS idx_location_updates_user_id ON location_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_location_updates_location ON location_updates USING GIST(location);

-- RLS Policies (only create if they don't exist)
-- NOTE: These policies may already exist in your database
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_updates ENABLE ROW LEVEL SECURITY;

-- Check if policies exist before creating them
DO $$
BEGIN
    -- Device policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_devices' AND policyname = 'Users can manage own devices') THEN
        CREATE POLICY "Users can manage own devices" ON user_devices
            FOR ALL USING (user_id = auth.uid());
    END IF;

    -- Location policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'locations' AND policyname = 'Users can view relevant locations') THEN
        CREATE POLICY "Users can view relevant locations" ON locations
            FOR SELECT USING (
                user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM assignments a
                    JOIN assistance_requests ar ON a.request_id = ar.id
                    WHERE (a.volunteer_id = auth.uid() AND ar.user_id = locations.user_id)
                       OR (ar.user_id = auth.uid() AND a.volunteer_id = locations.user_id)
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'locations' AND policyname = 'Users can update own location') THEN
        CREATE POLICY "Users can update own location" ON locations
            FOR ALL USING (user_id = auth.uid());
    END IF;

    -- Location updates policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'location_updates' AND policyname = 'Users can view relevant location updates') THEN
        CREATE POLICY "Users can view relevant location updates" ON location_updates
            FOR SELECT USING (
                user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM assignments a
                    JOIN assistance_requests ar ON a.request_id = ar.id
                    WHERE (a.volunteer_id = auth.uid() AND ar.user_id = location_updates.user_id)
                       OR (ar.user_id = auth.uid() AND a.volunteer_id = location_updates.user_id)
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'location_updates' AND policyname = 'Users can insert own location updates') THEN
        CREATE POLICY "Users can insert own location updates" ON location_updates
            FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;
END
$$;