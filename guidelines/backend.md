# BandhuConnect+ Backend Guidelines: Hackathon MVP (Descriptive)

This guideline provides a focused and detailed approach to building the backend for your BandhuConnect+ MVP within a hackathon timeframe. It prioritizes core functionality, rapid development, and essential security using the Supabase stack.

## Architectural Principles (MVP Focus)

- Focus on delivering functional core user journeys: volunteer sign-up, task display, chat, pilgrim requests, admin views.
- Rapid development by leveraging Supabase client SDK and built-in services.
- Basic scalability and reliability through Supabase-managed PostgreSQL and Auth.
- Essential security via Row Level Security (RLS) and authentication.

## Tech Stack & Services (Leveraging Supabase for MVP)

### 2.1 Database (PostgreSQL via Supabase)

- Define tables: `users`, `requests`, `volunteer_tasks`, `messages`.
- Employ proper data types including UUIDs for IDs and geography type for location.
- Apply indexing on Foreign Keys and frequently filtered columns.
- Implement Row Level Security policies meticulously:
  - Users can only access their own profile.
  - Pilgrims can only access their own requests.
  - Volunteers have access limited to their assigned tasks.
  - Admin roles have elevated access.

### 2.2 Authentication (Supabase Auth)

- Implement sign-up and login for all roles using Phone OTP or Email/Password.
- Assign roles via an enum column ('volunteer', 'admin', 'pilgrim').
- Manage JWT tokens securely, handled automatically by Supabase.

### 2.3 Real-time (Supabase Realtime)

- Enable real-time triggers for:
  - New pilgrim requests visible to admins immediately.
  - Volunteer task assignment updates seen instantly.
  - General chat messages shown live.

- Start with simple channels such as `chat_general` and `admin_requests`.

### 2.4 File Storage (Supabase Storage)

- Create dedicated storage buckets (e.g., `user-uploads`) for:
  - Lost child photos.
  - Sanitation issue images.
- Enforce Storage policies:
  - Authenticated uploads only.
  - Access restricted to relevant users/admins.

### 2.5 Backend Logic (Supabase Edge Functions / Basic Server Logic)

- Task assignment will be basic:
  - Assign hardcoded or first available volunteers with required skills.
- Deliver notifications on task assignments (optional).
- Implement basic validation on critical fields server-side.

## API Design (MVP Focus)

- Direct interaction through `@supabase/supabase-js` client from React Native apps.
- CRUD operations for users, requests, volunteer_tasks, and messages.
- Error handling with simple UI alerts for failure cases.

## Security Considerations (MVP Essentials)

- Row Level Security is critical.
- Secure storage of environment variables via `.env` or Expo Constants.
- HTTPS enabled by default through Supabase.
- Authentication flow secure and reliable.

## Deployment & Operations (Hackathon Level)

- Setup Supabase project, tables, and RLS policies.
- Deploy frontend apps on Expo EAS Builds or local development.
- Manually test core user flows on devices and emulators.
- Debug backend errors through Supabase logs and frontend logs.

---

Following these updated backend guidelines optimized for the hackathon and Supabase stack will ensure a secure, functional MVP backend integrating smoothly with the React Native frontend on Expo SDK 53.

## Updated for Current Project State (2025-09-04)

This guideline reflects the actual current state of our backend and provides a realistic path forward for hackathon success.

## Current Backend Status

### ✅ COMPLETED & WORKING:
- **Database Schema**: Consolidated, production-ready PostgreSQL schema
- **Authentication**: Supabase Auth with role-based access (volunteer, admin, pilgrim)
- **Row Level Security**: Comprehensive RLS policies implemented
- **Core Tables**: Profiles, assistance_requests, assignments, user_locations
- **Error Handling**: Graceful degradation in location services
- **Auto-assignment**: Skill matching and workload balancing functions

### ⚠️ NEEDS VALIDATION:
- **Real-time Subscriptions**: Code exists, needs end-to-end testing
- **Location Tracking**: Error handling improved, needs device testing
- **Cross-app Integration**: Individual components work, full flow needs testing

## Database Schema (Current Implementation Status)

### Current Implementation Status
- ✅ **Consolidated Schema**: Single source of truth in `database/consolidated-schema.sql`
- ✅ **Essential Functions**: Core operations in `database/consolidated-functions.sql`
- ✅ **RLS Policies**: Comprehensive row-level security implemented
- ✅ **Real-time Support**: Supabase realtime subscriptions configured
- ✅ **Cleanup Complete**: Removed 30+ obsolete migration files

### Core Tables (Production Ready)

#### Profiles (User Management)
```sql
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    role user_role NOT NULL DEFAULT 'pilgrim',
    avatar_url TEXT,
    skills TEXT[], -- Array of skills for volunteers
    location GEOGRAPHY(POINT, 4326), -- Current location
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    volunteer_status volunteer_status DEFAULT 'offline',
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_ratings INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Assistance Requests (Core Functionality)
```sql
CREATE TABLE assistance_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    type request_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority priority_level DEFAULT 'medium',
    status request_status DEFAULT 'pending',
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    address TEXT,
    photo_url TEXT,
    estimated_duration INTEGER, -- in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Assignments (Task Management)
