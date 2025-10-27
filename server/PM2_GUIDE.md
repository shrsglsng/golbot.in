# PM2 Setup and Usage Guide

This guide explains how to use PM2 to run the GolBot API server on EC2 with separate development and production environments.

## What is PM2?

PM2 is a production process manager for Node.js applications. It provides:
- Auto-restart on crashes
- Load balancing (cluster mode)
- Log management
- Monitoring
- Auto-startup on system reboot

## Configuration

The PM2 configuration is defined in `ecosystem.config.cjs` with two separate apps:

1. **golbot-api-dev** - Development environment
   - Single instance (fork mode)
   - File watching enabled
   - Uses `.env.development`

2. **golbot-api-prod** - Production environment
   - Multiple instances (cluster mode)
   - File watching disabled
   - Uses `.env.production`

## Quick Setup on EC2

### Automated Setup

Run the automated setup script:

```bash
cd server
chmod +x scripts/pm2-setup.sh
./scripts/pm2-setup.sh
```

The script will:
1. Check Node.js and npm installation
2. Install PM2 globally
3. Prompt for environment (development/production)
4. Install dependencies
5. Setup environment files
6. Validate configuration
7. Start the application
8. Save PM2 process list

### Manual Setup

1. **Install PM2 globally:**
   ```bash
   npm install -g pm2
   ```

2. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

3. **Choose your environment:**

   **For Development:**
   ```bash
   npm run pm2:dev
   ```

   **For Production:**
   ```bash
   npm run pm2:prod
   ```

4. **Save PM2 process list:**
   ```bash
   pm2 save
   ```

5. **Setup auto-startup on system reboot:**
   ```bash
   pm2 startup
   # Copy and run the command shown in output
   ```

## NPM Scripts

### Starting the Application

```bash
# Development environment
npm run pm2:dev              # Setup env and start

# Production environment
npm run pm2:prod             # Setup env and start

# Start without env setup (if already configured)
npm run pm2:start:dev        # Start dev
npm run pm2:start:prod       # Start prod
```

### Managing the Application

```bash
# Stop
npm run pm2:stop:dev         # Stop development
npm run pm2:stop:prod        # Stop production

# Restart
npm run pm2:restart:dev      # Restart development
npm run pm2:restart:prod     # Restart production

# Reload (zero-downtime restart)
npm run pm2:reload:dev       # Reload development
npm run pm2:reload:prod      # Reload production

# Delete
npm run pm2:delete:dev       # Delete development process
npm run pm2:delete:prod      # Delete production process
```

### Monitoring and Logs

```bash
# View logs
npm run pm2:logs:dev         # View dev logs
npm run pm2:logs:prod        # View prod logs

# Monitor
npm run pm2:monit            # Real-time monitoring dashboard

# Status
npm run pm2:status           # View all processes status
```

### PM2 Management

```bash
npm run pm2:save             # Save current process list
npm run pm2:startup          # Generate startup script
```

## Direct PM2 Commands

You can also use PM2 commands directly:

### Process Management

```bash
# Start specific app
pm2 start ecosystem.config.cjs --only golbot-api-dev
pm2 start ecosystem.config.cjs --only golbot-api-prod

# Start all apps
pm2 start ecosystem.config.cjs

# Stop
pm2 stop golbot-api-dev
pm2 stop golbot-api-prod

# Restart
pm2 restart golbot-api-dev
pm2 restart golbot-api-prod

# Reload (zero-downtime)
pm2 reload golbot-api-dev
pm2 reload golbot-api-prod

# Delete
pm2 delete golbot-api-dev
pm2 delete golbot-api-prod

# Delete all
pm2 delete all
```

### Monitoring and Logs

```bash
# View logs
pm2 logs                     # All logs
pm2 logs golbot-api-dev      # Dev logs only
pm2 logs golbot-api-prod     # Prod logs only
pm2 logs --lines 100         # Last 100 lines

# Real-time monitoring
pm2 monit

# Status
pm2 status
pm2 list

# Process details
pm2 describe golbot-api-prod
pm2 show golbot-api-prod
```

### Log Management

```bash
# Flush logs
pm2 flush

# Clear all logs
pm2 flush all

# Rotate logs
pm2 install pm2-logrotate
```

## Deployment Workflow

### Initial Deployment to EC2

1. **SSH into EC2:**
   ```bash
   ssh ubuntu@your-ec2-ip
   ```

