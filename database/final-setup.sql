-- Final setup script with correct enum values for BandhuConnect+
-- This updates the request_type enum to only include required help categories

-- =============================================
-- CLEAN EXISTING DATA (KEEP ONLY ADMIN)
-- =============================================

-- Disable only user triggers to avoid function dependency errors (not system triggers)
DO $$
DECLARE
    trigger_name TEXT;
BEGIN
    FOR trigger_name IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'assistance_requests'::regclass 
        AND NOT tgisinternal
    LOOP
        EXECUTE 'ALTER TABLE assistance_requests DISABLE TRIGGER ' || trigger_name;
        RAISE NOTICE 'Disabled trigger: %', trigger_name;
    END LOOP;
END $$;

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

-- Update the request_type enum to only include required categories
ALTER TYPE request_type RENAME TO request_type_old;

CREATE TYPE request_type AS ENUM (
    'medical',
    'tech', 
    'crowd_management',
    'sanitation',
    'general',
    'lost_person'
);

-- Update the table to use new enum
ALTER TABLE assistance_requests 
ALTER COLUMN type TYPE request_type USING 
CASE type::text
    WHEN 'medical' THEN 'medical'::request_type
    WHEN 'emergency' THEN 'medical'::request_type
    WHEN 'transportation' THEN 'general'::request_type
    WHEN 'food' THEN 'general'::request_type
    WHEN 'accommodation' THEN 'general'::request_type
    WHEN 'guidance' THEN 'general'::request_type
    ELSE 'general'::request_type
END;

-- Drop old enum
DROP TYPE request_type_old;

-- =============================================
-- CREATE DEMO VOLUNTEERS
-- =============================================

-- Create demo volunteers with proper auth users
DO $$
DECLARE
    user_id UUID;
    volunteer_emails TEXT[] := ARRAY[
        'raj.volunteer@demo.com',
        'priya.volunteer@demo.com', 
        'amit.volunteer@demo.com',
        'sneha.volunteer@demo.com'
    ];
    volunteer_names TEXT[] := ARRAY[
        'Dr. Raj Patel',
        'Priya Sharma',
        'Amit Kumar', 
        'Sneha Joshi'
    ];
    volunteer_phones TEXT[] := ARRAY[
        '+919900000002',
        '+919900000003',
        '+919900000004',
        '+919900000005'
    ];
    volunteer_skills TEXT[][] := ARRAY[
        ARRAY['medical', 'general'],
        ARRAY['tech', 'crowd_management'],
        ARRAY['sanitation', 'general'],
        ARRAY['lost_person', 'general']
    ];
    volunteer_statuses TEXT[] := ARRAY[
        'available',
        'available', 
        'busy',
        'offline'
    ];
    volunteer_active BOOLEAN[] := ARRAY[
        true,
        true,
        true,
        false
    ];
    i INTEGER;
BEGIN
    FOR i IN 1..array_length(volunteer_emails, 1) LOOP
        -- Get existing auth user ID (they already exist from your check)
        SELECT id INTO user_id FROM auth.users WHERE email = volunteer_emails[i];
        
        IF user_id IS NOT NULL THEN
            -- Delete existing profile if it exists with wrong ID
            DELETE FROM profiles WHERE email = volunteer_emails[i] AND id != user_id;
            
            -- Create or update profile with correct auth.users ID
            INSERT INTO profiles (
                id,
                name,
                email,
                phone,
                role,
                volunteer_status,
                is_active,
                skills,
                created_at,
                updated_at
            ) VALUES (
                user_id,  -- Use the actual auth.users ID
                volunteer_names[i],
                volunteer_emails[i],
                volunteer_phones[i],
                'volunteer',
                volunteer_statuses[i]::volunteer_status,
                volunteer_active[i],
                volunteer_skills[i]::text[],
                NOW(),
                NOW()
            ) ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                email = EXCLUDED.email,
                phone = EXCLUDED.phone,
                role = EXCLUDED.role,
                volunteer_status = EXCLUDED.volunteer_status,
                is_active = EXCLUDED.is_active,
                skills = EXCLUDED.skills,
                updated_at = NOW();
                
            RAISE NOTICE 'Created/updated volunteer: % with correct ID: %', volunteer_names[i], user_id;
        ELSE
            RAISE NOTICE 'Auth user not found for email: %', volunteer_emails[i];
        END IF;
    END LOOP;
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
        RAISE NOTICE 'User ramesh.pilgrim@demo.com not found - create in Auth panel first';
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
        RAISE NOTICE 'User sita.pilgrim@demo.com not found - create in Auth panel first';
    END IF;
END $$;

-- =============================================
-- CREATE DEMO REQUESTS
-- =============================================

-- Demo Request 1: Medical
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
            'Elderly person feeling dizzy and needs immediate medical attention.',
            'high',
            'pending',
            ST_SetSRID(ST_MakePoint(72.5720, 23.0280), 4326),
            'Main Temple Complex'
        ) RETURNING id INTO request_id;
        RAISE NOTICE 'Demo medical request created: %', request_id;
    END IF;
END $$;

-- Demo Request 2: Lost Person
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
            'My 6-year-old son is missing. Last seen near the main entrance.',
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
        
        RAISE NOTICE 'Demo lost person request created: % assigned to: %', request_id, assignment_id;
    END IF;
END $$;

-- Re-enable user triggers after setup
DO $$
DECLARE
    trigger_name TEXT;
BEGIN
    FOR trigger_name IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'assistance_requests'::regclass 
        AND NOT tgisinternal
    LOOP
        EXECUTE 'ALTER TABLE assistance_requests ENABLE TRIGGER ' || trigger_name;
        RAISE NOTICE 'Enabled trigger: %', trigger_name;
    END LOOP;
END $$;

-- =============================================
-- VERIFICATION
-- =============================================

-- Show final results
SELECT 
    'Database setup complete!' as message,
    (SELECT COUNT(*) FROM profiles WHERE role = 'volunteer') as volunteers_created,
    (SELECT COUNT(*) FROM profiles WHERE role = 'pilgrim') as pilgrims_created,
    (SELECT COUNT(*) FROM assistance_requests) as requests_created;

-- Show all profiles
SELECT 
    p.name,
    p.email,
    p.role,
    p.volunteer_status as status,
    p.is_active as active,
    COALESCE(array_to_string(p.skills, ', '), 'None') as skills
FROM profiles p
ORDER BY 
    CASE p.role 
        WHEN 'admin' THEN 1 
        WHEN 'volunteer' THEN 2 
        WHEN 'pilgrim' THEN 3 
    END,
    p.name;
