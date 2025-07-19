import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import Order from "../models/orderModel.js";
import Item from "../models/itemModel.js";
import OrderItem from "../models/orderItemModel.js";
import User from "../models/userModel.js";
import Machine from "../models/machineModel.js";
import reportIssueModel from "../models/reportIssueModel.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";

// ----------------------------------------------------------------------------
// Create order (User initiated, Razorpay payment pending)
export const createOrder = async (req, res) => {
  const { items, machineId } = req.body;
  const { uid } = req.user;

  console.log("Creating order for user:", uid, "with items:", items, "and machineId:", machineId);

  if (!machineId || !Array.isArray(items) || items.length === 0) {
    throw new BadRequestError("Enter machine ID and at least one item");
  }

  const machine = await Machine.findOne({ mid: machineId });
  if (!machine) throw new BadRequestError("Invalid machine");

  // Calculate total amount
  let price = 0, gst = 0;
  for (const item of items) {
    const dbItem = await Item.findById(item._id);
    if (!dbItem || !dbItem.isAvailable) {
      throw new BadRequestError(`Item not found or unavailable: ${item._id}`);
    }
    price += dbItem.price * item.quantity;
    gst += dbItem.gst * item.quantity;
  }
  const total = price + gst;

  // Create order
  const order = await Order.create({
    uid,
    machineId: machine._id,
    amount: { price, gst, total },
    orderStatus: "PENDING",
    orderCompleted: false
  });

  // Create individual OrderItems
  for (const item of items) {
    const dbItem = await Item.findById(item._id);
    await OrderItem.create({
      orderId: order._id,
      itemId: dbItem._id,
      qty: item.quantity,
      priceAtOrderTime: dbItem.price
    });
  }

  res.status(StatusCodes.CREATED).json({
    result: {
      order,
      totalAmount: total
    }
  });
};

// ----------------------------------------------------------------------------
// Generate OTP if payment is successful
export const getOrderOTP = async (req, res) => {
  const { uid } = req.user;

  const order = await Order.findOne({ uid }).sort({ createdAt: -1 });
  if (!order) throw new BadRequestError("No active order found");
  if (order.orderCompleted) throw new BadRequestError("Cannot generate OTP for completed order");
  if (order.orderStatus !== "READY") throw new BadRequestError("Payment not done");

  res.status(StatusCodes.OK).json({ result: { orderOtp: order.orderOtp } });
};

// ----------------------------------------------------------------------------
// Get latest order (User)
export const getLatestOrder = async (req, res) => {
  const { uid } = req.user;
  const order = await Order.findOne({ uid }).sort({ createdAt: -1 });
  res.status(StatusCodes.OK).json({ result: { order: order || {} } });
};

// ----------------------------------------------------------------------------
// Check if latest order is completed
export const getIsOrderCompleted = async (req, res) => {
  const { uid } = req.user;
  const order = await Order.findOne({ uid }).sort({ createdAt: -1 });

  if (!order) throw new NotFoundError("Order not found");

  res.status(StatusCodes.OK).json({ result: { isOrderCompleted: order.orderCompleted } });
};

// ----------------------------------------------------------------------------
// Check if latest order is preparing
export const getIsOrderPreparing = async (req, res) => {
  const { uid } = req.user;
  const order = await Order.findOne({ uid }).sort({ createdAt: -1 });

  if (!order) throw new NotFoundError("Order not found");

  res.status(StatusCodes.OK).json({ result: { isOrderPreparing: order.orderStatus === "PREPARING" } });
};

// ----------------------------------------------------------------------------
// Report issue (includes image upload)
export const createReportIssue = async (req, res) => {
  const { uid } = req.user;
  const { oid, description, machineId } = req.body;

  if (!oid || !description || !machineId) throw new BadRequestError("Enter all required fields");

  const imgUrl = req.file?.location || "";

  await reportIssueModel.create({
    uid,
    oid,
    description,
    machineId,
    imgUrl
  });

  res.status(StatusCodes.CREATED).json({ result: "Issue reported successfully" });
};

// ----------------------------------------------------------------------------
// Get all orders (Admin view with filters)
export const getAllOrders = async (req, res) => {
  const { orderId, phone, machineId, orderStatus, date, minAmt, maxAmt } = req.query;

  if (orderId && !mongoose.isValidObjectId(orderId)) {
    throw new BadRequestError("Invalid Order ID");
  }

  const query = {
    ...(orderId && { _id: new mongoose.Types.ObjectId(orderId) }),
    ...(machineId && { machineId: { $regex: machineId, $options: "i" } }),
    ...(orderStatus && orderStatus !== "ALL" && { orderStatus }),
    ...(date && {
      createdAt: {
        $gte: new Date(`${date}T00:00:00.000Z`),
        $lte: new Date(`${date}T23:59:59.999Z`)
      }
    }),
    "amount.total": {
      $gte: parseInt(minAmt) || 30,
      $lte: parseInt(maxAmt) || 1000
    }
  };

  const page = Number(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const orders = await Order.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "uid",
        foreignField: "_id",
        as: "userData"
      }
    },
    { $skip: skip },
    { $limit: limit },
    { $sort: { createdAt: -1 } },
    {
      $match: {
        ...query,
        "userData.phone": { $regex: phone || "", $options: "i" }
      }
    },
    {
      $project: {
        _id: 0,
        orderId: "$_id",
        phone: { $first: "$userData.phone" },
        machineId: 1,
        orderStatus: 1,
        orderDate: "$createdAt",
        amount: "$amount.total"
      }
    }
  ]);

  const totalOrders = await Order.countDocuments(query);
  const numOfPages = Math.ceil(totalOrders / limit);

  res.status(StatusCodes.OK).json({
    result: {
      orders,
      totalOrders,
      numOfPages
    }
  });
};
