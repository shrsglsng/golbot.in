#!/bin/bash

# PM2 Setup Script for EC2
# This script installs PM2 and sets up the GolBot API server

set -e  # Exit on error

echo "========================================="
echo "PM2 Setup for GolBot API"
echo "========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✓ npm version: $(npm --version)"
echo ""

# Install PM2 globally if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 globally..."
    npm install -g pm2
    echo "✓ PM2 installed successfully"
else
    echo "✓ PM2 is already installed: $(pm2 --version)"
fi

echo ""

# Ask user which environment to set up
echo "Which environment do you want to run?"
echo "1) Development"
echo "2) Production"
read -p "Enter choice (1 or 2): " env_choice

if [ "$env_choice" == "1" ]; then
    ENV="development"
    APP_NAME="golbot-api-dev"
elif [ "$env_choice" == "2" ]; then
    ENV="production"
    APP_NAME="golbot-api-prod"
else
    echo "❌ Invalid choice. Exiting."
    exit 1
fi

echo ""
echo "Setting up $ENV environment..."
echo ""

# Navigate to server directory
cd "$(dirname "$0")/.."

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✓ Dependencies installed"
echo ""

# Setup environment file
echo "🔧 Setting up environment configuration..."
npm run env:$([[ "$ENV" == "development" ]] && echo "dev" || echo "prod")
echo ""

# Validate environment
echo "🔍 Validating environment configuration..."
npm run env:validate
echo ""

# Stop existing PM2 process if running
if pm2 list | grep -q "$APP_NAME"; then
    echo "⚠️  Stopping existing $APP_NAME process..."
    pm2 delete "$APP_NAME"
fi

# Start the application with PM2
echo "🚀 Starting $APP_NAME with PM2..."
if [ "$ENV" == "development" ]; then
    npm run pm2:dev
else
    npm run pm2:prod
fi

echo ""
echo "✓ Application started successfully!"
echo ""

# Save PM2 process list
echo "💾 Saving PM2 process list..."
pm2 save

# Setup PM2 startup script (for auto-restart on server reboot)
echo ""
echo "🔄 Setting up PM2 startup script..."
echo "Run the following command to enable auto-start on system reboot:"
echo ""
pm2 startup | grep "sudo"
echo ""

# Show status
echo "========================================="
echo "Application Status:"
echo "========================================="
pm2 status

echo ""
echo "========================================="
echo "Useful PM2 Commands:"
echo "========================================="
echo "View logs:        pm2 logs $APP_NAME"
echo "Monitor:          pm2 monit"
echo "Restart:          pm2 restart $APP_NAME"
echo "Stop:             pm2 stop $APP_NAME"
echo "Delete:           pm2 delete $APP_NAME"
echo "Status:           pm2 status"
echo ""
echo "Or use npm scripts:"
echo "npm run pm2:logs:$([[ "$ENV" == "development" ]] && echo "dev" || echo "prod")"
echo "npm run pm2:restart:$([[ "$ENV" == "development" ]] && echo "dev" || echo "prod")"
echo "npm run pm2:stop:$([[ "$ENV" == "development" ]] && echo "dev" || echo "prod")"
echo "npm run pm2:status"
echo ""
echo "✅ Setup complete!"
