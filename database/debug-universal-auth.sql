-- Universal Authentication Debug Script
-- This script helps identify authentication and user identification issues for ANY user
-- Run this to see what user is currently authenticated and their profile data

-- 1. Check current authenticated user
SELECT 
    'Current Auth User' as debug_section,
    auth.uid() as authenticated_user_id,
    auth.email() as authenticated_email;

-- 2. Check if authenticated user exists in profiles table
SELECT 
    'Profile Lookup' as debug_section,
    p.id,
    p.name,
    p.role,
    p.email,
    p.created_at
FROM profiles p 
WHERE p.id = auth.uid();

-- 3. Check if authenticated user exists in users table (for pilgrims)
SELECT 
    'Users Table Lookup' as debug_section,
    u.id,
    u.name,
    u.phone,
    u.created_at
FROM users u 
WHERE u.id = auth.uid();

-- 4. Check current user's location data
SELECT 
    'Current User Location' as debug_section,
    ul.user_id,
    ul.latitude,
    ul.longitude,
    ul.last_updated,
    EXTRACT(EPOCH FROM (NOW() - ul.last_updated))/60 as minutes_ago
FROM user_locations ul 
WHERE ul.user_id = auth.uid()
ORDER BY ul.last_updated DESC
LIMIT 1;

-- 5. Check current user's assignments (if any)
SELECT 
    'Current User Assignments' as debug_section,
    a.id as assignment_id,
    a.pilgrim_id,
    a.volunteer_id,
    a.status,
    a.assigned,
    a.assigned_at,
    CASE 
        WHEN a.pilgrim_id = auth.uid() THEN 'I am the pilgrim'
        WHEN a.volunteer_id = auth.uid() THEN 'I am the volunteer'
        ELSE 'Not my assignment'
    END as my_role_in_assignment
FROM assignments a 
WHERE a.pilgrim_id = auth.uid() OR a.volunteer_id = auth.uid()
ORDER BY a.assigned_at DESC;

-- 6. Test get_my_assignment function for current user
SELECT 
    'get_my_assignment Result' as debug_section,
    gma.*
FROM get_my_assignment() gma;

-- 7. Check all active location publishers (to see who's publishing)
SELECT 
    'All Active Publishers' as debug_section,
    ul.user_id,
    COALESCE(p.name, u.name, 'Unknown') as user_name,
    COALESCE(p.role, 'pilgrim') as user_role,
    ul.latitude,
    ul.longitude,
    ul.last_updated,
    EXTRACT(EPOCH FROM (NOW() - ul.last_updated))/60 as minutes_ago
FROM user_locations ul
LEFT JOIN profiles p ON ul.user_id = p.id
LEFT JOIN users u ON ul.user_id = u.id
WHERE ul.last_updated > NOW() - INTERVAL '1 hour'
ORDER BY ul.last_updated DESC;
