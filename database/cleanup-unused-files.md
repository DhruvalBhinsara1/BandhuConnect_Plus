# Database Files Cleanup Guide

## Files to Keep (Essential)
- `schema.sql` - Main database schema
- `final-setup.sql` - Complete database setup with demo data
- `auto-assignment-functions.sql` - Core auto-assignment functionality
- `admin-profile-update-policy.sql` - Current working RLS policy
- `functions.sql` - All database functions
- `setup-instructions.md` - Setup documentation

## Files to Remove (Duplicates/Temporary)

### Debug Files
- `debug-auto-assignment.sql`
- `simple-debug.sql`
- `run-complete-analysis.sql`
- `analyze-assignment-failures.sql`

### Duplicate Demo Data
- `demo-users.sql` (keep `demo-users-simple.sql`)
- `flood-requests.sql` (keep `create-flood-requests.sql`)
- `flood-requests-simple.sql`
- `flood-requests-with-users.sql`

### Completed Migration Files
- `fix-enum-values.sql`
- `cleanup-enum-values.sql`
- `force-remove-tech-transportation.sql`
- `fix-all-skills.sql`
- `fix-volunteer-skills.sql`
- `quick-fix-skills.sql`
- `migrate-demo-data.sql`

### Superseded Function Files
- `drop-and-recreate-volunteer-function.sql`
- `fix-volunteer-function.sql`
- `fix-match-score-ambiguity.sql`
- `create-missing-functions.sql`

### Verification Files (One-time Use)
- `check-current-skills.sql`
- `check-enum-values.sql`
- `check-schema.sql`
- `check-volunteer-skills.sql`
- `check-volunteers.sql`
- `verify-assignment-readiness.sql`
- `verify-cleanup.sql`

### Alternative Setup Files
- `clean-and-setup.sql` (use `final-setup.sql` instead)
- `simple-setup.sql`
- `minimal-seed.sql`
- `seed-data.sql`

## Recommended Action
Keep only the essential files and remove the rest to maintain a clean database folder.
