import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  verified: { type: Boolean, default: false },
  OTP: String, // If using TTL, store `otpExpiresAt` as a Date
}, { timestamps: true });

userSchema.methods.createJwt = function () {
  return jwt.sign({ uid: this._id, phone: this.phone }, process.env.EXPAPP_JWT_SECRET);
};

export default mongoose.model("User", userSchema);
