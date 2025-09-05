-- Fix Type Casting Error in Function
-- The error is due to VARCHAR vs TEXT type mismatch

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
    -- Return assignment data with proper type casting
    RETURN QUERY
    SELECT 
        a.id,
        CASE 
            WHEN EXISTS(SELECT 1 FROM profiles WHERE id = a.volunteer_id AND role = 'volunteer') 
            THEN a.pilgrim_id 
            ELSE a.volunteer_id 
        END,
        CASE 
            WHEN EXISTS(SELECT 1 FROM profiles WHERE id = a.volunteer_id AND role = 'volunteer') 
            THEN COALESCE(pu.name, 'Unknown')::TEXT
            ELSE COALESCE(pv.name, 'Unknown')::TEXT
        END,
        CASE 
            WHEN EXISTS(SELECT 1 FROM profiles WHERE id = a.volunteer_id AND role = 'volunteer') 
            THEN 'pilgrim'::TEXT
            ELSE 'volunteer'::TEXT
        END,
        true::BOOLEAN,
        true::BOOLEAN
    FROM assignments a
    LEFT JOIN users pu ON a.pilgrim_id = pu.id
    LEFT JOIN profiles pv ON a.volunteer_id = pv.id
    WHERE a.status IN ('pending', 'accepted', 'in_progress')
    ORDER BY a.assigned_at DESC
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION get_my_assignment() TO authenticated;

-- Test the function
SELECT * FROM get_my_assignment();
