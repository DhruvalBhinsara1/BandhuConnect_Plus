-- Fix Counterpart Data - Handle Both Volunteer and Pilgrim Cases
-- The current function only handles volunteer->pilgrim, need to handle both directions

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
    -- Return assignment data for both volunteer and pilgrim cases
    RETURN QUERY
    SELECT 
        a.id::UUID,
        CASE 
            WHEN a.pilgrim_id IS NOT NULL THEN a.pilgrim_id::UUID
            WHEN a.volunteer_id IS NOT NULL THEN a.volunteer_id::UUID
            ELSE NULL::UUID
        END,
        CASE 
            WHEN a.pilgrim_id IS NOT NULL THEN CAST(COALESCE(pu.name, 'Unknown Pilgrim') AS TEXT)
            WHEN a.volunteer_id IS NOT NULL THEN CAST(COALESCE(pv.name, 'Unknown Volunteer') AS TEXT)
            ELSE CAST('Unknown' AS TEXT)
        END,
        CASE 
            WHEN a.pilgrim_id IS NOT NULL THEN CAST('pilgrim' AS TEXT)
            WHEN a.volunteer_id IS NOT NULL THEN CAST('volunteer' AS TEXT)
            ELSE CAST('unknown' AS TEXT)
        END,
        CAST(true AS BOOLEAN),
        CAST(true AS BOOLEAN)
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

-- Also show the raw assignment data for comparison
SELECT 'Raw assignment data:' as info;
SELECT 
    id,
    volunteer_id,
    pilgrim_id,
    status,
    assigned
FROM assignments 
WHERE status IN ('pending', 'accepted', 'in_progress')
ORDER BY assigned_at DESC
LIMIT 1;
