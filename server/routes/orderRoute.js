import express from "express";
import {
  createOrder,
  getOrderOTP,
  getLatestOrder,
  getIsOrderCompleted,
  getIsOrderPreparing,
  createReportIssue,
  getAllOrders
} from "../controllers/orderController.js";
import auth from "../middlewares/auth.js";
import admin from "../middlewares/admin.js";
import { uploadImage } from "../middlewares/uploadImage.js";

const router = express.Router();

// Order creation & status
router.post("/", auth, createOrder);
router.get("/otp", auth, getOrderOTP);
router.get("/latest", auth, getLatestOrder);
router.get("/completed", auth, getIsOrderCompleted);
router.get("/preparing", auth, getIsOrderPreparing);

// Issue report with image
router.post("/report", auth, uploadImage.single("image"), createReportIssue);

// Admin order view
router.get("/admin/all", admin, getAllOrders);

export default router;
