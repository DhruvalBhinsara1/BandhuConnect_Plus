# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Quick Start Commands

```bash
# Install dependencies (uses npm - package-lock.json present)
npm install

# Start development server
npx expo start

# Run on specific platforms  
npx expo start --ios
npx expo start --android
npx expo start --web

# Admin dashboard (separate React app)
cd admin-dashboard && npm install && npm start

# Clear Metro cache when experiencing issues
npx expo start --clear
```

## Repository Architecture

BandhuConnect+ is a **React Native + Expo SDK 53** app for community assistance during events, with three user types: volunteers, admins, and pilgrims. It includes:

- **Main mobile app**: React Native with Expo (root directory)
- **Admin dashboard**: Separate React web app (`admin-dashboard/`)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Storage)

### Key Directories

```
├── App.tsx                    # Main app entry with provider composition
├── src/
│   ├── components/           # Reusable UI components
│   ├── screens/             # Role-based screen organization
│   │   ├── auth/           # Authentication flows
│   │   ├── volunteer/      # Volunteer-specific screens
│   │   ├── admin/          # Admin-specific screens  
│   │   ├── pilgrim/        # Pilgrim-specific screens
│   │   └── shared/         # Cross-role screens (MapScreen, ChatScreen)
│   ├── context/            # React Context providers (Auth, Location, Request, Map)
│   ├── services/           # Business logic layer
│   ├── navigation/         # React Navigation configuration
│   └── types/              # TypeScript definitions
├── database/               # SQL schema and functions
├── admin-dashboard/        # Separate React web app for admin interface
└── assets/                # Images and static resources
```

## Environment Setup

### Required Variables

Create `.env` in project root:
```env
EXPO_PUBLIC_SUPABASE_URL=https://ywntkafcfuugzgcduekj.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
```

