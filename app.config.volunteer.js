export default {
  expo: {
    name: "BandhuConnect+ Volunteer",
    slug: "bandhuconnect-volunteer",
    version: "2.2.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    main: "./index.ts",
    splash: {
      backgroundColor: "#16A34A", // Green theme for volunteers
      resizeMode: "contain"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      jsEngine: "jsc",
      bundleIdentifier: "com.dhruvalbhinsara.bandhuconnect.volunteer",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "This app needs precise location access to help pilgrims locate you for assistance coordination.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "This app needs continuous location access to maintain availability for emergency assistance coordination even when the app is in background.",
        NSLocationAlwaysUsageDescription: "This app needs background location access to ensure pilgrims can find you for assistance coordination."
      }
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#16A34A"
      },
      jsEngine: "jsc",
      package: "com.dhruvalbhinsara.bandhuconnect.volunteer",
      config: {
        ndkVersion: "29.0.13846066"
      },
      minSdkVersion: 24,
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_LOCATION"
      ]
    },
    plugins: [
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "This app needs continuous location access to maintain availability for emergency assistance coordination.",
          isIosBackgroundLocationEnabled: true,
          isAndroidBackgroundLocationEnabled: true
        }
      ]
    ],
    scheme: "bandhuconnect-volunteer",
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      appRole: "volunteer", // Hardcoded role for this build
      eas: {
        projectId: "90504708-ed95-48b8-b8a0-86d1de6303a1"
      }
    }
  }
};
