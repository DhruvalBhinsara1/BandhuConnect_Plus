-- Final Debug and Fix for Assignment Function
-- Comprehensive solution to identify and resolve the function issue

-- 1. Check basic data existence
SELECT 'Data Check - Assignments:' as section, COUNT(*) as total_assignments FROM assignments;
SELECT 'Data Check - Active Assignments:' as section, COUNT(*) as active_assignments 
FROM assignments WHERE status IN ('pending', 'accepted', 'in_progress');

-- 2. Check current auth user
SELECT 'Auth Check:' as section, auth.uid() as user_id, auth.role() as role;

-- 3. Show all assignment data for debugging
SELECT 'All Assignment Data:' as section;
SELECT 
    a.id as assignment_id,
    a.volunteer_id,
    a.pilgrim_id, 
    a.status,
    a.assigned,
    a.request_id,
    pv.name as volunteer_name,
    pv.role as volunteer_role,
    pu.name as pilgrim_name
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
LEFT JOIN users pu ON a.pilgrim_id = pu.id
ORDER BY a.created_at DESC;

-- 4. Create a working version of the function with better error handling
DROP FUNCTION IF EXISTS get_my_assignment_fixed();

CREATE OR REPLACE FUNCTION get_my_assignment_fixed()
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
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- If no authenticated user, return empty
    IF current_user_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Get user role from profiles
    SELECT role INTO user_role FROM profiles WHERE id = current_user_id;
    
    -- If user not found in profiles, return empty
    IF user_role IS NULL THEN
        RETURN;
    END IF;
    
    -- Handle volunteer case
    IF user_role = 'volunteer' THEN
        RETURN QUERY
        SELECT 
            a.id::UUID,
            a.pilgrim_id::UUID,
            COALESCE(pu.name, 'Unknown Pilgrim')::TEXT,
            'pilgrim'::TEXT,
            true::BOOLEAN,
            true::BOOLEAN
        FROM assignments a
        LEFT JOIN users pu ON a.pilgrim_id = pu.id
        WHERE a.volunteer_id = current_user_id
        AND a.status IN ('pending', 'accepted', 'in_progress')
        ORDER BY a.assigned_at DESC
        LIMIT 1;
        
    -- Handle pilgrim case  
    ELSIF user_role = 'pilgrim' THEN
        RETURN QUERY
        SELECT 
            a.id::UUID,
            a.volunteer_id::UUID,
            COALESCE(pv.name, 'Unknown Volunteer')::TEXT,
            COALESCE(pv.role, 'volunteer')::TEXT,
            true::BOOLEAN,
            true::BOOLEAN
        FROM assignments a
        LEFT JOIN assistance_requests ar ON a.request_id = ar.id
        LEFT JOIN profiles pv ON a.volunteer_id = pv.id
        WHERE ar.user_id = current_user_id
        AND a.status IN ('pending', 'accepted', 'in_progress')
        ORDER BY a.assigned_at DESC
        LIMIT 1;
    END IF;
    
    RETURN;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_my_assignment_fixed() TO authenticated;

-- 5. Test the fixed function
SELECT 'Testing Fixed Function:' as section;
SELECT * FROM get_my_assignment_fixed();

-- 6. Replace the original function with the fixed version
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
    RETURN QUERY SELECT * FROM get_my_assignment_fixed();
END;
$$;

GRANT EXECUTE ON FUNCTION get_my_assignment() TO authenticated;

-- 7. Final test
SELECT 'Final Test - Original Function:' as section;
SELECT * FROM get_my_assignment();
