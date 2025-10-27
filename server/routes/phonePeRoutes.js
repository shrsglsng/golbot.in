/**
 * PhonePe Payment Routes
 * 
 * Handles routing for PhonePe payment operations
 */

import express from "express";
import bodyParser from "body-parser";
import {
  createPhonePeOrder,
  verifyPhonePePayment,
  handlePhonePeWebhook,
  getPhonePePaymentStatus,
  getPhonePePaymentUrl,
  getPhonePeHealth
} from "../controllers/phonePeController.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// Health check endpoint
router.get("/health", getPhonePeHealth);

// Payment operations (require authentication)
router.post("/create-order", auth, createPhonePeOrder);
router.post("/verify", auth, verifyPhonePePayment);
router.get("/status/:orderId", auth, getPhonePePaymentStatus);
router.get("/payment-url/:orderId", auth, getPhonePePaymentUrl);

// Webhook endpoint (no auth required, signature verification handled in controller)
router.post("/webhook", bodyParser.raw({ type: "application/json" }), handlePhonePeWebhook);

export default router;