-- Simple Working Function - Fixed Type Issues
-- Simplified approach to avoid complex type casting

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
    -- Simple return of the active assignment data
    RETURN QUERY
    SELECT 
        a.id::UUID,
        a.pilgrim_id::UUID,
        CAST(COALESCE(pu.name, 'Unknown') AS TEXT),
        CAST('pilgrim' AS TEXT),
        CAST(true AS BOOLEAN),
        CAST(true AS BOOLEAN)
    FROM assignments a
    LEFT JOIN users pu ON a.pilgrim_id = pu.id
    WHERE a.status IN ('pending', 'accepted', 'in_progress')
    ORDER BY a.assigned_at DESC
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION get_my_assignment() TO authenticated;

-- Test the function
SELECT * FROM get_my_assignment();
