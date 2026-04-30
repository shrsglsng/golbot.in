import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
  'NODE_ENV',
  'EXPAPP_MONGO_URL',
  'EXPAPP_PORT',
  'EXPAPP_JWT_SECRET',
  'MOBILE_APP_API_KEY',
  'STARTMESSAGING_API_KEY',
  'PAYMENT_GATEWAY',
  'AWS_SECRET_ID',
  'AWS_SECRET_KEY',
  'AWS_BUCKET_NAME',
  'AWS_REGION',
  'USER_WEB_URL',
  'ADMIN_WEB_URL'
];

const conditionalEnvVars = {
  razorpay: ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'],
  phonepe: ['PHONEPE_ENV', 'PHONEPE_CLIENT_ID', 'PHONEPE_CLIENT_SECRET']
};

let hasErrors = false;

console.log('\n🔍 Validating environment variables...\n');

// Check required variables
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    hasErrors = true;
  } else {
    console.log(`✓ ${varName}`);
  }
});

// Check conditional variables based on payment gateway
const paymentGateway = process.env.PAYMENT_GATEWAY?.toLowerCase();
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

// Check for production-specific requirements
if (process.env.NODE_ENV === 'production') {
  console.log('\n🔍 Validating production-specific requirements...\n');

  if (process.env.EXPAPP_JWT_SECRET?.includes('dev') || process.env.EXPAPP_JWT_SECRET?.length < 32) {
    console.error('❌ Production JWT secret is weak or contains "dev"');
    hasErrors = true;
  } else {
    console.log('✓ JWT secret is strong');
  }

  if (process.env.PHONEPE_ENV === 'sandbox') {
    console.warn('⚠️  Warning: Using PhonePe sandbox mode in production');
  }

  if (process.env.RAZORPAY_KEY_ID?.includes('test')) {
    console.warn('⚠️  Warning: Using Razorpay test keys in production');
  }

  if (process.env.DEBUG === 'true') {
    console.warn('⚠️  Warning: Debug mode is enabled in production');
  }
}

if (hasErrors) {
  console.error('\n❌ Environment validation failed. Please check your .env file.\n');
  process.exit(1);
} else {
  console.log('\n✓ All required environment variables are set!\n');
}
