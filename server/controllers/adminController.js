import mongoose from "mongoose";
import Item from "../models/itemModel.js";
import Admin from "../models/adminModel.js";
import Machine from "../models/machineModel.js";
import reportIssueModel from "../models/reportIssueModel.js";
import logger from "../utils/logger.js";
import { BadRequestError, UnauthenticatedError, ConflictError } from "../utils/errors.js";
import { Validator } from "../utils/validation.js";
import DatabaseUtil from "../utils/database.js";
import ApiResponse from "../utils/response.js";

// ---------------------------------
// Add new item
export const addItem = async (req, res) => {
  try {
    const { name, desc, imgUrl, price, gst, qtyLeft, isAvailable } = req.body;
    
    logger.info('Add item request', { 
      adminId: req.user?.uid,
      itemName: name,
      price 
    });

    // Validate required fields
    Validator.validateRequired(['name', 'price', 'gst'], { name, price, gst });
    
    // Validate individual fields
    Validator.validateString(name, 'Item name', { minLength: 2, maxLength: 100 });
    Validator.validateNumber(price, 'Price', { min: 0, max: 10000 });
    Validator.validateNumber(gst, 'GST', { min: 0, max: 1000 });
    
    if (desc) {
      Validator.validateString(desc, 'Description', { maxLength: 500 });
    }
    
    if (qtyLeft !== undefined) {
      Validator.validateNumber(qtyLeft, 'Quantity', { min: 0, max: 1000, integer: true });
    }

    // Check for duplicate item name
    const existingItem = await DatabaseUtil.findOne(Item, { 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
    
    if (existingItem) {
      logger.warn('Attempt to create duplicate item', { 
        itemName: name,
        existingItemId: existingItem._id 
      });
      throw new ConflictError("Item with this name already exists");
    }

    const itemData = {
      name: Validator.sanitizeInput(name),
      desc: desc ? Validator.sanitizeInput(desc) : '',
      imgUrl: imgUrl || '',
      price: parseFloat(price),
      gst: parseFloat(gst),
      qtyLeft: parseInt(qtyLeft) || 0,
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      createdBy: req.user?.uid,
      createdAt: new Date()
    };

    const item = await DatabaseUtil.create(Item, itemData);

    logger.info('Item created successfully', { 
      itemId: item._id,
      itemName: item.name,
      adminId: req.user?.uid 
    });

    return ApiResponse.created(res, {
      item: {
        id: item._id,
        name: item.name,
        desc: item.desc,
        price: item.price,
        gst: item.gst,
        qtyLeft: item.qtyLeft,
        isAvailable: item.isAvailable
      }
    }, "Item created successfully");

  } catch (error) {
    logger.error('Add item failed', { 
      error: error.message,
      adminId: req.user?.uid,
      itemName: req.body?.name 
    });
    throw error;
  }
};

// Update item details
export const updateItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { name, desc, imgUrl, price, gst, isAvailable, qtyLeft } = req.body;

    logger.info('Update item request', { 
      itemId,
      adminId: req.user?.uid,
      updates: Object.keys(req.body) 
    });

    // Validate item ID
    Validator.validateObjectId(itemId, 'Item ID');

    // Build update object with validation
    const updateData = {};
    
    if (name !== undefined) {
      Validator.validateString(name, 'Item name', { minLength: 2, maxLength: 100 });
      updateData.name = Validator.sanitizeInput(name);
    }
    
    if (desc !== undefined) {
      Validator.validateString(desc, 'Description', { maxLength: 500, required: false });
      updateData.desc = Validator.sanitizeInput(desc);
    }
    
    if (imgUrl !== undefined) {
      updateData.imgUrl = imgUrl;
    }
    
    if (price !== undefined) {
      Validator.validateNumber(price, 'Price', { min: 0, max: 10000 });
      updateData.price = parseFloat(price);
    }
    
    if (gst !== undefined) {
      Validator.validateNumber(gst, 'GST', { min: 0, max: 1000 });
      updateData.gst = parseFloat(gst);
    }
    
    if (qtyLeft !== undefined) {
      Validator.validateNumber(qtyLeft, 'Quantity', { min: 0, max: 1000, integer: true });
      updateData.qtyLeft = parseInt(qtyLeft);
    }
    
    if (isAvailable !== undefined) {
      updateData.isAvailable = Boolean(isAvailable);
    }

    // Add audit fields
    updateData.updatedBy = req.user?.uid;
    updateData.updatedAt = new Date();

    // Check if item exists and update
    const updatedItem = await DatabaseUtil.updateById(Item, itemId, updateData, { 
      throwIfNotFound: true 
    });

    logger.info('Item updated successfully', { 
      itemId,
      itemName: updatedItem.name,
      adminId: req.user?.uid 
    });

    return ApiResponse.success(res, {
      item: {
        id: updatedItem._id,
        name: updatedItem.name,
        desc: updatedItem.desc,
        price: updatedItem.price,
        gst: updatedItem.gst,
        qtyLeft: updatedItem.qtyLeft,
        isAvailable: updatedItem.isAvailable
      }
    }, "Item updated successfully");

  } catch (error) {
    logger.error('Update item failed', { 
      error: error.message,
      itemId: req.params?.itemId,
      adminId: req.user?.uid 
    });
    throw error;
  }
};

