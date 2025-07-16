import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const machineSchema = new mongoose.Schema(
  {
    mid: { type: String },
    mstatus: {
      type: String,
      enum: ["CONNECTED", "DISCONNECTED"],
      default: "DISCONNECTED",
    },
    location: { type: String },
    password: { type: String },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

machineSchema.pre("save", async function () {
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

machineSchema.methods.createJwt = function () {
  var payload = { mid: this.mid };
  return jwt.sign(payload, process.env.EXPAPP_JWT_SECRET, {
    expiresIn: process.env.EXPAPP_JWT_LIFETIME,
  });
};

machineSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("Machine", machineSchema);
