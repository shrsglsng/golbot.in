/**
 * PhonePe Payment Controller
 * 
 * Handles PhonePe payment operations including:
 * - Order creation
 * - Payment verification
 * - Webhook processing
 * - Status checking
 */

import Payment from "../models/paymentModel.js";
import Order from "../models/orderModel.js";
import OrderItem from "../models/orderItemModel.js";
import phonePeService from "../services/phonePeService.js";
import { paymentConfig, buildRedirectUrl } from "../config/paymentConfig.js";
import logger from "../utils/logger.js";
import { BadRequestError, ExternalServiceError } from "../utils/errors.js";
import { Validator } from "../utils/validation.js";
import DatabaseUtil from "../utils/database.js";
import ApiResponse from "../utils/response.js";
// Removed deductMachinePuris - puris are only deducted in firmware controller when preparation starts

// ----------------------------------------------------------------
// Create PhonePe order (used by frontend for checkout)
export const createPhonePeOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const { uid } = req.user;
    
    logger.info('PhonePe order creation request', { 
      orderId, 
      userId: uid 
    });

    // Validate input
    Validator.validateRequired(['orderId'], { orderId });
    Validator.validateObjectId(orderId, 'Order ID');

    // Find and validate order
    const order = await DatabaseUtil.findOne(Order, { 
      _id: orderId,
      uid: uid // Ensure user owns the order
    }, { throwIfNotFound: true });

    if (order.orderStatus !== "PENDING") {
      logger.warn('PhonePe order creation for non-pending order', { 
        orderId, 
        status: order.orderStatus,
        userId: uid 
      });
      throw new BadRequestError("Order is not in pending state");
    }

    // Check if payment already exists
    const existingPayment = await DatabaseUtil.findOne(Payment, { orderId });
    if (existingPayment && existingPayment.verified) {
      logger.warn('PhonePe order creation for already paid order', { 
        orderId, 
        paymentId: existingPayment._id,
        userId: uid 
      });
      throw new BadRequestError("Order is already paid");
    }

    const amountInPaise = Math.round(order.amount.total * 100);
    const receipt = `phonepe_${Date.now()}_${orderId.toString().slice(-8)}`;

    // Extract origin from request headers for dynamic redirect
    const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || null;
    const redirectUrl = buildRedirectUrl(orderId, 'redirect', origin);

    logger.debug('Creating PhonePe order', {
      orderId,
      amount: order.amount.total,
      amountInPaise,
      receipt,
      origin,
      redirectUrl
    });

    try {
      const phonepeOrder = await phonePeService.createPayment(
        orderId.toString(),
        amountInPaise,
        redirectUrl,
        {
          userId: uid.toString(),
          description: `Food Order - ${orderId.toString().slice(-8)}`
        }
      );

      const payPageUrl = phonePeService.extractPaymentUrl(phonepeOrder);

      logger.info('PhonePe order created successfully', { 
        phonepeOrderId: orderId.toString(),
        orderId,
        amount: amountInPaise / 100,
        userId: uid,
        hasPayPageUrl: !!payPageUrl,
        payPageUrl: payPageUrl?.substring(0, 100) + '...',
        phonepeOrderStructure: Object.keys(phonepeOrder || {}),
        phonepePayload: phonepeOrder?.payload ? Object.keys(phonepeOrder.payload) : 'no payload'
      });

      // If we don't have a payPageUrl, log the full response for debugging
      if (!payPageUrl) {
        logger.warn('PhonePe payPageUrl not found in response', {
          orderId,
          phonepeResponse: phonepeOrder,
          userId: uid
        });
      }

      // Save or update payment record
      const paymentData = {
        orderId,
        gateway: 'phonepe',
        phonepeOrderId: orderId.toString(),
        amount: amountInPaise / 100,
        currency: paymentConfig.phonepe.currency,
        verified: false,
        status: "PENDING",
        source: "server",
        receipt,
        createdAt: new Date()
      };

      if (existingPayment) {
        await DatabaseUtil.updateById(Payment, existingPayment._id, paymentData);
      } else {
        await DatabaseUtil.create(Payment, paymentData);
      }

      return ApiResponse.created(res, {
        phonepeOrder: {
          orderId: orderId.toString(),
          amount: amountInPaise,
          currency: paymentConfig.phonepe.currency,
          receipt,
          payPageUrl,
          checkoutUrl: payPageUrl // Add checkoutUrl here too for frontend compatibility
        },
        checkoutUrl: payPageUrl,
        fallbackAvailable: !payPageUrl, // Indicate if fallback polling is needed
        pollEndpoint: payPageUrl ? null : `/api/v1/phonepe/payment-url/${orderId}`,
        debug: {
          hasPayPageUrl: !!payPageUrl,
          phonepeResponseKeys: Object.keys(phonepeOrder || {}),
          payloadKeys: phonepeOrder?.payload ? Object.keys(phonepeOrder.payload) : null
        }
      }, payPageUrl ? "PhonePe order created successfully" : "PhonePe order created, payment URL pending");

    } catch (phonepeError) {
      logger.error('PhonePe order creation failed', { 
        error: phonepeError.message,
        orderId,
        userId: uid,
        amount: amountInPaise 
      });
      throw new ExternalServiceError("Payment initiation failed. Please try again.", "PhonePe");
    }

  } catch (error) {
    logger.error('Create PhonePe order failed', { 
      error: error.message,
      orderId: req.body?.orderId,
      userId: req.user?.uid 
    });
    throw error;
  }
};

