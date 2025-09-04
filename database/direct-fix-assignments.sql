-- Direct Fix: Remove Specific Invalid Assignment and Update Functions
-- This targets the exact problematic record first

-- Step 1: Remove the specific assignment with invalid pilgrim_id
DELETE FROM assignments 
WHERE pilgrim_id = '66666666-6666-6666-6666-666666666666';

-- Step 2: Remove any assignments where pilgrim_id doesn't exist in profiles
DELETE FROM assignments 
WHERE pilgrim_id IS NOT NULL 
AND pilgrim_id NOT IN (SELECT id FROM profiles);

-- Step 3: Remove any assignments where request user_id doesn't exist in profiles
DELETE FROM assignments 
WHERE request_id IN (
    SELECT ar.id FROM assistance_requests ar 
    WHERE ar.user_id NOT IN (SELECT id FROM profiles)
);

-- Step 4: Update get_my_assignment function to include pending status
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

GRANT EXECUTE ON FUNCTION get_my_assignment() TO authenticated;

-- Step 5: Update get_counterpart_location function
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

GRANT EXECUTE ON FUNCTION get_counterpart_location() TO authenticated;

-- Step 6: Update RLS policy
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

SELECT 'Removed invalid assignments and updated functions for pending status' as status;
