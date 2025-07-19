import express from "express";
import {
  anonRegister,
  phoneSendOtp,
  verifyOtp
} from "../controllers/authController.js";

const router = express.Router();

// Anonymous user register (without phone)
router.post("/anonymous", anonRegister);

// OTP auth
router.post("/send-otp", phoneSendOtp);
router.post("/verify-otp", verifyOtp);

export default router;
