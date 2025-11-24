import Machine from "../models/machineModel.js";
import Order from "../models/orderModel.js";
import logger from "../utils/logger.js";
import { BadRequestError, NotFoundError, UnauthenticatedError, ValidationError } from "../utils/errors.js";
import { Validator } from "../utils/validation.js";
import DatabaseUtil from "../utils/database.js";
import ApiResponse from "../utils/response.js";

// ----------------------------------------------------------------------------
// Machine Login
export const machineLogin = async (req, res) => {
  try {
    let { mid, password } = req.body;

    logger.info('Machine login attempt', {
      mid: mid?.substring(0, 8) + '...',
      ip: req.ip
    });

    // Validate input
    Validator.validateRequired(['mid', 'password'], { mid, password });
    mid = Validator.validateMachineId(mid); // Normalize to uppercase
    Validator.validateString(password, 'Password', { minLength: 6 });

    // Find and authenticate machine
    const machine = await DatabaseUtil.findOne(Machine, { mid }, { throwIfNotFound: true });
    
    // Debug logging for password comparison
    logger.info('Password comparison debug', {
      mid,
      providedPassword: password,
      storedPasswordHash: machine.password?.substring(0, 10) + '...',
      passwordLength: password?.length,
      hashLength: machine.password?.length
    });
    
    const isPasswordValid = await machine.comparePassword(password);
    
    logger.info('Password comparison result', {
      mid,
      isValid: isPasswordValid
    });
    
    if (!isPasswordValid) {
      logger.warn('Machine authentication failed - invalid password', { 
        mid,
        ip: req.ip 
      });
      throw new UnauthenticatedError("Invalid credentials");
    }

    // Check if machine is active
    if (!machine.isActive) {
      logger.warn('Login attempt on inactive machine', { 
        mid,
        ip: req.ip 
      });
      throw new UnauthenticatedError("Machine is currently disabled");
    }

    // Update last login
    await DatabaseUtil.updateById(Machine, machine._id, {
      lastLoginAt: new Date(),
      lastLoginIp: req.ip
    });

    const token = machine.createJwt();

    logger.info('Machine login successful', { 
      mid,
      machineId: machine._id,
      location: machine.location 
    });

    return ApiResponse.success(res, {
      machine: {
        mid: machine.mid,
        mstatus: machine.mstatus,
        location: machine.location,
        ipAddress: machine.ipAddress,
        name: machine.name
      },
      token
    }, "Machine login successful");

  } catch (error) {
    logger.error('Machine login failed', { 
      error: error.message,
      mid: req.body?.mid,
      ip: req.ip 
    });
    throw error;
  }
};

// ----------------------------------------------------------------------------
// Get Machine by MID
export const getMachine = async (req, res) => {
  try {
    let { mid } = req.params;

    logger.debug('Machine info request', { mid });

    mid = Validator.validateMachineId(mid); // Normalize to uppercase

    const machine = await DatabaseUtil.findOne(Machine, { mid }, { throwIfNotFound: true });

    logger.debug('Machine info retrieved', { 
      mid,
      machineId: machine._id,
      status: machine.mstatus 
    });

    return ApiResponse.success(res, {
      mid: machine.mid,
      mstatus: machine.mstatus,
      location: machine.location,
      ipAddress: machine.ipAddress,
      name: machine.name,
      isActive: machine.isActive
    }, "Machine information retrieved");

  } catch (error) {
    logger.error('Get machine failed', { 
      error: error.message,
      mid: req.params?.mid 
    });
    throw error;
  }
};

// ----------------------------------------------------------------------------
// Update IP Address (admin or machine itself)
export const updateIpAddress = async (req, res) => {
  try {
    const { mid } = req.params;
    const { ipAddress } = req.body;

    logger.info('Machine IP update request', { 
      mid,
      newIp: ipAddress,
      requestIp: req.ip 
    });

    // Validate input
    Validator.validateMachineId(mid);
    Validator.validateRequired(['ipAddress'], { ipAddress });
    
    // Basic IP validation
    // Simplified IP validation - basic format check
    const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (!ipRegex.test(ipAddress)) {
      throw new ValidationError("Invalid IP address format");
    }

    const updated = await DatabaseUtil.updateOne(
      Machine,
      { mid },
      { 
        ipAddress,
        lastIpUpdate: new Date(),
        updatedBy: req.user?.uid || 'machine'
      }
    );

    if (updated.matchedCount === 0) {
      throw new NotFoundError("Machine not found");
    }

    logger.info('Machine IP updated successfully', { 
      mid,
      newIp: ipAddress 
    });

    return ApiResponse.success(res, {
      ipAddress
    }, "IP address updated successfully");

  } catch (error) {
    logger.error('Update machine IP failed', { 
      error: error.message,
      mid: req.params?.mid,
      ipAddress: req.body?.ipAddress 
    });
    throw error;
  }
};

