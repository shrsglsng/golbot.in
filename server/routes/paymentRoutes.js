import express from "express";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPaymentStatus,
  getAllPayments
} from "../controllers/paymentController.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// Razorpay
router.post("/create-order", auth, createRazorpayOrder);
router.post("/verify", auth, verifyRazorpayPayment);
router.get("/:orderId", auth, getPaymentStatus);
router.get("/", auth, getAllPayments);

export default router;
