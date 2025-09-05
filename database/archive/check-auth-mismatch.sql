-- Check if there's an authentication mismatch causing the volunteer app issue

-- 1. Current assignment details
SELECT 
    'Assignment details:' as info,
    a.id,
    a.volunteer_id,
    a.pilgrim_id,
    a.status,
    a.assigned
FROM assignments a
WHERE a.status IN ('pending', 'accepted', 'in_progress');

-- 2. Check if Dr. Raj's volunteer_id in assignment matches his auth user ID
SELECT 
    'Dr. Raj ID comparison:' as info,
    u.id as user_id,
    u.name as user_name,
    p.id as profile_id,
    p.name as profile_name,
    CASE 
        WHEN u.id = p.id THEN 'IDs match'
        ELSE 'IDs DO NOT match - this is the problem!'
    END as id_status
FROM users u
LEFT JOIN profiles p ON u.name = p.name
WHERE u.name LIKE '%Raj%';

-- 3. Check what the volunteer app would query for Dr. Raj
-- If he logs in with user ID a81c0e62-4bec-4552-bca3-b158c6afa790
-- but assignment uses a different volunteer_id, it won't show
SELECT 
    'Volunteer app query simulation:' as info,
    a.id,
    a.volunteer_id,
    a.status,
    CASE 
        WHEN a.volunteer_id = 'a81c0e62-4bec-4552-bca3-b158c6afa790' THEN 'Would show in app'
        ELSE 'Would NOT show in app - ID mismatch'
    END as visibility
FROM assignments a
WHERE a.status IN ('pending', 'accepted', 'in_progress');