Create `admin-dashboard/.env`:
```env
REACT_APP_SUPABASE_URL=https://ywntkafcfuugzgcduekj.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Environment variables are loaded via:
- `src/services/supabase.ts` - Uses `Constants.expoConfig?.extra` or `process.env.EXPO_PUBLIC_*`
- `app.config.js` - Exposes env vars through `extra` field

## Supabase Backend Overview

### Core Tables
- **`profiles`**: User data with role, skills, location, volunteer_status
- **`assistance_requests`**: Help requests with type, priority, status, location (GEOGRAPHY)
- **`assignments`**: Links volunteers to requests with status tracking
- **`user_locations`**: Real-time location tracking with lat/lng/accuracy
- **`chat_messages`** & **`chat_channels`**: Messaging system
- **`notifications`**: Push notification records

### Key Database Functions
Located in `database/auto-assignment-functions.sql`:
- **`auto_assign_request_enhanced()`**: Intelligent volunteer matching with scoring algorithm
- **`find_nearest_volunteers()`**: Geographic search with skill filtering
- **`get_coordinates_from_geography()`**: Extract lat/lng from PostGIS geography

### Row Level Security (RLS)
All tables use RLS with policies in `database/schema.sql`:
- Users see all profiles but can only update their own
- Admins can update any request
- Location visibility controlled by role and assignment relationships

## Authentication & User Management

### Supabase Client
Initialized in `src/services/supabase.ts` with:
```typescript
import 'react-native-url-polyfill/auto'; // Required polyfill
const supabase = createClient(url, anonKey, {
  auth: { autoRefreshToken: true, persistSession: true }
});
```

### Auth Flow
Managed by `src/context/AuthContext.tsx`:
- Email/password authentication via Supabase Auth
- Profile creation/completion flow after signup
- Role assignment and persistence with `expo-secure-store`
- Session restoration and token refresh

### Role-Based Access Control

Three user roles defined in `src/types/index.ts`:
- **`volunteer`**: Accept assignments, track location, complete tasks
- **`admin`**: Manage volunteers, assign tasks, view analytics  
- **`pilgrim`**: Create requests, track status, view assigned volunteer

Role enforcement:
- UI navigation gated by `user.role` in `src/navigation/MainNavigator.tsx`
- Database access controlled by RLS policies
- Context providers filter data based on role

## Real-Time Location Tracking

### Architecture Overview
1. **Permission Request**: `src/services/locationService.ts` handles foreground/background permissions
2. **Background Task**: Uses `expo-task-manager` with task name `'background-location-task'`
3. **Location Updates**: Updates `user_locations` table every 30 seconds/50 meters
4. **Real-time Sync**: Updates subscribed via `supabase.channel('realtime-location-updates').on('postgres_changes', ...)` in `mapService.ts`

### Location Service Configuration
```typescript
// In locationService.ts
watchPositionAsync({
  accuracy: Location.Accuracy.High,
  timeInterval: 30000,    // 30 seconds
  distanceInterval: 50,   // 50 meters
})
```

### Platform Permissions
Configured in `app.config.js`:
- **iOS**: NSLocation* usage descriptions for foreground/background
- **Android**: ACCESS_FINE_LOCATION + ACCESS_BACKGROUND_LOCATION permissions

**Important**: Background location requires development build, not Expo Go.

## Supabase Realtime Implementation

`mapService.ts` establishes a Supabase Realtime subscription to track location changes:

```typescript
// From src/services/mapService.ts
subscribeToLocationUpdates(callback: (locations: UserLocationData[]) => void): () => void {
  this.locationSubscription = supabase
    .channel('realtime-location-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_locations',
        filter: 'is_active=eq.true'
      },
      async (payload) => {
        // Get fresh data after any change
        const { data } = await this.getAssignmentLocations();
        if (data) callback(data);
      }
    )
    .subscribe();

  return () => this.locationSubscription.unsubscribe();
}
```

Role-based visibility is enforced through RPC functions called by the service:
- `get_pilgrim_locations_for_volunteer`: Volunteers see pilgrims they're assigned to
- `get_volunteer_locations_for_pilgrim`: Pilgrims see volunteers assigned to them
- `get_all_active_locations`: Admins see everyone

## Context Provider Composition

Provider hierarchy in `App.tsx`:
```typescript
<AuthProvider>
  <RequestProvider>
    <LocationProvider>
      <MapProvider>
        <LocationWrapper>
          <AppNavigator />
```

### Key Providers
- **`AuthContext`** (`src/context/AuthContext.tsx`): User session, role, profile management
- **`LocationContext`** (`src/context/LocationContext.tsx`): GPS tracking, permissions, current location
- **`RequestContext`** (`src/context/RequestContext.tsx`): Assistance request management
- **`MapContext`** (`src/context/MapContext.tsx`): Map state, markers, user visibility

## Service Layer Patterns

Services in `src/services/` follow consistent patterns:

### Error Handling
```typescript
// Standard return pattern across services
return { data: result, error: null };
// or
return { data: null, error: errorObj };
```

### Key Services
- **`authService`**: Authentication, profile CRUD, session management
- **`requestService`**: Assistance request lifecycle management
- **`autoAssignmentService`**: Intelligent volunteer matching with scoring algorithm
- **`locationService`**: GPS tracking, background tasks, location updates
- **`chatService`**: Real-time messaging functionality
- **`storageService`**: Image upload handling

### Auto-Assignment Algorithm
Located in `src/services/autoAssignmentService.ts`, scores volunteers by:
- **Skill match (40%)**: Request type vs volunteer skills
- **Distance (30%)**: Geographic proximity to request
- **Availability (20%)**: Current status + rating
- **Priority urgency (10%)**: Request priority level

## Navigation Architecture

Uses **React Navigation v6** (not Expo Router):
- **`AppNavigator.tsx`**: Root navigator, switches between Auth/Main
- **`AuthNavigator.tsx`**: Pre-login screens (role selection, signup, login)
- **`MainNavigator.tsx`**: Role-based navigation after authentication

### Screen Organization
Screens grouped by user type:
- `src/screens/auth/` - Authentication flow
- `src/screens/volunteer/` - Volunteer dashboard, tasks, profile
- `src/screens/admin/` - Admin dashboard, management screens
- `src/screens/pilgrim/` - Request creation, status tracking
- `src/screens/shared/` - Cross-role screens (maps, chat)

## Development Workflows

### Running Local Development
```bash
# Start with tunnel for real device testing
npx expo start --tunnel

