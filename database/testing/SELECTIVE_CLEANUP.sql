-- SELECTIVE CLEANUP SCRIPT - Keep Important Accounts Only
-- This script removes unnecessary data while preserving:
-- 1. Your personal accounts (dhruvalbhinsara460@gmail.com, dhruvalbhinsara000@gmail.com)
-- 2. The demo accounts we just created (@demo.com emails)
-- 3. All related data for these preserved accounts

-- =============================================================================
-- ANALYSIS: WHAT WILL BE PRESERVED
-- =============================================================================
-- ✅ Keep: dhruvalbhinsara460@gmail.com (your admin account)
-- ✅ Keep: dhruvalbhinsara000@gmail.com (your pilgrim account)  
-- ✅ Keep: All @demo.com accounts (dr.rajesh.medical, priya.guide, etc.)
-- ✅ Keep: All assistance_requests from preserved accounts
-- ✅ Keep: All user_locations from preserved accounts
-- ✅ Keep: All assignments related to preserved accounts
-- ❌ Remove: Any other test accounts and their data

-- =============================================================================
-- STEP 1: IDENTIFY ACCOUNTS TO PRESERVE
-- =============================================================================

-- Show what we're keeping before cleanup
SELECT 'ACCOUNTS THAT WILL BE PRESERVED:' as info;

SELECT 
    id,
    name,
    email,
    role,
    created_at
FROM profiles 
WHERE email IN ('dhruvalbhinsara460@gmail.com', 'dhruvalbhinsara000@gmail.com')
   OR email LIKE '%@demo.com'
ORDER BY role, email;

-- =============================================================================
-- STEP 2: SAFE CLEANUP - REMOVE UNWANTED DATA
-- =============================================================================

-- Step 2a: Clean up user_locations for accounts we're removing
DELETE FROM user_locations 
WHERE user_id NOT IN (
    SELECT id FROM profiles 
    WHERE email IN ('dhruvalbhinsara460@gmail.com', 'dhruvalbhinsara000@gmail.com')
       OR email LIKE '%@demo.com'
);

-- Step 2b: Clean up assignments related to requests we're removing
DELETE FROM assignments 
WHERE request_id IN (
    SELECT ar.id 
    FROM assistance_requests ar
    WHERE ar.user_id NOT IN (
        SELECT id FROM profiles 
        WHERE email IN ('dhruvalbhinsara460@gmail.com', 'dhruvalbhinsara000@gmail.com')
           OR email LIKE '%@demo.com'
    )
)
OR volunteer_id NOT IN (
    SELECT id FROM profiles 
    WHERE email IN ('dhruvalbhinsara460@gmail.com', 'dhruvalbhinsara000@gmail.com')
       OR email LIKE '%@demo.com'
);

-- Step 2c: Clean up assistance_requests from accounts we're removing
DELETE FROM assistance_requests 
WHERE user_id NOT IN (
    SELECT id FROM profiles 
    WHERE email IN ('dhruvalbhinsara460@gmail.com', 'dhruvalbhinsara000@gmail.com')
       OR email LIKE '%@demo.com'
);

-- Step 2d: Clean up other related tables (if they exist and have data to remove)
-- Direct messages cleanup
DELETE FROM direct_messages 
WHERE sender_id NOT IN (
    SELECT id FROM profiles 
    WHERE email IN ('dhruvalbhinsara460@gmail.com', 'dhruvalbhinsara000@gmail.com')
       OR email LIKE '%@demo.com'
)
OR receiver_id NOT IN (
    SELECT id FROM profiles 
    WHERE email IN ('dhruvalbhinsara460@gmail.com', 'dhruvalbhinsara000@gmail.com')
       OR email LIKE '%@demo.com'
);

-- Chat messages cleanup (if channels exist)
DELETE FROM chat_messages 
WHERE sender_id NOT IN (
    SELECT id FROM profiles 
    WHERE email IN ('dhruvalbhinsara460@gmail.com', 'dhruvalbhinsara000@gmail.com')
       OR email LIKE '%@demo.com'
);

-- Notifications cleanup
DELETE FROM notifications 
WHERE user_id NOT IN (
    SELECT id FROM profiles 
    WHERE email IN ('dhruvalbhinsara460@gmail.com', 'dhruvalbhinsara000@gmail.com')
       OR email LIKE '%@demo.com'
);

-- Location updates cleanup
DELETE FROM location_updates 
WHERE user_id NOT IN (
    SELECT id FROM profiles 
    WHERE email IN ('dhruvalbhinsara460@gmail.com', 'dhruvalbhinsara000@gmail.com')
       OR email LIKE '%@demo.com'
);

-- Step 2e: Clean up profiles (this will also clean auth.users due to foreign key)
-- Note: We cannot directly delete from auth.users, but removing profiles will handle the relationship
DELETE FROM profiles 
WHERE email NOT IN ('dhruvalbhinsara460@gmail.com', 'dhruvalbhinsara000@gmail.com')
  AND email NOT LIKE '%@demo.com';

-- =============================================================================
-- STEP 3: VERIFICATION AND FINAL REPORT
-- =============================================================================

-- Show what remains after cleanup
SELECT 'CLEANUP COMPLETED SUCCESSFULLY!' as status;

SELECT 'REMAINING ACCOUNTS SUMMARY:' as info;

SELECT 
    'Total Profiles Remaining' as category,
    COUNT(*) as count
FROM profiles

UNION ALL

SELECT 
    'Your Personal Accounts' as category,
    COUNT(*) as count
FROM profiles 
WHERE email IN ('dhruvalbhinsara460@gmail.com', 'dhruvalbhinsara000@gmail.com')

UNION ALL

SELECT 
    'Demo Accounts (@demo.com)' as category,
    COUNT(*) as count
FROM profiles 
WHERE email LIKE '%@demo.com'

UNION ALL

SELECT 
    'User Locations Remaining' as category,
    COUNT(*) as count
FROM user_locations

UNION ALL

SELECT 
    'Assistance Requests Remaining' as category,
    COUNT(*) as count
FROM assistance_requests

UNION ALL

SELECT 
    'Assignments Remaining' as category,
    COUNT(*) as count
FROM assignments;

-- Show detailed breakdown of remaining accounts
SELECT 'DETAILED ACCOUNT BREAKDOWN:' as info;

SELECT 
    email,
    name,
    role,
    volunteer_status,
    is_active,
    created_at
FROM profiles 
ORDER BY 
    CASE 
        WHEN email LIKE '%dhruvalbhinsara%' THEN 1 
        WHEN email LIKE '%@demo.com' THEN 2 
        ELSE 3 
    END,
    role,
    email;

-- Show recent activity summary
SELECT 'RECENT ACTIVITY SUMMARY:' as info;

SELECT 
    ar.title,
    ar.type,
    ar.status,
    ar.priority,
    p.name as requester,
    p.role as requester_role,
    ar.created_at
FROM assistance_requests ar
JOIN profiles p ON ar.user_id = p.id
ORDER BY ar.created_at DESC
LIMIT 10;

SELECT 'Database cleanup completed - only essential accounts remain!' as final_message;
