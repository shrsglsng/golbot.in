/**
 * Decode JWT token and check if it's expired
 * @param token - JWT token string
 * @returns true if token is valid and not expired, false otherwise
 */
export function isTokenValid(token: string | null): boolean {
  if (!token) return false;

  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Decode the payload (base64)
    const payload = JSON.parse(atob(parts[1]));

    // Check if token has expiration time
    if (!payload.exp) {
      // If no exp field, consider it valid (backend doesn't use JWT expiration)
      return true;
    }

    // Check if token is expired
    // exp is in seconds, Date.now() is in milliseconds
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
}

/**
 * Get token from localStorage and validate it
 * @returns true if token exists and is valid
 */
export function isAuthenticated(): boolean {
  const token = localStorage.getItem('Token');
  return isTokenValid(token);
}

/**
 * Clear authentication token from localStorage
 */
export function clearAuth(): void {
  localStorage.removeItem('Token');
}
