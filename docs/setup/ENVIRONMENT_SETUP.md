# Environment Setup Guide

This guide provides complete setup instructions for BandhuConnect+ development environment.

## 📋 Prerequisites

- **Node.js**: Version 18+ 
- **npm/yarn**: Latest version
- **Expo CLI**: `npm install -g @expo/cli`
- **Supabase Account**: [supabase.com](https://supabase.com)
- **Google Maps API Key**: For maps functionality

## 🔧 Environment Variables

### Main App (.env)
Create `.env` file in project root:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://ywntkafcfuugzgcduekj.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Maps API
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# App Configuration
EXPO_PUBLIC_APP_NAME=BandhuConnect+
EXPO_PUBLIC_APP_VERSION=1.0.0
```

### Admin Dashboard (.env)
Create `admin-dashboard/.env` file:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://ywntkafcfuugzgcduekj.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Configuration
REACT_APP_NAME=BandhuConnect+ Admin
REACT_APP_VERSION=1.0.0
```

## 🚀 Installation Steps

### 1. Clone and Install Dependencies
```bash
# Clone repository
git clone <repository-url>
cd BandhuConnect_Plus

# Install main app dependencies
npm install

# Install admin dashboard dependencies
cd admin-dashboard
npm install
cd ..
```

### 2. Database Setup
1. Create new Supabase project
2. Run schema setup:
   ```sql
   -- Execute contents of database/schema.sql
   -- Execute contents of supabase/schema.sql
   -- Execute contents of database/functions.sql
   ```
3. Configure Row Level Security policies
4. Set up Storage buckets for image uploads

### 3. Google Maps Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable Maps SDK for Android/iOS
3. Create API key with proper restrictions
4. Add key to environment variables

## 🏃‍♂️ Running the Applications

### Mobile App (React Native + Expo)
```bash
# Start development server
npx expo start

# Platform-specific runs
npx expo start --ios      # iOS Simulator
npx expo start --android  # Android Emulator
npx expo start --web      # Web browser
```

### Admin Dashboard (React Web App)
```bash
cd admin-dashboard
npm start
# Opens at http://localhost:3000
```

## 📱 Testing Options

### Mobile Testing
- **Expo Go**: Install app, scan QR code (recommended for development)
- **iOS Simulator**: Requires Xcode on macOS
- **Android Emulator**: Requires Android Studio
- **Physical Device**: Use Expo Go or development build

### Web Testing
- **Desktop**: Any modern browser at localhost:3000
- **Mobile Web**: Responsive design works on mobile browsers

## 🔒 Security Configuration

### Supabase RLS Policies
Ensure these policies are active:
- Users can only see relevant location data based on assignments
- Proper role-based access control for all tables
- Secure image upload with file validation

### API Keys Security
- Never commit API keys to version control
- Use environment variables for all sensitive data
- Restrict Google Maps API key to specific domains/apps

## 🗺️ Real-Time Location Features

### Required Permissions
- **Foreground Location**: Required for basic tracking
- **Background Location**: Optional for continuous tracking
- **Camera**: For image uploads in requests

### Map Functionality
- **Role-based Markers**: 
  - 🔴 Red person (Pilgrims)
  - 🟢 Green shield (Volunteers) 
  - 🔵 Blue star (Admins)
- **Live Updates**: Real-time location synchronization via Supabase
- **Smart Navigation**: "Show Me" and "Fit in Frame" controls

## 🛠️ Troubleshooting

### Common Issues

**Metro bundler connection errors:**
- Use Expo Go app instead of direct browser access
- Ensure phone and computer on same WiFi network

**Location not updating:**
- Check location permissions in device settings
- Verify Supabase connection and RLS policies
- Ensure location tracking is started in app

**Build errors:**
- Run `npm install` in both directories
- Clear Metro cache: `npx expo start --clear`
- Check Node.js version compatibility

**Database connection issues:**
- Verify Supabase URL and anon key
- Check RLS policies are properly configured
- Ensure user has proper role assigned

### Performance Optimization
- Enable Hermes for Android builds
- Use development builds for better performance
- Optimize images for mobile devices
- Implement proper caching strategies

## 📞 Support

For setup issues:
1. Check this guide first
2. Verify all environment variables are set
3. Ensure database schema is properly applied
4. Check console logs for specific errors

The app should now be fully functional with real-time location tracking, role-based access, and comprehensive user management.