// ---------------------------------
// View all reported issues
export const getReportIssues = async (req, res) => {
  try {
    const { oid, phone, reportedDate, machineId, page = 1 } = req.query;

    logger.info('Get report issues request', { 
      adminId: req.user?.uid,
      filters: { oid, phone, reportedDate, machineId },
      page: parseInt(page)
    });

    // Validate pagination
    const pageNum = Validator.validateNumber(page, 'Page', { min: 1, integer: true });
    const limit = 10;
    const skip = (pageNum - 1) * limit;

    // Build query object
    const queryObject = {};
    
    if (oid) {
      Validator.validateObjectId(oid, 'Order ID');
      queryObject.oid = new mongoose.Types.ObjectId(oid);
    }
    
    if (machineId) {
      queryObject.machineId = { $regex: machineId, $options: "i" };
    }
    
    if (reportedDate) {
      const dateStart = new Date(`${reportedDate}T00:00:00.000Z`);
      const dateEnd = new Date(`${reportedDate}T23:59:59.999Z`);
      queryObject.createdAt = { $gte: dateStart, $lte: dateEnd };
    }

    logger.debug('Report issues query built', { queryObject, pagination: { page: pageNum, limit, skip } });

    // Aggregation pipeline
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
          from: "orders",
          localField: "oid",
          foreignField: "_id",
          as: "orderData"
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
          ...queryObject,
          ...(phone && { "userData.phone": { $regex: phone, $options: "i" } })
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          reportId: "$_id",
          oid: "$oid",
          phone: { $first: "$userData.phone" },
          machineId: { $first: "$machineData.mid" },
          machineName: { $first: "$machineData.name" },
          description: 1,
          imgUrl: 1,
          reportedDate: "$createdAt",
          status: { $ifNull: ["$status", "OPEN"] }
        }
      }
    ];

    const [issues, totalIssues] = await Promise.all([
      DatabaseUtil.aggregate(reportIssueModel, pipeline),
      DatabaseUtil.countDocuments(reportIssueModel, queryObject)
    ]);

    const numOfPages = Math.ceil(totalIssues / limit);

    logger.info('Report issues retrieved', { 
      count: issues.length,
      totalIssues,
      numOfPages,
      currentPage: pageNum
    });

    return ApiResponse.success(res, {
      issues,
      pagination: {
        currentPage: pageNum,
        totalIssues,
        numOfPages,
        hasNextPage: pageNum < numOfPages,
        hasPrevPage: pageNum > 1
      }
    }, "Report issues retrieved successfully");

  } catch (error) {
    logger.error('Get report issues failed', { 
      error: error.message,
      adminId: req.user?.uid,
      query: req.query 
    });
    throw error;
  }
};

