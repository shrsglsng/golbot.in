import mongoose from "mongoose";
import ReportIssue from "../models/reportIssueModel.js";
import Order from "../models/orderModel.js";
import Machine from "../models/machineModel.js";
import logger from "../utils/logger.js";
import { BadRequestError } from "../utils/errors.js";
import { Validator } from "../utils/validation.js";
import DatabaseUtil from "../utils/database.js";
import ApiResponse from "../utils/response.js";

import { generateReportId } from "../utils/reportUtils.js";

/**
 * Generate mailto link with prefilled template
 */
function generateMailtoLink(reportId, orderId, machineInfo) {
  // Always send to support email
  const recipientEmail = process.env.REPORT_SUPPORT_EMAIL || 'rakareve@gmail.com';
  const subject = orderId
    ? `GolBot Issue #${reportId} – Order ${orderId}`
    : `GolBot Issue #${reportId}`;

  const bodyLines = [
    `Dear GolBot Support Team,`,
    ``,
    `I would like to report an issue with my food experience.`,
    ``,
    `Report ID: ${reportId}`,
    orderId ? `Order ID: ${orderId}` : '',
    machineInfo ? `Machine/Location: ${machineInfo}` : '',
    ``,
    `Issue Description:`,
    `[Please describe what happened and what was wrong with your order]`,
    ``,
    ``,
    ``,
    `[Please attach photos or videos of the issue using the attachment button in your email app]`,
    ``,
    `Thank you,`,
  ].filter(Boolean).join('\n');

  const body = encodeURIComponent(bodyLines);

  return `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${body}`;
}

// ---------------------------------
// Start a new report (User endpoint)
export const startReport = async (req, res) => {
  try {
    const { orderId, machineId } = req.body;
    const userId = req.user?.uid; // Optional - might not be logged in

    logger.info('Report initiation request', {
      userId,
      orderId,
      machineId
    });

    // Validate orderId if provided
    let order = null;
    if (orderId) {
      Validator.validateObjectId(orderId, 'Order ID');
      order = await DatabaseUtil.findOne(Order, { _id: orderId });
      if (!order) {
        logger.warn('Report started with invalid order ID', { orderId });
      }
    }

    // Validate and resolve machineId if provided
    let machine = null;
    let machineInfo = '';
    if (machineId) {
      // Try as ObjectId first, then as mid string
      if (mongoose.Types.ObjectId.isValid(machineId)) {
        machine = await DatabaseUtil.findOne(Machine, { _id: machineId });
      } else {
        machine = await DatabaseUtil.findOne(Machine, { mid: machineId });
      }

      if (machine) {
        machineInfo = `${machine.mid} - ${machine.location}`;
      } else {
        logger.warn('Report started with invalid machine ID', { machineId });
      }
    }

    // Check maximum report limit per order (max 3 reports allowed)
    if (orderId) {
      const totalReportsCount = await ReportIssue.countDocuments({
        oid: order?._id
      });

      if (totalReportsCount >= 3) {
        logger.warn('Maximum report limit reached for order', {
          orderId,
          userId,
          totalReports: totalReportsCount
        });

        return ApiResponse.badRequest(res,
          'Maximum report limit reached. You can only create up to 3 reports per order. Please contact support for further assistance.'
        );
      }
    }

    // Check if a recent report already exists for this order to prevent duplicates
    // Look for reports created in the last 5 minutes for the same order
    if (orderId) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const existingReport = await ReportIssue.findOne({
        oid: order?._id,
        createdAt: { $gte: fiveMinutesAgo }
      }).sort({ createdAt: -1 });

      if (existingReport) {
        logger.info('Returning existing recent report instead of creating duplicate', {
          reportId: existingReport.reportId,
          userId,
          orderId
        });

        // Return existing report
        const recipientEmail = process.env.REPORT_SUPPORT_EMAIL || 'rakareve@gmail.com';
        const mailtoLink = generateMailtoLink(
          existingReport.reportId,
          orderId,
          machineInfo
        );

        return ApiResponse.success(res, {
          reportId: existingReport.reportId,
          mailtoLink,
          recipientEmail,
          isExisting: true
        }, "Using existing report from the last 5 minutes. Please attach photos and describe the issue in the email that opens.");
      }
    }

    // Generate unique report ID
    const reportId = await generateReportId();

    // Create report record
    const reportData = {
      reportId,
      uid: userId || null,
      oid: order?._id || null,
      machineId: machine?._id || null,
      status: 'initiated'
    };

    const report = await DatabaseUtil.create(ReportIssue, reportData);

    // Generate mailto link
    const recipientEmail = process.env.REPORT_SUPPORT_EMAIL || 'rakareve@gmail.com';
    const mailtoLink = generateMailtoLink(
      reportId,
      orderId,
      machineInfo
    );

    logger.info('Report created successfully', {
      reportId,
      userId,
      orderId,
      machineId: machine?.mid
    });

    return ApiResponse.created(res, {
      reportId,
      mailtoLink,
      recipientEmail
    }, "Report initiated successfully. Please attach photos and describe the issue in the email that opens.");

  } catch (error) {
    logger.error('Start report failed', {
      error: error.message,
      userId: req.user?.uid,
      body: req.body
    });
    throw error;
  }
};

