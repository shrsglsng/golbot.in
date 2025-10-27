/**
 * Payment Gateway Configuration Manager
 * 
 * Supports multiple environment combinations:
 * 1. test user web + test server
 * 2. test user web + prod server  
 * 3. prod user web + test server
 * 4. prod user web + prod server
 */

import dotenv from "dotenv";
dotenv.config();

// Environment configuration
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const PAYMENT_GATEWAY = process.env.PAYMENT_GATEWAY || 'phonepe'; // 'razorpay' | 'phonepe'
const PHONEPE_ENVIRONMENT = process.env.PHONEPE_ENVIRONMENT || 'test'; // 'test' | 'production'

// Determine PhonePe environment and credentials
const PHONEPE_ENV = PHONEPE_ENVIRONMENT === 'production' ? 'production' : 'sandbox';
const PHONEPE_CLIENT_ID = PHONEPE_ENVIRONMENT === 'production' 
  ? process.env.PHONEPE_PROD_CLIENT_ID 
  : process.env.PHONEPE_TEST_CLIENT_ID;
const PHONEPE_CLIENT_SECRET = PHONEPE_ENVIRONMENT === 'production' 
  ? process.env.PHONEPE_PROD_CLIENT_SECRET 
  : process.env.PHONEPE_TEST_CLIENT_SECRET;

// Base URLs for different environments
const PHONEPE_BASE_URLS = {
  sandbox: {
    api: 'https://api-preprod.phonepe.com/apis/pg-sandbox',
    auth: 'https://api-preprod.phonepe.com/apis/pg-sandbox'
  },
  production: {
    api: 'https://api.phonepe.com/apis/pg',
    auth: 'https://api.phonepe.com/apis/identity-manager'
  }
};

// Razorpay configuration
const RAZORPAY_CONFIG = {
  enabled: PAYMENT_GATEWAY === 'razorpay',
  keyId: process.env.RAZORPAY_KEY_ID,
  keySecret: process.env.RAZORPAY_KEY_SECRET,
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  currency: 'INR'
};

// PhonePe configuration
const PHONEPE_CONFIG = {
  enabled: PAYMENT_GATEWAY === 'phonepe',
  environment: PHONEPE_ENV,
  environmentFlag: PHONEPE_ENVIRONMENT, // 'test' | 'production'
  baseUrl: PHONEPE_BASE_URLS[PHONEPE_ENV].api,
  authBaseUrl: PHONEPE_BASE_URLS[PHONEPE_ENV].auth,
  clientId: PHONEPE_CLIENT_ID,
  clientVersion: process.env.PHONEPE_CLIENT_VERSION || '1',
  clientSecret: PHONEPE_CLIENT_SECRET,
  webhookUser: process.env.PHONEPE_WEBHOOK_USER,
  webhookPass: process.env.PHONEPE_WEBHOOK_PASS,
  webhookStrict: process.env.PHONEPE_WEBHOOK_STRICT === 'true',
  redirectUrl: process.env.PHONEPE_REDIRECT_URL,
  currency: 'INR'
};

// General payment configuration
const PAYMENT_CONFIG = {
  activeGateway: PAYMENT_GATEWAY,
  environment: ENVIRONMENT,
  currency: 'INR',
  defaultTimeout: 5 * 60 * 1000, // 5 minutes
  retryAttempts: 3,
  
  // Feature flags
  features: {
    allowRazorpay: process.env.ALLOW_RAZORPAY === 'true' || PAYMENT_GATEWAY === 'razorpay',
    allowPhonePe: process.env.ALLOW_PHONEPE === 'true' || PAYMENT_GATEWAY === 'phonepe',
    webhookVerification: process.env.WEBHOOK_VERIFICATION !== 'false'
  }
};

// Frontend URLs for redirects
const FRONTEND_CONFIG = {
  userWebUrl: process.env.USER_WEB_URL || process.env.FRONTEND_URL || 'http://localhost:3000',
  adminWebUrl: process.env.ADMIN_WEB_URL || process.env.ADMIN_URL || 'http://localhost:3001',
  successRoute: '/payment/{orderId}/success',
  failureRoute: '/payment/{orderId}/failed',
  redirectRoute: '/payment/{orderId}/redirect'
};

// Validation function
const validateConfig = () => {
  const errors = [];

  if (PAYMENT_GATEWAY === 'razorpay') {
    if (!RAZORPAY_CONFIG.keyId) errors.push('RAZORPAY_KEY_ID is required');
    if (!RAZORPAY_CONFIG.keySecret) errors.push('RAZORPAY_KEY_SECRET is required');
  }

  if (PAYMENT_GATEWAY === 'phonepe') {
    if (!PHONEPE_CLIENT_ID) {
      const requiredVar = PHONEPE_ENVIRONMENT === 'production' 
        ? 'PHONEPE_PROD_CLIENT_ID' 
        : 'PHONEPE_TEST_CLIENT_ID';
      errors.push(`${requiredVar} is required for ${PHONEPE_ENVIRONMENT} environment`);
    }
    if (!PHONEPE_CLIENT_SECRET) {
      const requiredVar = PHONEPE_ENVIRONMENT === 'production' 
        ? 'PHONEPE_PROD_CLIENT_SECRET' 
        : 'PHONEPE_TEST_CLIENT_SECRET';
      errors.push(`${requiredVar} is required for ${PHONEPE_ENVIRONMENT} environment`);
    }
    if (!PHONEPE_CONFIG.redirectUrl) errors.push('PHONEPE_REDIRECT_URL is required');
  }

  if (errors.length > 0) {
    throw new Error(`Payment configuration errors: ${errors.join(', ')}`);
  }
};

// Export configuration object
export const paymentConfig = {
  general: PAYMENT_CONFIG,
  razorpay: RAZORPAY_CONFIG,
  phonepe: PHONEPE_CONFIG,
  frontend: FRONTEND_CONFIG,
  validate: validateConfig
};

// Helper functions
export const isRazorpayEnabled = () => PAYMENT_CONFIG.features.allowRazorpay;
export const isPhonePeEnabled = () => PAYMENT_CONFIG.features.allowPhonePe;
export const getActiveGateway = () => PAYMENT_CONFIG.activeGateway;

// Environment specific helpers
export const isDevelopment = () => ENVIRONMENT === 'development';
export const isProduction = () => ENVIRONMENT === 'production';
export const isPhonePeSandbox = () => PHONEPE_ENV === 'sandbox';
export const isPhonePeProduction = () => PHONEPE_ENV === 'production';
export const isPhonePeTestMode = () => PHONEPE_ENVIRONMENT === 'test';
export const isPhonePeProdMode = () => PHONEPE_ENVIRONMENT === 'production';
export const getPhonePeEnvironment = () => PHONEPE_ENVIRONMENT;
export const getPhonePeMode = () => `${PHONEPE_ENVIRONMENT} (${PHONEPE_ENV})`;

// URL builders
export const buildRedirectUrl = (orderId, type = 'success') => {
  const baseUrl = FRONTEND_CONFIG.userWebUrl;
  const route = FRONTEND_CONFIG[`${type}Route`] || FRONTEND_CONFIG.successRoute;
  return `${baseUrl}${route.replace('{orderId}', orderId)}`;
};

export default paymentConfig;