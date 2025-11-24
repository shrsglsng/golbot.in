@echo off
echo ========================================
echo Building Golbot Production APK
echo ========================================
echo.
echo Environment: Production
echo App Name: Golbot Machine
echo Package: com.golbot.machine
echo API: https://api.golbot.in
echo.
echo WARNING: This builds the PRODUCTION APK!
echo.
set /p confirm="Are you sure you want to build production? (Y/N): "
if /i "%confirm%" NEQ "Y" (
    echo Build cancelled.
    pause
    exit /b
)
echo.
flutter build apk -t lib/main_prod.dart --flavor prod --release
echo.
echo ========================================
echo Build complete!
echo Output: build\app\outputs\flutter-apk\app-prod-release.apk
echo ========================================
pause
