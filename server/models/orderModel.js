import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  uid: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  machineId: { type: mongoose.Schema.Types.ObjectId, ref: "Machine" },
  amount: {
    price: { type: Number },
    gst: { type: Number },
    total: { type: Number },
  },
  orderStatus: {
    type: String,
    enum: ["PENDING", "PAID", "READY", "PREPARING", "COMPLETED", "CANCELLED"],
    default: "PENDING",
  },
  orderCompleted: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
