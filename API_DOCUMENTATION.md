# BandhuConnect+ Complete API Documentation

## Database Functions (RPC Calls)

### Location Services

#### `update_user_location()`
Updates or inserts user location data with conflict resolution.

**Parameters:**
- `p_latitude` (DECIMAL): User's latitude coordinate
- `p_longitude` (DECIMAL): User's longitude coordinate  
- `p_accuracy` (DECIMAL, optional): GPS accuracy in meters
- `p_altitude` (DECIMAL, optional): Altitude in meters
- `p_heading` (DECIMAL, optional): Direction heading in degrees
- `p_speed` (DECIMAL, optional): Speed in m/s

**Returns:** UUID of location record

**Used in:**
- `mapService.ts` - Main location updates
- `secureLocationService.ts` - Background location publishing

**Usage:**
```sql
SELECT update_user_location(22.2926783, 73.3619733, 5.0);
```

#### `get_assignment_locations()`
Retrieves location data for users involved in active assignments.

**Parameters:**
- `p_user_id` (UUID, optional): Specific user ID (defaults to authenticated user)

**Returns:** Table with columns:
- `user_id`: User identifier
- `user_name`: Display name
- `user_role`: User role (pilgrim/volunteer/admin)
- `latitude`, `longitude`: Coordinates
- `accuracy`: GPS accuracy
- `last_updated`: Timestamp of last location update
- `assignment_info`: JSON array of assignment details

#### `get_my_assignment()`
Gets current user's active assignment details.

**Used in:** `secureMapService.ts`

**Returns:** Assignment data with counterpart information

#### `get_counterpart_location()`
Retrieves location of user's assignment counterpart.

**Used in:** `secureMapService.ts`

**Returns:** Location data for assigned counterpart

#### `deactivate_user_location()`
Marks user's location as inactive when going offline.

**Used in:** 
- `mapService.ts`
- `mapService.new.ts`

#### Role-Specific Location Functions

##### `get_pilgrim_locations_for_volunteer(p_volunteer_id)`
Returns pilgrim locations visible to a specific volunteer.

**Used in:** `mapService.ts` (volunteer role)

##### `get_volunteer_locations_for_pilgrim(p_pilgrim_id)`
Returns volunteer locations visible to a specific pilgrim.

**Used in:** `mapService.ts` (pilgrim role)

##### `get_all_active_locations()`
Returns all active locations for admin users.

**Used in:** `mapService.ts` (admin role)

### Volunteer Management Functions

#### `update_volunteer_status(volunteer_id, new_is_active, new_volunteer_status)`
Updates volunteer availability status.

**Used in:** `volunteerService.ts`

**Parameters:**
- `volunteer_id` (UUID): Volunteer's user ID
- `new_is_active` (BOOLEAN): Active status
- `new_volunteer_status` (volunteer_status): Status enum value

#### `get_volunteer_stats(p_volunteer_id)`
Retrieves comprehensive volunteer statistics.

**Used in:** `volunteerService.ts`

**Returns:** Statistics including completed tasks, hours worked, ratings

#### `update_volunteer_status_based_on_assignments(p_volunteer_id)`
Updates volunteer status based on current assignments.

**Used in:** `volunteerService.ts`

#### `refresh_all_volunteer_statuses()`
Bulk refresh of all volunteer statuses.

**Used in:** `volunteerService.ts`

### Auto-Assignment Functions

#### `get_coordinates_from_geography(geo_point)`
Extracts coordinates from PostGIS geography type.

**Used in:** `autoAssignmentService.ts`

#### `find_nearest_volunteers(target_lat, target_lng, max_distance_meters)`
Finds volunteers within specified distance of a location.

**Used in:** `autoAssignmentService.ts`

**Parameters:**
- `target_lat` (DECIMAL): Target latitude
- `target_lng` (DECIMAL): Target longitude  
- `max_distance_meters` (INTEGER): Search radius in meters

## Direct Database Table Operations

