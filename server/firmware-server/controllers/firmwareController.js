import Order from "../../models/orderModel.js";
import OrderItem from "../../models/orderItemModel.js";
import Machine from "../../models/machineModel.js";
import logger from "../../utils/logger.js";
import { BadRequestError, NotFoundError } from "../../utils/errors.js";
import DatabaseUtil from "../../utils/database.js";
import ApiResponse from "../../utils/response.js";
import { refundMachinePuris, calculatePurisNeeded } from "../../utils/quantityUtils.js";

// ----------------------------------------------------------------
// Get next order for machine
export const getNextOrder = async (req, res) => {
  try {
    const machine = req.machine;

    logger.info('Firmware polling for next order', {
      machineId: machine.mid,
      machineStatus: machine.mstatus
    });

    // Find next OTP_VERIFIED order for this machine
    // Only pick up orders that have been verified (payment confirmed + admin verified)
    // Orders are sorted by createdAt, so oldest order first (FIFO)
    const order = await Order.findOne({
      machineId: machine._id,
      orderStatus: "OTP_VERIFIED"
    })
      .sort({ createdAt: 1 }) // Oldest first
      .populate('uid', 'phone')
      .populate('machineId', 'mid name location');

    if (!order) {
      logger.debug('No pending orders for machine', {
        machineId: machine.mid
      });

      return ApiResponse.success(res, {
        hasOrder: false,
        order: null
      }, "No pending orders");
    }

    // Get order items
    const orderItems = await OrderItem.find({ orderId: order._id })
      .populate('itemId', 'name desc price puriPerPlate');

    const items = orderItems.map(oi => ({
      itemId: oi.itemId._id,
      name: oi.itemId.name,
      description: oi.itemId.desc,
      quantity: oi.qty,
      puriPerPlate: oi.itemId.puriPerPlate,
      price: oi.priceAtOrderTime,
      gst: oi.gstAtOrderTime
    }));

    logger.info('Order found for firmware', {
      machineId: machine.mid,
      orderId: order._id,
      orderOtp: order.orderOtp,
      itemCount: items.length
    });

    return ApiResponse.success(res, {
      hasOrder: true,
      order: {
        _id: order._id, // Changed from orderId to match Order model
        orderId: order._id, // Keep for backward compatibility
        orderCounter: order.orderCounter,
        orderOtp: order.orderOtp,
        orderStatus: order.orderStatus,
        ostatus: order.orderStatus, // Add ostatus for Order model
        amount: order.amount,
        items,
        userPhone: order.uid?.phone?.substring(0, 6) + 'xxxx',
        machineId: machine.mid,
        machineName: machine.name,
        location: machine.location,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        uid: order.uid?._id // Add uid for Order model
      }
    }, "Order available for preparation");

  } catch (error) {
    logger.error('Get next order failed', {
      error: error.message,
      machineId: req.machine?.mid
    });
    throw error;
  }
};