// ----------------------------------------------------------------
// Verify PhonePe payment (frontend POST /verify)
export const verifyPhonePePayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const { uid } = req.user;

    logger.info('PhonePe payment verification request', { 
      orderId,
      userId: uid 
    });

    // Validate input
    Validator.validateRequired(['orderId'], { orderId });

    // Find the payment record
    const paymentRecord = await DatabaseUtil.findOne(Payment, { 
      $or: [
        { phonepeOrderId: orderId },
        { orderId: orderId }
      ],
      gateway: 'phonepe'
    }, { throwIfNotFound: true });

    // Verify order belongs to user
    const order = await DatabaseUtil.findOne(Order, { 
      _id: paymentRecord.orderId,
      uid: uid 
    }, { throwIfNotFound: true });

    try {
      // Verify payment with PhonePe
      const verificationResult = await phonePeService.verifyPayment(orderId);

      logger.debug('PhonePe verification result', { 
        orderId,
        success: verificationResult.success,
        status: verificationResult.status,
        state: verificationResult.state
      });

      if (!verificationResult.success) {
        // IMPORTANT: Distinguish between PENDING and FAILED payments
        if (verificationResult.pending) {
          // Payment is still pending - user hasn't completed it yet
          logger.info('PhonePe payment still pending', {
            orderId,
            status: verificationResult.status,
            state: verificationResult.state
          });

          return ApiResponse.badRequest(res, "Payment not yet completed", {
            payment: {
              orderId: order._id,
              status: verificationResult.status || "PENDING",
              state: verificationResult.state || "PENDING",
              verified: false,
              pending: true
            }
          });
        }

        // Payment actually failed (not just pending)
        logger.warn('PhonePe payment verification failed', {
          orderId,
          status: verificationResult.status,
          state: verificationResult.state
        });

        // Update payment record to FAILED status
        await paymentRecord.updateStatus(
          "FAILURE",
          "phonepe_verification",
          "Payment verification failed",
          {
            verificationSource: "frontend",
            userId: uid,
            errorCode: verificationResult.code,
            errorMessage: verificationResult.message
          },
          {
            state: verificationResult.state,
            status: verificationResult.status
          }
        );

        // Update order status to PAYMENT_FAILED
        await order.updateStatus(
          "PAYMENT_FAILED",
          "payment_verification",
          "Payment verification failed",
          {
            errorCode: verificationResult.code,
            errorMessage: verificationResult.message || "Payment was not successful",
            attemptedAt: new Date()
          }
        );

        logger.info('Order and payment marked as failed', {
          orderId: order._id,
          status: verificationResult.status
        });

        return ApiResponse.badRequest(res, verificationResult.message || "Payment was not successful");
      }

      // Use transaction for payment verification with idempotency check
      // Check inside transaction to prevent race conditions from multiple concurrent requests
      await DatabaseUtil.transaction(async (session) => {
        // Atomic idempotency check: only update if payment not already verified
        // This prevents duplicate processing if user opens payment page in multiple tabs
        const paymentToUpdate = await Payment.findOneAndUpdate(
          {
            _id: paymentRecord._id,
            verified: false // Only update if not verified yet
          },
          {
            verified: true,
            verifiedAt: new Date()
          },
          {
            new: true,
            session
          }
        );

        // If update returned null, payment was already verified by another request
        if (!paymentToUpdate) {
          logger.warn('Payment already verified in concurrent request', {
            paymentId: paymentRecord._id,
            orderId
          });
          throw new BadRequestError('Payment already verified');
        }

        // Update payment record status
        await paymentToUpdate.updateStatus(
          "SUCCESS",
          "phonepe_verification",
          "Payment verified successfully",
          {
            verificationSource: "frontend",
            userId: uid
          },
          {
            transactionId: verificationResult.transactionId,
            paymentMethod: verificationResult.paymentMethod,
            state: verificationResult.state
          }
        );

        // Update payment details
        paymentToUpdate.phonepeTransactionId = verificationResult.transactionId;
        paymentToUpdate.phonepePaymentId = verificationResult.transactionId;
        paymentToUpdate.paymentMethod = verificationResult.paymentMethod;
        paymentToUpdate.paymentDetails = {
          ...verificationResult.paymentDetails
        };
        await paymentToUpdate.save({ session });

        // Update order status to PAID
        const orderToUpdate = await Order.findById(order._id).session(session);

        // Validate order has machine binding before marking as PAID
        if (!orderToUpdate.machineId) {
          logger.error('Payment verification for order without machineId', {
            orderId: order._id,
            userId: uid
          });
          throw new BadRequestError('Order missing machine binding - cannot process payment');
        }

        logger.debug('Order machine binding validated', {
          orderId: order._id,
          machineId: orderToUpdate.machineId
        });

        // Mark as PAID - waiting for OTP verification
        await orderToUpdate.updateStatus(
          "PAID",
          "payment_verified",
          "Payment confirmed - waiting for OTP verification",
          {
            paymentId: verificationResult.transactionId,
            amount: verificationResult.amount / 100
          }
        );

        // Generate OTP for order pickup
        orderToUpdate.orderOtp = Math.floor(1000 + Math.random() * 9000).toString();
        await orderToUpdate.save({ session });

        // NOTE: Puris are NOT deducted here
        // They will be deducted when firmware starts preparation (PREPARING status)
        // This prevents premature inventory deduction before order actually starts
      });

      logger.info('PhonePe payment verified and order updated successfully', { 
        orderId: order._id,
        phonepeTransactionId: verificationResult.transactionId,
        amount: verificationResult.amount / 100,
        userId: uid 
      });

      return ApiResponse.success(res, {
        payment: {
          orderId: order._id,
          amount: verificationResult.amount / 100,
          status: "SUCCESS",
          verified: true,
          paymentId: verificationResult.transactionId
        },
        order: {
          id: order._id,
          status: "PAID",
          orderOtp: order.orderOtp
        }
      }, "Payment verified successfully");

    } catch (phonepeError) {
      logger.error('PhonePe verification API error', { 
        error: phonepeError.message,
        orderId 
      });
      throw new ExternalServiceError("Failed to verify payment with PhonePe", "PhonePe");
    }

  } catch (error) {
    logger.error('PhonePe payment verification failed', { 
      error: error.message,
      orderId: req.body?.orderId,
      userId: req.user?.uid 
    });
    throw error;
  }
};

