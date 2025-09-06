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
select '=== DATABASE HEALTH SUMMARY ===' as section,
       (
          select count(*)
            from profiles
       ) as total_users,
       (
          select count(*)
            from assistance_requests
       ) as total_requests,
       (
          select count(*)
            from assignments
       ) as total_assignments,
       (
          select count(*)
            from user_locations
       ) as active_locations,
       now() as verification_time;

-- =============================================================================
-- ACCOUNT TYPE VERIFICATION
-- =============================================================================

-- Verify account distribution by role
select 'Account Distribution by Role' as check_type,
       role,
       count(*) as account_count,
       count(
          case
             when is_active = true then
                1
          end
       ) as active_accounts
  from profiles
 group by role
 order by role;

-- Check demo environment status
select 'Demo Environment Status' as check_type,
       count(*) as demo_accounts,
       count(
          case
             when role = 'admin' then
                1
          end
       ) as demo_admins,
       count(
          case
             when role = 'volunteer' then
                1
          end
       ) as demo_volunteers,
       count(
          case
             when role = 'pilgrim' then
                1
          end
       ) as demo_pilgrims,
       case
          when count(*) >= 5 then
             '✅ Demo environment properly configured'
          else
             '⚠️ Demo environment may need setup'
       end as status
  from profiles
 where email like '%@demo.com';

-- Check for production accounts (non-demo, non-test)
select 'Production Accounts Status' as check_type,
       count(*) as production_accounts,
       count(
          case
             when role = 'admin' then
                1
          end
       ) as production_admins,
       case
          when count(
             case
                when role = 'admin' then
                   1
             end
          ) >= 1 then
             '✅ Admin accounts present'
          else
             '❌ No admin accounts found'
       end as admin_status
  from profiles
 where email not like '%@demo.com'
   and email not like '%@test.%'
   and email not like '%temp%';

-- =============================================================================
-- DATA INTEGRITY VERIFICATION
-- =============================================================================

-- Check for orphaned assistance requests
select 'Orphaned Assistance Requests' as check_type,
       count(*) as orphaned_count,
       case
          when count(*) = 0 then
             '✅ No orphaned requests found'
          else
             '❌ Found orphaned requests - database needs cleanup'
       end as status
  from assistance_requests ar
 where not exists (
   select 1
     from profiles p
    where p.id = ar.user_id
);

-- Check for orphaned assignments (volunteer side)
select 'Orphaned Assignments (Volunteers)' as check_type,
       count(*) as orphaned_count,
       case
          when count(*) = 0 then
             '✅ No orphaned volunteer assignments'
          else
             '❌ Found orphaned volunteer assignments'
       end as status
  from assignments a
 where not exists (
   select 1
     from profiles p
    where p.id = a.volunteer_id
);

-- Check for orphaned assignments (request side)
select 'Orphaned Assignments (Requests)' as check_type,
       count(*) as orphaned_count,
       case
          when count(*) = 0 then
             '✅ No orphaned request assignments'
          else
             '❌ Found orphaned request assignments'
       end as status
  from assignments a
 where not exists (
   select 1
     from assistance_requests ar
    where ar.id = a.request_id
);

-- Check for orphaned user locations
select 'Orphaned User Locations' as check_type,
       count(*) as orphaned_count,
       case
          when count(*) = 0 then
             '✅ No orphaned user locations'
          else
             '❌ Found orphaned user locations'
       end as status
  from user_locations ul
 where not exists (
   select 1
     from profiles p
    where p.id = ul.user_id
);

-- =============================================================================
-- SCHEMA VERIFICATION
-- =============================================================================

-- Verify core tables exist
select 'Core Tables Verification' as check_type,
       case
          when exists (
             select 1
               from information_schema.tables
              where table_name = 'profiles'
          )
             and exists (
             select 1
               from information_schema.tables
              where table_name = 'assistance_requests'
          )
             and exists (
             select 1
               from information_schema.tables
              where table_name = 'assignments'
          )
             and exists (
             select 1
               from information_schema.tables
              where table_name = 'user_locations'
          )
             and exists (
             select 1
               from information_schema.tables
              where table_name = 'notifications'
          ) then
             '✅ All core tables present'
          else
             '❌ Missing core tables'
       end as status;

-- Verify enum types
select 'Enum Types Verification' as check_type,
       case
          when exists (
             select 1
               from pg_type
              where typname = 'user_role'
          )
             and exists (
             select 1
               from pg_type
              where typname = 'request_type'
          )
             and exists (
             select 1
               from pg_type
              where typname = 'request_status'
          )
             and exists (
             select 1
               from pg_type
              where typname = 'assignment_status'
          )
             and exists (
             select 1
               from pg_type
              where typname = 'priority_level'
          )
             and exists (
             select 1
               from pg_type
              where typname = 'volunteer_status'
          ) then
             '✅ All enum types present'
          else
             '❌ Missing enum types'
       end as status;

