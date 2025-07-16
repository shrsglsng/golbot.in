import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    desc: String,
    imgUrl: String,
    price: Number,
    gst: Number,
  },
  { timestamps: true }
);

export default mongoose.model("Item", itemSchema);
