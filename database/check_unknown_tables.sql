SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('user_devices', 'locations', 'location_updates', 'users') ORDER BY tablename;
