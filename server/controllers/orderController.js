import mongoose from "mongoose";
import Order from "../models/orderModel.js";
import Item from "../models/itemModel.js";
import OrderItem from "../models/orderItemModel.js";
import Machine from "../models/machineModel.js";
import Payment from "../models/paymentModel.js";
import reportIssueModel from "../models/reportIssueModel.js";
import logger from "../utils/logger.js";
import { BadRequestError, NotFoundError, ValidationError } from "../utils/errors.js";
import { Validator } from "../utils/validation.js";
import DatabaseUtil from "../utils/database.js";
import machineResolver from "../services/machineResolver.js";
import ApiResponse from "../utils/response.js";
import {
  calculatePurisNeeded,
  checkMachinePuriAvailability
} from "../utils/quantityUtils.js";

// ----------------------------------------------------------------------------
// Create order (User initiated, payment pending)
export const createOrder = async (req, res) => {
  try {
    let { items, machineId, mt } = req.body;
    const { uid } = req.user;

    logger.info('Order creation initiated', {
      userId: uid,
      hasMachineId: !!machineId,
      hasMachineToken: !!mt,
      itemCount: items?.length
    });

    // Validate items first
    Validator.validateRequired(['items'], { items });
    Validator.validateOrderItems(items);

    // Resolve machine: either from token (mt) or direct ID (machineId)
    let resolvedMachineId;
    let machine;

    if (mt) {
      // QR code flow: resolve machine from token
      logger.info('Resolving machine from token', { userId: uid });

      const resolution = await machineResolver.validateForOrderCreation(mt, 'token');

      if (!resolution.success) {
        logger.warn('Machine token resolution failed', {
          userId: uid,
          error: resolution.error,
          message: resolution.message
        });

        throw new BadRequestError(
          resolution.message || 'Invalid or inactive machine QR code'
        );
      }

      resolvedMachineId = resolution.machine.id;

      // Fetch full machine object for order creation
      machine = await DatabaseUtil.findOne(Machine, { mid: resolvedMachineId }, { throwIfNotFound: true });

      logger.info('Machine resolved from token', {
        userId: uid,
        machineId: resolvedMachineId,
        tokenUsed: true
      });

    } else if (machineId) {
      // Manual entry flow: use direct machine ID (normalize to uppercase)
      logger.info('Using direct machine ID', { userId: uid, machineId });

      machineId = Validator.validateMachineId(machineId); // Normalize to uppercase

      const resolution = await machineResolver.validateForOrderCreation(machineId, 'id');

      if (!resolution.success) {
        logger.warn('Machine validation failed', {
          userId: uid,
          machineId,
          error: resolution.error
        });

        throw new BadRequestError(
          resolution.message || 'Machine not found or unavailable'
        );
      }

      resolvedMachineId = machineId;
      machine = await DatabaseUtil.findOne(Machine, { mid: resolvedMachineId }, { throwIfNotFound: true });

      logger.info('Machine validated', {
        userId: uid,
        machineId: resolvedMachineId,
        tokenUsed: false
      });

    } else {
      // Neither token nor ID provided
      logger.warn('Order creation without machine identifier', { userId: uid });
      throw new BadRequestError('Please scan a machine QR code or enter a machine code');
    }

    logger.debug('Machine validation successful', {
      machineId: resolvedMachineId,
      machineName: machine.name,
      location: machine.location
    });

    // Check for existing active orders
    // A user can only have one active order at a time
    // Active means: not COMPLETED, not CANCELLED, and not PAYMENT_FAILED
    const activeOrder = await DatabaseUtil.findOne(Order, {
      uid: new mongoose.Types.ObjectId(uid),
      orderStatus: {
        $nin: ["COMPLETED", "CANCELLED", "PAYMENT_FAILED"]
      },
      orderCompleted: false
    }, {
      select: '_id orderCounter orderStatus createdAt amount machineId',
      populate: [
        { path: 'machineId', select: 'mid name' }
      ],
      sort: { createdAt: -1 }
    });

    if (activeOrder) {
      logger.warn('Active order exists - blocking new order creation', {
        userId: uid,
        existingOrderId: activeOrder._id,
        existingOrderStatus: activeOrder.orderStatus,
        existingOrderCounter: activeOrder.orderCounter
      });
      throw new BadRequestError(
        'You have an active order in progress. Please complete or cancel it before placing a new order.',
        {
          activeOrder: {
            orderId: activeOrder._id,
            orderCounter: activeOrder.orderCounter,
            status: activeOrder.orderStatus,
            machineId: activeOrder.machineId?.mid,
            machineName: activeOrder.machineId?.name,
            amount: activeOrder.amount?.total,
            createdAt: activeOrder.createdAt
          }
        }
      );
    }

    logger.debug('No active orders found - proceeding with order creation', { userId: uid });

    // Check for recent failed payment attempts to prevent spam
    // Limit users to 3 failed payment attempts in 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const failedOrderCount = await Order.countDocuments({
      uid: new mongoose.Types.ObjectId(uid),
      orderStatus: "PAYMENT_FAILED",
      createdAt: { $gte: last24Hours }
    });

    if (failedOrderCount >= 3) {
      logger.warn('Too many failed payment attempts', {
        userId: uid,
        failedCount: failedOrderCount,
        machineId: machine.mid
      });

      throw new BadRequestError(
        'Too many failed payment attempts in the last 24 hours. Please contact support if you need assistance.',
        {
          failedAttempts: failedOrderCount,
          limit: 3,
          timeWindow: '24 hours'
        }
      );
    }

    // Check machine puri availability before processing order
    const { totalPuris, itemsBreakdown } = await calculatePurisNeeded(items);
    const puriAvailability = await checkMachinePuriAvailability(machine._id, totalPuris);

    logger.info('Puri availability check', {
      machineId: machine.mid,
      totalPurisNeeded: totalPuris,
      currentQuantity: puriAvailability.currentQuantity,
      hasEnough: puriAvailability.hasEnough,
      remaining: puriAvailability.remaining
    });

    if (!puriAvailability.hasEnough) {
      logger.warn('Insufficient puris for order', {
        userId: uid,
        machineId: machine.mid,
        needed: totalPuris,
        available: puriAvailability.currentQuantity
      });

      throw new BadRequestError(
        `Insufficient puris available. This order needs ${totalPuris} puris, but only ${puriAvailability.currentQuantity} are available.`,
        {
          purisNeeded: totalPuris,
          purisAvailable: puriAvailability.currentQuantity,
          itemsBreakdown
        }
      );
    }

    // Warn if low stock
    if (puriAvailability.isLowStock) {
      logger.warn('Low puri stock after this order', {
        machineId: machine.mid,
        currentQuantity: puriAvailability.currentQuantity,
        afterOrder: puriAvailability.remaining,
        threshold: machine.lowQuantityThreshold
      });
    }

    // Calculate order amount with validation
    let price = 0, gst = 0;
    const orderItems = [];
    
    for (const [index, item] of items.entries()) {
      const dbItem = await DatabaseUtil.findById(Item, item.id || item._id);
      
      if (!dbItem) {
        logger.error('Item not found during order creation', { 
          itemId: item.id || item._id, 
          index,
          userId: uid 
        });
        throw new BadRequestError(`Item not found: ${item.id || item._id}`);
      }
      
      if (!dbItem.isAvailable) {
        logger.warn('Unavailable item in order', { 
          itemId: dbItem._id, 
          itemName: dbItem.name,
          userId: uid 
        });
        throw new BadRequestError(`Item "${dbItem.name}" is currently unavailable`);
      }

      const itemTotal = dbItem.price * item.quantity;
      const itemGst = dbItem.gst * item.quantity;
      
      price += itemTotal;
      gst += itemGst;
      
      orderItems.push({
        orderId: null, // Will be set after order creation
        itemId: dbItem._id,
        qty: item.quantity,
        priceAtOrderTime: dbItem.price,
        gstAtOrderTime: dbItem.gst,
        itemName: dbItem.name // For reference
      });

      logger.debug('Item processed for order', {
        itemId: dbItem._id,
        itemName: dbItem.name,
        quantity: item.quantity,
        unitPrice: dbItem.price,
        total: itemTotal
      });
    }

    const total = price + gst;
    
    logger.info('Order amount calculated', { 
      price, 
      gst, 
      total, 
      itemCount: orderItems.length,
      userId: uid 
    });

    // Use transaction for order creation
    let createdOrderId;
    const result = await DatabaseUtil.transaction(async (session) => {
      // Create order
      const orderData = {
        uid: new mongoose.Types.ObjectId(uid),
        machineId: machine._id,
        amount: { price, gst, total },
        orderStatus: "PENDING",
        orderCompleted: false,
        createdAt: new Date(),
        // Generate OTP for later use when order is ready
        orderOtp: Math.floor(1000 + Math.random() * 9000).toString()
      };

      const [order] = await Order.create([orderData], { session });
      createdOrderId = order._id; // Store the ID explicitly
      
      logger.info('Order created successfully', { 
        orderId: order._id,
        userId: uid,
        total 
      });

      // Create order items
      const orderItemsWithOrderId = orderItems.map(item => ({
        ...item,
        orderId: order._id
      }));

      await OrderItem.create(orderItemsWithOrderId, { session });
      
      logger.info('Order items created successfully', { 
        orderId: order._id,
        itemCount: orderItemsWithOrderId.length 
      });

      return order;
    });

    logger.debug('Transaction result', { 
      resultId: result._id,
      resultKeys: Object.keys(result),
      resultType: typeof result 
    });

    // Payment integration is handled via separate payment controller
    const orderId = createdOrderId || result?._id || result?.id;
    const paymentUrl = `${process.env.USER_WEB_URL}/payment?orderId=${orderId}`;

    logger.info('Order creation completed', { 
      orderId: orderId,
      userId: uid,
      total,
      paymentUrl 
    });

    return ApiResponse.created(res, {
      order: result && typeof result.toObject === 'function' 
        ? { 
            ...result.toObject(), 
            _id: createdOrderId || result._id,
            orderCounter: result.orderCounter || 0
          }
        : { 
            _id: createdOrderId,
            orderCounter: 0
          },
      paymentUrl,
      totalAmount: total
    }, "Order created successfully");

  } catch (error) {
    logger.error('Order creation failed', { 
      error: error.message,
      userId: req.user?.uid,
      machineId: req.body?.machineId 
    });
    throw error;
  }
};

