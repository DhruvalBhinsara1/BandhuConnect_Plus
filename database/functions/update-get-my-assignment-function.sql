-- Update get_my_assignment Function to Remove assigned=true Requirement
-- This will make the map show assignments that are in active status regardless of assigned flag

DROP FUNCTION IF EXISTS get_my_assignment();

CREATE OR REPLACE FUNCTION get_my_assignment()
RETURNS TABLE (
    assignment_id UUID,
    counterpart_id UUID,
    counterpart_name TEXT,
    counterpart_role TEXT,
    is_active BOOLEAN,
    assigned BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user exists in profiles
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()) THEN
        RETURN;
    END IF;
    
    -- Volunteer: get assigned pilgrim
    IF EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'volunteer') THEN
        RETURN QUERY
        SELECT 
            a.id::UUID,
            a.pilgrim_id::UUID,
            COALESCE(pu.name, 'Unknown')::TEXT,
            'pilgrim'::TEXT,
            CASE WHEN a.status IN ('pending', 'accepted', 'in_progress') THEN true ELSE false END::BOOLEAN,
            COALESCE(a.assigned, true)::BOOLEAN  -- Default to true for active assignments
        FROM assignments a
        JOIN users pu ON a.pilgrim_id = pu.id
        WHERE a.volunteer_id = auth.uid()
        AND a.status IN ('pending', 'accepted', 'in_progress')
        ORDER BY a.assigned_at DESC
        LIMIT 1;
        
    -- Pilgrim: get assigned volunteer
    ELSIF EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'pilgrim') THEN
        RETURN QUERY
        SELECT 
            a.id::UUID,
            a.volunteer_id::UUID,
            COALESCE(pv.name, 'Unknown')::TEXT,
            pv.role::TEXT,
            CASE WHEN a.status IN ('pending', 'accepted', 'in_progress') THEN true ELSE false END::BOOLEAN,
            COALESCE(a.assigned, true)::BOOLEAN  -- Default to true for active assignments
        FROM assignments a
        JOIN assistance_requests ar ON a.request_id = ar.id
        JOIN profiles pv ON a.volunteer_id = pv.id
        WHERE ar.user_id = auth.uid()
        AND a.status IN ('pending', 'accepted', 'in_progress')
        ORDER BY a.assigned_at DESC
        LIMIT 1;
    END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_my_assignment() TO authenticated;
