-- ================================================
-- 🧹 DEMO DATA CLEANUP SCRIPT
-- ================================================
-- Purpose: Clean up demo/test data while preserving production accounts
-- Version: 2.0.0
-- Last Updated: September 6, 2025
-- Environment: Safe for all environments
-- ================================================

-- 🛡️ SAFETY CHECK
-- Starting Demo Data Cleanup...
-- ⚠️  This will remove demo/test data only
-- ✅ Production accounts will be preserved

-- ================================================
-- 📊 CLEANUP DEMO DATA
-- ================================================

-- Remove demo assignments (keep real ones)
delete from assignments
 where request_id in (
   select id
     from requests
    where description like '%demo%'
       or description like '%test%'
       or pilgrim_id in (
      select id
        from profiles
       where email like '%demo%'
          or email like '%test%'
          or email like '%example%'
   )
);

-- Remove demo requests
delete from requests
 where description like '%demo%'
    or description like '%test%'
    or pilgrim_id in (
   select id
     from profiles
    where email like '%demo%'
       or email like '%test%'
       or email like '%example%'
);

-- Remove demo profiles (keep admin and real users)
delete from profiles
 where email like '%demo%'
    or email like '%test%'
    or email like '%example%'
    or email like '%sample%'
   and role != 'admin'
   and email not like '%@organization.com'; -- Preserve organization emails

-- ================================================
-- 📈 CLEANUP SUMMARY
-- ================================================

-- Query to check remaining records after cleanup
select 'Profiles' as table_name,
       count(*) as count
  from profiles
union all
select 'Requests' as table_name,
       count(*) as count
  from requests
union all
select 'Assignments' as table_name,
       count(*) as count
  from assignments;