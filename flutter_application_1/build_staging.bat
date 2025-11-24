@echo off
echo ========================================
echo Building Golbot Staging APK
echo ========================================
echo.
echo Environment: Staging
echo App Name: Golbot Staging
echo Package: com.golbot.machine.staging
echo API: https://staging-api.golbot.in
echo.
flutter build apk -t lib/main_staging.dart --flavor staging --release
echo.
echo ========================================
echo Build complete!
echo Output: build\app\outputs\flutter-apk\app-staging-release.apk
echo ========================================
pause
