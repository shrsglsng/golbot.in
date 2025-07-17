import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    desc: String,
    imgUrl: String,
    price: Number,
    gst: Number,

    isAvailable: {
      type: Boolean,
      default: true,
    },
    quantity: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Item", itemSchema);
