-- Check if volunteers exist in database
SELECT 
    'Volunteer count:' as info,
    COUNT(*) as count
FROM profiles 
WHERE role = 'volunteer';

-- Show all volunteers with their IDs and status
SELECT 
    id,
    name,
    email,
    volunteer_status,
    is_active,
    created_at
FROM profiles 
WHERE role = 'volunteer'
ORDER BY created_at DESC;

-- Check auth.users table for volunteer emails
SELECT 
    'Auth users with volunteer emails:' as info,
    COUNT(*) as count
FROM auth.users 
WHERE email IN (
    'raj.volunteer@demo.com',
    'priya.volunteer@demo.com', 
    'amit.volunteer@demo.com',
    'sneha.volunteer@demo.com'
);

-- Show auth.users IDs for volunteer emails
SELECT 
    id,
    email,
    created_at
FROM auth.users 
WHERE email IN (
    'raj.volunteer@demo.com',
    'priya.volunteer@demo.com', 
    'amit.volunteer@demo.com',
    'sneha.volunteer@demo.com'
)
ORDER BY created_at DESC;