// ----------------------------------------------------------------------------
// Get IP Address
export const getIpAddress = async (req, res) => {
  try {
    const { mid } = req.params;

    logger.debug('Machine IP request', { mid });

    Validator.validateMachineId(mid);

    const machine = await DatabaseUtil.findOne(Machine, { mid }, { 
      select: 'ipAddress lastIpUpdate',
      throwIfNotFound: true 
    });

    logger.debug('Machine IP retrieved', { 
      mid,
      ipAddress: machine.ipAddress 
    });

    return ApiResponse.success(res, {
      ipAddress: machine.ipAddress,
      lastUpdated: machine.lastIpUpdate
    }, "IP address retrieved");

  } catch (error) {
    logger.error('Get machine IP failed', { 
      error: error.message,
      mid: req.params?.mid 
    });
    throw error;
  }
};

// ----------------------------------------------------------------------------
// Start machine after scanning OTP (machineAuth protected)
export const startMachine = async (req, res) => {
  try {
    let { orderOtp, mid } = req.body;

    logger.info('Machine start request', {
      mid,
      hasOtp: !!orderOtp,
      machineIp: req.ip
    });

    // Validate input
    Validator.validateRequired(['orderOtp', 'mid'], { orderOtp, mid });
    mid = Validator.validateMachineId(mid); // Normalize to uppercase
    Validator.validateOTP(orderOtp);

    // Verify machine exists and is active
    const machine = await DatabaseUtil.findOne(Machine, { mid }, { throwIfNotFound: true });
    
    if (!machine.isActive) {
      logger.warn('Start attempt on inactive machine', { mid });
      throw new BadRequestError("Machine is currently disabled");
    }

    // Find PAID order with matching OTP
    // Flow: Payment → PAID → User enters OTP → Verify → OTP_VERIFIED → PREPARING
    const order = await DatabaseUtil.findOne(Order, {
      orderOtp,
      machineId: machine._id,
      orderStatus: "PAID", // Accept PAID orders for OTP verification
      orderCompleted: false
    }, {
      sort: { createdAt: -1 },
      populate: [
        { path: 'uid', select: 'phone' },
        { path: 'machineId', select: 'mid name' }
      ]
    });

    if (!order) {
      logger.warn('Invalid OTP or order not found', {
        orderOtp,
        mid,
        machineId: machine._id
      });
      throw new BadRequestError("Invalid OTP or order not ready. Please check payment status.");
    }

    if (!order.uid) {
      logger.error('Order missing user reference', { 
        orderId: order._id,
        orderOtp 
      });
      throw new BadRequestError("Invalid order data");
    }

    // Use transaction to update order status
    await DatabaseUtil.transaction(async (session) => {
      const orderToUpdate = await Order.findById(order._id).session(session);

      // ONLY verify OTP and update to OTP_VERIFIED
      // Firmware will pick it up and start preparation
      await orderToUpdate.updateStatus(
        "OTP_VERIFIED",
        "machine",
        "OTP verified by user at machine - ready for preparation",
        {
          machineId: machine.mid,
          machineName: machine.name,
          location: machine.location,
          verifiedAt: new Date()
        }
      );

      // Keep OTP for now (firmware might need to verify)
      // Set estimated completion time
      orderToUpdate.estimatedCompletionTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes estimate
      await orderToUpdate.save({ session });

      // Update machine status to OTP_VERIFIED (waiting for firmware to start)
      await DatabaseUtil.updateById(Machine, machine._id, {
        mstatus: "OTP_VERIFIED",
        currentOrderId: order._id,
        lastOrderAt: new Date()
      }, { session });
    });

    logger.info('Machine started successfully', { 
      orderId: order._id,
      mid,
      userId: order.uid._id,
      userPhone: order.uid.phone?.substring(0, 6) + 'xxxx'
    });

    // Fetch updated order to get current status
    const updatedOrder = await Order.findById(order._id);

    // Use specific response format expected by Flutter app
    return res.status(200).json({
      result: {
        order: {
          _id: updatedOrder._id,
          orderId: updatedOrder._id,
          status: updatedOrder.orderStatus,
          ostatus: updatedOrder.orderStatus,
          userPhone: order.uid.phone?.substring(0, 6) + 'xxxx',
          items: updatedOrder.items || [],
          orderCounter: updatedOrder.orderCounter
        },
        machine: {
          mid: machine.mid,
          status: updatedOrder.orderStatus
        }
      },
      message: "OTP verified successfully - waiting for machine to start"
    });

  } catch (error) {
    logger.error('Start machine failed', { 
      error: error.message,
      mid: req.body?.mid,
      hasOtp: !!req.body?.orderOtp 
    });
    throw error;
  }
};