// ---------------------------------
// Admin registration
export const registerAdmin = async (req, res) => {
  try {
    const { email, password, location, name } = req.body;
    
    logger.info('Admin registration attempt', { 
      email: email?.substring(0, 5) + '***',
      location 
    });

    // Validate input
    Validator.validateRequired(['email', 'password'], { email, password });
    Validator.validateEmail(email);
    Validator.validateString(password, 'Password', { minLength: 8 });
    
    if (name) {
      Validator.validateString(name, 'Name', { minLength: 2, maxLength: 100 });
    }
    
    if (location) {
      Validator.validateString(location, 'Location', { maxLength: 200 });
    }

    // Check for existing admin
    const existing = await DatabaseUtil.findOne(Admin, { email });
    if (existing) {
      logger.warn('Admin registration failed - email exists', { email });
      throw new ConflictError("Email already exists");
    }

    const adminData = {
      email: email.toLowerCase(),
      password, // Will be hashed by the model
      location: location ? Validator.sanitizeInput(location) : '',
      name: name ? Validator.sanitizeInput(name) : '',
      createdAt: new Date(),
      isActive: true
    };

    const admin = await DatabaseUtil.create(Admin, adminData);
    const token = admin.createJwt();

    logger.info('Admin registered successfully', { 
      adminId: admin._id,
      email: email.substring(0, 5) + '***' 
    });

    return ApiResponse.created(res, {
      admin: { 
        uid: admin._id, 
        email: admin.email,
        name: admin.name,
        location: admin.location
      },
      token
    }, "Admin registered successfully");

  } catch (error) {
    logger.error('Admin registration failed', { 
      error: error.message,
      email: req.body?.email?.substring(0, 5) + '***' 
    });
    throw error;
  }
};

// ---------------------------------
// Admin login
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    logger.info('Admin login attempt', { 
      email: email?.substring(0, 5) + '***',
      ip: req.ip 
    });

    // Validate input
    Validator.validateRequired(['email', 'password'], { email, password });
    Validator.validateEmail(email);
    Validator.validateString(password, 'Password', { minLength: 1 });

    // Find and authenticate admin
    const admin = await DatabaseUtil.findOne(Admin, { 
      email: email.toLowerCase() 
    }, { throwIfNotFound: true });

    if (!admin.isActive) {
      logger.warn('Login attempt on inactive admin account', { 
        adminId: admin._id,
        email: email.substring(0, 5) + '***' 
      });
      throw new UnauthenticatedError("Account is disabled");
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn('Admin login failed - invalid password', { 
        adminId: admin._id,
        email: email.substring(0, 5) + '***',
        ip: req.ip 
      });
      throw new UnauthenticatedError("Invalid credentials");
    }

    // Update last login
    await DatabaseUtil.updateById(Admin, admin._id, {
      lastLoginAt: new Date(),
      lastLoginIp: req.ip
    });

    const token = admin.createJwt();

    logger.info('Admin login successful', { 
      adminId: admin._id,
      email: email.substring(0, 5) + '***' 
    });

    return ApiResponse.success(res, {
      admin: { 
        uid: admin._id, 
        email: admin.email,
        name: admin.name,
        location: admin.location
      },
      token
    }, "Admin login successful");

  } catch (error) {
    logger.error('Admin login failed', { 
      error: error.message,
      email: req.body?.email?.substring(0, 5) + '***',
      ip: req.ip 
    });
    throw error;
  }
};

