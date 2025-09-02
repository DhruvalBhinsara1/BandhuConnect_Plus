export default {
  expo: {
    name: "BandhuConnect+",
    slug: "bandhuconnect-plus",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    splash: {
      backgroundColor: "#121212",
      resizeMode: "contain"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      jsEngine: "jsc"
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#121212"
      },
      jsEngine: "jsc",
      package: "com.anonymous.bandhuconnectplus"
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
    }
  }
};
