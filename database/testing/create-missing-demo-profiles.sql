-- Create missing demo profiles if they don't exist
-- This ensures the volunteer user has a proper profile

-- Insert demo profiles for users that might be missing profiles
INSERT INTO profiles (id, name, email, phone, role, volunteer_status, is_active, created_at, updated_at)
SELECT 
    au.id,
    CASE 
        WHEN au.email = 'raj.volunteer@demo.com' THEN 'Dr. Raj Patel'
        WHEN au.email = 'dhruval.pilgrim@demo.com' THEN 'Dhruval Bhinsara'
        WHEN au.email = 'admin@demo.com' THEN 'Admin User'
        ELSE 'Demo User'
    END,
    au.email,
    CASE 
        WHEN au.email = 'raj.volunteer@demo.com' THEN '+91-9123456789'
        WHEN au.email = 'dhruval.pilgrim@demo.com' THEN '+91-9876543210'
        WHEN au.email = 'admin@demo.com' THEN '+91-9999999999'
        ELSE '+91-0000000000'
    END,
    CASE 
        WHEN au.email = 'raj.volunteer@demo.com' THEN 'volunteer'::user_role
        WHEN au.email = 'dhruval.pilgrim@demo.com' THEN 'pilgrim'::user_role
        WHEN au.email = 'admin@demo.com' THEN 'admin'::user_role
        ELSE 'pilgrim'::user_role
    END,
    CASE 
        WHEN au.email = 'raj.volunteer@demo.com' THEN 'available'::volunteer_status
        ELSE 'offline'::volunteer_status
    END,
    true,
    NOW(),
    NOW()
FROM auth.users au
WHERE au.email IN ('raj.volunteer@demo.com', 'dhruval.pilgrim@demo.com', 'admin@demo.com')
AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = au.id)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    volunteer_status = EXCLUDED.volunteer_status,
    updated_at = NOW();

-- Verify the profiles were created
SELECT 'Demo Profiles Created/Updated' as result, 
       email, name, phone, role, volunteer_status
FROM profiles 
WHERE email IN ('raj.volunteer@demo.com', 'dhruval.pilgrim@demo.com', 'admin@demo.com')
ORDER BY email;
