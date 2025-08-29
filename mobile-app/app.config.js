export default {
  expo: {
    name: "BandhuConnect+ Volunteer",
    slug: "bandhuconnect-volunteer",
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
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#121212"
      }
    },
    web: {
      bundler: "metro"
    },
    plugins: [
      "expo-router"
    ],
    scheme: "bandhuconnect"
  }
};
