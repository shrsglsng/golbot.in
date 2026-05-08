import axios from "axios";

export interface Report {
  reportId: string;
  orderId?: string;
  orderCounter?: number;
  machineId?: string;
  machineLocation?: string;
  userId?: string;
  userPhone?: string;
  status: "initiated" | "received" | "in_review" | "resolved";
  seen: boolean;
  emailMetadata?: {
    from?: string;
    subject?: string;
    messageId?: string;
    receivedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
  description?: string;
  imgUrl?: string;
}

export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  priceAtOrderTime: number;
  gstAtOrderTime: number;
}

export interface ReportDetails extends Report {
  orderDetails?: {
    orderCounter: number;
    amount: {
      price: number;
      gst: number;
      total: number;
    };
    items: OrderItem[];
    status: string;
  };
  machineDetails?: {
    mid: string;
    location: string;
    name: string;
  };
  userDetails?: {
    phone: string;
    email?: string;
    name?: string;
  };
  seen: boolean;
  emailAddress: string;
}

export interface ReportsListResponse {
  reports: Report[];
  pagination: {
    currentPage: number;
    total: number;
    numOfPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Get all reports with filtering and pagination
 */
export async function getAllReports(params: {
  status?: string;
  orderId?: string;
  machineId?: string;
  seen?: string;
  page?: number;
}): Promise<ReportsListResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  if (!baseUrl) throw new Error("Server URL not set");

  const url = `${baseUrl}/reports`;
  const token = localStorage.getItem("Token");

  const res = await axios.get(url, {
    params,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 200 && res.data?.data) {
    return {
      reports: res.data.data.reports,
      pagination: res.data.data.pagination,
    };
  }

  throw new Error("Failed to fetch reports");
}

/**
 * Get a single report by reportId
 */
export async function getReportById(
  reportId: string
): Promise<ReportDetails> {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  if (!baseUrl) throw new Error("Server URL not set");

  const url = `${baseUrl}/reports/${reportId}`;
  const token = localStorage.getItem("Token");

  const res = await axios.get(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 200 && res.data?.data?.report) {
    return res.data.data.report;
  }

  throw new Error("Failed to fetch report");
}

/**
 * Update report status
 */
export async function updateReportStatus(
  reportId: string,
  status: "initiated" | "received" | "in_review" | "resolved",
  emailMetadata?: {
    from?: string;
    subject?: string;
    messageId?: string;
    receivedAt?: string;
  }
): Promise<{ success: boolean; report: ReportDetails }> {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  if (!baseUrl) throw new Error("Server URL not set");

  const url = `${baseUrl}/reports/${reportId}/status`;
  const token = localStorage.getItem("Token");

  const res = await axios.put(
    url,
    { status, emailMetadata },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (res.status === 200 && res.data?.data?.report) {
    return {
      success: true,
      report: res.data.data.report,
    };
  }

  throw new Error("Failed to update report status");
}

/**
 * Mark report as seen/unseen
 */
export async function markReportAsSeen(
  reportId: string,
  seen: boolean = true
): Promise<{ success: boolean; report: { reportId: string; seen: boolean; updatedAt: string } }> {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  if (!baseUrl) throw new Error("Server URL not set");

  const url = `${baseUrl}/reports/${reportId}/seen`;
  const token = localStorage.getItem("Token");

  const res = await axios.put(
    url,
    { seen },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (res.status === 200 && res.data?.data?.report) {
    return {
      success: true,
      report: res.data.data.report,
    };
  }

  throw new Error("Failed to mark report as seen");
}

/**
 * Get count of unseen reports
 */
export async function getUnseenReportsCount(): Promise<number> {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  if (!baseUrl) throw new Error("Server URL not set");

  const url = `${baseUrl}/reports/unseen/count`;
  const token = localStorage.getItem("Token");

  console.log("Fetching unseen count from:", url);

  const res = await axios.get(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("Unseen count response:", res.data);

  if (res.status === 200 && res.data?.data?.count !== undefined) {
    return res.data.data.count;
  }

  throw new Error("Failed to get unseen reports count");
}