// ----------------------------------------------------------------------------
// Generate OTP if payment is successful
export const getOrderOTP = async (req, res) => {
  try {
    const { uid } = req.user;

    logger.info('OTP request received', { userId: uid });

    const order = await DatabaseUtil.findOne(Order, { uid }, {
      sort: { createdAt: -1 }
    });

    if (!order) {
      logger.warn('No order found for OTP request', { userId: uid });
      throw new NotFoundError("No active order found");
    }

    if (order.orderCompleted) {
      logger.warn('OTP requested for completed order', { 
        orderId: order._id, 
        userId: uid 
      });
      throw new BadRequestError("Cannot generate OTP for completed order");
    }

    if (order.orderStatus !== "PAID") {
      logger.warn('OTP requested for non-paid order', { 
        orderId: order._id, 
        userId: uid,
        status: order.orderStatus 
      });
      
      const statusMessages = {
        'PENDING': 'Payment is pending',
        'OTP_VERIFIED': 'Order is already being prepared',
        'PREPARING': 'Order is being prepared',
        'READY_FOR_PICKUP': 'Order is ready for pickup',
        'COMPLETED': 'Order is already completed',
        'CANCELLED': 'Order has been cancelled'
      };
      
      throw new BadRequestError(statusMessages[order.orderStatus] || "Order is not ready for OTP verification");
    }

    logger.info('OTP provided successfully', { 
      orderId: order._id, 
      userId: uid 
    });

    return ApiResponse.success(res, { 
      order: { 
        ...order.toObject(), 
        oid: order._id,
        orderCounter: order.orderCounter || 0
      },
      orderOtp: order.orderOtp 
    }, "OTP retrieved successfully");

  } catch (error) {
    logger.error('Get order OTP failed', { 
      error: error.message,
      userId: req.user?.uid 
    });
    throw error;
  }
};