// ----------------------------------------------------------------
// Start order preparation
export const startOrderPreparation = async (req, res) => {
  try {
    const machine = req.machine;
    const { orderId } = req.params;

    logger.info('Firmware starting order preparation', {
      machineId: machine.mid,
      orderId
    });

    // Find and validate order
    const order = await Order.findById(orderId).populate('machineId');

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Validate order belongs to this machine
    if (order.machineId._id.toString() !== machine._id.toString()) {
      throw new BadRequestError('Order does not belong to this machine');
    }

    // Validate order status - must be verified before preparation
    if (order.orderStatus !== 'OTP_VERIFIED') {
      // If already PREPARING, return success (idempotency)
      if (order.orderStatus === 'PREPARING') {
        logger.info('Order already in PREPARING state (idempotent request)', {
          machineId: machine.mid,
          orderId
        });
        return ApiResponse.success(res, {
          orderId: order._id,
          status: order.orderStatus,
          message: 'Order is already being prepared'
        }, "Order already in preparation");
      }

      logger.warn('Firmware tried to start non-verified order', {
        machineId: machine.mid,
        orderId,
        currentStatus: order.orderStatus
      });
      throw new BadRequestError(`Order is not verified yet. Current status: ${order.orderStatus}`);
    }

    // Use transaction for order preparation
    await DatabaseUtil.transaction(async (session) => {
      // FIRST: Check if machine is available (prevent race conditions)
      // Use optimistic locking to ensure machine isn't processing another order
      const machineForCheck = await Machine.findOne({
        _id: machine._id
      }).session(session);

      // Check if machine is busy with a DIFFERENT order
      if (machineForCheck.currentOrderId &&
          machineForCheck.currentOrderId.toString() !== order._id.toString()) {
        throw new BadRequestError(
          'Machine is already processing another order. Please wait and try again.'
        );
      }

      // Get order items
      const orderItems = await OrderItem.find({ orderId: order._id }).session(session);
      const items = orderItems.map(item => ({
        id: item.itemId,
        quantity: item.qty
      }));

      // Calculate puris needed
      const { totalPuris } = await calculatePurisNeeded(items);

      logger.info('Preparing to deduct puris for order preparation', {
        orderId,
        machineId: machine.mid,
        totalPuris
      });

      // Deduct puris INSIDE transaction using session
      const machineForUpdate = await Machine.findById(machine._id).session(session);

      // Check if enough puris available
      if (machineForUpdate.puriQuantity < totalPuris) {
        throw new BadRequestError(`Insufficient puris. Required: ${totalPuris}, Available: ${machineForUpdate.puriQuantity}`);
      }

      // Deduct puris atomically within transaction
      machineForUpdate.puriQuantity -= totalPuris;
      await machineForUpdate.save({ session });

      const isLowStock = machineForUpdate.puriQuantity < machineForUpdate.lowQuantityThreshold;

      logger.info('Puris deducted from machine', {
        machineId: machine.mid,
        deducted: totalPuris,
        newQuantity: machineForUpdate.puriQuantity,
        isLowStock,
        orderId,
        source: 'firmware_api'
      });

      if (isLowStock) {
        logger.warn('Machine puri quantity is low', {
          machineId: machine.mid,
          currentQuantity: machineForUpdate.puriQuantity,
          threshold: machineForUpdate.lowQuantityThreshold,
          estimatedOrdersRemaining: Math.floor(machineForUpdate.puriQuantity / 6)
        });
      }

      // Update order status
      const orderForUpdate = await Order.findById(order._id).session(session);
      await orderForUpdate.updateStatus(
        "PREPARING",
        "firmware",
        "Order preparation started by firmware",
        {
          machineId: machine.mid,
          machineName: machine.name,
          location: machine.location,
          purisDeducted: totalPuris,
          newPuriQuantity: machineForUpdate.puriQuantity,
          isLowStock: isLowStock
        }
      );

      orderForUpdate.preparingStartedAt = new Date();
      await orderForUpdate.save({ session });

      // Update machine status (we already verified it's available at the start)
      // Update using the fresh machine data fetched within transaction
      await Machine.findByIdAndUpdate(
        machine._id,
        {
          mstatus: "PREPARING",
          currentOrderId: order._id,
          lastPingedAt: new Date(),
          $inc: { statusVersion: 1 } // Increment version for tracking
        },
        { session, new: true }
      );
    });

    logger.info('Order preparation started successfully', {
      machineId: machine.mid,
      orderId,
      newStatus: 'PREPARING'
    });

    return ApiResponse.success(res, {
      orderId: order._id,
      orderStatus: "PREPARING",
      preparingStartedAt: new Date()
    }, "Order preparation started");

  } catch (error) {
    logger.error('Start order preparation failed', {
      error: error.message,
      machineId: req.machine?.mid,
      orderId: req.params?.orderId
    });
    throw error;
  }
};

