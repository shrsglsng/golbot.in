import axios from "axios";

export interface QRToken {
  tokenId: string;
  token: string; // The actual token string
  label: string;
  createdAt: string;
  createdBy: string;
  isActive: boolean;
  status: "ACTIVE" | "REVOKED";
  url?: string; // Optional URL field
}

export interface QRTokenGenerateResult {
  qrCode: {
    url: string;
    token: string;
    tokenId: string;
    machineId: string;
    label: string;
    createdAt: string;
  };
}

export interface QRTokenListResult {
  machineId: string;
  location: string;
  tokens: QRToken[];
  summary: {
    total: number;
    active: number;
    revoked: number;
  };
}

/**
 * Generate a new QR token for a machine
 */
export async function generateMachineQRToken(
  machineId: string,
  label?: string,
  baseUrl?: string
): Promise<QRTokenGenerateResult> {
  try {
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    if (!serverUrl) throw new Error("Server URL not set");

    const token = localStorage.getItem("Token");
    if (!token) throw new Error("Admin not authenticated");

    const url = `${serverUrl}/admin/machines/${machineId}/qr-token`;

    const res = await axios.post(
      url,
      { label, baseUrl: baseUrl || process.env.NEXT_PUBLIC_USER_WEB_URL },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (res.status === 200 && res.data?.data?.qrCode) {
      return res.data.data;
    }

    throw new Error("Unexpected response format");
  } catch (error: any) {
    console.error("❌ generateMachineQRToken error:", error);

    if (error.response?.status === 401) {
      throw new Error("AUTHENTICATION_REQUIRED");
    }

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw error;
  }
}

/**
 * Get all QR tokens for a machine
 */
export async function getMachineQRTokens(
  machineId: string
): Promise<QRTokenListResult> {
  try {
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    if (!serverUrl) throw new Error("Server URL not set");

    const token = localStorage.getItem("Token");
    if (!token) throw new Error("Admin not authenticated");

    const url = `${serverUrl}/admin/machines/${machineId}/qr-tokens`;

    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 200 && res.data?.data) {
      return res.data.data;
    }

    throw new Error("Unexpected response format");
  } catch (error: any) {
    console.error("❌ getMachineQRTokens error:", error);

    if (error.response?.status === 401) {
      throw new Error("AUTHENTICATION_REQUIRED");
    }

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw error;
  }
}

/**
 * Revoke a QR token
 */
export async function revokeMachineQRToken(
  machineId: string,
  tokenId: string
): Promise<void> {
  try {
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    if (!serverUrl) throw new Error("Server URL not set");

    const token = localStorage.getItem("Token");
    if (!token) throw new Error("Admin not authenticated");

    const url = `${serverUrl}/admin/machines/${machineId}/qr-tokens/${tokenId}`;

    const res = await axios.delete(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status !== 200) {
      throw new Error("Failed to revoke token");
    }
  } catch (error: any) {
    console.error("❌ revokeMachineQRToken error:", error);

    if (error.response?.status === 401) {
      throw new Error("AUTHENTICATION_REQUIRED");
    }

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw error;
  }
}

/**
 * Download QR code as PNG
 */
export function downloadQRCode(url: string, machineId: string, format: "png" | "svg" = "png") {
  // For now, we'll use a QR code generation library on the client side
  // The URL is already available, so we'll generate the QR code image client-side

  // Note: In a real implementation, you'd use a library like qrcode or react-qr-code
  // and convert the canvas/SVG to a downloadable file

  console.log("Download QR code:", { url, machineId, format });

  // This is a placeholder - actual implementation would generate and download the QR code
  alert(`QR code download for ${machineId}\nURL: ${url}\n\nImplement client-side QR generation with qrcode library`);
}

/**
 * Update machine status (toggle online/offline)
 */
export async function updateMachineStatus(
  machineId: string,
  status: "CONNECTED" | "DISCONNECTED"
): Promise<{ success: boolean; machine?: any; error?: string }> {
  try {
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    if (!serverUrl) throw new Error("Server URL not set");

    const token = localStorage.getItem("Token");
    if (!token) throw new Error("Admin not authenticated");

    const url = `${serverUrl}/admin/machines/${machineId}/status`;

    const res = await axios.put(
      url,
      { mstatus: status },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (res.status === 200 && res.data?.data?.machine) {
      return {
        success: true,
        machine: res.data.data.machine
      };
    }

    throw new Error("Unexpected response format");
  } catch (error: any) {
    console.error("❌ updateMachineStatus error:", error);
    console.error("❌ Error response data:", error.response?.data);
    console.error("❌ Error response status:", error.response?.status);

    if (error.response?.status === 401) {
      return {
        success: false,
        error: "AUTHENTICATION_REQUIRED"
      };
    }

    if (error.response?.data?.message) {
      return {
        success: false,
        error: error.response.data.message
      };
    }

    return {
      success: false,
      error: error.message || "Failed to update machine status"
    };
  }
}

/**
 * Soft delete a machine (deactivate)
 */
export async function softDeleteMachine(
  machineId: string
): Promise<{ success: boolean; machine?: any; error?: string }> {
  try {
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    if (!serverUrl) throw new Error("Server URL not set");

    const token = localStorage.getItem("Token");
    if (!token) throw new Error("Admin not authenticated");

    const url = `${serverUrl}/admin/machines/${machineId}`;

    const res = await axios.delete(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 200 && res.data?.data?.machine) {
      return {
        success: true,
        machine: res.data.data.machine
      };
    }

    throw new Error("Unexpected response format");
  } catch (error: any) {
    console.error("❌ softDeleteMachine error:", error);

    if (error.response?.status === 401) {
      return {
        success: false,
        error: "AUTHENTICATION_REQUIRED"
      };
    }

    if (error.response?.data?.message) {
      return {
        success: false,
        error: error.response.data.message
      };
    }

    return {
      success: false,
      error: error.message || "Failed to delete machine"
    };
  }
}

/**
 * Restore a soft deleted machine (reactivate)
 */
export async function restoreMachine(
  machineId: string
): Promise<{ success: boolean; machine?: any; error?: string }> {
  try {
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    if (!serverUrl) throw new Error("Server URL not set");

    const token = localStorage.getItem("Token");
    if (!token) throw new Error("Admin not authenticated");

    const url = `${serverUrl}/admin/machines/${machineId}/restore`;

    const res = await axios.put(
      url,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (res.status === 200 && res.data?.data?.machine) {
      return {
        success: true,
        machine: res.data.data.machine
      };
    }

    throw new Error("Unexpected response format");
  } catch (error: any) {
    console.error("❌ restoreMachine error:", error);

    if (error.response?.status === 401) {
      return {
        success: false,
        error: "AUTHENTICATION_REQUIRED"
      };
    }

    if (error.response?.data?.message) {
      return {
        success: false,
        error: error.response.data.message
      };
    }

    return {
      success: false,
      error: error.message || "Failed to restore machine"
    };
  }
}
