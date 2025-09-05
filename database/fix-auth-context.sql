-- Fix Auth Context Issue
-- The function works but auth.uid() returns NULL

-- 1. Check RLS settings that might affect auth context
SELECT current_setting('row_security') as rls_enabled;

-- 2. Create a test function that bypasses auth context for debugging
CREATE OR REPLACE FUNCTION get_assignment_by_user_id(p_user_id UUID)
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
    user_role TEXT;
BEGIN
    -- Get user role directly
    SELECT role INTO user_role FROM profiles WHERE id = p_user_id;
    
    IF user_role IS NULL THEN
        RETURN;
    END IF;
    
    -- Volunteer logic
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
        WHERE a.volunteer_id = p_user_id
        AND a.status IN ('pending', 'accepted', 'in_progress')
        ORDER BY a.assigned_at DESC
        LIMIT 1;
        
    -- Pilgrim logic
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
        WHERE ar.user_id = p_user_id
        AND a.status IN ('pending', 'accepted', 'in_progress')
        ORDER BY a.assigned_at DESC
        LIMIT 1;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION get_assignment_by_user_id(UUID) TO authenticated;

-- 3. Test with the actual user IDs from the assignment
SELECT 'Testing with volunteer ID:' as test;
SELECT * FROM get_assignment_by_user_id('a81c0e62-4bec-4552-bca4-b158c6afa790');

-- 4. Test with pilgrim ID (if it exists)
SELECT 'Testing with pilgrim ID:' as test;
-- First find the pilgrim ID from the assignment
SELECT pilgrim_id FROM assignments WHERE status = 'pending' LIMIT 1;

-- 5. Update the original function to handle auth context better
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
BEGIN
    -- Try multiple ways to get current user
    current_user_id := auth.uid();
    
    -- If auth.uid() is null, try getting from JWT
    IF current_user_id IS NULL THEN
        current_user_id := (auth.jwt() ->> 'sub')::UUID;
    END IF;
    
    -- If still null, return empty
    IF current_user_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Use the working logic with explicit user ID
    RETURN QUERY SELECT * FROM get_assignment_by_user_id(current_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION get_my_assignment() TO authenticated;

-- 6. Test the updated function
SELECT 'Testing updated function:' as test;
SELECT * FROM get_my_assignment();
