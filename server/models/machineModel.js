import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const machineSchema = new mongoose.Schema({
  mid: { type: String, required: true, unique: true },
  mstatus: {
    type: String,
    enum: ["CONNECTED", "DISCONNECTED"],
    default: "DISCONNECTED",
  },
  location: String,
  password: String,
  ipAddress: String,
  lastPingedAt: Date,
}, { timestamps: true });

machineSchema.pre("save", async function () {
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

machineSchema.methods.createJwt = function () {
  return jwt.sign({ mid: this.mid }, process.env.EXPAPP_JWT_SECRET);
};

machineSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("Machine", machineSchema);
