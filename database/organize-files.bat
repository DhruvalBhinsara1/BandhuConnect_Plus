@echo off
echo Creating organized directory structure...

REM Create directories for database organization
mkdir schema 2>nul
mkdir functions 2>nul
mkdir migrations 2>nul
mkdir testing 2>nul
mkdir maintenance 2>nul
mkdir archive 2>nul

echo Moving files to organized structure...

REM Schema files
move "schema.sql" "schema\" 2>nul
move "current-schema.sql" "schema\" 2>nul
move "consolidated-schema.sql" "schema\" 2>nul

REM Function files
move "functions.sql" "functions\" 2>nul
move "auto-assignment-functions.sql" "functions\" 2>nul
move "bulk-completion-functions.sql" "functions\" 2>nul
move "consolidated-functions.sql" "functions\" 2>nul
move "create-working-function.sql" "functions\" 2>nul
move "simple-working-function.sql" "functions\" 2>nul
move "update-get-my-assignment-function.sql" "functions\" 2>nul
move "deploy-corrected-assignment-function.sql" "functions\" 2>nul
move "deploy-counterpart-location-function.sql" "functions\" 2>nul

REM Migration files
move "add-assigned-field-migration.sql" "migrations\" 2>nul
move "bypass-auth-issue.sql" "migrations\" 2>nul

REM Testing files
move "test-mark-as-done.sql" "testing\" 2>nul
move "create-new-test-assignment.sql" "testing\" 2>nul
move "verify-assignment-creation.sql" "testing\" 2>nul
move "verify-completion-state.sql" "testing\" 2>nul
move "verify-demo-users.sql" "testing\" 2>nul

REM Maintenance files
move "cleanup-deprecated-files.sql" "maintenance\" 2>nul
move "remove-invalid-assignments.sql" "maintenance\" 2>nul
move "reactivate-assignment.sql" "maintenance\" 2>nul
move "recreate-assignment.sql" "maintenance\" 2>nul
move "update-request-status.sql" "maintenance\" 2>nul

REM Demo/Setup files - keep in root but organize
move "demo-data-setup.sql" "testing\" 2>nul
move "create-auth-accounts.sql" "testing\" 2>nul
move "create-complete-demo-accounts.sql" "testing\" 2>nul
move "create-missing-demo-profiles.sql" "testing\" 2>nul
move "reset-demo-password.sql" "testing\" 2>nul

REM Archive obsolete debug files
move "check-auth-mismatch.sql" "archive\" 2>nul
move "check-existing-assignments.sql" "archive\" 2>nul
move "create-assignment-fixed.sql" "archive\" 2>nul
move "create-missing-assignment.sql" "archive\" 2>nul
move "diagnose-constraint-issue.sql" "archive\" 2>nul
move "find-raj-patel.sql" "archive\" 2>nul
move "fix-completed-assignment.sql" "archive\" 2>nul
move "fix-constraint-final-solution.sql" "archive\" 2>nul
move "fix-volunteer-id-mismatch.sql" "archive\" 2>nul

echo Database files organized successfully!
echo.
echo Structure:
echo - schema/     : Database schema definitions
echo - functions/  : SQL functions and procedures  
echo - migrations/ : Database migration scripts
echo - testing/    : Test data and verification scripts
echo - maintenance/: Cleanup and maintenance scripts
echo - archive/    : Debug files from troubleshooting
echo.