### Profiles Table Operations

#### SELECT Operations
**Used in:**
- `volunteerService.ts` - Get volunteer profiles and status
- `secureMapService.ts` - Get user profile data
- `secureLocationService.ts` - Role verification
- `authService.ts` - Profile creation and updates
- `bulkCompletionService.ts` - Admin permission checks

**Common Queries:**
```sql
-- Get volunteer profiles
SELECT id, name, email, phone, volunteer_status, is_active 
FROM profiles WHERE role = 'volunteer'

-- Get user profile by ID
SELECT name, role FROM profiles WHERE id = $1
```

#### UPDATE Operations
**Used in:**
- `volunteerService.ts` - Update volunteer status and profile data
- `authService.ts` - Profile updates after signup

### User Locations Table Operations

#### INSERT/UPSERT Operations
**Used in:**
- `secureLocationService.ts` - Direct location updates (avoiding RLS recursion)
- `mapService.ts` - Fallback location updates

**Query Pattern:**
```sql
INSERT INTO user_locations (user_id, latitude, longitude, accuracy, is_active, last_updated)
VALUES ($1, $2, $3, $4, true, NOW())
ON CONFLICT (user_id) DO UPDATE SET ...
```

### Assignments Table Operations

#### SELECT Operations
**Used in:**
- `assignmentService.ts` - Check existing assignments
- `secureMapService.ts` - Assignment status verification
- `volunteerService.ts` - Assignment statistics

#### DELETE Operations
**Used in:**
- `assignmentService.ts` - Rollback failed assignments

### Assistance Requests Table Operations

#### UPDATE Operations
**Used in:**
- `assignmentService.ts` - Update request status when assigned

## Service Classes

### AuthService
**Location:** `src/services/authService.ts`

#### Core Methods

**`signUp(email, password, userData)`**
- Creates new user account with Supabase Auth
- Sets up user session
- Creates profile record
- **API Calls:** `supabase.auth.signUp()`, `supabase.auth.setSession()`

**`signIn(email, password)`**
- Authenticates user credentials
- **API Calls:** `supabase.auth.signInWithPassword()`

**`signOut()`**
- Signs out current user
- Deactivates device registration
- **API Calls:** `supabase.auth.signOut()`

**`getCurrentUser()`**
- Gets current authenticated user
- **API Calls:** `supabase.auth.getUser()`

**`onAuthStateChange(callback)`**
- Subscribes to auth state changes
- **API Calls:** `supabase.auth.onAuthStateChange()`

### SecureMapService
**Location:** `src/services/secureMapService.ts`

#### Core Methods

**`getOwnLocationCenter()`**
- Returns map region centered on user's location with 200m zoom radius
- Calculates precise delta for 400m total view (200m radius)
- Returns null if location unavailable
- **API Calls:** `supabase.auth.getUser()`, `supabase.from('profiles').select()`

**`getAllRelevantLocations()`**
- Retrieves own location plus counterpart location if assignment is active
- Automatically hides counterpart after task completion
- Implements privacy controls
- **API Calls:** `supabase.rpc('get_my_assignment')`, `supabase.from('assignments').select()`

**`getAssignmentStatus()`**
- Checks current assignment status
- Returns assignment details and counterpart information
- Used for tracking state management
- **API Calls:** `supabase.rpc('get_my_assignment')`

**`subscribeToLocationUpdates(callback)`**
- Sets up real-time location subscriptions
- **API Calls:** `supabase.channel().on('postgres_changes')`

### SecureLocationService
**Location:** `src/services/secureLocationService.ts`

#### Background Tracking

**`initializeTracking()`**
- Requests location permissions progressively
- Validates user role against app configuration
- Sets up background location updates
- **API Calls:** `Location.requestForegroundPermissionsAsync()`, `Location.requestBackgroundPermissionsAsync()`

**`publishLocation(locationData)`**
- Publishes location to user_locations table
- Uses direct table insert to avoid RLS recursion
- **API Calls:** `supabase.auth.getUser()`, `supabase.from('user_locations').upsert()`

