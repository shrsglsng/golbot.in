// routes/webhook.js
import express from "express";
import bodyParser from "body-parser";
import crypto from "crypto";
import Payment from "../models/paymentModel.js";

const router = express.Router();

router.post(
  "/",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    console.log("🧪 Buffer Check:", Buffer.isBuffer(req.body)); // should be true

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.warn("❌ Invalid webhook signature");
      return res.status(400).json({ success: false });
    }

    const payload = JSON.parse(req.body.toString());
    console.log("✅ Webhook Event:", payload.event);

    if (payload.event === "payment.authorized") {
      const p = payload.payload.payment.entity;

      try {
        const exists = await Payment.findOne({ payment_id: p.id });

        if (!exists) {
          await Payment.create({
            order_id: p.order_id,
            payment_id: p.id,
            amount: p.amount,
            currency: p.currency,
            verified: true,
            signature: "webhook",
            source: "webhook"
          });
          console.log("💾 Payment saved");
        }
      } catch (err) {
        console.error("❌ Error saving:", err);
      }
    }

    res.status(200).json({ success: true });
  }
);

export default router;
