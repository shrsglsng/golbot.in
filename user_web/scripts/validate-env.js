const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const requiredEnvVars = [
  'NEXT_PUBLIC_SERVER_URL',
  'NEXT_PUBLIC_ENVIRONMENT',
  'NEXT_PUBLIC_PAYMENT_GATEWAY',
  'NEXT_PUBLIC_PHONEPE_ENV'
];

const conditionalEnvVars = {
  razorpay: ['NEXT_PUBLIC_RAZORPAY_KEY_ID']
};

let hasErrors = false;

console.log('\n🔍 Validating frontend environment variables...\n');

// Check required variables
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    hasErrors = true;
  } else {
    console.log(`✓ ${varName}: ${process.env[varName]}`);
  }
});

// Check conditional variables based on payment gateway
const paymentGateway = process.env.NEXT_PUBLIC_PAYMENT_GATEWAY?.toLowerCase();
if (paymentGateway && conditionalEnvVars[paymentGateway]) {
  console.log(`\n🔍 Validating ${paymentGateway.toUpperCase()} configuration...\n`);
  conditionalEnvVars[paymentGateway].forEach(varName => {
    if (!process.env[varName]) {
      console.error(`❌ Missing ${paymentGateway} variable: ${varName}`);
      hasErrors = true;
    } else {
      console.log(`✓ ${varName}`);
    }
  });
}

// Check for environment consistency
if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'production') {
  console.log('\n🔍 Validating production-specific requirements...\n');

  if (process.env.NEXT_PUBLIC_SERVER_URL?.includes('localhost')) {
    console.error('❌ Production environment should not use localhost server URL');
    hasErrors = true;
  }

  if (process.env.NEXT_PUBLIC_PHONEPE_ENV === 'sandbox') {
    console.warn('⚠️  Warning: Using PhonePe sandbox mode in production');
  }

  if (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.includes('test')) {
    console.warn('⚠️  Warning: Using Razorpay test keys in production');
  }

  if (process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true') {
    console.warn('⚠️  Warning: Debug mode is enabled in production');
  }
}

if (hasErrors) {
  console.error('\n❌ Environment validation failed. Please check your .env file.\n');
  process.exit(1);
} else {
  console.log('\n✓ All required environment variables are set!\n');
}
