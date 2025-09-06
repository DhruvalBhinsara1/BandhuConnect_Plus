-- VERIFICATION SCRIPT - Check What Remains After Cleanup
-- Run this to confirm the selective cleanup worked correctly

-- =============================================================================
-- 1. CHECK REMAINING PROFILES
-- =============================================================================
SELECT 'REMAINING PROFILES AFTER CLEANUP:' as section;

SELECT 
    email,
    name,
    role,
    volunteer_status,
    is_active,
    created_at,
    CASE 
        WHEN email LIKE '%dhruvalbhinsara%' THEN '🔵 Your Personal Account'
        WHEN email LIKE '%@demo.com' THEN '🟢 Demo Account'
        ELSE '⚠️ Other Account'
    END as account_type
FROM profiles 
ORDER BY 
    CASE 
        WHEN email LIKE '%dhruvalbhinsara%' THEN 1 
        WHEN email LIKE '%@demo.com' THEN 2 
        ELSE 3 
    END,
    role,
    email;

-- =============================================================================
-- 2. COUNT SUMMARY
-- =============================================================================
SELECT 'COUNT SUMMARY:' as section;

SELECT 
    'Total Profiles' as category,
    COUNT(*) as count,
    'Should be around 12-15 (2 personal + 10-13 demo)' as expected
FROM profiles

UNION ALL

SELECT 
    'Your Personal Accounts' as category,
    COUNT(*) as count,
    'Should be exactly 2' as expected
FROM profiles 
WHERE email IN ('dhruvalbhinsara460@gmail.com', 'dhruvalbhinsara000@gmail.com')

UNION ALL

SELECT 
    'Demo Accounts (@demo.com)' as category,
    COUNT(*) as count,
    'Should be 10-13 demo accounts' as expected
FROM profiles 
WHERE email LIKE '%@demo.com'

UNION ALL

SELECT 
    'Other Accounts (should be 0)' as category,
    COUNT(*) as count,
    'Should be 0 after cleanup' as expected
FROM profiles 
WHERE email NOT IN ('dhruvalbhinsara460@gmail.com', 'dhruvalbhinsara000@gmail.com')
  AND email NOT LIKE '%@demo.com'

UNION ALL

SELECT 
    'User Locations' as category,
    COUNT(*) as count,
    'Should match number of active users' as expected
FROM user_locations

UNION ALL

SELECT 
    'Assistance Requests' as category,
    COUNT(*) as count,
    'Should be from preserved accounts only' as expected
FROM assistance_requests

UNION ALL

SELECT 
    'Assignments' as category,
    COUNT(*) as count,
    'Should be related to preserved accounts only' as expected
FROM assignments;

-- =============================================================================
-- 3. CHECK FOR ORPHANED DATA (Should be empty)
-- =============================================================================
SELECT 'CHECKING FOR ORPHANED DATA (should be empty):' as section;

-- Check for user_locations without valid profiles
SELECT 
    'Orphaned User Locations' as check_type,
    COUNT(*) as count,
    'Should be 0' as expected
FROM user_locations ul
LEFT JOIN profiles p ON ul.user_id = p.id
WHERE p.id IS NULL;

-- Check for assistance_requests without valid profiles
SELECT 
    'Orphaned Assistance Requests' as check_type,
    COUNT(*) as count,
    'Should be 0' as expected
FROM assistance_requests ar
LEFT JOIN profiles p ON ar.user_id = p.id
WHERE p.id IS NULL;

-- Check for assignments with invalid references
SELECT 
    'Orphaned Assignments (bad request_id)' as check_type,
    COUNT(*) as count,
    'Should be 0' as expected
FROM assignments a
LEFT JOIN assistance_requests ar ON a.request_id = ar.id
WHERE ar.id IS NULL;

SELECT 
    'Orphaned Assignments (bad volunteer_id)' as check_type,
    COUNT(*) as count,
    'Should be 0' as expected
FROM assignments a
LEFT JOIN profiles p ON a.volunteer_id = p.id
WHERE p.id IS NULL;

-- =============================================================================
-- 4. SHOW RECENT ACTIVITY FROM PRESERVED ACCOUNTS
-- =============================================================================
SELECT 'RECENT ACTIVITY FROM PRESERVED ACCOUNTS:' as section;

SELECT 
    ar.title,
    ar.type,
    ar.status,
    ar.priority,
    p.name as requester,
    p.email,
    p.role as requester_role,
    ar.created_at,
    CASE 
        WHEN p.email LIKE '%dhruvalbhinsara%' THEN '🔵 Your Account'
        WHEN p.email LIKE '%@demo.com' THEN '🟢 Demo Account'
        ELSE '⚠️ Other'
    END as account_type
FROM assistance_requests ar
JOIN profiles p ON ar.user_id = p.id
ORDER BY ar.created_at DESC
LIMIT 15;

-- =============================================================================
-- 5. SHOW USER LOCATIONS FROM PRESERVED ACCOUNTS
-- =============================================================================
SELECT 'USER LOCATIONS FROM PRESERVED ACCOUNTS:' as section;

SELECT 
    p.name,
    p.email,
    p.role,
    ul.latitude,
    ul.longitude,
    ul.accuracy,
    ul.last_updated,
    CASE 
        WHEN p.email LIKE '%dhruvalbhinsara%' THEN '🔵 Your Account'
        WHEN p.email LIKE '%@demo.com' THEN '🟢 Demo Account'
        ELSE '⚠️ Other'
    END as account_type
FROM user_locations ul
JOIN profiles p ON ul.user_id = p.id
ORDER BY 
    CASE 
        WHEN p.email LIKE '%dhruvalbhinsara%' THEN 1 
        WHEN p.email LIKE '%@demo.com' THEN 2 
        ELSE 3 
    END,
    ul.last_updated DESC;

-- =============================================================================
-- 6. FINAL VERIFICATION SUMMARY
-- =============================================================================
SELECT 'VERIFICATION SUMMARY:' as section;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM profiles WHERE email NOT IN ('dhruvalbhinsara460@gmail.com', 'dhruvalbhinsara000@gmail.com') AND email NOT LIKE '%@demo.com') = 0
        THEN '✅ SUCCESS: No unwanted accounts remain'
        ELSE '❌ ISSUE: Some unwanted accounts still exist'
    END as cleanup_status,
    
    CASE 
        WHEN (SELECT COUNT(*) FROM profiles WHERE email IN ('dhruvalbhinsara460@gmail.com', 'dhruvalbhinsara000@gmail.com')) = 2
        THEN '✅ SUCCESS: Both your personal accounts preserved'
        ELSE '❌ ISSUE: Your personal accounts missing'
    END as personal_accounts_status,
    
    CASE 
        WHEN (SELECT COUNT(*) FROM profiles WHERE email LIKE '%@demo.com') >= 5
        THEN '✅ SUCCESS: Demo accounts preserved'
        ELSE '❌ ISSUE: Demo accounts missing'
    END as demo_accounts_status,
    
    CASE 
        WHEN (SELECT COUNT(*) FROM user_locations ul LEFT JOIN profiles p ON ul.user_id = p.id WHERE p.id IS NULL) = 0
        THEN '✅ SUCCESS: No orphaned user locations'
        ELSE '❌ ISSUE: Orphaned user locations found'
    END as data_integrity_status;

SELECT 'Verification complete! Check the results above.' as final_message;