-- Verify PostGIS extension
select 'PostGIS Extension Verification' as check_type,
       case
          when exists (
             select 1
               from pg_extension
              where extname = 'postgis'
          ) then
             '✅ PostGIS extension installed'
          else
             '❌ PostGIS extension missing'
       end as status;

-- =============================================================================
-- BUSINESS LOGIC VERIFICATION
-- =============================================================================

-- Verify assignment consistency
select 'Assignment Consistency Check' as check_type,
       count(*) as inconsistent_assignments,
       case
          when count(*) = 0 then
             '✅ All assignments are consistent'
          else
             '❌ Found assignment inconsistencies'
       end as status
  from assignments a
  join assistance_requests ar
on a.request_id = ar.id
 where ( a.status in ( 'accepted',
                       'in_progress',
                       'completed' )
   and ar.status = 'pending' )
    or ( a.status = 'completed'
   and ar.status != 'completed' );

-- Verify location data integrity
select 'Location Data Integrity' as check_type,
       count(*) as invalid_locations,
       case
          when count(*) = 0 then
             '✅ All location data is valid'
          else
             '❌ Found invalid location data'
       end as status
  from user_locations
 where latitude not between - 90 and 90
    or longitude not between - 180 and 180
    or accuracy < 0;

-- =============================================================================
-- PERFORMANCE VERIFICATION
-- =============================================================================

-- Check database indexes
select 'Database Indexes' as check_type,
       count(*) as total_indexes,
       case
          when count(*) >= 10 then
             '✅ Sufficient indexes present'
          else
             '⚠️ Consider adding more indexes for performance'
       end as status
  from pg_indexes
 where schemaname = 'public'
   and tablename in ( 'profiles',
                      'assistance_requests',
                      'assignments',
                      'user_locations' );

-- Check Row Level Security
select 'Row Level Security Status' as check_type,
       count(*) as tables_with_rls,
       case
          when count(*) >= 4 then
             '✅ RLS properly configured'
          else
             '⚠️ RLS needs configuration'
       end as status
  from pg_tables pt
  join pg_class pc
on pt.tablename = pc.relname
 where pt.schemaname = 'public'
   and pc.relrowsecurity = true
   and pt.tablename in ( 'profiles',
                         'assistance_requests',
                         'assignments',
                         'user_locations' );

-- =============================================================================
-- FINAL VERIFICATION SUMMARY
-- =============================================================================

-- Generate comprehensive health report
select '=== FINAL VERIFICATION SUMMARY ===' as section;

with health_metrics as (
   select (
      select count(*)
        from profiles
   ) as total_users,
          (
             select count(*)
               from assistance_requests ar
              where not exists (
                select 1
                  from profiles p
                 where p.id = ar.user_id
             )
          ) as orphaned_requests,
          (
             select count(*)
               from assignments a
              where not exists (
                select 1
                  from profiles p
                 where p.id = a.volunteer_id
             )
          ) as orphaned_assignments,
          (
             select count(*)
               from user_locations ul
              where not exists (
                select 1
                  from profiles p
                 where p.id = ul.user_id
             )
          ) as orphaned_locations
)
select 'Database Health Assessment' as assessment_type,
       case
          when total_users > 0
             and orphaned_requests = 0
             and orphaned_assignments = 0
             and orphaned_locations = 0 then
             '✅ DATABASE IS HEALTHY AND PRODUCTION READY'
          when total_users > 0
             and ( orphaned_requests > 0
              or orphaned_assignments > 0
              or orphaned_locations > 0 ) then
             '⚠️ DATABASE HAS INTEGRITY ISSUES - NEEDS CLEANUP'
          else
             '❌ DATABASE HAS CRITICAL ISSUES - REQUIRES IMMEDIATE ATTENTION'
       end as overall_status,
       total_users,
       orphaned_requests,
       orphaned_assignments,
       orphaned_locations
  from health_metrics;

-- =============================================================================
-- RECOMMENDATIONS
-- =============================================================================

-- Provide actionable recommendations
select '=== RECOMMENDATIONS ===' as section;

select 'Next Steps' as category,
       case
          when (
             select count(*)
               from profiles
              where email like '%@demo.com'
          ) < 5 then
             'Consider running demo setup script for comprehensive testing environment'
          else
             'Demo environment is properly configured'
       end as demo_recommendation,
       case
          when exists (
             select 1
               from assistance_requests ar
              where not exists (
                select 1
                  from profiles p
                 where p.id = ar.user_id
             )
          ) then
             'Run cleanup script to remove orphaned data'
          else
             'Database integrity is maintained'
       end as cleanup_recommendation,
       'Database verification completed successfully' as verification_status;

-- =============================================================================
-- END OF VERIFICATION
-- =============================================================================

select '✅ Professional database verification completed!' as status,
       'All checks performed without exposing sensitive information.' as security_note,
       now() as completed_at;