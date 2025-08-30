-- FORCE REMOVE UNWANTED ENUM VALUES - Complete Cleanup
-- This script FORCIBLY removes tech and transportation enum values and fixes all data

-- Step 1: First, update ALL existing data that uses unwanted enum values
UPDATE assistance_requests 
SET type = CASE 
    WHEN type::text = 'tech' THEN 'general'::request_type
    WHEN type::text = 'transportation' THEN 'general'::request_type
    WHEN type::text = 'crowd_management' THEN 'general'::request_type
    WHEN type::text = 'emergency' THEN 'medical'::request_type
    WHEN type::text = 'food' THEN 'general'::request_type
    WHEN type::text = 'accommodation' THEN 'general'::request_type
    ELSE type
END,
updated_at = NOW()
WHERE type::text IN ('tech', 'transportation', 'crowd_management', 'emergency', 'food', 'accommodation');

-- Step 2: Clean up volunteer skills - remove ALL references to unwanted values
UPDATE profiles 
SET skills = (
    SELECT ARRAY(
        SELECT DISTINCT skill 
        FROM unnest(
            CASE 
                -- Replace tech with general + technical_support
                WHEN 'tech' = ANY(skills) THEN 
                    array_remove(skills, 'tech') || ARRAY['general', 'technical_support']
                -- Replace transportation with general + logistics
                WHEN 'transportation' = ANY(skills) THEN 
                    array_remove(skills, 'transportation') || ARRAY['general', 'logistics']
                -- Replace crowd_management with general + search_rescue
                WHEN 'crowd_management' = ANY(skills) THEN 
                    array_remove(skills, 'crowd_management') || ARRAY['general', 'search_rescue', 'communication']
                -- Replace emergency with medical
                WHEN 'emergency' = ANY(skills) THEN 
                    array_remove(skills, 'emergency') || ARRAY['medical', 'emergency_response']
                ELSE skills
            END
        ) AS skill
        WHERE skill IS NOT NULL AND skill != ''
    )
),
updated_at = NOW()
WHERE role = 'volunteer' 
AND (
    'tech' = ANY(skills) OR 
    'transportation' = ANY(skills) OR
    'crowd_management' = ANY(skills) OR 
    'emergency' = ANY(skills)
);

-- Step 3: FORCE recreate the enum with ONLY the 7 allowed values (removing tech and transportation)
-- Create a completely new enum type with ONLY allowed values (NO tech, NO transportation)
CREATE TYPE request_type_clean AS ENUM (
    'crowd_management',
    'emergency', 
    'general',
    'guidance',
    'lost_person',
    'medical',
    'sanitation'
);

-- Step 4: Convert all data to use the clean enum
ALTER TABLE assistance_requests 
ALTER COLUMN type TYPE request_type_clean 
USING type::text::request_type_clean;

-- Step 5: Drop the old enum and rename the clean one
DROP TYPE request_type CASCADE;
ALTER TYPE request_type_clean RENAME TO request_type;

-- Step 6: Verify NO tech or transportation values exist anywhere
-- This should return 0 rows
SELECT 'Checking for tech/transportation in assistance_requests:' as check_type;
SELECT COUNT(*) as should_be_zero 
FROM assistance_requests 
WHERE type::text IN ('tech', 'transportation');

-- Check volunteer skills too
SELECT 'Checking for tech/transportation in volunteer skills:' as check_type;
SELECT COUNT(*) as should_be_zero 
FROM profiles 
WHERE role = 'volunteer' 
AND ('tech' = ANY(skills) OR 'transportation' = ANY(skills));

-- Step 6: Add some sample data for the missing enum types
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
-- Lost person requests
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
-- Guidance requests
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
),
(
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email LIKE '%pilgrim%' LIMIT 1),
  'guidance',
  'Need help with event schedule and locations',
  'Family group needs assistance understanding the event schedule and finding specific ceremony locations. They have questions about timing and dress code requirements.',
  'low',
  'pending',
  ST_GeogFromText('POINT(70.1278 21.3049)'),
  NOW() - INTERVAL '35 minutes',
  NOW() - INTERVAL '35 minutes'
);

-- Step 7: Add volunteers with appropriate skills for new request types
DO $$
DECLARE
    new_volunteer_ids UUID[] := ARRAY[gen_random_uuid(), gen_random_uuid()];
    new_emails TEXT[] := ARRAY['search.rescue@volunteer.com', 'local.guide@volunteer.com'];
BEGIN
    -- Create auth users for new volunteers
    FOR i IN 1..2 LOOP
        INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at, last_sign_in_at)
        VALUES (
            new_volunteer_ids[i],
            new_emails[i],
            NOW() - INTERVAL '1 day',
            NOW(),
            NOW() - INTERVAL '1 day',
            NOW() - INTERVAL '1 day'
        )
        ON CONFLICT (id) DO NOTHING;
    END LOOP;
END $$;

-- Add volunteer profiles
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
  (SELECT id FROM auth.users WHERE email = 'search.rescue@volunteer.com'),
  'Search Rescue Volunteer',
  'search.rescue@volunteer.com',
  '+91-9876543222',
  'volunteer',
  true,
  'available',
  ARRAY['search_rescue', 'communication', 'local_knowledge', 'emergency_response'],
  NOW() - INTERVAL '1 day',
  NOW()
),
(
  (SELECT id FROM auth.users WHERE email = 'local.guide@volunteer.com'),
  'Local Guide Volunteer',
  'local.guide@volunteer.com',
  '+91-9876543223',
  'volunteer',
  true,
  'available',
  ARRAY['local_knowledge', 'language', 'navigation', 'tour_guide'],
  NOW() - INTERVAL '1 day',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Step 8: Verify the cleanup
SELECT 'Enum Cleanup Completed!' as message;

-- Show current enum values (should only be 5)
SELECT 'Current enum values:' as info;
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'request_type'::regtype ORDER BY enumlabel;

-- Show request type distribution
SELECT 'Request type distribution:' as info;
SELECT type::text as request_type, COUNT(*) as count 
FROM assistance_requests 
GROUP BY type::text 
ORDER BY type::text;

-- Show total counts
SELECT 
  'Final Summary:' as info,
  (SELECT COUNT(*) FROM assistance_requests WHERE type = 'general') as general_requests,
  (SELECT COUNT(*) FROM assistance_requests WHERE type = 'guidance') as guidance_requests,
  (SELECT COUNT(*) FROM assistance_requests WHERE type = 'lost_person') as lost_person_requests,
  (SELECT COUNT(*) FROM assistance_requests WHERE type = 'medical') as medical_requests,
  (SELECT COUNT(*) FROM assistance_requests WHERE type = 'sanitation') as sanitation_requests;
