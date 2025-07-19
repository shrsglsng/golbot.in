import crypto from "crypto";
import Payment from "../models/paymentModel.js";
import Order from "../models/orderModel.js";
import { razorpay } from "../utils/razorpayClient.js";
import logger from "../utils/logger.js";
import { BadRequestError, ExternalServiceError } from "../utils/errors.js";
import { Validator } from "../utils/validation.js";
import DatabaseUtil from "../utils/database.js";
import ApiResponse from "../utils/response.js";

// ----------------------------------------------------------------
// Test response
export const helloResponse = (req, res) => {
  logger.info('Payment service health check');
  return ApiResponse.success(res, {
    service: "Payment Service",
    status: "healthy",
    timestamp: new Date().toISOString()
  }, "Payment service is running");
};

// ----------------------------------------------------------------
// Create Razorpay order (used by frontend for checkout)
export const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const { uid } = req.user;
    
    logger.info('Razorpay order creation request', { 
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
      logger.warn('Razorpay order creation for non-pending order', { 
        orderId, 
        status: order.orderStatus,
        userId: uid 
      });
      throw new BadRequestError("Order is not in pending state");
    }

    // Check if payment already exists
    const existingPayment = await DatabaseUtil.findOne(Payment, { orderId });
    if (existingPayment && existingPayment.verified) {
      logger.warn('Razorpay order creation for already paid order', { 
        orderId, 
        paymentId: existingPayment._id,
        userId: uid 
      });
      throw new BadRequestError("Order is already paid");
    }

    const amountInPaise = Math.round(order.amount.total * 100);
    const receipt = `rcpt_${Date.now()}_${orderId.toString().slice(-8)}`;

    logger.debug('Creating Razorpay order', { 
      orderId, 
      amount: order.amount.total,
      amountInPaise,
      receipt 
    });

    try {
      const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt,
        notes: {
          orderId: orderId.toString(),
          userId: uid.toString()
        }
      });

      logger.info('Razorpay order created successfully', { 
        razorpayOrderId: razorpayOrder.id,
        orderId,
        amount: razorpayOrder.amount / 100,
        userId: uid 
      });

      // Save or update payment record
      const paymentData = {
        orderId,
        razorpayorderId: razorpayOrder.id,
        amount: razorpayOrder.amount / 100,
        currency: razorpayOrder.currency,
        verified: false,
        status: "PENDING",
        source: "server",
        receipt: razorpayOrder.receipt,
        createdAt: new Date()
      };

      if (existingPayment) {
        await DatabaseUtil.updateById(Payment, existingPayment._id, paymentData);
      } else {
        await DatabaseUtil.create(Payment, paymentData);
      }

      return ApiResponse.created(res, {
        razorpayOrder: {
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          receipt: razorpayOrder.receipt
        },
        checkoutUrl: `https://checkout.razorpay.com/v1/checkout.js?order_id=${razorpayOrder.id}`
      }, "Razorpay order created successfully");

    } catch (razorpayError) {
      logger.error('Razorpay order creation failed', { 
        error: razorpayError.message,
        orderId,
        userId: uid,
        amount: amountInPaise 
      });
      throw new ExternalServiceError("Payment initiation failed. Please try again.", "Razorpay");
    }

  } catch (error) {
    logger.error('Create Razorpay order failed', { 
      error: error.message,
      orderId: req.body?.orderId,
      userId: req.user?.uid 
    });
    throw error;
  }
};

