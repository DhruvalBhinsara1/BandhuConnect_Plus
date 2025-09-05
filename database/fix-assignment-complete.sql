-- Complete Assignment Fix for BandhuConnect+
-- Fixes UUID format errors and populates missing pilgrim_id

-- 1. Check current assignment state
SELECT 'Current assignment state:' as info;
SELECT 
    a.id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    a.assigned,
    a.request_id,
    pv.name as volunteer_name
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
WHERE a.id = '3ebabf0f-a12f-4d18-be5d-f3a2e19a9462'::UUID;

-- 2. Find the correct pilgrim from the linked request
SELECT 'Linked request details:' as info;
SELECT 
    ar.id as request_id,
    ar.user_id as pilgrim_id,
    u.name as pilgrim_name
FROM assistance_requests ar
LEFT JOIN users u ON ar.user_id = u.id
WHERE ar.id = (
    SELECT request_id 
    FROM assignments 
    WHERE id = '3ebabf0f-a12f-4d18-be5d-f3a2e19a9462'::UUID
);

-- 3. Handle duplicate assignments - complete older ones first
UPDATE assignments 
SET 
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
WHERE pilgrim_id = (
    SELECT ar.user_id 
    FROM assistance_requests ar 
    WHERE ar.id = (
        SELECT request_id FROM assignments 
        WHERE id = '3ebabf0f-a12f-4d18-be5d-f3a2e19a9462'::UUID
    )
)
AND status IN ('pending', 'accepted', 'in_progress')
AND id != '3ebabf0f-a12f-4d18-be5d-f3a2e19a9462'::UUID;

-- 4. Now update assignment with correct pilgrim_id from linked request
UPDATE assignments 
SET 
    pilgrim_id = (
        SELECT ar.user_id 
        FROM assistance_requests ar 
        WHERE ar.id = assignments.request_id
    ),
    assigned = true,
    updated_at = NOW()
WHERE id = '3ebabf0f-a12f-4d18-be5d-f3a2e19a9462'::UUID
AND pilgrim_id IS NULL;

-- 5. Verify the fix
SELECT 'Updated assignment state:' as info;
SELECT 
    a.id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    a.assigned,
    pv.name as volunteer_name,
    pu.name as pilgrim_name
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
LEFT JOIN users pu ON a.pilgrim_id = pu.id
WHERE a.id = '3ebabf0f-a12f-4d18-be5d-f3a2e19a9462'::UUID;

-- 5. Create/Update the get_my_assignment function with proper error handling
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
    -- Get current authenticated user
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE NOTICE 'No authenticated user found';
        RETURN;
    END IF;
    
    -- Get user role
    SELECT role INTO user_role
    FROM profiles 
    WHERE id = current_user_id;
    
    IF user_role IS NULL THEN
        RAISE NOTICE 'User role not found for user: %', current_user_id;
        RETURN;
    END IF;
    
    -- Return assignment data based on user role
    IF user_role = 'volunteer' THEN
        RETURN QUERY
        SELECT 
            a.id,
            a.pilgrim_id,
            COALESCE(pu.name, 'Unknown Pilgrim'),
            'pilgrim'::TEXT,
            true,
            COALESCE(a.assigned, true)
        FROM assignments a
        LEFT JOIN users pu ON a.pilgrim_id = pu.id
        WHERE a.volunteer_id = current_user_id
        AND a.status IN ('pending', 'accepted', 'in_progress')
        AND a.pilgrim_id IS NOT NULL
        ORDER BY a.assigned_at DESC
        LIMIT 1;
    ELSE
        -- For pilgrims
        RETURN QUERY
        SELECT 
            a.id,
            a.volunteer_id,
            COALESCE(pv.name, 'Unknown Volunteer'),
            COALESCE(pv.role, 'volunteer')::TEXT,
            true,
            COALESCE(a.assigned, true)
        FROM assignments a
        LEFT JOIN profiles pv ON a.volunteer_id = pv.id
        WHERE a.pilgrim_id = current_user_id
        AND a.status IN ('pending', 'accepted', 'in_progress')
        AND a.volunteer_id IS NOT NULL
        ORDER BY a.assigned_at DESC
        LIMIT 1;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in get_my_assignment: %', SQLERRM;
        RETURN;
END;
$$;

-- 6. Test the function
SELECT 'Testing get_my_assignment function:' as test;
SELECT * FROM get_my_assignment();

-- 7. Check all active assignments to ensure consistency
SELECT 'All active assignments:' as info;
SELECT 
    a.id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    a.assigned,
    pv.name as volunteer_name,
    pu.name as pilgrim_name
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
LEFT JOIN users pu ON a.pilgrim_id = pu.id
WHERE a.status IN ('pending', 'accepted', 'in_progress')
ORDER BY a.created_at DESC;
