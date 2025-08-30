-- Single query to fix volunteer skills and enable auto-assignment
-- Run this in Supabase SQL Editor

UPDATE profiles 
SET 
    skills = CASE email
        WHEN 'priya.volunteer@demo.com' THEN ARRAY['guidance', 'crowd_management']
        WHEN 'raj.volunteer@demo.com' THEN ARRAY['medical', 'general']
        WHEN 'amit.volunteer@demo.com' THEN ARRAY['sanitation', 'general']
        WHEN 'sneha.volunteer@demo.com' THEN ARRAY['lost_person', 'general']
        ELSE skills
    END,
    volunteer_status = 'available',
    is_active = true
WHERE role = 'volunteer' AND email IN (
    'raj.volunteer@demo.com', 
    'priya.volunteer@demo.com', 
    'amit.volunteer@demo.com', 
    'sneha.volunteer@demo.com'
);

-- Verify the fix
SELECT name, email, skills, volunteer_status, is_active
FROM profiles 
WHERE role = 'volunteer' 
ORDER BY name;
