# Expo Go Limitations for BandhuConnect+

## Location Services Issue

**Problem:** Location permissions fail in Expo Go with error:
```
Error: One of the `NSLocation*UsageDescription` keys must be present in Info.plist
```

**Root Cause:** Expo Go doesn't support custom Info.plist configurations. The location permission descriptions in `app.config.js` are ignored.

## Solutions

### Option 1: Development Build (Recommended)
Create a development build to test full native functionality:

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas build:configure

# Build for iOS simulator
eas build --platform ios --profile development

# Build for iOS device  
eas build --platform ios --profile development --device
```

### Option 2: Test on Android
Android location permissions work in Expo Go:
- Test location features on Android devices
- iOS testing requires development build

### Option 3: Web Testing
Some features work in web browser:
```bash
npx expo start --web
```

## Current Workarounds

The app now handles Expo Go limitations gracefully:
- Location errors are caught and logged
- Users see friendly "Location not available in Expo Go" messages
- App doesn't crash when location services fail
- Other features remain functional

## Features Affected in Expo Go

- ✅ **Working:** Authentication, database operations, basic UI
- ❌ **Limited:** Location tracking, background location, push notifications
- ❌ **iOS Only:** Location permissions (works on Android)

## Recommendation

For full testing of location features, create a development build:
```bash
eas build --platform ios --profile development
```

This will include the proper Info.plist configurations and enable all native features.
