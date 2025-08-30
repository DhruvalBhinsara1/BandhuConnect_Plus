-- Clean database and setup new help categories
-- This script will clean all data except admin and update enums

-- =============================================
-- CLEAN EXISTING DATA (KEEP ONLY ADMIN)
-- =============================================

-- Delete all assignments
DELETE FROM assignments;

-- Delete all assistance requests
DELETE FROM assistance_requests;

-- Delete all chat messages
DELETE FROM chat_messages;

-- Delete all chat channels
DELETE FROM chat_channels;

-- Delete all notifications
DELETE FROM notifications;

-- Delete all profiles except admin
DELETE FROM profiles WHERE role != 'admin';

-- =============================================
-- UPDATE REQUEST TYPE ENUM
-- =============================================

-- Drop and recreate the request_type enum with new values
DROP TYPE IF EXISTS request_type CASCADE;
CREATE TYPE request_type AS ENUM (
    'medical',
    'tech', 
    'crowd_management',
    'sanitation',
    'general',
    'lost_person'
);

-- Update the assistance_requests table column with new enum
-- First check what the actual column name is, it might be 'request_type' instead of 'type'
DO $$
BEGIN
    -- Try to alter the column, handling different possible column names
    BEGIN
        ALTER TABLE assistance_requests ALTER COLUMN type TYPE request_type USING type::text::request_type;
        RAISE NOTICE 'Updated column "type" successfully';
    EXCEPTION
        WHEN undefined_column THEN
            BEGIN
                ALTER TABLE assistance_requests ALTER COLUMN request_type TYPE request_type USING request_type::text::request_type;
                RAISE NOTICE 'Updated column "request_type" successfully';
            EXCEPTION
                WHEN undefined_column THEN
                    RAISE NOTICE 'Neither "type" nor "request_type" column found. Please check your table schema.';
            END;
    END;
END $$;

-- =============================================
-- CREATE DEMO USERS (AUTHENTICATION REQUIRED FIRST)
-- =============================================
-- You must create these users in Supabase Authentication > Users first:

-- VOLUNTEERS:
-- Email: raj.volunteer@demo.com, Password: demo123
-- Email: priya.volunteer@demo.com, Password: demo123
-- Email: amit.volunteer@demo.com, Password: demo123
-- Email: sneha.volunteer@demo.com, Password: demo123

-- PILGRIMS:
-- Email: ramesh.pilgrim@demo.com, Password: demo123
-- Email: sita.pilgrim@demo.com, Password: demo123

-- =============================================
-- CREATE DEMO VOLUNTEERS
-- =============================================

-- Volunteer 1: Medical Specialist
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
        );
        RAISE NOTICE 'Volunteer Raj created';
    ELSE
        RAISE NOTICE 'User raj.volunteer@demo.com not found in auth.users';
    END IF;
END $$;

-- Volunteer 2: Tech & Crowd Management
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
            ARRAY['tech', 'crowd_management'], 
            'available', 
            ST_SetSRID(ST_MakePoint(72.5750, 23.0250), 4326), 
            4.9, 
            40,
            true
        );
        RAISE NOTICE 'Volunteer Priya created';
    ELSE
        RAISE NOTICE 'User priya.volunteer@demo.com not found in auth.users';
    END IF;
END $$;

-- Volunteer 3: Sanitation Specialist
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
        );
        RAISE NOTICE 'Volunteer Amit created';
    ELSE
        RAISE NOTICE 'User amit.volunteer@demo.com not found in auth.users';
    END IF;
END $$;

-- Volunteer 4: Lost Person Specialist (Inactive)
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
        );
        RAISE NOTICE 'Volunteer Sneha created';
    ELSE
        RAISE NOTICE 'User sneha.volunteer@demo.com not found in auth.users';
    END IF;
END $$;

-- =============================================
-- CREATE DEMO PILGRIMS
-- =============================================

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
        );
        RAISE NOTICE 'Pilgrim Ramesh created';
    ELSE
        RAISE NOTICE 'User ramesh.pilgrim@demo.com not found in auth.users';
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
        );
        RAISE NOTICE 'Pilgrim Sita created';
    ELSE
        RAISE NOTICE 'User sita.pilgrim@demo.com not found in auth.users';
    END IF;
END $$;

-- =============================================
-- CREATE DEMO REQUESTS
-- =============================================

-- Demo Request 1: Medical (Pending)
DO $$
DECLARE
    pilgrim_id UUID;
    request_id UUID;
BEGIN
    SELECT id INTO pilgrim_id FROM auth.users WHERE email = 'ramesh.pilgrim@demo.com';
    IF pilgrim_id IS NOT NULL THEN
        INSERT INTO assistance_requests (user_id, request_type, title, description, priority, status, location, address)
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
        RAISE NOTICE 'Demo medical request created: %', request_id;
    END IF;
END $$;

-- Demo Request 2: Lost Person (Assigned)
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
        INSERT INTO assistance_requests (user_id, request_type, title, description, priority, status, location, address)
        VALUES (
            pilgrim_id,
            'lost_person',
            'Lost child - urgent help needed',
            'My 6-year-old son is missing. Last seen near the main entrance wearing blue shirt and khaki shorts.',
            'emergency',
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
        
        RAISE NOTICE 'Demo lost person request and assignment created: % -> %', request_id, assignment_id;
    END IF;
END $$;

-- =============================================
-- VERIFICATION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE 'Database cleaned and demo data created!';
    RAISE NOTICE 'Make sure you created the auth users first in Supabase Auth panel';
END $$;

-- Show all profiles
SELECT 
    p.name,
    p.email,
    p.role,
    p.volunteer_status,
    p.skills,
    p.is_active,
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
ORDER BY 
    CASE p.role 
        WHEN 'admin' THEN 1 
        WHEN 'volunteer' THEN 2 
        WHEN 'pilgrim' THEN 3 
    END,
    p.name;
