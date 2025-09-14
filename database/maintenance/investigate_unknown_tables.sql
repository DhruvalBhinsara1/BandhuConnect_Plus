-- ================================================
-- 🔍 UNKNOWN TABLES INVESTIGATION
-- ================================================
-- Check what these mystery tables contain

-- Check user_devices table structure
SELECT
    'user_devices structure' as investigation,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_devices'
ORDER BY ordinal_position;

-- Check locations table structure
SELECT
    'locations structure' as investigation,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'locations'
ORDER BY ordinal_position;

-- Check location_updates table structure
SELECT
    'location_updates structure' as investigation,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'location_updates'
ORDER BY ordinal_position;

-- Sample data from each table
SELECT 'user_devices sample' as source, COUNT(*) as record_count FROM user_devices;
SELECT 'locations sample' as source, COUNT(*) as record_count FROM locations;
SELECT 'location_updates sample' as source, COUNT(*) as record_count FROM location_updates;