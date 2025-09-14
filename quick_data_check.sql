SELECT 'user_devices' as table_name, COUNT(*) as records FROM user_devices UNION ALL SELECT 'locations', COUNT(*) FROM locations UNION ALL SELECT 'location_updates', COUNT(*) FROM location_updates;
