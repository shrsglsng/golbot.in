import crypto from "crypto";
import Payment from "../models/paymentModel.js";
import Order from "../models/orderModel.js";
import logger from "../utils/logger.js";
import { BadRequestError, ExternalServiceError } from "../utils/errors.js";
import DatabaseUtil from "../utils/database.js";
import ApiResponse from "../utils/response.js";

// Verify webhook signature
const verifyWebhookSignature = (signature, secret, body) => {
  if (!signature || !secret) {
    logger.warn('Missing webhook signature or secret', { 
      hasSignature: !!signature,
      hasSecret: !!secret 
    });
    throw new BadRequestError("Missing webhook authentication");
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  if (signature !== expectedSignature) {
    logger.warn('Invalid webhook signature', { 
      expectedSignature: expectedSignature.substring(0, 10) + '...',
      providedSignature: signature.substring(0, 10) + '...' 
    });
    throw new BadRequestError("Invalid webhook signature");
  }

  logger.debug('Webhook signature verified successfully');
};

// Parse webhook payload
const parseWebhookPayload = (body) => {
  try {
    return JSON.parse(body.toString());
  } catch (parseError) {
    logger.error('Failed to parse webhook payload', { 
      error: parseError.message,
      bodyLength: body?.length 
    });
    throw new BadRequestError("Invalid webhook payload format");
  }
};

// Extract order ID from payment entity
const extractOrderId = (paymentEntity) => {
  const dbOrderId = paymentEntity.notes?.orderId || 
                   paymentEntity.notes?.db_order_id || 
                   paymentEntity.order_id.split("_")[1];

  if (!dbOrderId) {
    logger.error('Unable to extract order ID from payment', { 
      paymentId: paymentEntity.id,
      notes: paymentEntity.notes,
      razorpayOrderId: paymentEntity.order_id 
    });
    throw new BadRequestError("Unable to identify order from payment");
  }

  return dbOrderId;
};

// Process payment webhook
const processPaymentWebhook = async (event, paymentEntity) => {
  const existingPayment = await DatabaseUtil.findOne(Payment, { 
    razorpaypaymentId: paymentEntity.id 
  });

  if (existingPayment && existingPayment.verified) {
    logger.info('Payment already processed via webhook', { 
      paymentId: paymentEntity.id,
      existingPaymentId: existingPayment._id 
    });
    return { processed: false, reason: "already_processed" };
  }

  const dbOrderId = extractOrderId(paymentEntity);

  await DatabaseUtil.transaction(async (session) => {
    const paymentData = {
      orderId: dbOrderId,
      razorpayorderId: paymentEntity.order_id,
      razorpaypaymentId: paymentEntity.id,
      amount: paymentEntity.amount / 100,
      currency: paymentEntity.currency,
      verified: true,
      status: "SUCCESS",
      source: "razorpay_webhook",
      verifiedAt: new Date(),
      paymentMethod: paymentEntity.method,
      webhookEvent: event,
      paymentDetails: {
        bank: paymentEntity.bank,
        wallet: paymentEntity.wallet,
        vpa: paymentEntity.vpa,
        card_id: paymentEntity.card_id
      }
    };

    if (existingPayment) {
      await DatabaseUtil.updateById(Payment, existingPayment._id, paymentData, { session });
    } else {
      await DatabaseUtil.create(Payment, paymentData, { session });
    }

    const orderOtp = Math.floor(1000 + Math.random() * 9000).toString();
    await DatabaseUtil.updateById(Order, dbOrderId, {
      orderStatus: "PAID",
      paidAt: new Date(),
      orderOtp: orderOtp
    }, { session });
  });

  logger.info('Webhook payment processed successfully', { 
    event,
    paymentId: paymentEntity.id,
    orderId: dbOrderId,
    amount: paymentEntity.amount / 100 
  });

  return { 
    processed: true,
    event,
    paymentId: paymentEntity.id,
    orderId: dbOrderId 
  };
};

export default async function razorpayWebhookHandler(req, res) {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    logger.info('Razorpay webhook received', { 
      hasSignature: !!signature,
      hasSecret: !!secret,
      contentLength: req.body?.length || 0 
    });

    verifyWebhookSignature(signature, secret, req.body);
    const payload = parseWebhookPayload(req.body);

    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;

    if (!paymentEntity) {
      logger.warn('Webhook payload missing payment entity', { event });
      throw new BadRequestError("Invalid webhook payload structure");
    }

    logger.info('Processing webhook event', { 
      event, 
      paymentId: paymentEntity.id,
      orderId: paymentEntity.order_id,
      amount: paymentEntity.amount / 100,
      status: paymentEntity.status 
    });

    if (event === "payment.authorized" || event === "payment.captured") {
      try {
        const result = await processPaymentWebhook(event, paymentEntity);
        return ApiResponse.success(res, result, "Webhook processed successfully");
      } catch (dbError) {
        logger.error('Database error processing webhook', { 
          error: dbError.message,
          event,
          paymentId: paymentEntity.id 
        });
        throw new ExternalServiceError("Failed to process payment webhook", "Database");
      }
    } else {
      logger.info('Webhook event not processed', { 
        event,
        supportedEvents: ["payment.authorized", "payment.captured"] 
      });
      return ApiResponse.success(res, { 
        processed: false, 
        reason: "event_not_supported" 
      }, "Event acknowledged but not processed");
    }

  } catch (error) {
    logger.error('Webhook processing failed', { 
      error: error.message,
      hasBody: !!req.body 
    });

    if (error instanceof BadRequestError) {
      return ApiResponse.badRequest(res, error.message);
    }
    
    throw error;
  }
}
