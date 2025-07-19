import mongoose from "mongoose";
import Order from "../models/orderModel.js";
import Item from "../models/itemModel.js";
import OrderItem from "../models/orderItemModel.js";
import Machine from "../models/machineModel.js";
import reportIssueModel from "../models/reportIssueModel.js";
import logger from "../utils/logger.js";
import { BadRequestError, NotFoundError, ValidationError } from "../utils/errors.js";
import { Validator } from "../utils/validation.js";
import DatabaseUtil from "../utils/database.js";
import ApiResponse from "../utils/response.js";

// ----------------------------------------------------------------------------
// Create order (User initiated, payment pending)
export const createOrder = async (req, res) => {
  try {
    const { items, machineId } = req.body;
    const { uid } = req.user;

    logger.info('Order creation initiated', { 
      userId: uid, 
      machineId, 
      itemCount: items?.length 
    });

    // Validate input
    Validator.validateRequired(['machineId', 'items'], { machineId, items });
    Validator.validateMachineId(machineId);
    Validator.validateOrderItems(items);

    // Verify machine exists and is active
    const machine = await DatabaseUtil.findOne(Machine, { mid: machineId }, { throwIfNotFound: true });
    
    if (!machine.isActive) {
      logger.warn('Order attempt on inactive machine', { machineId, userId: uid });
      throw new BadRequestError("Machine is currently not available");
    }

    logger.debug('Machine validation successful', { 
      machineId, 
      machineName: machine.name,
      location: machine.location 
    });

    // Check for existing orders that should block new order creation
    // Only block orders that are truly in progress (not completed/cancelled)
    const existingOrder = await DatabaseUtil.findOne(Order, {
      uid: new mongoose.Types.ObjectId(uid),
      orderStatus: { $in: ["PENDING", "PREPARING", "READY"] }
      // PAID orders are allowed to proceed to let users place new orders while waiting
      // COMPLETED and CANCELLED orders don't block new orders
    });

    if (existingOrder) {
      const blockingMessages = {
        'PENDING': 'You have a pending payment. Please complete payment or cancel the order first.',
        'PREPARING': 'Your order is being prepared. Please wait for completion before placing a new order.',
        'READY': 'Your order is ready for pickup. Please collect it before placing a new order.'
      };
      
      logger.warn('User has existing blocking order', { 
        userId: uid, 
        existingOrderId: existingOrder._id,
        status: existingOrder.orderStatus 
      });
      
      const message = blockingMessages[existingOrder.orderStatus] || 
                     "You have an active order. Please complete it first.";
      throw new BadRequestError(message);
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
    const paymentUrl = `${process.env.FRONTEND_URL}/payment?orderId=${orderId}`;

    logger.info('Order creation completed', { 
      orderId: orderId,
      userId: uid,
      total,
      paymentUrl 
    });

    return ApiResponse.created(res, {
      order: result && typeof result.toObject === 'function' 
        ? { ...result.toObject(), _id: createdOrderId || result._id }
        : { _id: createdOrderId },
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

    if (order.orderStatus !== "READY") {
      logger.warn('OTP requested for non-ready order', { 
        orderId: order._id, 
        userId: uid,
        status: order.orderStatus 
      });
      
      const statusMessages = {
        'PENDING': 'Payment is pending',
        'PAID': 'Order is being prepared',
        'PREPARING': 'Order is being prepared',
        'CANCELLED': 'Order has been cancelled'
      };
      
      throw new BadRequestError(statusMessages[order.orderStatus] || "Order is not ready for pickup");
    }

    logger.info('OTP provided successfully', { 
      orderId: order._id, 
      userId: uid 
    });

    return ApiResponse.success(res, { 
      order: { ...order.toObject(), oid: order._id },
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
      order: order ? { ...order.toObject(), oid: order._id } : null 
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

    const isCompleted = order.orderCompleted;
    
    logger.debug('Order completion status', { 
      orderId: order._id, 
      userId: uid,
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

    const isPreparing = order.orderStatus === "PREPARING";
    
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
// Report issue (includes image upload)
export const createReportIssue = async (req, res) => {
  try {
    const { uid } = req.user;
    const { oid, description, machineId } = req.body;

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
    
    if (machineId) {
      query.machineId = { $regex: machineId, $options: "i" };
    }
    
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
    const limit = 10;
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
        $lookup: {
          from: "machines",
          localField: "machineId",
          foreignField: "_id",
          as: "machineData"
        }
      },
      {
        $match: {
          ...query,
          ...(phone && { "userData.phone": { $regex: phone, $options: "i" } })
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
                phone: { $arrayElemAt: ["$userData.phone", 0] },
                machineId: { $arrayElemAt: ["$machineData.mid", 0] },
                machineName: { $arrayElemAt: ["$machineData.name", 0] },
                orderStatus: 1,
                orderDate: "$createdAt",
                amount: "$amount.total",
                orderCompleted: 1,
                orderOtp: 1
              }
            }
          ],
          totalCount: [{ $count: "count" }]
        }
      }
    ];

    const [result] = await DatabaseUtil.aggregate(Order, pipeline);
    const orders = result.orders || [];
    const totalOrders = result.totalCount[0]?.count || 0;
    const numOfPages = Math.ceil(totalOrders / limit);

    logger.info('Orders retrieved successfully', { 
      totalOrders, 
      page: currentPage, 
      numOfPages,
      returnedCount: orders.length 
    });

    return ApiResponse.legacy(res, {
      orders,
      totalOrders,
      numOfPages,
      currentPage
    }, "Orders retrieved successfully");

  } catch (error) {
    logger.error('Get all orders failed', { 
      error: error.message,
      query: req.query 
    });
    throw error;
  }
};
