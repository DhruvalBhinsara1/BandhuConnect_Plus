# BandhuConnect+ Component Documentation

## Overview

This document provides comprehensive documentation for the React Native components in BandhuConnect+, including context providers, services, and UI components with their current architecture and functionality.

## Context Providers

### AuthContext
**Location:** `src/context/AuthContext.tsx`

**Purpose:** Manages user authentication state and provides authentication methods throughout the app.

**Key Features:**
- User session management with Supabase Auth
- Role-based access control (volunteer/pilgrim/admin)
- Profile data management
- Authentication state persistence

**Context Value:**
```typescript
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signOut: () => Promise<void>;
}
```

### LocationContext
**Location:** `src/context/LocationContext.tsx`

**Purpose:** Handles device location services and real-time location tracking.

**Key Features:**
- Location permission management
- Background location tracking with Expo Location
- Real-time location updates
- Battery optimization with movement thresholds

### ChatContext
**Location:** `src/context/ChatContext.tsx`

**Purpose:** Manages chat functionality and real-time messaging.

**Key Features:**
- Real-time message synchronization
- Conversation management
- Typing indicators
- Message status tracking

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

## Core Components

### AuthDebugger
**Location:** `src/components/AuthDebugger.tsx`

**Purpose:** Development component for debugging authentication issues and user state.

**Key Features:**
- Real-time authentication state display
- User profile information debugging
- Session management tools
- Role verification utilities

### CustomSelector
**Location:** `src/components/CustomSelector.tsx`

**Purpose:** Reusable selection component with role-based styling.

**Key Features:**
- Customizable dropdown/picker interface
- Role-based theming
- Accessibility support
- Cross-platform compatibility

### Common Components
**Location:** `src/components/common/`

**Purpose:** Shared UI components used across different roles and screens.

**Key Components:**
- Loading indicators with role-based styling
- Error boundary components
- Reusable form elements
- Navigation components
- Status indicators

## Service Integration

### AssignmentService Integration
**Location:** `src/services/assignmentService.ts`

**Component Integration:**
- `hasActiveAssignment()`: Used by components to check assignment status
- `getActiveAssignments()`: Provides assignment data to UI components
- `updateAssignmentStatus()`: Handles "Mark Task Done" functionality
- Automatic repair service integration for data consistency

### Assignment Repair System
**Location:** `src/services/assignmentRepairService.ts`

**Component Integration:**
- Transparent operation - no UI disruption
- Automatic triggering when assignment visibility issues detected
- Detailed logging for debugging
- Silent error recovery

### Supabase Integration
**Location:** `src/services/supabase.ts`

**Component Integration:**
- Real-time subscriptions with graceful error handling
- Automatic reconnection without UI popups
- RLS policy compliance
- Cross-app data synchronization

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

## Architecture Patterns

### Error Handling Strategy
- Graceful degradation for network issues
- User-friendly error messages without technical jargon
- Silent reconnection for subscription failures
- Automatic repair for data inconsistencies

### State Management
- React Context API for global state
- Local component state for UI-specific data
- Real-time synchronization with Supabase
- Optimistic updates with rollback capability

### Role-Based Architecture
- Single codebase supporting multiple roles
- Configuration-driven role behavior
- Shared components with role-specific styling
- Conditional feature rendering based on user role

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

## Development Guidelines

### Component Development
- Use TypeScript for all components
- Implement proper error boundaries
- Follow role-based styling patterns
- Include accessibility features
- Handle loading and error states consistently

### Testing Approach
- Mock Supabase services for unit tests
- Test role-based component behavior
- Validate error handling and recovery
- Test real-time subscription management

### Integration Patterns
- Use Context providers for global state
- Implement service layer for business logic
- Follow consistent error handling patterns
- Maintain cross-app compatibility

## Current Implementation Status

### Completed Features
- ✅ Multi-role authentication with AuthContext
- ✅ Assignment system with automatic repair
- ✅ Real-time location tracking
- ✅ Cross-app data synchronization
- ✅ Error handling with graceful recovery
- ✅ Role-based component rendering

### Component Dependencies
- React Native 0.79.5
- Expo SDK 53
- Supabase client for real-time features
- React Context API for state management
- TypeScript for type safety

### Performance Optimizations

### Memory Management
- Proper cleanup in useEffect hooks
- Unsubscribe from real-time listeners
- Optimize re-renders with useMemo/useCallback

### Network Efficiency
- Batch location updates
- Implement request debouncing
- Cache frequently accessed data
- Silent error recovery without user disruption
