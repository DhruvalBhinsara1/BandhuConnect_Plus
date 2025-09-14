-- ================================================
-- 🔄 SCHEMA SYNCHRONIZATION APPROACH
-- ================================================
-- Safe way to sync schema files with existing database

-- Step 1: Document current table structures
SELECT
    'Current Schema Documentation' as documentation,
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
AND t.table_name IN ('user_devices', 'locations', 'location_updates')
ORDER BY t.table_name, c.ordinal_position;

-- Step 2: Document existing indexes
SELECT
    'Current Indexes' as documentation,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('user_devices', 'locations', 'location_updates')
ORDER BY tablename;

-- Step 3: Document existing RLS policies
SELECT
    'Current RLS Policies' as documentation,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('user_devices', 'locations', 'location_updates')
ORDER BY tablename, policyname;