// ---------------------------------
// Get all admins with pagination and filters
export const getAllAdmins = async (req, res) => {
  try {
    const { email, location, page = 1, isActive } = req.query;

    logger.info('Get all admins request', { 
      requestorId: req.user?.uid,
      filters: { email, location, isActive },
      page: parseInt(page) 
    });

    // Validate pagination
    const pageNum = Validator.validateNumber(page, 'Page', { min: 1, integer: true });
    const limit = 10;
    const skip = (pageNum - 1) * limit;

    // Build query
    const query = {};
    
    if (email) {
      query.email = { $regex: email, $options: "i" };
    }
    
    if (location) {
      query.location = { $regex: location, $options: "i" };
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const [admins, total] = await Promise.all([
      DatabaseUtil.find(Admin, query, {
        select: "-password -__v",
        sort: { createdAt: -1 },
        limit,
        skip
      }),
      DatabaseUtil.countDocuments(Admin, query)
    ]);

    const numOfPages = Math.ceil(total / limit);

    logger.info('Admins retrieved successfully', { 
      count: admins.length,
      total,
      numOfPages,
      currentPage: pageNum 
    });

    return ApiResponse.success(res, {
      admins: admins.map(admin => ({
        uid: admin._id,
        email: admin.email,
        name: admin.name,
        location: admin.location,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
        lastLoginAt: admin.lastLoginAt
      })),
      pagination: {
        currentPage: pageNum,
        total,
        numOfPages,
        hasNextPage: pageNum < numOfPages,
        hasPrevPage: pageNum > 1
      }
    }, "Admins retrieved successfully");

  } catch (error) {
    logger.error('Get all admins failed', { 
      error: error.message,
      requestorId: req.user?.uid,
      query: req.query 
    });
    throw error;
  }
};

// ---------------------------------
// Machine registration (admin only)
export const registerMachine = async (req, res) => {
  try {
    const { mid, password, location, ipAddress, name } = req.body;
    
    logger.info('Machine registration attempt', { 
      mid,
      location,
      adminId: req.user?.uid 
    });

    // Validate input
    Validator.validateRequired(['mid', 'password', 'location', 'ipAddress'], 
      { mid, password, location, ipAddress });
    
    Validator.validateMachineId(mid);
    Validator.validateString(password, 'Password', { minLength: 8 });
    Validator.validateString(location, 'Location', { minLength: 3, maxLength: 200 });
    
    // Basic IP validation
    // Simplified IP validation - basic format check
    const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (!ipRegex.test(ipAddress)) {
      throw new ValidationError("Invalid IP address format");
    }

    if (name) {
      Validator.validateString(name, 'Name', { maxLength: 100 });
    }

    // Check for existing machine
    const exists = await DatabaseUtil.findOne(Machine, { mid });
    if (exists) {
      logger.warn('Machine registration failed - MID exists', { mid, adminId: req.user?.uid });
      throw new ConflictError("Machine ID already exists");
    }

    const machineData = {
      mid: mid.toUpperCase(),
      password, // Will be hashed by the model
      location: Validator.sanitizeInput(location),
      ipAddress,
      name: name ? Validator.sanitizeInput(name) : '',
      mstatus: "IDLE",
      isActive: true,
      createdBy: req.user?.uid,
      createdAt: new Date()
    };

    const machine = await DatabaseUtil.create(Machine, machineData);
    const token = machine.createJwt();

    logger.info('Machine registered successfully', { 
      machineId: machine._id,
      mid: machine.mid,
      adminId: req.user?.uid 
    });

    return ApiResponse.created(res, {
      machine: {
        mid: machine.mid,
        name: machine.name,
        location: machine.location,
        mstatus: machine.mstatus,
        ipAddress: machine.ipAddress,
        isActive: machine.isActive
      },
      token
    }, "Machine registered successfully");

  } catch (error) {
    logger.error('Machine registration failed', { 
      error: error.message,
      mid: req.body?.mid,
      adminId: req.user?.uid 
    });
    throw error;
  }
};

// ---------------------------------
// Get all machines (admin only)
export const getAllMachines = async (req, res) => {
  try {
    const { mid, mstatus, location, page = 1, isActive } = req.query;

    logger.info('Get all machines request', { 
      adminId: req.user?.uid,
      filters: { mid, mstatus, location, isActive },
      page: parseInt(page) 
    });

    // Validate pagination
    const pageNum = Validator.validateNumber(page, 'Page', { min: 1, integer: true });
    const limit = 10;
    const skip = (pageNum - 1) * limit;

    // Build query
    const query = {};
    
    if (mid) {
      query.mid = { $regex: mid, $options: "i" };
    }
    
    if (location) {
      query.location = { $regex: location, $options: "i" };
    }
    
    if (mstatus && mstatus !== "ALL") {
      query.mstatus = mstatus;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const [machines, total] = await Promise.all([
      DatabaseUtil.find(Machine, query, {
        select: "-password -__v",
        sort: { createdAt: -1 },
        limit,
        skip
      }),
      DatabaseUtil.countDocuments(Machine, query)
    ]);

    const numOfPages = Math.ceil(total / limit);

    logger.info('Machines retrieved successfully', { 
      count: machines.length,
      total,
      numOfPages,
      currentPage: pageNum 
    });

    return ApiResponse.success(res, {
      machines: machines.map(machine => ({
        id: machine._id,
        mid: machine.mid,
        name: machine.name,
        location: machine.location,
        mstatus: machine.mstatus,
        ipAddress: machine.ipAddress,
        isActive: machine.isActive,
        createdAt: machine.createdAt,
        lastLoginAt: machine.lastLoginAt
      })),
      pagination: {
        currentPage: pageNum,
        total,
        numOfPages,
        hasNextPage: pageNum < numOfPages,
        hasPrevPage: pageNum > 1
      }
    }, "Machines retrieved successfully");

  } catch (error) {
    logger.error('Get all machines failed', { 
      error: error.message,
      adminId: req.user?.uid,
      query: req.query 
    });
    throw error;
  }
};