```sql
CREATE TABLE assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id UUID REFERENCES assistance_requests(id) ON DELETE CASCADE NOT NULL,
    volunteer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    status assignment_status DEFAULT 'pending',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(request_id, volunteer_id)
);
```

#### User Locations (Real-time Tracking)
```sql
CREATE TABLE user_locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    latitude NUMERIC(10,8) NOT NULL,
    longitude NUMERIC(11,8) NOT NULL,
    accuracy NUMERIC(10,2),
    altitude NUMERIC(10,2),
    heading NUMERIC(5,2),
    speed NUMERIC(10,2),
    is_active BOOLEAN DEFAULT true,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);
```

## Essential Functions (Implemented)

### Auto-Assignment System
```sql
-- Enhanced auto-assignment with skill matching
CREATE OR REPLACE FUNCTION auto_assign_request_enhanced(
    p_request_id UUID,
    p_max_distance_km DECIMAL DEFAULT 15.0,
    p_min_match_score DECIMAL DEFAULT 0.6
)
-- Returns assignment details with match score
```

### Location Tracking Functions
```sql
-- Bi-directional location visibility
CREATE OR REPLACE FUNCTION get_pilgrim_locations_for_volunteer(volunteer_user_id UUID)
CREATE OR REPLACE FUNCTION get_volunteer_locations_for_pilgrim(pilgrim_user_id UUID)
CREATE OR REPLACE FUNCTION get_all_locations_for_admin()
```

### Bulk Operations
```sql
-- Admin bulk completion
CREATE OR REPLACE FUNCTION bulk_mark_requests_completed(admin_user_id UUID)
-- Batch auto-assignment
CREATE OR REPLACE FUNCTION batch_auto_assign_requests(p_max_assignments INTEGER)
```

## Hackathon-Ready Backend Strategy

### IMMEDIATE PRIORITIES (Next 24 Hours):
1. **Test Database Functions**: Verify all functions work in Supabase
2. **Validate RLS Policies**: Ensure security works across all roles
3. **Test Real-time**: Verify subscriptions work on mobile devices
4. **Create Demo Data**: Realistic test scenarios for presentation

### DEMO-SAFE FALLBACKS:
1. **Static Data**: Pre-populated database for reliable demo
2. **Polling Fallback**: If real-time fails, fall back to periodic updates
3. **Hardcoded Coordinates**: For location demo if GPS fails
4. **Admin Dashboard**: Focus on what definitely works

### TECHNICAL DEBT TO IGNORE (For Hackathon):
- Advanced caching strategies
- Performance optimization beyond basics
- Complex error recovery
- Comprehensive logging
- Advanced analytics

## Security Implementation (Current)

### Row Level Security Policies (Implemented):
```sql
-- Users can view relevant locations based on assignments
CREATE POLICY "Users can view relevant locations" ON user_locations FOR SELECT USING (
    auth.uid() = user_id OR
    -- Volunteers see assigned pilgrims
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'volunteer') AND
     EXISTS (SELECT 1 FROM assignments a JOIN assistance_requests ar ON a.request_id = ar.id 
             WHERE a.volunteer_id = auth.uid() AND ar.user_id = user_locations.user_id)) OR
    -- Pilgrims see assigned volunteers  
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'pilgrim') AND
     EXISTS (SELECT 1 FROM assignments a JOIN assistance_requests ar ON a.request_id = ar.id 
             WHERE ar.user_id = auth.uid() AND a.volunteer_id = user_locations.user_id)) OR
    -- Admins see everything
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

## API Integration (Current)

### Service Layer Structure:
```typescript
// services/
├── authService.ts      ✅ Working
├── profileService.ts   ✅ Working  
├── requestService.ts   ✅ Working
├── assignmentService.ts ✅ Working
├── locationService.ts  ✅ Fixed error handling
├── mapService.ts       ⚠️ Needs testing
└── chatService.ts      ❌ Not implemented
```

### Error Handling Pattern (Implemented):
```typescript
// Graceful error handling with user-friendly messages
try {
  const result = await supabase.from('table').select();
  if (result.error) throw result.error;
  return { data: result.data, error: null };
} catch (error) {
  return { 
    data: null, 
    error: getUserFriendlyMessage(error) 
  };
}
```

## Deployment Strategy (Hackathon)

### Database Setup:
1. Run `database/consolidated-schema.sql` in Supabase
2. Run `database/consolidated-functions.sql` in Supabase
3. Create demo data using `database/create-demo-accounts.md`
4. Test all functions work correctly

### Environment Configuration:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key
```

### Testing Checklist:
- [ ] Authentication works for all roles
- [ ] RLS policies prevent unauthorized access
- [ ] Auto-assignment functions work
- [ ] Location updates save correctly
- [ ] Real-time subscriptions trigger
- [ ] Admin bulk operations work

---

**This backend is hackathon-ready with solid foundations. Focus on testing and polishing the demo rather than adding new features.**
