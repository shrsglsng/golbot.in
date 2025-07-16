import mongoose from "mongoose";

const machineSchema = new mongoose.Schema(
  {
    uid: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    machineId: { type: String },
    oid: { type: mongoose.Schema.Types.ObjectId, ref: "Orders" },
    imgUrl: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("ReportIssue", machineSchema);