// ----------------------------------------------------------------------------
// Get latest order (User)
export const getLatestOrder = async (req, res) => {
  try {
    const { uid } = req.user;

    logger.debug('Latest order request', { userId: uid });

    const order = await DatabaseUtil.findOne(Order, { uid }, {
      sort: { createdAt: -1 },
      populate: [
        { path: 'machineId', select: 'name location mid' },
        { path: 'uid', select: 'phone' }
      ]
    });

    if (order) {
      logger.debug('Latest order found', { 
        orderId: order._id, 
        userId: uid,
        status: order.orderStatus 
      });
    } else {
      logger.debug('No orders found for user', { userId: uid });
    }

    return ApiResponse.success(res, { 
      order: order ? { 
        ...order.toObject(), 
        oid: order._id,
        orderCounter: order.orderCounter || 0
      } : null 
    }, "Latest order retrieved");

  } catch (error) {
    logger.error('Get latest order failed', { 
      error: error.message,
      userId: req.user?.uid 
    });
    throw error;
  }
};

// ----------------------------------------------------------------------------
// Check if latest order is completed
export const getIsOrderCompleted = async (req, res) => {
  try {
    const { uid } = req.user;

    logger.debug('Order completion check', { userId: uid });

    const order = await DatabaseUtil.findOne(Order, { uid: new mongoose.Types.ObjectId(uid) }, {
      sort: { createdAt: -1 }
    });

    if (!order) {
      logger.debug('No order found for completion check', { userId: uid });
      return ApiResponse.success(res, { 
        isOrderCompleted: false 
      }, "No orders found");
    }

    // Only consider successfully completed orders, not cancelled ones
    const isCompleted = order.orderCompleted && order.orderStatus !== "CANCELLED";
    
    logger.debug('Order completion status', { 
      orderId: order._id, 
      userId: uid,
      orderStatus: order.orderStatus,
      orderCompleted: order.orderCompleted,
      isCompleted 
    });

    return ApiResponse.success(res, { 
      isOrderCompleted: isCompleted 
    }, "Order completion status retrieved");

  } catch (error) {
    logger.error('Get order completion status failed', { 
      error: error.message,
      userId: req.user?.uid 
    });
    throw error;
  }
};

