-- Simplified Demo Users for BandhuConnect+ Testing
-- This version doesn't use custom functions and can be run after schema.sql only

-- =============================================
-- DEMO USER CREDENTIALS
-- =============================================
-- Create these users in Supabase Authentication > Users:

-- ADMIN:
-- Email: admin@demo.com, Password: demo123

-- VOLUNTEERS:
-- Email: raj.volunteer@demo.com, Password: demo123
-- Email: priya.volunteer@demo.com, Password: demo123
-- Email: amit.volunteer@demo.com, Password: demo123
-- Email: sneha.volunteer@demo.com, Password: demo123

-- PILGRIMS:
-- Email: ramesh.pilgrim@demo.com, Password: demo123
-- Email: sita.pilgrim@demo.com, Password: demo123
-- Email: mohan.pilgrim@demo.com, Password: demo123

-- =============================================
-- CREATE DEMO PROFILES
-- =============================================

-- Admin User
DO $$
DECLARE
    user_id UUID;
BEGIN
    SELECT id INTO user_id FROM auth.users WHERE email = 'admin@demo.com';
    IF user_id IS NOT NULL THEN
        INSERT INTO profiles (id, name, email, phone, role, location) 
        VALUES (
            user_id, 
            'Demo Admin', 
            'admin@demo.com', 
            '+919900000001', 
            'admin', 
            ST_SetSRID(ST_MakePoint(72.5714, 23.0225), 4326)
        ) ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            phone = EXCLUDED.phone,
            role = EXCLUDED.role;
        RAISE NOTICE 'Demo Admin created';
    END IF;
END $$;

-- Volunteer 1: Transportation Specialist
DO $$
DECLARE
    user_id UUID;
BEGIN
    SELECT id INTO user_id FROM auth.users WHERE email = 'raj.volunteer@demo.com';
    IF user_id IS NOT NULL THEN
        INSERT INTO profiles (id, name, email, phone, role, skills, volunteer_status, location, rating, total_ratings, is_active) 
        VALUES (
            user_id, 
            'Dr. Raj Patel', 
            'raj.volunteer@demo.com', 
            '+919900000002', 
            'volunteer', 
            ARRAY['medical', 'general'], 
            'available', 
            ST_SetSRID(ST_MakePoint(72.5800, 23.0300), 4326), 
            4.8, 
            25,
            true
        ) ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            skills = EXCLUDED.skills,
            volunteer_status = EXCLUDED.volunteer_status,
            is_active = EXCLUDED.is_active;
        RAISE NOTICE 'Volunteer Raj created';
    END IF;
END $$;

-- Volunteer 2: Medical Helper
DO $$
DECLARE
    user_id UUID;
BEGIN
    SELECT id INTO user_id FROM auth.users WHERE email = 'priya.volunteer@demo.com';
    IF user_id IS NOT NULL THEN
        INSERT INTO profiles (id, name, email, phone, role, skills, volunteer_status, location, rating, total_ratings, is_active) 
        VALUES (
            user_id, 
            'Priya Sharma', 
            'priya.volunteer@demo.com', 
            '+919900000003', 
            'volunteer', 
            ARRAY['guidance', 'crowd_management'], 
            'available', 
            ST_SetSRID(ST_MakePoint(72.5750, 23.0250), 4326), 
            4.9, 
            40,
            true
        ) ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            skills = EXCLUDED.skills,
            volunteer_status = EXCLUDED.volunteer_status,
            is_active = EXCLUDED.is_active;
        RAISE NOTICE 'Volunteer Priya created';
    END IF;
END $$;

-- Volunteer 3: Accommodation Helper (Currently Busy)
DO $$
DECLARE
    user_id UUID;
BEGIN
    SELECT id INTO user_id FROM auth.users WHERE email = 'amit.volunteer@demo.com';
    IF user_id IS NOT NULL THEN
        INSERT INTO profiles (id, name, email, phone, role, skills, volunteer_status, location, rating, total_ratings, is_active) 
        VALUES (
            user_id, 
            'Amit Kumar', 
            'amit.volunteer@demo.com', 
            '+919900000004', 
            'volunteer', 
            ARRAY['sanitation', 'general'], 
            'busy', 
            ST_SetSRID(ST_MakePoint(72.5650, 23.0350), 4326), 
            4.3, 
            18,
            true
        ) ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            skills = EXCLUDED.skills,
            volunteer_status = EXCLUDED.volunteer_status,
            is_active = EXCLUDED.is_active;
        RAISE NOTICE 'Volunteer Amit created';
    END IF;
