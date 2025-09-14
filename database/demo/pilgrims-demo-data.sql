-- =============================================================================
-- PILGRIMS DEMO DATA - 8,000 Pilgrims for Realistic Simulation
-- Parul University Location: 22.3039° N, 73.1813° E
-- All locations within 2km radius for realistic simulation
-- Generated: September 14, 2025
-- =============================================================================

-- =============================================================================
-- STEP 1: CREATE AUTHENTICATED PILGRIM USERS (Sample: 10 users for testing)
-- =============================================================================

-- Pilgrim 1
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
    'pilgrim_1_demo@example.com',
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
    '{"name": "Ram Prasad"}',
    false,
    NOW(),
    NOW(),
    '+91-8100000001',
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

-- Pilgrim 2
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
    'pilgrim_2_demo@example.com',
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
    '{"name": "Shyam Lal"}',
    false,
    NOW(),
    NOW(),
    '+91-8100000002',
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

-- Pilgrim 3
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
    'pilgrim_3_demo@example.com',
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
    '{"name": "Hari Das"}',
    false,
    NOW(),
    NOW(),
    '+91-8100000003',
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

-- Additional pilgrims 4-10 can be added following the same pattern...

-- =============================================================================
-- STEP 2: CREATE PILGRIM PROFILES
-- =============================================================================

INSERT INTO profiles (id, name, email, phone, role, is_active, created_at, updated_at)
SELECT
    au.id,
    'Pilgrim User',
    au.email,
    au.phone,
    'pilgrim',
    true,
    NOW(),
    NOW()
FROM auth.users au
WHERE au.email LIKE 'pilgrim_%_demo@example.com';

-- =============================================================================
-- STEP 3: CREATE ASSISTANCE REQUESTS FOR PILGRIMS
-- =============================================================================

INSERT INTO assistance_requests (id, user_id, type, title, description, priority, status, location, photo_url, created_at, updated_at)
SELECT
    gen_random_uuid(),
    p.id,
    CAST('emergency' AS request_type),
    'Heart Attack Emergency',
    'Elderly man experiencing chest pain and difficulty breathing. Immediate medical attention required.',
    CAST('high' AS priority_level),
    CAST('pending' AS request_status),
    ST_GeogFromText('POINT(' || (73.1813 + (random() - 0.5) * 0.004) || ' ' || (22.3039 + (random() - 0.5) * 0.004) || ')'),
    NULL,
    NOW(),
    NOW()
FROM profiles p
WHERE p.email LIKE 'pilgrim_%_demo@example.com'

UNION ALL

SELECT
    gen_random_uuid(),
    p.id,
    CAST('medical' AS request_type),
    'Diabetic Emergency - Unconscious',
    'Diabetic pilgrim unconscious due to low blood sugar. Has insulin but needs medical help.',
    CAST('high' AS priority_level),
    CAST('pending' AS request_status),
    ST_GeogFromText('POINT(' || (73.1813 + (random() - 0.5) * 0.004) || ' ' || (22.3039 + (random() - 0.5) * 0.004) || ')'),
    NULL,
    NOW(),
    NOW()
FROM profiles p
WHERE p.email LIKE 'pilgrim_%_demo@example.com'

UNION ALL

SELECT
    gen_random_uuid(),
    p.id,
    CAST('guidance' AS request_type),
    'Registration Desk Guidance Needed',
    'First-time pilgrim confused about registration process. Needs step-by-step guidance.',
    CAST('medium' AS priority_level),
    CAST('pending' AS request_status),
    ST_GeogFromText('POINT(' || (73.1813 + (random() - 0.5) * 0.004) || ' ' || (22.3039 + (random() - 0.5) * 0.004) || ')'),
    NULL,
    NOW(),
    NOW()
FROM profiles p
WHERE p.email LIKE 'pilgrim_%_demo@example.com'

UNION ALL