// ----------------------------------------------------------------------------
// Check if latest order is preparing
export const getIsOrderPreparing = async (req, res) => {
  try {
    const { uid } = req.user;

    logger.debug('Order preparing check', { userId: uid });

    const order = await DatabaseUtil.findOne(Order, { uid }, {
      sort: { createdAt: -1 }
    });

    if (!order) {
      logger.warn('No order found for preparing check', { userId: uid });
      return ApiResponse.success(res, { 
        isOrderPreparing: false 
      }, "No orders found");
    }

    // Exclude cancelled orders from being considered as preparing
    const isPreparing = ["OTP_VERIFIED", "PREPARING", "READY_FOR_PICKUP"].includes(order.orderStatus) 
                       && order.orderStatus !== "CANCELLED";
    
    logger.debug('Order preparing status', { 
      orderId: order._id, 
      userId: uid,
      status: order.orderStatus,
      isPreparing 
    });

    return ApiResponse.success(res, { 
      isOrderPreparing: isPreparing 
    }, "Order preparing status retrieved");

  } catch (error) {
    logger.error('Get order preparing status failed', { 
      error: error.message,
      userId: req.user?.uid 
    });
    throw error;
  }
};

// ----------------------------------------------------------------------------
// Check if latest order was cancelled
export const getIsOrderCancelled = async (req, res) => {
  try {
    const { uid } = req.user;

    logger.debug('Order cancellation check', { userId: uid });

    const order = await DatabaseUtil.findOne(Order, { uid }, {
      sort: { createdAt: -1 }
    });

    if (!order) {
      logger.debug('No order found for cancellation check', { userId: uid });
      return ApiResponse.success(res, { 
        isOrderCancelled: false 
      }, "No orders found");
    }

    const isCancelled = order.orderStatus === "CANCELLED";
    
    logger.debug('Order cancellation status', { 
      orderId: order._id, 
      userId: uid,
      status: order.orderStatus,
      isCancelled 
    });

    return ApiResponse.success(res, { 
      isOrderCancelled: isCancelled 
    }, "Order cancellation status retrieved");

  } catch (error) {
    logger.error('Get order cancellation status failed', { 
      error: error.message,
      userId: req.user?.uid 
    });
    throw error;
  }
};

// ----------------------------------------------------------------------------
// Get active order (if exists)
// Returns the user's active order (not completed, cancelled, or payment failed)
export const getActiveOrder = async (req, res) => {
  try {
    const { uid } = req.user;

    logger.info('Get active order request', { userId: uid });

    const activeOrder = await DatabaseUtil.findOne(Order, {
      uid: new mongoose.Types.ObjectId(uid),
      orderStatus: {
        $nin: ["COMPLETED", "CANCELLED", "PAYMENT_FAILED"]
      },
      orderCompleted: false
    }, {
      select: '_id orderCounter orderStatus orderOtp createdAt amount machineId',
      populate: [
        { path: 'machineId', select: 'mid name location' }
      ],
      sort: { createdAt: -1 }
    });

    if (!activeOrder) {
      logger.debug('No active order found', { userId: uid });
      return ApiResponse.success(res, {
        hasActiveOrder: false,
        activeOrder: null
      }, "No active order");
    }

    logger.info('Active order found', {
      userId: uid,
      orderId: activeOrder._id,
      orderStatus: activeOrder.orderStatus,
      orderCounter: activeOrder.orderCounter
    });

    return ApiResponse.success(res, {
      hasActiveOrder: true,
      activeOrder: {
        orderId: activeOrder._id.toString(),
        oid: activeOrder._id.toString(),
        orderCounter: activeOrder.orderCounter,
        orderStatus: activeOrder.orderStatus,
        orderOtp: activeOrder.orderOtp,
        amount: activeOrder.amount,
        createdAt: activeOrder.createdAt,
        machineId: activeOrder.machineId?.mid,
        machineName: activeOrder.machineId?.name,
        machineLocation: activeOrder.machineId?.location
      }
    }, "Active order retrieved");

  } catch (error) {
    logger.error('Get active order failed', {
      error: error.message,
      userId: req.user?.uid
    });
    throw error;
  }
};

