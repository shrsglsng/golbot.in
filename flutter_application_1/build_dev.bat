@echo off
echo ========================================
echo Building Golbot Dev APK
echo ========================================
echo.
echo Environment: Development
echo App Name: Golbot Dev
echo Package: com.golbot.machine.dev
echo API: http://localhost:5000
echo.
flutter build apk -t lib/main_dev.dart --flavor dev
echo.
echo ========================================
echo Build complete!
echo Output: build\app\outputs\flutter-apk\app-dev-debug.apk
echo ========================================
pause
