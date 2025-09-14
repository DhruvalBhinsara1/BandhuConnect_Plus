-- ================================================
-- 🔍 DEEP INVESTIGATION: Data Relationships
-- ================================================

-- Check if these tables are connected to your main tables
SELECT
    'Foreign Key Connections' as analysis_type,
    tc.table_name as source_table,
    kcu.column_name as source_column,
    ccu.table_name as referenced_table,
    ccu.column_name as referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND (tc.table_name IN ('user_devices', 'locations', 'location_updates')
     OR ccu.table_name IN ('user_devices', 'locations', 'location_updates'))
ORDER BY tc.table_name;

-- Check for data in these tables
SELECT
    'Data Volume Analysis' as analysis_type,
    'user_devices' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    MAX(created_at) as latest_record
FROM user_devices

UNION ALL

SELECT
    'Data Volume Analysis',
    'locations',
    COUNT(*),
    COUNT(DISTINCT user_id),
    MAX(last_updated)
FROM locations

UNION ALL

SELECT
    'Data Volume Analysis',
    'location_updates',
    COUNT(*),
    COUNT(DISTINCT user_id),
    MAX(created_at)
FROM location_updates;

-- Check if app code references these tables
-- (This would need to be checked in your application code)