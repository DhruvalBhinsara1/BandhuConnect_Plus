-- =============================================================================
-- BandhuConnect+ Professional Selective Cleanup
-- Version: 2.1.0 - Updated September 6, 2025
-- Description: Safe cleanup preserving essential accounts
-- =============================================================================

-- IMPORTANT: Before running this script, update the account emails below
-- Replace placeholder emails with your actual account emails

-- =============================================================================
-- CONFIGURATION SECTION - UPDATE BEFORE RUNNING
-- =============================================================================

-- Define accounts to preserve (UPDATE THESE VALUES)
CREATE TEMP TABLE accounts_to_preserve AS
SELECT id, email, role, 'Essential Admin Account' as reason
FROM profiles 
WHERE email = 'your.admin@example.com' -- REPLACE WITH YOUR ADMIN EMAIL

UNION ALL

SELECT id, email, role, 'Essential User Account' as reason
FROM profiles 
WHERE email = 'your.user@example.com' -- REPLACE WITH YOUR USER EMAIL

UNION ALL

-- Keep all demo accounts for testing
SELECT id, email, role, 'Demo Account' as reason
FROM profiles 
WHERE email LIKE '%@demo.com'

UNION ALL

-- Keep any other specified accounts
SELECT id, email, role, 'Other Essential Account' as reason
FROM profiles 
WHERE email LIKE '%@example.com'; -- Add other patterns as needed

-- =============================================================================
-- VERIFICATION BEFORE CLEANUP
-- =============================================================================

-- Show what accounts will be preserved
SELECT 
    'ACCOUNTS TO BE PRESERVED:' as section,
    COUNT(*) as total_preserved_accounts
FROM accounts_to_preserve;

SELECT 
    reason,
    email,
    role
FROM accounts_to_preserve
ORDER BY reason, email;

-- Show what will be removed
SELECT 
    'ACCOUNTS TO BE REMOVED:' as section,
    COUNT(*) as total_accounts_to_remove
FROM profiles 
WHERE id NOT IN (SELECT id FROM accounts_to_preserve);

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

-- Step 9: Remove non-preserved profile records (MUST BE LAST)
DELETE FROM profiles 
WHERE id NOT IN (SELECT id FROM accounts_to_preserve);

-- =============================================================================
-- POST-CLEANUP VERIFICATION
-- =============================================================================

-- Show final preserved accounts
SELECT 
    'CLEANUP COMPLETE - PRESERVED ACCOUNTS:' as section;

SELECT 
    reason,
    email,
    role,
    'PRESERVED' as status
FROM accounts_to_preserve
ORDER BY reason, email;

-- Show cleanup statistics
SELECT 
    'CLEANUP STATISTICS:' as section,
    (SELECT COUNT(*) FROM profiles) as total_remaining_profiles,
    (SELECT COUNT(*) FROM assistance_requests) as remaining_requests,
    (SELECT COUNT(*) FROM assignments) as remaining_assignments,
    (SELECT COUNT(*) FROM user_locations) as remaining_locations,
    NOW() as cleanup_completed_at;

-- =============================================================================
-- INTEGRITY CHECKS
-- =============================================================================

-- Check for orphaned data after cleanup
SELECT 
    'INTEGRITY CHECK:' as section,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM assistance_requests ar 
            WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = ar.user_id)
        ) THEN 'WARNING: Found orphaned assistance requests'
        ELSE 'OK: No orphaned assistance requests'
    END as assistance_requests_check,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM assignments a 
            WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = a.volunteer_id)
        ) THEN 'WARNING: Found orphaned assignments'
        ELSE 'OK: No orphaned assignments'
    END as assignments_check,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM user_locations ul 
            WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = ul.user_id)
        ) THEN 'WARNING: Found orphaned user locations'
        ELSE 'OK: No orphaned user locations'
    END as locations_check;

-- =============================================================================
-- CLEANUP COMPLETION
-- =============================================================================

-- Clean up temporary table
DROP TABLE accounts_to_preserve;

-- Final status message
SELECT 
    '✅ Professional selective cleanup completed successfully!' as status,
    'Database is now clean and organized with essential accounts preserved.' as result,
    'Ready for production use or demo environment setup.' as next_steps;

-- =============================================================================
-- USAGE INSTRUCTIONS
-- =============================================================================

-- TO USE THIS SCRIPT:
-- 1. Update the email addresses in the configuration section above
-- 2. Replace 'your.admin@example.com' with your actual admin email
-- 3. Replace 'your.user@example.com' with your actual user email
-- 4. Add any other essential email patterns as needed
-- 5. Review the verification queries before running cleanup
-- 6. Execute the script in your database environment
-- 7. Verify the results using the integrity checks
