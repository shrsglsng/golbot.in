import express from "express"
// import { getSessionId } from "../controllers/paymentController.js";
import auth from "../middlewares/auth.js"
import {
  paymentWebhook,
  getPaymentStatus,
} from "../controllers/paymentController.js"

const router = express.Router()

router.post("/webhook/", auth, paymentWebhook)
router.get("/paymentStatus/:merchantTransactionId", getPaymentStatus)

export default router