// ----------------------------------------------------------------------------
// Report issue (includes image upload)
export const createReportIssue = async (req, res) => {
  try {
    const { uid } = req.user;
    let { oid, description, machineId } = req.body;

    logger.info('Issue report received', {
      userId: uid,
      orderId: oid,
      machineId,
      hasImage: !!req.file
    });

    // Validate input
    Validator.validateRequired(['oid', 'description', 'machineId'], { oid, description, machineId });
    Validator.validateObjectId(oid, 'Order ID');
    Validator.validateString(description, 'description', { minLength: 10, maxLength: 500 });
    machineId = Validator.validateMachineId(machineId); // Normalize to uppercase

    // Verify order belongs to user
    const order = await DatabaseUtil.findOne(Order, { 
      _id: oid, 
      uid: new mongoose.Types.ObjectId(uid) 
    });

    if (!order) {
      logger.warn('Issue report for non-existent order', { 
        userId: uid, 
        orderId: oid 
      });
      throw new NotFoundError("Order not found or access denied");
    }

    const imgUrl = req.file?.location || req.file?.path || "";

    const reportData = {
      uid: new mongoose.Types.ObjectId(uid),
      oid: new mongoose.Types.ObjectId(oid),
      description: Validator.sanitizeInput(description),
      machineId,
      imgUrl,
      status: 'PENDING',
      createdAt: new Date()
    };

    const report = await DatabaseUtil.create(reportIssueModel, reportData);

    logger.info('Issue report created successfully', { 
      reportId: report._id,
      userId: uid, 
      orderId: oid 
    });

    return ApiResponse.created(res, { 
      reportId: report._id 
    }, "Issue reported successfully");

  } catch (error) {
    logger.error('Create issue report failed', { 
      error: error.message,
      userId: req.user?.uid,
      orderId: req.body?.oid 
    });
    throw error;
  }
};