// ----------------------------------------------------------------
// Mark order ready for pickup
export const markOrderReady = async (req, res) => {
  try {
    const machine = req.machine;
    const { orderId } = req.params;

    logger.info('Firmware marking order ready', {
      machineId: machine.mid,
      orderId
    });

    // Find and validate order
    const order = await Order.findById(orderId).populate('machineId');

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Validate order belongs to this machine
    if (order.machineId._id.toString() !== machine._id.toString()) {
      throw new BadRequestError('Order does not belong to this machine');
    }

    // Validate order status
    if (order.orderStatus !== 'PREPARING') {
      // If already READY_FOR_PICKUP or COMPLETED, return success (idempotency)
      if (order.orderStatus === 'READY_FOR_PICKUP' || order.orderStatus === 'COMPLETED') {
        logger.info('Order already ready/completed (idempotent request)', {
          machineId: machine.mid,
          orderId,
          currentStatus: order.orderStatus,
          readyAt: order.readyForPickupAt
        });
        return ApiResponse.success(res, {
          orderId: order._id,
          orderStatus: order.orderStatus,
          readyForPickupAt: order.readyForPickupAt
        }, `Order already in ${order.orderStatus} status`);
      }

      logger.warn('Firmware tried to mark ready non-PREPARING order', {
        machineId: machine.mid,
        orderId,
        currentStatus: order.orderStatus
      });
      throw new BadRequestError(`Order is not in PREPARING status. Current status: ${order.orderStatus}`);
    }

    // Update order status
    await order.updateStatus(
      "READY_FOR_PICKUP",
      "firmware",
      "Food is ready for pickup",
      {
        machineId: machine.mid,
        machineName: machine.name,
        location: machine.location
      }
    );

    order.readyForPickupAt = new Date();
    await order.save();

    // Update machine status
    await Machine.findByIdAndUpdate(machine._id, {
      mstatus: "READY_FOR_PICKUP",
      lastPingedAt: new Date()
    });

    logger.info('Order marked ready successfully', {
      machineId: machine.mid,
      orderId,
      newStatus: 'READY_FOR_PICKUP'
    });

    return ApiResponse.success(res, {
      orderId: order._id,
      orderStatus: "READY_FOR_PICKUP",
      readyForPickupAt: order.readyForPickupAt
    }, "Order ready for pickup");

  } catch (error) {
    logger.error('Mark order ready failed', {
      error: error.message,
      machineId: req.machine?.mid,
      orderId: req.params?.orderId
    });
    throw error;
  }
};

// ----------------------------------------------------------------
// Complete order (plate dispensed)
export const completeOrder = async (req, res) => {
  try {
    const machine = req.machine;
    const { orderId } = req.params;

    logger.info('Firmware completing order', {
      machineId: machine.mid,
      orderId
    });

    // Find and validate order
    const order = await Order.findById(orderId).populate('machineId');

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Validate order belongs to this machine
    if (order.machineId._id.toString() !== machine._id.toString()) {
      throw new BadRequestError('Order does not belong to this machine');
    }

    // Validate order status
    if (order.orderStatus !== 'READY_FOR_PICKUP') {
      // If already COMPLETED, return success (idempotency)
      if (order.orderStatus === 'COMPLETED') {
        logger.info('Order already completed (idempotent request)', {
          machineId: machine.mid,
          orderId,
          completedAt: order.actualCompletionTime
        });
        return ApiResponse.success(res, {
          orderId: order._id,
          orderStatus: "COMPLETED",
          orderCompleted: true,
          actualCompletionTime: order.actualCompletionTime
        }, "Order already completed");
      }

      logger.warn('Firmware tried to complete non-READY order', {
        machineId: machine.mid,
        orderId,
        currentStatus: order.orderStatus
      });
      throw new BadRequestError(`Order is not in READY_FOR_PICKUP status. Current status: ${order.orderStatus}`);
    }

    // Update order status
    await order.updateStatus(
      "COMPLETED",
      "firmware",
      "Plate dispensed and order completed",
      {
        machineId: machine.mid,
        machineName: machine.name,
        location: machine.location
      }
    );

    order.orderCompleted = true;
    order.actualCompletionTime = new Date();
    await order.save();

    // Update machine status back to CONNECTED (idle) and clear current order
    await Machine.findByIdAndUpdate(machine._id, {
      mstatus: "CONNECTED",
      currentOrderId: null, // Clear current order assignment
      lastPingedAt: new Date(),
      $inc: { statusVersion: 1 } // Increment version for consistency
    });

    logger.info('Order completed successfully', {
      machineId: machine.mid,
      orderId,
      newStatus: 'COMPLETED'
    });

    return ApiResponse.success(res, {
      orderId: order._id,
      orderStatus: "COMPLETED",
      orderCompleted: true,
      actualCompletionTime: order.actualCompletionTime
    }, "Order completed successfully");

  } catch (error) {
    logger.error('Complete order failed', {
      error: error.message,
      machineId: req.machine?.mid,
      orderId: req.params?.orderId
    });
    throw error;
  }
};

