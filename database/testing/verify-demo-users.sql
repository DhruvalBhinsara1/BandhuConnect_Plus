-- Verify demo users exist and have proper data
-- Run this in Supabase SQL Editor to check demo user setup

-- 1. Check if demo profiles exist
SELECT 'Profiles Check' as check_type, 
       email, name, phone, role, volunteer_status, created_at
FROM profiles 
WHERE email IN ('raj.volunteer@demo.com', 'dhruval.pilgrim@demo.com', 'admin@demo.com')
ORDER BY email;

-- 2. Check if demo users exist in auth.users
SELECT 'Auth Users Check' as check_type,
       email, created_at, email_confirmed_at
FROM auth.users 
WHERE email IN ('raj.volunteer@demo.com', 'dhruval.pilgrim@demo.com', 'admin@demo.com')
ORDER BY email;

-- 3. Check assistance requests
SELECT 'Assistance Requests' as check_type,
       id, title, type, priority, status, created_at,
       (SELECT name FROM profiles WHERE id = user_id) as pilgrim_name
FROM assistance_requests
ORDER BY created_at DESC;

-- 4. Check assignments
SELECT 'Assignments' as check_type,
       a.id, a.status, a.assigned_at,
       ar.title as request_title,
       pv.name as volunteer_name,
       pp.name as pilgrim_name
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
JOIN profiles pv ON a.volunteer_id = pv.id
JOIN profiles pp ON ar.user_id = pp.id
ORDER BY a.assigned_at DESC;

-- 5. Check user locations
SELECT 'User Locations' as check_type,
       ul.user_id, p.name, p.role, ul.latitude, ul.longitude, 
       ul.is_active, ul.last_updated
FROM user_locations ul
JOIN profiles p ON ul.user_id = p.id
ORDER BY ul.last_updated DESC;
