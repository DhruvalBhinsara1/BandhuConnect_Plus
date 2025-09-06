-- =============================================================================
-- BandhuConnect+ Professional Database Verification
-- Version: 2.1.0
-- Last Updated: September 6, 2025
-- Description: Comprehensive database health check and verification
-- =============================================================================

-- =============================================================================
-- ACCOUNT VERIFICATION
-- =============================================================================

-- Check essential accounts (using environment-safe approach)
select 'Essential Accounts Status' as check_type,
       count(*) as total_accounts,
       count(
          case
             when role = 'admin' then
                1
          end
       ) as admin_accounts,
       count(
          case
             when role = 'volunteer' then
                1
          end
       ) as volunteer_accounts,
       count(
          case
             when role = 'pilgrim' then
                1
          end
       ) as pilgrim_accounts
  from profiles
 where email not like '%@demo.com';

-- Check demo accounts
select 'Demo Accounts Status' as check_type,
       count(*) as total_demo_accounts,
       count(
          case
             when role = 'admin' then
                1
          end
       ) as demo_admin,
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
       ) as demo_pilgrims
  from profiles
 where email like '%@demo.com';

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
             '❌ Found orphaned requests - requires cleanup'
       end as status
  from assistance_requests ar
 where not exists (
   select 1
     from profiles p
    where p.id = ar.user_id
);

-- Check for orphaned assignments (volunteer side)
select 'Orphaned Assignments (Volunteer)' as check_type,
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
select 'Orphaned Assignments (Request)' as check_type,
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
-- SYSTEM HEALTH CHECKS
-- =============================================================================

-- Check database schema completeness
select 'Schema Completeness' as check_type,
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
          ) then
             '✅ All core tables present'
          else
             '❌ Missing core tables'
       end as status;

-- Check enum types
select 'Enum Types Status' as check_type,
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
          ) then
             '✅ All enum types present'
          else
             '❌ Missing enum types'
       end as status;

-- Check PostGIS extension
select 'PostGIS Extension' as check_type,
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
-- PERFORMANCE VERIFICATION
-- =============================================================================

-- Check critical indexes
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

-- =============================================================================
-- DEMO ENVIRONMENT VERIFICATION
-- =============================================================================

-- Check demo data availability
select 'Demo Environment Status' as check_type,
       (
          select count(*)
            from assistance_requests
           where user_id in (
             select id
               from profiles
              where email like '%@demo.com'
          )
       ) as demo_requests,
       (
          select count(*)
            from assignments
           where volunteer_id in (
             select id
               from profiles
              where email like '%@demo.com'
          )
       ) as demo_assignments,
       (
          select count(*)
            from user_locations
           where user_id in (
             select id
               from profiles
              where email like '%@demo.com'
          )
       ) as demo_locations,
       case
          when (
             select count(*)
               from profiles
              where email like '%@demo.com'
          ) >= 5 then
             '✅ Demo environment ready'
          else
             '⚠️ Demo environment needs setup'
       end as status;

-- =============================================================================
-- SECURITY VERIFICATION
-- =============================================================================

-- Check Row Level Security (RLS) status
select 'Row Level Security' as check_type,
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
-- BUSINESS LOGIC VERIFICATION
-- =============================================================================

-- Check assignment consistency
select 'Assignment Consistency' as check_type,
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

-- Check location data validity
select 'Location Data Validity' as check_type,
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
-- COMPREHENSIVE SUMMARY
-- =============================================================================

-- Generate overall database health summary
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
       case
          when (
                select count(*)
                  from profiles
             ) > 0
             and (
             select count(*)
               from assistance_requests ar
              where not exists (
                select 1
                  from profiles p
                 where p.id = ar.user_id
             )
          ) = 0
             and (
             select count(*)
               from assignments a
              where not exists (
                select 1
                  from profiles p
                 where p.id = a.volunteer_id
             )
          ) = 0 then
             '✅ DATABASE HEALTHY AND READY FOR PRODUCTION'
          else
             '⚠️ DATABASE NEEDS ATTENTION BEFORE PRODUCTION USE'
       end as overall_status;

-- =============================================================================
-- RECOMMENDED ACTIONS
-- =============================================================================

-- Generate recommendations based on verification results
with verification_results as (
   select case
             when (
                select count(*)
                  from profiles
                 where email like '%@demo.com'
             ) < 5 then
                'Consider running professional-demo-setup.sql for comprehensive testing environment'
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
                'Run professional-cleanup.sql to remove orphaned data'
             else
                'Database integrity is maintained'
          end as cleanup_recommendation
)
select 'Recommended Actions' as section,
       demo_recommendation,
       cleanup_recommendation,
       'Database verification completed successfully' as final_status
  from verification_results;

-- =============================================================================
-- END OF VERIFICATION
-- =============================================================================