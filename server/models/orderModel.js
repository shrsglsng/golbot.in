import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    uid: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    itemQty: {
      GOL: { type: Number },
      PAN: { type: Number },
      PWO: { type: Number },
    },
    machineId: { type: String },
    amount: {
      price: { type: Number },
      gst: { type: Number },
      total: { type: Number },
    },
    ostatus: {
      type: String,
      // PENDING -> payment pending
      // READY -> payment done... Awaiting scan
      // PREPARING -> Scanned And now its preparing
      // COMPLETED -> The User took the plate out
      // CANCELLED -> All exception cases
      enum: ["PENDING", "READY", "PREPARING", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },
    orderCompleted: {
      type: Boolean,
      default: false,
    },

    orderOtp: {
      type: String,
    },
    paymentOrderId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Orders", orderSchema);
