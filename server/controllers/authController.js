import { StatusCodes } from "http-status-codes";
import User from "../models/userModel.js";
import { BadRequestError, UnauthenticatedError } from "../utils/errors.js";

// ----------------------------------------------------------------
// Anonymous registration (for testing or fallback use only)
export const anonRegister = async (req, res) => {
  const user = await User.create({ phone: "9999999999" });
  const token = user.createJwt();

  res.status(StatusCodes.CREATED).json({
    user: { uid: user._id, phone: user.phone },
    token,
  });
};

// ----------------------------------------------------------------
// Send OTP via SMS (currently mock, 2Factor integration optional)
export const phoneSendOtp = async (req, res) => {
  const { phone } = req.body;
  if (!phone) throw new BadRequestError("Phone number is required");

  const OTP = Math.floor(1000 + Math.random() * 9000);

  const user = await User.findOneAndUpdate(
    { phone },
    { phone, OTP },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // 📝 Optional: integrate with SMS service like 2Factor
  // const url = `https://2factor.in/API/V1/${process.env.SMS_SECRET_KEY}/SMS/+91${phone}/${OTP}/golbot`;
  // await axios.get(url);

  res.status(StatusCodes.OK).json({
    message: "OTP sent successfully",
    user: { phone: user.phone }
  });
};

// ----------------------------------------------------------------
// Verify OTP (validates and issues JWT)
export const verifyOtp = async (req, res) => {
  const { phone, OTP } = req.body;
  if (!phone || !OTP) throw new BadRequestError("Phone and OTP are required");

  const user = await User.findOne({ phone });

  // 🔒 Enable real OTP check
  if (!user || user.OTP !== OTP.toString()) {
    throw new UnauthenticatedError("Invalid OTP");
  }

  user.verified = true;
  user.OTP = undefined;
  await user.save();

  const token = user.createJwt();
  res.status(StatusCodes.OK).json({
    message: "OTP verified successfully",
    user: { uid: user._id, phone: user.phone },
    token
  });
};