// ----------------------------------------------------------------
// PhonePe webhook handler
export const handlePhonePeWebhook = async (req, res) => {
  try {
    logger.info('PhonePe webhook received', { 
      hasBody: !!req.body,
      contentLength: JSON.stringify(req.body)?.length || 0,
      headers: {
        authorization: req.headers?.authorization ? 'present' : 'missing',
        contentType: req.headers['content-type']
      }
    });

    // Verify webhook signature if configured
    const signature = req.headers['authorization'];
    if (paymentConfig.phonepe.webhookStrict) {
      const isValidSignature = phonePeService.validateWebhookSignature(
        signature, 
        JSON.stringify(req.body)
      );
      
      if (!isValidSignature) {
        logger.warn('PhonePe webhook signature verification failed');
        return ApiResponse.unauthorized(res, "Invalid webhook signature");
      }
    }

    // Parse webhook payload (handle different formats)
    const payload = req.body?.payload || req.body || {};
    const orderId = payload?.merchantOrderId || payload?.orderId || payload?.merchantTransactionId;
    const state = payload?.state;
    const transactionId = payload?.transactionId || payload?.merchantTransactionId;

    if (!orderId) {
      logger.warn('PhonePe webhook missing order ID', { payload });
      throw new BadRequestError("Invalid webhook payload: missing order ID");
    }

    logger.info('Processing PhonePe webhook', { 
      orderId,
      state,
      transactionId,
      amount: payload?.amount
    });

    // Find payment record
    const existingPayment = await DatabaseUtil.findOne(Payment, { 
      phonepeOrderId: orderId,
      gateway: 'phonepe'
    });

    if (!existingPayment) {
      logger.warn('PhonePe webhook for unknown payment', { orderId });
      return ApiResponse.success(res, { processed: false, reason: "payment_not_found" });
    }

    if (existingPayment.verified && state === 'COMPLETED') {
      logger.info('Payment already processed via webhook', { 
        orderId,
        paymentId: existingPayment._id 
      });
      return ApiResponse.success(res, { processed: false, reason: "already_processed" });
    }

    // Extract payment URL if present
    const payPageUrl = phonePeService.extractPaymentUrl(payload);
    if (payPageUrl) {
      logger.info('PhonePe payment URL received via webhook', { orderId, payPageUrl });
      // Store URL for polling if needed (implementation specific)
    }

    // Process payment state changes
    if (state === 'COMPLETED') {
      await processSuccessfulPayment(existingPayment, payload, transactionId);
    } else if (state === 'FAILED') {
      await processFailedPayment(existingPayment, payload);
    } else {
      logger.info('PhonePe webhook state not processed', { orderId, state });
    }

    return ApiResponse.success(res, { 
      processed: true,
      orderId,
      state 
    }, "Webhook processed successfully");

  } catch (error) {
    logger.error('PhonePe webhook processing failed', { 
      error: error.message,
      hasBody: !!req.body 
    });

    if (error instanceof BadRequestError) {
      return ApiResponse.badRequest(res, error.message);
    }
    
    throw error;
  }
};

