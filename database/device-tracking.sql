-- Add device tracking table
CREATE TABLE IF NOT EXISTS user_devices (
    device_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_name TEXT,
    device_token TEXT UNIQUE,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, device_token)
);

-- Add RLS policies
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own devices"
    ON user_devices FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices"
    ON user_devices FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to register/update device
CREATE OR REPLACE FUNCTION register_device(
    p_device_name TEXT,
    p_device_token TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_device_id UUID;
    v_existing_count INT;
BEGIN
    -- Check if user has too many active devices
    SELECT COUNT(*) INTO v_existing_count
    FROM user_devices
    WHERE user_id = auth.uid()
    AND is_active = true;

    -- If user has 2 or more active devices, deactivate the oldest one
    IF v_existing_count >= 2 THEN
        UPDATE user_devices
        SET is_active = false
        WHERE device_id = (
            SELECT device_id
            FROM user_devices
            WHERE user_id = auth.uid()
            AND is_active = true
            ORDER BY last_active ASC
            LIMIT 1
        );
    END IF;

    -- Insert or update device
    INSERT INTO user_devices (user_id, device_name, device_token)
    VALUES (auth.uid(), p_device_name, p_device_token)
    ON CONFLICT (user_id, device_token) DO UPDATE
    SET last_active = NOW(),
        is_active = true
    RETURNING device_id INTO v_device_id;

    RETURN v_device_id;
END;
$$;
