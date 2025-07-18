import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    order_id: String,
    payment_id: String,
    signature: String,
    amount: Number,
    currency: String,
    verified: Boolean,
    source: String
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);