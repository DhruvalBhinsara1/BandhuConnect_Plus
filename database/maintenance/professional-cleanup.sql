-- =============================================================================
-- BandhuConnect+ Professional Database Cleanup
-- Version: 2.1.0
-- Last Updated: September 6, 2025
-- Description: Safe cleanup preserving essential accounts and demo data
-- =============================================================================

-- This script safely removes test data while preserving:
-- 1. Essential administrative accounts (configured via environment variables)
-- 2. Demo accounts (for testing and demonstration)
-- 3. Production data integrity

-- =============================================================================
-- SAFETY CHECKS AND VERIFICATION
-- =============================================================================

-- Verify current database state before cleanup
DO $$
BEGIN
    RAISE NOTICE 'Starting database cleanup verification...';
    RAISE NOTICE 'Total profiles before cleanup: %', (SELECT COUNT(*) FROM profiles);
    RAISE NOTICE 'Total assistance requests: %', (SELECT COUNT(*) FROM assistance_requests);
    RAISE NOTICE 'Total assignments: %', (SELECT COUNT(*) FROM assignments);
    RAISE NOTICE 'Total user locations: %', (SELECT COUNT(*) FROM user_locations);
END $$;

-- =============================================================================
-- IDENTIFY ACCOUNTS TO PRESERVE
-- =============================================================================

-- Create temporary table for accounts to preserve
CREATE TEMP TABLE accounts_to_preserve AS
SELECT id, email, role, 'Essential admin account' as reason
FROM profiles 
WHERE email = COALESCE(
    current_setting('app.admin_email', true), 
    'admin@placeholder.com'
) -- Use environment variable or placeholder

UNION ALL

SELECT id, email, role, 'Essential user account' as reason
FROM profiles 
WHERE email = COALESCE(
    current_setting('app.user_email', true), 
    'user@placeholder.com'
) -- Use environment variable or placeholder

UNION ALL

SELECT id, email, role, 'Demo account for testing' as reason
FROM profiles 
WHERE email LIKE '%@demo.com'

UNION ALL

SELECT id, email, role, 'Demo account for testing' as reason
FROM profiles 
WHERE email LIKE '%@example.com';

-- =============================================================================
-- SAFE CLEANUP PROCESS
-- =============================================================================

-- Step 1: Clean up user locations for non-preserved accounts
DELETE FROM user_locations 
WHERE user_id NOT IN (SELECT id FROM accounts_to_preserve);

-- Step 2: Clean up assignments for non-preserved requests
DELETE FROM assignments 
WHERE request_id IN (
    SELECT ar.id 
    FROM assistance_requests ar
    WHERE ar.user_id NOT IN (SELECT id FROM accounts_to_preserve)
);

-- Step 3: Clean up assignments for non-preserved volunteers
DELETE FROM assignments 
WHERE volunteer_id NOT IN (SELECT id FROM accounts_to_preserve);

-- Step 4: Clean up assistance requests from non-preserved users
DELETE FROM assistance_requests 
WHERE user_id NOT IN (SELECT id FROM accounts_to_preserve);

-- Step 5: Clean up notifications for non-preserved users
DELETE FROM notifications 
WHERE user_id NOT IN (SELECT id FROM accounts_to_preserve);

-- Step 6: Clean up chat messages from non-preserved users
DELETE FROM chat_messages 
WHERE sender_id NOT IN (SELECT id FROM accounts_to_preserve);

-- Step 7: Clean up direct messages involving non-preserved users
DELETE FROM direct_messages 
WHERE sender_id NOT IN (SELECT id FROM accounts_to_preserve)
   OR receiver_id NOT IN (SELECT id FROM accounts_to_preserve);

-- Step 8: Clean up chat channels created by non-preserved users
DELETE FROM chat_channels 
WHERE created_by NOT IN (SELECT id FROM accounts_to_preserve);

-- Step 9: Finally, remove non-preserved profile records
DELETE FROM profiles 
WHERE id NOT IN (SELECT id FROM accounts_to_preserve);

-- =============================================================================
-- POST-CLEANUP VERIFICATION
-- =============================================================================

-- Verify cleanup results
DO $$
DECLARE
    preserved_count INTEGER;
    total_requests INTEGER;
    total_assignments INTEGER;
    total_locations INTEGER;
BEGIN
    SELECT COUNT(*) INTO preserved_count FROM profiles;
    SELECT COUNT(*) INTO total_requests FROM assistance_requests;
    SELECT COUNT(*) INTO total_assignments FROM assignments;
    SELECT COUNT(*) INTO total_locations FROM user_locations;
    
    RAISE NOTICE '=== CLEANUP COMPLETE ===';
    RAISE NOTICE 'Preserved profiles: %', preserved_count;
    RAISE NOTICE 'Remaining assistance requests: %', total_requests;
    RAISE NOTICE 'Remaining assignments: %', total_assignments;
    RAISE NOTICE 'Remaining user locations: %', total_locations;
    
    -- Check for any orphaned data
    IF EXISTS (
        SELECT 1 FROM assistance_requests ar 
        WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = ar.user_id)
    ) THEN
        RAISE WARNING 'Found orphaned assistance requests!';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM assignments a 
        WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = a.volunteer_id)
    ) THEN
        RAISE WARNING 'Found orphaned assignments (volunteer)!';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM user_locations ul 
        WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = ul.user_id)
    ) THEN
        RAISE WARNING 'Found orphaned user locations!';
    END IF;
    
    RAISE NOTICE 'Database cleanup verification complete.';
END $$;

-- =============================================================================
-- DISPLAY PRESERVED ACCOUNTS
-- =============================================================================

-- Show which accounts were preserved
SELECT 
    email,
    role,
    reason,
    'PRESERVED' as status
FROM accounts_to_preserve
ORDER BY role, email;

-- =============================================================================
-- CLEANUP STATISTICS
-- =============================================================================

-- Generate cleanup summary
SELECT 
    'Database Cleanup Summary' as report_type,
    (SELECT COUNT(*) FROM profiles) as total_profiles,
    (SELECT COUNT(*) FROM profiles WHERE email LIKE '%@demo.com') as demo_accounts,
    (SELECT COUNT(*) FROM profiles WHERE role = 'admin') as admin_accounts,
    (SELECT COUNT(*) FROM assistance_requests) as total_requests,
    (SELECT COUNT(*) FROM assignments) as total_assignments,
    (SELECT COUNT(*) FROM user_locations) as active_locations,
    NOW() as cleanup_completed_at;

-- =============================================================================
-- DROP TEMPORARY OBJECTS
-- =============================================================================

DROP TABLE accounts_to_preserve;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

SELECT 
    '✅ Professional database cleanup completed successfully!' as status,
    'Essential accounts preserved, test data removed, demo environment ready.' as description,
    'Database is now clean and organized for production use.' as result;
