-- Find Dr. Raj Patel's correct profile ID

-- Check all profiles that might be Dr. Raj Patel
SELECT 
    'Potential Raj Patel profiles:' as info,
    id,
    name,
    role,
    created_at
FROM profiles 
WHERE (name ILIKE '%raj%' OR name ILIKE '%patel%') 
AND role = 'volunteer'
ORDER BY name;

-- Also check users table in case he's there
SELECT 
    'Raj Patel in users table:' as info,
    id,
    name,
    created_at
FROM users 
WHERE name ILIKE '%raj%' OR name ILIKE '%patel%'
ORDER BY name;
