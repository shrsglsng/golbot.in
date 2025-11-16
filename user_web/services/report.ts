import axios from "axios";

export interface StartReportResponse {
  reportId: string;
  mailtoLink: string;
  recipientEmail: string;
  isExisting?: boolean;
}

/**
 * Start a new report
 * Creates a report record and returns a mailto link
 */
export async function startReport(data: {
  orderId?: string;
  machineId?: string;
}): Promise<StartReportResponse> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    if (!baseUrl) throw new Error("Server URL not set");

    const url = `${baseUrl}/reports/start`;
    const token = localStorage.getItem("Token");

    console.log("Starting report with data:", data);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add auth token if available (optional)
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await axios.post(url, data, { headers });

    if ((res.status === 200 || res.status === 201) && res.data?.data) {
      const { reportId, mailtoLink, recipientEmail, isExisting } = res.data.data;
      console.log(isExisting ? "✅ Using existing report:" : "✅ Report started successfully:", {
        reportId,
        recipientEmail,
        isExisting,
      });
      return { reportId, mailtoLink, recipientEmail, isExisting };
    }

    console.error("Unexpected response from startReport:", res.data);
    throw new Error("Failed to start report");
  } catch (error: any) {
    console.error("❌ startReport error:", error);
    console.error("Error response:", error.response?.data);

    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }

    throw new Error(error.message || "Failed to start report");
  }
}

/**
 * Open the mailto link
 * This will open the user's default email app
 */
export function openMailtoLink(mailtoLink: string): boolean {
  try {
    window.location.href = mailtoLink;
    return true;
  } catch (error) {
    console.error("Failed to open mailto link:", error);
    return false;
  }
}