# For background location testing, use development build:
npx expo run:ios    # Requires Xcode
npx expo run:android # Requires Android Studio
```

### Database Development
Apply schema changes via Supabase dashboard:
1. Run SQL from `database/schema.sql`
2. Apply functions from `database/functions.sql`
3. Set up auto-assignment from `database/auto-assignment-functions.sql`

### Testing Location Features
**Expo Go limitations**: Cannot test background location or push notifications
**Use development build for**:
- Background location tracking
- Push notifications
- Full native module functionality

### Admin Dashboard Development
```bash
cd admin-dashboard
npm start  # Runs on localhost:3000
npm run build && npm run serve  # Production build testing
```

## Common Development Tasks

### Adding New Request Types
1. Update `RequestType` in `src/types/index.ts`
2. Add skill mapping in `autoAssignmentService.ts` → `getRequiredSkills()`
3. Update database enum: `ALTER TYPE request_type ADD VALUE 'new_type';`

### Adding New User Roles
1. Update `UserRole` in `src/types/index.ts`  
2. Add navigation routes in `src/navigation/MainNavigator.tsx`
3. Update RLS policies in database
4. Add role-specific screens in `src/screens/`

### Testing Real-time Features
```bash
# Test with multiple users:
# 1. Run on iOS simulator
npx expo run:ios

# 2. Run on Android emulator  
npx expo run:android

# 3. Run web version for admin
npx expo start --web
```

## Troubleshooting

### Location Issues
- **"Location permission denied"**: Check `app.config.js` permission strings
- **"Background location not working"**: Must use development build, not Expo Go
- **"Location not updating"**: Check network connection to Supabase, RLS policies

### Database Issues  
- **"Permission denied for table"**: Verify RLS policies allow current user role
- **"Function does not exist"**: Run SQL functions from `database/` directory
- **"Row level security"**: Ensure user is authenticated before database calls

### Build Issues
```bash
# Clear all caches
npx expo start --clear
rm -rf node_modules && npm install

# Reset Metro bundler
npx expo start --reset-cache

# Check Expo diagnostics
npx expo doctor
```

### Admin Dashboard Issues
- **Router errors**: Ensure `react-router-dom` is installed in `admin-dashboard/`
- **Supabase connection**: Verify `.env` file in `admin-dashboard/` directory
- **CORS issues**: Check Supabase dashboard authentication settings

## Key Architectural Decisions

### Why React Navigation vs Expo Router
Project uses React Navigation v6 for greater control over role-based navigation and deep linking for authentication flows.

### Why Context API vs Redux/Zustand  
Uses React Context + hooks for state management due to:
- Relatively simple state requirements
- Need for location/auth provider composition
- Real-time subscriptions managed at context level

### Why Separate Admin Dashboard
Web-based admin interface provides:
- Better UX for complex management tasks
- Easy deployment to Vercel
- Separate authentication flow for admin users

## Auto-Assignment System

The intelligent volunteer matching system (`src/services/autoAssignmentService.ts`) uses a **scoring algorithm**:

```typescript
// Weighted scoring: skill(40%) + distance(30%) + availability(20%) + urgency(10%)
const finalScore = (
  skillMatch * 0.4 +
  distanceScore * 0.3 + 
  availabilityScore * 0.2 +
  urgencyBonus * 0.1
);
```

Minimum match score: **60%** threshold before auto-assignment triggers.

Manual assignment available through admin interface when auto-assignment score is below threshold.
