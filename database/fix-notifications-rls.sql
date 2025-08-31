-- Fix RLS policy for notifications table to allow database functions to insert notifications
-- The trigger function runs with definer rights but needs to insert notifications

-- Update the create_notification function to run with SECURITY DEFINER
CREATE OR REPLACE FUNCTION create_notification(
    user_id UUID,
    title TEXT,
    body TEXT,
    notification_type TEXT DEFAULT 'info',
    data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
SET search_path = public
AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, title, body, type, data, created_at)
    VALUES (user_id, title, body, notification_type, data, NOW())
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
