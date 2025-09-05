-- List of deprecated SQL files that can be safely removed after testing
-- These are debug/diagnostic files created during development

-- DEBUG FILES (can be removed after final testing):
-- check-auth-mismatch.sql
-- check-current-assignment.sql
-- check-existing-assignment.sql
-- debug-assignment-visibility.sql
-- debug-assignments.sql
-- debug-constraint.sql
-- debug-current-assignments.sql
-- debug-function-execution.sql
-- debug-pilgrim-assignment.sql
-- find-duplicate-assignment.sql
-- find-raj-patel.sql

-- TEMPORARY FIX FILES (can be removed after final testing):
-- fix-assignment-to-raj.sql
-- fix-constraint-final-solution.sql
-- fix-volunteer-assignment.sql
-- fix-volunteer-id-mismatch.sql
-- test-mark-as-done.sql

-- KEEP THESE ESSENTIAL FILES:
-- schema.sql (core database structure)
-- rls_policies.sql (security policies)
-- create_admin_user.sql (admin setup)
-- consolidated-functions.sql (essential database functions)
-- consolidated-schema.sql (complete schema)

-- This file itself can be removed after cleanup is complete
