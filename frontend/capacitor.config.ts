import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.coastal.banking',
  appName: 'Coastal Banking',
  webDir: 'dist',

  // Live Client Configuration
  // The app loads from the cloud server for instant updates
  server: {
    url: 'https://coastal-project.onrender.com',
    cleartext: false,  // Force HTTPS
  },

  // Android-specific settings
  android: {
    allowMixedContent: false,  // Security: block HTTP content
    captureInput: true,        // Better keyboard handling
    webContentsDebuggingEnabled: false,  // Disable for production
  },

  // Plugins configuration
  plugins: {
    // Enable camera for KYC document capture
    Camera: {
      presentationStyle: 'fullScreen'
    },
    // Enable geolocation for visit verification
    Geolocation: {
      enableHighAccuracy: true
    }
  }
};

export default config;
