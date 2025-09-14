-- ================================================
-- 🏥 DATABASE HEALTH CHECK SCRIPT
-- ================================================
-- Purpose: Comprehensive database verification and health monitoring
-- Version: 2.0.0
-- Last Updated: September 6, 2025
-- Environment: Safe for all environments
-- ================================================

-- ================================================
-- 📋 SCHEMA VERIFICATION
-- ================================================

-- Check if all required tables exist
SELECT 
    'Table Existence Check' as check_type,
    CASE 
        WHEN COUNT(*) >= 8 THEN '✅ Core tables exist'
        ELSE '❌ Missing core tables'
    END as status,
    COUNT(*) as existing_tables,
    8 as expected_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'assistance_requests', 'assignments', 'notifications', 'user_locations', 'user_devices', 'locations', 'location_updates');

-- Check foreign key constraints
SELECT 
    'Foreign Key Check' as check_type,
    CASE 
        WHEN COUNT(*) >= 6 THEN '✅ Foreign keys configured'
        ELSE '⚠️ Check foreign key setup'
    END as status,
    COUNT(*) as constraint_count
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
AND table_schema = 'public';

-- ================================================
-- 📊 DATA INTEGRITY CHECKS
-- ================================================

-- Check for orphaned assignments
SELECT 
    'Orphaned Assignments' as check_type,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No orphaned assignments'
        ELSE '⚠️ Found orphaned assignments'
    END as status,
    COUNT(*) as orphaned_count
FROM assignments a
LEFT JOIN assistance_requests r ON a.request_id = r.id
WHERE r.id IS NULL;

-- Check for invalid user roles
SELECT 
    'Invalid Roles' as check_type,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ All roles valid'
        ELSE '❌ Invalid roles found'
    END as status,
    COUNT(*) as invalid_count
FROM profiles 
WHERE role NOT IN ('admin', 'volunteer', 'pilgrim');

-- Check for profiles without auth users
SELECT 
    'Auth Integration' as check_type,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ All profiles have auth'
        ELSE '⚠️ Profiles missing auth'
    END as status,
    COUNT(*) as missing_auth_count
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- ================================================
-- 📈 PERFORMANCE METRICS
-- ================================================

-- Check database sizes
SELECT 
    'Database Size' as metric,
    pg_size_pretty(pg_database_size(current_database())) as value,
    'Total database size' as description;

-- Check table sizes
SELECT 
    'Table: ' || schemaname || '.' || tablename as metric,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as value,
    'Table size including indexes' as description
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ================================================
-- 🔐 SECURITY CHECKS
-- ================================================

-- Check RLS policies
SELECT 
    'RLS Policies' as check_type,
    CASE 
        WHEN COUNT(*) >= 20 THEN '✅ RLS policies active'
        ELSE '⚠️ Check RLS configuration'
    END as status,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public';

-- Check for admin users
SELECT 
    'Admin Users' as check_type,
    CASE 
        WHEN COUNT(*) >= 1 THEN '✅ Admin users exist'
        ELSE '❌ No admin users found'
    END as status,
    COUNT(*) as admin_count
FROM profiles 
WHERE role = 'admin';

-- ================================================
-- 📊 SUMMARY STATISTICS
-- ================================================

SELECT 
    'Record Counts' as section,
    'profiles' as table_name,
    COUNT(*) as count,
    'Total user profiles' as description
FROM profiles
UNION ALL
SELECT 
    'Record Counts',
    'assistance_requests',
    COUNT(*),
    'Total service requests'
FROM assistance_requests
UNION ALL
SELECT 
    'Record Counts',
    'assignments',
    COUNT(*),
    'Total volunteer assignments'
FROM assignments
UNION ALL
SELECT 
    'Record Counts',
    'notifications',
    COUNT(*),
    'Total notifications sent'
FROM notifications
UNION ALL
SELECT 
    'Record Counts',
    'user_devices',
    COUNT(*),
    'Total device registrations'
FROM user_devices
UNION ALL
SELECT 
    'Record Counts',
    'locations',
    COUNT(*),
    'Total location records'
FROM locations
UNION ALL
SELECT 
    'Record Counts',
    'location_updates',
    COUNT(*),
    'Total location updates'
FROM location_updates
ORDER BY table_name;
