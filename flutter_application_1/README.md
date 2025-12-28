# 🤖 Golbot Machine APK

## 📱 Overview

The Golbot Machine APK is a Flutter application designed for automated vending machines. It supports multiple environments (Development, Staging, Production) with different configurations and behaviors.

## 🚀 Quick Start

### Prerequisites
- Flutter SDK installed
- Chrome browser (for web testing)
- Android SDK (for APK building)

### Environment Setup
```bash
# Run setup script to create config files
setup_configs.bat
```

## 🌍 Environments

| Environment | App Name | Package ID | API URL | Purpose |
|-------------|----------|------------|---------|---------|
| **Development** | Golbot Dev | `com.golbot.machine.dev` | localhost:5000 | Local development & testing |
| **Staging** | Golbot Staging | `com.golbot.machine.staging` | staging-api.golbot.in | Pre-production testing |
| **Production** | Golbot Machine | `com.golbot.machine` | api.golbot.in | Live deployment |

## 🧪 Testing

### Staging Environment Testing

**Purpose**: Test production-like behavior without affecting live systems

**1. Run in Chrome (Web Testing)**
```bash
flutter run -d chrome -t lib/main_staging.dart --flavor staging
```

**2. Build Staging APK**
```bash
# Using batch file (recommended)
build_staging.bat

# Manual command
flutter build apk -t lib/main_staging.dart --flavor staging --release
```

**Staging Features:**
- ✅ Firmware mode enabled (auto-progression)
- ✅ Debug logs enabled (for testing)
- 🔶 Orange "STAGING" banner
- 📡 Connects to `https://staging-api.golbot.in`
- ⚡ Fast polling (3s intervals)

### Production Environment Testing

**Purpose**: Final validation before deployment to physical machines

**1. Run in Chrome (Web Testing)**
```bash
flutter run -d chrome -t lib/main_prod.dart --flavor prod
```

**2. Build Production APK**
```bash
# Using batch file (recommended)
build_prod.bat

# Manual command
flutter build apk -t lib/main_prod.dart --flavor prod --release
```

**Production Features:**
- ✅ Firmware mode enabled (full automation)
- ❌ Debug logs disabled (security)
- 🚫 No environment banner (clean UI)
- 📡 Connects to `https://api.golbot.in`
- ⚡ Fast polling (3s intervals)
- 🔒 HTTPS only, no cleartext traffic

## 📦 APK Outputs

After building, APKs are located at:
```
build/app/outputs/flutter-apk/
├── app-dev-debug.apk          # Development build
├── app-staging-release.apk    # Staging build
└── app-prod-release.apk       # Production build
```

## 🔧 Configuration

### Key Settings (Configurable per environment)

| Setting | Development | Staging | Production |
|---------|-------------|---------|------------|
| **API URL** | localhost:5000 | staging-api.golbot.in | api.golbot.in |
| **Firmware Mode** | ❌ Manual | ✅ Auto | ✅ Auto |
| **Debug Logs** | ✅ Enabled | ✅ Enabled | ❌ Disabled |
| **Polling Interval** | 5s (slow) | 3s (fast) | 3s (fast) |
| **Auto Ready Delay** | 10s | 5s | 5s |
| **Auto Complete Delay** | 5s | 3s | 3s |
| **Heartbeat Interval** | 60s | 30s | 30s |
| **Immersive Mode** | ❌ Disabled | ✅ Enabled | ✅ Enabled |

### Environment Banners
- **Development**: 🔵 Blue "DEV" banner
- **Staging**: 🔶 Orange "STAGING" banner  
- **Production**: 🚫 No banner (clean interface)

## 🔒 Security Features

### Network Security
- **Development**: Allows HTTP to localhost
- **Staging/Production**: HTTPS only, no cleartext traffic allowed
- **API Authentication**: Mobile API key validation

### Debug Protection
- Production builds automatically strip all debug statements
- No sensitive information exposed in production logs

## 🚀 Deployment Workflow

### 1. Development Phase
```bash
# Test locally with manual control
flutter run -t lib/main_dev.dart --flavor dev
```

### 2. Staging Validation
```bash
# Test with staging backend
flutter run -d chrome -t lib/main_staging.dart --flavor staging

# Build staging APK for device testing
build_staging.bat
```

### 3. Production Deployment
```bash
# Final web testing
flutter run -d chrome -t lib/main_prod.dart --flavor prod

# Build production APK
build_prod.bat

# Deploy to physical machines
adb install build/app/outputs/flutter-apk/app-prod-release.apk
```

## 📱 Multiple Installations

You can install all environments side-by-side on the same device:

```bash
# Install all builds simultaneously
adb install build/app/outputs/flutter-apk/app-dev-debug.apk
adb install build/app/outputs/flutter-apk/app-staging-release.apk  
adb install build/app/outputs/flutter-apk/app-prod-release.apk
```

Each appears as a separate app with distinct names and icons.

## 🐛 Troubleshooting

### Common Issues

**"Cleartext HTTP traffic not permitted"**
- Solution: Use correct flavor for your environment
- Dev allows HTTP, Staging/Prod require HTTPS

**"Failed to connect to API"**
- Check if backend server is running
- Verify API URLs in config files
- Confirm network connectivity

**Wrong environment behavior**
- Verify you're using correct main entry point (`main_dev.dart`, `main_staging.dart`, `main_prod.dart`)
- Ensure flavor matches (`--flavor dev`, `--flavor staging`, `--flavor prod`)

### Debug Commands

```bash
# Check Flutter doctor
flutter doctor

# Clean build cache
flutter clean
flutter pub get

# Verbose build output
flutter build apk -t lib/main_prod.dart --flavor prod --release --verbose
```

## 📋 Pre-Deployment Checklist

### Staging Checklist
- [ ] Backend staging server is running
- [ ] API endpoints are accessible
- [ ] Database is populated with test data
- [ ] Payment gateway is in test mode
- [ ] QR code scanning works
- [ ] Auto-progression flows correctly
- [ ] Error handling works properly

### Production Checklist  
- [ ] Backend production server is deployed
- [ ] SSL certificates are valid
- [ ] Database is properly seeded
- [ ] Payment gateway is in live mode
- [ ] All API keys are production keys
- [ ] Machine hardware is configured
- [ ] Network connectivity is stable
- [ ] Physical installation is complete

## 📞 Support

For build issues or questions:
1. Check configuration files in `lib/config/`
2. Review build logs for errors
3. Verify Flutter and Android SDK versions
4. Check network security configurations in `android/app/src/{flavor}/res/xml/`

## 📄 Files Structure

```
lib/
├── config/
│   ├── dev_config.dart          # Development configuration
│   ├── staging_config.dart      # Staging configuration  
│   └── prod_config.dart         # Production configuration
├── main_dev.dart                # Development entry point
├── main_staging.dart            # Staging entry point
└── main_prod.dart               # Production entry point

build_scripts/
├── build_dev.bat                # Build development APK
├── build_staging.bat            # Build staging APK
└── build_prod.bat               # Build production APK
```
