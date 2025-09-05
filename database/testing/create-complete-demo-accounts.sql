-- Complete Demo Account Creation (Auth + Profiles)
-- Run this in Supabase SQL Editor to create both auth users and profiles

-- Create auth users first
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at
) VALUES 
-- Volunteer accounts
('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'dr.rajesh.medical@demo.com', crypt('password123', gen_salt('bf')), NOW(), '', NOW(), '', NOW(), '', '', NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NOW(), '', 0, NOW(), '', NOW()),

('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'priya.guide@demo.com', crypt('password123', gen_salt('bf')), NOW(), '', NOW(), '', NOW(), '', '', NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NOW(), '', 0, NOW(), '', NOW()),

('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'amit.security@demo.com', crypt('password123', gen_salt('bf')), NOW(), '', NOW(), '', NOW(), '', '', NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NOW(), '', 0, NOW(), '', NOW()),

-- Pilgrim accounts
('00000000-0000-0000-0000-000000000000', '66666666-6666-6666-6666-666666666666', 'authenticated', 'authenticated', 'ramesh.elderly@demo.com', crypt('password123', gen_salt('bf')), NOW(), '', NOW(), '', NOW(), '', '', NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NOW(), '', 0, NOW(), '', NOW()),

('00000000-0000-0000-0000-000000000000', '77777777-7777-7777-7777-777777777777', 'authenticated', 'authenticated', 'sunita.family@demo.com', crypt('password123', gen_salt('bf')), NOW(), '', NOW(), '', NOW(), '', '', NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NOW(), '', 0, NOW(), '', NOW()),

-- Admin account
('00000000-0000-0000-0000-000000000000', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'authenticated', 'authenticated', 'admin@bandhuconnect.com', crypt('admin123', gen_salt('bf')), NOW(), '', NOW(), '', NOW(), '', '', NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', FALSE, NOW(), NOW(), NULL, NULL, '', '', NOW(), '', 0, NOW(), '', NOW())

ON CONFLICT (id) DO NOTHING;

-- Create corresponding profiles
INSERT INTO profiles (id, name, email, phone, role, skills, volunteer_status, is_active) VALUES
-- Volunteers
('11111111-1111-1111-1111-111111111111', 'Dr. Rajesh Patel', 'dr.rajesh.medical@demo.com', '+91-9123456701', 'volunteer', ARRAY['medical', 'first_aid', 'emergency'], 'available', true),
('22222222-2222-2222-2222-222222222222', 'Priya Sharma', 'priya.guide@demo.com', '+91-9123456702', 'volunteer', ARRAY['guidance', 'translation', 'crowd_management'], 'available', true),
('33333333-3333-3333-3333-333333333333', 'Amit Kumar', 'amit.security@demo.com', '+91-9123456703', 'volunteer', ARRAY['security', 'crowd_management', 'emergency'], 'available', true),

-- Pilgrims
('66666666-6666-6666-6666-666666666666', 'Ramesh Gupta', 'ramesh.elderly@demo.com', '+91-9123456706', 'pilgrim', NULL, 'offline', true),
('77777777-7777-7777-7777-777777777777', 'Sunita Devi', 'sunita.family@demo.com', '+91-9123456707', 'pilgrim', NULL, 'offline', true),

-- Admin
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Admin User', 'admin@bandhuconnect.com', '+91-9123456700', 'admin', NULL, 'offline', true)

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    skills = EXCLUDED.skills,
    volunteer_status = EXCLUDED.volunteer_status,
    is_active = EXCLUDED.is_active;

-- Verify accounts were created
SELECT 
    au.email,
    au.email_confirmed_at IS NOT NULL as confirmed,
    p.name,
    p.role,
    p.volunteer_status
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE au.email LIKE '%@demo.com' OR au.email = 'admin@bandhuconnect.com'
ORDER BY p.role, p.name;
