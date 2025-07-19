import { StatusCodes } from "http-status-codes";
import crypto from "crypto";
import Payment from "../models/paymentModel.js";
import { razorpay } from "../utils/razorpayClient.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";
import Order from "../models/orderModel.js";

// ----------------------------------------------------------------
// Test response
export const helloResponse = (req, res) => {
  res.json({ message: "Hello from Razorpay backend!" });
};

// ----------------------------------------------------------------
// Create Razorpay order (used by frontend for checkout)
export const createRazorpayOrder = async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) throw new BadRequestError("Order ID is required");

  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError("Order not found");

  const amountInPaise = Math.round(order.amount.total * 100);

  const receipt = `rcpt_${Date.now()}`; // ✅ short and within 40 char limit

  try {
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt, // ✅ updated
    });

    console.log("✅ Razorpay order created:", razorpayOrder);

    // Save it for future verification
    await Payment.create({
      orderId,
      razorpayorderId: razorpayOrder.id,
      amount: razorpayOrder.amount / 100,
      currency: razorpayOrder.currency,
      verified: false,
      status: "PENDING",
      source: "server",
      receipt: razorpayOrder.receipt, // 🔐 Save receipt if needed for reverse mapping
    });

    res.status(StatusCodes.CREATED).json({
      result: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        razorpayCheckoutScript: `https://checkout.razorpay.com/v1/checkout.js?order_id=${razorpayOrder.id}`,
        receipt: razorpayOrder.receipt, // ✅ return for frontend if needed
      },
    });
  } catch (err) {
    console.error("❌ Razorpay createOrder failed:", err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Payment initiation failed" });
  }
};

// ----------------------------------------------------------------
// Verify Razorpay payment (frontend POST /verify)
export const verifyRazorpayPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  console.log("Verifying payment:", { razorpay_order_id, razorpay_payment_id, razorpay_signature });

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new BadRequestError("Missing Razorpay payment details");
  }

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  const isValid = expectedSignature === razorpay_signature;

  try {
    const razorOrder = await razorpay.orders.fetch(razorpay_order_id);
    console.log("Fetched Razorpay order:", razorOrder);

    const amount = razorOrder.amount;

    const exists = await Payment.findOne({ razorpaypaymentId: razorpay_payment_id });
    if (exists) {
      return res.status(StatusCodes.OK).json({ message: "Payment already recorded" });
    }

    const paymentRecord = await Payment.findOne({ razorpayorderId: razorpay_order_id });
    const orderId = paymentRecord?.orderId;

    if (!orderId) {
      throw new NotFoundError("Original orderId not found for this payment");
    }

    await Payment.create({
      orderId,
      razorpayorderId: razorpay_order_id,
      razorpaypaymentId: razorpay_payment_id,
      signature: razorpay_signature,
      verified: isValid,
      amount,
      currency: "INR",
      source: "frontend",
      status: isValid ? "SUCCESS" : "FAILURE",
    });

    if (isValid) {
      await Order.findByIdAndUpdate(orderId, { orderStatus: "READY" });
    }

    res.status(StatusCodes.OK).json({
      success: isValid,
      message: isValid ? "Payment verified successfully" : "Invalid payment signature",
    });
  } catch (err) {
    console.error("❌ Payment verification error:", err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
  }
};


// ----------------------------------------------------------------
// Get payment status by order ID (used by frontend to confirm)
export const getPaymentStatus = async (req, res) => {
  const { orderId } = req.params;

  const payment = await Payment.findOne({ orderId });
  if (!payment) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: "Payment not found" });
  }

  res.status(StatusCodes.OK).json({ success: true, payment });
};

// ----------------------------------------------------------------
// Admin: Get all verified payments
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ verified: true }).sort({ createdAt: -1 });
    res.status(StatusCodes.OK).json({ success: true, payments });
  } catch (err) {
    console.error("❌ Error fetching payments:", err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false });
  }
};