// ----------------------------------------------------------------
// Cancel order
export const cancelOrder = async (req, res) => {
  try {
    const machine = req.machine;
    const { orderId } = req.params;
    const { reason } = req.body;

    logger.info('Firmware cancelling order', {
      machineId: machine.mid,
      orderId,
      reason
    });

    // Find and validate order
    const order = await Order.findById(orderId).populate('machineId');

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Validate order belongs to this machine
    if (order.machineId._id.toString() !== machine._id.toString()) {
      throw new BadRequestError('Order does not belong to this machine');
    }

    // Can only cancel if not already completed
    if (order.orderStatus === 'COMPLETED') {
      throw new BadRequestError('Cannot cancel completed order');
    }

    if (order.orderStatus === 'CANCELLED') {
      throw new BadRequestError('Order is already cancelled');
    }

    // Use transaction for cancellation
    await DatabaseUtil.transaction(async (session) => {
      // If order was in PREPARING, refund puris
      if (order.orderStatus === 'PREPARING' || order.orderStatus === 'READY_FOR_PICKUP') {
        const orderItems = await OrderItem.find({ orderId: order._id }).session(session);
        const items = orderItems.map(item => ({
          id: item.itemId,
          quantity: item.qty
        }));

        const { totalPuris } = await calculatePurisNeeded(items);

        logger.info('Refunding puris due to order cancellation', {
          orderId,
          machineId: machine.mid,
          totalPuris
        });

        // Refund puris INSIDE transaction to prevent duplicate refunds
        const machineForUpdate = await Machine.findById(machine._id).session(session);
        machineForUpdate.puriQuantity += totalPuris;
        await machineForUpdate.save({ session });

        logger.info('Puris refunded to machine', {
          machineId: machine.mid,
          refunded: totalPuris,
          newQuantity: machineForUpdate.puriQuantity,
          orderId,
          source: 'firmware_api',
          reason: 'order_cancelled'
        });
      }

      // Update order status
      const orderForUpdate = await Order.findById(order._id).session(session);
      await orderForUpdate.updateStatus(
        "CANCELLED",
        "firmware",
        reason || "Order cancelled by firmware",
        {
          machineId: machine.mid,
          machineName: machine.name,
          location: machine.location,
          previousStatus: order.orderStatus
        }
      );
      await orderForUpdate.save({ session });

      // Update machine status back to CONNECTED and clear current order
      await Machine.findByIdAndUpdate(
        machine._id,
        {
          mstatus: "CONNECTED",
          currentOrderId: null, // Clear current order assignment
          lastPingedAt: new Date(),
          $inc: { statusVersion: 1 } // Increment version for consistency
        },
        { session }
      );
    });

    logger.info('Order cancelled successfully', {
      machineId: machine.mid,
      orderId,
      reason
    });

    return ApiResponse.success(res, {
      orderId: order._id,
      orderStatus: "CANCELLED",
      reason: reason || "Order cancelled by firmware"
    }, "Order cancelled successfully");

  } catch (error) {
    logger.error('Cancel order failed', {
      error: error.message,
      machineId: req.machine?.mid,
      orderId: req.params?.orderId
    });
    throw error;
  }
};

// ----------------------------------------------------------------
// Get machine status and current active order
export const getMachineStatus = async (req, res) => {
  try {
    const machine = req.machine;

    logger.debug('Firmware getting machine status', {
      machineId: machine.mid
    });

    // Find current active order (only truly active orders)
    // Security: Don't expose completed/cancelled orders to prevent data leakage
    // APK should use getOrderStatusById endpoint if it needs to check specific order
    const currentOrder = await Order.findOne({
      machineId: machine._id,
      orderStatus: { $in: ["OTP_VERIFIED", "PREPARING", "READY_FOR_PICKUP"] }
    })
      .populate('uid', 'phone')
      .sort({ createdAt: -1 }); // Most recent first

    let orderDetails = null;
    if (currentOrder) {
      const orderItems = await OrderItem.find({ orderId: currentOrder._id })
        .populate('itemId', 'name desc puriPerPlate');

      orderDetails = {
        _id: currentOrder._id, // Match Order model
        orderId: currentOrder._id, // Keep for backward compatibility
        orderCounter: currentOrder.orderCounter,
        orderOtp: currentOrder.orderOtp,
        orderStatus: currentOrder.orderStatus,
        ostatus: currentOrder.orderStatus, // Add ostatus for Order model
        amount: currentOrder.amount,
        items: orderItems.map(oi => ({
          name: oi.itemId.name,
          description: oi.itemId.desc,
          quantity: oi.qty,
          puriPerPlate: oi.itemId.puriPerPlate
        })),
        userPhone: currentOrder.uid?.phone?.substring(0, 6) + 'xxxx',
        uid: currentOrder.uid?._id, // Add uid for Order model
        preparingStartedAt: currentOrder.preparingStartedAt,
        readyForPickupAt: currentOrder.readyForPickupAt
      };
    }

    return ApiResponse.success(res, {
      machineId: machine.mid,
      machineName: machine.name,
      location: machine.location,
      status: machine.mstatus,
      puriQuantity: machine.puriQuantity || 0,
      lowQuantityThreshold: machine.lowQuantityThreshold || 30,
      isLowStock: (machine.puriQuantity || 0) < (machine.lowQuantityThreshold || 30),
      lastHeartbeatAt: machine.lastHeartbeatAt,
      currentOrder: orderDetails,
      hasPendingOrders: false // Will be updated below
    }, "Machine status retrieved");

  } catch (error) {
    logger.error('Get machine status failed', {
      error: error.message,
      machineId: req.machine?.mid
    });
    throw error;
  }
};

