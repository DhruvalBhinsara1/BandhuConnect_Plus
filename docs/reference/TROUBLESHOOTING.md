# Troubleshooting Guide

**Version:** 2.2.0  
**Last Updated:** September 7, 2025

## 🚨 **Common Issues & Solutions**

### **Development Setup Issues**

#### **Metro Bundler Problems**

```bash
# Clear Metro cache
npm start -- --clear

# Reset all caches
npx expo start --clear

# Hard reset (if above doesn't work)
rm -rf node_modules package-lock.json
npm install
npm start
```

#### **Dependency Issues**

```bash
# Check for conflicting versions
npm ls

# Clean install
rm -rf node_modules package-lock.json
npm install

# Check for peer dependency warnings
npm install --legacy-peer-deps
```

#### **TypeScript Errors**

```bash
# Run type checker
npx tsc --noEmit

# Clear TypeScript cache
rm -rf .expo/types

# Restart TypeScript service in VS Code
Ctrl+Shift+P > "TypeScript: Restart TS Server"
```

### **Build & Deployment Issues**

#### **EAS Build Failures**

```bash
# Check EAS CLI version
eas --version

# Update EAS CLI
npm install -g eas-cli@latest

# Clear EAS cache
eas build --clear-cache

# View detailed build logs
eas build:view [BUILD_ID]
```

#### **Android Build Issues**

```bash
# Check Android SDK
sdkmanager --list

# Clear Android cache
cd android && ./gradlew clean

# Check Java version (should be 11 or 17)
java -version
```

#### **iOS Build Issues**

```bash
# Clear iOS cache
rm -rf ios/build

# Check Xcode version
xcodebuild -version

# Clean Xcode build
cd ios && xcodebuild clean
```

### **Runtime Issues**

#### **Authentication Problems**

**Symptoms:**

- Login fails with valid credentials
- Session expires immediately
- User data not loading

**Solutions:**

```typescript
// Check Supabase configuration
console.log("Supabase URL:", process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log(
  "Supabase Key:",
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10) + "..."
);

// Clear auth session
await supabase.auth.signOut();

// Check network connectivity
const { data, error } = await supabase.from("profiles").select("count");
```

#### **Location Tracking Issues**

**Symptoms:**

- GPS not working
- Location permissions denied
- Inaccurate positioning

**Solutions:**

```typescript
// Check permissions
import * as Location from "expo-location";

const { status } = await Location.requestForegroundPermissionsAsync();
if (status !== "granted") {
  console.log("Location permission denied");
  return;
}

// Test location accuracy
const location = await Location.getCurrentPositionAsync({
  accuracy: Location.Accuracy.High,
  maximumAge: 10000,
});
console.log("Location accuracy:", location.coords.accuracy);
```

#### **Real-time Subscription Issues**

**Symptoms:**

- Live updates not working
- Assignment notifications not received
- Map not updating

**Solutions:**

```typescript
// Check WebSocket connection
const channel = supabase.channel("test-channel");
channel.subscribe((status) => {
  console.log("Realtime status:", status);
});

// Reconnect subscriptions
await supabase.removeAllChannels();
// Re-initialize your subscriptions

// Check network status
import NetInfo from "@react-native-async-storage/async-storage";
const netInfo = await NetInfo.fetch();
console.log("Network:", netInfo);
```

### **Performance Issues**

#### **App Slow or Freezing**

**Diagnosis:**

```typescript
// Monitor memory usage
import { AppState } from "react-native";

AppState.addEventListener("memoryWarning", () => {
  console.log("Memory warning received");
});

// Check JavaScript heap
if (__DEV__) {
  console.log(
    "JS Heap:",
    Math.round(performance.memory?.usedJSHeapSize / 1024 / 1024) + "MB"
  );
}
```

**Solutions:**

- Reduce image sizes and use WebP format
- Implement lazy loading for lists
- Clean up timers and subscriptions
- Use React.memo for expensive components

#### **Map Performance Issues**

**Symptoms:**

- Map stuttering or lag
- Slow marker updates
- Memory leaks

**Solutions:**

```typescript
// Optimize marker rendering
const markers = useMemo(
  () =>
    locations.map((location) => ({
      ...location,
      key: location.id,
    })),
  [locations]
);

// Limit number of markers
const visibleMarkers = markers.slice(0, 50);

// Cluster markers for better performance
// Use react-native-maps-clustering if needed
```

### **Database Issues**

#### **RLS (Row Level Security) Errors**

**Symptoms:**

- "Permission denied" errors
- Data not loading for certain users
- Unexpected access restrictions

**Solutions:**

```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'your_table_name';

-- Test policy with specific user
SET ROLE 'authenticated';
SELECT * FROM your_table WHERE user_id = 'specific_user_id';

-- Debug policy conditions
SELECT current_user, current_setting('request.jwt.claims', true)::json;
```

#### **Foreign Key Constraint Errors**

**Solutions:**

```sql
-- Check constraint violations
SELECT conname, conrelid::regclass AS table_name
FROM pg_constraint
WHERE contype = 'f' AND NOT condeferrable;

-- Validate data integrity
SELECT * FROM assignments
WHERE volunteer_id NOT IN (SELECT id FROM profiles WHERE role = 'volunteer');
```

### **UI/UX Issues**

