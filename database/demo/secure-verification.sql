-- =============================================================================
-- BandhuConnect+ Professional Database Verification (Secure)
-- Version: 2.1.0 - Updated September 6, 2025
-- Description: Environment-safe database verification without sensitive data
-- =============================================================================

-- This script verifies database integrity without exposing personal information
-- All sensitive data references have been removed or parameterized

-- =============================================================================
-- SYSTEM HEALTH VERIFICATION
-- =============================================================================

-- Overall database health check
SELECT 
    '=== DATABASE HEALTH SUMMARY ===' as section,
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM assistance_requests) as total_requests,
    (SELECT COUNT(*) FROM assignments) as total_assignments,
    (SELECT COUNT(*) FROM user_locations) as active_locations,
    NOW() as verification_time;

-- =============================================================================
-- ACCOUNT TYPE VERIFICATION
-- =============================================================================

-- Verify account distribution by role
SELECT 
    'Account Distribution by Role' as check_type,
    role,
    COUNT(*) as account_count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_accounts
FROM profiles 
GROUP BY role
ORDER BY role;

-- Check demo environment status
SELECT 
    'Demo Environment Status' as check_type,
    COUNT(*) as demo_accounts,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as demo_admins,
    COUNT(CASE WHEN role = 'volunteer' THEN 1 END) as demo_volunteers,
    COUNT(CASE WHEN role = 'pilgrim' THEN 1 END) as demo_pilgrims,
    CASE 
        WHEN COUNT(*) >= 5 THEN '✅ Demo environment properly configured'
        ELSE '⚠️ Demo environment may need setup'
    END as status
FROM profiles 
WHERE email LIKE '%@demo.com';

-- Check for production accounts (non-demo, non-test)
SELECT 
    'Production Accounts Status' as check_type,
    COUNT(*) as production_accounts,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as production_admins,
    CASE 
        WHEN COUNT(CASE WHEN role = 'admin' THEN 1 END) >= 1 THEN '✅ Admin accounts present'
        ELSE '❌ No admin accounts found'
    END as admin_status
FROM profiles 
WHERE email NOT LIKE '%@demo.com'
  AND email NOT LIKE '%@test.%'
  AND email NOT LIKE '%temp%';

-- =============================================================================
-- DATA INTEGRITY VERIFICATION
-- =============================================================================

-- Check for orphaned assistance requests
SELECT 
    'Orphaned Assistance Requests' as check_type,
    COUNT(*) as orphaned_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No orphaned requests found'
        ELSE '❌ Found orphaned requests - database needs cleanup'
    END as status
FROM assistance_requests ar
WHERE NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = ar.user_id
);

-- Check for orphaned assignments (volunteer side)
SELECT 
    'Orphaned Assignments (Volunteers)' as check_type,
    COUNT(*) as orphaned_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No orphaned volunteer assignments'
        ELSE '❌ Found orphaned volunteer assignments'
    END as status
FROM assignments a
WHERE NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = a.volunteer_id
);

-- Check for orphaned assignments (request side)
SELECT 
    'Orphaned Assignments (Requests)' as check_type,
    COUNT(*) as orphaned_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No orphaned request assignments'
        ELSE '❌ Found orphaned request assignments'
    END as status
FROM assignments a
WHERE NOT EXISTS (
    SELECT 1 FROM assistance_requests ar WHERE ar.id = a.request_id
);

-- Check for orphaned user locations
SELECT 
    'Orphaned User Locations' as check_type,
    COUNT(*) as orphaned_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No orphaned user locations'
        ELSE '❌ Found orphaned user locations'
    END as status
FROM user_locations ul
WHERE NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = ul.user_id
);

-- =============================================================================
-- SCHEMA VERIFICATION
-- =============================================================================

-- Verify core tables exist
SELECT 
    'Core Tables Verification' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') AND
             EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assistance_requests') AND
             EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assignments') AND
             EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_locations') AND
             EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications')
        THEN '✅ All core tables present'
        ELSE '❌ Missing core tables'
    END as status;

-- Verify enum types
SELECT 
    'Enum Types Verification' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') AND
             EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_type') AND
             EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') AND
             EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_status') AND
             EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority_level') AND
             EXISTS (SELECT 1 FROM pg_type WHERE typname = 'volunteer_status')
        THEN '✅ All enum types present'
        ELSE '❌ Missing enum types'
    END as status;

-- Verify PostGIS extension
SELECT 
    'PostGIS Extension Verification' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis')
        THEN '✅ PostGIS extension installed'
        ELSE '❌ PostGIS extension missing'
    END as status;

-- =============================================================================
-- BUSINESS LOGIC VERIFICATION
-- =============================================================================

