import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import Item from "../models/itemModel.js";
import Admin from "../models/adminModel.js";
import Machine from "../models/machineModel.js";
import reportIssueModel from "../models/reportIssueModel.js";
import { BadRequestError, UnauthenticatedError } from "../utils/errors.js";

// ---------------------------------
// Add new item
export const addItem = async (req, res) => {
  const { name, desc, imgUrl, price, gst, qtyLeft, isAvailable } = req.body;

  if (!name || price == null || gst == null) {
    throw new BadRequestError("Name, price, and gst are required");
  }

  const item = await Item.create({
    name,
    desc,
    imgUrl,
    price,
    gst,
    qtyLeft: qtyLeft || 0,
    isAvailable: isAvailable !== undefined ? isAvailable : true,
  });

  res.status(StatusCodes.CREATED).json({ result: item });
};

// Update item details
export const updateItem = async (req, res) => {
  const { itemId } = req.params;
  const { name, desc, imgUrl, price, gst, isAvailable, qtyLeft } = req.body;

  if (!itemId) throw new BadRequestError("Item ID missing");

  await Item.findByIdAndUpdate(itemId, {
    name,
    desc,
    imgUrl,
    price,
    gst,
    isAvailable,
    qtyLeft
  });

  res.status(StatusCodes.OK).json({ result: "Item updated successfully" });
};

// ---------------------------------
// View all reported issues
export const getReportIssues = async (req, res) => {
  const { oid, phone, reportedDate, machineId } = req.query;

  const queryObject = {};
  if (oid && mongoose.isValidObjectId(oid)) queryObject.oid = new mongoose.Types.ObjectId(oid);
  if (machineId) queryObject.machineId = { $regex: machineId, $options: "i" };
  if (reportedDate) {
    queryObject.createdAt = {
      $gte: new Date(`${reportedDate}T00:00:00.000Z`),
      $lte: new Date(`${reportedDate}T23:59:59.999Z`)
    };
  }

  const page = Number(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const issues = await reportIssueModel.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "uid",
        foreignField: "_id",
        as: "userData"
      }
    },
    { $skip: skip },
    { $limit: limit },
    { $sort: { createdAt: -1 } },
    {
      $match: {
        ...queryObject,
        "userData.phone": { $regex: phone || "", $options: "i" }
      }
    },
    {
      $project: {
        _id: 0,
        oid: "$oid",
        phone: { $first: "$userData.phone" },
        machineId: 1,
        description: 1,
        imgUrl: 1,
        reportedDate: "$createdAt"
      }
    }
  ]);

  res.status(StatusCodes.OK).json({ result: { issues } });
};

// ---------------------------------
// Admin registration
export const registerAdmin = async (req, res) => {
  const { email, password, location } = req.body;
  if (!email || !password) throw new BadRequestError("Email and password required");

  const existing = await Admin.findOne({ email });
  if (existing) throw new BadRequestError("Email already exists");

  const admin = await Admin.create({ email, password, location });
  const token = admin.createJwt();

  res.status(StatusCodes.CREATED).json({ admin: { uid: admin._id, email }, token });
};

// ---------------------------------
// Admin login
export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new BadRequestError("Email and password required");

  const admin = await Admin.findOne({ email });
  if (!admin || !(await admin.comparePassword(password))) {
    throw new UnauthenticatedError("Invalid credentials");
  }

  const token = admin.createJwt();
  res.status(StatusCodes.OK).json({ admin: { uid: admin._id, email }, token });
};

// ---------------------------------
// Get all admins with pagination and filters
export const getAllAdmins = async (req, res) => {
  const { email, location, page = 1 } = req.query;
  const query = {};

  if (email) query.email = { $regex: email, $options: "i" };
  if (location) query.location = { $regex: location, $options: "i" };

  const limit = 10;
  const skip = (Number(page) - 1) * limit;

  const admins = await Admin.find(query)
    .select("-password -__v -updatedAt")
    .sort("-createdAt")
    .skip(skip)
    .limit(limit);

  const total = await Admin.countDocuments(query);
  const numOfPages = Math.ceil(total / limit);

  res.status(StatusCodes.OK).json({ result: { admins, total, numOfPages } });
};

// ---------------------------------
// Machine registration (admin only)
export const registerMachine = async (req, res) => {
  const { mid, password, location, ipAddress } = req.body;
  if (!mid || !password || !location || !ipAddress) {
    throw new BadRequestError("All fields required");
  }

  const exists = await Machine.findOne({ mid });
  if (exists) throw new BadRequestError("Machine ID already exists");

  const machine = await Machine.create({ mid, password, location, ipAddress });
  const token = machine.createJwt();

  res.status(StatusCodes.CREATED).json({
    result: { mid: machine.mid, location: machine.location, mstatus: machine.mstatus, ipAddress },
    token
  });
};

// ---------------------------------
// Get all machines (admin only)
export const getAllMachines = async (req, res) => {
  const { mid, mstatus, location, page = 1 } = req.query;
  const query = {};

  if (mid) query.mid = { $regex: mid, $options: "i" };
  if (location) query.location = { $regex: location, $options: "i" };
  if (mstatus && mstatus !== "ALL") query.mstatus = mstatus;

  const limit = 10;
  const skip = (Number(page) - 1) * limit;

  const machines = await Machine.find(query)
    .select("-password -__v -updatedAt")
    .sort("-createdAt")
    .skip(skip)
    .limit(limit);

  const total = await Machine.countDocuments(query);
  const numOfPages = Math.ceil(total / limit);

  res.status(StatusCodes.OK).json({ result: { machines, total, numOfPages } });
};
