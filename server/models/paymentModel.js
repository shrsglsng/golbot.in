import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  razorpayorderId: String,
  razorpaypaymentId: String,
  signature: String,
  amount: { type: Number },
  currency: { type: String, default: "INR" },
  verified: Boolean,
  status: { type: String, enum: ["SUCCESS", "PENDING", "FAILURE"] },
  source: String,
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);