// ---------------------------------
// Get all reports (Admin endpoint)
export const getAllReports = async (req, res) => {
  try {
    const { status, orderId, machineId, page = 1, seen } = req.query;

    logger.info('Get all reports request', {
      adminId: req.user?.uid,
      filters: { status, orderId, machineId },
      page: parseInt(page)
    });

    // Validate pagination
    const pageNum = Validator.validateNumber(page, 'Page', { min: 1, integer: true });
    const limit = 20;
    const skip = (pageNum - 1) * limit;

    // Build query
    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (orderId) {
      Validator.validateObjectId(orderId, 'Order ID');
      query.oid = orderId;
    }

    if (machineId) {
      // Support both ObjectId and mid string
      if (mongoose.Types.ObjectId.isValid(machineId)) {
        query.machineId = machineId;
      } else {
        const machine = await DatabaseUtil.findOne(Machine, { mid: machineId });
        if (machine) {
          query.machineId = machine._id;
        }
      }
    }

    if (seen !== undefined) {
      if (seen === 'true') {
        query.seen = true;
      } else {
        // For unseen, match both false and undefined (existing reports)
        query.$or = [
          { seen: false },
          { seen: { $exists: false } }
        ];
      }
    }

    const [reports, total] = await Promise.all([
      DatabaseUtil.find(ReportIssue, query, {
        populate: [
          { path: 'uid', select: 'phone email name' },
          { path: 'oid', select: 'orderCounter amount' },
          { path: 'machineId', select: 'mid location' }
        ],
        sort: { createdAt: -1 },
        limit,
        skip
      }),
      DatabaseUtil.countDocuments(ReportIssue, query)
    ]);

    const numOfPages = Math.ceil(total / limit);

    logger.info('Reports retrieved successfully', {
      count: reports.length,
      total,
      numOfPages,
      currentPage: pageNum
    });

    return ApiResponse.success(res, {
      reports: reports.map(report => ({
        reportId: report.reportId,
        orderId: report.oid?._id,
        orderCounter: report.oid?.orderCounter,
        machineId: report.machineId?.mid,
        machineLocation: report.machineId?.location,
        userId: report.uid?._id,
        userPhone: report.uid?.phone,
        status: report.status,
        seen: report.seen,
        emailMetadata: report.emailMetadata,
        description: report.description,
        imgUrl: report.imgUrl,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
      })),
      pagination: {
        currentPage: pageNum,
        total,
        numOfPages,
        hasNextPage: pageNum < numOfPages,
        hasPrevPage: pageNum > 1
      }
    }, "Reports retrieved successfully");

  } catch (error) {
    logger.error('Get all reports failed', {
      error: error.message,
      adminId: req.user?.uid,
      query: req.query
    });
    throw error;
  }
};

// ---------------------------------
// Get single report details (Admin endpoint)
export const getReportById = async (req, res) => {
  try {
    const { reportId } = req.params;

    logger.info('Get report by ID request', {
      adminId: req.user?.uid,
      reportId
    });

    Validator.validateRequired(['reportId'], { reportId });

    const report = await DatabaseUtil.findOne(
      ReportIssue,
      { reportId },
      {
        throwIfNotFound: true,
        populate: [
          { path: 'uid', select: 'phone email name' },
          { path: 'oid', select: 'orderCounter amount items orderStatus' },
          { path: 'machineId', select: 'mid location name' }
        ]
      }
    );

    logger.info('Report retrieved successfully', {
      reportId,
      status: report.status
    });

    const domain = process.env.REPORT_EMAIL_DOMAIN || 'golbot.in';

    // Fetch order items with details if order exists
    let orderItemsWithDetails = [];
    if (report.oid) {
      const OrderItem = mongoose.model('OrderItem');
      const Item = mongoose.model('Item');

      const orderItems = await OrderItem.find({ orderId: report.oid._id })
        .populate('itemId', 'name desc price gst imgUrl')
        .lean();

      orderItemsWithDetails = orderItems.map(orderItem => ({
        itemId: orderItem.itemId?._id,
        name: orderItem.itemId?.name || 'Unknown Item',
        quantity: orderItem.qty,
        priceAtOrderTime: orderItem.priceAtOrderTime,
        gstAtOrderTime: orderItem.gstAtOrderTime || 0
      }));
    }

    return ApiResponse.success(res, {
      report: {
        reportId: report.reportId,
        orderId: report.oid?._id,
        orderDetails: report.oid ? {
          orderCounter: report.oid.orderCounter,
          amount: report.oid.amount,
          items: orderItemsWithDetails,
          status: report.oid.orderStatus
        } : null,
        machineId: report.machineId?.mid,
        machineDetails: report.machineId ? {
          mid: report.machineId.mid,
          location: report.machineId.location,
          name: report.machineId.name
        } : null,
        userId: report.uid?._id,
        userDetails: report.uid ? {
          phone: report.uid.phone,
          email: report.uid.email,
          name: report.uid.name
        } : null,
        status: report.status,
        seen: report.seen,
        emailMetadata: report.emailMetadata,
        description: report.description,
        imgUrl: report.imgUrl,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        emailAddress: `reports+${report.reportId}@${domain}`
      }
    }, "Report details retrieved successfully");

  } catch (error) {
    logger.error('Get report by ID failed', {
      error: error.message,
      adminId: req.user?.uid,
      reportId: req.params?.reportId
    });
    throw error;
  }
};