// ----------------------------------------------------------------
// Send heartbeat
export const sendHeartbeat = async (req, res) => {
  try {
    const machine = req.machine;
    const { status, firmwareVersion } = req.body;

    logger.debug('Firmware heartbeat received', {
      machineId: machine.mid,
      status,
      firmwareVersion
    });

    // Update machine heartbeat
    const updates = {
      lastHeartbeatAt: new Date(),
      lastPingedAt: new Date()
    };

    if (firmwareVersion) {
      updates.firmwareVersion = firmwareVersion;
    }

    // If status provided and machine is not preparing/ready, update it
    if (status && !['PREPARING', 'READY_FOR_PICKUP'].includes(machine.mstatus)) {
      updates.mstatus = status;
    }

    await Machine.findByIdAndUpdate(machine._id, updates);

    // Check if there are pending orders
    const hasPendingOrders = await Order.exists({
      machineId: machine._id,
      orderStatus: "PAID"
    });

    return ApiResponse.success(res, {
      received: true,
      machineId: machine.mid,
      timestamp: new Date(),
      hasNewOrder: !!hasPendingOrders
    }, "Heartbeat received");

  } catch (error) {
    logger.error('Heartbeat failed', {
      error: error.message,
      machineId: req.machine?.mid
    });
    throw error;
  }
};

// ----------------------------------------------------------------
// Log firmware error
export const logFirmwareError = async (req, res) => {
  try {
    const machine = req.machine;
    const { errorCode, errorMessage, orderId, severity } = req.body;

    logger.error('Firmware error reported', {
      machineId: machine.mid,
      errorCode,
      errorMessage,
      orderId,
      severity: severity || 'ERROR'
    });

    // Could store in database if needed
    // For now, just log it

    return ApiResponse.success(res, {
      received: true,
      machineId: machine.mid,
      errorLogged: true
    }, "Error logged successfully");

  } catch (error) {
    logger.error('Log firmware error failed', {
      error: error.message,
      machineId: req.machine?.mid
    });
    throw error;
  }
};

// ----------------------------------------------------------------
// Get specific order status by ID
// Used when APK has stored order ID but getMachineStatus returns null
export const getOrderStatusById = async (req, res) => {
  try {
    const machine = req.machine;
    const { orderId } = req.params;

    logger.debug('Firmware getting order status by ID', {
      machineId: machine.mid,
      orderId
    });

    // Find order and validate it belongs to this machine
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Security: Validate order belongs to authenticated machine
    if (order.machineId.toString() !== machine._id.toString()) {
      throw new BadRequestError('Order does not belong to this machine');
    }

    logger.info('Order status retrieved', {
      machineId: machine.mid,
      orderId,
      orderStatus: order.orderStatus
    });

    return ApiResponse.success(res, {
      orderId: order._id,
      orderStatus: order.orderStatus,
      orderCompleted: order.orderCompleted || false,
      actualCompletionTime: order.actualCompletionTime,
      updatedAt: order.updatedAt
    }, "Order status retrieved");

  } catch (error) {
    logger.error('Get order status by ID failed', {
      error: error.message,
      machineId: req.machine?.mid,
      orderId: req.params?.orderId
    });
    throw error;
  }
};