**`startLocationTracking()`**
- Starts background location tracking with TaskManager
- **API Calls:** `Location.startLocationUpdatesAsync()`

### VolunteerService
**Location:** `src/services/volunteerService.ts`

#### Core Methods

**`getVolunteers()`**
- Retrieves all volunteer profiles
- **API Calls:** `supabase.from('profiles').select()`

**`updateVolunteerStatus(volunteerId, status)`**
- Updates volunteer availability status
- **API Calls:** `supabase.from('profiles').update()`

**`getVolunteerStats(volunteerId)`**
- Gets volunteer assignment statistics
- **API Calls:** `supabase.rpc('get_volunteer_stats')`

### AssignmentService
**Location:** `src/services/assignmentService.ts`

#### Core Methods

**`createAssignment(requestId, volunteerId)`**
- Creates new assignment between request and volunteer
- **API Calls:** `supabase.from('assignments').insert()`, `supabase.from('assistance_requests').update()`

**`getActiveAssignments()`**
- Gets all active assignments
- **API Calls:** `supabase.from('assignments').select()`

**`completeAssignment(assignmentId)`**
- Marks assignment as completed
- **API Calls:** `supabase.rpc('complete_assignment')`

### BulkCompletionService
**Location:** `src/services/bulkCompletionService.ts`

#### Core Methods

**`bulkCompleteRequests(requestIds)`**
- Completes multiple requests at once
- **API Calls:** `supabase.rpc('bulk_complete_requests')`

**`bulkCompleteAssignments(assignmentIds)`**
- Completes multiple assignments at once
- **API Calls:** `supabase.rpc('bulk_complete_assignments')`

### AutoAssignmentService
**Location:** `src/services/autoAssignmentService.ts`

#### Core Methods

**`autoAssignRequest(requestId)`**
- Automatically assigns request to best available volunteer
- **API Calls:** `supabase.rpc('find_nearest_volunteers')`, `supabase.rpc('auto_assign_request')`

**`getAssignmentRecommendations(requestId)`**
- Gets volunteer recommendations for a request
- **API Calls:** `supabase.rpc('find_nearest_volunteers')`

## Context Providers

### AuthContext
**Location:** `src/context/AuthContext.tsx`

#### State Management
- Manages user authentication state
- Handles session persistence
- Provides user profile data

#### API Methods
**`signIn(email, password)`**
- **API Calls:** `supabase.auth.signInWithPassword()`

**`signUp(email, password, userData)`**
- **API Calls:** `supabase.auth.signUp()`, `supabase.from('profiles').insert()`

**`signOut()`**
- **API Calls:** `supabase.auth.signOut()`

**`updateProfile(profileData)`**
- **API Calls:** `supabase.from('profiles').update()`

### LocationContext
**Location:** `src/context/LocationContext.tsx`

#### State Management
- Manages current user location
- Handles location permissions
- Provides location update callbacks

#### API Methods
**`getCurrentLocation()`**
- **API Calls:** `Location.getCurrentPositionAsync()`

**`requestPermissions()`**
- **API Calls:** `Location.requestForegroundPermissionsAsync()`

**`startTracking()`**
- **API Calls:** `Location.startLocationUpdatesAsync()`

### ChatContext
**Location:** `src/context/ChatContext.tsx`

#### State Management
- Manages chat messages and conversations
- Handles real-time message updates
- Provides typing indicators

#### API Methods
**`sendMessage(content, recipientId)`**
- **API Calls:** `supabase.from('messages').insert()`

**`subscribeToMessages(conversationId)`**
- **API Calls:** `supabase.channel().on('postgres_changes')`

**`markAsRead(messageId)`**
- **API Calls:** `supabase.from('messages').update()`

## Error Handling Patterns

