import { StatusCodes } from "http-status-codes";
import { BadRequestError, NotFoundError, UnauthenticatedError } from "../utils/errors.js";
import Machine from "../models/machineModel.js";
import Order from "../models/orderModel.js";
import mongoose from "mongoose";

// ----------------------------------------------------------------------------
// Machine Login
export const machineLogin = async (req, res) => {
  const { mid, password } = req.body;
  if (!mid || !password) throw new BadRequestError("Enter all fields");

  const machine = await Machine.findOne({ mid });
  if (!machine || !(await machine.comparePassword(password))) {
    throw new UnauthenticatedError("Invalid credentials");
  }

  const token = machine.createJwt();
  res.status(StatusCodes.OK).json({
    result: {
      machine: {
        mid: machine.mid,
        mstatus: machine.mstatus,
        location: machine.location,
        ipAddress: machine.ipAddress
      },
      token
    }
  });
};

// ----------------------------------------------------------------------------
// Create Machine (admin protected - done in adminController)
// NOT NEEDED HERE unless exposed without auth

// ----------------------------------------------------------------------------
// Get Machine by MID
export const getMachine = async (req, res) => {
  const { mid } = req.params;
  const machine = await Machine.findOne({ mid });
  if (!machine) throw new NotFoundError("Machine not found");

  res.status(StatusCodes.OK).json({
    result: {
      mid: machine.mid,
      mstatus: machine.mstatus,
      location: machine.location,
      ipAddress: machine.ipAddress
    }
  });
};

// ----------------------------------------------------------------------------
// Update IP Address (admin or machine itself)
export const updateIpAddress = async (req, res) => {
  const { mid } = req.params;
  const { ipAddress } = req.body;

  const updated = await Machine.findOneAndUpdate({ mid }, { ipAddress }, { new: true });
  if (!updated) throw new NotFoundError("Machine not found");

  res.status(StatusCodes.OK).json({ result: { ipAddress: updated.ipAddress } });
};

// ----------------------------------------------------------------------------
// Get IP Address
export const getIpAddress = async (req, res) => {
  const { mid } = req.params;
  const machine = await Machine.findOne({ mid });
  if (!machine) throw new NotFoundError("Machine not found");

  res.status(StatusCodes.OK).json({ result: machine.ipAddress });
};

// ----------------------------------------------------------------------------
// Start machine after scanning OTP (machineAuth protected)
export const startMachine = async (req, res) => {
  const { orderOtp, mid } = req.body;
  if (!orderOtp || !mid) throw new BadRequestError("Enter OTP and machine ID");

  const machine = await Machine.findOne({ mid });
  if (!machine) throw new NotFoundError("Machine not found");

  const order = await Order.findOne({ orderOtp, machineId: machine._id })
    .sort({ createdAt: -1 });

  if (
    !order ||
    !order.uid ||
    order.orderOtp === "" ||
    order.orderStatus !== "READY" ||
    order.orderCompleted
  ) {
    throw new BadRequestError("Invalid OTP or order status");
  }

  order.orderStatus = "PREPARING";
  order.orderOtp = "";
  order.orderCompleted = true;
  await order.save();

  res.status(StatusCodes.OK).json({ result: { order } });
};

// ----------------------------------------------------------------------------
// Mark order as completed after plate dispensed
export const plateDispensed = async (req, res) => {
  const { oid } = req.params;
  if (!mongoose.isValidObjectId(oid)) throw new BadRequestError("Invalid Order ID");

  const updatedOrder = await Order.findByIdAndUpdate(
    oid,
    { orderStatus: "COMPLETED" },
    { new: true }
  );

  if (!updatedOrder) throw new NotFoundError("Order not found");

  res.status(StatusCodes.OK).json({ result: "Plate marked as dispensed" });
};
