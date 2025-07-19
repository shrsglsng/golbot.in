import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  name: String,
  desc: String,
  imgUrl: String,
  price: { type: Number, min: 0 },
  gst: { type: Number, min: 0 },
  isAvailable: { type: Boolean, default: true },
  qtyLeft: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

export default mongoose.model("Item", itemSchema);
