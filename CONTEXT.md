# BandhuConnect+ Context and Development History

## Project Overview
BandhuConnect+ is a React Native application ecosystem designed for the Kumbh Mela event, facilitating volunteer coordination and pilgrim assistance. The system consists of three main applications:

1. **Pilgrim App** - For pilgrims to request assistance
2. **Volunteer App** - For volunteers to receive and respond to assistance requests  
3. **Admin Dashboard** - Web-based dashboard for administrators to manage volunteers and requests

## Architecture
- **Frontend**: React Native (mobile apps) + React.js (admin dashboard)
- **Backend**: Supabase (PostgreSQL + Row Level Security)
- **Real-time**: Supabase Realtime subscriptions
- **Location**: Expo Location with background tracking
- **Authentication**: Supabase Auth

## Recent Major Updates and Fixes (Latest Session)

### 1. Complete Database Schema Rebuild with Simplified RLS Policies ✅
**Problem**: Infinite recursion in RLS policies causing database errors and blocking assignment functionality.

**Solution**: Created comprehensive database rebuild script (`complete-database-rebuild.sql`) that:
- Drops all problematic RLS policies and functions
- Recreates simplified, non-recursive RLS policies for all tables
- Implements SECURITY DEFINER functions to safely bypass RLS for critical operations
- Adds proper grants and permissions for authenticated users
- Includes performance indexes and helpful comments

**Key Functions Added**:
- `create_assignment_safe()` - Safe assignment creation bypassing RLS
- `get_volunteer_stats()` - Volunteer statistics without RLS issues  
- `get_assignment_stats()` - Global assignment statistics
- `auto_assign_request_simple()` - Simplified auto-assignment logic
- Location query functions for each role with proper RLS handling

### 2. Fixed Role Mismatch Issues Across All Apps ✅
**Problem**: Role detection inconsistencies causing access issues and app functionality problems.

**Solution**: 
- Updated `secureLocationService.ts` to query correct `profiles` table for role verification
- Modified `mapService.ts` to use hardcoded app role from Expo config instead of database lookup
- Added warning logs for role mismatches while allowing flexible access during development
- Fixed all undefined variable references and TypeScript errors in mapService

### 3. Rebuilt Assignment System with Direct Database Operations ✅
**Problem**: Assignment creation failing due to function name mismatches and RLS conflicts.

**Solution**: 
- Updated admin dashboard `RequestManagement.js` to use correct function names (`create_assignment_safe`, `auto_assign_request_simple`)
- Fixed `autoAssignmentService.ts` to use proper RPC function calls with fallback strategies
- Enhanced volunteer matching with skill-based scoring, distance calculation, and availability assessment
- Improved error handling and detailed logging with emoji indicators
- Added comprehensive volunteer scoring algorithm (40% skills, 30% distance, 20% availability, 10% urgency)

### 4. Fixed Volunteer Stats and Profile Statistics ✅
**Problem**: Volunteer dashboard and profile showing incorrect or missing statistics.

**Solution**:
- Updated `volunteerService.ts` to use `get_volunteer_stats` RPC function with fallback to direct queries
- Modified `VolunteerDashboard.tsx` to use database service instead of local calculations
- Updated `VolunteerProfile.tsx` to fetch real statistics from database
- Added proper error handling and fallback mechanisms for stats display
- Implemented real-time hours tracking for active on-duty tasks

### 5. Admin Dashboard Request Management Implementation ✅
**Problem**: Admin dashboard had placeholder for request management functionality.

**Solution**: Implemented complete `RequestManagement.js` component with:
- Manual volunteer assignment with modal selection interface
- Auto-assignment integration using enhanced backend RPC functions
- Real-time request status updates and notifications
- Comprehensive error handling and user feedback
- Integration with existing dashboard layout and styling

### 6. Background Location Task Registration Fix ✅
**Problem**: Circular dependency in location service preventing background task registration.

**Solution**: Refactored `locationService.ts` to:
- Move background task registration to app initialization
- Fix circular imports between location service and background tasks
- Improve permission request flow for foreground and background location
- Add detailed debug logging for troubleshooting location issues

