export default {
  expo: {
    name: "BandhuConnect+ Pilgrim",
    slug: "bandhuconnect-pilgrim",
  version: "2.3.3",
    orientation: "portrait",
    userInterfaceStyle: "light",
    main: "./index.ts",
    splash: {
      backgroundColor: "#DC2626", // Red theme for pilgrims
      resizeMode: "contain"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      jsEngine: "hermes",
      bundleIdentifier: "com.dhruvalbhinsara.bandhuconnect.pilgrim",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "This app needs precise location access to help volunteers find and assist you during emergencies.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "This app needs continuous location access to ensure volunteers can locate you for assistance even when the app is in background.",
        NSLocationAlwaysUsageDescription: "This app needs background location access to maintain safety tracking for emergency assistance."
      }
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#DC2626"
      },
      jsEngine: "hermes",
      package: "com.dhruvalbhinsara.bandhuconnect.pilgrim",
      config: {
        ndkVersion: "26.1.10909125"
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
          locationAlwaysAndWhenInUsePermission: "This app needs continuous location access to ensure volunteers can locate you for assistance.",
          isIosBackgroundLocationEnabled: true,
          isAndroidBackgroundLocationEnabled: true
        }
      ]
    ],
    scheme: "bandhuconnect-pilgrim",
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      appRole: "pilgrim", // Hardcoded role for this build
      eas: {
        projectId: "90504708-ed95-48b8-b8a0-86d1de6303a1"
      }
    }
  }
};
