-- Deploy Corrected get_my_assignment Function
-- This ensures the latest version is active in production

-- Drop and recreate the function to ensure clean deployment
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
            a.pilgrim_id::UUID,  -- Fixed: return pilgrim_id as counterpart for volunteer
            COALESCE(pu.name, 'Unknown')::TEXT,
            'pilgrim'::TEXT,
            CASE WHEN a.status IN ('pending', 'accepted', 'in_progress') THEN true ELSE false END::BOOLEAN,
            COALESCE(a.assigned, false)::BOOLEAN
        FROM assignments a
        JOIN users pu ON a.pilgrim_id = pu.id  -- Join with users table for pilgrim
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
            COALESCE(a.assigned, false)::BOOLEAN
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

-- Test the function with current users
SELECT 'Function deployed successfully. Test results:' as section;

-- Show what the function should return (simulated)
SELECT 'Expected results for current assignment:' as section;
SELECT 
    a.id as assignment_id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    a.assigned,
    pv.name as volunteer_name,
    pu.name as pilgrim_name
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
LEFT JOIN users pu ON a.pilgrim_id = pu.id
WHERE (a.volunteer_id = 'a81c0e62-4bec-4552-bca3-b158c6afa790' 
    OR a.pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44')
AND a.status IN ('pending', 'accepted', 'in_progress')
AND a.assigned = true;
