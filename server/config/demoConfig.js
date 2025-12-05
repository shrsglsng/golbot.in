// server/config/demoConfig.js - WITH ENV DEBUG LOGGING

console.log('🎪 [DemoConfig Loading] process.env.DEMO_MODE:', process.env.DEMO_MODE);
console.log('🎪 [DemoConfig Loading] process.env.DEMO_PHONE:', process.env.DEMO_PHONE);
console.log('🎪 [DemoConfig Loading] process.env.DEMO_OTP:', process.env.DEMO_OTP);

// Don't cache the config - read from process.env each time
const getDemoConfig = () => ({
  enabled: process.env.DEMO_MODE === 'true',
  phone: process.env.DEMO_PHONE || '9876543210',
  otp: process.env.DEMO_OTP || '123456',
});

const initialConfig = getDemoConfig();
console.log('🎪 [DemoConfig Loaded] enabled:', initialConfig.enabled);
console.log('🎪 [DemoConfig Loaded] phone:', initialConfig.phone);
console.log('🎪 [DemoConfig Loaded] otp:', initialConfig.otp);

const normalizePhone = (phone) => {
  if (!phone) return '';
  return phone.toString().replace(/[^0-9]/g, '');
};

const getLast10Digits = (phone) => {
  const normalized = normalizePhone(phone);
  return normalized.slice(-10);
};

export const isDemoMode = () => {
  const demoConfig = getDemoConfig();
  return demoConfig.enabled;
};

export const isDemoCredentials = (phone, otp) => {
  const demoConfig = getDemoConfig();
  console.log('🎪 [isDemoCredentials] Called with phone:', phone, 'otp:', otp ? '***' : 'undefined');
  console.log('🎪 [isDemoCredentials] demoConfig.enabled:', demoConfig.enabled);
  
  if (!demoConfig.enabled) {
    console.log('🎪 [isDemoCredentials] Demo mode DISABLED, returning false');
    return false;
  }
  
  const incomingPhoneLast10 = getLast10Digits(phone);
  const demoPhoneLast10 = getLast10Digits(demoConfig.phone);
  
  console.log('🎪 [Demo Check] Incoming:', incomingPhoneLast10, 'Demo:', demoPhoneLast10, 'Match:', incomingPhoneLast10 === demoPhoneLast10);
  
  const phoneMatch = incomingPhoneLast10 === demoPhoneLast10;
  
  if (otp === undefined || otp === null) {
    console.log('🎪 [Demo Check] Phone only mode:', phoneMatch);
    return phoneMatch;
  }
  
  const otpMatch = otp.toString() === demoConfig.otp.toString();
  const result = phoneMatch && otpMatch;
  console.log('🎪 [Demo Check] Phone+OTP mode - Phone:', phoneMatch, 'OTP:', otpMatch, 'Result:', result);
  return result;
};

export { getDemoConfig };

const finalConfig = getDemoConfig();
if (finalConfig.enabled) {
  console.log('🎪 ═══════════════════════════════════════════════════');
  console.log('🎪 DEMO MODE ACTIVE');
  console.log('🎪 ═══════════════════════════════════════════════════');
  console.log(`📱 Demo Phone: ${finalConfig.phone}`);
  console.log(`🔑 Demo OTP: ${finalConfig.otp}`);
  console.log('⚠️  Remember to disable demo mode in production!');
  console.log('🎪 ═══════════════════════════════════════════════════');
} else {
  console.log('❌ Demo mode is DISABLED - check DEMO_MODE=true in .env');
}

export default getDemoConfig;
