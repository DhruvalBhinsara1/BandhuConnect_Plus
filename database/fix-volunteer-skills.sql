-- Fix volunteer skills to match the required skills for guidance and lost_person requests
-- This will update existing volunteers to have the necessary skills

-- First, let's see what skills volunteers currently have
SELECT 'Before Update - Current Skills' as status, name, skills 
FROM profiles 
WHERE role = 'volunteer' AND is_active = true;

-- Update volunteers to have skills that match our simplified enum requirements
-- Add guidance-related skills to some volunteers
UPDATE profiles 
SET skills = CASE 
    WHEN name ILIKE '%guide%' OR name ILIKE '%local%' THEN 
        ARRAY['local_knowledge', 'tour_guide', 'navigation', 'language', 'general', 'assistance']
    WHEN name ILIKE '%rescue%' OR name ILIKE '%search%' OR name ILIKE '%security%' THEN 
        ARRAY['search_rescue', 'crowd_management', 'communication', 'local_knowledge', 'general']
    WHEN name ILIKE '%medical%' OR name ILIKE '%health%' OR name ILIKE '%doctor%' OR name ILIKE '%nurse%' THEN 
        ARRAY['medical', 'first_aid', 'healthcare', 'emergency', 'general']
    WHEN name ILIKE '%clean%' OR name ILIKE '%sanit%' OR name ILIKE '%maintenance%' THEN 
        ARRAY['cleaning', 'sanitation', 'maintenance', 'hygiene', 'general']
    ELSE 
        -- For generic volunteers, give them a mix of useful skills
        CASE (hashtext(id::text) % 4)
            WHEN 0 THEN ARRAY['local_knowledge', 'tour_guide', 'language', 'general', 'assistance']
            WHEN 1 THEN ARRAY['search_rescue', 'communication', 'local_knowledge', 'general', 'assistance']
            WHEN 2 THEN ARRAY['first_aid', 'emergency', 'communication', 'general', 'assistance']
            ELSE ARRAY['general', 'assistance', 'support', 'communication']
        END
END
WHERE role = 'volunteer' AND is_active = true;

-- Ensure we have volunteers with specific skills for guidance requests
-- Update at least 3 volunteers to have guidance skills
WITH guidance_volunteers AS (
    SELECT id FROM profiles 
    WHERE role = 'volunteer' AND is_active = true 
    ORDER BY RANDOM() 
    LIMIT 3
)
UPDATE profiles 
SET skills = ARRAY['local_knowledge', 'tour_guide', 'navigation', 'language', 'general', 'assistance']
WHERE id IN (SELECT id FROM guidance_volunteers);

-- Ensure we have volunteers with specific skills for lost_person requests
-- Update at least 2 volunteers to have search/rescue skills
WITH rescue_volunteers AS (
    SELECT id FROM profiles 
    WHERE role = 'volunteer' AND is_active = true 
    AND NOT (skills && ARRAY['local_knowledge', 'tour_guide'])  -- Don't overlap with guidance volunteers
    ORDER BY RANDOM() 
    LIMIT 2
)
UPDATE profiles 
SET skills = ARRAY['search_rescue', 'crowd_management', 'communication', 'local_knowledge', 'general']
WHERE id IN (SELECT id FROM rescue_volunteers);

-- Fix volunteer skills to use valid enum values
-- Replace 'tech' with 'guidance' for Priya Sharma

UPDATE profiles 
SET skills = ARRAY['guidance', 'crowd_management']
WHERE email = 'priya.volunteer@demo.com';

-- Also ensure all volunteers are available for testing
UPDATE profiles 
SET volunteer_status = 'available', is_active = true
WHERE role = 'volunteer' AND email IN ('raj.volunteer@demo.com', 'priya.volunteer@demo.com');

-- Verify the updates
SELECT 'After Update - New Skills' as status, name, volunteer_status, skills 
FROM profiles 
WHERE role = 'volunteer' AND is_active = true
ORDER BY volunteer_status, name;

-- Verify the fix
SELECT name, email, skills, volunteer_status, is_active
FROM profiles 
WHERE role = 'volunteer' 
ORDER BY name;

-- Test skill matching for our problem requests
SELECT 
    'Skill Match Test' as test_type,
    'guidance' as request_type,
    COUNT(*) as volunteers_with_matching_skills
FROM profiles p
WHERE p.role = 'volunteer' 
    AND p.is_active = true 
    AND p.volunteer_status IN ('available', 'busy')
    AND p.skills && ARRAY['local_knowledge', 'tour_guide', 'navigation', 'language'];

SELECT 
    'Skill Match Test' as test_type,
    'lost_person' as request_type,
    COUNT(*) as volunteers_with_matching_skills
FROM profiles p
WHERE p.role = 'volunteer' 
    AND p.is_active = true 
    AND p.volunteer_status IN ('available', 'busy')
    AND p.skills && ARRAY['search_rescue', 'crowd_management', 'communication', 'local_knowledge'];
