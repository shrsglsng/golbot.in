@echo off
echo ========================================
echo Golbot Configuration Setup
echo ========================================
echo.
echo This script will set up your local configuration files.
echo.

cd lib\config

echo Checking for existing configs...
echo.

if exist prod_config.dart (
    echo [WARNING] prod_config.dart already exists!
    set /p overwrite="Do you want to overwrite it? (Y/N): "
    if /i "%overwrite%" NEQ "Y" (
        echo Skipping prod_config.dart
        goto :skip_prod
    )
)

echo Creating prod_config.dart from template...
copy prod_config.template.dart prod_config.dart
echo [OK] Created prod_config.dart

:skip_prod

if exist staging_config.dart (
    echo [WARNING] staging_config.dart already exists!
    set /p overwrite="Do you want to overwrite it? (Y/N): "
    if /i "%overwrite%" NEQ "Y" (
        echo Skipping staging_config.dart
        goto :skip_staging
    )
)

echo Creating staging_config.dart from template...
copy staging_config.template.dart staging_config.dart
echo [OK] Created staging_config.dart

:skip_staging

cd ..\..

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo IMPORTANT: You still need to update the API keys in:
echo   - lib\config\prod_config.dart
echo   - lib\config\staging_config.dart
echo.
echo Replace 'YOUR_*_API_KEY_HERE' with actual keys.
echo.
echo See SECURITY_SETUP.md for detailed instructions.
echo.
pause
