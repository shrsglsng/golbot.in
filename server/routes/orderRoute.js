import express from "express"
import auth from "../middlewares/auth.js"
import admin from "../middlewares/admin.js"
import {
  createOrder,
  getAllOrders,
  getIsOrderCompleted,
  getIsOrderPreparing,
  getLatestOrder,
  getOrderOTP,
  // getPaymentOrderStatus,
  createReportIssue,
} from "../controllers/orderController.js"
import { uploadImage } from "../middlewares/uploadImage.js"

const router = express.Router()

router.post("/create", auth, createOrder)
// router.get("/getPaymentOrderStatus", getPaymentOrderStatus)
router.get("/getOrderOtp", auth, getOrderOTP)

// util routes
router.get("/getLatest/", auth, getLatestOrder)
router.get("/getIsOrderCompleted/", auth, getIsOrderCompleted)
router.get("/getIsOrderPreparing/", auth, getIsOrderPreparing)

router.post(
  "/reportIssue",
  auth,
  uploadImage.single("image"),
  createReportIssue
)

router.get("/admin/getallorders", admin, getAllOrders)

export default router
