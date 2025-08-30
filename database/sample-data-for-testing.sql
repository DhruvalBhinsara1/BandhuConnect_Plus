-- Sample Data for Testing Task Assignment Feature
-- Run this in Supabase SQL Editor to populate test data

-- First, let's add some sample assistance requests with various types and priorities
INSERT INTO assistance_requests (
  id,
  user_id,
  type,
  title,
  description,
  priority,
  status,
  location,
  created_at,
  updated_at
) VALUES 
-- Medical emergencies
(
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email LIKE '%pilgrim%' LIMIT 1),
  'medical',
  'Elderly person needs medical assistance',
  'An elderly pilgrim has fallen and appears to have injured their ankle. They need immediate medical attention and help getting to the medical tent.',
  'high',
  'pending',
  ST_GeogFromText('POINT(70.1318 21.3099)'),
  NOW() - INTERVAL '15 minutes',
  NOW() - INTERVAL '15 minutes'
),
(
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email LIKE '%pilgrim%' LIMIT 1),
  'medical',
  'Child with fever needs help',
  'A young child is running a high fever and the parents need assistance getting to the medical facility. Child appears dehydrated.',
  'high',
  'pending',
  ST_GeogFromText('POINT(70.1328 21.3089)'),
  NOW() - INTERVAL '25 minutes',
  NOW() - INTERVAL '25 minutes'
),

-- Crowd management
(
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email LIKE '%pilgrim%' LIMIT 1),
  'crowd_management',
  'Large crowd gathering at Gate 3',
  'A large crowd has formed at Gate 3 entrance causing congestion. Need volunteers to help manage the flow and guide people to alternative entrances.',
  'medium',
  'pending',
  ST_GeogFromText('POINT(70.1308 21.3079)'),
  NOW() - INTERVAL '10 minutes',
  NOW() - INTERVAL '10 minutes'
),
(
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email LIKE '%pilgrim%' LIMIT 1),
  'crowd_management',
  'Queue management needed at food distribution',
  'Long queues at food distribution center need better organization. People are getting confused about which line to join.',
  'medium',
  'pending',
  ST_GeogFromText('POINT(70.1298 21.3069)'),
  NOW() - INTERVAL '30 minutes',
  NOW() - INTERVAL '30 minutes'
),

-- General assistance
(
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email LIKE '%pilgrim%' LIMIT 1),
  'general',
  'Lost child needs help finding parents',
  'A 7-year-old child is lost and crying. They remember their parents were wearing blue clothes but cannot find them. Need help reuniting with family.',
  'high',
  'pending',
  ST_GeogFromText('POINT(70.1288 21.3059)'),
  NOW() - INTERVAL '5 minutes',
  NOW() - INTERVAL '5 minutes'
),
(
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email LIKE '%pilgrim%' LIMIT 1),
  'general',
  'Wheelchair assistance needed',
  'Elderly pilgrim in wheelchair needs assistance navigating through the crowd to reach the main temple area.',
  'medium',
  'pending',
  ST_GeogFromText('POINT(70.1278 21.3049)'),
  NOW() - INTERVAL '20 minutes',
  NOW() - INTERVAL '20 minutes'
),
(
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email LIKE '%pilgrim%' LIMIT 1),
  'general',
  'Language barrier - translation help needed',
  'Foreign pilgrims need help communicating with local vendors. They speak only English and need assistance with directions and purchases.',
  'low',
  'pending',
  ST_GeogFromText('POINT(70.1268 21.3039)'),
  NOW() - INTERVAL '40 minutes',
  NOW() - INTERVAL '40 minutes'
),

-- Technical issues
(
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email LIKE '%pilgrim%' LIMIT 1),
  'tech',
  'Sound system malfunction at main stage',
  'The main sound system has stopped working during the evening prayers. Need technical assistance to fix the audio equipment urgently.',
  'high',
  'pending',
  ST_GeogFromText('POINT(70.1258 21.3029)'),
  NOW() - INTERVAL '8 minutes',
  NOW() - INTERVAL '8 minutes'
),
(
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email LIKE '%pilgrim%' LIMIT 1),
  'tech',
  'Mobile charging station not working',
  'The mobile charging station near the main entrance is not functioning. Many pilgrims need to charge their phones for communication.',
  'medium',
  'pending',
  ST_GeogFromText('POINT(70.1248 21.3019)'),
  NOW() - INTERVAL '35 minutes',
  NOW() - INTERVAL '35 minutes'
),

