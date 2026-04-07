# Deployment Guide

This guide explains how to configure and deploy the GolBot application for both local development and production environments.

## Overview

The application consists of two main components:
- **Server**: Backend API (will be deployed to EC2)
- **User Web**: Frontend application (will be deployed to Vercel)

Both components have separate environment configurations for development and production.

## Quick Start

### Switch All Environments at Once

# Switch to development (local)
node switch-env.js development

## Troubleshooting: Invalid Environment Error

**Issue:** Running a development command fails with `Error: Invalid environment "development"`

**Solution:**
The "development" environment is missing from the `envFiles` configuration. To fix this:

1. Navigate to the `script` folder in both the `server` and `user_web` directories
2. Open `env-setup.js` in each location
3. Add "development" to the `envFiles` array if it's not already present

# Switch to production
node switch-env.js production

Use the root-level script to switch both server and user_web environments simultaneously:

```bash
# Switch to development (local)
node switch-env.js development

## Troubleshooting: Invalid Environment Error

**Issue:** Running a development command fails with `Error: Invalid environment "development"`

**Solution:**
The "development" environment is missing from the `envFiles` configuration. To fix this:

1. Navigate to the `script` folder in both the `server` and `user_web` directories
2. Open `env-setup.js` in each location
3. Add "development" to the `envFiles` array if it's not already present

# Switch to production
node switch-env.js production
```

### Individual Project Environment Switching

If you need to switch environments for individual projects:

**Server:**
```bash
cd server
npm run env:dev      # Switch to development
npm run env:prod     # Switch to production
npm run env:validate # Validate current environment
```

**User Web:**
```bash
cd user_web
npm run env:dev      # Switch to development
npm run env:prod     # Switch to production
npm run env:validate # Validate current environment
```

## Environment Files Structure

### Server (.env files)
- `.env.development` - Local development configuration
- `.env.production` - Production configuration (for EC2 deployment)
- `.env.example` - Template file (never commit real secrets here)
- `.env` - Active environment (auto-generated, git-ignored)

### User Web (.env files)
- `.env.development` - Local development configuration
- `.env.production` - Production configuration (for Vercel deployment)
- `.env.example` - Template file
- `.env` - Active environment (auto-generated, git-ignored)

## Configuration Steps

### 1. Initial Setup

1. Clone the repository
2. Copy environment templates:
   ```bash
   # Server
   cd server
   cp .env.example .env.development
   cp .env.example .env.production

   # User Web
   cd user_web
   cp .env.example .env.development
   cp .env.example .env.production
   ```

3. Fill in your actual secrets in both `.env.development` and `.env.production` files

### 2. Development Environment Setup

Configure `.env.development` files with your local/test credentials:

**Server (.env.development):**
- Use local MongoDB or development database
- PhonePe sandbox mode
- Razorpay test keys
- Development AWS bucket
- Local URLs (localhost:3000, localhost:5000)

**User Web (.env.development):**
```env
NEXT_PUBLIC_SERVER_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_PHONEPE_ENV=sandbox
NEXT_PUBLIC_ENVIRONMENT=development
```

### 3. Production Environment Setup

Configure `.env.production` files with production credentials:

**Server (.env.production):**
Update these critical values:
- `NODE_ENV=production`
- Production MongoDB URL
- Strong JWT secret (min 32 characters)
- PhonePe production credentials
- Razorpay live keys
- Production AWS bucket and credentials
- Your production domain URLs

**User Web (.env.production):**
```env
NEXT_PUBLIC_SERVER_URL=https://your-backend-domain.com/api/v1
NEXT_PUBLIC_PHONEPE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=production
```

## Running the Application

### Local Development

1. Switch to development environment:
   ```bash
   node switch-env.js development
   ```

2. Start the server:
   ```bash
   cd server
   npm install
   npm run dev
   ```

3. Start the frontend:
   ```bash
   cd user_web
   npm install
   npm run dev
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api/v1

### Production Deployment

#### Backend (EC2)

**Option 1: Automated PM2 Setup (Recommended)**

1. SSH into your EC2 instance

2. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd golbot.in/server
   ```

3. Run the automated setup script:
   ```bash
   chmod +x scripts/pm2-setup.sh
   ./scripts/pm2-setup.sh
   ```

4. Follow the prompts to select production environment

5. Enable auto-startup on server reboot:
   ```bash
   # Run the sudo command shown in the setup output
   pm2 save
   ```

**Option 2: Manual PM2 Setup**

1. SSH into your EC2 instance

2. Install PM2 globally (if not installed):
   ```bash
   npm install -g pm2
   ```

3. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd golbot.in/server
   ```

4. Setup production environment:
   ```bash
   npm install
   npm run env:prod
   npm run env:validate
   ```

5. Start with PM2:
   ```bash
   npm run pm2:prod
   ```

6. Save PM2 process and enable auto-startup:
   ```bash
   pm2 save
   pm2 startup
   # Run the sudo command shown in output
   ```

**Option 3: Direct Node.js (Not Recommended for Production)**

```bash
cd server
npm install
npm run env:prod
npm run start:production
```

**PM2 Management Commands:**

```bash
# View status
npm run pm2:status

# View logs
npm run pm2:logs:prod

# Restart (zero-downtime)
npm run pm2:reload:prod

# Stop
npm run pm2:stop:prod

# Monitor
npm run pm2:monit
```

For comprehensive PM2 documentation, see [server/PM2_GUIDE.md](server/PM2_GUIDE.md)

**Configure nginx/reverse proxy:**

Configure nginx to forward requests to port 5000 (or your configured port)

#### Frontend (Vercel)

**Option 1: Using Vercel CLI**

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Switch to production and build:
   ```bash
   cd user_web
   npm run env:prod
   npm run build:production
   ```

3. Deploy to Vercel:
   ```bash
   vercel --prod
   ```

**Option 2: Using Vercel Dashboard**

1. Connect your GitHub repository to Vercel

2. Configure environment variables in Vercel Dashboard:
   - Go to Project Settings > Environment Variables
   - Add all variables from `user_web/.env.production`:
     - `NEXT_PUBLIC_SERVER_URL`
     - `NEXT_PUBLIC_PHONEPE_ENV`
     - `NEXT_PUBLIC_PAYMENT_GATEWAY`
     - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
     - `NEXT_PUBLIC_ENVIRONMENT`

3. Set build settings:
   - Framework Preset: Next.js
   - Root Directory: `user_web`
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. Deploy from dashboard or push to your main branch for auto-deployment

## Environment Validation

Always validate your environment after switching:

```bash
# Validate all
node switch-env.js production

# Or validate individually
cd server && npm run env:validate
cd user_web && npm run env:validate
```

The validation script will check:
- All required environment variables are set
- Production-specific security requirements
- Payment gateway configuration
- No test credentials in production

## Important Security Notes

1. **Never commit `.env`, `.env.development`, or `.env.production` files** - They are already in `.gitignore`

2. **Production Checklist:**
   - [ ] Strong JWT secret (min 32 characters)
   - [ ] Production payment gateway credentials
   - [ ] Production MongoDB credentials
   - [ ] Production AWS credentials
   - [ ] Correct CORS origins
   - [ ] Debug mode disabled
   - [ ] Rate limiting enabled
   - [ ] HTTPS enabled

3. **Rotate secrets regularly** in production

4. **Use different databases** for development and production

## Troubleshooting

### Environment not switching
```bash
# Check if environment files exist
ls -la server/.env*
ls -la user_web/.env*

# Manually copy environment file
cd server
cp .env.production .env
```

### Validation errors
```bash
# Check what's missing
npm run env:validate

# Review your .env file
cat .env
```

### API connection issues
- Verify `NEXT_PUBLIC_SERVER_URL` in user_web matches your backend URL
- Check CORS_ORIGIN in server includes your frontend URL
- Ensure backend is running and accessible

## Additional Scripts

### Server

**Development:**
- `npm run dev` - Start development server with nodemon
- `npm run dev:local` - Start with .env.development explicitly
- `npm run dev:debug` - Start with debugging enabled

**Production:**
- `npm run start:production` - Start with .env.production explicitly

**PM2 (Process Management):**
- `npm run pm2:dev` - Start with PM2 in development mode
- `npm run pm2:prod` - Start with PM2 in production mode
- `npm run pm2:restart:prod` - Restart production instance
- `npm run pm2:reload:prod` - Zero-downtime restart
- `npm run pm2:stop:prod` - Stop production instance
- `npm run pm2:logs:prod` - View production logs
- `npm run pm2:status` - View all PM2 processes
- `npm run pm2:monit` - Real-time monitoring

**Utilities:**
- `npm run health` - Check server health
- `npm run logs` - View logs
- `npm run logs:error` - View error logs only
- `npm run env:validate` - Validate environment configuration

See [server/PM2_GUIDE.md](server/PM2_GUIDE.md) for comprehensive PM2 documentation.

### User Web
- `npm run dev` - Start development server
- `npm run dev:local` - Start with development environment
- `npm run build` - Build for production
- `npm run build:production` - Build with production environment
- `npm run start` - Start production server
- `npm run env:validate` - Validate environment configuration

## Support

For issues or questions:
1. Check this documentation
2. Validate your environment configuration
3. Check application logs
4. Review environment variables in `.env` file

---

**Remember:** Always test in development before deploying to production!
