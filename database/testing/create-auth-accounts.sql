-- Create Demo Authentication Accounts
-- Note: This creates the profiles, but you still need to create auth.users manually in Supabase Dashboard

-- First, let's see what auth users exist
SELECT 
    au.id,
    au.email,
    au.email_confirmed_at,
    p.name,
    p.role
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at DESC;

-- Create profiles for demo accounts (assuming auth users will be created manually)
-- These will be linked when you create the auth users with matching emails

-- Volunteer profiles
INSERT INTO profiles (id, name, email, phone, role, skills, volunteer_status, is_active) VALUES
-- Use placeholder UUIDs - these will be updated when real auth users are created
('11111111-1111-1111-1111-111111111111', 'Dr. Rajesh Patel', 'dr.rajesh.medical@demo.com', '+91-9123456701', 'volunteer', ARRAY['medical', 'first_aid', 'emergency'], 'available', true),
('22222222-2222-2222-2222-222222222222', 'Priya Sharma', 'priya.guide@demo.com', '+91-9123456702', 'volunteer', ARRAY['guidance', 'translation', 'crowd_management'], 'available', true),
('33333333-3333-3333-3333-333333333333', 'Amit Kumar', 'amit.security@demo.com', '+91-9123456703', 'volunteer', ARRAY['security', 'crowd_management', 'emergency'], 'available', true),
('44444444-4444-4444-4444-444444444444', 'Sneha Joshi', 'sneha.translator@demo.com', '+91-9123456704', 'volunteer', ARRAY['translation', 'guidance', 'general'], 'available', true),
('55555555-5555-5555-5555-555555555555', 'Ravi Mehta', 'ravi.maintenance@demo.com', '+91-9123456705', 'volunteer', ARRAY['sanitation', 'maintenance', 'general'], 'available', true)

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    skills = EXCLUDED.skills,
    volunteer_status = EXCLUDED.volunteer_status,
    is_active = EXCLUDED.is_active;

-- Pilgrim profiles
INSERT INTO profiles (id, name, email, phone, role, is_active) VALUES
('66666666-6666-6666-6666-666666666666', 'Ramesh Gupta', 'ramesh.elderly@demo.com', '+91-9123456706', 'pilgrim', true),
('77777777-7777-7777-7777-777777777777', 'Sunita Devi', 'sunita.family@demo.com', '+91-9123456707', 'pilgrim', true),
('88888888-8888-8888-8888-888888888888', 'Arjun Singh', 'arjun.student@demo.com', '+91-9123456708', 'pilgrim', true),
('99999999-9999-9999-9999-999999999999', 'Kavita Sharma', 'kavita.disabled@demo.com', '+91-9123456709', 'pilgrim', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Mohan Lal', 'mohan.lost@demo.com', '+91-9123456710', 'pilgrim', true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Geeta Patel', 'geeta.foreign@demo.com', '+91-9123456711', 'pilgrim', true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Vijay Kumar', 'vijay.emergency@demo.com', '+91-9123456712', 'pilgrim', true),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Lakshmi Nair', 'lakshmi.group@demo.com', '+91-9123456713', 'pilgrim', true)

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- Admin profile
INSERT INTO profiles (id, name, email, phone, role, is_active) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Admin User', 'admin@bandhuconnect.com', '+91-9123456700', 'admin', true)

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- Show created profiles
SELECT 
    name,
    email,
    role,
    CASE WHEN role = 'volunteer' THEN skills ELSE NULL END as skills,
    is_active
FROM profiles 
WHERE email LIKE '%@demo.com' OR email = 'admin@bandhuconnect.com'
ORDER BY role, name;
