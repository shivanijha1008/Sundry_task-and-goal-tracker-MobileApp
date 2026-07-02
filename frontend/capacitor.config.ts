import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.sundry.mobile",
  appName: "Sundry",
  webDir: "build",

  // Load the built web assets from the app bundle (offline-friendly)
  server: {
    androidScheme: "https",
    iosScheme: "https",
    // For live-reload during development, uncomment:
    // url: "https://monthly-goals-sprint.preview.emergentagent.com",
    // cleartext: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1400,
      backgroundColor: "#1B0A2A",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#1B0A2A",
      overlaysWebView: false,
    },
    LocalNotifications: {
      smallIcon: "ic_notification",
      iconColor: "#FF2D92",
      sound: "beep.wav",
    },
  },

  ios: {
    contentInset: "always",
    backgroundColor: "#1B0A2A",
  },
  android: {
    backgroundColor: "#1B0A2A",
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
