import { StatusCodes } from "http-status-codes"
import {
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
} from "../utils/errors.js"
import Order from "../models/orderModel.js"
import Items from "../models/itemModel.js"
import mongoose from "mongoose"
import axios from "axios"
import sha256 from "js-sha256"

import User from "../models/userModel.js"
import reportIssueModel from "../models/reportIssueModel.js"

export const createOrder = async (req, res) => {
  const { items, machineId } = req.body
  const { uid, phone } = req.user

  if (!machineId || !items) throw new BadRequestError("Enter machine ID")

  // local create order ----------------------------------------------------------------------------
  var tmpItems = {}
  var tmpAmt = { price: 0, gst: 0, total: 0 }

  for (const item in items) {
    tmpItems[items[item].id] = items[item].quantity
    // if (items[item].quantity > 0)
    //   tmpItems.push({ itemId: items[item].id, quantity: items[item].quantity });

    const getItem = await Items.findOne({ id: items[item].id })
    tmpAmt = {
      price: tmpAmt.price + getItem.price * items[item].quantity,
      gst: tmpAmt.gst + getItem.gst * items[item].quantity,
    }
  }
  tmpAmt = { ...tmpAmt, total: tmpAmt.price + tmpAmt.gst }

  // get payment url
  const SALT_INDEX = process.env.PHONEPE_SALT_INDEX
  const SALT_KEY = process.env.PHONEPE_SALT_KEY
  const merchantId = process.env.PHONEPE_MERCHANT_ID

  const txnsId = "TX" + Date.now()
  const payload = {
    merchantId,
    merchantTransactionId: txnsId,
    merchantUserId: uid,
    amount: 100, //tmpAmt.total * 100,
    redirectUrl: `https://golbot.in/${machineId}/payment/${txnsId}`,
    redirectMode: "REDIRECT",
    callbackUrl: "https://bknd.golbot.in/payment/webhook",
    mobileNumber: "9999999999",
    paymentInstrument: { type: "PAY_PAGE" },
  }

  const encodedPayload = btoa(JSON.stringify(payload))
  const xVerify =
    sha256(encodedPayload + "/pg/v1/pay" + SALT_KEY) + "###" + SALT_INDEX

  let data = JSON.stringify({
    request: encodedPayload,
  })

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://api.phonepe.com/apis/hermes/pg/v1/pay",
    headers: {
      "Content-Type": "application/json",
      "X-VERIFY": xVerify,
    },
    data: data,
  }

  var paymentResult = undefined

  await axios
    .request(config)
    .then((response) => {
      // console.log(response.data.data)
      paymentResult = response.data.data
    })
    .catch((error) => {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ msg: "Something went wrong..." })
    })

  // var tmpOid = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);

  if (!paymentResult) throw new BadRequestError("Payment Failed")

  const order = await Order.create({
    uid,
    itemQty: tmpItems,
    machineId,
    amount: tmpAmt,
    paymentOrderId: paymentResult.merchantTransactionId,
    // orderOtp: tmpOid,
    // TODO: change to PENDING
    ostatus: "PENDING",
  })

  // console.log(paymentResult.instrumentResponse.redirectInfo.url)

  res.status(StatusCodes.CREATED).json({
    result: {
      order,
      paymentUrl: paymentResult.instrumentResponse.redirectInfo.url,
    },
  })
}

// ----------------------------------------------------------------------------
// export const getPaymentOrderStatus = async (req, res) => {
//   const { paymentOrderId } = req.query

//   if (!paymentOrderId) throw new BadRequestError("Enter order ID")

//   var prodCfConfig = new CFConfig(
//     // TODO: change this to production
//     CFEnvironment.SANDBOX,
//     "2022-09-01",
//     process.env.PAYMENT_CLIENT_ID,
//     process.env.PAYMENT_SECRET_KEY
//   )
//   try {
//     var apiInstance = new CFPaymentGateway()
//     var cfOrderResponse = await apiInstance.getOrder(
//       prodCfConfig,
//       paymentOrderId
//     )

//     // console.log(cfOrderResponse);
//   } catch (e) {
//     console.log(e)
//     throw new NotFoundError("order not found")
//   }

//   res.status(StatusCodes.OK).json({
//     result: { orderStatus: cfOrderResponse.cfOrder.orderStatus },
//   })
// }

// // ----------------------------------------------------------------------------
export const getOrderOTP = async (req, res) => {
  const { uid } = req.user

  const order = await Order.findOne({ uid }).sort({ createdAt: -1 })
  if (!order) throw new BadRequestError("Wrong Order ID")
  if (order.orderCompleted) throw new BadRequestError("Cannot Generate OTP")
  if (order.ostatus !== "READY") throw new BadRequestError("Payment not done")

  res.status(StatusCodes.OK).json({
    result: { order },
  })
}

