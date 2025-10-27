/**
 * PhonePe Production Integration Test Script
 * 
 * This script tests the PhonePe production setup
 * Run with: node test-phonepe-prod.js
 */

import dotenv from "dotenv";
dotenv.config();

// Set production environment
process.env.PAYMENT_GATEWAY = 'phonepe';
process.env.PHONEPE_ENV = 'production';

async function testPhonePeProdSetup() {
  console.log('🧪 Testing PhonePe PRODUCTION Integration Setup...\n');
  
  try {
    // 1. Test configuration loading
    console.log('1. Testing configuration...');
    const { paymentConfig } = await import('./config/paymentConfig.js');
    
    console.log('✅ Configuration loaded successfully');
    console.log('   - Payment Gateway:', paymentConfig.general.activeGateway);
    console.log('   - PhonePe Environment:', paymentConfig.phonepe.environment);
    console.log('   - PhonePe Enabled:', paymentConfig.phonepe.enabled);
    console.log('   - Base URL:', paymentConfig.phonepe.baseUrl);
    console.log('   - Auth URL:', paymentConfig.phonepe.authBaseUrl);
    console.log('   - Client ID:', paymentConfig.phonepe.clientId ? 'SET' : 'MISSING');
    console.log('   - Client Secret:', paymentConfig.phonepe.clientSecret ? 'SET' : 'MISSING');
    
    // 2. Test PhonePe service initialization
    console.log('\n2. Testing PhonePe service initialization...');
    const phonePeService = await import('./services/phonePeService.js');
    
    const healthStatus = phonePeService.default.getHealthStatus();
    console.log('✅ PhonePe service initialized successfully');
    console.log('   - Service Health:', healthStatus);
    
    // 3. Test authentication (if credentials are set)
    if (paymentConfig.phonepe.clientId && paymentConfig.phonepe.clientSecret && 
        paymentConfig.phonepe.clientId !== 'YOUR_PRODUCTION_CLIENT_ID') {
      
      console.log('\n3. Testing PhonePe PRODUCTION authentication...');
      try {
        const token = await phonePeService.default.getAuthToken();
        console.log('✅ PhonePe PRODUCTION authentication successful!');
        console.log('   - Token obtained:', token ? 'YES' : 'NO');
        console.log('   - Token length:', token ? token.length : 'N/A');
        
        // 4. Test payment creation (small amount)
        console.log('\n4. Testing PhonePe PRODUCTION payment creation...');
        const testOrderId = `TEST_PROD_${Date.now()}`;
        const testAmount = 100; // ₹1.00 in paise
        
        const paymentResponse = await phonePeService.default.createPayment(
          testOrderId,
          testAmount,
          process.env.PHONEPE_REDIRECT_URL,
          { 
            description: 'Production Test Payment',
            userId: 'test_user_prod' 
          }
        );
        
        console.log('✅ PhonePe PRODUCTION payment creation successful!');
        console.log('   - Order ID:', testOrderId);
        console.log('   - Payment URL present:', !!phonePeService.default.extractPaymentUrl(paymentResponse));
        console.log('   - Response success:', paymentResponse.success);
        
        if (paymentResponse && phonePeService.default.extractPaymentUrl(paymentResponse)) {
          console.log('\n🎉 PRODUCTION SETUP COMPLETE!');
          console.log('📝 Payment URL:', phonePeService.default.extractPaymentUrl(paymentResponse));
          console.log('\n⚠️  Note: This is a REAL production payment. Cancel it immediately if you don\'t want to complete it.');
        }
        
      } catch (authError) {
        console.log('❌ PhonePe PRODUCTION authentication failed');
        console.log('   - Error:', authError.message);
        
        if (authError.message.includes('client_id') || authError.message.includes('client_secret')) {
          console.log('\n💡 Please verify your production credentials:');
          console.log('   - PHONEPE_CLIENT_ID (Key Index)');
          console.log('   - PHONEPE_CLIENT_SECRET (API Key)');
        }
      }
    } else {
      console.log('\n⚠️  Production credentials not set. Please update:');
      console.log('   - PHONEPE_CLIENT_ID with your Key Index');
      console.log('   - PHONEPE_CLIENT_SECRET with your API Key');
    }
    
  } catch (error) {
    console.log('\n❌ Setup test failed:', error.message);
    console.log('   - Stack:', error.stack);
  }
}

// Run the test
testPhonePeProdSetup()
  .then(() => {
    console.log('\n✅ Production test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.log('\n❌ Production test failed:', error.message);
    process.exit(1);
  });