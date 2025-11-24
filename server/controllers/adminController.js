import mongoose from "mongoose";
import Item from "../models/itemModel.js";
import Order from "../models/orderModel.js";
import Payment from "../models/paymentModel.js";
import Admin from "../models/adminModel.js";
import Machine from "../models/machineModel.js";
import reportIssueModel from "../models/reportIssueModel.js";
import logger from "../utils/logger.js";
import { BadRequestError, UnauthenticatedError, ConflictError, NotFoundError } from "../utils/errors.js";
import { Validator } from "../utils/validation.js";
import DatabaseUtil from "../utils/database.js";
import ApiResponse from "../utils/response.js";
import { getOrderTimeline, getPaymentHistory } from "../utils/migrationHelpers.js";
import {
  refillMachinePuris,
  setMachinePuriQuantity,
  getMachinePuriStatus
} from "../utils/quantityUtils.js";

// ---------------------------------
// Get all items (for admin - includes unavailable items)
export const getAllItemsAdmin = async (req, res) => {
  try {
    logger.info('Admin fetching all menu items', {
      adminId: req.user?.uid
    });

    const items = await DatabaseUtil.find(Item,
      {},
      { select: "-__v", sort: { createdAt: -1 } }
    );

    logger.debug('All items retrieved for admin', {
      count: items.length,
      adminId: req.user?.uid
    });

    // Transform _id to id for frontend compatibility
    const transformedItems = items.map(item => ({
      id: item._id,
      name: item.name,
      desc: item.desc,
      imgUrl: item.imgUrl,
      price: item.price,
      gst: item.gst,
      puriPerPlate: item.puriPerPlate || 6,
      isAvailable: item.isAvailable ?? true
    }));

    return ApiResponse.success(res, {
      items: transformedItems
    }, "Items retrieved successfully");

  } catch (error) {
    logger.error('Failed to fetch items for admin', {
      error: error.message,
      adminId: req.user?.uid
    });
    throw error;
  }
};

