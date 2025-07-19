import axios from "axios";
import { OrderModel } from "../models/orderModel";
import { NextRouter } from "next/router";

// Create Order
export async function placeOrder(
  items: { id: string; quantity: number }[],
  machineId: string
): Promise<{ order: OrderModel; paymentUrl: string } | undefined> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    if (!baseUrl) throw new Error("Server URL not set");

    const token = localStorage.getItem("Token");
    const url = `${baseUrl}/order`;

    console.log("Placing order with items:", items, "and machineId:", machineId);
    
    const res = await axios.post(
      url,
      { items, machineId },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (res.status === 201 && res.data?.data?.order) {
      const { order, paymentUrl } = res.data.data;
      console.log("✅ Order created successfully:", { order, paymentUrl });
      return { order: { ...order, oid: order._id }, paymentUrl };
    }

    console.error("Unexpected response from placeOrder:", res.data);
    console.error("Response status:", res.status);
    console.error("Response data structure:", {
      hasData: !!res.data,
      hasDataData: !!res.data?.data,
      hasOrder: !!res.data?.data?.order,
      orderKeys: res.data?.data?.order ? Object.keys(res.data.data.order) : null
    });
  } catch (error: any) {
    console.error("❌ placeOrder error:", error);
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem("Token");
      throw new Error("AUTHENTICATION_REQUIRED");
    }
    
    // Handle other errors with user-friendly messages
    if (error.response?.data?.msg) {
      throw new Error(error.response.data.msg);
    }
    
    throw new Error("Failed to place order. Please try again.");
  }

  return undefined;
}

// Order OTP
export async function getOrderOtp(): Promise<OrderModel | undefined> {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  if (!baseUrl) throw new Error("Server URL not set");

  const url = `${baseUrl}/order/otp`;
  const token = localStorage.getItem("Token");

  try {
    const res = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 200) {
      return { ...res.data.data.order, oid: res.data.data.order._id };
    }
  } catch (error: any) {
    console.error("getOrderOtp error:", error);
    
    if (error.response?.status === 401) {
      localStorage.removeItem("Token");
      // Note: This function doesn't have router access, 
      // so authentication errors should be handled by the caller
      throw new Error("AUTHENTICATION_REQUIRED");
    }
  }

  return undefined;
}

// Latest Order
export async function getLatestOrder(): Promise<OrderModel | undefined> {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  if (!baseUrl) throw new Error("Server URL not set");

  const url = `${baseUrl}/order/latest`;
  const token = localStorage.getItem("Token");

  try {
    const res = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 200) {
      const order = res.data.data?.order;
      if (order) {
        return { ...order, oid: order._id };
      }
      return undefined;
    }
  } catch (error: any) {
    console.error("getLatestOrder error:", error);
    
    if (error.response?.status === 401) {
      localStorage.removeItem("Token");
      throw new Error("AUTHENTICATION_REQUIRED");
    }
  }

  return undefined;
}

// Is Order Completed
export async function getIsOrderCompleted({
  router,
}: {
  router: NextRouter;
}): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  if (!baseUrl) throw new Error("Server URL not set");

  const token = localStorage.getItem("Token");
  
  // If no token, return false without making the API call
  if (!token) {
    return false;
  }

  const url = `${baseUrl}/order/completed`;

  try {
    const res = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 200) return res.data.data.isOrderCompleted;
  } catch (e: any) {
    // Only log errors that aren't authentication related
    if (e.response?.status !== 401) {
      console.error("getIsOrderCompleted error:", e);
    }

    if (e.response?.status === 401) {
      localStorage.removeItem("Token");
      // Don't auto-redirect, just throw an error that calling code can handle
      throw new Error("AUTHENTICATION_REQUIRED");
    }
  }

  return false; // default fallback - no completed order
}

// Is Order Preparing
export async function getIsOrderPreparing(): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  if (!baseUrl) throw new Error("Server URL not set");

  const url = `${baseUrl}/order/preparing`;
  const token = localStorage.getItem("Token");

  try {
    const res = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 200) return res.data.data.isOrderPreparing;
  } catch (error: any) {
    console.error("getIsOrderPreparing error:", error);
    
    if (error.response?.status === 401) {
      localStorage.removeItem("Token");
      throw new Error("AUTHENTICATION_REQUIRED");
    }
  }

  return false;
}

// Report Issue
export async function reportIssue(data: any): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  if (!baseUrl) throw new Error("Server URL not set");

  const url = `${baseUrl}/order/report`;
  const token = localStorage.getItem("Token");

  try {
    await axios.post(url, data, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });
    return true;
  } catch (error: any) {
    console.error("reportIssue error:", error);
    
    if (error.response?.status === 401) {
      localStorage.removeItem("Token");
      throw new Error("AUTHENTICATION_REQUIRED");
    }
    
    return false;
  }
}
