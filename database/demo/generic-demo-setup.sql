-- =============================================================================
-- BandhuConnect+ Professional Demo Setup (Location-Generic)
-- Version: 2.1.0 - Updated September 6, 2025
-- Description: Creates realistic demo scenarios with general location references
-- =============================================================================

-- Clean up existing demo data (preserve real user accounts)
DELETE FROM user_locations WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%@demo.com'
);

DELETE FROM assignments WHERE request_id IN (
    SELECT id FROM assistance_requests WHERE user_id IN (
        SELECT id FROM profiles WHERE email LIKE '%@demo.com'
    )
);

DELETE FROM assistance_requests WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%@demo.com'
);

-- =============================================================================
-- DEMO ASSISTANCE REQUESTS WITH GENERAL LOCATIONS
-- =============================================================================

-- Medical Emergency Request
INSERT INTO assistance_requests (
    id, 
    user_id, 
    type, 
    title, 
    description, 
    priority, 
    status, 
    location, 
    address,
    estimated_duration,
    assignment_method,
    created_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'elderly.user@demo.com' LIMIT 1),
    'medical',
    'Medical Assistance Needed',
    'Elderly person experiencing discomfort and needs immediate medical attention at the campus medical facility.',
    'high',
    'pending',
    ST_GeogFromText('POINT(72.7780 22.2587)'),
    'Medical Center - Main Campus',
    30,
    'auto',
    NOW() - INTERVAL '5 minutes'
);

-- Lost Person Request  
INSERT INTO assistance_requests (
    id, 
    user_id, 
    type, 
    title, 
    description, 
    priority, 
    status, 
    location, 
    address,
    estimated_duration,
    assignment_method,
    created_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'family.user@demo.com' LIMIT 1),
    'lost_person',
    'Child Separated from Family',
    'Lost 8-year-old child last seen near the main library building. Child is wearing blue shirt and carrying a red backpack.',
    'urgent',
    'assigned',
    ST_GeogFromText('POINT(72.7785 22.2590)'),
    'Central Library Building',
    45,
    'auto',
    NOW() - INTERVAL '15 minutes'
);

-- Navigation Help Request
INSERT INTO assistance_requests (
    id, 
    user_id, 
    type, 
    title, 
    description, 
    priority, 
    status, 
    location, 
    address,
    estimated_duration,
    assignment_method,
    created_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'visitor.user@demo.com' LIMIT 1),
    'navigation',
    'Directions to Accommodation',
    'International visitors need directions to guest house accommodation. Not familiar with campus layout.',
    'medium',
    'in_progress',
    ST_GeogFromText('POINT(72.7790 22.2583)'),
    'Main Campus Entrance Gate',
    20,
    'manual',
    NOW() - INTERVAL '10 minutes'
);

-- Sanitation Issue Request
INSERT INTO assistance_requests (
    id, 
    user_id, 
    type, 
    title, 
    description, 
    priority, 
    status, 
    location, 
    address,
    estimated_duration,
    assignment_method,
    created_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'general.user@demo.com' LIMIT 1),
    'sanitation',
    'Restroom Facilities Issue',
    'Restroom facilities in the engineering building need attention. Multiple stalls out of order.',
    'medium',
    'pending',
    ST_GeogFromText('POINT(72.7795 22.2585)'),
    'Engineering Building - Block A',
    15,
    'auto',
    NOW() - INTERVAL '8 minutes'
);

-- Crowd Management Request
INSERT INTO assistance_requests (
    id, 
    user_id, 
    type, 
    title, 
    description, 
    priority, 
    status, 
    location, 
    address,
    estimated_duration,
    assignment_method,
    created_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'event.coordinator@demo.com' LIMIT 1),
    'crowd_management',
    'Crowd Control at Dining Area',
    'Large gathering at main dining hall causing congestion. Need assistance managing crowd flow during peak hours.',
    'high',
    'assigned',
    ST_GeogFromText('POINT(72.7775 22.2592)'),
    'Central Dining Hall',
    60,
    'manual',
    NOW() - INTERVAL '20 minutes'
);

-- Completed Request (for success metrics)
INSERT INTO assistance_requests (
    id, 
    user_id, 
    type, 
    title, 
    description, 
    priority, 
    status, 
    location, 
    address,
    estimated_duration,
    assignment_method,
    created_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE email = 'elderly.user@demo.com' LIMIT 1),
    'guidance',
    'Campus Tour Assistance',
    'Needed guidance for campus tour and information about facilities. Successfully completed with volunteer help.',
    'low',
    'completed',
    ST_GeogFromText('POINT(72.7788 22.2595)'),
    'Campus Information Center',
    40,
    'auto',
    NOW() - INTERVAL '2 hours'
);

-- =============================================================================
-- DEMO ASSIGNMENTS
-- =============================================================================

-- Assignment for lost child case (high priority)
INSERT INTO assignments (
    id,
    request_id,
    volunteer_id,
    status,
    assignment_method,
    assigned_at,
    accepted_at,
    notes
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM assistance_requests WHERE title = 'Child Separated from Family' LIMIT 1),
    (SELECT id FROM profiles WHERE email = 'security.volunteer@demo.com' LIMIT 1),
    'accepted',
    'auto',
    NOW() - INTERVAL '12 minutes',
    NOW() - INTERVAL '10 minutes',
    'Volunteer has experience with child safety and crowd situations.'
);

