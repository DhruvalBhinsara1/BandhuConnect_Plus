# BandhuConnect+ Database Schema Documentation

## Overview

This document provides comprehensive documentation for the BandhuConnect+ PostgreSQL database schema. The database has been cleaned and only contains the essential admin user data.

## Current Database State

**🔄 Last Updated**: September 6, 2025  
**📊 Current State**: Clean database with admin user only  
**👤 Admin User**: dhruvalbhinsara460@gmail.com  
**🧹 Cleanup Status**: All test/demo data removed via nuclear cleanup

## Database Configuration

- **Database Engine**: PostgreSQL with PostGIS extension
- **Extensions**: `uuid-ossp`, `postgis`
- **Security**: Row Level Security (RLS) enabled
- **Real-time**: Supabase Realtime subscriptions

## Nuclear Cleanup Information

The database has been cleaned using the nuclear cleanup script (`database/nuclear_cleanup.sql`) which:

- ✅ Preserves admin user data
- ❌ Removes all other users, requests, assignments, messages
- 🔄 Maintains schema structure and constraints
- 📊 Results in clean state ready for production

## Core Schema Structure

### Current Tables

1. **profiles** - User profiles (1 admin record)
2. **users** - Basic user data (1 admin record)
3. **assistance_requests** - Help requests (0 records)
4. **assignments** - Volunteer assignments (0 records)
5. **user_locations** - Location tracking (0 records)

### Additional Tables (Schema Ready)

- **notifications** - System notifications
- **chat_channels** - Communication channels
- **chat_messages** - Message history
- **direct_messages** - Private messaging
- **location_updates** - Location history
- **locations** - Static location data
- **user_devices** - Device management

## Custom Types

```sql
-- User roles
CREATE TYPE user_role AS ENUM ('pilgrim', 'volunteer', 'admin');

-- Volunteer availability status
CREATE TYPE volunteer_status AS ENUM ('available', 'busy', 'offline');

-- Request status lifecycle
CREATE TYPE request_status AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled');

-- Assignment status lifecycle
CREATE TYPE assignment_status AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');

-- Request categories
CREATE TYPE request_type AS ENUM ('medical', 'navigation', 'emergency', 'general', 'food', 'accommodation');

-- Priority levels
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
```

## Core Tables

### profiles

Main user data table extending Supabase Auth users.

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'pilgrim',
    volunteer_status volunteer_status DEFAULT 'offline',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Current State**: 1 record (admin user)  
**Key Features:**

- Links to Supabase Auth users
- Role-based access control
- Volunteer status tracking
- Soft delete with `is_active` flag

### users

Basic user data table (may be redundant with profiles).

**Current State**: 1 record (admin user)  
**Note**: This table exists but may need consolidation with profiles table

### user_locations

Real-time location tracking for all users.

```sql
CREATE TABLE user_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(8, 2),
    altitude DECIMAL(8, 2),
    heading DECIMAL(5, 2),
    speed DECIMAL(5, 2),
    is_active BOOLEAN DEFAULT true,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);
```

**Current State**: 0 records (cleaned)  
**Key Features:**

- One active location per user (UNIQUE constraint)
- High precision coordinates (8 decimal places)
- GPS metadata (accuracy, altitude, heading, speed)
- Real-time updates with timestamp tracking

### assistance_requests

Pilgrim requests for assistance.

```sql
CREATE TABLE assistance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type request_type NOT NULL DEFAULT 'general',
    priority priority_level NOT NULL DEFAULT 'medium',
    status request_status NOT NULL DEFAULT 'pending',
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    location_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Current State**: 0 records (cleaned)  
**Key Features:**

- Categorized request types
- Priority-based handling
- Location data for request context
- Status lifecycle tracking

### assignments

Volunteer-pilgrim assignment relationships.

```sql
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES assistance_requests(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status assignment_status NOT NULL DEFAULT 'pending',
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    UNIQUE(request_id)
);
```

**Current State**: 0 records (cleaned)  
**Key Features:**

- One assignment per request (UNIQUE constraint)
- Status lifecycle with timestamps
- Links volunteers to assistance requests

## Additional Tables (Schema Ready)

The following tables exist in the schema but are currently empty after cleanup:

- **notifications** - System and user notifications
- **chat_channels** - Communication channels for coordination
- **chat_messages** - Message history within channels
- **direct_messages** - Private messaging between users
- **location_updates** - Historical location tracking
- **locations** - Static location reference data
- **user_devices** - Device registration and push notifications

## Database Maintenance

### Nuclear Cleanup Script

Location: `database/nuclear_cleanup.sql`

This script provides a safe way to completely reset the database while preserving the admin user. Use it for:

- Development environment resets
- Removing test data
- Production maintenance (with extreme caution)

### Admin User Information

- **Email**: dhruvalbhinsara460@gmail.com
- **Role**: admin
- **Status**: Active and preserved through all cleanup operations
  updated_at TIMESTAMPTZ DEFAULT NOW()
  );

````

**Key Features:**
- Links to Supabase Auth users
- Role-based access control
- Volunteer status tracking
- Soft delete with `is_active` flag

### user_locations
Real-time location tracking for all users.

```sql
CREATE TABLE user_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(8, 2),
    altitude DECIMAL(8, 2),
    heading DECIMAL(5, 2),
    speed DECIMAL(5, 2),
    is_active BOOLEAN DEFAULT true,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);
````

**Key Features:**

