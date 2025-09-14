# BandhuConnect+ Final Testing & Cleanup Checklist

## 🧪 Functional Testing Status

### ✅ Assignment System Tests
- [x] Assignment visibility fixed for both apps
- [x] Real-time location tracking working
- [x] Subscription error handling implemented
- [ ] **PENDING**: Test "Mark as Done" functionality
- [ ] **PENDING**: Verify completion state sync between apps
- [ ] **PENDING**: Test new assignment creation and visibility

### 🗄️ Database Sync Tests
- [ ] **PENDING**: Test assignment completion updates database immediately
- [ ] **PENDING**: Test both apps reflect completion state
- [ ] **PENDING**: Test volunteer map resets to no-assignments state
- [ ] **PENDING**: Test cancellation updates

## 🧹 Code Cleanup Tasks

### Debug/Development Files to Remove
**Database files (71 total - many are debug files):**
- `debug-*.sql` files (8 files)
- `check-*.sql` files (7 files) 
- `fix-*.sql` files (15+ files)
- `find-*.sql` files (2 files)
- `test-*.sql` files (1 file)

**Keep essential database files:**
- `schema.sql`
- `rls_policies.sql` 
- `create_admin_user.sql`
- `consolidated-functions.sql`
- `consolidated-schema.sql`

### React Components to Review
**Debug components (may be removable):**
- `src/components/AuthDebugger.tsx`
- `src/components/DebugDrawer.tsx`
- `src/screens/DebugScreen.tsx`
- Debug tabs in `MainNavigator.tsx`

**Duplicate/deprecated screens:**
- `AdminDashboard.tsx` vs `AdminDashboardScreen.tsx`
- `TaskAssignment.tsx` vs `TaskAssignmentFixed.tsx`
- `VolunteerManagement.tsx` vs `VolunteerManagementScreen.tsx`
- `PilgrimManagement.tsx` vs `PilgrimManagementScreen.tsx`

### Unused Imports & Dead Code
- [ ] **PENDING**: Scan for unused imports
- [ ] **PENDING**: Remove commented-out code
- [ ] **PENDING**: Remove unused utility functions

## 🔍 Edge Cases to Test
- [ ] No assignments state
- [ ] Multiple assignments handling
- [ ] Network connectivity issues
- [ ] Failed API calls
- [ ] Offline state behavior

## 📋 Final Deliverables
- [ ] Clean, working repository
- [ ] Consistent functionality across apps
- [ ] Documentation of critical changes
- [ ] No deprecated files
- [ ] No dead code

## 🎯 Next Steps
1. Run `test-mark-as-done.sql` to test completion functionality
2. Test both apps after completion
3. Remove debug components and files
4. Clean up duplicate screens
5. Final testing of edge cases
