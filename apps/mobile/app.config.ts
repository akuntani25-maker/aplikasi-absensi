import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Absensi",
  slug: "aplikasi-absensi",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./src/assets/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./src/assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.absensi.mobile",
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "Aplikasi membutuhkan lokasi untuk mencatat absensi Anda.",
      NSLocationAlwaysUsageDescription:
        "Aplikasi membutuhkan lokasi untuk mencatat absensi Anda.",
      NSFaceIDUsageDescription:
        "Aplikasi menggunakan Face ID untuk autentikasi absensi.",
      NSCameraUsageDescription:
        "Aplikasi membutuhkan kamera untuk verifikasi wajah.",
    },
  },
  android: {
    package: "com.absensi.mobile",
    adaptiveIcon: {
      foregroundImage: "./src/assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    permissions: [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "CAMERA",
      "USE_BIOMETRIC",
      "USE_FINGERPRINT",
    ],
  },
  web: {
    favicon: "./src/assets/favicon.png",
    bundler: "metro",
  },
  scheme: "absensi",
  runtimeVersion: {
    policy: "appVersion",
  },
  updates: {
    url: "https://u.expo.dev/77e4d2a4-863e-47a2-9350-e8f373ed817a",
    checkAutomatically: "ON_LOAD",
  },
  experiments: {
    typedRoutes: true,
  },
  plugins: [
    [
      "expo-build-properties",
      {
        android: {
          networkSecurityConfig: "./network-security-config.xml",
          minSdkVersion: 26,
          compileSdkVersion: 35,
          targetSdkVersion: 35,
        },
        ios: {
          deploymentTarget: "15.1",
        },
      },
    ],
    "expo-router",
    "expo-secure-store",
    [
      "expo-local-authentication",
      {
        faceIDPermission:
          "Aplikasi menggunakan Face ID untuk autentikasi absensi.",
      },
    ],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "Aplikasi membutuhkan lokasi untuk mencatat absensi Anda.",
      },
    ],
    [
      "react-native-vision-camera",
      {
        cameraPermissionText:
          "Aplikasi membutuhkan kamera untuk verifikasi wajah saat absensi.",
        enableMicrophonePermission: false,
        enableCodeScanner: false,
      },
    ],
  ],
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    eas: {
      projectId: "77e4d2a4-863e-47a2-9350-e8f373ed817a",
    },
  },
});
