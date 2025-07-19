import mongoose from "mongoose";
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
    const { mid, password } = req.body;
    
    logger.info('Machine login attempt', { 
      mid: mid?.substring(0, 8) + '...',
      ip: req.ip 
    });

    // Validate input
    Validator.validateRequired(['mid', 'password'], { mid, password });
    Validator.validateMachineId(mid);
    Validator.validateString(password, 'Password', { minLength: 6 });

    // Find and authenticate machine
    const machine = await DatabaseUtil.findOne(Machine, { mid }, { throwIfNotFound: true });
    
    const isPasswordValid = await machine.comparePassword(password);
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
    const { mid } = req.params;
    
    logger.debug('Machine info request', { mid });

    Validator.validateMachineId(mid);

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
    const { orderOtp, mid } = req.body;
    
    logger.info('Machine start request', { 
      mid,
      hasOtp: !!orderOtp,
      machineIp: req.ip 
    });

    // Validate input
    Validator.validateRequired(['orderOtp', 'mid'], { orderOtp, mid });
    Validator.validateMachineId(mid);
    Validator.validateOTP(orderOtp);

    // Verify machine exists and is active
    const machine = await DatabaseUtil.findOne(Machine, { mid }, { throwIfNotFound: true });
    
    if (!machine.isActive) {
      logger.warn('Start attempt on inactive machine', { mid });
      throw new BadRequestError("Machine is currently disabled");
    }

    // Find valid order with OTP
    const order = await DatabaseUtil.findOne(Order, { 
      orderOtp,
      machineId: machine._id,
      orderStatus: "READY",
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
      throw new BadRequestError("Invalid OTP or order not ready for pickup");
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
      // Update order status using the new method
      const orderToUpdate = await Order.findById(order._id).session(session);
      await orderToUpdate.updateStatus(
        "PREPARING",
        "machine",
        "Order preparation started by machine",
        {
          machineId: machine.mid,
          machineName: machine.name,
          location: machine.location
        }
      );
      
      // Clear OTP after use and set completion info
      orderToUpdate.orderOtp = "";
      orderToUpdate.orderCompleted = true;
      orderToUpdate.preparingStartedAt = new Date();
      orderToUpdate.estimatedCompletionTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes estimate
      await orderToUpdate.save({ session });

      // Update machine status
      await DatabaseUtil.updateById(Machine, machine._id, {
        mstatus: "PREPARING",
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

    return ApiResponse.success(res, {
      order: {
        orderId: order._id,
        status: "PREPARING",
        userPhone: order.uid.phone?.substring(0, 6) + 'xxxx',
        items: order.items || []
      },
      machine: {
        mid: machine.mid,
        status: "PREPARING"
      }
    }, "Machine started successfully");

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
// Mark order as completed after plate dispensed
export const plateDispensed = async (req, res) => {
  const { oid } = req.params;
  if (!mongoose.isValidObjectId(oid)) throw new BadRequestError("Invalid Order ID");

  const order = await Order.findById(oid);
  if (!order) throw new NotFoundError("Order not found");

  // Update order status using the new method
  await order.updateStatus(
    "COMPLETED",
    "machine",
    "Order completed and plate dispensed",
    {
      completedAt: new Date(),
      dispensedAt: new Date()
    }
  );

  res.status(StatusCodes.OK).json({ result: "Plate marked as dispensed" });
};
