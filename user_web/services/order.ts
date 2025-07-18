import axios from "axios"
import { OrderModel } from "../models/orderModel"
import { NextRouter } from "next/router"

export async function placeOrder(
  items: any,
  machineId: string
): Promise<{ order: OrderModel; paymentUrl: String } | undefined> {
  try {
    if (!process.env.NEXT_PUBLIC_SERVER_URL) throw "Server Url Not Set"
    const url = process.env.NEXT_PUBLIC_SERVER_URL + "/payment/create-order"
    const token = localStorage.getItem("Token")

    const res = await axios.post(
      url,
      { items, machineId },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (res.status === 201) {
      return {
        order: { ...res.data.result.order, oid: res.data.result.order._id },
        paymentUrl: res.data.result.paymentUrl,
      }
    }
  } catch (error) {
    console.error("placeOrder error:", error)
  }

  return
}

export async function getOrderOtp(): Promise<OrderModel | undefined> {
  if (!process.env.NEXT_PUBLIC_SERVER_URL) throw "Server Url Not Set"
  const url = process.env.NEXT_PUBLIC_SERVER_URL + `/order/getOrderOtp`

  const token = localStorage.getItem("Token")

  try {
    var res = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (res.status === 200)
      return { ...res.data.result.order, oid: res.data.result.order._id }
  } catch (e) {
    // console.log(e);
  }

  return
}

export async function getLatestOrder(): Promise<OrderModel | undefined> {
  if (!process.env.NEXT_PUBLIC_SERVER_URL) throw "Server Url Not Set"
  const url = process.env.NEXT_PUBLIC_SERVER_URL + `/order/getLatest`

  const token = localStorage.getItem("Token")

  try {
    var res = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (res.status === 200)
      return { ...res.data.result.order, oid: res.data.result.order._id }
  } catch (e) {
    // console.log(e)
  }

  return
}

export async function getIsOrderCompleted({
  router,
}: {
  router: NextRouter
}): Promise<boolean> {
  if (!process.env.NEXT_PUBLIC_SERVER_URL) throw "Server Url Not Set"
  const url = process.env.NEXT_PUBLIC_SERVER_URL + `/order/getIsOrderCompleted`

  const token = localStorage.getItem("Token")

  try {
    var res = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (res.status === 200) return res.data.result.isOrderCompleted
  } catch (e: any) {
    console.log(e)
    if (e.response.status === 401) {
      localStorage.removeItem("Token")
      router.replace({
        pathname: "/auth/login",
        query: { next: router.query.mid?.toString() ?? "" },
      })
    }
  }
  // default to true cuz order might be completed or no order exists
  return true
}

export async function getIsOrderPreparing(): Promise<boolean> {
  if (!process.env.NEXT_PUBLIC_SERVER_URL) throw "Server Url Not Set"
  const url = process.env.NEXT_PUBLIC_SERVER_URL + `/order/getIsOrderPreparing`

  const token = localStorage.getItem("Token")

  try {
    var res = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (res.status === 200) return res.data.result.isOrderPreparing
  } catch (e) {
    // console.log(e)
  }

  return false
}

export async function reportIssue(data: any): Promise<boolean> {
  if (!process.env.NEXT_PUBLIC_SERVER_URL) throw "Server Url Not Set"
  const url = process.env.NEXT_PUBLIC_SERVER_URL + "/order/reportIssue/"

  const token = localStorage.getItem("Token")

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: url,
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
    data: data,
  }

  var res = false

  await axios
    .request(config)
    .then(() => {
      res = true
    })
    .catch((error: any) => {
      console.log(error)
    })

  return res
}