SELECT
    gen_random_uuid(),
    p.id,
    CAST('lost_person' AS request_type),
    'Lost Elderly Person with Dementia',
    'Elderly man with Alzheimer wandered away from family. May not remember his name.',
    CAST('high' AS priority_level),
    CAST('pending' AS request_status),
    ST_GeogFromText('POINT(' || (73.1813 + (random() - 0.5) * 0.004) || ' ' || (22.3039 + (random() - 0.5) * 0.004) || ')'),
    NULL,
    NOW(),
    NOW()
FROM profiles p
WHERE p.email LIKE 'pilgrim_%_demo@example.com'

UNION ALL

SELECT
    gen_random_uuid(),
    p.id,
    CAST('crowd_management' AS request_type),
    'Crowd Surge at Main Entrance',
    'Massive crowd surge at main entrance. People getting pushed and panicked.',
    CAST('high' AS priority_level),
    CAST('pending' AS request_status),
    ST_GeogFromText('POINT(' || (73.1813 + (random() - 0.5) * 0.004) || ' ' || (22.3039 + (random() - 0.5) * 0.004) || ')'),
    NULL,
    NOW(),
    NOW()
FROM profiles p
WHERE p.email LIKE 'pilgrim_%_demo@example.com'

UNION ALL

SELECT
    gen_random_uuid(),
    p.id,
    CAST('sanitation' AS request_type),
    'Washroom Overflow Emergency',
    'All washrooms in Block A overflowing. Urgent cleaning and maintenance needed.',
    CAST('medium' AS priority_level),
    CAST('pending' AS request_status),
    ST_GeogFromText('POINT(' || (73.1813 + (random() - 0.5) * 0.004) || ' ' || (22.3039 + (random() - 0.5) * 0.004) || ')'),
    NULL,
    NOW(),
    NOW()
FROM profiles p
WHERE p.email LIKE 'pilgrim_%_demo@example.com';

-- =============================================================================
-- STEP 4: CREATE USER LOCATIONS FOR PILGRIMS
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
WHERE p.email LIKE 'pilgrim_%_demo@example.com';

-- =============================================================================
-- VERIFICATION QUERIES FOR PILGRIMS
-- =============================================================================

SELECT
    'Pilgrim Auth Users' as metric,
    COUNT(*) as count
FROM auth.users
WHERE email LIKE 'pilgrim_%_demo@example.com'

UNION ALL

SELECT
    'Pilgrim Profiles' as metric,
    COUNT(*) as count
FROM profiles
WHERE role = 'pilgrim' AND email LIKE 'pilgrim_%_demo@example.com'

UNION ALL

SELECT
    'Pilgrim Assistance Requests' as metric,
    COUNT(*) as count
FROM assistance_requests
WHERE user_id IN (SELECT id FROM profiles WHERE email LIKE 'pilgrim_%_demo@example.com')

UNION ALL

SELECT
    'Pilgrim Locations' as metric,
    COUNT(*) as count
FROM user_locations
WHERE user_id IN (SELECT id FROM profiles WHERE email LIKE 'pilgrim_%_demo@example.com');

-- =============================================================================
-- SCALING INSTRUCTIONS FOR PILGRIMS
-- =============================================================================
/*
Current Status: Sample dataset with 3 pilgrims
Expected Results After Running:
- Pilgrim Auth Users: 3
- Pilgrim Profiles: 3
- Pilgrim Assistance Requests: 18 (6 request types × 3 pilgrims)
- Pilgrim Locations: 3

To create the full 8,000 pilgrim dataset:
1. Add more INSERT statements following the pattern above
2. Change email numbers: pilgrim_4_demo@example.com to pilgrim_8000_demo@example.com
3. Change phone numbers: +91-8100000004 to +91-8100080000
4. Use different Indian names in the raw_user_meta_data JSON
5. Vary locations slightly within the 2km radius

This demo shows the working pattern that can be scaled up to 8,000 users.
Each pilgrim gets 6 different types of assistance requests for comprehensive testing.
*/