import express from "express"
// import { getSessionId } from "../controllers/paymentController.js";
import auth from "../middlewares/auth.js"
import {
  helloResponse,
  createOrder,
  verifyPayment,
  getPaymentStatus,
  getAllPayments
} from "../controllers/paymentController.js"

const router = express.Router()

router.get("/hello", auth, helloResponse)
router.post("/create-order", auth, createOrder)
router.post("/verify", auth, verifyPayment)
router.get("/payment/:orderId", auth, getPaymentStatus)
router.get("/payments", auth, getAllPayments)

export default router
