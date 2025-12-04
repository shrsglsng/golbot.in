// user_web/config/demoConfig.ts

export const demoConfig = {
  enabled: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',
  phone: process.env.NEXT_PUBLIC_DEMO_PHONE || '9876543210',
  otp: process.env.NEXT_PUBLIC_DEMO_OTP || '123456',
};

export const isDemoMode = (): boolean => {
  return demoConfig.enabled;
};

export const getDemoCredentials = () => {
  return {
    phone: demoConfig.phone,
    otp: demoConfig.otp,
  };
};