// ----------------------------------------------------------------
// Verify Razorpay payment (frontend POST /verify)
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const { uid } = req.user;

    logger.info('Razorpay payment verification request', { 
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      userId: uid 
    });

    // Validate input
    Validator.validateRequired(['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature'], 
      { razorpay_order_id, razorpay_payment_id, razorpay_signature });

    // Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
      logger.warn('Invalid Razorpay signature', { 
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        userId: uid,
        expectedSignature: expectedSignature.substring(0, 10) + '...',
        providedSignature: razorpay_signature.substring(0, 10) + '...'
      });
      throw new BadRequestError("Invalid payment signature");
    }

    logger.debug('Razorpay signature verified successfully');

    try {
      // Fetch payment details from Razorpay
      const [razorOrder, razorPayment] = await Promise.all([
        razorpay.orders.fetch(razorpay_order_id),
        razorpay.payments.fetch(razorpay_payment_id)
      ]);

      logger.debug('Razorpay payment details fetched', { 
        orderStatus: razorOrder.status,
        paymentStatus: razorPayment.status,
        amount: razorOrder.amount / 100 
      });

      // Verify payment status
      if (razorPayment.status !== 'captured' && razorPayment.status !== 'authorized') {
        logger.warn('Payment not successful', { 
          paymentStatus: razorPayment.status,
          razorpayPaymentId: razorpay_payment_id 
        });
        throw new BadRequestError("Payment was not successful");
      }

      // Check for duplicate payment record
      const existingPayment = await DatabaseUtil.findOne(Payment, { 
        razorpaypaymentId: razorpay_payment_id 
      });
      
      if (existingPayment && existingPayment.verified) {
        logger.info('Payment already recorded', { 
          paymentId: existingPayment._id,
          razorpayPaymentId: razorpay_payment_id 
        });
        return ApiResponse.success(res, {
          payment: {
            id: existingPayment._id,
            status: existingPayment.status,
            verified: existingPayment.verified
          }
        }, "Payment already recorded");
      }

      // Find the original payment record
      const paymentRecord = await DatabaseUtil.findOne(Payment, { 
        razorpayorderId: razorpay_order_id 
      }, { throwIfNotFound: true });

      // Verify order belongs to user
      const order = await DatabaseUtil.findOne(Order, { 
        _id: paymentRecord.orderId,
        uid: uid 
      }, { throwIfNotFound: true });

      // Use transaction for payment verification
      await DatabaseUtil.transaction(async (session) => {
        // Create verified payment record
        await DatabaseUtil.create(Payment, {
          orderId: paymentRecord.orderId,
          razorpayorderId: razorpay_order_id,
          razorpaypaymentId: razorpay_payment_id,
          amount: razorOrder.amount / 100,
          currency: razorOrder.currency,
          verified: true,
          status: "SUCCESS",
          source: "razorpay_webhook",
          verifiedAt: new Date(),
          paymentMethod: razorPayment.method,
          paymentDetails: {
            bank: razorPayment.bank,
            wallet: razorPayment.wallet,
            vpa: razorPayment.vpa
          }
        }, { session });

        // Update order status
        await DatabaseUtil.updateById(Order, order._id, {
          orderStatus: "PAID",
          paidAt: new Date(),
          orderOtp: Math.floor(1000 + Math.random() * 9000).toString() // Generate 4-digit OTP
        }, { session });
      });

      logger.info('Payment verified and order updated successfully', { 
        orderId: order._id,
        razorpayPaymentId: razorpay_payment_id,
        amount: razorOrder.amount / 100,
        userId: uid 
      });

      return ApiResponse.success(res, {
        payment: {
          orderId: order._id,
          amount: razorOrder.amount / 100,
          status: "SUCCESS",
          verified: true,
          paymentId: razorpay_payment_id
        },
        order: {
          id: order._id,
          status: "PAID",
          orderOtp: order.orderOtp
        }
      }, "Payment verified successfully");

    } catch (razorpayError) {
      logger.error('Razorpay API error during verification', { 
        error: razorpayError.message,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id 
      });
      throw new ExternalServiceError("Failed to verify payment with Razorpay", "Razorpay");
    }

  } catch (error) {
    logger.error('Payment verification failed', { 
      error: error.message,
      razorpayOrderId: req.body?.razorpay_order_id,
      userId: req.user?.uid 
    });
    throw error;
  }
};

// ----------------------------------------------------------------
// Get payment status by order ID (used by frontend to confirm)
export const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { uid } = req.user;

    logger.info('Payment status check', { orderId, userId: uid });

    // Validate input
    Validator.validateRequired(['orderId'], { orderId });
    Validator.validateObjectId(orderId, 'Order ID');

    // Find payment for this order
    const payment = await DatabaseUtil.findOne(Payment, { 
      orderId 
    }, { throwIfNotFound: true });

    // Verify order belongs to user - just check existence
    await DatabaseUtil.findOne(Order, { 
      _id: orderId,
      uid: uid 
    }, { throwIfNotFound: true });

    logger.debug('Payment status retrieved', { 
      orderId,
      paymentStatus: payment.status,
      verified: payment.verified 
    });

    return ApiResponse.success(res, {
      payment: {
        id: payment._id,
        status: payment.status,
        verified: payment.verified,
        amount: payment.amount,
        createdAt: payment.createdAt,
        verifiedAt: payment.verifiedAt
      }
    }, "Payment status retrieved successfully");

  } catch (error) {
    logger.error('Get payment status failed', { 
      error: error.message,
      orderId: req.params?.orderId,
      userId: req.user?.uid 
    });
    throw error;
  }
};

// ----------------------------------------------------------------
// Admin: Get all verified payments
export const getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, verified } = req.query;

    logger.info('Admin fetching all payments', { 
      page, 
      limit, 
      status, 
      verified 
    });

    // Build filter query
    const filter = {};
    if (status) filter.status = status;
    if (verified !== undefined) filter.verified = verified === 'true';

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: {
        path: 'orderId',
        select: 'uid orderStatus amount createdAt',
        populate: {
          path: 'uid',
          select: 'phone'
        }
      }
    };

    const payments = await DatabaseUtil.paginate(Payment, filter, options);

    logger.debug('Payments retrieved for admin', { 
      totalPayments: payments.totalDocs,
      currentPage: payments.page 
    });

    return ApiResponse.success(res, {
      payments: payments.docs,
      pagination: {
        page: payments.page,
        totalPages: payments.totalPages,
        totalDocs: payments.totalDocs,
        limit: payments.limit,
        hasNextPage: payments.hasNextPage,
        hasPrevPage: payments.hasPrevPage
      }
    }, "Payments retrieved successfully");

  } catch (error) {
    logger.error('Get all payments failed', { 
      error: error.message 
    });
    throw error;
  }
};