// ---------------------------------
// Update report status (Admin endpoint)
export const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, emailMetadata } = req.body;

    logger.info('Update report status request', {
      adminId: req.user?.uid,
      reportId,
      newStatus: status
    });

    Validator.validateRequired(['reportId', 'status'], { reportId, status });

    const validStatuses = ['initiated', 'received', 'in_review', 'resolved'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestError(`Invalid status. Valid statuses: ${validStatuses.join(', ')}`);
    }

    const report = await DatabaseUtil.findOne(
      ReportIssue,
      { reportId },
      { throwIfNotFound: true }
    );

    report.status = status;

    // Update email metadata if provided
    if (emailMetadata) {
      report.emailMetadata = {
        ...report.emailMetadata,
        ...emailMetadata
      };
    }

    await report.save();

    logger.info('Report status updated successfully', {
      reportId,
      newStatus: status,
      adminId: req.user?.uid
    });

    return ApiResponse.success(res, {
      report: {
        reportId: report.reportId,
        status: report.status,
        emailMetadata: report.emailMetadata,
        updatedAt: report.updatedAt
      }
    }, `Report status updated to ${status}`);

  } catch (error) {
    logger.error('Update report status failed', {
      error: error.message,
      adminId: req.user?.uid,
      reportId: req.params?.reportId
    });
    throw error;
  }
};

// ---------------------------------
// Mark report as seen (Admin endpoint)
export const markReportAsSeen = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { seen = true } = req.body;

    logger.info('Mark report as seen request', {
      adminId: req.user?.uid,
      reportId,
      seen
    });

    Validator.validateRequired(['reportId'], { reportId });

    const report = await DatabaseUtil.findOne(
      ReportIssue,
      { reportId },
      { throwIfNotFound: true }
    );

    report.seen = seen;
    await report.save();

    logger.info('Report seen status updated', {
      reportId,
      seen,
      adminId: req.user?.uid
    });

    return ApiResponse.success(res, {
      report: {
        reportId: report.reportId,
        seen: report.seen,
        updatedAt: report.updatedAt
      }
    }, `Report marked as ${seen ? 'seen' : 'unseen'}`);

  } catch (error) {
    logger.error('Mark report as seen failed', {
      error: error.message,
      adminId: req.user?.uid,
      reportId: req.params?.reportId
    });
    throw error;
  }
};

// ---------------------------------
// Get reports for the current logged-in user
export const getMyReports = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      throw new BadRequestError("Authentication required");
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = { uid: userId };

    const [reports, total] = await Promise.all([
      ReportIssue.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('oid', 'orderCounter createdAt status amount')
        .populate('machineId', 'mid location'),
      ReportIssue.countDocuments(query)
    ]);

    return ApiResponse.success(res, {
      reports,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        numOfPages: Math.ceil(total / limit)
      }
    }, "Reports retrieved successfully");

  } catch (error) {
    logger.error('Get user reports failed', {
      error: error.message,
      userId: req.user?.uid
    });
    throw error;
  }
};

// ---------------------------------
// Get unseen reports count (Admin endpoint)
export const getUnseenCount = async (req, res) => {
  try {
    logger.info('Get unseen count request', {
      adminId: req.user?.uid
    });

    // Count reports where seen is false OR undefined (for existing reports)
    const count = await DatabaseUtil.countDocuments(ReportIssue, {
      $or: [
        { seen: false },
        { seen: { $exists: false } }
      ]
    });

    logger.info('Unseen count retrieved', {
      count,
      adminId: req.user?.uid
    });

    return ApiResponse.success(res, {
      count
    }, "Unseen count retrieved successfully");

  } catch (error) {
    logger.error('Get unseen count failed', {
      error: error.message,
      adminId: req.user?.uid
    });
    throw error;
  }
};

export default {
  startReport,
  getAllReports,
  getReportById,
  updateReportStatus,
  markReportAsSeen,
  getUnseenCount,
  getMyReports
};
