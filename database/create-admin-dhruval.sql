    -- Create Admin User for Dhruval Bhinsara
    -- Run this in Supabase SQL Editor after creating the auth user

    -- Step 1: First create the auth user in Supabase Dashboard or via SQL
    -- Go to Authentication > Users in Supabase Dashboard and create:
    -- Email: dhruvalbhinsara460@gmail.com
    -- Password: 9913238080@Db

    -- Step 2: Then run this script to create the admin profile
    DO $$
    DECLARE
        admin_user_id UUID;
    BEGIN
        -- Get the admin user ID from auth.users
        SELECT id INTO admin_user_id 
        FROM auth.users 
        WHERE email = 'dhruvalbhinsara460@gmail.com';
        
        -- Only proceed if admin user exists
        IF admin_user_id IS NOT NULL THEN
            -- Insert admin profile
            INSERT INTO profiles (id, name, email, phone, role, location) 
            VALUES (
                admin_user_id, 
                'Dhruval Bhinsara', 
                'dhruvalbhinsara460@gmail.com', 
                '9510517172', 
                'admin', 
                ST_SetSRID(ST_MakePoint(72.5714, 23.0225), 4326)
            ) ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                phone = EXCLUDED.phone,
                role = EXCLUDED.role,
                updated_at = NOW();
            
            RAISE NOTICE 'Admin profile created/updated successfully for Dhruval Bhinsara with ID: %', admin_user_id;
            
            -- Create initial notification for admin
            INSERT INTO notifications (user_id, title, body, type) 
            VALUES (
                admin_user_id,
                'Welcome to BandhuConnect+',
                'Your admin account has been set up successfully. You can now manage volunteers and requests.',
                'system'
            );
            
        ELSE
            RAISE NOTICE 'User with email dhruvalbhinsara460@gmail.com not found. Please create the auth user first in Supabase Dashboard.';
            RAISE NOTICE 'Go to Authentication > Users and add:';
            RAISE NOTICE 'Email: dhruvalbhinsara460@gmail.com';
            RAISE NOTICE 'Password: 9913238080@Db';
        END IF;
    END $$;

    -- Create some initial chat channels
    INSERT INTO chat_channels (name, type, created_by) 
    SELECT 'General Help', 'general', id FROM auth.users WHERE email = 'dhruvalbhinsara460@gmail.com'
    ON CONFLICT DO NOTHING;

    INSERT INTO chat_channels (name, type, created_by) 
    SELECT 'Emergency Support', 'emergency', id FROM auth.users WHERE email = 'dhruvalbhinsara460@gmail.com'
    ON CONFLICT DO NOTHING;

    -- Verify the setup
    SELECT 
        p.name,
        p.email,
        p.phone,
        p.role,
        p.created_at,
        'Profile created successfully' as status
    FROM profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE u.email = 'dhruvalbhinsara460@gmail.com';
