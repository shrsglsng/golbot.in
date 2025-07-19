import express from "express";
import bodyParser from "body-parser";
import razorpayWebhookHandler from "../controllers/razorpayWebhookController.js";

const router = express.Router();

router.post("/", bodyParser.raw({ type: "application/json" }), razorpayWebhookHandler);

export default router;
