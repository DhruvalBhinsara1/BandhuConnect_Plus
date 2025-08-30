-- Minimal Seed Data for BandhuConnect+
-- This version doesn't use hardcoded UUIDs and can be run after creating real auth users

-- First, create your admin user in Supabase Auth dashboard:
-- Email: admin@bandhuconnect.com
-- Password: admin123

-- Then run this query to get the user ID and insert the profile:
-- Replace 'admin@bandhuconnect.com' with your actual admin email

DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the admin user ID from auth.users
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@bandhuconnect.com';
    
    -- Only proceed if admin user exists
    IF admin_user_id IS NOT NULL THEN
        -- Insert admin profile
        INSERT INTO profiles (id, name, email, phone, role, location) 
        VALUES (
            admin_user_id, 
            'Admin User', 
            'admin@bandhuconnect.com', 
            '+919913238080', 
            'admin', 
            ST_SetSRID(ST_MakePoint(72.5714, 23.0225), 4326)
        ) ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Admin profile created successfully with ID: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Admin user not found. Please create user in Supabase Auth first.';
    END IF;
END $$;

-- To add more users, create them in Supabase Auth first, then run similar blocks:

-- Example for adding a volunteer (after creating the auth user):
/*
DO $$
DECLARE
    volunteer_user_id UUID;
BEGIN
    SELECT id INTO volunteer_user_id 
    FROM auth.users 
    WHERE email = 'volunteer@example.com';
    
    IF volunteer_user_id IS NOT NULL THEN
        INSERT INTO profiles (id, name, email, phone, role, skills, volunteer_status, location, rating, total_ratings) 
        VALUES (
            volunteer_user_id, 
            'Test Volunteer', 
            'volunteer@example.com', 
            '+919876543210', 
            'volunteer', 
            ARRAY['transportation', 'guidance'], 
            'available', 
            ST_SetSRID(ST_MakePoint(72.5800, 23.0300), 4326), 
            4.5, 
            10
        ) ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Volunteer profile created successfully';
    END IF;
END $$;
*/

-- Create some general chat channels that don't depend on specific users
INSERT INTO chat_channels (name, type, created_by) VALUES
('General Help', 'general', NULL),
('Emergency Support', 'emergency', NULL)
ON CONFLICT DO NOTHING;