// ----------------------------------------------------------------------------
// Mark order as ready for pickup after food preparation is complete
export const markOrderReadyForPickup = async (req, res) => {
  try {
    let { mid } = req.body;

    logger.info('Mark order ready for pickup request', {
      mid,
      machineIp: req.ip
    });

    // Validate input
    Validator.validateRequired(['mid'], { mid });
    mid = Validator.validateMachineId(mid); // Normalize to uppercase

    // Verify machine exists and is active
    const machine = await DatabaseUtil.findOne(Machine, { mid }, { throwIfNotFound: true });
    
    if (!machine.isActive) {
      logger.warn('Ready for pickup attempt on inactive machine', { mid });
      throw new BadRequestError("Machine is currently disabled");
    }

    // Find current preparing order for this machine only (no fallback to any order)
    const order = await DatabaseUtil.findOne(Order, { 
      machineId: machine._id,
      orderStatus: "PREPARING",
      orderCompleted: false
    }, { 
      sort: { createdAt: -1 },
      populate: [
        { path: 'uid', select: 'phone' },
        { path: 'machineId', select: 'mid name' }
      ]
    });

    if (!order) {
      logger.warn('No preparing order found for this machine', { 
        mid,
        machineId: machine._id 
      });
      throw new BadRequestError("No order currently being prepared for this machine");
    }

    logger.info('Found order for marking ready', {
      orderId: order._id,
      orderStatus: order.orderStatus,
      machineId: order.machineId,
      userId: order.uid?._id
    });

    // Use transaction to update order status
    await DatabaseUtil.transaction(async (session) => {
      try {
        logger.info('Starting transaction for marking order ready', { 
          orderId: order._id,
          machineId: machine._id 
        });

        // Update order status to ready for pickup
        const orderForUpdate = await Order.findById(order._id).session(session);
        
        if (!orderForUpdate) {
          throw new Error('Order not found in transaction');
        }

        logger.info('Found order in transaction, updating status', { 
          orderId: orderForUpdate._id,
          currentStatus: orderForUpdate.orderStatus 
        });

        await orderForUpdate.updateStatus(
          "READY_FOR_PICKUP",
          "machine",
          "Food preparation completed, ready for pickup",
          {
            machineId: machine.mid,
            machineName: machine.name,
            location: machine.location,
            readyAt: new Date()
          }
        );
        
        await orderForUpdate.save({ session });

        logger.info('Order status updated, now updating machine status');

        // Update machine status
        await DatabaseUtil.updateById(Machine, machine._id, {
          mstatus: "READY_FOR_PICKUP",
          currentOrderId: order._id,
          lastPreparationCompletedAt: new Date()
        }, { session });

        logger.info('Machine status updated successfully');

      } catch (transactionError) {
        logger.error('Transaction error in markOrderReadyForPickup', {
          error: transactionError.message,
          stack: transactionError.stack,
          orderId: order._id,
          machineId: machine._id
        });
        throw transactionError;
      }
    });

    logger.info('Order marked ready for pickup successfully', { 
      orderId: order._id,
      mid,
      userId: order.uid._id,
      userPhone: order.uid.phone?.substring(0, 6) + 'xxxx'
    });

    // Return response
    return res.status(200).json({
      result: {
        order: {
          orderId: order._id,
          status: "READY_FOR_PICKUP",
          userPhone: order.uid.phone?.substring(0, 6) + 'xxxx',
          items: order.items || []
        },
        machine: {
          mid: machine.mid,
          status: "READY_FOR_PICKUP"
        }
      },
      message: "Order ready for pickup"
    });

  } catch (error) {
    logger.error('Mark ready for pickup failed', { 
      error: error.message,
      mid: req.body?.mid
    });
    throw error;
  }
};