// ----------------------------------------------------------------------------

export const getAllOrders = async (req, res) => {
  const { orderId, phone, machineId, ostatus, date, minAmt, maxAmt } = req.query

  if (orderId && orderId.length !== 24 && orderId.length !== 0)
    throw new BadRequestError("Invalid Order ID")

  const queryObject = {
    "amount.total": {
      $gte: parseInt(minAmt) || 30,
      $lte: parseInt(maxAmt) || 1000,
    },
  }
  if (orderId) queryObject._id = mongoose.Types.ObjectId(orderId)
  if (machineId) queryObject.machineId = { $regex: machineId, $options: "i" }
  if (ostatus && ostatus !== "ALL") queryObject.ostatus = ostatus
  if (date) {
    queryObject.createdAt = {
      $gte: new Date(`${date}T00:00:00.000Z`),
      $lte: new Date(`${date}T23:59:59.999Z`),
    }
  }

  // pagination
  const page = Number(req.query.page) || 1
  const limit = 10
  const skip = (page - 1) * limit

  const orders = await Order.aggregate([
    {
      $lookup: {
        from: "users", // The name of the User collection
        localField: "uid", // The field in the Post model that references User model
        foreignField: "_id", // The field in the User model to match against
        as: "userData", // The name of the field to populate with User data
      },
    },
    // { $sum: "$amount.total" },
    { $skip: skip },
    { $limit: limit },
    { $sort: { createdAt: -1 } },
    {
      $match: {
        ...queryObject,
        "userData.phone": { $regex: phone || "", $options: "i" },
      },
    },
    {
      $project: {
        _id: 0,
        orderId: "$_id",
        phone: { $first: "$userData.phone" },
        machineId: 1,
        ostatus: 1,
        orderDate: "$createdAt",
        amount: "$amount.total",
        total: { $sum: "$amount.total" },
      },
    },
  ])

  const orderCounts = await Order.aggregate([
    {
      $lookup: {
        from: "users", // The name of the User collection
        localField: "uid", // The field in the Post model that references User model
        foreignField: "_id", // The field in the User model to match against
        as: "userData", // The name of the field to populate with User data
      },
    },
    // { $sum: "$amount.total" },
    { $skip: skip },
    { $limit: limit },
    { $sort: { createdAt: -1 } },
    {
      $match: {
        ...queryObject,
        "userData.phone": { $regex: phone || "", $options: "i" },
      },
    },
    {
      $group: {
        _id: null,
        totAmount: { $sum: "$amount.total" },
        GOLQty: { $sum: "$itemQty.GOL" },
        PANQty: { $sum: "$itemQty.PAN" },
        PWOQty: { $sum: "$itemQty.PWO" },
      },
    },
  ])

  const totalOrders = await Order.countDocuments(queryObject)
  const numOfPages = Math.ceil(totalOrders / limit)

  res.status(StatusCodes.OK).json({
    result: {
      orders,
      orderCounts: {
        totAmt: orderCounts[0]?.totAmount ?? 0,
        GOLQty: orderCounts[0]?.GOLQty ?? 0,
        PANQty: orderCounts[0]?.PANQty ?? 0,
        PWOQty: orderCounts[0]?.PWOQty ?? 0,
      },
      totalOrders,
      numOfPages,
    },
  })
}

// ----------------------------------------------------------------------------
// util controllers -----------------------------------------------------

export const getLatestOrder = async (req, res) => {
  const { uid } = req.user

  var order = await Order.findOne({ uid }, { orderOtp: 0 }).sort({
    createdAt: -1,
  })
  if (!order) order = {}

  // console.log(order);

  res.status(StatusCodes.OK).json({ result: { order } })
}

//
export const getIsOrderCompleted = async (req, res) => {
  const { uid } = req.user

  var order = await Order.findOne({ uid }).sort({ createdAt: -1 })
  if (!order) throw new NotFoundError("Order Not Found")

  res
    .status(StatusCodes.OK)
    .json({ result: { isOrderCompleted: order.orderCompleted } })
}

//
export const getIsOrderPreparing = async (req, res) => {
  const { uid } = req.user

  var order = await Order.findOne({ uid }).sort({ createdAt: -1 })
  if (!order) throw new NotFoundError("Order Not Found")

  res
    .status(StatusCodes.OK)
    .json({ result: { isOrderPreparing: order.ostatus === "PREPARING" } })
}

// report issue

export const createReportIssue = async (req, res) => {
  const { uid } = req.user
  const { oid, description, machineId } = req.body

  if (!oid) throw new BadRequestError("Enter all Fields")

  var imgUrl = ""

  if (req.file) {
    imgUrl = req.file.location
  }

  await reportIssueModel.create({
    uid,
    machineId,
    oid,
    description,
    imgUrl,
  })

  res.status(StatusCodes.CREATED).json({ result: "success" })
}