// ----------------------------------------------------------------------------
// Get all orders (Admin view with filters)
export const getAllOrders = async (req, res) => {
  try {
    const { orderId, phone, machineId, orderStatus, date, minAmt, maxAmt, page } = req.query;

    logger.info('Admin orders list request', { 
      filters: { orderId, phone, machineId, orderStatus, date, minAmt, maxAmt },
      page 
    });

    // Validate order ID if provided
    if (orderId && !mongoose.isValidObjectId(orderId)) {
      throw new ValidationError("Invalid Order ID format");
    }

    // Build query object
    const query = {};
    
    if (orderId) {
      query._id = new mongoose.Types.ObjectId(orderId);
    }

    // Note: machineId filter is applied in aggregation pipeline after $lookup
    // because machineId is stored as ObjectId reference

    if (orderStatus && orderStatus !== "ALL") {
      query.orderStatus = orderStatus;
    }
    
    if (date) {
      query.createdAt = {
        $gte: new Date(`${date}T00:00:00.000Z`),
        $lte: new Date(`${date}T23:59:59.999Z`)
      };
    }

    // Amount range filter
    const minAmount = parseInt(minAmt) || 0;
    const maxAmount = parseInt(maxAmt) || 10000;
    query["amount.total"] = {
      $gte: minAmount,
      $lte: maxAmount
    };

    // Pagination
    const currentPage = Math.max(1, Number(page) || 1);
    const limit = Math.min(1000, Number(req.query.limit) || 10); // Allow custom limit up to 1000
    const skip = (currentPage - 1) * limit;

    logger.debug('Order query built', { query, page: currentPage, limit, skip });

    // Aggregation pipeline for complex filtering
    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "uid",
          foreignField: "_id",
          as: "userData"
        }
      },
      {
        $unwind: {
          path: "$userData",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "machines",
          localField: "machineId",
          foreignField: "_id",
          as: "machineData"
        }
      },
      {
        $unwind: {
          path: "$machineData",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "orderitems",
          localField: "_id",
          foreignField: "orderId",
          as: "orderItemsData"
        }
      },
      {
        $lookup: {
          from: "items",
          localField: "orderItemsData.itemId",
          foreignField: "_id",
          as: "itemDetails"
        }
      },
      {
        $match: {
          ...query,
          ...(phone && { "userData.phone": { $regex: phone, $options: "i" } }),
          ...(machineId && { "machineData.mid": { $regex: machineId, $options: "i" } })
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          orders: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 0,
                orderId: "$_id",
                phone: "$userData.phone",
                machineId: "$machineData.mid",
                machineName: "$machineData.name",
                orderStatus: 1,
                orderDate: "$createdAt",
                amount: "$amount.total",
                orderCompleted: 1,
                orderOtp: 1,
                orderCounter: 1,
                items: {
                  $map: {
                    input: "$orderItemsData",
                    as: "orderItem",
                    in: {
                      itemId: "$$orderItem.itemId",
                      quantity: "$$orderItem.qty",
                      priceAtOrderTime: "$$orderItem.priceAtOrderTime",
                      gstAtOrderTime: { $ifNull: ["$$orderItem.gstAtOrderTime", 0] },
                      name: {
                        $let: {
                          vars: {
                            matchedItem: {
                              $arrayElemAt: [
                                {
                                  $filter: {
                                    input: "$itemDetails",
                                    as: "item",
                                    cond: { $eq: ["$$item._id", "$$orderItem.itemId"] }
                                  }
                                },
                                0
                              ]
                            }
                          },
                          in: "$$matchedItem.name"
                        }
                      }
                    }
                  }
                }
              }
            }
          ],
          totalCount: [{ $count: "count" }],
          orderCounts: [
            {
              $project: {
                amount: "$amount.total",
                orderItemsData: 1,
                itemDetails: 1
              }
            },
            { $unwind: "$orderItemsData" },
            {
              $addFields: {
                itemName: {
                  $arrayElemAt: [
                    {
                      $map: {
                        input: {
                          $filter: {
                            input: "$itemDetails",
                            as: "item",
                            cond: { $eq: ["$$item._id", "$orderItemsData.itemId"] }
                          }
                        },
                        as: "matchedItem",
                        in: "$$matchedItem.name"
                      }
                    },
                    0
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                totAmt: { $sum: "$amount" },
                items: {
                  $push: {
                    name: "$itemName",
                    qty: "$orderItemsData.qty"
                  }
                }
              }
            },
            {
              $project: {
                _id: 0,
                totAmt: 1,
                GOLQty: {
                  $sum: {
                    $map: {
                      input: {
                        $filter: {
                          input: "$items",
                          as: "item",
                          cond: { $eq: ["$$item.name", "golgappa"] }
                        }
                      },
                      as: "filtered",
                      in: "$$filtered.qty"
                    }
                  }
                },
                PANQty: {
                  $sum: {
                    $map: {
                      input: {
                        $filter: {
                          input: "$items",
                          as: "item",
                          cond: { $eq: ["$$item.name", "pani puri with onions"] }
                        }
                      },
                      as: "filtered",
                      in: "$$filtered.qty"
                    }
                  }
                },
                PWOQty: {
                  $sum: {
                    $map: {
                      input: {
                        $filter: {
                          input: "$items",
                          as: "item",
                          cond: { $eq: ["$$item.name", "pani puri without onions"] }
                        }
                      },
                      as: "filtered",
                      in: "$$filtered.qty"
                    }
                  }
                }
              }
            }
          ]
        }
      }
    ];

    const [result] = await DatabaseUtil.aggregate(Order, pipeline);
    const orders = result.orders || [];
    const totalOrders = result.totalCount[0]?.count || 0;
    const numOfPages = Math.ceil(totalOrders / limit);
    const orderCounts = result.orderCounts[0] || {
      totAmt: 0,
      GOLQty: 0,
      PANQty: 0,
      PWOQty: 0
    };

    logger.info('Orders retrieved successfully', {
      totalOrders,
      page: currentPage,
      numOfPages,
      returnedCount: orders.length,
      orderCounts
    });

    return ApiResponse.legacy(res, {
      orders,
      totalOrders,
      numOfPages,
      currentPage,
      orderCounts
    }, "Orders retrieved successfully");

  } catch (error) {
    logger.error('Get all orders failed', {
      error: error.message,
      query: req.query
    });
    throw error;
  }
};

