-- Fix Function User Context Issue
-- The function might not be working due to auth context or RLS policies

-- 1. Create a version that works with explicit user ID for testing
CREATE OR REPLACE FUNCTION get_my_assignment_debug(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    assignment_id UUID,
    counterpart_id UUID,
    counterpart_name TEXT,
    counterpart_role TEXT,
    is_active BOOLEAN,
    assigned BOOLEAN,
    debug_info TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user_id UUID;
    user_role TEXT;
BEGIN
    -- Use provided user ID or current auth user
    target_user_id := COALESCE(p_user_id, auth.uid());
    
    -- Check if user exists in profiles
    SELECT role INTO user_role FROM profiles WHERE id = target_user_id;
    
    IF user_role IS NULL THEN
        RETURN QUERY SELECT 
            NULL::UUID, NULL::UUID, 'User not found in profiles'::TEXT, 
            ''::TEXT, false::BOOLEAN, false::BOOLEAN, 
            ('User ID: ' || target_user_id::TEXT)::TEXT;
        RETURN;
    END IF;
    
    -- Volunteer: get assigned pilgrim
    IF user_role = 'volunteer' THEN
        RETURN QUERY
        SELECT 
            a.id::UUID,
            a.pilgrim_id::UUID,
            COALESCE(pu.name, 'Unknown')::TEXT,
            'pilgrim'::TEXT,
            CASE WHEN a.status IN ('pending', 'accepted', 'in_progress') THEN true ELSE false END::BOOLEAN,
            true::BOOLEAN,
            ('Volunteer query - Status: ' || a.status || ' - Assigned: ' || COALESCE(a.assigned::TEXT, 'NULL'))::TEXT
        FROM assignments a
        JOIN users pu ON a.pilgrim_id = pu.id
        WHERE a.volunteer_id = target_user_id
        AND a.status IN ('pending', 'accepted', 'in_progress')
        ORDER BY a.assigned_at DESC
        LIMIT 1;
        
    -- Pilgrim: get assigned volunteer
    ELSIF user_role = 'pilgrim' THEN
        RETURN QUERY
        SELECT 
            a.id::UUID,
            a.volunteer_id::UUID,
            COALESCE(pv.name, 'Unknown')::TEXT,
            pv.role::TEXT,
            CASE WHEN a.status IN ('pending', 'accepted', 'in_progress') THEN true ELSE false END::BOOLEAN,
            true::BOOLEAN,
            ('Pilgrim query - Status: ' || a.status || ' - Assigned: ' || COALESCE(a.assigned::TEXT, 'NULL'))::TEXT
        FROM assignments a
        JOIN assistance_requests ar ON a.request_id = ar.id
        JOIN profiles pv ON a.volunteer_id = pv.id
        WHERE ar.user_id = target_user_id
        AND a.status IN ('pending', 'accepted', 'in_progress')
        ORDER BY a.assigned_at DESC
        LIMIT 1;
    ELSE
        RETURN QUERY SELECT 
            NULL::UUID, NULL::UUID, ('Unknown role: ' || user_role)::TEXT, 
            ''::TEXT, false::BOOLEAN, false::BOOLEAN, 
            ('User role: ' || user_role)::TEXT;
    END IF;
    
    -- If no results, return debug info
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            NULL::UUID, NULL::UUID, 'No active assignments found'::TEXT, 
            ''::TEXT, false::BOOLEAN, false::BOOLEAN, 
            ('Role: ' || user_role || ' - User ID: ' || target_user_id::TEXT)::TEXT;
    END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_my_assignment_debug(UUID) TO authenticated;

-- Test with specific user IDs from your debug data
-- Replace these UUIDs with actual user IDs from your system
SELECT 'Testing with Dr. Raj Patel (volunteer):' as test_case;
SELECT * FROM get_my_assignment_debug('a81c0e62-4bec-4552-bca4-b158c6afa790'::UUID);

SELECT 'Testing with Dhruval Bhinsara (pilgrim):' as test_case;  
SELECT * FROM get_my_assignment_debug('55595c83a-55ef-426e-a10e-28ff9b70ce44'::UUID);

-- Test with current auth user
SELECT 'Testing with current auth user:' as test_case;
SELECT * FROM get_my_assignment_debug();

-- Also test original function
SELECT 'Testing original function:' as test_case;
SELECT * FROM get_my_assignment();
