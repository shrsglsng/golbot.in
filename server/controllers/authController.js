import axios from "axios";
import { StatusCodes } from "http-status-codes";
import User from "../models/userModel.js";
import crypto from "crypto";
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

  if (!phone) {
    throw new BadRequestError("Phone number is required");
  }

  const smsKey = process.env.SMS_SECRET_KEY;
  if (!smsKey) {
    throw new Error("SMS_SECRET_KEY is not configured in environment variables");
  }

  // Format phone to E.164
  const formattedPhone = phone.startsWith("+91") ? phone : `+91${phone}`;
  const otpTemplateName = "OTP1"; // Customize or leave blank

  try {
    const url = `https://2factor.in/API/V1/${smsKey}/SMS/${formattedPhone}/AUTOGEN2/${otpTemplateName}`;
    const response = await axios.get(url);
    const data = response.data;

    if (data.Status !== "Success") {
      throw new Error(`OTP send failed: ${data.Details || "Unknown error"}`);
    }

    const generatedOtp = data.OTP;
    const sessionId = data.Details;

    // Save OTP to DB (or cache) for later verification
    const user = await User.findOneAndUpdate(
      { phone },
      { phone, OTP: generatedOtp, sessionId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(StatusCodes.OK).json({
      message: "OTP sent successfully",
      user: { phone: user.phone },
      sessionId: sessionId // optional return for debugging
    });
  } catch (err) {
    console.error("2Factor AUTOGEN2 error:", err.message);
    throw new Error("Failed to send OTP");
  }
};
// ----------------------------------------------------------------
// Verify OTP (validates and issues JWT)
export const verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;
  console.log("Verifying OTP for phone:", phone, "OTP:", otp);
  if (!phone || !otp) throw new BadRequestError("Phone and OTP required");

  const user = await User.findOne({ phone });
  if (!user || !user.OTP) throw new BadRequestError("Invalid or expired OTP");

  const isMatch = crypto.timingSafeEqual(
    Buffer.from(user.OTP),
    Buffer.from(otp)
  );

  if (!isMatch) throw new BadRequestError("Invalid OTP");

  // Mark user verified and clean up OTP
  user.verified = true;
  user.OTP = undefined;
  user.sessionId = undefined;
  await user.save();

  const token = user.createJwt();

  res.status(StatusCodes.OK).json({
    message: "OTP verified successfully",
    user: { uid: user._id, phone: user.phone },
    token,
  });
};