// ----------------------------------------------------------------------------
// Cancel order from machine
export const cancelOrder = async (req, res) => {
  try {
    let { oid, mid, reason } = req.body;

    logger.info('Cancel order request', {
      orderId: oid,
      mid,
      reason,
      machineIp: req.ip
    });

    // Validate input
    Validator.validateRequired(['oid', 'mid'], { oid, mid });
    Validator.validateObjectId(oid, 'Order ID');
    mid = Validator.validateMachineId(mid); // Normalize to uppercase

    // Verify machine exists
    const machine = await DatabaseUtil.findOne(Machine, { mid }, { throwIfNotFound: true });

    // Find order - allow cancellation of PREPARING or OTP_VERIFIED orders
    const order = await DatabaseUtil.findOne(Order, { 
      _id: oid,
      machineId: machine._id,
      orderStatus: { $in: ["PREPARING", "OTP_VERIFIED"] },
      orderCompleted: false
    }, { 
      throwIfNotFound: true,
      populate: [
        { path: 'uid', select: 'phone' },
        { path: 'machineId', select: 'mid name' }
      ]
    });

    // Use transaction to update order status
    await DatabaseUtil.transaction(async (session) => {
      // Update order status to cancelled
      const orderToUpdate = await Order.findById(order._id).session(session);
      await orderToUpdate.updateStatus(
        "CANCELLED",
        "machine",
        reason || "Order cancelled by machine operator",
        {
          machineId: machine.mid,
          machineName: machine.name,
          cancelledAt: new Date(),
          cancelledBy: "machine"
        }
      );
      
      // Mark order as completed (cancelled counts as completed)
      orderToUpdate.orderCompleted = true;
      await orderToUpdate.save({ session });

      // Update machine status back to connected/ready
      await DatabaseUtil.updateById(Machine, machine._id, {
        mstatus: "CONNECTED",
        currentOrderId: null,
        lastCancelledOrderAt: new Date()
      }, { session });
    });

    logger.info('Order cancelled successfully', { 
      orderId: order._id,
      mid,
      userId: order.uid._id,
      reason
    });

    return res.status(200).json({ 
      result: {
        order: {
          orderId: order._id,
          status: "CANCELLED"
        },
        machine: {
          mid: machine.mid,
          status: "CONNECTED"
        }
      },
      message: "Order cancelled successfully"
    });

  } catch (error) {
    logger.error('Cancel order failed', { 
      error: error.message,
      orderId: req.body?.oid,
      mid: req.body?.mid
    });
    throw error;
  }
};

// ----------------------------------------------------------------------------
// Mark order as completed after plate dispensed
export const plateDispensed = async (req, res) => {
  try {
    let { oid, mid } = req.body;

    logger.info('Plate dispensed request', {
      orderId: oid,
      mid,
      machineIp: req.ip
    });

    // Validate input
    Validator.validateRequired(['oid', 'mid'], { oid, mid });
    Validator.validateObjectId(oid, 'Order ID');
    mid = Validator.validateMachineId(mid); // Normalize to uppercase

    // Verify machine exists
    const machine = await DatabaseUtil.findOne(Machine, { mid }, { throwIfNotFound: true });

    // Find order
    const order = await DatabaseUtil.findOne(Order, { 
      _id: oid,
      machineId: machine._id,
      orderStatus: "READY_FOR_PICKUP"
    }, { throwIfNotFound: true });

    // Use transaction to update order status
    await DatabaseUtil.transaction(async (session) => {
      // Update order status to completed
      const orderToUpdate = await Order.findById(order._id).session(session);
      await orderToUpdate.updateStatus(
        "COMPLETED",
        "machine",
        "Order completed and plate dispensed",
        {
          machineId: machine.mid,
          machineName: machine.name,
          completedAt: new Date(),
          dispensedAt: new Date()
        }
      );
      
      // Mark order as completed
      orderToUpdate.orderCompleted = true;
      await orderToUpdate.save({ session });

      // Update machine status back to connected/ready
      await DatabaseUtil.updateById(Machine, machine._id, {
        mstatus: "CONNECTED",
        currentOrderId: null,
        lastCompletedOrderAt: new Date()
      }, { session });
    });

    logger.info('Order completed successfully', { 
      orderId: order._id,
      mid,
      userId: order.uid
    });

    return res.status(200).json({ 
      result: {
        order: {
          orderId: order._id,
          status: "COMPLETED"
        },
        machine: {
          mid: machine.mid,
          status: "CONNECTED"
        }
      },
      message: "Order completed and plate dispensed"
    });

  } catch (error) {
    logger.error('Plate dispensed failed', { 
      error: error.message,
      orderId: req.body?.oid,
      mid: req.body?.mid
    });
    throw error;
  }
};
