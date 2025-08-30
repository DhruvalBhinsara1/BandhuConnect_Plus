-- Simple setup script that works with existing schema
-- First, let's check what columns actually exist and create data accordingly

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
-- CREATE DEMO VOLUNTEERS (NO ENUM CHANGES)
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
        RAISE NOTICE 'User raj.volunteer@demo.com not found in auth.users - please create in Auth panel first';
    END IF;
END $$;

-- Volunteer 2: Tech Specialist  
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
            ARRAY['general'], 
            'available', 
            ST_SetSRID(ST_MakePoint(72.5750, 23.0250), 4326), 
            4.9, 
            40,
            true
        );
        RAISE NOTICE 'Volunteer Priya created';
    ELSE
        RAISE NOTICE 'User priya.volunteer@demo.com not found in auth.users - please create in Auth panel first';
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
        RAISE NOTICE 'User amit.volunteer@demo.com not found in auth.users - please create in Auth panel first';
    END IF;
END $$;

-- Volunteer 4: General Helper (Inactive)
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
            ARRAY['general'], 
            'offline', 
            ST_SetSRID(ST_MakePoint(72.5900, 23.0200), 4326), 
            4.7, 
            32,
            false
        );
        RAISE NOTICE 'Volunteer Sneha created';
    ELSE
        RAISE NOTICE 'User sneha.volunteer@demo.com not found in auth.users - please create in Auth panel first';
    END IF;
END $$;

-- =============================================
-- CREATE DEMO PILGRIMS
-- =============================================

-- Pilgrim 1
DO $$
DECLARE
    user_id UUID;
BEGIN
    SELECT id INTO user_id FROM auth.users WHERE email = 'ramesh.pilgrim@demo.com';
    IF user_id IS NOT NULL THEN
        INSERT INTO profiles (id, name, email, phone, role, location) 
        VALUES (
            user_id, 
            'Ramesh Gupta', 
            'ramesh.pilgrim@demo.com', 
            '+919900000006', 
            'pilgrim', 
            ST_SetSRID(ST_MakePoint(72.5720, 23.0280), 4326)
        );
        RAISE NOTICE 'Pilgrim Ramesh created';
    ELSE
        RAISE NOTICE 'User ramesh.pilgrim@demo.com not found in auth.users - please create in Auth panel first';
    END IF;
END $$;

-- Pilgrim 2
DO $$
DECLARE
    user_id UUID;
BEGIN
    SELECT id INTO user_id FROM auth.users WHERE email = 'sita.pilgrim@demo.com';
    IF user_id IS NOT NULL THEN
        INSERT INTO profiles (id, name, email, phone, role, location) 
        VALUES (
            user_id, 
            'Sita Devi', 
            'sita.pilgrim@demo.com', 
            '+919900000007', 
            'pilgrim', 
            ST_SetSRID(ST_MakePoint(72.5680, 23.0320), 4326)
        );
        RAISE NOTICE 'Pilgrim Sita created';
    ELSE
        RAISE NOTICE 'User sita.pilgrim@demo.com not found in auth.users - please create in Auth panel first';
    END IF;
END $$;

-- =============================================
-- CREATE DEMO REQUESTS (USING EXISTING ENUM VALUES)
-- =============================================

-- Demo Request 1: Use 'medical' if it exists in enum
DO $$
DECLARE
    pilgrim_id UUID;
    request_id UUID;
BEGIN
    SELECT id INTO pilgrim_id FROM auth.users WHERE email = 'ramesh.pilgrim@demo.com';
    IF pilgrim_id IS NOT NULL THEN
        -- Insert request using existing enum values
        INSERT INTO assistance_requests (user_id, type, title, description, priority, status, location, address)
        VALUES (
            pilgrim_id,
            'medical',
            'Need medical assistance',
            'Elderly person feeling dizzy and needs immediate medical attention.',
            'high',
            'pending',
            ST_SetSRID(ST_MakePoint(72.5720, 23.0280), 4326),
            'Main Temple Complex'
        ) RETURNING id INTO request_id;
        RAISE NOTICE 'Demo medical request created: %', request_id;
    END IF;
END $$;

-- =============================================
-- VERIFICATION
-- =============================================

-- Show what we created
SELECT 
    'PROFILES' as table_name,
    COUNT(*) as count,
    STRING_AGG(DISTINCT role::text, ', ') as roles
FROM profiles
UNION ALL
SELECT 
    'REQUESTS' as table_name,
    COUNT(*) as count,
    STRING_AGG(DISTINCT type::text, ', ') as types
FROM assistance_requests;

-- Show all profiles
SELECT 
    p.name,
    p.email,
    p.role,
    COALESCE(p.volunteer_status, 'N/A') as status,
    COALESCE(p.is_active::text, 'N/A') as active
FROM profiles p
ORDER BY 
    CASE p.role 
        WHEN 'admin' THEN 1 
        WHEN 'volunteer' THEN 2 
        WHEN 'pilgrim' THEN 3 
    END,
    p.name;
