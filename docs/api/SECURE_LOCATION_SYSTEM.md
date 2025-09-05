# Secure Location Tracking System - Implementation Guide

## Overview

This document outlines the complete rebuild of the BandhuConnect+ location tracking system, designed with security, privacy, and role separation as core principles.

## Architecture

### Core Principles Implemented

1. **Role Separation**: Each app build is hardcoded as pilgrim or volunteer
2. **Data Modeling**: Three logical entities - Users, Assignments, Locations
3. **Security via RLS**: Row Level Security enforces strict privacy rules
4. **Location Publishing**: Smart rules for battery efficiency and accuracy
5. **User Experience**: Clean UI without permission nagging

## Database Schema

### New Secure Schema (`database/secure-location-schema.sql`)

```sql
-- Three core tables with strict RLS policies
CREATE TABLE users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pilgrim_id UUID NOT NULL REFERENCES users(id),
    volunteer_id UUID NOT NULL REFERENCES users(id),
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE locations (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
    latitude NUMERIC(10,8) NOT NULL,
    longitude NUMERIC(11,8) NOT NULL,
    accuracy NUMERIC(10,2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Security Features

- **Strict RLS Policies**: Users only see their own data + assigned counterpart
- **Role Validation**: Database constraints ensure valid pilgrim-volunteer pairings
- **Automatic Cleanup**: 30-day retention policy for old location data
- **Helper Functions**: Secure database functions for common queries

## App Configuration

### Role Separation (`src/constants/appRole.ts`)

```typescript
// Hardcoded per build - prevents role confusion
export const APP_ROLE: AppRole = 'volunteer'; // Change per build

export const ROLE_CONFIG = {
  pilgrim: {
    appName: 'BandhuConnect+ Pilgrim',
    primaryColor: '#DC2626', // Red
    markerIcon: '🔴',
    counterpartRole: 'volunteer'
  },
  volunteer: {
    appName: 'BandhuConnect+ Volunteer', 
    primaryColor: '#16A34A', // Green
    markerIcon: '🟢',
    counterpartRole: 'pilgrim'
  }
};
```

### Build Configurations

- **Pilgrim Build**: `app.config.pilgrim.js` - Red theme, pilgrim role
- **Volunteer Build**: `app.config.volunteer.js` - Green theme, volunteer role

## Services

### Secure Location Service (`src/services/secureLocationService.ts`)

**Publishing Rules**:
- Publishes every 10 seconds OR 25+ meter movement
- Validates user role matches app build
- Handles permissions progressively (foreground first)
- Battery-efficient with accuracy filtering

**Key Features**:
- Role validation before any location operations
- Smart movement detection to avoid spam
- Graceful permission handling
- Automatic retry logic

### Secure Map Service (`src/services/secureMapService.ts`)

**Location Retrieval**:
- Own location: Direct from device GPS
- Counterpart location: From secure database via RLS
- Real-time updates via Supabase subscriptions
- Stale location detection (2+ minutes)

**Security Features**:
- Uses database functions with RLS enforcement
- Only fetches data user is authorized to see
- Validates assignment relationships
- Handles missing assignments gracefully

## User Interface

### Secure Map Screen (`src/screens/shared/SecureMapScreen.tsx`)

**Two-Marker System**:
- **Self Marker**: Red (pilgrim) or Green (volunteer) with accuracy circle
- **Counterpart Marker**: Opposite color, shows "last seen" if stale

**UI Components**:
- Status chip showing tracking state
- Floating action buttons (Show Me, Fit Frame, Refresh)
- Location info panel with real-time status
- No assignment message when not paired

**UX Features**:
- No permission nagging after initial request
- Clear visual feedback for stale locations
- Graceful handling of offline states
- Role-specific theming and messaging

### Permission Manager (`src/components/PermissionManager.tsx`)

**Progressive Permission Requests**:
1. Explains why location is needed
2. Requests foreground permission first
3. Shows rationale if denied
4. Guides to settings if permanently denied
5. Never repeatedly nags users

## Integration

### Secure Location Context (`src/context/SecureLocationContext.tsx`)

**Centralized State Management**:
- Manages location data, assignments, and tracking state
- Handles authentication state changes
- Provides actions for UI components
- Error handling and recovery

**Auto-initialization**:
- Starts on user authentication
- Validates role consistency
- Checks for active assignments
- Begins tracking if permissions granted

## Deployment Steps

### 1. Database Migration

```sql
-- Deploy the new secure schema
\i database/secure-location-schema.sql

-- Migrate existing data (if needed)
-- Create initial assignments
-- Set up user roles
```

### 2. App Configuration

```bash
# For pilgrim build
cp app.config.pilgrim.js app.config.js
# Update src/constants/appRole.ts to set APP_ROLE = 'pilgrim'

# For volunteer build  
cp app.config.volunteer.js app.config.js
# Update src/constants/appRole.ts to set APP_ROLE = 'volunteer'
```

### 3. Component Integration

```typescript
// Replace existing MapScreen with SecureMapScreen
import SecureMapScreen from '../screens/shared/SecureMapScreen';

// Wrap app with SecureLocationProvider
import { SecureLocationProvider } from '../context/SecureLocationContext';

export default function App() {
  return (
    <SecureLocationProvider>
      {/* Your app components */}
    </SecureLocationProvider>
  );
}
```

## Security Guarantees

### Data Privacy
- Users cannot see locations of unassigned users
- RLS policies enforced at database level
- Location history automatically purged after 30 days
- No bulk data access possible

### Role Integrity
- App role hardcoded at build time
- Database validates role consistency
- Prevents identity confusion
- Clear visual distinction between roles

### Permission Handling
- Progressive permission requests with clear rationale
- No repeated nagging after denial
- Graceful degradation when permissions unavailable
- User-friendly error messages

## Expected Behavior

### Pilgrim App
- Shows red self marker with accuracy circle
- Shows green volunteer marker (live or "last seen X min ago")
- Publishes location every 10s or 25m movement
- Only sees assigned volunteer's location

### Volunteer App  
- Shows green self marker with accuracy circle
- Shows red pilgrim marker (live or "last seen X min ago")
- Publishes location every 10s or 25m movement
- Only sees assigned pilgrim's location

### Both Apps
- Clean UI without permission nagging
- Real-time location updates via subscriptions
- Automatic reconnection on network issues
- Clear assignment status display
- Battery-efficient location tracking

## Testing Checklist

- [ ] Role validation prevents cross-app usage
- [ ] RLS policies block unauthorized data access
- [ ] Location publishing follows 10s/25m rules
- [ ] Stale locations show "last seen" timestamps
- [ ] Permission flow doesn't repeatedly nag
- [ ] Real-time updates work for counterpart locations
- [ ] Map centers correctly on self location
- [ ] Assignment status displays correctly
- [ ] Offline/online transitions handled gracefully
- [ ] Database cleanup removes old location data

## Troubleshooting

### Common Issues
1. **Role Mismatch**: Ensure APP_ROLE matches user's database role
2. **No Assignment**: User needs active assignment in database
3. **Permission Denied**: Guide user to device settings
4. **Stale Locations**: Check network connectivity and database functions
5. **Missing Markers**: Verify RLS policies and assignment relationships

This system provides a secure, privacy-focused location tracking solution that prevents data leakage while maintaining excellent user experience.
