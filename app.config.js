export default {
  expo: {
    name: "BandhuConnect+",
    slug: "bandhuconnect-plus",
  version: "2.3.2",
    orientation: "portrait",
    userInterfaceStyle: "light",
    main: "./index.ts",
    splash: {
      backgroundColor: "#121212",
      resizeMode: "contain"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      jsEngine: "jsc",
      bundleIdentifier: "com.dhruvalbhinsara.bandhuconnectplus",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "This app needs access to location when open to track volunteer locations for emergency assistance coordination.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "This app needs access to location when open and in the background to track volunteer locations for emergency assistance coordination.",
        NSLocationAlwaysUsageDescription: "This app needs access to location in the background to track volunteer locations for emergency assistance coordination."
      }
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#121212"
      },
      jsEngine: "jsc",
      package: "com.anonymous.bandhuconnectplus",
      config: {
        ndkVersion: "29.0.13846066"
      },
      minSdkVersion: 24,
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION"
      ]
    },
    plugins: [
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "This app needs access to location when open and in the background to track volunteer locations for emergency assistance coordination.",
          isIosBackgroundLocationEnabled: true,
          isAndroidBackgroundLocationEnabled: true
        }
      ]
    ],
    scheme: "bandhuconnect",
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      appRole: "admin", // Hardcoded role for this build
      eas: {
        projectId: "369f87f8-7772-4a21-92e8-7b5427200ecb"
      }
    }
  }
};
