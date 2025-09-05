-- Deploy All Assignment Fixes
-- This script applies all the necessary fixes to resolve assignment detection issues

-- 1. First, update existing assignments to have assigned=true for active statuses
UPDATE assignments 
SET assigned = true, updated_at = NOW()
WHERE status IN ('pending', 'accepted', 'in_progress')
AND assigned IS NOT TRUE;

-- 2. Drop and recreate the get_my_assignment function with correct logic
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
            true::BOOLEAN  -- Always true for active assignments
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
            true::BOOLEAN  -- Always true for active assignments
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

-- 3. Verify the changes
SELECT 'Verification - Updated Assignments:' as section;
SELECT 
    a.id,
    a.status,
    a.assigned,
    a.volunteer_id,
    a.pilgrim_id,
    pv.name as volunteer_name,
    pu.name as pilgrim_name
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
LEFT JOIN users pu ON a.pilgrim_id = pu.id
WHERE a.status IN ('pending', 'accepted', 'in_progress')
ORDER BY a.assigned_at DESC;

-- 4. Test the function
SELECT 'Testing get_my_assignment function:' as section;
SELECT * FROM get_my_assignment();
