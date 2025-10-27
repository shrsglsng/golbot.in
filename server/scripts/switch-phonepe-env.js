#!/usr/bin/env node

/**
 * PhonePe Environment Switcher
 * 
 * Usage:
 *   node scripts/switch-phonepe-env.js test      # Switch to test environment
 *   node scripts/switch-phonepe-env.js prod      # Switch to production environment
 *   node scripts/switch-phonepe-env.js status    # Show current environment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENV_FILE_PATH = path.join(__dirname, '..', '.env');

const showUsage = () => {
  console.log(`
🚀 PhonePe Environment Switcher

Usage:
  npm run phonepe:test     # Switch to test environment
  npm run phonepe:prod     # Switch to production environment  
  npm run phonepe:status   # Show current environment

Or directly:
  node scripts/switch-phonepe-env.js test
  node scripts/switch-phonepe-env.js prod
  node scripts/switch-phonepe-env.js status
`);
};

const getCurrentEnvironment = () => {
  try {
    const envContent = fs.readFileSync(ENV_FILE_PATH, 'utf8');
    const envMatch = envContent.match(/PHONEPE_ENVIRONMENT=(.+)/);
    const frontendMatch = envContent.match(/NEXT_PUBLIC_PHONEPE_ENVIRONMENT=(.+)/);
    
    return {
      backend: envMatch ? envMatch[1].trim() : 'unknown',
      frontend: frontendMatch ? frontendMatch[1].trim() : 'unknown'
    };
  } catch (error) {
    console.error('❌ Error reading .env file:', error.message);
    return { backend: 'unknown', frontend: 'unknown' };
  }
};

const switchEnvironment = (targetEnv) => {
  try {
    let envContent = fs.readFileSync(ENV_FILE_PATH, 'utf8');
    
    // Update backend environment
    envContent = envContent.replace(
      /PHONEPE_ENVIRONMENT=.*/,
      `PHONEPE_ENVIRONMENT=${targetEnv}`
    );
    
    // Update frontend environment  
    envContent = envContent.replace(
      /NEXT_PUBLIC_PHONEPE_ENVIRONMENT=.*/,
      `NEXT_PUBLIC_PHONEPE_ENVIRONMENT=${targetEnv}`
    );
    
    fs.writeFileSync(ENV_FILE_PATH, envContent);
    
    console.log(`✅ Successfully switched PhonePe environment to: ${targetEnv}`);
    
    // Show current configuration
    showStatus();
    
    console.log(`
⚠️  Important: 
   - Restart your server for changes to take effect
   - Make sure you have the correct credentials configured for ${targetEnv} environment
`);
    
  } catch (error) {
    console.error('❌ Error updating .env file:', error.message);
    process.exit(1);
  }
};

const showStatus = () => {
  const current = getCurrentEnvironment();
  
  console.log(`
📊 Current PhonePe Environment Status:

Backend Environment:  ${current.backend}
Frontend Environment: ${current.frontend}

${current.backend === 'test' ? '🧪' : '🚀'} Current Mode: ${current.backend.toUpperCase()}
${current.backend === 'test' 
  ? '   Using PhonePe Sandbox (Test Environment)' 
  : '   Using PhonePe Production (Live Environment)'}

Configuration:
   Backend:  PHONEPE_ENVIRONMENT=${current.backend}
   Frontend: NEXT_PUBLIC_PHONEPE_ENVIRONMENT=${current.frontend}
`);

  // Show which credentials are being used
  try {
    const envContent = fs.readFileSync(ENV_FILE_PATH, 'utf8');
    const testClientId = envContent.match(/PHONEPE_TEST_CLIENT_ID=(.+)/)?.[1];
    const prodClientId = envContent.match(/PHONEPE_PROD_CLIENT_ID=(.+)/)?.[1];
    
    console.log(`Credentials:
   Test Client ID:       ${testClientId || 'Not configured'}
   Production Client ID: ${prodClientId || 'Not configured'}
`);
  } catch (error) {
    console.log('Could not read credential information');
  }
};

const validateCredentials = (env) => {
  try {
    const envContent = fs.readFileSync(ENV_FILE_PATH, 'utf8');
    
    if (env === 'production') {
      const prodClientId = envContent.match(/PHONEPE_PROD_CLIENT_ID=(.+)/)?.[1];
      const prodClientSecret = envContent.match(/PHONEPE_PROD_CLIENT_SECRET=(.+)/)?.[1];
      
      if (!prodClientId || prodClientId === 'YOUR_PRODUCTION_CLIENT_ID') {
        console.log('⚠️  Warning: Production Client ID not configured properly');
      }
      if (!prodClientSecret || prodClientSecret === 'YOUR_PRODUCTION_API_KEY') {
        console.log('⚠️  Warning: Production Client Secret not configured properly');
      }
    }
  } catch (error) {
    console.log('Could not validate credentials');
  }
};

// Main execution
const main = () => {
  const command = process.argv[2];
  
  switch (command) {
    case 'test':
    case 'testing':
    case 'sandbox':
      switchEnvironment('test');
      validateCredentials('test');
      break;
      
    case 'prod':
    case 'production':
    case 'live':
      switchEnvironment('production');
      validateCredentials('production');
      break;
      
    case 'status':
    case 'current':
    case 'info':
      showStatus();
      break;
      
    default:
      if (!command) {
        showStatus();
      } else {
        console.log(`❌ Unknown command: ${command}`);
        showUsage();
        process.exit(1);
      }
      break;
  }
};

main();