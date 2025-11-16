/**
 * Utility functions for managing machine ID (MID) persistence
 */

const STORAGE_KEY = 'golbot_current_mid';

/**
 * Save the current machine ID to localStorage
 */
export function saveMachineId(mid: string): void {
  if (typeof window !== 'undefined' && mid) {
    localStorage.setItem(STORAGE_KEY, mid);
  }
}

/**
 * Get the saved machine ID from localStorage
 */
export function getSavedMachineId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEY);
  }
  return null;
}

/**
 * Clear the saved machine ID from localStorage
 */
export function clearMachineId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('Token');
    return !!token;
  }
  return false;
}

/**
 * Get the redirect path after login
 * Returns saved MID path or fallback to home
 */
export function getLoginRedirectPath(fallback: string = '/'): string {
  const savedMid = getSavedMachineId();
  return savedMid ? `/${savedMid}` : fallback;
}
