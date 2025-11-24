import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const machineSchema = new mongoose.Schema({
  mid: {
    type: String,
    required: true,
    unique: true,
    uppercase: true, // Automatically convert to uppercase
    trim: true,
    validate: {
      validator: function(v) {
        // Validate format: 3-20 characters, alphanumeric
        return /^[A-Z0-9]{3,20}$/.test(v);
      },
      message: props => `${props.value} is not a valid machine ID! Format should be 3-20 alphanumeric characters (e.g., M01, ABC1, XY99)`
    }
  },
  mstatus: {
    type: String,
    enum: ["CONNECTED", "DISCONNECTED", "OTP_VERIFIED", "PREPARING", "READY_FOR_PICKUP"],
    default: "DISCONNECTED",
  },
  // Optimistic locking for concurrent machine status updates
  statusVersion: { type: Number, default: 0 },
  currentOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  isActive: { type: Boolean, default: true },
  location: String,
  password: String,
  ipAddress: String,
  lastPingedAt: Date,

  // Soft delete tracking
  deletedAt: Date,
  deletedBy: String,
  restoredAt: Date,
  restoredBy: String,

  // QR Token management for machine routing
  qrTokens: [{
    tokenId: { type: String, required: true },
    token: { type: String, required: true }, // Store the actual token value
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String, default: 'system' },
    label: String,
  }],

  revokedTokens: [{ type: String }],

  // Puri quantity management
  puriQuantity: { type: Number, default: 0, min: 0 },
  lowQuantityThreshold: { type: Number, default: 30, min: 0 }, // Alert when puris fall below this

  // Firmware management
  lastHeartbeatAt: Date, // Last heartbeat received from firmware
  firmwareVersion: String, // e.g., "1.0.0" or "APK_MOCK"
  firmwareMode: { // Type of firmware/client
    type: String,
    enum: ["HARDWARE", "APK_MOCK", "UNKNOWN"],
    default: "UNKNOWN"
  },
}, { timestamps: true });

machineSchema.pre("save", async function () {
  // Only hash password if it was modified (not on every save)
  if (this.isModified('password') && this.password) {
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
