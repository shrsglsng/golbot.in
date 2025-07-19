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

    if (res.status === 201 && res.data?.result?.order) {
      const { order, paymentUrl } = res.data.result;
      return { order: { ...order, oid: order._id }, paymentUrl };
    }

    console.error("Unexpected response from placeOrder:", res.data);
  } catch (error) {
    console.error("❌ placeOrder error:", error);
  }

  return undefined;
}

// Order OTP
export async function getOrderOtp(): Promise<OrderModel | undefined> {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  if (!baseUrl) throw new Error("Server URL not set");

  const url = `${baseUrl}/order/getOrderOtp`;
  const token = localStorage.getItem("Token");

  try {
    const res = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 200) {
      return { ...res.data.result.order, oid: res.data.result.order._id };
    }
  } catch (error) {
    console.error("getOrderOtp error:", error);
  }

  return undefined;
}

// Latest Order
export async function getLatestOrder(): Promise<OrderModel | undefined> {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  if (!baseUrl) throw new Error("Server URL not set");

  const url = `${baseUrl}/order/getLatest`;
  const token = localStorage.getItem("Token");

  try {
    const res = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 200) {
      return { ...res.data.result.order, oid: res.data.result.order._id };
    }
  } catch (error) {
    console.error("getLatestOrder error:", error);
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

  const url = `${baseUrl}/order/getIsOrderCompleted`;
  const token = localStorage.getItem("Token");

  try {
    const res = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 200) return res.data.result.isOrderCompleted;
  } catch (e: any) {
    console.error("getIsOrderCompleted error:", e);

    if (e.response?.status === 401) {
      localStorage.removeItem("Token");
      router.replace({
        pathname: "/auth/login",
        query: { next: router.query.mid?.toString() ?? "" },
      });
    }
  }

  return true; // default fallback
}

// Is Order Preparing
export async function getIsOrderPreparing(): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  if (!baseUrl) throw new Error("Server URL not set");

  const url = `${baseUrl}/order/getIsOrderPreparing`;
  const token = localStorage.getItem("Token");

  try {
    const res = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 200) return res.data.result.isOrderPreparing;
  } catch (error) {
    console.error("getIsOrderPreparing error:", error);
  }

  return false;
}

// Report Issue
export async function reportIssue(data: any): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  if (!baseUrl) throw new Error("Server URL not set");

  const url = `${baseUrl}/order/reportIssue/`;
  const token = localStorage.getItem("Token");

  try {
    await axios.post(url, data, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });
    return true;
  } catch (error) {
    console.error("reportIssue error:", error);
    return false;
  }
}
