# Coastal Banking - Android Mobile Client

A native Android application for Mobile Bankers to access the Coastal Banking system with camera and GPS capabilities.

## Features

- **Live Updates**: App always loads the latest version from the cloud
- **Camera Access**: Take photos of customer IDs for KYC verification
- **GPS Location**: Tag visit locations for accountability
- **Offline Login**: Session persists even with poor connectivity
- **Native Feel**: Full Android app experience (not just a browser)

## Prerequisites

- Node.js 18+
- Android Studio (latest stable)
- Android SDK 33+
- Java 17+

## Development

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Build the Web Assets

```bash
npm run build
```

### 3. Sync with Android

```bash
npx cap sync android
```

### 4. Open in Android Studio

```bash
npx cap open android
```

### 5. Build APK

In Android Studio:
1. Build → Build Bundle(s) / APK(s) → Build APK(s)
2. The APK will be at `android/app/build/outputs/apk/debug/app-debug.apk`

## Configuration

Edit `capacitor.config.ts` to change:

- `server.url`: The live server URL (currently `https://coastal-project.onrender.com`)
- `appId`: The Android package name (currently `com.coastal.banking`)
- `appName`: The app display name

## Distribution

### Option 1: Direct APK (Recommended for Internal)

1. Build the APK using Android Studio
2. Share via:
   - WhatsApp/Telegram
   - Email
   - Internal file server
3. Users enable "Install from Unknown Sources" and install

### Option 2: Google Play Store

1. Create a signed release APK or AAB
2. Upload to Google Play Console
3. Users install from the Play Store

## Permissions

The app requests these permissions:

| Permission | Purpose |
|------------|---------|
| `INTERNET` | Connect to banking server |
| `CAMERA` | Take photos of customer IDs |
| `ACCESS_FINE_LOCATION` | Tag visit locations |
| `ACCESS_COARSE_LOCATION` | Fallback location |

## Updating the App

**Web/Logic Changes**: Just push to GitHub → Render deploys → App automatically shows new version.

**Native Changes** (icon, permissions): Rebuild APK and redistribute.
