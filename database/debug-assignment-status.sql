-- Debug Assignment Status Inconsistency
-- Check current assignment and request statuses

-- 1. Check current assignments
SELECT 
    'Current Assignments' as section,
    a.id as assignment_id,
    a.status as assignment_status,
    a.assigned,
    a.assigned_at,
    a.accepted_at,
    a.started_at,
    a.completed_at,
    ar.status as request_status,
    ar.title as request_title,
    p_vol.name as volunteer_name,
    p_vol.volunteer_status,
    u_pil.name as pilgrim_name
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
LEFT JOIN profiles p_vol ON a.volunteer_id = p_vol.id
LEFT JOIN users u_pil ON ar.user_id = u_pil.id
ORDER BY a.assigned_at DESC
LIMIT 5;

-- 2. Check volunteer profiles and their status
SELECT 
    'Volunteer Status' as section,
    p.name,
    p.email,
    p.volunteer_status,
    p.is_active,
    (SELECT COUNT(*) FROM assignments a WHERE a.volunteer_id = p.id AND a.status IN ('pending', 'accepted', 'in_progress') AND a.assigned = true) as active_assignments_count
FROM profiles p 
WHERE p.role = 'volunteer'
ORDER BY p.name;

-- 3. Check specific assignment for our test users
SELECT 
    'Test Users Assignment' as section,
    a.id as assignment_id,
    a.status as assignment_status,
    a.assigned,
    ar.status as request_status,
    ar.title,
    p_vol.name as volunteer_name,
    u_pil.name as pilgrim_name,
    a.assigned_at,
    a.accepted_at
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
LEFT JOIN profiles p_vol ON a.volunteer_id = p_vol.id
LEFT JOIN users u_pil ON ar.user_id = u_pil.id
WHERE p_vol.email = 'raj.volunteer@demo.com' 
   OR u_pil.email = 'dhruvalbhinsara000@gmail.com'
ORDER BY a.assigned_at DESC;