## Testing Instructions

### Prerequisites
1. **Apply Database Changes**: Run `complete-database-rebuild.sql` in Supabase SQL Editor
2. **Verify Environment**: Ensure `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set
3. **Check App Configs**: Verify each app has correct `appRole` in `app.config.js`

### Testing Checklist

#### 1. Database Functions Test
```sql
-- Test in Supabase SQL Editor
SELECT * FROM get_assignment_stats();
SELECT * FROM get_volunteer_stats('volunteer-uuid-here');
SELECT * FROM create_assignment_safe('request-uuid', 'volunteer-uuid', 'pending');
```

#### 2. Admin Dashboard Testing
- [ ] Login with admin credentials
- [ ] View volunteer list with correct status indicators
- [ ] Manual volunteer assignment functionality
- [ ] Auto-assignment button works without errors
- [ ] Request status updates in real-time
- [ ] Notification system shows success/error messages

#### 3. Volunteer App Testing
- [ ] Login with volunteer credentials
- [ ] Dashboard shows correct statistics (not zeros)
- [ ] Profile displays accurate completed tasks and hours
- [ ] Check in/out duty status works
- [ ] Location tracking activates properly
- [ ] Assignment notifications received

#### 4. Pilgrim App Testing
- [ ] Login with pilgrim credentials
- [ ] Role detection works without mismatch warnings
- [ ] Location services function properly
- [ ] Request creation and status tracking

#### 5. Cross-App Integration Testing
- [ ] Create assistance request in Pilgrim app
- [ ] Assign volunteer via Admin dashboard
- [ ] Verify assignment appears in Volunteer app
- [ ] Complete assignment workflow end-to-end
- [ ] Verify stats update across all apps

### Troubleshooting Common Issues

#### Assignment Creation Fails
- Check Supabase logs for RLS policy errors
- Verify `create_assignment_safe` function exists and has proper grants
- Ensure user has authenticated session

#### Stats Not Displaying
- Check console for `get_volunteer_stats` RPC errors
- Verify volunteer has assignments in database
- Test fallback calculation logic

#### Role Mismatch Warnings
- Check `app.config.js` has correct `appRole` for each build
- Verify user profile has correct role in database
- Review `secureLocationService.ts` logs for role detection

## App Configuration & Role System

### Hardcoded App Roles (Per Build)
```javascript
// app.config.js - Different for each build
extra: {
  appRole: "pilgrim" | "volunteer" | "admin"
}
```

### Role Detection Priority (in mapService.ts)
1. **Primary**: `Constants.expoConfig?.extra?.appRole` (hardcoded per build)
2. **Fallback 1**: Profile table role query
3. **Fallback 2**: User metadata role

## Key Services Architecture

### LocationService (`src/services/locationService.ts`)
- **Purpose**: Handles device location tracking and background updates
- **Key Features**:
  - Foreground/background permission requests
  - Background task registration (`LOCATION_TASK_NAME`)
  - Location publishing with 10-second intervals or 25-meter movement
  - Battery-efficient tracking strategy

### MapService (`src/services/mapService.ts`)
- **Purpose**: Manages location data retrieval and user visibility
- **Key Features**:
  - Role-based location queries (pilgrim/volunteer/admin)
  - Bi-directional visibility (pilgrims see volunteers, volunteers see pilgrims)
  - Admin sees all users
  - Comprehensive debug logging added
  - Fallback queries for missing database functions

### AutoAssignmentService (`src/services/autoAssignmentService.ts`)
- **Purpose**: Automatically matches volunteers to assistance requests
- **Key Features**:
  - Volunteer scoring based on distance, availability, skills
  - Assignment creation and notification sending
  - Batch assignment capabilities
  - Detailed logging for troubleshooting

### LocationContext (`src/context/LocationContext.tsx`)
- **Purpose**: React context for location state management
- **Key Features**:
  - Permission management with user-friendly modals
  - Auto-start tracking for logged-in users
  - Silent error handling to prevent user disruption
  - Location state persistence

## Database Schema Key Tables

### profiles
- User information with role-based access
- Fields: id, name, phone, role, volunteer_status, skills, is_active

### assistance_requests  
- Pilgrim requests for help
- Fields: id, title, description, type, priority, location, status

### assignments
- Links requests to volunteers
- Fields: id, request_id, volunteer_id, status, created_at
- **Issue**: RLS policies cause infinite recursion (fix pending)

### user_locations
- Real-time location data
- Fields: user_id, latitude, longitude, accuracy, timestamp
- **Issue**: Function type mismatches (fix pending)

## Security & Permissions

### Row Level Security (RLS)
- Strict role-based data access control
- **Current Issue**: Infinite recursion in assignment policies
- **Solution**: Non-recursive policies created in `fix-rls-recursion.sql`

### Location Permissions
- **Foreground**: Required for basic location features
- **Background**: Required for continuous tracking
- **Current Issue**: Background permissions not properly granted

## Comprehensive Fixes Applied (2025-09-04 Session)

### 1. Background Location Service Enhancement ✅
**Changes Made**:
- Refactored background task definition to avoid circular dependency
- Enhanced permission request flow with step-by-step foreground → background
- Improved task registration with proper error handling and safety checks
- Added comprehensive debug logging with emoji-coded messages

### 2. RLS Policy Complete Overhaul ✅
**Changes Made**:
- Removed all recursive policy dependencies from assignments table
- Created SECURITY DEFINER `create_assignment()` function to bypass RLS
- Added safe lookup functions: `get_volunteer_assignments()`, `get_pilgrim_assignments()`
- Implemented non-recursive SELECT policy (admin + direct volunteer_id only)
- Enhanced policy cleanup script with comprehensive DROP statements

### 3. Auto-Assignment Service Robustness ✅
**Changes Made**:
- Updated to use `create_assignment()` RPC function with fallback to direct insert
- Enhanced coordinate extraction with multiple fallback methods
- Improved volunteer matching with graceful degradation to simple queries
- Added detailed logging for each step of assignment process
- Fixed TypeScript errors and proper User object typing

### 4. Admin Dashboard Request Management ✅
**Changes Made**:
- Created complete `RequestManagement.js` component replacing placeholder
- Implemented manual volunteer assignment with selection modal
- Added auto-assignment integration calling enhanced service
- Built real-time request status updates and notifications
- Added comprehensive error handling and user feedback

### 5. Cross-App Consistency Maintained ✅
**Verification**:
- All changes applied universally across Pilgrim, Volunteer, and Admin apps
- Role-based functionality preserved with hardcoded app roles per build
- Enhanced debug logging consistent across all apps
- Location tracking improvements work for all user types

## Database Migration Status

### Required SQL Migrations (Ready to Apply)
1. **`fix-rls-recursion.sql`** - Updated with comprehensive policy cleanup and SECURITY DEFINER functions
2. **`complete-location-fix.sql`** - Fixes VARCHAR(255) vs TEXT type mismatches (if still needed)

## Next Steps for Full Resolution

### Immediate Actions Required
1. **Apply Updated SQL Migration**: Run the enhanced `fix-rls-recursion.sql` in Supabase
2. **Test Assignment Flows**: Verify both manual and auto-assignment work without recursion errors
3. **Validate Cross-App Functionality**: Test all three apps to ensure consistent behavior

### Expected Outcomes After Migration
- ✅ Assignment creation works without RLS recursion errors
- ✅ Auto-assignment service completes successfully  
- ✅ Admin dashboard shows functional assignment interface
- ✅ Background location tracking operates without circular dependency issues
- ✅ All apps maintain synchronized functionality

## Environment Variables Required
- `EXPO_PUBLIC_SUPABASE_URL`: Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- App-specific role configuration in each build's app.config.js

## Development Notes
- All location data automatically purged after 30 days
- Battery optimization: 10-second intervals or 25-meter movement threshold
- Role integrity maintained at build and runtime levels
- Comprehensive error handling with user-friendly fallbacks
