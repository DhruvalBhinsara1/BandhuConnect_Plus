# Production Build Instructions

**Version:** 2.2.0  
**Last Updated:** September 7, 2025  
**Status:** ✅ Production Ready

## 🎯 **Pre-Build Checklist**

### ✅ **All Systems Ready**

- **Database**: Clean, organized, production-ready
- **Code Quality**: Material Design 3 interface, professional error handling
- **Documentation**: All files updated to current status (v2.2.0)
- **Demo Environment**: Parul University scenarios ready for testing
- **Role Configuration**: Set target role in `src/constants/appRole.ts`

## 🚀 **Creating Android & iOS App Builds**

### **Prerequisites**

#### **1. EAS CLI Installation**

```bash
npm install -g eas-cli
```

#### **2. Expo Account**

- Sign up at [expo.dev](https://expo.dev)
- Login to EAS:

```bash
eas login
```

#### **3. Environment Setup**

```bash
# Verify Node.js version (18+ required)
node --version

# Verify Git is configured
git config --global user.email "your.email@example.com"
git config --global user.name "Your Name"
```

## 📱 **Building Three App Variants**

BandhuConnect+ has three distinct app configurations. Build each separately:

### **1. Pilgrim App (Red Theme)**

#### **Configure for Pilgrim Build**

```bash
# Set role configuration
# Edit src/constants/appRole.ts
export const APP_ROLE: AppRole = 'pilgrim';
```

#### **Build Commands**

```bash
# Configure build profiles
eas build:configure

# Build for Android (APK for testing)
eas build --platform android --profile preview

# Build for Android (AAB for Play Store)
eas build --platform android --profile production

# Build for iOS (for App Store)
eas build --platform ios --profile production
```

### **2. Volunteer App (Green Theme)**

#### **Configure for Volunteer Build**

```bash
# Set role configuration
# Edit src/constants/appRole.ts
export const APP_ROLE: AppRole = 'volunteer';

# Update app config to use volunteer-specific settings
cp app.config.volunteer.js app.config.js
```

#### **Build Commands**

```bash
# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production
```

### **3. Admin App (Blue Theme)**

#### **Configure for Admin Build**

```bash
# Set role configuration
# Edit src/constants/appRole.ts
export const APP_ROLE: AppRole = 'admin';

# Revert to base config (or create admin-specific)
cp app.config.js app.config.js
```

#### **Build Commands**

```bash
# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production
```

## 📋 **EAS Configuration**

### **eas.json Configuration**

```json
{
  "cli": {
    "version": ">= 5.9.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## 🔧 **Build Profiles Explained**

### **Development Profile**

- **Purpose**: Development builds with debugging enabled
- **Output**: Development client
- **Use Case**: Internal testing with live reloading

### **Preview Profile**

- **Purpose**: Testing builds for internal distribution
- **Output**: APK (Android), IPA (iOS)
- **Use Case**: QA testing, stakeholder demos

### **Production Profile**

- **Purpose**: App store distribution
- **Output**: AAB (Android), IPA (iOS)
- **Use Case**: Google Play Store, Apple App Store

## 📦 **Automated Build Script**

Create a build script to automate the three-app process:

```bash
#!/bin/bash
# build-all-variants.sh

echo "Building BandhuConnect+ v2.2.0 - All Variants"

# Pilgrim App
echo "🔴 Building Pilgrim App..."
# Update appRole.ts to pilgrim
eas build --platform android --profile production --non-interactive

# Volunteer App
echo "🟢 Building Volunteer App..."
# Update appRole.ts to volunteer
eas build --platform android --profile production --non-interactive

# Admin App
echo "🔵 Building Admin App..."
# Update appRole.ts to admin
eas build --platform android --profile production --non-interactive

echo "✅ All builds initiated! Check your Expo dashboard for progress."
```

## 🏪 **App Store Submission**

### **Google Play Store (Android)**

#### **Prepare for Submission**

1. **App Bundle**: Use production profile (AAB format)
2. **Store Listing**: Prepare descriptions for each variant
3. **Screenshots**: Capture screens from each role interface
4. **Privacy Policy**: Update for location tracking and data handling

#### **Submit Command**

```bash
eas submit --platform android
```

#### **Store Metadata**

**Pilgrim App:**

- **Title**: "BandhuConnect+ Pilgrim"
- **Description**: "Emergency assistance requests during large events"
- **Keywords**: "emergency, pilgrim, help, events, safety"

**Volunteer App:**

- **Title**: "BandhuConnect+ Volunteer"
- **Description**: "Provide emergency assistance at large public events"
- **Keywords**: "volunteer, emergency, help, assistance, events"

**Admin App:**

- **Title**: "BandhuConnect+ Admin"
- **Description**: "Coordinate emergency response for large events"
- **Keywords**: "admin, management, emergency, coordination"

### **Apple App Store (iOS)**

#### **Prepare for Submission**

1. **App Store Connect**: Set up three separate app entries
2. **Bundle IDs**: Use different bundle identifiers for each variant
3. **TestFlight**: Internal testing before submission
4. **App Review**: Prepare demo credentials for Apple review

#### **Submit Command**

```bash
eas submit --platform ios
```

## 🔍 **Build Verification**

### **Pre-Release Testing Checklist**

- [ ] **Authentication**: Test login/logout for all user types
- [ ] **Location Services**: Verify GPS functionality
- [ ] **Real-time Updates**: Test assignment notifications
- [ ] **Map Integration**: Ensure Google Maps works properly
- [ ] **Role-Specific UI**: Verify correct theming and features
- [ ] **Database Connectivity**: Test all CRUD operations
- [ ] **Offline Handling**: Test network disconnection scenarios
- [ ] **Performance**: Monitor memory usage and responsiveness

### **Build Quality Verification**

```bash
# Check bundle size
eas build:list

# Download and test locally
eas build:download

# View build logs
eas build:view [BUILD_ID]
```

## 🚨 **Troubleshooting Common Build Issues**

### **Metro Bundler Issues**

```bash
# Clear cache before building
npx expo start --clear

# Reset Metro cache
npx react-native start --reset-cache
```

### **Dependency Issues**

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Check for peer dependency warnings
npm ls
```

### **iOS Specific Issues**

```bash
# Clear iOS cache
rm -rf ios/build
cd ios && xcodebuild clean
```

### **Android Specific Issues**

```bash
# Clear Android cache
cd android && ./gradlew clean

# Check Android SDK
sdkmanager --list
```

## 📊 **Build Monitoring**

### **Track Build Progress**

- **Expo Dashboard**: [expo.dev/builds](https://expo.dev/builds)
- **Build Logs**: Available in dashboard during build process
- **Notifications**: Email updates on build completion

### **Build Analytics**

- **Build Time**: Monitor for performance regressions
- **Success Rate**: Track failed builds and common issues
- **Bundle Size**: Monitor app size growth over versions

## 🔄 **Continuous Integration**

### **GitHub Actions Integration**

```yaml
# .github/workflows/build.yml
name: EAS Build
on:
  push:
    branches: [main]
    tags: ["v*"]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm install
      - run: eas build --platform all --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

## 📈 **Post-Build Steps**

### **1. Quality Assurance**

- **Internal Testing**: Distribute preview builds to team
- **User Acceptance Testing**: Test with actual end users
- **Performance Testing**: Monitor app performance metrics

### **2. Release Preparation**

- **Release Notes**: Update changelog with new features
- **Documentation**: Ensure all docs reflect current version
- **Marketing Materials**: Prepare app store assets

### **3. Deployment**

- **Staged Rollout**: Release to small percentage initially
- **Monitor Metrics**: Watch crash reports and user feedback
- **Full Release**: Deploy to all users after validation

---

**Need Help?** Check our [Troubleshooting Guide](../reference/TROUBLESHOOTING.md) or [Production Deployment Guide](../deployment/PRODUCTION.md)

---

**Next:** [Production Deployment](../deployment/PRODUCTION.md) | [Environment Configuration](../deployment/ENVIRONMENT.md)
