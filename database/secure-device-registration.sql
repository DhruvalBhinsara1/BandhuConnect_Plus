-- Secure device registration with proper RLS

-- First, ensure the user_devices table has proper structure
CREATE TABLE IF NOT EXISTS user_devices (
    device_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    device_name TEXT NOT NULL,
    device_token TEXT NOT NULL,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(device_token, user_id)
);

-- Drop existing indexes to recreate them
DROP INDEX IF EXISTS idx_user_devices_token;
DROP INDEX IF EXISTS idx_user_devices_user_active;

-- Create optimized indexes
CREATE INDEX idx_user_devices_user_token ON user_devices(user_id, device_token);
CREATE INDEX idx_user_devices_user_active ON user_devices(user_id, is_active);

-- Enable RLS
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage own devices" ON user_devices;
DROP POLICY IF EXISTS "Users can view own devices" ON user_devices;

-- Create precise RLS policies
CREATE POLICY "Users can view own devices" ON user_devices
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage own devices" ON user_devices
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own devices" ON user_devices
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Function to safely register or update device
CREATE OR REPLACE FUNCTION register_or_update_device(
    p_device_name TEXT,
    p_device_token TEXT
) RETURNS TABLE (
    device_id UUID,
    status TEXT,
    message TEXT
) AS $$
DECLARE
    v_user_id UUID;
    v_existing_device_id UUID;
    v_new_device_id UUID;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN QUERY SELECT 
            NULL::UUID,
            'error'::TEXT,
            'User not authenticated'::TEXT;
        RETURN;
    END IF;

    -- Check if device exists for this user
    SELECT device_id INTO v_existing_device_id
    FROM user_devices
    WHERE user_id = v_user_id
    AND device_token = p_device_token;

    IF v_existing_device_id IS NOT NULL THEN
        -- Update existing device
        UPDATE user_devices
        SET 
            device_name = p_device_name,
            is_active = true,
            last_active = NOW()
        WHERE device_id = v_existing_device_id
        AND user_id = v_user_id;

        RETURN QUERY SELECT 
            v_existing_device_id,
            'updated'::TEXT,
            'Device updated successfully'::TEXT;
    ELSE
        -- Insert new device
        INSERT INTO user_devices (
            user_id,
            device_name,
            device_token,
            is_active,
            last_active
        ) VALUES (
            v_user_id,
            p_device_name,
            p_device_token,
            true,
            NOW()
        )
        RETURNING device_id INTO v_new_device_id;

        -- Deactivate old devices for this user if too many
        UPDATE user_devices
        SET is_active = false
        WHERE user_id = v_user_id
        AND device_id != v_new_device_id
        AND created_at < NOW() - INTERVAL '30 days';

        RETURN QUERY SELECT 
            v_new_device_id,
            'inserted'::TEXT,
            'New device registered successfully'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions but keep RLS active
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_devices TO authenticated;
GRANT EXECUTE ON FUNCTION register_or_update_device TO authenticated;

-- Create cleanup function that respects RLS
CREATE OR REPLACE FUNCTION cleanup_inactive_devices() RETURNS TABLE (
    devices_cleaned INTEGER,
    status TEXT
) AS $$
DECLARE
    v_user_id UUID;
    v_cleaned INTEGER;
BEGIN
    v_user_id := auth.uid();
    
    WITH deleted AS (
        DELETE FROM user_devices
        WHERE user_id = v_user_id
        AND is_active = false
        AND last_active < NOW() - INTERVAL '30 days'
        RETURNING *
    )
    SELECT COUNT(*) INTO v_cleaned FROM deleted;

    RETURN QUERY SELECT 
        v_cleaned,
        'success'::TEXT;
END;
$$ LANGUAGE plpgsql;
