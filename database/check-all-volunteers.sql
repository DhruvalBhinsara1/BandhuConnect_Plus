-- Check all volunteer profiles to understand the data structure

-- 1. All volunteer profiles
SELECT 
    'All volunteers:' as info,
    id,
    name,
    role,
    created_at
FROM profiles 
WHERE role = 'volunteer'
ORDER BY name;

-- 2. Check for Dr. Raj Patel specifically
SELECT 
    'Dr. Raj Patel profiles:' as info,
    id,
    name,
    role,
    created_at
FROM profiles 
WHERE name LIKE '%Raj%' OR name LIKE '%Patel%'
ORDER BY name;

-- 3. Check current assignment to see which Priya profile is being used
SELECT 
    'Current assignment details:' as info,
    a.id as assignment_id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    pv.name as volunteer_name,
    pv.id as volunteer_profile_id
FROM assignments a
LEFT JOIN profiles pv ON a.volunteer_id = pv.id
WHERE a.pilgrim_id = '5595c83a-55ef-426e-a10e-28ff9b70ce44'
AND a.status IN ('pending', 'accepted', 'in_progress');
