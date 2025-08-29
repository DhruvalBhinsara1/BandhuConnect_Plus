# BandhuConnect+ Setup Guide

This guide will help you fix the errors shown in your screenshots and get both the admin dashboard and mobile app running properly.

## Issues Fixed

✅ **Admin Dashboard**: Added missing `react-router-dom` dependency and configured Supabase credentials  
✅ **Mobile App**: Added missing React Navigation native dependencies (`react-native-gesture-handler`, `react-native-reanimated`)  
✅ **Environment Variables**: Configured proper Supabase credentials for both apps

## Setup Instructions

### 1. Admin Dashboard Setup

```bash
cd admin-dashboard
npm install
npm start
```

The admin dashboard should now open at `http://localhost:3000` without the router errors.

### 2. Mobile App Setup

```bash
cd mobile-app
npm install
npx expo start
```

**Important**: The connection errors you're seeing (`ERR_CONNECTION_REFUSED` to `localhost:8081`) occur because:

- The Metro bundler (React Native's development server) runs on port 8081
- Your device/emulator cannot reach localhost from your development machine

### 3. Fix Mobile App Connection Issues

Choose one of these solutions:

#### Option A: Use Expo Go App (Recommended)
1. Install Expo Go on your phone from App Store/Play Store
2. Run `npx expo start` in the mobile-app directory
3. Scan the QR code with Expo Go app

#### Option B: Use Android Emulator
1. Start Android Studio and launch an emulator
2. Run `npx expo start --android`

#### Option C: Use iOS Simulator (Mac only)
1. Run `npx expo start --ios`

### 4. Fix Deprecated Warnings

The warnings about deprecated props (`pointerEvents`, `shadow`, `resizeMode`, `tintColor`) are coming from React Native components. These are typically handled automatically by Expo Router and don't affect functionality.

## Project Structure

```
BandhuConnectPlus/
├── admin-dashboard/          # React web app for admin panel
│   ├── src/
│   │   ├── pages/           # Login and Dashboard pages
│   │   ├── supabase.js      # Supabase client config
│   │   └── App.js           # Main app with routing
│   └── .env                 # Supabase credentials
├── mobile-app/              # React Native app with Expo
│   ├── app/                 # Expo Router pages
│   ├── lib/supabase.js      # Supabase client config
│   └── .env                 # Supabase credentials
└── supabase/
    └── schema.sql           # Database schema
```

## Testing the Applications

### Admin Dashboard
1. Navigate to `http://localhost:3000`
2. You should see the login page without any router errors
3. Use your admin credentials to log in

### Mobile App
1. After running `npx expo start`, you should see the Metro bundler interface
2. Use Expo Go app or emulator to test
3. The app should load without connection errors

## Troubleshooting

**If you still see connection errors:**
- Make sure you're using Expo Go app or a proper emulator
- Don't try to access localhost:8081 directly in a browser
- Ensure your phone and computer are on the same WiFi network (for Expo Go)

**If you see build errors:**
- Run `npm install` in both directories
- Clear Metro cache: `npx expo start --clear`
- Restart your development server

## Next Steps

Both applications are now properly configured with:
- ✅ All required dependencies
- ✅ Proper Supabase configuration
- ✅ Fixed routing and navigation
- ✅ Environment variables set up

You can now focus on developing the core features of your BandhuConnect+ platform!