-- Verify assignment consistency
SELECT 
    'Assignment Consistency Check' as check_type,
    COUNT(*) as inconsistent_assignments,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ All assignments are consistent'
        ELSE '❌ Found assignment inconsistencies'
    END as status
FROM assignments a
JOIN assistance_requests ar ON a.request_id = ar.id
WHERE (a.status IN ('accepted', 'in_progress', 'completed') AND ar.status = 'pending')
   OR (a.status = 'completed' AND ar.status != 'completed');

-- Verify location data integrity
SELECT 
    'Location Data Integrity' as check_type,
    COUNT(*) as invalid_locations,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ All location data is valid'
        ELSE '❌ Found invalid location data'
    END as status
FROM user_locations
WHERE latitude NOT BETWEEN -90 AND 90 
   OR longitude NOT BETWEEN -180 AND 180
   OR accuracy < 0;

-- =============================================================================
-- PERFORMANCE VERIFICATION
-- =============================================================================

-- Check database indexes
SELECT 
    'Database Indexes' as check_type,
    COUNT(*) as total_indexes,
    CASE 
        WHEN COUNT(*) >= 10 THEN '✅ Sufficient indexes present'
        ELSE '⚠️ Consider adding more indexes for performance'
    END as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'assistance_requests', 'assignments', 'user_locations');

-- Check Row Level Security
SELECT 
    'Row Level Security Status' as check_type,
    COUNT(*) as tables_with_rls,
    CASE 
        WHEN COUNT(*) >= 4 THEN '✅ RLS properly configured'
        ELSE '⚠️ RLS needs configuration'
    END as status
FROM pg_tables pt
JOIN pg_class pc ON pt.tablename = pc.relname
WHERE pt.schemaname = 'public' 
AND pc.relrowsecurity = true
AND pt.tablename IN ('profiles', 'assistance_requests', 'assignments', 'user_locations');

-- =============================================================================
-- FINAL VERIFICATION SUMMARY
-- =============================================================================

-- Generate comprehensive health report
SELECT 
    '=== FINAL VERIFICATION SUMMARY ===' as section;

WITH health_metrics AS (
    SELECT 
        (SELECT COUNT(*) FROM profiles) as total_users,
        (SELECT COUNT(*) FROM assistance_requests ar WHERE NOT EXISTS (
            SELECT 1 FROM profiles p WHERE p.id = ar.user_id
        )) as orphaned_requests,
        (SELECT COUNT(*) FROM assignments a WHERE NOT EXISTS (
            SELECT 1 FROM profiles p WHERE p.id = a.volunteer_id
        )) as orphaned_assignments,
        (SELECT COUNT(*) FROM user_locations ul WHERE NOT EXISTS (
            SELECT 1 FROM profiles p WHERE p.id = ul.user_id
        )) as orphaned_locations
)
SELECT 
    'Database Health Assessment' as assessment_type,
    CASE 
        WHEN total_users > 0 AND 
             orphaned_requests = 0 AND 
             orphaned_assignments = 0 AND 
             orphaned_locations = 0
        THEN '✅ DATABASE IS HEALTHY AND PRODUCTION READY'
        WHEN total_users > 0 AND 
             (orphaned_requests > 0 OR orphaned_assignments > 0 OR orphaned_locations > 0)
        THEN '⚠️ DATABASE HAS INTEGRITY ISSUES - NEEDS CLEANUP'
        ELSE '❌ DATABASE HAS CRITICAL ISSUES - REQUIRES IMMEDIATE ATTENTION'
    END as overall_status,
    total_users,
    orphaned_requests,
    orphaned_assignments,
    orphaned_locations
FROM health_metrics;

-- =============================================================================
-- RECOMMENDATIONS
-- =============================================================================

-- Provide actionable recommendations
SELECT 
    '=== RECOMMENDATIONS ===' as section;

SELECT 
    'Next Steps' as category,
    CASE 
        WHEN (SELECT COUNT(*) FROM profiles WHERE email LIKE '%@demo.com') < 5 
        THEN 'Consider running demo setup script for comprehensive testing environment'
        ELSE 'Demo environment is properly configured'
    END as demo_recommendation,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM assistance_requests ar 
            WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = ar.user_id)
        )
        THEN 'Run cleanup script to remove orphaned data'
        ELSE 'Database integrity is maintained'
    END as cleanup_recommendation,
    'Database verification completed successfully' as verification_status;

-- =============================================================================
-- END OF VERIFICATION
-- =============================================================================

SELECT 
    '✅ Professional database verification completed!' as status,
    'All checks performed without exposing sensitive information.' as security_note,
    NOW() as completed_at;
