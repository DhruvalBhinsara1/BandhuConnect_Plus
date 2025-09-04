-- Migration: Add assigned field to assignments table
-- This field controls whether the assignment is actively assigned (true) or just exists (false)

-- Add the assigned column to assignments table
ALTER TABLE assignments 
ADD COLUMN assigned BOOLEAN NOT NULL DEFAULT false;

-- Update existing assignments to be assigned=true if they are active
UPDATE assignments 
SET assigned = true 
WHERE status IN ('accepted', 'in_progress');

-- Create index for performance
CREATE INDEX idx_assignments_assigned ON assignments(assigned);

-- Update the get_my_assignment function to include assigned field
CREATE OR REPLACE FUNCTION get_my_assignment()
RETURNS TABLE (
    assignment_id UUID,
    counterpart_id UUID,
    counterpart_name VARCHAR(255),
    counterpart_role VARCHAR(50),
    is_active BOOLEAN,
    assigned BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role VARCHAR(50);
BEGIN
    -- Get current user's role
    SELECT role INTO user_role 
    FROM profiles 
    WHERE id = auth.uid();
    
    IF user_role IS NULL THEN
        RETURN;
    END IF;
    
    IF user_role = 'volunteer' THEN
        -- Volunteer: get assigned pilgrim
        RETURN QUERY
        SELECT 
            a.id as assignment_id,
            ar.user_id as counterpart_id,
            p.name as counterpart_name,
            p.role as counterpart_role,
            (a.status IN ('accepted', 'in_progress'))::BOOLEAN as is_active,
            a.assigned as assigned
        FROM assignments a
        JOIN assistance_requests ar ON a.request_id = ar.id
        JOIN profiles p ON ar.user_id = p.id
        WHERE a.volunteer_id = auth.uid()
        ORDER BY a.assigned_at DESC
        LIMIT 1;
        
    ELSIF user_role = 'pilgrim' THEN
        -- Pilgrim: get assigned volunteer
        RETURN QUERY
        SELECT 
            a.id as assignment_id,
            a.volunteer_id as counterpart_id,
            p.name as counterpart_name,
            p.role as counterpart_role,
            (a.status IN ('accepted', 'in_progress'))::BOOLEAN as is_active,
            a.assigned as assigned
        FROM assignments a
        JOIN assistance_requests ar ON a.request_id = ar.id
        JOIN profiles p ON a.volunteer_id = p.id
        WHERE ar.user_id = auth.uid()
        ORDER BY a.assigned_at DESC
        LIMIT 1;
    END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_my_assignment() TO authenticated;
