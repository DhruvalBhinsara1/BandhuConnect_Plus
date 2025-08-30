-- Quick fix for volunteer skills to match valid enum values
UPDATE profiles 
SET skills = ARRAY['guidance', 'crowd_management']
WHERE email = 'priya.volunteer@demo.com';

-- Make sure we have volunteers available for all request types
UPDATE profiles 
SET volunteer_status = 'available', is_active = true
WHERE role = 'volunteer' AND email IN ('raj.volunteer@demo.com', 'priya.volunteer@demo.com', 'amit.volunteer@demo.com', 'sneha.volunteer@demo.com');

-- Verify the fix
SELECT name, email, skills, volunteer_status, is_active
FROM profiles 
WHERE role = 'volunteer' 
ORDER BY name;
