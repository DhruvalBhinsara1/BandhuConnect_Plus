-- Fix device registration issues

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS register_device(text, text);

-- Create improved device registration function
CREATE OR REPLACE FUNCTION register_device(
    p_device_name TEXT,
    p_device_token TEXT
) RETURNS UUID AS $$
DECLARE
    v_device_id UUID;
    v_user_id UUID;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Try to update existing device first
    UPDATE user_devices 
    SET 
        device_name = p_device_name,
        is_active = true,
        last_active = NOW()
    WHERE device_token = p_device_token
    AND user_id = v_user_id
    RETURNING device_id INTO v_device_id;
    
    -- If no device was updated, insert new one
    IF v_device_id IS NULL THEN
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
        ON CONFLICT (device_token) DO UPDATE
        SET
            device_name = EXCLUDED.device_name,
            is_active = EXCLUDED.is_active,
            last_active = EXCLUDED.last_active
        RETURNING device_id INTO v_device_id;
    END IF;
    
    -- Clean up old inactive devices
    DELETE FROM user_devices
    WHERE user_id = v_user_id
    AND is_active = false
    AND last_active < NOW() - INTERVAL '30 days';
    
    RETURN v_device_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_devices_token ON user_devices(device_token);
CREATE INDEX IF NOT EXISTS idx_user_devices_active ON user_devices(is_active);

-- Update the device registration policy
DROP POLICY IF EXISTS "Users can register their devices" ON user_devices;
CREATE POLICY "Users can register their devices" ON user_devices
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION register_device TO authenticated;
