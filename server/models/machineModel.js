import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const machineSchema = new mongoose.Schema({
  mid: { type: String, required: true, unique: true },
  mstatus: {
    type: String,
    enum: ["CONNECTED", "DISCONNECTED", "PREPARING", "READY_FOR_PICKUP"],
    default: "DISCONNECTED",
  },
  isActive: { type: Boolean, default: true },
  location: String,
  password: String,
  ipAddress: String,
  lastPingedAt: Date,

  // QR Token management for machine routing
  qrTokens: [{
    tokenId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String, default: 'system' },
    label: String,
  }],

  revokedTokens: [{ type: String }],
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

// Get all active (non-revoked) tokens for this machine
machineSchema.methods.getActiveTokens = function () {
  return this.qrTokens.filter(token =>
    !this.revokedTokens.includes(token.tokenId)
  );
};

// Check if a specific token is active
machineSchema.methods.isTokenActive = function (tokenId) {
  return !this.revokedTokens.includes(tokenId);
};

// Revoke a specific token
machineSchema.methods.revokeToken = function (tokenId) {
  if (!this.revokedTokens.includes(tokenId)) {
    this.revokedTokens.push(tokenId);
  }
};

export default mongoose.model("Machine", machineSchema);
