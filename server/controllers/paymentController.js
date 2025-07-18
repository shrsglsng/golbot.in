import express from "express";
import crypto from "crypto";
import { razorpay } from "../utils/razorpayClient.js";
import Payment from "../models/paymentModel.js";

const router = express.Router();

export const helloResponse = (req, res) => {
  res.json({ message: "Hello from Razorpay backend!" });
};

export const createOrder = async (req, res) => {
  try {
    const { items } = req.body;

    let totalAmount = 0;
    for (const item of items) {
      const price = item.price ?? 0;
      const gst = item.gst ?? 0;
      const qty = item.quantity ?? 1;
      totalAmount += (price + gst) * qty;
    }

    const options = {
      amount: totalAmount * 100, // in paisa
      currency: "INR",
      receipt: "receipt_order_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    res.status(201).json({
      result: {
        order,
        paymentUrl: `https://checkout.razorpay.com/v1/checkout.js?order_id=${order.id}`
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to create order" });
  }
};

export const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  const isValid = expectedSignature === razorpay_signature;

  try {
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const amount = order.amount;

    if (!amount) {
      return res.status(400).json({ success: false, message: "Invalid order amount" });
    }

    const exists = await Payment.findOne({ payment_id: razorpay_payment_id });

    if (exists) {
      console.log("ℹ️ Payment already exists. Skipping insert.");
      return res.status(200).json({ success: true, message: "Payment already recorded" });
    }

    await Payment.create({
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      signature: razorpay_signature,
      verified: isValid,
      amount,
      currency: "INR",
      source: "frontend"
    });

    if (isValid) {
      return res.status(200).json({ success: true, message: "Payment verified and saved" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (err) {
    console.error("❌ Error verifying payment:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getPaymentStatus = async (req, res) => {
  try {
    const payment = await Payment.findOne({ order_id: req.params.orderId });
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    res.json({ success: true, payment });
  } catch (err) {
    console.error("Failed to fetch payment:", err);
    res.status(500).json({ success: false });
  }
};

export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ verified: true }).sort({ createdAt: -1 });
    res.json({ success: true, payments });
  } catch (err) {
    console.error("Error fetching payments:", err);
    res.status(500).json({ success: false });
  }
};

export default router;
