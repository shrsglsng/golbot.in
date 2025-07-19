import crypto from "crypto";
import Payment from "../models/paymentModel.js";
import Order from "../models/orderModel.js";

export default async function razorpayWebhookHandler(req, res) {
  const signature = req.headers["x-razorpay-signature"];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(req.body)
    .digest("hex");

  if (signature !== expectedSignature) {
    console.warn("❌ Invalid webhook signature");
    return res.status(400).json({ success: false });
  }

  const payload = JSON.parse(req.body.toString());
  const event = payload.event;
  const p = payload.payload.payment.entity;

  if (event === "payment.authorized" || event === "payment.captured") {
    try {
      const exists = await Payment.findOne({ razorpaypaymentId: p.id });
      if (!exists) {
        const dbOrderId = p.notes?.db_order_id || p.order_id.split("_")[1];
        await Payment.create({
          orderId: dbOrderId,
          razorpayorderId: p.order_id,
          razorpaypaymentId: p.id,
          amount: p.amount,
          currency: p.currency,
          verified: true,
          signature: "webhook",
          source: "webhook",
          status: "SUCCESS"
        });

        await Order.findByIdAndUpdate(dbOrderId, {
          orderStatus: "READY"
        });
      }
    } catch (err) {
      console.error("❌ Error saving webhook payment:", err);
    }
  }

  res.status(200).json({ success: true });
}
