import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  qty: { type: Number, min: 1, required: true },
  priceAtOrderTime: { type: Number, min: 0, required: true },
}, { timestamps: true });

orderItemSchema.index({ orderId: 1, itemId: 1 }, { unique: true });

export default mongoose.model("OrderItem", orderItemSchema);
