-- Migrate Demo Data to Simplified Enum Values
-- This script updates all existing demo data to use the 5 simplified enum values

-- Update assistance_requests to use simplified enum values
UPDATE assistance_requests 
SET type = CASE 
    WHEN type::text = 'crowd_management' THEN 'general'::request_type
    WHEN type::text = 'tech' THEN 'general'::request_type
    WHEN type::text = 'medical' THEN 'medical'::request_type
    WHEN type::text = 'sanitation' THEN 'sanitation'::request_type
    WHEN type::text = 'general' THEN 'general'::request_type
    ELSE 'general'::request_type
END,
updated_at = NOW()
WHERE type::text NOT IN ('general', 'guidance', 'lost_person', 'medical', 'sanitation');

-- Update volunteer skills to match simplified categories
UPDATE profiles 
SET skills = CASE 
    -- Convert tech skills to general
    WHEN 'tech' = ANY(skills) THEN 
        array_remove(skills, 'tech') || ARRAY['general', 'technical_support']
    -- Convert crowd_management to general + search_rescue for lost_person capability
    WHEN 'crowd_management' = ANY(skills) THEN 
        array_remove(skills, 'crowd_management') || ARRAY['general', 'search_rescue', 'communication']
    -- Keep medical skills as is
    WHEN 'medical' = ANY(skills) OR 'first_aid' = ANY(skills) THEN 
        skills
    -- Keep sanitation skills as is
    WHEN 'sanitation' = ANY(skills) OR 'cleaning' = ANY(skills) THEN 
        skills
    -- Convert guidance-related skills
    WHEN 'guidance' = ANY(skills) OR 'translation' = ANY(skills) THEN 
        array_remove(array_remove(skills, 'guidance'), 'translation') || ARRAY['local_knowledge', 'language', 'navigation']
    ELSE 
        ARRAY['general', 'assistance', 'support']
END,
updated_at = NOW()
WHERE role = 'volunteer';

-- Add some lost_person demo requests since we don't have any
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
(
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email LIKE '%pilgrim%' LIMIT 1),
  'lost_person',
  'Missing elderly pilgrim - last seen near main gate',
  'An 75-year-old man with white beard wearing orange kurta was last seen near the main gate 2 hours ago. Family is very worried. He has memory issues and may be confused.',
  'high',
  'pending',
  ST_GeogFromText('POINT(70.1308 21.3079)'),
  NOW() - INTERVAL '30 minutes',
  NOW() - INTERVAL '30 minutes'
),
(
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email LIKE '%pilgrim%' LIMIT 1),
  'lost_person',
  'Lost teenager separated from group',
  'A 16-year-old girl got separated from her family group during the evening rush. She was wearing a pink dupatta and has a small backpack. Last seen near food court.',
  'high',
  'pending',
  ST_GeogFromText('POINT(70.1298 21.3069)'),
  NOW() - INTERVAL '45 minutes',
  NOW() - INTERVAL '45 minutes'
),
(
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email LIKE '%pilgrim%' LIMIT 1),
  'guidance',
  'Foreign pilgrims need directions to accommodation',
  'Group of 8 foreign pilgrims need help finding their pre-booked accommodation. They have booking confirmation but are lost and language barrier is making it difficult.',
  'medium',
  'pending',
  ST_GeogFromText('POINT(70.1288 21.3059)'),
  NOW() - INTERVAL '20 minutes',
  NOW() - INTERVAL '20 minutes'
);

-- Add volunteers with skills for lost_person scenarios
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
(
  gen_random_uuid(),
  'Search Rescue Volunteer',
  'search.rescue@volunteer.com',
  '+91-9876543222',
  'volunteer',
  true,
  'available',
  ARRAY['search_rescue', 'communication', 'local_knowledge', 'crowd_management'],
  NOW() - INTERVAL '1 day',
  NOW()
),
(
  gen_random_uuid(),
  'Local Guide Volunteer',
  'local.guide@volunteer.com',
  '+91-9876543223',
  'volunteer',
  true,
  'available',
  ARRAY['local_knowledge', 'language', 'navigation', 'tour_guide'],
  NOW() - INTERVAL '1 day',
  NOW()
);

-- Display summary of migration
SELECT 
  'Demo Data Migration Completed!' as message,
  (SELECT COUNT(*) FROM assistance_requests WHERE type = 'general') as general_requests,
  (SELECT COUNT(*) FROM assistance_requests WHERE type = 'guidance') as guidance_requests,
  (SELECT COUNT(*) FROM assistance_requests WHERE type = 'lost_person') as lost_person_requests,
  (SELECT COUNT(*) FROM assistance_requests WHERE type = 'medical') as medical_requests,
  (SELECT COUNT(*) FROM assistance_requests WHERE type = 'sanitation') as sanitation_requests;

-- Show current enum values in database
SELECT 'Current enum values in database:' as info;
SELECT DISTINCT type::text as request_types FROM assistance_requests ORDER BY type::text;
