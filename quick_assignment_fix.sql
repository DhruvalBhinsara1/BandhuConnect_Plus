-- Quick Assignment Fix for Demo Video
-- Run this in Supabase SQL Editor to create a working assignment

-- Step 1: Get existing users
DO $$
DECLARE
    pilgrim_user_id UUID;
    volunteer_user_id UUID;
    request_id UUID;
    assignment_id UUID;
BEGIN
    -- Get a pilgrim user
    SELECT id INTO pilgrim_user_id 
    FROM profiles 
    WHERE role = 'pilgrim' 
    LIMIT 1;
    
    -- Get a volunteer user  
    SELECT id INTO volunteer_user_id
    FROM profiles 
    WHERE role = 'volunteer'
    LIMIT 1;
    
    -- If no users exist, create them
    IF pilgrim_user_id IS NULL THEN
        INSERT INTO profiles (id, name, role, phone, email)
        VALUES (gen_random_uuid(), 'Demo Pilgrim', 'pilgrim', '+91-9876543210', 'pilgrim@demo.com')
        RETURNING id INTO pilgrim_user_id;
    END IF;
    
    IF volunteer_user_id IS NULL THEN
        INSERT INTO profiles (id, name, role, phone, email, volunteer_status)
        VALUES (gen_random_uuid(), 'Demo Volunteer', 'volunteer', '+91-9876543211', 'volunteer@demo.com', 'available')
        RETURNING id INTO volunteer_user_id;
    END IF;
    
    -- Create a test assistance request
    INSERT INTO assistance_requests (
        user_id,
        type,
        title,
        description,
        priority,
        location,
        address,
        status,
        created_at
    ) VALUES (
        pilgrim_user_id,
        'medical'::request_type,
        'Demo Emergency Request',
        'Test request for demo video - medical assistance needed',
        'high'::priority_level,
        ST_MakePoint(77.2090, 28.6139),
        'Red Fort, Delhi',
        'pending'::request_status,
        NOW()
    ) RETURNING id INTO request_id;
    
    -- Create assignment linking pilgrim and volunteer
    INSERT INTO assignments (
        request_id,
        volunteer_id,
        pilgrim_id,
        status,
        assigned_at,
        is_active
    ) VALUES (
        request_id,
        volunteer_user_id,
        pilgrim_user_id,
        'pending'::assignment_status,
        NOW(),
        true
    ) RETURNING id INTO assignment_id;
    
    -- Update request status to assigned
    UPDATE assistance_requests 
    SET status = 'assigned'::request_status
    WHERE id = request_id;
    
    -- Update volunteer status to busy
    UPDATE profiles 
    SET volunteer_status = 'busy'
    WHERE id = volunteer_user_id;
    
    -- Output results
    RAISE NOTICE 'SUCCESS: Created assignment % for pilgrim % and volunteer %', assignment_id, pilgrim_user_id, volunteer_user_id;
    RAISE NOTICE 'Request ID: %', request_id;
    RAISE NOTICE 'Pilgrim can now see active assignment in app!';
    
END $$;

-- Verify the assignment was created
SELECT 
    a.id as assignment_id,
    a.status,
    a.assigned_at,
    p1.name as pilgrim_name,
    p1.id as pilgrim_id,
    p2.name as volunteer_name,
    p2.id as volunteer_id,
    r.title as request_title,
    r.status as request_status
FROM assignments a
JOIN profiles p1 ON a.pilgrim_id = p1.id
JOIN profiles p2 ON a.volunteer_id = p2.id  
JOIN assistance_requests r ON a.request_id = r.id
WHERE a.is_active = true
ORDER BY a.assigned_at DESC
LIMIT 1;
