import { NextRouter } from "next/router";

/**
 * Handles authentication errors consistently across the app
 * @param error - The error object
 * @param router - Next.js router instance
 * @param currentMachineId - Current machine ID for redirect context
 * @returns true if error was handled, false otherwise
 */
export function handleAuthenticationError(
  error: any,
  router: NextRouter,
  currentMachineId?: string
): boolean {
  if (error.message === "AUTHENTICATION_REQUIRED" || error.response?.status === 401) {
    localStorage.removeItem("Token");
    
    router.push({
      pathname: "/auth/login",
      query: { next: currentMachineId || router.query.mid?.toString() || "" },
    });
    
    return true;
  }
  
  return false;
}

/**
 * Shows user-friendly error messages
 * @param error - The error object
 * @param defaultMessage - Default message if no specific error is found
 */
export function showUserFriendlyError(error: any, defaultMessage: string = "Something went wrong. Please try again.") {
  let message = defaultMessage;
  
  if (error.message === "AUTHENTICATION_REQUIRED") {
    message = "Please login to continue.";
  } else if (error.response?.data?.msg) {
    message = error.response.data.msg;
  } else if (error.message && error.message !== "AUTHENTICATION_REQUIRED") {
    message = error.message;
  }
  
  alert(message);
}
