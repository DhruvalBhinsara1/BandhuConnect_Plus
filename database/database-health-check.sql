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
select 'Table Existence Check' as check_type,
       case
          when count(*) = 5 then
             '✅ All tables exist'
          else
             '❌ Missing tables'
       end as status,
       count(*) as existing_tables,
       5 as expected_tables
  from information_schema.tables
 where table_schema = 'public'
   and table_name in ( 'profiles',
                       'requests',
                       'assignments',
                       'notifications',
                       'feedback' );

-- Check foreign key constraints
select 'Foreign Key Check' as check_type,
       case
          when count(*) >= 6 then
             '✅ Foreign keys configured'
          else
             '⚠️ Check foreign key setup'
       end as status,
       count(*) as constraint_count
  from information_schema.table_constraints
 where constraint_type = 'FOREIGN KEY'
   and table_schema = 'public';

-- ================================================
-- 📊 DATA INTEGRITY CHECKS
-- ================================================

-- Check for orphaned assignments
select 'Orphaned Assignments' as check_type,
       case
          when count(*) = 0 then
             '✅ No orphaned assignments'
          else
             '⚠️ Found orphaned assignments'
       end as status,
       count(*) as orphaned_count
  from assignments a
  left join requests r
on a.request_id = r.id
 where r.id is null;

-- Check for invalid user roles
select 'Invalid Roles' as check_type,
       case
          when count(*) = 0 then
             '✅ All roles valid'
          else
             '❌ Invalid roles found'
       end as status,
       count(*) as invalid_count
  from profiles
 where role not in ( 'admin',
                     'volunteer',
                     'pilgrim' );

-- Check for profiles without auth users
select 'Auth Integration' as check_type,
       case
          when count(*) = 0 then
             '✅ All profiles have auth'
          else
             '⚠️ Profiles missing auth'
       end as status,
       count(*) as missing_auth_count
  from profiles p
  left join auth.users u
on p.id = u.id
 where u.id is null;

-- ================================================
-- 📈 PERFORMANCE METRICS
-- ================================================

-- Check database sizes
select 'Database Size' as metric,
       pg_size_pretty(pg_database_size(current_database())) as value,
       'Total database size' as description;

-- Check table sizes
select 'Table: '
       || schemaname
       || '.'
       || tablename as metric,
       pg_size_pretty(pg_total_relation_size(schemaname
                                             || '.'
                                             || tablename)) as value,
       'Table size including indexes' as description
  from pg_tables
 where schemaname = 'public'
 order by pg_total_relation_size(schemaname
                                 || '.'
                                 || tablename) desc;

-- ================================================
-- 🔐 SECURITY CHECKS
-- ================================================

-- Check RLS policies
select 'RLS Policies' as check_type,
       case
          when count(*) >= 5 then
             '✅ RLS policies active'
          else
             '⚠️ Check RLS configuration'
       end as status,
       count(*) as policy_count
  from pg_policies
 where schemaname = 'public';

-- Check for admin users
select 'Admin Users' as check_type,
       case
          when count(*) >= 1 then
             '✅ Admin users exist'
          else
             '❌ No admin users found'
       end as status,
       count(*) as admin_count
  from profiles
 where role = 'admin';

-- ================================================
-- 📊 SUMMARY STATISTICS
-- ================================================

select 'Record Counts' as section,
       'profiles' as table_name,
       count(*) as count,
       'Total user profiles' as description
  from profiles
union all
select 'Record Counts',
       'requests',
       count(*),
       'Total service requests'
  from requests
union all
select 'Record Counts',
       'assignments',
       count(*),
       'Total volunteer assignments'
  from assignments
union all
select 'Record Counts',
       'notifications',
       count(*),
       'Total notifications sent'
  from notifications
union all
select 'Record Counts',
       'feedback',
       count(*),
       'Total feedback entries'
  from feedback
 order by table_name;