#### **Layout Problems**

**Symptoms:**

- Components overlapping
- Inconsistent spacing
- Touch targets too small

**Solutions:**

```typescript
// Add debug borders
const debugStyle = __DEV__ ? { borderWidth: 1, borderColor: "red" } : {};

// Check safe area
import { useSafeAreaInsets } from "react-native-safe-area-context";
const insets = useSafeAreaInsets();

// Verify minimum touch targets (44px iOS, 48px Android)
const minTouchTarget = Platform.OS === "ios" ? 44 : 48;
```

#### **Theme/Color Issues**

**Solutions:**

```typescript
// Verify theme provider
const theme = useTheme();
console.log("Current theme:", theme);

// Check color contrast
// Use tools like WebAIM Contrast Checker
// Minimum 4.5:1 for normal text, 3:1 for large text

// Debug theme application
const ThemeDebugger = () => (
  <View style={{ backgroundColor: theme.surface }}>
    <Text style={{ color: theme.textPrimary }}>Theme Test</Text>
  </View>
);
```

## 🔧 **Debug Mode Setup**

### **Enable Detailed Logging**

```typescript
// Add to App.tsx or main component
if (__DEV__) {
  console.log("App starting in development mode");

  // Enable network logging
  global.XMLHttpRequest =
    global.originalXMLHttpRequest || global.XMLHttpRequest;

  // Log all Supabase operations
  const originalFrom = supabase.from;
  supabase.from = function (table) {
    console.log(`Supabase query: ${table}`);
    return originalFrom.call(this, table);
  };
}
```

### **Performance Monitoring**

```typescript
// Monitor component render times
const useRenderTime = (componentName: string) => {
  useEffect(() => {
    const start = performance.now();
    return () => {
      const end = performance.now();
      console.log(`${componentName} render time: ${end - start}ms`);
    };
  });
};
```

## 📱 **Platform-Specific Issues**

### **iOS Specific**

#### **Background App Refresh**

```typescript
// Check background modes in app.json
"ios": {
  "infoPlist": {
    "UIBackgroundModes": ["location", "background-processing"]
  }
}
```

#### **Push Notifications**

```typescript
// Check notification permissions
import * as Notifications from "expo-notifications";

const { status } = await Notifications.getPermissionsAsync();
if (status !== "granted") {
  await Notifications.requestPermissionsAsync();
}
```

### **Android Specific**

#### **Battery Optimization**

- Users may need to disable battery optimization for the app
- Check "Doze mode" and "App Standby" settings
- Add app to "Protected apps" list on some devices

#### **Network Security Config**

```xml
<!-- android/app/src/main/res/xml/network_security_config.xml -->
<network-security-config>
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="true">localhost</domain>
  </domain-config>
</network-security-config>
```

## 🧪 **Testing Issues**

### **Test Environment Setup**

```bash
# Reset test database
npm run db:reset

# Seed test data
npm run db:seed

# Run test suite
npm test

# Run specific test file
npm test -- LocationService.test.ts
```

### **Mock Data Issues**

```typescript
// Check test user credentials
const testUsers = {
  pilgrim: { email: "test.pilgrim@example.com", password: "testpass123" },
  volunteer: { email: "test.volunteer@example.com", password: "testpass123" },
  admin: { email: "test.admin@example.com", password: "testpass123" },
};

// Verify test environment
if (process.env.EXPO_PUBLIC_SUPABASE_URL?.includes("localhost")) {
  console.log("Using local test database");
}
```

## 📊 **Monitoring & Analytics**

### **Error Tracking**

```typescript
// Global error handler
import crashlytics from "@react-native-firebase/crashlytics";

global.ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.log("Global error:", error);
  crashlytics().recordError(error);
});
```

### **Performance Metrics**

```typescript
// Track key metrics
const trackEvent = (eventName: string, properties: object) => {
  if (__DEV__) {
    console.log(`Event: ${eventName}`, properties);
  }
  // Send to analytics service
};

// Track response times
const trackResponseTime = (operation: string, startTime: number) => {
  const duration = Date.now() - startTime;
  trackEvent("response_time", { operation, duration });
};
```

## 🆘 **Getting Help**

### **Community Support**

- 🐛 [GitHub Issues](https://github.com/DhruvalBhinsara1/BandhuConnect_Plus/issues)
- 💬 [GitHub Discussions](https://github.com/DhruvalBhinsara1/BandhuConnect_Plus/discussions)
- 📚 [Documentation](../README.md)

### **Before Reporting Issues**

1. **Check existing issues** on GitHub
2. **Try the solutions** in this guide
3. **Gather information**:
   - App version
   - Platform (iOS/Android)
   - Device model
   - Steps to reproduce
   - Error messages
   - Console logs

### **Issue Template**

```markdown
**Bug Description:**
Clear description of the issue

**Environment:**

- App Version: 2.2.0
- Platform: iOS/Android
- Device: iPhone 14 / Galaxy S23
- OS Version: iOS 17 / Android 13

**Steps to Reproduce:**

1. Step one
2. Step two
3. Step three

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Error Messages:**
Any error messages or console logs

**Screenshots:**
If applicable, add screenshots
```

---

**Need more help?** Check our [FAQ](./FAQ.md) or [documentation](../README.md)