-- Sanitation
(
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email LIKE '%pilgrim%' LIMIT 1),
  'sanitation',
  'Restroom facilities need immediate cleaning',
  'The restroom facilities near Block A are in urgent need of cleaning and restocking. Multiple complaints received from pilgrims.',
  'medium',
  'pending',
  ST_GeogFromText('POINT(70.1238 21.3009)'),
  NOW() - INTERVAL '12 minutes',
  NOW() - INTERVAL '12 minutes'
),
(
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email LIKE '%pilgrim%' LIMIT 1),
  'sanitation',
  'Garbage overflow at food court',
  'Garbage bins at the food court area are overflowing. Need immediate attention to maintain cleanliness and hygiene.',
  'medium',
  'pending',
  ST_GeogFromText('POINT(70.1228 21.2999)'),
  NOW() - INTERVAL '18 minutes',
  NOW() - INTERVAL '18 minutes'
),

-- Some older requests for variety
(
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email LIKE '%pilgrim%' LIMIT 1),
  'general',
  'Information booth assistance needed',
  'The information booth is understaffed and there are long queues of pilgrims asking for directions and event schedules.',
  'low',
  'pending',
  ST_GeogFromText('POINT(70.1218 21.2989)'),
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '1 hour'
),
(
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email LIKE '%pilgrim%' LIMIT 1),
  'medical',
  'First aid supplies running low',
  'The first aid station reports that they are running low on basic supplies like bandages and antiseptic. Need restocking.',
  'medium',
  'pending',
  ST_GeogFromText('POINT(70.1208 21.2979)'),
  NOW() - INTERVAL '45 minutes',
  NOW() - INTERVAL '45 minutes'
),
(
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email LIKE '%pilgrim%' LIMIT 1),
  'crowd_management',
  'Parking area needs traffic control',
  'The main parking area is getting congested with vehicles. Need volunteers to help direct traffic and organize parking.',
  'low',
  'pending',
  ST_GeogFromText('POINT(70.1198 21.2969)'),
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours'
);

-- First create auth.users entries for volunteers
DO $$
DECLARE
    volunteer_ids UUID[] := ARRAY[
        gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
        gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
        gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
    ];
    volunteer_emails TEXT[] := ARRAY[
        'priya.sharma@volunteer.com', 'rajesh.kumar@volunteer.com', 'amit.tech@volunteer.com',
        'sneha.it@volunteer.com', 'vikram.singh@volunteer.com', 'meera.crowd@volunteer.com',
        'ravi.helper@volunteer.com', 'sunita.guide@volunteer.com', 'mohan.clean@volunteer.com',
        'kavita.hygiene@volunteer.com', 'arjun.multi@volunteer.com', 'pooja.versatile@volunteer.com'
    ];
    i INTEGER;
BEGIN
    FOR i IN 1..12 LOOP
        INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at, last_sign_in_at)
        VALUES (
            volunteer_ids[i],
            volunteer_emails[i],
            NOW() - INTERVAL '1 day',
            NOW(),
            NOW() - INTERVAL '1 day',
            NOW() - INTERVAL '1 day'
        )
        ON CONFLICT (id) DO NOTHING;
    END LOOP;
END $$;

-- Add some sample volunteers with different skills and statuses
INSERT INTO profiles (
  id,
  name,
  email,
  phone,
  role,
  is_active,
  volunteer_status,
  skills,
  created_at,
  updated_at
) VALUES 
-- Medical volunteers
(
  (SELECT id FROM auth.users WHERE email = 'priya.sharma@volunteer.com'),
  'Dr. Priya Sharma',
  'priya.sharma@volunteer.com',
  '+91-9876543210',
  'volunteer',
  true,
  'available',
  ARRAY['medical', 'first_aid', 'emergency_response'],
  NOW() - INTERVAL '1 day',
  NOW()
),
(
  (SELECT id FROM auth.users WHERE email = 'rajesh.kumar@volunteer.com'),
  'Nurse Rajesh Kumar',
  'rajesh.kumar@volunteer.com',
  '+91-9876543211',
  'volunteer',
  true,
  'available',
  ARRAY['medical', 'first_aid', 'patient_care'],
  NOW() - INTERVAL '1 day',
  NOW()
),

-- Technical volunteers
(
  (SELECT id FROM auth.users WHERE email = 'amit.tech@volunteer.com'),
  'Amit Tech',
  'amit.tech@volunteer.com',
  '+91-9876543212',
  'volunteer',
  true,
  'available',
  ARRAY['tech', 'electronics', 'sound_systems'],
  NOW() - INTERVAL '1 day',
  NOW()
),
(
  (SELECT id FROM auth.users WHERE email = 'sneha.it@volunteer.com'),
  'Sneha IT',
  'sneha.it@volunteer.com',
  '+91-9876543213',
  'volunteer',
  true,
  'busy',
  ARRAY['tech', 'networking', 'mobile_support'],
  NOW() - INTERVAL '1 day',
  NOW()
),

