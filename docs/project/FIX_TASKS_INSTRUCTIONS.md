# Fix Task Display Issues - Quick Instructions

## 🚨 Critical Issues Identified:
1. **RLS Infinite Recursion** - Location updates failing
2. **Missing Request Data** - Tasks showing "Location pending" instead of details
3. **Counterpart Profile Errors** - Service trying to fetch non-existent profiles

## 🔧 Quick Fix Steps:

### Step 1: Fix Database Issues
1. Open Supabase Dashboard → SQL Editor
2. Run the script: `database/fix-all-issues.sql`
3. This will:
   - Fix RLS infinite recursion
   - Create proper demo data with relationships
   - Update volunteer statuses
   - Add location data for demo users

### Step 2: Test the App
1. Stop the current Expo server (Ctrl+C)
2. Clear Metro cache: `npx expo start --clear`
3. Login with: `raj.volunteer@demo.com` / `demo123`
4. Check "My Tasks" screen - should now show proper task details

## 🎯 What's Fixed:
- ✅ Tasks will show proper titles and descriptions
- ✅ Location updates won't cause infinite recursion errors
- ✅ Counterpart profile errors handled gracefully
- ✅ Task status and priority display correctly
- ✅ Demo data properly linked with assignments

## 📱 Expected Results:
- Tasks screen shows: "Need help with directions to temple" instead of "Location pending"
- Map screen shows location tracking without errors
- No more console errors about infinite recursion
- Proper task completion flow

## 🔍 If Issues Persist:
1. Check Supabase logs for any remaining errors
2. Verify demo accounts exist in Authentication tab
3. Ensure all SQL scripts ran successfully
4. Clear app cache and restart
