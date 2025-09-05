# BandhuConnect+ Build Instructions

## 🚀 Creating Android & iOS App Builds

### Prerequisites
1. **EAS CLI Installation**
   ```bash
   npm install -g eas-cli
   ```

2. **Expo Account**
   - Sign up at [expo.dev](https://expo.dev)
   - Login: `eas login`

3. **Environment Setup**
   - Ensure `.env` file exists with Supabase credentials
   - Verify `eas.json` configuration is present

## 📱 Android Build (FREE)

### Step 1: Configure Android Build
```bash
# Navigate to project directory
cd BandhuConnect_Plus

# Login to EAS
eas login

# Configure project (if not done)
eas build:configure
```

### Step 2: Create Android APK
```bash
# For development/testing (APK)
eas build --platform android --profile preview

# For production (AAB for Play Store)
eas build --platform android --profile production
```

### Step 3: Download & Install
- Build will appear in your Expo dashboard
- Download APK file when ready
- Install on Android device via file manager

## 🍎 iOS Build (LIMITED FREE)

### Free Tier Limitations:
- **iOS builds are limited** on free Expo plan
- You get a few free builds per month
- Consider upgrading to paid plan for unlimited builds

### Step 1: iOS Build Command
```bash
# For development (Simulator)
eas build --platform ios --profile preview

# For production (App Store)
eas build --platform ios --profile production
```

### Step 2: iOS Requirements
- **Apple Developer Account** ($99/year) required for device installation
- **Simulator builds** work without Apple account
- **TestFlight** distribution requires Apple Developer account

## 🔧 Build Configuration

### Current EAS Configuration (`eas.json`):
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

### App Configuration (`app.config.js`):
- **Android Package**: `com.anonymous.bandhuconnectplus`
- **iOS Bundle ID**: `com.dhruvalbhinsara.bandhuconnectplus`
- **Version**: 1.0.0
- **EAS Project ID**: `90504708-ed95-48b8-b8a0-86d1de6303a1`

## 🎯 Recommended Build Strategy

### For Hackathon/Demo:
1. **Start with Android** (completely free)
2. **Use preview profile** for quick testing
3. **Share APK file** for easy installation

### Commands to Run:
```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. Build Android APK
eas build --platform android --profile preview

# 4. (Optional) Build iOS if you have free builds left
eas build --platform ios --profile preview
```

## 📋 Build Process Timeline

### Android Build:
- **Queue Time**: 2-10 minutes
- **Build Time**: 10-20 minutes
- **Total**: ~30 minutes maximum

### iOS Build:
- **Queue Time**: 2-10 minutes  
- **Build Time**: 15-25 minutes
- **Total**: ~35 minutes maximum

## 🔍 Monitoring Builds

### Check Build Status:
```bash
# List all builds
eas build:list

# View specific build
eas build:view [BUILD_ID]
```

### Expo Dashboard:
- Visit [expo.dev/accounts/[username]/projects/bandhuconnect-plus/builds](https://expo.dev)
- Monitor build progress in real-time
- Download completed builds

## 🚨 Troubleshooting

### Common Issues:

**Build Fails - Missing Environment Variables:**
```bash
# Set environment variables for build
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "your_url"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your_key"
```

**Android Package Name Conflict:**
- Change `package` in `app.config.js` to unique name
- Use format: `com.yourname.bandhuconnectplus`

**iOS Bundle ID Issues:**
- Ensure unique bundle identifier
- Format: `com.yourname.bandhuconnectplus`

## 💡 Pro Tips

1. **Use Preview Profile** for faster builds during development
2. **Monitor Expo Dashboard** for build progress
3. **Keep APK files** for easy sharing and testing
4. **Test on real devices** for location features
5. **Consider upgrading Expo plan** for unlimited iOS builds

## 📞 Support

If builds fail:
1. Check Expo dashboard for detailed error logs
2. Verify all environment variables are set
3. Ensure unique package names
4. Contact Expo support for build-specific issues

---

**Ready to build?** Run the commands above and your Android APK will be ready in ~30 minutes!