### Common Error Types
1. **Authentication Errors**: Invalid credentials, expired sessions
2. **Permission Errors**: Location access denied, insufficient privileges
3. **Network Errors**: Connection timeouts, offline state
4. **Database Errors**: RLS policy violations, constraint failures

### Error Handling Examples

#### Location Permission Error
```typescript
try {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Location Permission Required',
      'Please enable location access to use this feature.',
      [{ text: 'OK' }]
    );
    return;
  }
} catch (error) {
  console.error('Permission request failed:', error);
}
```

#### Database Query Error
```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId);

if (error) {
  console.error('Database query failed:', error);
  Alert.alert('Error', 'Failed to load profile data. Please try again.');
  return;
}
```

#### Real-time Subscription Error
```typescript
const channel = supabase
  .channel('location-updates')
  .on('postgres_changes', 
    { event: 'UPDATE', schema: 'public', table: 'user_locations' },
    (payload) => handleLocationUpdate(payload)
  )
  .subscribe((status) => {
    if (status === 'SUBSCRIPTION_ERROR') {
      console.error('Failed to subscribe to location updates');
    }
  });
```

## API Usage Summary

### Most Frequently Used APIs
1. **`supabase.auth.getUser()`** - Used across all services for authentication
2. **`supabase.from('profiles').select()`** - User profile queries
3. **`supabase.from('user_locations').upsert()`** - Location updates
4. **`supabase.rpc()`** - Database function calls
5. **`Location.getCurrentPositionAsync()`** - Device location access

### Critical API Dependencies
- **Supabase Auth**: All user authentication and session management
- **Supabase Realtime**: Live location updates and chat functionality
- **Expo Location**: Device GPS access and background tracking
- **React Native Maps**: Map rendering and interaction
- **AsyncStorage**: Local data persistence

#### Key Features
- **200m Precision Zoom**: "Show Me" button centers with 0.0036 degree delta
- **Auto-fade Notifications**: Task completion fades after 4 seconds
- **Interactive Legends**: Shows "You" vs counterpart markers
- **Privacy Controls**: Hides counterpart after completion

#### State Management
```typescript
interface TrackingState {
  isActive: boolean;
  hasPermissions: boolean;
  hasAssignment: boolean;
  counterpartName?: string;
  showCompletedStatus?: boolean;
}
```

### TaskList Component

#### Assignment Display
- Shows proper task titles from `assistance_requests.title`
- Displays priority levels with color coding
- Handles assignment status updates
- Implements error boundaries

## Error Handling Patterns

### Location Services
- **Permission Denied**: Clear message with actionable steps
- **GPS Unavailable**: Fallback to last known location
- **Network Issues**: Graceful degradation with offline support

### Database Operations
- **RLS Policy Conflicts**: Direct table access fallbacks
- **Connection Issues**: Retry logic with exponential backoff
- **Data Validation**: Client-side validation before API calls

## Authentication & Security

### Role-Based Access
- **Pilgrims**: Can create requests, view assigned volunteer
- **Volunteers**: Can accept assignments, view assigned pilgrims  
- **Admins**: Full system access and management

### RLS Policies
- Location data visible only to assignment participants
- Requests visible to creators and assigned volunteers
- Profiles have read access for all, write access for owners

## Real-time Features

### Location Updates
- 10-second background intervals
- Movement threshold: 25 meters
- Accuracy filter: < 100 meters
- Battery optimization with intelligent publishing

### Assignment Changes
- Real-time status updates via Supabase subscriptions
- Automatic UI refresh on assignment completion
- Cross-app consistency validation

## Configuration

### App Roles
```typescript
// Constants for role-based functionality
export const APP_ROLE = 'volunteer'; // or 'pilgrim', 'admin'
export const getCurrentRoleConfig = () => ({
  primaryColor: '#16A34A', // Green for volunteers
  counterpartRole: 'pilgrim',
  // ... other role-specific settings
});
```

### Environment Variables
- `EXPO_PUBLIC_SUPABASE_URL`: Database connection
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Public API key
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`: Maps integration
