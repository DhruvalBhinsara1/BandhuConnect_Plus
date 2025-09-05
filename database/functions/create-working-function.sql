-- Create Working Assignment Function
-- Simple, working version without dependencies

-- 1. First check basic data
SELECT COUNT(*) as total_assignments FROM assignments;
SELECT COUNT(*) as active_assignments FROM assignments WHERE status IN ('pending', 'accepted', 'in_progress');

-- 2. Check current user
SELECT auth.uid() as current_user, auth.role() as auth_role;

-- 3. Create the working function
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
DECLARE
    current_user_id UUID;
    user_role TEXT;
BEGIN
    -- Get current user
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Get user role
    SELECT role INTO user_role FROM profiles WHERE id = current_user_id;
    IF user_role IS NULL THEN
        RETURN;
    END IF;
    
    -- Volunteer: get pilgrim assignment
    IF user_role = 'volunteer' THEN
        RETURN QUERY
        SELECT 
            a.id,
            a.pilgrim_id,
            COALESCE(pu.name, 'Unknown'),
            'pilgrim'::TEXT,
            true,
            true
        FROM assignments a
        LEFT JOIN users pu ON a.pilgrim_id = pu.id
        WHERE a.volunteer_id = current_user_id
        AND a.status IN ('pending', 'accepted', 'in_progress')
        ORDER BY a.assigned_at DESC
        LIMIT 1;
        
    -- Pilgrim: get volunteer assignment
    ELSIF user_role = 'pilgrim' THEN
        RETURN QUERY
        SELECT 
            a.id,
            a.volunteer_id,
            COALESCE(pv.name, 'Unknown'),
            'volunteer'::TEXT,
            true,
            true
        FROM assignments a
        LEFT JOIN assistance_requests ar ON a.request_id = ar.id
        LEFT JOIN profiles pv ON a.volunteer_id = pv.id
        WHERE ar.user_id = current_user_id
        AND a.status IN ('pending', 'accepted', 'in_progress')
        ORDER BY a.assigned_at DESC
        LIMIT 1;
    END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_my_assignment() TO authenticated;

-- 4. Test the function
SELECT * FROM get_my_assignment();
