// server/models/userModel.js

import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
  phone: { 
    type: String, 
    required: true, 
    unique: true 
  },
  verified: { 
    type: Boolean, 
    default: false 
  },
  OTP: String, // Temporary OTP storage
  // NEW: Add these fields for demo mode tracking
  sessionId: String, // 2Factor session ID or 'DEMO_SESSION'
  otpExpiry: Date, // OTP expiration time
  isDemo: { 
    type: Boolean, 
    default: false 
  }, // Flag to identify demo users
  lastLoginAt: Date, // Track last login
}, { timestamps: true });

// JWT creation method
userSchema.methods.createJwt = function () {
  const payload = {
    uid: this._id,
    phone: this.phone,
    isDemo: this.isDemo || false // Include isDemo flag in JWT
  };
  
  return jwt.sign(
    payload, 
    process.env.EXPAPP_JWT_SECRET,
    { expiresIn: process.env.EXPAPP_JWT_LIFETIME || '7d' }
  );
};

export default mongoose.model("User", userSchema);