// Helper function to process successful payment
async function processSuccessfulPayment(paymentRecord, payload, transactionId) {
  await DatabaseUtil.transaction(async (session) => {
    await paymentRecord.updateStatus(
      "SUCCESS",
      "phonepe_webhook",
      "Payment verified via PhonePe webhook",
      {
        webhookPayload: payload,
        amount: payload.amount / 100
      },
      {
        transactionId,
        state: 'COMPLETED',
        paymentMethod: payload.paymentInstrument?.type
      }
    );

    // Update additional payment details
    paymentRecord.phonepeTransactionId = transactionId;
    paymentRecord.phonepePaymentId = transactionId;
    paymentRecord.paymentMethod = payload.paymentInstrument?.type;
    paymentRecord.paymentDetails = {
      upi: payload.paymentInstrument?.upi,
      card: payload.paymentInstrument?.card
    };
    await paymentRecord.save({ session });

    // Update order status
    const orderToUpdate = await Order.findById(paymentRecord.orderId).session(session);
    const orderOtp = Math.floor(1000 + Math.random() * 9000).toString();

    // Validate order has machine binding before marking as PAID
    if (!orderToUpdate.machineId) {
      logger.error('PhonePe webhook for order without machineId', {
        orderId: paymentRecord.orderId,
        transactionId
      });
      throw new BadRequestError('Order missing machine binding - cannot process payment');
    }

    logger.debug('Order machine binding validated (webhook)', {
      orderId: orderToUpdate._id,
      machineId: orderToUpdate.machineId
    });


    // Mark as PAID - waiting for OTP verification
    await orderToUpdate.updateStatus(
      "PAID",
      "phonepe_webhook",
      "Payment confirmed via webhook - waiting for OTP verification",
      {
        paymentId: transactionId,
        amount: payload.amount / 100,
        webhookState: payload.state
      }
    );

    orderToUpdate.orderOtp = orderOtp;
    await orderToUpdate.save({ session });
  });

  logger.info('PhonePe webhook payment processed successfully', { 
    orderId: paymentRecord.phonepeOrderId,
    transactionId,
    amount: payload.amount / 100 
  });
}

// Helper function to process failed payment
async function processFailedPayment(paymentRecord, payload) {
  await paymentRecord.updateStatus(
    "FAILURE",
    "phonepe_webhook",
    "Payment failed via PhonePe webhook",
    {
      webhookPayload: payload,
      errorCode: payload.errorCode,
      errorMessage: payload.errorMessage
    },
    {
      state: 'FAILED',
      errorCode: payload.errorCode,
      errorMessage: payload.errorMessage
    }
  );

  logger.info('PhonePe webhook payment failure processed', { 
    orderId: paymentRecord.phonepeOrderId,
    errorCode: payload.errorCode,
    errorMessage: payload.errorMessage
  });
}