-- Assignment for crowd management
INSERT INTO assignments (
    id,
    request_id,
    volunteer_id,
    status,
    assignment_method,
    assigned_at,
    accepted_at,
    started_at,
    notes
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM assistance_requests WHERE title = 'Crowd Control at Dining Area' LIMIT 1),
    (SELECT id FROM profiles WHERE email = 'admin.volunteer@demo.com' LIMIT 1),
    'in_progress',
    'manual',
    NOW() - INTERVAL '18 minutes',
    NOW() - INTERVAL '15 minutes',
    NOW() - INTERVAL '12 minutes',
    'Experienced volunteer assigned manually due to specialized crowd management skills.'
);

-- Completed assignment for metrics
INSERT INTO assignments (
    id,
    request_id,
    volunteer_id,
    status,
    assignment_method,
    assigned_at,
    accepted_at,
    started_at,
    completed_at,
    rating,
    feedback,
    notes
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM assistance_requests WHERE title = 'Campus Tour Assistance' LIMIT 1),
    (SELECT id FROM profiles WHERE email = 'guide.volunteer@demo.com' LIMIT 1),
    'completed',
    'auto',
    NOW() - INTERVAL '130 minutes',
    NOW() - INTERVAL '125 minutes',
    NOW() - INTERVAL '120 minutes',
    NOW() - INTERVAL '80 minutes',
    5,
    'Excellent service! Volunteer was very knowledgeable and helpful throughout the campus tour.',
    'Tour completed successfully. User was very satisfied with the assistance provided.'
);

-- =============================================================================
-- UPDATE USER LOCATIONS FOR ACTIVE VOLUNTEERS
-- =============================================================================

-- Update locations for volunteers (using general campus coordinates)
INSERT INTO user_locations (user_id, latitude, longitude, accuracy, is_active, last_updated)
SELECT id, 22.2585, 72.7782, 5.0, true, NOW()
FROM profiles 
WHERE email = 'medical.volunteer@demo.com';

INSERT INTO user_locations (user_id, latitude, longitude, accuracy, is_active, last_updated)
SELECT id, 22.2588, 72.7778, 5.0, true, NOW()
FROM profiles 
WHERE email = 'guide.volunteer@demo.com';

INSERT INTO user_locations (user_id, latitude, longitude, accuracy, is_active, last_updated)
SELECT id, 22.2590, 72.7785, 5.0, true, NOW()
FROM profiles 
WHERE email = 'security.volunteer@demo.com';

INSERT INTO user_locations (user_id, latitude, longitude, accuracy, is_active, last_updated)
SELECT id, 22.2583, 72.7795, 5.0, true, NOW()
FROM profiles 
WHERE email = 'maintenance.volunteer@demo.com';

-- =============================================================================
-- UPDATE VOLUNTEER STATUSES
-- =============================================================================

-- Set volunteer statuses based on their current assignments
UPDATE profiles SET 
    volunteer_status = CASE 
        WHEN email = 'security.volunteer@demo.com' THEN 'busy'
        WHEN email = 'admin.volunteer@demo.com' THEN 'busy'
        WHEN email LIKE '%.volunteer@demo.com' THEN 'available'
        ELSE volunteer_status
    END,
    updated_at = NOW()
WHERE email LIKE '%.volunteer@demo.com';

-- =============================================================================
-- UPDATE USER LOCATIONS FOR REQUESTING USERS
-- =============================================================================

-- Update locations for users with active requests
UPDATE user_locations SET
    latitude = CASE 
        WHEN user_id = (SELECT id FROM profiles WHERE email = 'elderly.user@demo.com') THEN 22.2587
        WHEN user_id = (SELECT id FROM profiles WHERE email = 'family.user@demo.com') THEN 22.2590
        WHEN user_id = (SELECT id FROM profiles WHERE email = 'visitor.user@demo.com') THEN 22.2583
        WHEN user_id = (SELECT id FROM profiles WHERE email = 'general.user@demo.com') THEN 22.2585
        ELSE latitude
    END,
    longitude = CASE 
        WHEN user_id = (SELECT id FROM profiles WHERE email = 'elderly.user@demo.com') THEN 72.7780
        WHEN user_id = (SELECT id FROM profiles WHERE email = 'family.user@demo.com') THEN 72.7785
        WHEN user_id = (SELECT id FROM profiles WHERE email = 'visitor.user@demo.com') THEN 72.7790
        WHEN user_id = (SELECT id FROM profiles WHERE email = 'general.user@demo.com') THEN 72.7795
        ELSE longitude
    END,
    last_updated = NOW()
WHERE user_id IN (
    SELECT id FROM profiles 
    WHERE email IN (
        'elderly.user@demo.com',
        'family.user@demo.com', 
        'visitor.user@demo.com',
        'general.user@demo.com'
    )
);

-- =============================================================================
-- VERIFICATION AND COMPLETION
-- =============================================================================

-- Verify demo data creation
SELECT 
    'Demo Setup Complete' as status,
    (SELECT COUNT(*) FROM assistance_requests WHERE user_id IN (
        SELECT id FROM profiles WHERE email LIKE '%@demo.com'
    )) as demo_requests,
    (SELECT COUNT(*) FROM assignments WHERE volunteer_id IN (
        SELECT id FROM profiles WHERE email LIKE '%.volunteer@demo.com'
    )) as demo_assignments,
    (SELECT COUNT(*) FROM user_locations WHERE user_id IN (
        SELECT id FROM profiles WHERE email LIKE '%@demo.com'
    )) as demo_locations;

-- =============================================================================
-- SUMMARY
-- =============================================================================
-- ✅ 6 assistance requests (various types and statuses)
-- ✅ 3 assignments (including completed one for metrics)
-- ✅ Updated volunteer statuses and locations
-- ✅ General campus locations (adaptable to any institution)
-- ✅ Professional demo environment ready for testing
