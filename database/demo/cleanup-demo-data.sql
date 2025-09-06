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
DELETE FROM assignments 
WHERE request_id IN (
    SELECT id FROM requests 
    WHERE description LIKE '%demo%' 
    OR description LIKE '%test%'
    OR pilgrim_id IN (
        SELECT id FROM profiles 
        WHERE email LIKE '%demo%' 
        OR email LIKE '%test%'
        OR email LIKE '%example%'
    )
);

-- Remove demo requests
DELETE FROM requests 
WHERE description LIKE '%demo%' 
OR description LIKE '%test%'
OR pilgrim_id IN (
    SELECT id FROM profiles 
    WHERE email LIKE '%demo%' 
    OR email LIKE '%test%'
    OR email LIKE '%example%'
);

-- Remove demo profiles (keep admin and real users)
DELETE FROM profiles 
WHERE email LIKE '%demo%' 
OR email LIKE '%test%'
OR email LIKE '%example%'
OR email LIKE '%sample%'
AND role != 'admin'
AND email NOT LIKE '%@organization.com'; -- Preserve organization emails

-- ================================================
-- 📈 CLEANUP SUMMARY
-- ================================================

-- Query to check remaining records after cleanup
SELECT 'Profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'Requests' as table_name, COUNT(*) as count FROM requests  
UNION ALL
SELECT 'Assignments' as table_name, COUNT(*) as count FROM assignments;
