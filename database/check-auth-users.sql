-- Check which users are currently authenticated and their profile data
-- This will help identify why both apps show "Dr. Raj Patel" as "Your location"

-- Check current authenticated user context
SELECT 'Current auth context:' as section;
SELECT auth.uid() as current_user_id;

-- Check all users and their profiles
SELECT 'All users and profiles:' as section;
SELECT 
    u.id as user_id,
    u.name as user_name,
    p.id as profile_id,
    p.name as profile_name,
    p.role as profile_role,
    p.email as profile_email
FROM users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.id IN ('5595c83a-55ef-426e-a10e-28ff9b70ce44', 'a81c0e62-4bec-4552-bca3-b158c6afa790')
ORDER BY u.name;

-- Check user_locations to see who is publishing location data
SELECT 'User locations data:' as section;
SELECT 
    ul.user_id,
    u.name as user_name,
    p.role,
    ul.latitude,
    ul.longitude,
    ul.is_active,
    ul.last_updated
FROM user_locations ul
JOIN users u ON ul.user_id = u.id
JOIN profiles p ON ul.user_id = p.id
WHERE ul.user_id IN ('5595c83a-55ef-426e-a10e-28ff9b70ce44', 'a81c0e62-4bec-4552-bca3-b158c6afa790')
AND ul.is_active = true
ORDER BY ul.last_updated DESC;
