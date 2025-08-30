-- Check current volunteer skills to identify issues
SELECT 
    name, 
    email, 
    skills, 
    volunteer_status,
    is_active
FROM profiles 
WHERE role = 'volunteer' 
ORDER BY name;
