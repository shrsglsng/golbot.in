import axios from "axios";

export interface MachineInfo {
  id: string;
  status: string;
  isActive: boolean;
  location: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface MachineResolutionResult {
  success: boolean;
  machine?: MachineInfo;
  error?: string;
  message?: string;
  recoverable?: boolean;
}

/**
 * Resolve machine from QR token (mt parameter)
 */
export async function resolveMachineFromToken(
  token: string
): Promise<MachineResolutionResult> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    if (!baseUrl) throw new Error("Server URL not set");

    const url = `${baseUrl}/machines/resolve?mt=${encodeURIComponent(token)}`;

    console.log("Resolving machine from token...");

    const res = await axios.get(url);

    if (res.status === 200 && res.data?.data?.machine) {
      const machine = res.data.data.machine;
      console.log("✅ Machine resolved:", machine);

      return {
        success: true,
        machine: {
          id: machine.id,
          status: machine.status,
          isActive: machine.isActive,
          location: machine.location,
          isOnline: machine.isOnline,
          lastSeen: machine.lastSeen ? new Date(machine.lastSeen) : undefined,
        },
      };
    }

    console.error("Unexpected response from resolveMachineFromToken:", res.data);
    return {
      success: false,
      error: "UNEXPECTED_RESPONSE",
      message: "Failed to resolve machine",
      recoverable: false,
    };
  } catch (error: any) {
    console.error("❌ resolveMachineFromToken error:", error);

    // Handle structured API errors
    if (error.response?.data?.error) {
      const errorData = error.response.data;
      return {
        success: false,
        error: errorData.error || "UNKNOWN_ERROR",
        message: errorData.message || "Machine token validation failed",
        recoverable: errorData.recoverable !== false, // Default to recoverable unless explicitly false
      };
    }

    // Handle network/connection errors
    if (error.code === "ECONNABORTED" || error.code === "ERR_NETWORK") {
      return {
        success: false,
        error: "NETWORK_ERROR",
        message: "Unable to connect to server. Please check your internet connection.",
        recoverable: true,
      };
    }

    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: error.message || "An unexpected error occurred",
      recoverable: true,
    };
  }
}

/**
 * Get machine info by ID
 */
export async function getMachineById(
  machineId: string
): Promise<MachineResolutionResult> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    if (!baseUrl) throw new Error("Server URL not set");

    const url = `${baseUrl}/machines/${encodeURIComponent(machineId)}`;

    console.log("Fetching machine info for:", machineId);

    const res = await axios.get(url);

    if (res.status === 200 && res.data?.data?.machine) {
      const machine = res.data.data.machine;
      console.log("✅ Machine info retrieved:", machine);

      return {
        success: true,
        machine: {
          id: machine.id,
          status: machine.status,
          isActive: machine.isActive,
          location: machine.location,
          isOnline: machine.isOnline,
          lastSeen: machine.lastSeen ? new Date(machine.lastSeen) : undefined,
        },
      };
    }

    console.error("Unexpected response from getMachineById:", res.data);
    return {
      success: false,
      error: "UNEXPECTED_RESPONSE",
      message: "Failed to fetch machine info",
      recoverable: false,
    };
  } catch (error: any) {
    console.error("❌ getMachineById error:", error);

    if (error.response?.status === 404) {
      return {
        success: false,
        error: "MACHINE_NOT_FOUND",
        message: `Machine ${machineId} not found`,
        recoverable: true,
      };
    }

    if (error.response?.data?.error) {
      const errorData = error.response.data;
      return {
        success: false,
        error: errorData.error || "UNKNOWN_ERROR",
        message: errorData.message || "Failed to fetch machine info",
        recoverable: true,
      };
    }

    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: error.message || "An unexpected error occurred",
      recoverable: true,
    };
  }
}

/**
 * Validate machine code format (3-20 characters, alphanumeric)
 * Backend allows any alphanumeric format between 3-20 characters
 */
export function isValidMachineCodeFormat(code: string): boolean {
  const trimmed = code.trim();
  // Must be 3-20 characters, alphanumeric
  return trimmed.length >= 3 && trimmed.length <= 20 && /^[A-Z0-9]+$/i.test(trimmed);
}