2. **Install Node.js (if not installed):**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone repository:**
   ```bash
   git clone <your-repo-url>
   cd golbot.in/server
   ```

4. **Run setup script:**
   ```bash
   chmod +x scripts/pm2-setup.sh
   ./scripts/pm2-setup.sh
   ```

5. **Enable startup on reboot:**
   ```bash
   pm2 startup
   # Run the sudo command shown in output
   pm2 save
   ```

### Updating Deployment

```bash
# SSH into EC2
ssh ubuntu@your-ec2-ip

# Navigate to project
cd golbot.in

# Pull latest changes
git pull origin main

# Navigate to server
cd server

# Install any new dependencies
npm install

# For development
npm run env:dev
npm run pm2:restart:dev

# For production
npm run env:prod
npm run pm2:reload:prod  # Zero-downtime restart

# Save PM2 list
pm2 save
```

## Environment Configuration

### Development Environment (golbot-api-dev)

- **Mode**: Fork (single instance)
- **Watch**: Enabled (auto-restart on file changes)
- **Environment File**: `.env.development`
- **Logs**: `./logs/pm2-dev-error.log` and `./logs/pm2-dev-out.log`
- **Memory Limit**: 500MB

### Production Environment (golbot-api-prod)

- **Mode**: Cluster (multiple instances based on CPU cores)
- **Watch**: Disabled
- **Environment File**: `.env.production`
- **Logs**: `./logs/pm2-prod-error.log` and `./logs/pm2-prod-out.log`
- **Memory Limit**: 500MB
- **Auto-restart**: Enabled with exponential backoff

## Troubleshooting

### Application Won't Start

1. Check logs:
   ```bash
   npm run pm2:logs:prod
   ```

2. Validate environment:
   ```bash
   npm run env:validate
   ```

3. Check environment file exists:
   ```bash
   ls -la .env*
   ```

4. Verify Node.js version:
   ```bash
   node --version  # Should be 16+
   ```

### Application Crashes

1. View error logs:
   ```bash
   pm2 logs golbot-api-prod --err
   ```

2. Check restart count:
   ```bash
   pm2 status
   ```

3. Describe process:
   ```bash
   pm2 describe golbot-api-prod
   ```

### High Memory Usage

1. Monitor memory:
   ```bash
   pm2 monit
   ```

2. Adjust memory limit in `ecosystem.config.cjs`:
   ```javascript
   max_memory_restart: '1G'  // Increase to 1GB
   ```

3. Restart application:
   ```bash
   npm run pm2:reload:prod
   ```

### Port Already in Use

1. Check if another process is using the port:
   ```bash
   lsof -i :5000
   ```

2. Stop the conflicting process:
   ```bash
   pm2 delete all
   ```

3. Or change port in `.env`:
   ```env
   EXPAPP_PORT=5001
   ```

## Auto-Startup on Server Reboot

To ensure your application starts automatically when EC2 reboots:

```bash
# Generate startup script
pm2 startup

# Copy and run the sudo command shown (example):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Save current process list
pm2 save

# Test by rebooting
sudo reboot

# After reboot, check status
pm2 status
```

## Monitoring in Production

### Real-time Monitoring

```bash
pm2 monit
```

Shows:
- CPU usage
- Memory usage
- Log streams

### Web-based Monitoring (PM2 Plus)

For advanced monitoring, consider PM2 Plus (optional):

```bash
pm2 link <secret_key> <public_key>
```

Visit https://app.pm2.io for web dashboard.

## Best Practices

1. **Always save after changes:**
   ```bash
   pm2 save
   ```

2. **Use reload for zero-downtime:**
   ```bash
   npm run pm2:reload:prod
   ```

3. **Monitor logs regularly:**
   ```bash
   npm run pm2:logs:prod
   ```

4. **Check health periodically:**
   ```bash
   npm run pm2:status
   ```

5. **Keep PM2 updated:**
   ```bash
   npm install -g pm2@latest
   pm2 update
   ```

## Additional Resources

- PM2 Documentation: https://pm2.keymetrics.io/docs/usage/quick-start/
- PM2 Cluster Mode: https://pm2.keymetrics.io/docs/usage/cluster-mode/
- PM2 Startup: https://pm2.keymetrics.io/docs/usage/startup/

---

For more information about environment configuration, see [ENV_SETUP_GUIDE.md](../../ENV_SETUP_GUIDE.md)