END $$;

-- Volunteer 4: Guide (Currently Offline)
DO $$
DECLARE
    user_id UUID;
BEGIN
    SELECT id INTO user_id FROM auth.users WHERE email = 'sneha.volunteer@demo.com';
    IF user_id IS NOT NULL THEN
        INSERT INTO profiles (id, name, email, phone, role, skills, volunteer_status, location, rating, total_ratings, is_active) 
        VALUES (
            user_id, 
            'Sneha Joshi', 
            'sneha.volunteer@demo.com', 
            '+919900000005', 
            'volunteer', 
            ARRAY['lost_person', 'general'], 
            'offline', 
            ST_SetSRID(ST_MakePoint(72.5900, 23.0200), 4326), 
            4.7, 
            32,
            false
        ) ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            skills = EXCLUDED.skills,
            volunteer_status = EXCLUDED.volunteer_status,
            is_active = EXCLUDED.is_active;
        RAISE NOTICE 'Volunteer Sneha created';
    END IF;
END $$;

-- Pilgrim 1: Elderly Person
DO $$
DECLARE
    user_id UUID;
BEGIN
    SELECT id INTO user_id FROM auth.users WHERE email = 'ramesh.pilgrim@demo.com';
    IF user_id IS NOT NULL THEN
        INSERT INTO profiles (id, name, email, phone, role, location) 
        VALUES (
            user_id, 
            'Ramesh Gupta (Age 65)', 
            'ramesh.pilgrim@demo.com', 
            '+919900000006', 
            'pilgrim', 
            ST_SetSRID(ST_MakePoint(72.5720, 23.0280), 4326)
        ) ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name;
        RAISE NOTICE 'Pilgrim Ramesh created';
    END IF;
END $$;

-- Pilgrim 2: Family with Children
DO $$
DECLARE
    user_id UUID;
BEGIN
    SELECT id INTO user_id FROM auth.users WHERE email = 'sita.pilgrim@demo.com';
    IF user_id IS NOT NULL THEN
        INSERT INTO profiles (id, name, email, phone, role, location) 
        VALUES (
            user_id, 
            'Sita Devi (Family of 4)', 
            'sita.pilgrim@demo.com', 
            '+919900000007', 
            'pilgrim', 
            ST_SetSRID(ST_MakePoint(72.5680, 23.0320), 4326)
        ) ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name;
        RAISE NOTICE 'Pilgrim Sita created';
    END IF;
END $$;

-- Pilgrim 3: First-time Visitor
DO $$
DECLARE
    user_id UUID;
BEGIN
    SELECT id INTO user_id FROM auth.users WHERE email = 'mohan.pilgrim@demo.com';
    IF user_id IS NOT NULL THEN
        INSERT INTO profiles (id, name, email, phone, role, location) 
        VALUES (
            user_id, 
            'Mohan Lal (First Visit)', 
            'mohan.pilgrim@demo.com', 
            '+919900000008', 
            'pilgrim', 
            ST_SetSRID(ST_MakePoint(72.5820, 23.0180), 4326)
        ) ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name;
        RAISE NOTICE 'Pilgrim Mohan created';
    END IF;
END $$;

-- =============================================
-- CREATE DEMO REQUESTS (WITHOUT AUTO-TRIGGERS)
-- =============================================