// ----------------------------------------------------------------------------
// Get user's order history (User endpoint)
export const getUserOrderHistory = async (req, res) => {
  try {
    const { uid } = req.user;
    const { page = 1, limit = 20 } = req.query;

    logger.info('User order history request', {
      userId: uid,
      page,
      limit
    });

    // Validate pagination
    const pageNum = Validator.validateNumber(page, 'Page', { min: 1, integer: true });
    const limitNum = Math.min(50, Validator.validateNumber(limit, 'Limit', { min: 1, max: 50, integer: true }));
    const skip = (pageNum - 1) * limitNum;

    // Find all orders for this user
    const [orders, total] = await Promise.all([
      DatabaseUtil.find(Order, { uid }, {
        select: '_id orderCounter orderStatus orderCompleted orderOtp amount createdAt updatedAt machineId',
        populate: [
          { path: 'machineId', select: 'mid name location' }
        ],
        sort: { createdAt: -1 },
        limit: limitNum,
        skip
      }),
      DatabaseUtil.countDocuments(Order, { uid })
    ]);

    const numOfPages = Math.ceil(total / limitNum);

    // Fetch order items for each order
    const orderIds = orders.map(order => order._id);
    const orderItems = await DatabaseUtil.find(OrderItem, { orderId: { $in: orderIds } }, {
      populate: [
        { path: 'itemId', select: 'name desc price imgUrl' }
      ]
    });

    // Group order items by orderId
    const itemsByOrder = {};
    orderItems.forEach(orderItem => {
      const orderId = orderItem.orderId.toString();
      if (!itemsByOrder[orderId]) {
        itemsByOrder[orderId] = [];
      }
      itemsByOrder[orderId].push({
        id: orderItem.itemId._id,
        name: orderItem.itemId.name,
        desc: orderItem.itemId.desc,
        price: orderItem.priceAtOrderTime,
        imgUrl: orderItem.itemId.imgUrl,
        quantity: orderItem.qty
      });
    });

    logger.info('User order history retrieved', {
      userId: uid,
      count: orders.length,
      total,
      page: pageNum
    });

    return ApiResponse.success(res, {
      orders: orders.map(order => ({
        oid: order._id,
        orderCounter: order.orderCounter,
        orderStatus: order.orderStatus,
        orderCompleted: order.orderCompleted,
        orderOtp: order.orderOtp,
        amount: order.amount,
        items: itemsByOrder[order._id.toString()] || [],
        machineId: order.machineId?.mid || null,
        machineName: order.machineId?.name || null,
        machineLocation: order.machineId?.location || null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      })),
      pagination: {
        currentPage: pageNum,
        total,
        numOfPages,
        hasNextPage: pageNum < numOfPages,
        hasPrevPage: pageNum > 1
      }
    }, "Order history retrieved successfully");

  } catch (error) {
    logger.error('Get user order history failed', {
      error: error.message,
      userId: req.user?.uid
    });
    throw error;
  }
};

// ----------------------------------------------------------------------------
// Get single order by ID
export const getOrderById = async (req, res) => {
  try {
    const { uid } = req.user;
    const { orderId } = req.params;

    logger.info('Get order by ID request', {
      userId: uid,
      orderId
    });

    // Validate order ID format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new BadRequestError('Invalid order ID format');
    }

    // Find order and ensure it belongs to the user
    const order = await DatabaseUtil.findOne(Order, { _id: orderId, uid }, {
      select: '_id orderCounter orderStatus orderCompleted orderOtp amount createdAt updatedAt machineId statusHistory',
      populate: [
        { path: 'machineId', select: 'mid name location' }
      ]
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Fetch order items
    const orderItems = await DatabaseUtil.find(OrderItem, { orderId: order._id }, {
      populate: [
        { path: 'itemId', select: 'name desc price imgUrl' }
      ]
    });

    const items = orderItems.map(orderItem => ({
      id: orderItem.itemId._id,
      name: orderItem.itemId.name,
      desc: orderItem.itemId.desc,
      price: orderItem.priceAtOrderTime,
      imgUrl: orderItem.itemId.imgUrl,
      quantity: orderItem.qty
    }));

    logger.info('Order retrieved successfully', {
      userId: uid,
      orderId: order._id
    });

    return ApiResponse.success(res, {
      order: {
        oid: order._id,
        orderCounter: order.orderCounter,
        orderStatus: order.orderStatus,
        orderCompleted: order.orderCompleted,
        orderOtp: order.orderOtp,
        amount: order.amount,
        items: items,
        machineId: order.machineId?.mid || null,
        machineName: order.machineId?.name || null,
        machineLocation: order.machineId?.location || null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        statusHistory: order.statusHistory
      }
    }, "Order retrieved successfully");

  } catch (error) {
    logger.error('Get order by ID failed', {
      error: error.message,
      userId: req.user?.uid,
      orderId: req.params?.orderId
    });
    throw error;
  }
};

// ----------------------------------------------------------------------------
// Cancel order (User initiated)
// Only PENDING and PAYMENT_FAILED orders can be cancelled
// ----------------------------------------------------------------------------
export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { uid } = req.user;

    logger.info('Order cancellation initiated', {
      userId: uid,
      orderId
    });

    // Validate order ID
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new ValidationError('Invalid order ID format');
    }

    // Find order
    const order = await DatabaseUtil.findOne(Order, {
      _id: orderId,
      userId: uid
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['PENDING', 'PAYMENT_FAILED'];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      throw new BadRequestError(
        `Cannot cancel order with status ${order.orderStatus}. Only PENDING or PAYMENT_FAILED orders can be cancelled.`
      );
    }

    // Find associated payment (if any)
    const payment = await DatabaseUtil.findOne(Payment, { orderId: order._id });

    // Update order status to CANCELLED
    await order.updateStatus(
      'CANCELLED',
      'user_cancellation',
      'Order cancelled by user',
      {
        cancelledBy: uid,
        cancelledAt: new Date(),
        previousStatus: order.orderStatus
      }
    );

    // Also cancel the payment if it exists and is not verified
    if (payment && !payment.verified) {
      await payment.updateStatus(
        'CANCELLED',
        'order_cancellation',
        'Payment cancelled due to order cancellation',
        {
          cancelledBy: uid,
          cancelledAt: new Date(),
          previousStatus: payment.status
        },
        {
          orderId: order._id
        }
      );

      logger.info('Payment cancelled along with order', {
        userId: uid,
        orderId: order._id,
        paymentId: payment._id,
        previousPaymentStatus: payment.status
      });
    }

    logger.info('Order cancelled successfully', {
      userId: uid,
      orderId: order._id,
      previousStatus: order.orderStatus,
      paymentCancelled: payment && !payment.verified
    });

    return ApiResponse.success(res, {
      order: {
        oid: order._id,
        orderStatus: 'CANCELLED',
        paymentCancelled: payment && !payment.verified,
        message: 'Order cancelled successfully'
      }
    }, payment && !payment.verified
      ? "Order and payment cancelled successfully"
      : "Order cancelled successfully");

  } catch (error) {
    logger.error('Cancel order failed', {
      error: error.message,
      userId: req.user?.uid,
      orderId: req.params?.orderId
    });
    throw error;
  }
};

