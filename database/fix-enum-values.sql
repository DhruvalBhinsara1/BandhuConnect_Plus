-- Fix enum values and migrate demo data for Simplified MVP
-- Keep only: general, guidance, lost_person, medical, sanitation

-- Check current enum values
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'request_type'::regtype ORDER BY enumlabel;

-- Update existing data to use simplified enum values
DO $$ 
BEGIN
    -- Map all existing data to simplified enum values
    UPDATE assistance_requests 
    SET type = CASE 
        WHEN type::text IN ('crowd_management', 'transportation', 'tech') THEN 'general'::request_type
        WHEN type::text = 'emergency' THEN 'medical'::request_type
        ELSE type
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
    
    -- Add simplified MVP enum values safely
    BEGIN
        ALTER TYPE request_type ADD VALUE IF NOT EXISTS 'general';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE request_type ADD VALUE IF NOT EXISTS 'guidance';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE request_type ADD VALUE IF NOT EXISTS 'lost_person';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE request_type ADD VALUE IF NOT EXISTS 'medical';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE request_type ADD VALUE IF NOT EXISTS 'sanitation';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Add some lost_person and guidance demo requests since we don't have any
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
  'guidance',
  'Foreign pilgrims need directions to accommodation',
  'Group of 8 foreign pilgrims need help finding their pre-booked accommodation. They have booking confirmation but are lost and language barrier is making it difficult.',
  'medium',
  'pending',
  ST_GeogFromText('POINT(70.1288 21.3059)'),
  NOW() - INTERVAL '20 minutes',
  NOW() - INTERVAL '20 minutes'
);

-- Verify the enum values are correct
SELECT 'Current request_type enum values:' as info;
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'request_type'::regtype ORDER BY enumlabel;
