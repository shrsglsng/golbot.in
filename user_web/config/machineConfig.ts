// user_web/config/machineConfig.ts - Machine ID Auto-fill Config

/**
 * Check if demo mode is enabled
 * Reads from NEXT_PUBLIC_DEMO_MODE env variable
 */
export const isDemoMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
};

/**
 * Get demo machine ID from env variable
 * Falls back to 'M02' if not set
 */
export const getDemoMachineId = (): string => {
  return process.env.NEXT_PUBLIC_DEMO_MACHINE_ID || 'M02';
};

/**
 * Get complete machine config
 * Returns object with enabled status and machine ID value
 */
export const getMachineConfig = () => {
  return {
    enabled: isDemoMode(),
    machineId: getDemoMachineId(),
  };
};

