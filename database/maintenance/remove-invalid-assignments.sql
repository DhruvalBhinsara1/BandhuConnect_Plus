-- Remove Invalid Assignments First, Then Fix Valid Ones
-- This completely removes problematic records before any updates

-- Step 1: Identify and remove assignments with invalid user references
DELETE FROM assignments 
WHERE id IN (
    SELECT DISTINCT a.id 
    FROM assignments a
    LEFT JOIN assistance_requests ar ON a.request_id = ar.id
    LEFT JOIN profiles p_pilgrim ON a.pilgrim_id = p_pilgrim.id
    LEFT JOIN profiles p_requester ON ar.user_id = p_requester.id
    LEFT JOIN profiles p_volunteer ON a.volunteer_id = p_volunteer.id
    WHERE a.assigned = true 
    AND a.status IN ('pending', 'accepted', 'in_progress')
    AND (
        -- Invalid pilgrim_id
        (a.pilgrim_id IS NOT NULL AND p_pilgrim.id IS NULL) OR
        -- Invalid requester user_id
        (ar.user_id IS NOT NULL AND p_requester.id IS NULL) OR
        -- Invalid volunteer_id
        (a.volunteer_id IS NOT NULL AND p_volunteer.id IS NULL)
    )
);

-- Step 2: Update get_my_assignment function to include pending status
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
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()) THEN
        RETURN;
    END IF;
    
    -- Volunteer: get assigned pilgrim
    IF EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'volunteer') THEN
        RETURN QUERY
        SELECT 
            a.id::UUID,
            ar.user_id::UUID,
            COALESCE(p.name, 'Unknown')::TEXT,
            p.role::TEXT,
            CASE WHEN a.status IN ('pending', 'accepted', 'in_progress') THEN true ELSE false END::BOOLEAN,
            COALESCE(a.assigned, false)::BOOLEAN
        FROM assignments a
        JOIN assistance_requests ar ON a.request_id = ar.id
        JOIN profiles p ON ar.user_id = p.id
        WHERE a.volunteer_id = auth.uid()
        AND a.status IN ('pending', 'accepted', 'in_progress')
        AND a.assigned = true
        ORDER BY a.assigned_at DESC
        LIMIT 1;
        
    -- Pilgrim: get assigned volunteer
    ELSIF EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'pilgrim') THEN
        RETURN QUERY
        SELECT 
            a.id::UUID,
            a.volunteer_id::UUID,
            COALESCE(p.name, 'Unknown')::TEXT,
            p.role::TEXT,
            CASE WHEN a.status IN ('pending', 'accepted', 'in_progress') THEN true ELSE false END::BOOLEAN,
            COALESCE(a.assigned, false)::BOOLEAN
        FROM assignments a
        JOIN assistance_requests ar ON a.request_id = ar.id
        JOIN profiles p ON a.volunteer_id = p.id
        WHERE ar.user_id = auth.uid()
        AND a.status IN ('pending', 'accepted', 'in_progress')
        AND a.assigned = true
        ORDER BY a.assigned_at DESC
        LIMIT 1;
    END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_my_assignment() TO authenticated;

-- Step 3: Update get_counterpart_location function
CREATE OR REPLACE FUNCTION get_counterpart_location()
RETURNS TABLE (
    user_id UUID,
    latitude DECIMAL,
    longitude DECIMAL,
    accuracy DECIMAL,
    speed DECIMAL,
    bearing DECIMAL,
    last_updated TIMESTAMPTZ,
    minutes_ago INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ul.user_id,
        ul.latitude,
        ul.longitude,
        ul.accuracy,
        ul.speed,
        ul.heading as bearing,
        ul.last_updated,
        EXTRACT(EPOCH FROM (NOW() - ul.last_updated))::INTEGER / 60 as minutes_ago
    FROM user_locations ul
    WHERE ul.is_active = true
    AND EXISTS (
        SELECT 1 FROM assignments a 
        JOIN assistance_requests ar ON a.request_id = ar.id 
        WHERE a.status IN ('pending', 'accepted', 'in_progress')
        AND a.assigned = true
        AND (
            (a.volunteer_id = auth.uid() AND ar.user_id = ul.user_id) OR
            (ar.user_id = auth.uid() AND a.volunteer_id = ul.user_id)
        )
    )
    ORDER BY ul.last_updated DESC
    LIMIT 1;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_counterpart_location() TO authenticated;

-- Step 4: Update RLS policy
DROP POLICY IF EXISTS "Users can view relevant locations" ON user_locations;

CREATE POLICY "Users can view relevant locations" ON user_locations FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM assignments a 
        JOIN assistance_requests ar ON a.request_id = ar.id 
        WHERE a.status IN ('pending', 'accepted', 'in_progress')
        AND a.assigned = true
        AND (
            (a.volunteer_id = auth.uid() AND ar.user_id = user_locations.user_id) OR
            (ar.user_id = auth.uid() AND a.volunteer_id = user_locations.user_id)
        )
    )
);

-- Step 5: Now safely fix remaining valid assignments (only those with valid user references)
UPDATE assignments 
SET pilgrim_id = ar.user_id
FROM assistance_requests ar
WHERE assignments.request_id = ar.id
AND assignments.assigned = true 
AND assignments.status IN ('pending', 'accepted', 'in_progress')
AND assignments.pilgrim_id IS NULL
AND ar.user_id IN (SELECT id FROM profiles);

SELECT 'Removed invalid assignments and fixed valid ones' as status;
