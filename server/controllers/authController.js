import { StatusCodes } from "http-status-codes"
import User from "../models/userModel.js"
import { BadRequestError, UnauthenticatedError } from "../utils/errors.js"
import Admin from "../models/adminModel.js"
import Machine from "../models/machineModel.js"

export const anonRegister = async (req, res) => {
  const user = await User.create({ phone: "7089764567" })

  const token = user.createJwt()

  res.status(StatusCodes.CREATED).json({ user: { uid: user._id }, token })
}

export const phoneSendOtp = async (req, res) => {
  const { phone } = req.body

  if (!phone) throw new BadRequestError("Enter all Fields")

  // Math.floor(Math.random() * (max - min + 1) + min);
  const OTP = Math.floor(Math.random() * (9999 - 1000 + 1) + 1000)

  const user = await User.findOneAndUpdate(
    { phone },
    { phone, OTP },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  var config = {
    method: "get",
    maxBodyLength: Infinity,
    url: `https://2factor.in/API/V1/${process.env.SMS_SECRET_KEY}/SMS/+91${phone}/${OTP}/golbot`,
    headers: {},
  }

  // await axios(config)
  //   .then(function (response) {
  //     console.log(JSON.stringify(response.data));
  //     res.status(StatusCodes.OK).json({ user: { phone: user.phone } });
  //   })
  //   .catch(function (error) {
  //     console.log(error);
  //     throw new Error("Something went wrong");
  //   });
  res.status(StatusCodes.OK).json({ user: { phone: user.phone } })
}

export const verifyOtp = async (req, res) => {
  const { phone, OTP } = req.body

  if (!phone) throw new BadRequestError("Enter all Fields")
  if (phone.length !== 10) throw new BadRequestError("Invalid Phone")

  // TODO: enable otp
  // const user = await User.findOne({ phone });
  // // const user = await User.findOne({ phone, OTP });

  // if (!user) throw new UnauthenticatedError("Invalid OTP");

  // user.OTP = "";
  // user.verified = true;
  // await user.save();

  const user = await User.findOneAndUpdate(
    { phone },
    { verified: true },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  const token = user.createJwt()

  res.status(StatusCodes.OK).json({ user: { phone: user.phone }, token })
}

// ----------------------------------------------------------------------------

export const adminRegister = async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) throw new BadRequestError("Enter all fields")

  if (await Admin.findOne({ email }))
    throw new BadRequestError("Email already Exists")

  const admin = await Admin.create({ email, password })

  const token = admin.createJwt()

  res
    .status(StatusCodes.CREATED)
    .json({ admin: { uid: admin._id, email: admin.email }, token })
}

export const adminLogin = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) throw new BadRequestError("Enter all fields")

  const admin = await Admin.findOne({ email })

  if (!admin) throw new UnauthenticatedError("Invalid Credentials")

  const passwordsMatch = await admin.comparePassword(password)
  if (!passwordsMatch) throw new UnauthenticatedError("Invalid Credentials")

  const token = admin.createJwt()

  res
    .status(StatusCodes.OK)
    .json({ admin: { uid: admin._id, email: admin.email }, token })
}

export const getAllAdmins = async (req, res) => {
  const { email, location } = req.query

  const queryObject = {}

  if (email) {
    queryObject.email = { $regex: email, $options: "i" }
  }
  if (location) {
    queryObject.location = { $regex: location, $options: "i" }
  }

  // pagination
  const page = Number(req.query.page) || 1
  const limit = 10
  const skip = (page - 1) * limit

  const admins = await Admin.find(queryObject)
    .select(["-_id", "-password", "-updatedAt", "-__v"])
    .sort("-createdAt")
    .skip(skip)
    .limit(limit)

  const totalAdmins = await Admin.countDocuments(queryObject)
  const numOfPages = Math.ceil(totalAdmins / limit)
  res
    .status(StatusCodes.OK)
    .json({ result: { admins, totalAdmins, numOfPages } })
}

// ----------------------------------------------------------------
export const machineRegister = async (req, res) => {
  const { mid, password } = req.body

  if (!mid || !password) throw new BadRequestError("Enter all fields")

  if (await Machine.findOne({ mid }))
    throw new BadRequestError("Machine already Exists")

  const machine = await Machine.create({ mid, password })

  const token = machine.createJwt()

  res.status(StatusCodes.CREATED).json({ result: { mid: machine.mid }, token })
}

export const machineLogin = async (req, res) => {
  const { mid, password } = req.body

  if (!mid || !password) throw new BadRequestError("Enter all fields")

  const machine = await Machine.findOne({ mid })

  if (!machine) throw new UnauthenticatedError("Invalid Credentials")

  const passwordsMatch = await machine.comparePassword(password)
  if (!passwordsMatch) throw new UnauthenticatedError("Invalid Credentials")

  const token = machine.createJwt()

  res.status(StatusCodes.OK).json({ result: { mid: machine.mid }, token })
}

export const getAllMachines = async (req, res) => {
  const { mid, mstatus, location } = req.query

  const queryObject = {}

  if (mid) {
    queryObject.mid = { $regex: mid, $options: "i" }
  }
  if (location) {
    queryObject.location = { $regex: location, $options: "i" }
  }
  if (mstatus && mstatus !== "ALL") queryObject.mstatus = mstatus

  // pagination
  const page = Number(req.query.page) || 1
  const limit = 10
  const skip = (page - 1) * limit

  const machines = await Machine.find(queryObject)
    .select(["-_id", "-password", "-updatedAt", "-__v"])
    .sort("-createdAt")
    .skip(skip)
    .limit(limit)

  const totalMachines = await Machine.countDocuments(queryObject)
  const numOfPages = Math.ceil(totalMachines / limit)

  res
    .status(StatusCodes.OK)
    .json({ result: { machines, totalMachines, numOfPages } })
}

// ------------------------------------------------------------------
