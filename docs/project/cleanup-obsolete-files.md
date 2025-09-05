# Database Cleanup - Obsolete Files Removal

The following files are now obsolete and can be safely removed as they have been consolidated into the new schema:

## Files to Remove:
- admin-profile-update-policy.sql
- check-existing-locations.sql
- check-existing-users.sql
- complete-database-rebuild.sql
- complete-location-fix.sql
- complete-rls-fix.sql
- corrected-rls-fix.sql
- create-admin-dhruval.sql
- create-test-assignment.sql
- create-test-assignments.sql
- create-test-data.sql
- debug-assignments.sql
- demo-data-setup.sql
- emergency-rls-fix.sql
- essential-location-fix.sql
- final-setup.sql
- fix-assignment-creation.sql
- fix-bidirectional-visibility.sql
- fix-critical-errors.sql
- fix-location-coordinates.sql
- fix-profiles-rls.sql
- fix-rls-recursion.sql
- fix-zero-coordinates.sql
- immediate-rls-fix.sql
- last-known-location-fix.sql
- location-sharing-functions.sql
- location-tracking-schema.sql
- migrate-existing-data.sql
- migration-fix-function-types.sql
- nuclear-rls-fix.sql
- secure-location-schema.sql
- simple-test-assignment.sql

## Files to Keep:
- consolidated-schema.sql (NEW - main schema)
- consolidated-functions.sql (NEW - essential functions)
- auto-assignment-functions.sql (keep for reference)
- bulk-completion-functions.sql (keep for reference)
- functions.sql (keep for reference)
- schema.sql (keep for reference)
- create-demo-accounts.md (keep for setup)
- setup-instructions.md (keep for setup)

## Cleanup Commands:
Run these commands from the database directory to clean up:

```bash
# Remove obsolete SQL files
rm admin-profile-update-policy.sql
rm check-existing-locations.sql
rm check-existing-users.sql
rm complete-database-rebuild.sql
rm complete-location-fix.sql
rm complete-rls-fix.sql
rm corrected-rls-fix.sql
rm create-admin-dhruval.sql
rm create-test-assignment.sql
rm create-test-assignments.sql
rm create-test-data.sql
rm debug-assignments.sql
rm demo-data-setup.sql
rm emergency-rls-fix.sql
rm essential-location-fix.sql
rm final-setup.sql
rm fix-assignment-creation.sql
rm fix-bidirectional-visibility.sql
rm fix-critical-errors.sql
rm fix-location-coordinates.sql
rm fix-profiles-rls.sql
rm fix-rls-recursion.sql
rm fix-zero-coordinates.sql
rm immediate-rls-fix.sql
rm last-known-location-fix.sql
rm location-sharing-functions.sql
rm location-tracking-schema.sql
rm migrate-existing-data.sql
rm migration-fix-function-types.sql
rm nuclear-rls-fix.sql
rm secure-location-schema.sql
rm simple-test-assignment.sql
```

## New Database Setup:
Use the consolidated files for fresh deployments:
1. Run `consolidated-schema.sql` first
2. Run `consolidated-functions.sql` second
3. Use `create-demo-accounts.md` for test data
