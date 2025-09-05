# BandhuConnect+ Setup Guide

This guide provides comprehensive setup instructions for the BandhuConnect+ React Native application with Expo SDK 53 and Supabase backend.

## Prerequisites

- Node.js 18+ 
- Expo CLI (`npm install -g @expo/cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, Mac only)
- Supabase account and project

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd BandhuConnect_Plus
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Update the `.env` file with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 3. Database Setup

Run the database setup scripts:

```bash
# Set up the main schema
psql -h your_supabase_host -U postgres -d postgres -f database/schema/current-schema.sql

# Add essential functions
psql -h your_supabase_host -U postgres -d postgres -f database/functions/consolidated-functions.sql

# Add test data (optional)
psql -h your_supabase_host -U postgres -d postgres -f database/testing/demo-data-setup.sql
```

### 4. Start Development Server

```bash
npx expo start
```

### 5. Run on Device/Emulator

Choose one of these options:

#### Option A: Expo Go App (Recommended for testing)
1. Install Expo Go on your phone from App Store/Play Store
2. Scan the QR code displayed in terminal
3. App will load on your device

#### Option B: Android Development
1. Start Android Studio and launch an emulator
2. Run `npx expo run:android`

#### Option C: iOS Development (Mac only)
1. Run `npx expo run:ios`

#### Option D: Web Development
1. Run `npx expo start --web`
2. Open `http://localhost:19006` in browser

### 6. Configure App Role

The app supports three different roles. Configure the role in `src/constants/appConfig.ts`:

```typescript
// For Volunteer App
export const APP_ROLE = 'volunteer';

// For Pilgrim App  
export const APP_ROLE = 'pilgrim';

// For Admin App
export const APP_ROLE = 'admin';
```

### 7. Google Maps Setup

Enable the following APIs in Google Cloud Console:
- Maps JavaScript API
- Maps SDK for Android
- Maps SDK for iOS
- Places API (if using place search)

Add your API key to the `.env` file and configure platform restrictions for security.

## Project Structure

```
BandhuConnect_Plus/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/         # Shared components
│   │   └── *.tsx           # Role-specific components
│   ├── context/            # React Context providers
│   │   ├── AuthContext.tsx # Authentication management
│   │   ├── LocationContext.tsx # Location tracking
│   │   └── ChatContext.tsx # Chat functionality
│   ├── services/           # API and business logic
│   │   ├── assignmentService.ts # Assignment operations
│   │   ├── assignmentRepairService.ts # Auto-repair system
│   │   └── supabase.ts     # Supabase client
│   ├── constants/          # App configuration
│   └── types/              # TypeScript definitions
├── database/
│   ├── schema/             # Database schema files
│   ├── functions/          # SQL functions
│   ├── testing/            # Test data scripts
│   └── maintenance/        # Maintenance scripts
├── docs/                   # Documentation
├── admin-dashboard/        # Separate admin web app
└── android/               # Android build configuration
```

## Testing the Application

### 1. Create Test Users

Use the Supabase dashboard or run the demo data setup:

```sql
-- Create test volunteer
INSERT INTO auth.users (id, email) VALUES ('volunteer-uuid', 'volunteer@test.com');
INSERT INTO profiles (id, name, email, role) VALUES ('volunteer-uuid', 'Test Volunteer', 'volunteer@test.com', 'volunteer');

-- Create test pilgrim
INSERT INTO auth.users (id, email) VALUES ('pilgrim-uuid', 'pilgrim@test.com');
INSERT INTO profiles (id, name, email, role) VALUES ('pilgrim-uuid', 'Test Pilgrim', 'pilgrim@test.com', 'pilgrim');
```

### 2. Test Core Features

1. **Authentication**: Sign up/sign in with different roles
2. **Location Tracking**: Enable location permissions and verify tracking
3. **Assignment System**: Create requests and test assignment flow
4. **Real-time Updates**: Test cross-app synchronization
5. **Error Handling**: Test offline scenarios and error recovery

## Troubleshooting

### Common Issues

**Assignment Visibility Problems:**
- Check database constraints and `is_active` flags
- Run assignment repair: The app includes automatic repair functionality
- Verify RLS policies in Supabase dashboard

**Location Tracking Issues:**
- Ensure location permissions are granted
- Check Google Maps API key configuration
- Verify PostGIS extension is enabled in Supabase

**Build Errors:**
- Clear Metro cache: `npx expo start --clear`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Expo SDK compatibility

**Subscription Errors:**
- The app includes graceful reconnection logic
- Check Supabase project status and connection
- Verify real-time is enabled in Supabase dashboard

### Getting Help

- Check the `docs/guides/` directory for specific feature guides
- Review `database/testing/` for debugging scripts
- Use the built-in `AuthDebugger` component for authentication issues

## Production Deployment

### Mobile Apps
```bash
# Build for production
eas build --platform all

# Submit to app stores
eas submit --platform all
```

### Web Dashboard
```bash
cd admin-dashboard
npm run build
# Deploy to your preferred hosting service
```

## Next Steps

Your BandhuConnect+ application is now configured with:
- ✅ Modern React Native architecture with Expo SDK 53
- ✅ Robust assignment system with automatic repair
- ✅ Real-time synchronization with error recovery
- ✅ Cross-platform compatibility
- ✅ Production-ready database schema

Refer to the component and API documentation for detailed development guidance.
