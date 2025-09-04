# BandhuConnect+ Component Documentation

## Core Components

### SecureMapScreen
**Location:** `src/screens/shared/SecureMapScreen.tsx`

**Purpose:** Main map interface with real-time location tracking and assignment visualization.

**Key Features:**
- 200m precision zoom for "Show Me" button
- Auto-fade task completion notifications (4-second display)
- Interactive marker legends
- Privacy controls (hides counterpart after completion)
- Symmetrical functionality for all user types

**Props:** None (uses context for state management)

**State:**
```typescript
interface TrackingState {
  isActive: boolean;
  hasPermissions: boolean;
  hasAssignment: boolean;
  counterpartName?: string;
  showCompletedStatus?: boolean;
}
```

**Key Methods:**
- `centerOnSelf()`: Centers map on user location with 200m zoom
- `fitAllMarkers()`: Adjusts view to show all visible markers
- `renderMapLegend()`: Displays marker identification legend

### TaskList
**Location:** `src/screens/volunteer/TaskList.tsx`

**Purpose:** Displays volunteer assignments with proper task details and status management.

**Features:**
- Shows task titles from `assistance_requests.title`
- Priority level indicators with color coding
- Status filtering (All/Active/Completed)
- Pull-to-refresh functionality
- Error handling for missing data

**Props:**
```typescript
interface TaskListProps {
  assignments: Assignment[];
  onRefresh: () => void;
  isRefreshing: boolean;
}
```

### RequestContext
**Location:** `src/context/RequestContext.tsx`

**Purpose:** Manages assignment state and provides data to components.

**Key Functions:**
- `fetchAssignments()`: Retrieves user assignments with proper error handling
- `refreshAssignments()`: Force refresh with loading states
- Assignment status tracking and updates

**Context Value:**
```typescript
interface RequestContextValue {
  assignments: Assignment[];
  isLoading: boolean;
  error: string | null;
  refreshAssignments: () => Promise<void>;
}
```

## Service Components

### SecureMapService
**Location:** `src/services/secureMapService.ts`

**Core Methods:**

#### `getOwnLocationCenter()`
Returns map region for user's location with 200m zoom radius.
```typescript
async getOwnLocationCenter(): Promise<{
  latitude: number;
  longitude: number;
  latitudeDelta: number; // 0.0036 for 200m radius
  longitudeDelta: number;
} | null>
```

#### `getAllRelevantLocations()`
Retrieves locations for active assignments with privacy controls.
- Always includes own location
- Includes counterpart only if assignment is active and not completed
- Implements post-completion privacy

#### `getAssignmentStatus()`
Checks current assignment status and counterpart information.

### SecureLocationService
**Location:** `src/services/secureLocationService.ts`

**Background Location Tracking:**

#### `initializeTracking()`
- Progressive permission requests
- Role validation against app configuration
- Background task setup

#### `publishLocation()`
- Updates `user_locations` table directly (avoids RLS recursion)
- Movement threshold and accuracy filtering
- Battery optimization strategies

## UI Components

### Common Patterns

#### Error Handling
All components implement consistent error handling:
```typescript
// User-friendly error messages
Alert.alert(
  'Location Error',
  'Unable to access your location. Please check your location permissions and try again.',
  [{ text: 'OK', style: 'default' }]
);
```

#### Loading States
Consistent loading indicators across components:
```typescript
if (isLoading) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={roleConfig.primaryColor} />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}
```

#### Role-based Styling
Components adapt to user roles:
```typescript
const roleConfig = getCurrentRoleConfig();
// Use roleConfig.primaryColor for theming
```

## Animation Components

### Auto-fade Notifications
**Implementation:** Uses `Animated.Value` for smooth transitions

```typescript
const fadeAnim = useRef(new Animated.Value(1)).current;

// Fade out after 4 seconds
setTimeout(() => {
  Animated.timing(fadeAnim, {
    toValue: 0,
    duration: 1000,
    useNativeDriver: true,
  }).start();
}, 4000);
```

### Map Animations
Smooth map transitions for better UX:
```typescript
mapRef.current?.animateToRegion(region, 1000); // 1 second animation
```

## Context Providers

### AuthContext
Manages user authentication and role information.

### LocationContext  
Handles device location services and permissions.

### MapContext
Manages map state and location data for assignments.

## Styling Patterns

### Consistent Design System
- **Colors:** Role-based primary colors with consistent secondary palette
- **Typography:** Standardized font sizes and weights
- **Spacing:** Consistent margins and padding using multiples of 4/8
- **Shadows:** Uniform shadow styles for cards and overlays

### Responsive Design
Components adapt to different screen sizes:
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  // Responsive breakpoints handled via Dimensions API
});
```

## Testing Considerations

### Component Testing
- Mock location services for consistent testing
- Test error states and loading conditions
- Validate role-based functionality

### Integration Testing
- Cross-component communication via contexts
- Real-time update propagation
- Assignment state synchronization

## Performance Optimizations

### Memory Management
- Proper cleanup in useEffect hooks
- Unsubscribe from real-time listeners
- Optimize re-renders with useMemo/useCallback

### Network Efficiency
- Batch location updates
- Implement request debouncing
- Cache frequently accessed data