-- Temporarily disable triggers to avoid function dependency (skip if trigger doesn't exist)
-- ALTER TABLE assistance_requests DISABLE TRIGGER notify_volunteers_on_new_request;

-- Demo Request 1: Transportation (Pending)
DO $$
DECLARE
    pilgrim_id UUID;
    request_id UUID;
BEGIN
    SELECT id INTO pilgrim_id FROM auth.users WHERE email = 'ramesh.pilgrim@demo.com';
    IF pilgrim_id IS NOT NULL THEN
        INSERT INTO assistance_requests (user_id, type, title, description, priority, status, location, address)
        VALUES (
            pilgrim_id,
            'medical',
            'Need medical assistance',
            'Elderly person feeling dizzy and needs immediate medical attention. Has diabetes.',
            'high',
            'pending',
            ST_SetSRID(ST_MakePoint(72.5720, 23.0280), 4326),
            'Main Temple Complex, Rest Area'
        ) RETURNING id INTO request_id;
        RAISE NOTICE 'Demo transportation request created: %', request_id;
    END IF;
END $$;

-- Demo Request 2: Medical (Assigned)
DO $$
DECLARE
    pilgrim_id UUID;
    volunteer_id UUID;
    request_id UUID;
    assignment_id UUID;
BEGIN
    SELECT id INTO pilgrim_id FROM auth.users WHERE email = 'sita.pilgrim@demo.com';
    SELECT id INTO volunteer_id FROM auth.users WHERE email = 'priya.volunteer@demo.com';
    
    IF pilgrim_id IS NOT NULL AND volunteer_id IS NOT NULL THEN
        INSERT INTO assistance_requests (user_id, type, title, description, priority, status, location, address)
        VALUES (
            pilgrim_id,
            'lost_person',
            'Lost child - urgent help needed',
            'My 6-year-old son is missing. Last seen near the main entrance wearing blue shirt and khaki shorts.',
            'high',
            'assigned',
            ST_SetSRID(ST_MakePoint(72.5680, 23.0320), 4326),
            'Main Temple Entrance Gate'
        ) RETURNING id INTO request_id;
        
        INSERT INTO assignments (request_id, volunteer_id, status, assigned_at, accepted_at)
        VALUES (
            request_id,
            volunteer_id,
            'accepted',
            NOW() - INTERVAL '15 minutes',
            NOW() - INTERVAL '10 minutes'
        ) RETURNING id INTO assignment_id;
        
        RAISE NOTICE 'Demo medical request and assignment created: % -> %', request_id, assignment_id;
    END IF;
END $$;

-- Re-enable triggers (skip if trigger doesn't exist)
-- ALTER TABLE assistance_requests ENABLE TRIGGER notify_volunteers_on_new_request;

-- =============================================
-- CREATE DEMO CHAT CHANNELS AND MESSAGES
-- =============================================

-- Create general chat channel
DO $$
DECLARE
    admin_id UUID;
    channel_id UUID;
BEGIN
    SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@demo.com';
    IF admin_id IS NOT NULL THEN
        INSERT INTO chat_channels (name, type, created_by)
        VALUES ('Demo General Help', 'general', admin_id)
        RETURNING id INTO channel_id;
        
        -- Add some demo messages
        INSERT INTO chat_messages (channel_id, sender_id, content, message_type) VALUES
        (channel_id, admin_id, 'Welcome to BandhuConnect+ demo! This is the general help channel.', 'text');
        
        RAISE NOTICE 'Demo chat channel created: %', channel_id;
    END IF;
END $$;

-- =============================================
-- CREATE DEMO NOTIFICATIONS
-- =============================================

-- Notifications for volunteers
DO $$
DECLARE
    raj_id UUID;
    priya_id UUID;
BEGIN
    SELECT id INTO raj_id FROM auth.users WHERE email = 'raj.volunteer@demo.com';
    SELECT id INTO priya_id FROM auth.users WHERE email = 'priya.volunteer@demo.com';
    
    IF raj_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, body, type, data) VALUES
        (raj_id, 'New Transportation Request', 'A new transportation request is available near your location', 'new_request', '{"priority": "medium"}'),
        (raj_id, 'Welcome Volunteer!', 'Thank you for joining BandhuConnect+ as a volunteer. You can now help pilgrims in need.', 'welcome', '{}');
    END IF;
    
    IF priya_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, body, type, data) VALUES
        (priya_id, 'Request Assigned', 'You have been assigned to help with a medical request', 'request_assigned', '{"priority": "high"}');
    END IF;
END $$;

-- =============================================
-- VERIFICATION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE 'Demo users setup complete!';
    RAISE NOTICE 'All demo users have password: demo123';
    RAISE NOTICE 'Login credentials are in the comments at the top of this file.';
END $$;

-- Verification query to see all demo users
SELECT 
    p.name,
    p.email,
    p.role,
    p.volunteer_status,
    p.skills,
    p.rating,
    CASE 
        WHEN p.role = 'volunteer' THEN 
            CASE p.volunteer_status
                WHEN 'available' THEN '🟢 Available'
                WHEN 'busy' THEN '🟡 Busy'
                WHEN 'offline' THEN '🔴 Offline'
            END
        ELSE '👤 ' || UPPER(p.role::text)
    END as status_display
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email LIKE '%@demo.com'
ORDER BY 
    CASE p.role 
        WHEN 'admin' THEN 1 
        WHEN 'volunteer' THEN 2 
        WHEN 'pilgrim' THEN 3 
    END,
    p.name;
