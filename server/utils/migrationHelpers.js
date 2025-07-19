import Order from "../models/orderModel.js";
import Payment from "../models/paymentModel.js";
import logger from "./logger.js";

/**
 * Migration helper to add status history to existing orders
 * This should be run once when deploying the new status tracking feature
 */
export const migrateOrderStatusHistory = async () => {
  try {
    logger.info('Starting order status history migration');
    
    const orders = await Order.find({
      $or: [
        { statusHistory: { $exists: false } },
        { statusHistory: { $size: 0 } }
      ]
    });

    let migrationCount = 0;

    for (const order of orders) {
      const statusHistory = [{
        status: order.orderStatus,
        changedAt: order.updatedAt || order.createdAt,
        changedBy: 'system',
        reason: 'Migrated from legacy order format'
      }];

      await Order.updateOne(
        { _id: order._id },
        { $set: { statusHistory } }
      );

      migrationCount++;
    }

    logger.info('Order status history migration completed', { 
      migrationCount,
      totalOrders: orders.length 
    });

    return { migrationCount, totalOrders: orders.length };

  } catch (error) {
    logger.error('Order status history migration failed', { error: error.message });
    throw error;
  }
};

/**
 * Migration helper to add status history to existing payments
 * This should be run once when deploying the new status tracking feature
 */
export const migratePaymentStatusHistory = async () => {
  try {
    logger.info('Starting payment status history migration');
    
    const payments = await Payment.find({
      $or: [
        { statusHistory: { $exists: false } },
        { statusHistory: { $size: 0 } }
      ]
    });

    let migrationCount = 0;

    for (const payment of payments) {
      const statusHistory = [{
        status: payment.status,
        changedAt: payment.verifiedAt || payment.updatedAt || payment.createdAt,
        changedBy: payment.source || 'system',
        reason: 'Migrated from legacy payment format',
        razorpayData: {
          paymentId: payment.razorpaypaymentId,
          orderId: payment.razorpayorderId,
          method: payment.paymentMethod
        }
      }];

      await Payment.updateOne(
        { _id: payment._id },
        { $set: { statusHistory } }
      );

      migrationCount++;
    }

    logger.info('Payment status history migration completed', { 
      migrationCount,
      totalPayments: payments.length 
    });

    return { migrationCount, totalPayments: payments.length };

  } catch (error) {
    logger.error('Payment status history migration failed', { error: error.message });
    throw error;
  }
};

/**
 * Helper function to manually update order status with proper history tracking
 * Can be used by admin functions or system processes
 */
export const updateOrderStatusWithHistory = async (orderId, newStatus, changedBy = 'system', reason = '', metadata = {}) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    await order.updateStatus(newStatus, changedBy, reason, metadata);
    
    logger.info('Order status updated with history', {
      orderId,
      newStatus,
      changedBy,
      reason
    });

    return order;

  } catch (error) {
    logger.error('Failed to update order status', {
      orderId,
      newStatus,
      error: error.message
    });
    throw error;
  }
};

/**
 * Helper function to manually update payment status with proper history tracking
 * Can be used by admin functions or webhook handlers
 */
export const updatePaymentStatusWithHistory = async (paymentId, newStatus, changedBy = 'system', reason = '', metadata = {}, razorpayData = {}) => {
  try {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    await payment.updateStatus(newStatus, changedBy, reason, metadata, razorpayData);
    
    logger.info('Payment status updated with history', {
      paymentId,
      newStatus,
      changedBy,
      reason
    });

    return payment;

  } catch (error) {
    logger.error('Failed to update payment status', {
      paymentId,
      newStatus,
      error: error.message
    });
    throw error;
  }
};

/**
 * Get order status timeline for admin dashboard or user interface
 */
export const getOrderTimeline = async (orderId) => {
  try {
    const order = await Order.findById(orderId)
      .populate('uid', 'phone email')
      .populate('machineId', 'mid name location');

    if (!order) {
      throw new Error('Order not found');
    }

    const timeline = order.getStatusHistory().map(entry => ({
      status: entry.status,
      timestamp: entry.changedAt,
      actor: entry.changedBy,
      reason: entry.reason,
      metadata: entry.metadata
    }));

    return {
      orderId: order._id,
      currentStatus: order.orderStatus,
      customer: order.uid,
      machine: order.machineId,
      amount: order.amount,
      timeline
    };

  } catch (error) {
    logger.error('Failed to get order timeline', {
      orderId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Get payment history for admin dashboard or debugging
 */
export const getPaymentHistory = async (paymentId) => {
  try {
    const payment = await Payment.findById(paymentId)
      .populate('orderId', 'uid amount orderStatus');

    if (!payment) {
      throw new Error('Payment not found');
    }

    const history = payment.getPaymentHistory().map(entry => ({
      status: entry.status,
      timestamp: entry.changedAt,
      actor: entry.changedBy,
      reason: entry.reason,
      metadata: entry.metadata,
      razorpayData: entry.razorpayData
    }));

    return {
      paymentId: payment._id,
      orderId: payment.orderId,
      currentStatus: payment.status,
      verified: payment.verified,
      amount: payment.amount,
      history
    };

  } catch (error) {
    logger.error('Failed to get payment history', {
      paymentId,
      error: error.message
    });
    throw error;
  }
};