-- Crowd management volunteers
(
  (SELECT id FROM auth.users WHERE email = 'vikram.singh@volunteer.com'),
  'Vikram Singh',
  'vikram.singh@volunteer.com',
  '+91-9876543214',
  'volunteer',
  true,
  'available',
  ARRAY['crowd_management', 'security', 'traffic_control'],
  NOW() - INTERVAL '1 day',
  NOW()
),
(
  (SELECT id FROM auth.users WHERE email = 'meera.crowd@volunteer.com'),
  'Meera Crowd',
  'meera.crowd@volunteer.com',
  '+91-9876543215',
  'volunteer',
  true,
  'busy',
  ARRAY['crowd_management', 'queue_management', 'guidance'],
  NOW() - INTERVAL '1 day',
  NOW()
),

-- General assistance volunteers
(
  (SELECT id FROM auth.users WHERE email = 'ravi.helper@volunteer.com'),
  'Ravi Helper',
  'ravi.helper@volunteer.com',
  '+91-9876543216',
  'volunteer',
  true,
  'available',
  ARRAY['general', 'translation', 'elderly_care'],
  NOW() - INTERVAL '1 day',
  NOW()
),
(
  (SELECT id FROM auth.users WHERE email = 'sunita.guide@volunteer.com'),
  'Sunita Guide',
  'sunita.guide@volunteer.com',
  '+91-9876543217',
  'volunteer',
  true,
  'available',
  ARRAY['general', 'guidance', 'child_care'],
  NOW() - INTERVAL '1 day',
  NOW()
),

-- Sanitation volunteers
(
  (SELECT id FROM auth.users WHERE email = 'mohan.clean@volunteer.com'),
  'Mohan Clean',
  'mohan.clean@volunteer.com',
  '+91-9876543218',
  'volunteer',
  true,
  'available',
  ARRAY['sanitation', 'cleaning', 'waste_management'],
  NOW() - INTERVAL '1 day',
  NOW()
),
(
  (SELECT id FROM auth.users WHERE email = 'kavita.hygiene@volunteer.com'),
  'Kavita Hygiene',
  'kavita.hygiene@volunteer.com',
  '+91-9876543219',
  'volunteer',
  true,
  'offline',
  ARRAY['sanitation', 'hygiene', 'facility_maintenance'],
  NOW() - INTERVAL '1 day',
  NOW()
),

-- Multi-skilled volunteers
(
  (SELECT id FROM auth.users WHERE email = 'arjun.multi@volunteer.com'),
  'Arjun Multi',
  'arjun.multi@volunteer.com',
  '+91-9876543220',
  'volunteer',
  true,
  'available',
  ARRAY['general', 'crowd_management', 'first_aid'],
  NOW() - INTERVAL '1 day',
  NOW()
),
(
  (SELECT id FROM auth.users WHERE email = 'pooja.versatile@volunteer.com'),
  'Pooja Versatile',
  'pooja.versatile@volunteer.com',
  '+91-9876543221',
  'volunteer',
  true,
  'available',
  ARRAY['general', 'tech', 'translation'],
  NOW() - INTERVAL '1 day',
  NOW()
);


-- Add some sample assignments to show different statuses
INSERT INTO assignments (
  id,
  request_id,
  volunteer_id,
  status,
  assigned_at,
  accepted_at,
  started_at,
  completed_at,
  created_at,
  updated_at
) VALUES 
-- Accepted assignment
(
  gen_random_uuid(),
  (SELECT id FROM assistance_requests WHERE title LIKE '%Sound system malfunction%' LIMIT 1),
  (SELECT id FROM profiles WHERE name = 'Amit Tech' LIMIT 1),
  'accepted',
  NOW() - INTERVAL '5 minutes',
  NOW() - INTERVAL '2 minutes',
  NULL,
  NULL,
  NOW() - INTERVAL '5 minutes',
  NOW() - INTERVAL '2 minutes'
),
-- On duty assignment
(
  gen_random_uuid(),
  (SELECT id FROM assistance_requests WHERE title LIKE '%Large crowd gathering%' LIMIT 1),
  (SELECT id FROM profiles WHERE name = 'Meera Crowd' LIMIT 1),
  'in_progress',
  NOW() - INTERVAL '8 minutes',
  NOW() - INTERVAL '6 minutes',
  NOW() - INTERVAL '4 minutes',
  NULL,
  NOW() - INTERVAL '8 minutes',
  NOW() - INTERVAL '4 minutes'
);

-- Update the status of assigned requests
UPDATE assistance_requests 
SET status = 'assigned', updated_at = NOW()
WHERE title IN ('Sound system malfunction at main stage', 'Large crowd gathering at Gate 3');

-- Display summary of created data
SELECT 
  'Sample Data Created Successfully!' as message,
  (SELECT COUNT(*) FROM assistance_requests WHERE status = 'pending') as pending_requests,
  (SELECT COUNT(*) FROM profiles WHERE role = 'volunteer' AND is_active = true) as active_volunteers,
  (SELECT COUNT(*) FROM assignments) as total_assignments;