// ----------------------------------------------------------------------------
// Admin Cancel order
// ----------------------------------------------------------------------------
export const adminCancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    logger.info('Admin order cancellation initiated', {
      orderId,
      adminId: req.user?.uid
    });

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new ValidationError('Invalid order ID format');
    }

    const order = await DatabaseUtil.findOne(Order, {
      _id: orderId
    }, {
      throwIfNotFound: true
    });

    const cancellableStatuses = ['PENDING', 'PAID', 'OTP_VERIFIED', 'PREPARING', 'READY_FOR_PICKUP'];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      throw new BadRequestError(
        `Cannot cancel order with status ${order.orderStatus}.`
      );
    }

    await DatabaseUtil.transaction(async (session) => {
      // Refund puris if order was in PREPARING or READY_FOR_PICKUP and attached to a machine
      if (['PREPARING', 'READY_FOR_PICKUP'].includes(order.orderStatus) && order.machineId) {
        // Use native Mongoose find to correctly attach session during transaction
        const orderItems = await OrderItem.find({ orderId: order._id }).session(session);
        const items = orderItems.map(item => ({
          id: item.itemId,
          quantity: item.qty
        }));

        const { totalPuris } = await calculatePurisNeeded(items);

        logger.info('Refunding puris due to admin order cancellation', {
          orderId: order._id,
          machineId: order.machineId,
          totalPuris
        });

        const machineForUpdate = await Machine.findById(order.machineId).session(session);
        if (machineForUpdate) {
          machineForUpdate.puriQuantity += totalPuris;
          await machineForUpdate.save({ session });

          logger.info('Puris refunded to machine', {
            machineId: machineForUpdate.mid,
            refunded: totalPuris,
            newQuantity: machineForUpdate.puriQuantity,
            orderId: order._id,
            source: 'admin_api',
            reason: 'order_cancelled_by_admin'
          });
        }
      }

      // Update order status
      const orderToUpdate = await Order.findById(order._id).session(session);
      orderToUpdate.orderCompleted = true; // Set completed flag BEFORE saving status to avoid double-save VersionError
      
      await orderToUpdate.updateStatus(
        "CANCELLED",
        "admin",
        "Cancelled from admin dashboard",
        {
          cancelledBy: "admin",
          adminId: req.user?.uid,
          cancelledAt: new Date(),
          previousStatus: order.orderStatus
        }
      );

      // Update machine status if connected
      if (order.machineId) {
        await Machine.findByIdAndUpdate(
          order.machineId,
          {
            mstatus: "CONNECTED",
            currentOrderId: null,
            lastPingedAt: new Date(),
            lastCancelledOrderAt: new Date(),
            $inc: { statusVersion: 1 } 
          },
          { session }
        );
      }
    });

    logger.info('Order cancelled successfully by admin', {
      orderId: order._id,
      previousStatus: order.orderStatus
    });

    return ApiResponse.success(res, {
      order: {
        oid: order._id,
        orderStatus: 'CANCELLED',
        message: 'Order cancelled successfully'
      }
    }, "Order cancelled successfully");


  } catch (error) {
    logger.error('Admin cancel order failed', {
      error: error.message,
      adminId: req.user?.uid,
      orderId: req.params?.orderId
    });
    throw error;
  }
};
