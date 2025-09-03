-- Create test assignments to verify bi-directional visibility
-- This script creates sample assignments between volunteers and pilgrims

DO $$
DECLARE
    volunteer_user_id UUID;
    pilgrim_user_id UUID;
    request_id UUID;
    assignment_id UUID;
BEGIN
    -- Find a volunteer user
    SELECT id INTO volunteer_user_id 
    FROM profiles 
    WHERE role = 'volunteer' 
    AND is_active = true 
    LIMIT 1;
    
    -- Find a pilgrim user
    SELECT id INTO pilgrim_user_id 
    FROM profiles 
    WHERE role = 'pilgrim' 
    AND is_active = true 
    LIMIT 1;
    
    -- Only proceed if we have both users
    IF volunteer_user_id IS NOT NULL AND pilgrim_user_id IS NOT NULL THEN
        
        -- Create a test assistance request from the pilgrim
        INSERT INTO assistance_requests (
            user_id,
            type,
            title,
            description,
            priority,
            status,
            location,
            address
        ) VALUES (
            pilgrim_user_id,
            'guidance',
            'Need help finding temple entrance',
            'I am lost and need directions to the main temple entrance',
            'medium',
            'in_progress',
            ST_SetSRID(ST_MakePoint(72.5680, 23.0320), 4326),
            'Near Main Temple Area'
        ) RETURNING id INTO request_id;
        
        -- Create assignment linking volunteer to pilgrim's request
        INSERT INTO assignments (
            request_id,
            volunteer_id,
            status,
            assigned_at,
            accepted_at
        ) VALUES (
            request_id,
            volunteer_user_id,
            'accepted',
            NOW() - INTERVAL '5 minutes',
            NOW() - INTERVAL '2 minutes'
        ) RETURNING id INTO assignment_id;
        
        -- Update both users' locations to be active
        INSERT INTO user_locations (user_id, latitude, longitude, is_active, last_updated)
        VALUES 
            (volunteer_user_id, 23.0325, 72.5685, true, NOW()),
            (pilgrim_user_id, 23.0320, 72.5680, true, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            is_active = true,
            last_updated = NOW();
        
        RAISE NOTICE 'Test assignment created successfully!';
        RAISE NOTICE 'Request ID: %, Assignment ID: %', request_id, assignment_id;
        RAISE NOTICE 'Volunteer: % should see Pilgrim: %', volunteer_user_id, pilgrim_user_id;
        RAISE NOTICE 'Pilgrim: % should see Volunteer: %', pilgrim_user_id, volunteer_user_id;
        
    ELSE
        RAISE NOTICE 'Could not find both volunteer and pilgrim users';
        RAISE NOTICE 'Volunteer found: %, Pilgrim found: %', 
            (volunteer_user_id IS NOT NULL), (pilgrim_user_id IS NOT NULL);
    END IF;
END $$;

-- Verify the assignment was created
SELECT 
    ar.title as request_title,
    p1.name as pilgrim_name,
    p2.name as volunteer_name,
    a.status as assignment_status,
    a.assigned_at,
    a.accepted_at
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
JOIN profiles p1 ON ar.user_id = p1.id
JOIN profiles p2 ON a.volunteer_id = p2.id
WHERE a.status IN ('accepted', 'in_progress')
ORDER BY a.assigned_at DESC
LIMIT 5;
