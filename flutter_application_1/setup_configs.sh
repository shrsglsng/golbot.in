#!/bin/bash

echo "========================================"
echo "Golbot Configuration Setup"
echo "========================================"
echo ""
echo "This script will set up your local configuration files."
echo ""

cd lib/config

echo "Checking for existing configs..."
echo ""

# Setup prod config
if [ -f "prod_config.dart" ]; then
    echo "[WARNING] prod_config.dart already exists!"
    read -p "Do you want to overwrite it? (Y/N): " overwrite
    if [[ ! $overwrite =~ ^[Yy]$ ]]; then
        echo "Skipping prod_config.dart"
    else
        echo "Creating prod_config.dart from template..."
        cp prod_config.template.dart prod_config.dart
        echo "[OK] Created prod_config.dart"
    fi
else
    echo "Creating prod_config.dart from template..."
    cp prod_config.template.dart prod_config.dart
    echo "[OK] Created prod_config.dart"
fi

# Setup staging config
if [ -f "staging_config.dart" ]; then
    echo "[WARNING] staging_config.dart already exists!"
    read -p "Do you want to overwrite it? (Y/N): " overwrite
    if [[ ! $overwrite =~ ^[Yy]$ ]]; then
        echo "Skipping staging_config.dart"
    else
        echo "Creating staging_config.dart from template..."
        cp staging_config.template.dart staging_config.dart
        echo "[OK] Created staging_config.dart"
    fi
else
    echo "Creating staging_config.dart from template..."
    cp staging_config.template.dart staging_config.dart
    echo "[OK] Created staging_config.dart"
fi

cd ../..

echo ""
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "IMPORTANT: You still need to update the API keys in:"
echo "  - lib/config/prod_config.dart"
echo "  - lib/config/staging_config.dart"
echo ""
echo "Replace 'YOUR_*_API_KEY_HERE' with actual keys."
echo ""
echo "See SECURITY_SETUP.md for detailed instructions."
echo ""