- One active location per user (UNIQUE constraint)
- High precision coordinates (8 decimal places)
- GPS metadata (accuracy, altitude, heading, speed)
- Real-time updates with timestamp tracking

### assistance_requests

Pilgrim requests for assistance.

```sql
CREATE TABLE assistance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type request_type NOT NULL DEFAULT 'general',
    priority priority_level NOT NULL DEFAULT 'medium',
    status request_status NOT NULL DEFAULT 'pending',
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    location_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Features:**

- Categorized request types
- Priority-based handling
- Location data for request context
- Status lifecycle tracking

### assignments

Volunteer-pilgrim assignment relationships.

```sql
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES assistance_requests(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status assignment_status NOT NULL DEFAULT 'pending',
    is_active BOOLEAN DEFAULT true,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    UNIQUE(request_id),
    UNIQUE(volunteer_id, is_active) WHERE is_active = true
);
```

**Key Features:**

- One assignment per request (UNIQUE constraint)
- Prevents duplicate active assignments per volunteer
- Status lifecycle with timestamps
- `is_active` flag for constraint management

## Database Functions

### Location Management

#### `update_user_location()`

Updates or inserts user location with conflict resolution.

```sql
CREATE OR REPLACE FUNCTION update_user_location(
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_accuracy DECIMAL DEFAULT NULL,
    p_altitude DECIMAL DEFAULT NULL,
    p_heading DECIMAL DEFAULT NULL,
    p_speed DECIMAL DEFAULT NULL
) RETURNS UUID
```

**Usage:** Real-time location updates from mobile apps

#### `get_assignment_locations()`

Retrieves location data for users involved in active assignments.

**Usage:** Map display with assignment-based visibility

#### `deactivate_user_location()`

Marks user location as inactive when going offline.

**Usage:** Clean up location data when users disconnect

### Assignment Management

#### Assignment Status Constants

```typescript
export const ACTIVE_ASSIGNMENT_STATUSES = [
  "pending",
  "accepted",
  "in_progress",
] as const;
```

#### Automatic Repair System

- Built-in repair service handles data inconsistencies
- Triggered when assignment visibility issues detected
- Repairs orphaned assignments and missing data
- Silent operation with detailed logging

## Row Level Security (RLS) Policies

### profiles

- **SELECT**: All users can view all profiles
- **UPDATE**: Users can only update their own profile

### user_locations

- **SELECT**: Users can view their own location + assignment counterparts
- **UPDATE/INSERT**: Users can only manage their own location

### assistance_requests

- **SELECT**: Creators and assigned volunteers can view requests
- **ALL**: Pilgrims can manage their own requests

### assignments

- **SELECT**: Volunteers and request creators can view relevant assignments
- **UPDATE**: Volunteers can update their own assignments

## Performance Optimizations

### Indexes

```sql
-- Role-based queries
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_volunteer_status ON profiles(volunteer_status);

-- Location queries
CREATE INDEX idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX idx_user_locations_active ON user_locations(is_active);

-- Request queries
CREATE INDEX idx_assistance_requests_status ON assistance_requests(status);
CREATE INDEX idx_assistance_requests_user_id ON assistance_requests(user_id);

-- Assignment queries
CREATE INDEX idx_assignments_volunteer_id ON assignments(volunteer_id);
CREATE INDEX idx_assignments_request_id ON assignments(request_id);
CREATE INDEX idx_assignments_status ON assignments(status);
```

### Query Patterns

- Location visibility based on active assignments
- Role-based data filtering
- Status-based assignment filtering
- Real-time subscription optimization

## Data Consistency Features

### Assignment System Architecture

- **Unique Constraints**: Prevent duplicate assignments
- **Status Management**: Proper lifecycle handling
- **Automatic Repair**: Built-in data consistency checks
- **Cross-App Validation**: Changes validated across all apps

### Error Handling

- Graceful constraint violation handling
- Automatic repair for orphaned data
- Silent error recovery without user disruption
- Detailed logging for debugging

## Migration and Maintenance

### Schema Updates

- Use migration scripts in `database/migrations/`
- Test schema changes in development environment
- Backup data before production migrations

### Data Maintenance

- Regular cleanup of inactive locations
- Assignment status consistency checks
- Performance monitoring and optimization

### Testing Data

- Demo data setup scripts in `database/testing/`
- Test user creation and assignment scenarios
- Validation queries for data integrity

## Security Considerations

### Data Protection

- RLS policies enforce role-based access
- Location data visible only to assignment participants
- User profile data protected with proper permissions

### API Security

- Supabase Auth integration
- JWT token validation
- Rate limiting on database functions

## Real-time Features

### Subscription Patterns

- Location updates for active assignments
- Assignment status changes
- Request status updates
- Cross-app synchronization

### Performance

- Filtered subscriptions to reduce bandwidth
- Graceful reconnection on connection loss
- Optimized query patterns for real-time data

## Current Implementation Status

### Completed Features

- ✅ Complete schema with all required tables
- ✅ RLS policies for data security
- ✅ Assignment system with automatic repair
- ✅ Real-time location tracking
- ✅ Status lifecycle management
- ✅ Performance optimizations with indexes

### Database Dependencies

- PostgreSQL with PostGIS extension
- Supabase for real-time subscriptions
- UUID generation for primary keys
- Timestamp tracking for audit trails

This schema supports the full BandhuConnect+ application with robust data consistency, security, and real-time capabilities.
