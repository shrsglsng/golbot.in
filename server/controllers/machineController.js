import { StatusCodes } from "http-status-codes";
import {
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
} from "../utils/errors.js";
import Order from "../models/orderModel.js";
import Machine from "../models/machineModel.js";

export const machineLogin = async (req, res) => {
  const { mid, password } = req.body;

  if (!mid || !password) throw new BadRequestError("Enter all fields");

  const machine = await Machine.findOne({ mid });
  if (!machine) throw new UnauthenticatedError("invalid credentials");

  if (!(await machine.comparePassword(password)))
    throw new UnauthenticatedError("invalid credentials");

  const token = machine.createJwt();
  res.status(StatusCodes.OK).json({
    result: {
      machine: { mid: machine.mid, mstatus: machine.mstatus },
      token,
    },
  });
};

// ----------------------------------------------------------------------------
export const createMachine = async (req, res) => {
  const { mid, password, location, ipAddress } = req.body;

  if (!mid || !password || !location || !ipAddress) {
    throw new BadRequestError("All fields (mid, password, location, ipAddress) are required");
  }

  const existing = await Machine.findOne({ mid });
  if (existing) {
    throw new BadRequestError("Machine with this ID already exists");
  }

  const machine = await Machine.create({ mid, password, location, ipAddress });

  const token = machine.createJwt();

  res.status(StatusCodes.CREATED).json({
    result: {
      machine: {
        mid: machine.mid,
        mstatus: machine.mstatus,
        location: machine.location,
        ipAddress: machine.ipAddress,
      },
      token,
    },
  });
};

// ----------------------------------------------------------------------------
export const getMachine = async (req, res) => {
  const { mid } = req.params;
  const machine = await Machine.findOne({ mid });

  if (!machine) throw new NotFoundError("Machine not found");

  res.status(StatusCodes.OK).json({ result: { mid } });
};

// ----------------------------------------------------------------------------
export const updateIpAddress = async (req, res) => {
  const { mid } = req.params;
  const { ipAddress } = req.body;

  const machine = await Machine.findOneAndUpdate({ mid }, { ipAddress });

  if (!machine) throw new NotFoundError("Machine not found");

  res.status(StatusCodes.OK).json({ result: "success" });
};

// ----------------------------------------------------------------------------
export const getIpAddress = async (req, res) => {
  const { mid } = req.params;
  const machine = await Machine.findOne({ mid });

  if (!machine) throw new NotFoundError("Machine not found");

  res.status(StatusCodes.OK).json({ result: machine.ipAddress });
};

// ----------------------------------------------------------------------------

export const startMachine = async (req, res) => {
  const { orderOtp, mid } = req.body;

  if (!orderOtp || !mid) throw new BadRequestError("Enter all values");

  const order = await Order.findOne({ orderOtp, machineId: mid })
    // .populate({
    //   path: "uid",
    //   match: {
    //     phone,
    //   },
    // })
    .sort({ created_at: -1 });

  if (!order) throw new BadRequestError("Invalid OTP");
  if (!order.uid) throw new BadRequestError("Invalid OTP");
  if (order.orderOtp == "") throw new BadRequestError("Invalid OTP");
  if (order.ostatus !== "READY") throw new BadRequestError("Invalid OTP");
  if (order.orderCompleted) throw new BadRequestError("Invalid OTP");

  order.ostatus = "PREPARING";
  order.orderOtp = "";
  order.orderCompleted = true;
  await order.save();

  res.status(StatusCodes.OK).json({ result: { order } });
};

// ---------------------------------------------------------------------------
export const plateDispensed = async (req, res) => {
  const { oid } = req.params;

  await Order.findOneAndUpdate(
    { _id: oid },
    { ostatus: "COMPLETED" },
    { new: true } //returns the updated data
  );

  res.status(StatusCodes.OK).json({ result: "successful" });
};

// ----------------------------------------------------------------------------