// ----------------------------------------------------------------
// Get payment status by order ID (used by frontend to confirm)
export const getPhonePePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { uid } = req.user;

    logger.info('PhonePe payment status request', { orderId, userId: uid });

    // Validate input
    Validator.validateRequired(['orderId'], { orderId });

    // Find payment record
    const payment = await DatabaseUtil.findOne(Payment, {
      $or: [
        { phonepeOrderId: orderId },
        { orderId: orderId }
      ],
      gateway: 'phonepe'
    }, { throwIfNotFound: true });

    // Verify order belongs to user
    const order = await DatabaseUtil.findOne(Order, { 
      _id: payment.orderId,
      uid: uid 
    }, { throwIfNotFound: true });

    const statusInfo = payment.getCurrentStatusInfo();
    const paymentHistory = payment.getPaymentHistory();

    logger.info('PhonePe payment status retrieved', { 
      orderId,
      status: statusInfo.status,
      verified: statusInfo.verified 
    });

    return ApiResponse.success(res, {
      payment: {
        id: payment._id,
        orderId: payment.orderId,
        phonepeOrderId: payment.phonepeOrderId,
        transactionId: payment.phonepeTransactionId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        verified: payment.verified,
        gateway: payment.gateway,
        paymentMethod: payment.paymentMethod,
        createdAt: payment.createdAt,
        verifiedAt: payment.verifiedAt,
        currentStatus: statusInfo
      },
      order: {
        id: order._id,
        status: order.orderStatus,
        orderOtp: order.orderOtp
      },
      history: paymentHistory
    }, "Payment status retrieved successfully");

  } catch (error) {
    logger.error('Get PhonePe payment status failed', { 
      error: error.message,
      orderId: req.params?.orderId,
      userId: req.user?.uid 
    });
    throw error;
  }
};

// ----------------------------------------------------------------
// Get PhonePe payment URL (polling endpoint for delayed URLs)
export const getPhonePePaymentUrl = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { uid } = req.user;

    logger.info('PhonePe payment URL request', { orderId, userId: uid });

    // Validate input
    Validator.validateRequired(['orderId'], { orderId });

    // Find payment record
    const payment = await DatabaseUtil.findOne(Payment, {
      $or: [
        { phonepeOrderId: orderId },
        { orderId: orderId }
      ],
      gateway: 'phonepe'
    }, { throwIfNotFound: true });

    // Verify order belongs to user
    await DatabaseUtil.findOne(Order, { 
      _id: payment.orderId,
      uid: uid 
    }, { throwIfNotFound: true });

    // Try to get the latest status from PhonePe which might include the payment URL
    try {
      const statusResponse = await phonePeService.getOrderStatus(orderId);
      const payPageUrl = phonePeService.extractPaymentUrl(statusResponse);
      
      if (payPageUrl) {
        logger.info('PhonePe payment URL found via status check', { 
          orderId,
          urlLength: payPageUrl.length
        });
        
        return ApiResponse.success(res, {
          paymentUrl: payPageUrl,
          orderId,
          found: true
        }, "Payment URL retrieved successfully");
      } else {
        logger.info('PhonePe payment URL still not available', { orderId });
        
        return ApiResponse.success(res, {
          paymentUrl: null,
          orderId,
          found: false,
          message: "Payment URL not yet available, please try again in a few seconds"
        }, "Payment URL not yet available");
      }
      
    } catch (phonepeError) {
      logger.error('PhonePe status check failed while polling for URL', { 
        error: phonepeError.message,
        orderId 
      });
      
      return ApiResponse.success(res, {
        paymentUrl: null,
        orderId,
        found: false,
        error: "Failed to check payment status"
      }, "Payment URL check failed");
    }

  } catch (error) {
    logger.error('Get PhonePe payment URL failed', { 
      error: error.message,
      orderId: req.params?.orderId,
      userId: req.user?.uid 
    });
    throw error;
  }
};

// ----------------------------------------------------------------
// Get PhonePe service health status
export const getPhonePeHealth = async (req, res) => {
  try {
    const healthStatus = phonePeService.getHealthStatus();
    
    return ApiResponse.success(res, {
      service: "PhonePe Payment Service",
      ...healthStatus,
      timestamp: new Date().toISOString()
    }, "PhonePe service health check");
    
  } catch (error) {
    logger.error('PhonePe health check failed', { error: error.message });
    throw error;
  }
};