# 🚀 Golbot Machine APK - Build Instructions

## 📋 Overview

The Golbot Machine APK now supports **three environments**: Development, Staging, and Production. Each environment has its own configuration, app name, and package ID.

## 🏗️ Environments

| Environment | App Name | Package ID | API URL | Firmware Mode |
|------------|----------|------------|---------|---------------|
| **Dev** | Golbot Dev | `com.golbot.machine.dev` | localhost:5000 | ❌ Disabled (Manual) |
| **Staging** | Golbot Staging | `com.golbot.machine.staging` | staging-api.golbot.in | ✅ Enabled (Auto) |
| **Prod** | Golbot Machine | `com.golbot.machine` | api.golbot.in | ✅ Enabled (Auto) |

## 🎯 Quick Start

### Run in Development Mode
```bash
flutter run -t lib/main_dev.dart --flavor dev
```

### Run in Staging Mode
```bash
flutter run -t lib/main_staging.dart --flavor staging
```

### Run in Production Mode
```bash
flutter run -t lib/main_prod.dart --flavor prod
```

## 📦 Building APKs

### Build Development APK (Debug)
```bash
flutter build apk -t lib/main_dev.dart --flavor dev
```
Output: `build/app/outputs/flutter-apk/app-dev-debug.apk`

### Build Staging APK (Release)
```bash
flutter build apk -t lib/main_staging.dart --flavor staging --release
```
Output: `build/app/outputs/flutter-apk/app-staging-release.apk`

### Build Production APK (Release)
```bash
flutter build apk -t lib/main_prod.dart --flavor prod --release
```
Output: `build/app/outputs/flutter-apk/app-prod-release.apk`

## 🔧 Configuration Files

Each environment has its own configuration file:

- `lib/config/dev_config.dart` - Development settings
- `lib/config/staging_config.dart` - Staging settings
- `lib/config/prod_config.dart` - Production settings

### What's Configurable?

- **API URLs** - Different backend servers per environment
- **App Name & ID** - Allows side-by-side installation
- **Firmware Mode** - Auto vs Manual operation
- **Polling Intervals** - How often to check for orders
- **Auto-Progression Delays** - Timing for state transitions
- **Debug Logs** - Enabled in dev/staging, disabled in prod
- **Immersive Mode** - Full-screen kiosk mode

## 🎨 Visual Indicators

### Environment Banners
- **Dev builds**: Blue "DEV" banner in top-right corner
- **Staging builds**: Orange "STAGING" banner in top-right corner
- **Prod builds**: No banner (clean UI)

### App Icons
All environments currently use the same icon. You can customize by adding flavor-specific icons:
- `android/app/src/dev/res/mipmap/ic_launcher.png`
- `android/app/src/staging/res/mipmap/ic_launcher.png`
- `android/app/src/prod/res/mipmap/ic_launcher.png`

## 🔒 Security Features

### Network Security Config
- **Dev**: Allows HTTP to localhost (10.0.2.2, 127.0.0.1)
- **Staging/Prod**: HTTPS only, no cleartext traffic

### Debug Logs
Production builds automatically disable all debug print statements for security.

## 📱 Installing Multiple Builds

You can install all three environments side-by-side on the same device because they have different package IDs:

```bash
# Install dev build
adb install build/app/outputs/flutter-apk/app-dev-debug.apk

# Install staging build
adb install build/app/outputs/flutter-apk/app-staging-release.apk

# Install prod build
adb install build/app/outputs/flutter-apk/app-prod-release.apk
```

Each will appear as a separate app:
- "Golbot Dev" (blue banner)
- "Golbot Staging" (orange banner)
- "Golbot Machine" (no banner)

## 🛠️ Development Workflow

### Local Testing (Dev)
1. Start your local backend server on port 5000
2. Run: `flutter run -t lib/main_dev.dart --flavor dev`
3. Firmware mode is OFF - you control everything manually
4. Slower polling (5s) for easier debugging

### Pre-Production Testing (Staging)
1. Deploy to staging backend: `staging-api.golbot.in`
2. Build: `flutter build apk -t lib/main_staging.dart --flavor staging --release`
3. Firmware mode is ON - tests auto-progression
4. Debug logs still enabled

### Production Deployment (Prod)
1. Build: `flutter build apk -t lib/main_prod.dart --flavor prod --release`
2. Test on physical machine
3. Firmware mode is ON - full automation
4. No debug logs

## 🐛 Troubleshooting

### "Cleartext HTTP traffic not permitted"
- Make sure you're using the correct flavor for your URL
- Dev flavor allows HTTP to localhost
- Staging/Prod require HTTPS

### Multiple apps with same name
- Each flavor has a unique app name and package ID
- You can install all three at once

### Wrong API URL
- Check which main entry point you're using: `main_dev.dart`, `main_staging.dart`, or `main_prod.dart`
- Verify the flavor matches: `--flavor dev`, `--flavor staging`, or `--flavor prod`

### Environment banner not showing
- Banners only appear in dev and staging builds
- Production builds don't show banners

## 📝 Configuration Changes

To modify environment settings, edit the respective config file:

```dart
// lib/config/dev_config.dart
class DevConfig implements EnvConfig {
  @override
  String get baseUrl => 'http://10.0.2.2:5000/api/v1/'; // Change this

  @override
  bool get firmwareModeEnabled => false; // Change this

  // ... other settings
}
```

## 🎓 Best Practices

1. **Always test in dev first** - Catch issues early
2. **Validate in staging** - Test production-like behavior
3. **Never test production config locally** - Use staging instead
4. **Keep flavors in sync** - Ensure all environments have consistent features
5. **Use debug logs sparingly** - Only for important state changes

## 📞 Support

For issues or questions about the build system, check:
- Configuration files in `lib/config/`
- Build configuration in `android/app/build.gradle.kts`
- Network security in `android/app/src/{flavor}/res/xml/`
