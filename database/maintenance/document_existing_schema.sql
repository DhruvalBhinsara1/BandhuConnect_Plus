-- ================================================
-- 📋 EXISTING SCHEMA DOCUMENTATION
-- ================================================
-- Document what already exists in the database

-- Check existing policies on user_devices
SELECT
    'user_devices policies' as table_policies,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'user_devices'
ORDER BY policyname;

-- Check existing policies on locations
SELECT
    'locations policies' as table_policies,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'locations'
ORDER BY policyname;

-- Check existing policies on location_updates
SELECT
    'location_updates policies' as table_policies,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'location_updates'
ORDER BY policyname;

-- Check indexes on these tables
SELECT
    'Existing indexes' as index_check,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('user_devices', 'locations', 'location_updates')
ORDER BY tablename, indexname;