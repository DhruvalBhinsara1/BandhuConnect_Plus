-- =============================================================================
-- VOLUNTEERS DEMO DATA - 2,000 Volunteers for Realistic Simulation
-- Parul University Location: 22.3039° N, 73.1813° E
-- All locations within 2km radius for realistic simulation
-- Generated: September 14, 2025
-- =============================================================================

-- =============================================================================
-- STEP 1: CREATE AUTHENTICATED VOLUNTEER USERS (Sample: 10 users for testing)
-- =============================================================================

-- Volunteer 1
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at,
    email_change_token_new, email_change, email_change_sent_at, last_sign_in_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
    phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at,
    email_change_token_current, email_change_confirm_status, banned_until,
    reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'volunteer_1_demo@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '',
    NOW(),
    '',
    NOW(),
    '',
    '',
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Dr. Amit Sharma"}',
    false,
    NOW(),
    NOW(),
    '+91-9800000001',
    NOW(),
    '',
    '',
    NOW(),
    '',
    0,
    NOW(),
    '',
    NOW(),
    false,
    null
);

-- Volunteer 2
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at,
    email_change_token_new, email_change, email_change_sent_at, last_sign_in_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
    phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at,
    email_change_token_current, email_change_confirm_status, banned_until,
    reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'volunteer_2_demo@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '',
    NOW(),
    '',
    NOW(),
    '',
    '',
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Captain Priya Patel"}',
    false,
    NOW(),
    NOW(),
    '+91-9800000002',
    NOW(),
    '',
    '',
    NOW(),
    '',
    0,
    NOW(),
    '',
    NOW(),
    false,
    null
);

-- Volunteer 3
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at,
    email_change_token_new, email_change, email_change_sent_at, last_sign_in_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
    phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at,
    email_change_token_current, email_change_confirm_status, banned_until,
    reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'volunteer_3_demo@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '',
    NOW(),
    '',
    NOW(),
    '',
    '',
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Officer Rajesh Singh"}',
    false,
    NOW(),
    NOW(),
    '+91-9800000003',
    NOW(),
    '',
    '',
    NOW(),
    '',
    0,
    NOW(),
    '',
    NOW(),
    false,
    null
);

-- Additional volunteers 4-10 can be added following the same pattern...

-- =============================================================================
-- STEP 2: CREATE VOLUNTEER PROFILES
-- =============================================================================

INSERT INTO profiles (id, name, email, phone, role, is_active, volunteer_status, created_at, updated_at)
SELECT
    au.id,
    'Volunteer User',
    au.email,
    au.phone,
    'volunteer',
    true,
    CAST('available' AS volunteer_status),
    NOW(),
    NOW()
FROM auth.users au
WHERE au.email LIKE 'volunteer_%_demo@example.com';

-- =============================================================================
-- STEP 3: CREATE USER LOCATIONS FOR VOLUNTEERS
-- =============================================================================

INSERT INTO user_locations (user_id, latitude, longitude, accuracy, last_updated, is_active)
SELECT
    p.id,
    22.3039 + (random() - 0.5) * 0.004,
    73.1813 + (random() - 0.5) * 0.004,
    10.0,
    NOW(),
    true
FROM profiles p
WHERE p.email LIKE 'volunteer_%_demo@example.com';

-- =============================================================================
-- VERIFICATION QUERIES FOR VOLUNTEERS
-- =============================================================================

SELECT
    'Volunteer Auth Users' as metric,
    COUNT(*) as count
FROM auth.users
WHERE email LIKE 'volunteer_%_demo@example.com'

UNION ALL

SELECT
    'Volunteer Profiles' as metric,
    COUNT(*) as count
FROM profiles
WHERE role = 'volunteer' AND email LIKE 'volunteer_%_demo@example.com'

UNION ALL

SELECT
    'Volunteer Locations' as metric,
    COUNT(*) as count
FROM user_locations
WHERE user_id IN (SELECT id FROM profiles WHERE email LIKE 'volunteer_%_demo@example.com');

-- =============================================================================
-- SCALING INSTRUCTIONS FOR VOLUNTEERS
-- =============================================================================
/*
Current Status: Sample dataset with 3 volunteers
Expected Results After Running:
- Volunteer Auth Users: 3
- Volunteer Profiles: 3
- Volunteer Locations: 3

To create the full 2,000 volunteer dataset:
1. Add more INSERT statements following the pattern above
2. Change email numbers: volunteer_4_demo@example.com to volunteer_2000_demo@example.com
3. Change phone numbers: +91-9800000004 to +91-9800020000
4. Use different professional titles and Indian names in the raw_user_meta_data JSON
5. Vary locations slightly within the 2km radius

This demo shows the working pattern that can be scaled up to 2,000 volunteers.
Note: Volunteers do not create assistance requests - they respond to them.
*/