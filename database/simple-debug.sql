-- Simple debug to check if skills were actually updated
SELECT name, skills FROM profiles WHERE role = 'volunteer' AND email = 'priya.volunteer@demo.com';

-- Check what request types we have
SELECT DISTINCT type FROM assistance_requests WHERE status = 'pending' LIMIT 10;

-- Test if any volunteers have matching skills for common request types
SELECT 
    'medical requests' as request_type,
    COUNT(*) as volunteers_with_matching_skills
FROM profiles 
WHERE role = 'volunteer' 
    AND is_active = true 
    AND volunteer_status = 'available'
    AND 'medical' = ANY(skills);

SELECT 
    'guidance requests' as request_type,
    COUNT(*) as volunteers_with_matching_skills
FROM profiles 
WHERE role = 'volunteer' 
    AND is_active = true 
    AND volunteer_status = 'available'
    AND 'guidance' = ANY(skills);