// ---------------------------------
// Add new item
export const addItem = async (req, res) => {
  try {
    const { name, desc, imgUrl, price, gst, puriPerPlate, isAvailable } = req.body;

    logger.info('Add item request', {
      adminId: req.user?.uid,
      itemName: name,
      price,
      puriPerPlate
    });

    // Validate required fields (check for undefined/null, not falsy values)
    if (name === undefined || name === null || name === '') {
      throw new BadRequestError('Item name is required');
    }
    if (price === undefined || price === null) {
      throw new BadRequestError('Price is required');
    }
    if (gst === undefined || gst === null) {
      throw new BadRequestError('GST is required');
    }

    // Validate individual fields
    Validator.validateString(name, 'Item name', { minLength: 2, maxLength: 100 });
    Validator.validateNumber(price, 'Price', { min: 0, max: 10000 });
    Validator.validateNumber(gst, 'GST', { min: 0, max: 1000 });

    if (desc) {
      Validator.validateString(desc, 'Description', { maxLength: 500 });
    }

    if (puriPerPlate !== undefined) {
      Validator.validateNumber(puriPerPlate, 'Puri per plate', { min: 0, max: 100, integer: true });
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
      puriPerPlate: parseInt(puriPerPlate) || 6,
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
        puriPerPlate: item.puriPerPlate,
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
    const { name, desc, imgUrl, price, gst, isAvailable, puriPerPlate } = req.body;

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

    if (puriPerPlate !== undefined) {
      Validator.validateNumber(puriPerPlate, 'Puri per plate', { min: 0, max: 100, integer: true });
      updateData.puriPerPlate = parseInt(puriPerPlate);
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
        puriPerPlate: updatedItem.puriPerPlate,
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

// Upsert item (add or update based on presence of id)
export const upsertItem = async (req, res) => {
  try {
    const { id, name, desc, imgUrl, price, gst, isAvailable } = req.body;

    logger.info('Upsert item request', {
      itemId: id || 'new',
      adminId: req.user?.uid,
      itemName: name
    });

    // If id is provided, update existing item
    if (id) {
      // Validate item ID
      Validator.validateObjectId(id, 'Item ID');

      // Build update object with validation
      const updateData = {};

      if (name !== undefined) {
        Validator.validateString(name, 'Item name', { minLength: 2, maxLength: 100 });

        // Check if name is being changed and if new name already exists
        const existingItem = await DatabaseUtil.findOne(Item, {
          _id: { $ne: id },
          name: { $regex: new RegExp(`^${name}$`, 'i') }
        });

        if (existingItem) {
          logger.warn('Attempt to update item with duplicate name', {
            itemId: id,
            itemName: name,
            existingItemId: existingItem._id
          });
          throw new ConflictError("Item with this name already exists");
        }

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

      if (isAvailable !== undefined) {
        updateData.isAvailable = Boolean(isAvailable);
      }

      // Add audit fields
      updateData.updatedBy = req.user?.uid;
      updateData.updatedAt = new Date();

      // Check if item exists and update
      const updatedItem = await DatabaseUtil.updateById(Item, id, updateData, {
        throwIfNotFound: true
      });

      logger.info('Item updated successfully', {
        itemId: id,
        itemName: updatedItem.name,
        adminId: req.user?.uid
      });

      return ApiResponse.success(res, {
        item: {
          id: updatedItem._id,
          name: updatedItem.name,
          desc: updatedItem.desc,
          imgUrl: updatedItem.imgUrl,
          price: updatedItem.price,
          gst: updatedItem.gst,
          isAvailable: updatedItem.isAvailable
        }
      }, "Item updated successfully");

    } else {
      // Add new item
      // Validate required fields (check for undefined/null, not falsy values)
      if (name === undefined || name === null || name === '') {
        throw new BadRequestError('Item name is required');
      }
      if (price === undefined || price === null) {
        throw new BadRequestError('Price is required');
      }
      if (gst === undefined || gst === null) {
        throw new BadRequestError('GST is required');
      }

      // Validate individual fields
      Validator.validateString(name, 'Item name', { minLength: 2, maxLength: 100 });
      Validator.validateNumber(price, 'Price', { min: 0, max: 10000 });
      Validator.validateNumber(gst, 'GST', { min: 0, max: 1000 });

      if (desc) {
        Validator.validateString(desc, 'Description', { maxLength: 500 });
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
        puriPerPlate: 6, // Default value
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
          imgUrl: item.imgUrl,
          price: item.price,
          gst: item.gst,
          isAvailable: item.isAvailable
        }
      }, "Item created successfully");
    }

  } catch (error) {
    logger.error('Upsert item failed', {
      error: error.message,
      itemId: req.body?.id || 'new',
      adminId: req.user?.uid,
      itemName: req.body?.name
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
      location,
      authenticatedAdmin: req.user?.uid ? 'yes' : 'no'
    });

    // Security: Check if this is the first admin or if request is authenticated
    const adminCount = await Admin.countDocuments();

    if (adminCount > 0 && !req.user?.uid) {
      // Admins exist but request is not authenticated
      logger.warn('Unauthorized admin registration attempt blocked', {
        email: email?.substring(0, 5) + '***',
        adminCount
      });
      throw new UnauthorizedError("Admin registration requires authentication. Please contact an existing administrator.");
    }

    if (adminCount === 0) {
      logger.info('First admin registration - no authentication required', {
        email: email?.substring(0, 5) + '***'
      });
    } else {
      logger.info('New admin registration by authenticated admin', {
        email: email?.substring(0, 5) + '***',
        createdBy: req.user.uid
      });
    }

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
    const { email, location, page = 1 } = req.query;

    logger.info('Get all admins request', { 
      requestorId: req.user?.uid,
      filters: { email, location },
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
    let { mid, password, location, ipAddress, name } = req.body;

    logger.info('Machine registration attempt', {
      mid,
      location,
      adminId: req.user?.uid
    });

    // Validate input
    Validator.validateRequired(['mid', 'password', 'location', 'ipAddress'],
      { mid, password, location, ipAddress });

    mid = Validator.validateMachineId(mid); // Normalize to uppercase
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
      mid: mid,
      password, // Will be hashed by the model
      location: Validator.sanitizeInput(location),
      ipAddress,
      name: name ? Validator.sanitizeInput(name) : '',
      mstatus: "DISCONNECTED",
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

    // Filter by isActive - default to true (only show active machines)
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    } else {
      query.isActive = true; // Default: only show active machines
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
        puriQuantity: machine.puriQuantity || 0,
        lowQuantityThreshold: machine.lowQuantityThreshold || 30,
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

// ---------------------------------
// Update machine status (admin toggle online/offline)
export const updateMachineStatus = async (req, res) => {
  try {
    let { machineId } = req.params;
    const { mstatus } = req.body;

    logger.info('Machine status update request', {
      adminId: req.user?.uid,
      machineId,
      newStatus: mstatus
    });

    // Validate input
    Validator.validateRequired(['machineId', 'mstatus'], { machineId, mstatus });
    machineId = Validator.validateMachineId(machineId); // Normalize to uppercase

    // Validate status value
    const validStatuses = ['CONNECTED', 'DISCONNECTED'];
    if (!validStatuses.includes(mstatus)) {
      throw new BadRequestError(`Invalid machine status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Find and update machine
    const machine = await DatabaseUtil.findOne(Machine, { mid: machineId }, { throwIfNotFound: true });

    const oldStatus = machine.mstatus;
    machine.mstatus = mstatus;

    // Update lastPingedAt when setting to CONNECTED
    if (mstatus === 'CONNECTED') {
      machine.lastPingedAt = new Date();
    }

    await machine.save();

    logger.info('Machine status updated successfully', {
      machineId,
      oldStatus,
      newStatus: mstatus,
      adminId: req.user?.uid
    });

    return ApiResponse.success(res, {
      machine: {
        mid: machine.mid,
        name: machine.name,
        location: machine.location,
        mstatus: machine.mstatus,
        isActive: machine.isActive,
        lastPingedAt: machine.lastPingedAt
      }
    }, `Machine status updated to ${mstatus}`);

  } catch (error) {
    logger.error('Machine status update failed', {
      error: error.message,
      machineId: req.params?.machineId,
      adminId: req.user?.uid
    });
    throw error;
  }
};

// ---------------------------------
// Soft delete machine (deactivate)
export const softDeleteMachine = async (req, res) => {
  try {
    let { machineId } = req.params;

    logger.info('Soft delete machine request', {
      adminId: req.user?.uid,
      machineId
    });

    // Validate input
    Validator.validateRequired(['machineId'], { machineId });
    machineId = Validator.validateMachineId(machineId); // Normalize to uppercase

    // Find machine
    const machine = await DatabaseUtil.findOne(Machine, { mid: machineId }, { throwIfNotFound: true });

    // Check if already deleted
    if (!machine.isActive) {
      logger.warn('Attempt to delete already inactive machine', {
        machineId,
        adminId: req.user?.uid
      });
      return ApiResponse.success(res, {
        machine: {
          mid: machine.mid,
          isActive: machine.isActive
        }
      }, 'Machine is already inactive');
    }

    // Soft delete by setting isActive to false
    machine.isActive = false;
    machine.mstatus = 'DISCONNECTED'; // Also disconnect when deleting
    machine.deletedAt = new Date();
    machine.deletedBy = req.user?.uid || 'admin';

    await machine.save();

    logger.info('Machine soft deleted successfully', {
      machineId,
      adminId: req.user?.uid
    });

    return ApiResponse.success(res, {
      machine: {
        mid: machine.mid,
        isActive: machine.isActive,
        mstatus: machine.mstatus,
        deletedAt: machine.deletedAt
      }
    }, 'Machine deactivated successfully');

  } catch (error) {
    logger.error('Soft delete machine failed', {
      error: error.message,
      machineId: req.params?.machineId,
      adminId: req.user?.uid
    });
    throw error;
  }
};

// ---------------------------------
// Restore soft deleted machine (reactivate)
export const restoreMachine = async (req, res) => {
  try {
    let { machineId } = req.params;

    logger.info('Restore machine request', {
      adminId: req.user?.uid,
      machineId
    });

    // Validate input
    Validator.validateRequired(['machineId'], { machineId });
    machineId = Validator.validateMachineId(machineId); // Normalize to uppercase

    // Find machine
    const machine = await DatabaseUtil.findOne(Machine, { mid: machineId }, { throwIfNotFound: true });

    // Check if already active
    if (machine.isActive) {
      logger.warn('Attempt to restore already active machine', {
        machineId,
        adminId: req.user?.uid
      });
      return ApiResponse.success(res, {
        machine: {
          mid: machine.mid,
          isActive: machine.isActive
        }
      }, 'Machine is already active');
    }

    // Restore by setting isActive to true
    machine.isActive = true;
    machine.mstatus = 'DISCONNECTED'; // Set to disconnected, admin can manually connect
    machine.restoredAt = new Date();
    machine.restoredBy = req.user?.uid || 'admin';

    await machine.save();

    logger.info('Machine restored successfully', {
      machineId,
      adminId: req.user?.uid
    });

    return ApiResponse.success(res, {
      machine: {
        mid: machine.mid,
        isActive: machine.isActive,
        mstatus: machine.mstatus,
        restoredAt: machine.restoredAt
      }
    }, 'Machine reactivated successfully');

  } catch (error) {
    logger.error('Restore machine failed', {
      error: error.message,
      machineId: req.params?.machineId,
      adminId: req.user?.uid
    });
    throw error;
  }
};

// ---------------------------------
// Update order status manually (e.g., mark as READY)
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, reason } = req.body;
    const adminId = req.user?.uid;

    logger.info('Admin order status update request', { 
      adminId,
      orderId,
      newStatus: status,
      reason 
    });

    // Validate input
    Validator.validateRequired(['status'], { status });
    Validator.validateObjectId(orderId, 'Order ID');
    
    const validStatuses = ["PENDING", "PAID", "READY", "PREPARING", "COMPLETED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      throw new BadRequestError(`Invalid status. Valid statuses: ${validStatuses.join(', ')}`);
    }

    const order = await Order.findById(orderId)
      .populate('uid', 'phone email')
      .populate('machineId', 'mid name location');
      
    if (!order) {
      throw new NotFoundError("Order not found");
    }

    // Update order status using the new method with admin context
    await order.updateStatus(
      status,
      `admin:${adminId}`,
      reason || `Status updated by admin to ${status}`,
      {
        adminAction: true,
        previousStatus: order.orderStatus,
        updatedAt: new Date()
      }
    );

    logger.info('Order status updated by admin', {
      orderId,
      oldStatus: order.statusHistory[order.statusHistory.length - 2]?.status,
      newStatus: status,
      adminId
    });

    return ApiResponse.success(res, {
      order: {
        id: order._id,
        status: order.orderStatus,
        customer: order.uid,
        machine: order.machineId,
        amount: order.amount,
        statusInfo: order.getCurrentStatusInfo()
      }
    }, "Order status updated successfully");

  } catch (error) {
    logger.error('Update order status failed', { 
      error: error.message,
      orderId: req.params?.orderId,
      adminId: req.user?.uid 
    });
    throw error;
  }
};

// ---------------------------------
// Get order status history/timeline
export const getOrderStatusHistory = async (req, res) => {
  try {
    const { orderId } = req.params;
    const adminId = req.user?.uid;

    logger.info('Admin requesting order status history', { adminId, orderId });

    Validator.validateObjectId(orderId, 'Order ID');

    const timeline = await getOrderTimeline(orderId);

    return ApiResponse.success(res, {
      orderTimeline: timeline
    }, "Order timeline retrieved successfully");

  } catch (error) {
    logger.error('Get order status history failed', { 
      error: error.message,
      orderId: req.params?.orderId,
      adminId: req.user?.uid 
    });
    throw error;
  }
};

// ---------------------------------
// Get payment history
export const getPaymentStatusHistory = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const adminId = req.user?.uid;

    logger.info('Admin requesting payment status history', { adminId, paymentId });

    Validator.validateObjectId(paymentId, 'Payment ID');

    const history = await getPaymentHistory(paymentId);

    return ApiResponse.success(res, {
      paymentHistory: history
    }, "Payment history retrieved successfully");

  } catch (error) {
    logger.error('Get payment status history failed', { 
      error: error.message,
      paymentId: req.params?.paymentId,
      adminId: req.user?.uid 
    });
    throw error;
  }
};

// ---------------------------------
// Update payment status manually (e.g., for refunds)
export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, reason, refundInfo } = req.body;
    const adminId = req.user?.uid;

    logger.info('Admin payment status update request', { 
      adminId,
      paymentId,
      newStatus: status,
      reason 
    });

    // Validate input
    Validator.validateRequired(['status'], { status });
    Validator.validateObjectId(paymentId, 'Payment ID');
    
    const validStatuses = ["PENDING", "SUCCESS", "FAILURE", "CANCELLED", "REFUNDED"];
    if (!validStatuses.includes(status)) {
      throw new BadRequestError(`Invalid status. Valid statuses: ${validStatuses.join(', ')}`);
    }

    const payment = await Payment.findById(paymentId).populate('orderId');
      
    if (!payment) {
      throw new NotFoundError("Payment not found");
    }

    // Handle refund information
    if (status === 'REFUNDED' && refundInfo) {
      payment.refundInfo = {
        refundId: refundInfo.refundId,
        refundAmount: refundInfo.amount || payment.amount,
        refundReason: refundInfo.reason || reason,
        refundedAt: new Date()
      };
    }

    // Update payment status using the new method with admin context
    await payment.updateStatus(
      status,
      `admin:${adminId}`,
      reason || `Status updated by admin to ${status}`,
      {
        adminAction: true,
        previousStatus: payment.status,
        refundInfo: status === 'REFUNDED' ? payment.refundInfo : undefined
      }
    );

    logger.info('Payment status updated by admin', {
      paymentId,
      oldStatus: payment.statusHistory[payment.statusHistory.length - 2]?.status,
      newStatus: status,
      adminId
    });

    return ApiResponse.success(res, {
      payment: {
        id: payment._id,
        orderId: payment.orderId,
        status: payment.status,
        verified: payment.verified,
        amount: payment.amount,
        statusInfo: payment.getCurrentStatusInfo(),
        refundInfo: payment.refundInfo
      }
    }, "Payment status updated successfully");

  } catch (error) {
    logger.error('Update payment status failed', { 
      error: error.message,
      paymentId: req.params?.paymentId,
      adminId: req.user?.uid 
    });
    throw error;
  }
};

// ----------------------------------------------------------------------------
// Admin Manual Order Ready (for testing and manual control)
export const adminMarkOrderReady = async (req, res) => {
  try {
    const { orderId } = req.params;

    logger.info('Admin manual order ready request', { 
      orderId,
      adminId: req.user?.uid 
    });

    // Validate input
    Validator.validateObjectId(orderId, 'Order ID');

    // Find the order
    const order = await DatabaseUtil.findOne(Order, { 
      _id: orderId,
      orderStatus: "PREPARING",
      orderCompleted: false
    }, { 
      throwIfNotFound: true,
      populate: [
        { path: 'uid', select: 'phone' },
        { path: 'machineId', select: 'mid name location' }
      ]
    });

    // Use transaction to update order status
    await DatabaseUtil.transaction(async (session) => {
      // Update order status to ready for pickup
      const orderForUpdate = await Order.findById(order._id).session(session);
      await orderForUpdate.updateStatus(
        "READY_FOR_PICKUP",
        "admin",
        "Order manually marked ready by admin",
        {
          adminId: req.user?.uid,
          machineId: order.machineId?.mid,
          machineName: order.machineId?.name,
          location: order.machineId?.location,
          readyAt: new Date()
        }
      );
      
      await orderForUpdate.save({ session });

      // Update machine status if machine exists
      if (order.machineId) {
        await DatabaseUtil.updateById(Machine, order.machineId._id, {
          mstatus: "READY_FOR_PICKUP",
          currentOrderId: order._id,
          lastPreparationCompletedAt: new Date()
        }, { session });
      }
    });

    logger.info('Order manually marked ready by admin', { 
      orderId: order._id,
      adminId: req.user?.uid,
      machineId: order.machineId?.mid,
      userId: order.uid._id 
    });

    return ApiResponse.success(res, {
      orderId: order._id,
      status: "READY_FOR_PICKUP",
      userPhone: order.uid.phone?.substring(0, 6) + 'xxxx',
      machine: order.machineId?.mid
    }, "Order manually marked ready for pickup");

  } catch (error) {
    logger.error('Admin mark order ready failed', {
      error: error.message,
      orderId: req.params?.orderId,
      adminId: req.user?.uid
    });
    throw error;
  }
};

// ---------------------------------
// Puri Quantity Management
// ---------------------------------

// Refill machine puris (add to existing quantity)
export const refillMachinePurisEndpoint = async (req, res) => {
  try {
    const { machineId } = req.params;
    const { quantity } = req.body;

    logger.info('Admin refilling machine puris', {
      adminId: req.user?.uid,
      machineId,
      quantity
    });

    // Validate input
    Validator.validateRequired(['quantity'], { quantity });
    Validator.validateNumber(quantity, 'Quantity', { min: 1, max: 10000, integer: true });

    const result = await refillMachinePuris(machineId, quantity, {
      adminId: req.user?.uid,
      adminAction: 'refill',
      timestamp: new Date()
    });

    logger.info('Machine puris refilled successfully', {
      adminId: req.user?.uid,
      machineId: result.machineId,
      previousQuantity: result.previousQuantity,
      newQuantity: result.newQuantity,
      added: quantity
    });

    return ApiResponse.success(res, {
      machineId: result.machineId,
      previousQuantity: result.previousQuantity,
      newQuantity: result.newQuantity,
      quantityAdded: quantity
    }, "Machine puris refilled successfully");

  } catch (error) {
    logger.error('Refill machine puris failed', {
      error: error.message,
      machineId: req.params?.machineId,
      adminId: req.user?.uid
    });
    throw error;
  }
};

// Set machine puri quantity to specific value
export const setMachinePurisEndpoint = async (req, res) => {
  try {
    const { machineId } = req.params;
    const { quantity } = req.body;

    logger.info('Admin setting machine puri quantity', {
      adminId: req.user?.uid,
      machineId,
      quantity
    });

    // Validate input
    Validator.validateRequired(['quantity'], { quantity });
    Validator.validateNumber(quantity, 'Quantity', { min: 0, max: 10000, integer: true });

    const result = await setMachinePuriQuantity(machineId, quantity, {
      adminId: req.user?.uid,
      adminAction: 'set_quantity',
      timestamp: new Date()
    });

    logger.info('Machine puri quantity set successfully', {
      adminId: req.user?.uid,
      machineId: result.machineId,
      previousQuantity: result.previousQuantity,
      newQuantity: result.newQuantity
    });

    return ApiResponse.success(res, {
      machineId: result.machineId,
      previousQuantity: result.previousQuantity,
      newQuantity: result.newQuantity
    }, "Machine puri quantity set successfully");

  } catch (error) {
    logger.error('Set machine puri quantity failed', {
      error: error.message,
      machineId: req.params?.machineId,
      adminId: req.user?.uid
    });
    throw error;
  }
};

// Get machine puri status
export const getMachinePurisEndpoint = async (req, res) => {
  try {
    const { machineId } = req.params;

    logger.debug('Admin fetching machine puri status', {
      adminId: req.user?.uid,
      machineId
    });

    const status = await getMachinePuriStatus(machineId);

    logger.debug('Machine puri status retrieved', {
      adminId: req.user?.uid,
      machineId: status.machineId,
      currentQuantity: status.currentQuantity,
      isLowStock: status.isLowStock
    });

    return ApiResponse.success(res, {
      machine: status
    }, "Machine puri status retrieved successfully");

  } catch (error) {
    logger.error('Get machine puri status failed', {
      error: error.message,
      machineId: req.params?.machineId,
      adminId: req.user?.uid
    });
    throw error;
  }
};

// Bulk refill multiple machines
export const bulkRefillMachines = async (req, res) => {
  try {
    const { machines } = req.body; // Array of { machineId, quantity }

    logger.info('Admin bulk refilling machines', {
      adminId: req.user?.uid,
      machineCount: machines?.length
    });

    // Validate input
    Validator.validateRequired(['machines'], { machines });

    if (!Array.isArray(machines) || machines.length === 0) {
      throw new BadRequestError('Machines must be a non-empty array');
    }

    if (machines.length > 50) {
      throw new BadRequestError('Cannot refill more than 50 machines at once');
    }

    const results = [];
    const errors = [];

    for (const machine of machines) {
      try {
        const { machineId, quantity } = machine;

        Validator.validateRequired(['machineId', 'quantity'], machine);
        Validator.validateNumber(quantity, 'Quantity', { min: 1, max: 10000, integer: true });

        const result = await refillMachinePuris(machineId, quantity, {
          adminId: req.user?.uid,
          adminAction: 'bulk_refill',
          timestamp: new Date()
        });

        results.push({
          machineId: result.machineId,
          success: true,
          previousQuantity: result.previousQuantity,
          newQuantity: result.newQuantity,
          quantityAdded: quantity
        });

      } catch (error) {
        logger.error('Bulk refill failed for machine', {
          machineId: machine.machineId,
          error: error.message
        });

        errors.push({
          machineId: machine.machineId,
          success: false,
          error: error.message
        });
      }
    }

    logger.info('Bulk refill completed', {
      adminId: req.user?.uid,
      totalMachines: machines.length,
      successful: results.length,
      failed: errors.length
    });

    return ApiResponse.success(res, {
      totalMachines: machines.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors
    }, `Bulk refill completed: ${results.length} successful, ${errors.length} failed`);

  } catch (error) {
    logger.error('Bulk refill machines failed', {
      error: error.message,
      adminId: req.user?.uid
    });
    throw error;
  }
};

// Update machine low quantity threshold
export const updateMachineLowQuantityThreshold = async (req, res) => {
  try {
    const { machineId } = req.params;
    const { threshold } = req.body;

    logger.info('Admin updating machine low quantity threshold', {
      adminId: req.user?.uid,
      machineId,
      threshold
    });

    // Validate input
    Validator.validateRequired(['threshold'], { threshold });
    Validator.validateNumber(threshold, 'Threshold', { min: 0, max: 1000, integer: true });

    // Find machine by ObjectId or mid
    let machine;
    if (machineId.length === 24) {
      machine = await DatabaseUtil.findById(Machine, machineId);
    } else {
      machine = await DatabaseUtil.findOne(Machine, { mid: machineId.toUpperCase() });
    }

    if (!machine) {
      throw new NotFoundError('Machine not found');
    }

    const previousThreshold = machine.lowQuantityThreshold;
    machine.lowQuantityThreshold = threshold;
    await machine.save();

    logger.info('Machine low quantity threshold updated successfully', {
      adminId: req.user?.uid,
      machineId: machine.mid,
      previousThreshold,
      newThreshold: threshold
    });

    return ApiResponse.success(res, {
      machineId: machine.mid,
      previousThreshold,
      newThreshold: threshold,
      currentQuantity: machine.puriQuantity || 0,
      isLowStock: (machine.puriQuantity || 0) < threshold
    }, "Machine threshold updated successfully");

  } catch (error) {
    logger.error('Update machine threshold failed', {
      error: error.message,
      machineId: req.params?.machineId,
      adminId: req.user?.uid
    });
    throw error;
  }
};

// ---------------------------------
// Verify Order (Manual Verification)
// Transitions order from PAID → OTP_VERIFIED
// Used when auto-verification is disabled
export const verifyOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    logger.info('Admin verifying order', {
      adminId: req.user?.uid,
      orderId
    });

    // Find order
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Validate order is in PAID status
    if (order.orderStatus !== 'PAID') {
      throw new BadRequestError(`Order cannot be verified. Current status: ${order.orderStatus}. Only PAID orders can be verified.`);
    }

    // Verify order (transitions to OTP_VERIFIED)
    await order.updateStatus(
      'OTP_VERIFIED',
      `admin:${req.user?.uid}`,
      'Order manually verified by admin',
      {
        verifiedAt: new Date(),
        verifiedBy: req.user?.uid
      }
    );

    logger.info('Order verified successfully', {
      adminId: req.user?.uid,
      orderId: order._id,
      orderCounter: order.orderCounter
    });

    return ApiResponse.success(res, {
      orderId: order._id,
      orderCounter: order.orderCounter,
      status: order.orderStatus,
      machineId: order.machineId,
      verifiedAt: new Date()
    }, "Order verified successfully - ready for machine processing");

  } catch (error) {
    logger.error('Verify order failed', {
      error: error.message,
      orderId: req.params?.orderId,
      adminId: req.user?.uid
    });
    throw error;
  }
};

// ---------------------------------
// Start Preparation (Admin/Testing)
// Transitions order from OTP_VERIFIED → PREPARING
// Used for testing; normally firmware does this
export const startPreparation = async (req, res) => {
  try {
    const { orderId } = req.params;

    logger.info('Admin starting preparation', {
      adminId: req.user?.uid,
      orderId
    });

    // Find order
    const order = await Order.findById(orderId).populate('machineId', 'mid name');

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Validate order is in OTP_VERIFIED status
    if (order.orderStatus !== 'OTP_VERIFIED') {
      throw new BadRequestError(`Order cannot start preparation. Current status: ${order.orderStatus}. Only OTP_VERIFIED orders can start preparation.`);
    }

    // Start preparation (transitions to PREPARING)
    await order.updateStatus(
      'PREPARING',
      `admin:${req.user?.uid}`,
      'Preparation started manually by admin for testing',
      {
        prepStartedAt: new Date(),
        startedBy: req.user?.uid
      }
    );

    logger.info('Preparation started successfully', {
      adminId: req.user?.uid,
      orderId: order._id,
      orderCounter: order.orderCounter,
      machineId: order.machineId?.mid
    });

    return ApiResponse.success(res, {
      orderId: order._id,
      orderCounter: order.orderCounter,
      status: order.orderStatus,
      machineId: order.machineId?.mid,
      machineName: order.machineId?.name,
      prepStartedAt: new Date()
    }, "Preparation started successfully");

  } catch (error) {
    logger.error('Start preparation failed', {
      error: error.message,
      orderId: req.params?.orderId,
      adminId: req.user?.uid
    });
    throw error;
  }
};
