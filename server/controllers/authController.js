import axios from "axios";
import crypto from "crypto";
import User from "../models/userModel.js";
import logger from "../utils/logger.js";
import { BadRequestError, ExternalServiceError } from "../utils/errors.js";
import { Validator } from "../utils/validation.js";
import DatabaseUtil from "../utils/database.js";
import ApiResponse from "../utils/response.js";

// ----------------------------------------------------------------
// Anonymous registration (for testing or fallback use only)
export const anonRegister = async (req, res) => {
  try {
    logger.info('Anonymous registration attempt');
    
    // Check if anonymous user already exists
    const existingUser = await DatabaseUtil.findOne(User, { phone: "9999999999" });
    
    let user;
    if (existingUser) {
      user = existingUser;
      logger.info('Using existing anonymous user', { userId: user._id });
    } else {
      user = await DatabaseUtil.create(User, { phone: "9999999999" });
      logger.info('Created new anonymous user', { userId: user._id });
    }
    
    const token = user.createJwt();
    
    logger.info('Anonymous registration successful', { userId: user._id });
    
    return ApiResponse.created(res, {
      user: { uid: user._id, phone: user.phone },
      token
    }, "Anonymous user registered successfully");
    
  } catch (error) {
    logger.error('Anonymous registration failed', { error: error.message });
    throw error;
  }
};

// ----------------------------------------------------------------
// Send OTP via SMS
export const phoneSendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    
    logger.info('OTP send request received', { phone: phone?.substring(0, 6) + 'xxxx' });
    
    // Validate phone number
    const validatedPhone = Validator.validatePhone(phone);
    
    // Check environment configuration
    const smsKey = process.env.SMS_SECRET_KEY;
    if (!smsKey) {
      logger.error('SMS service not configured - SMS_SECRET_KEY missing');
      throw new ExternalServiceError("SMS service not configured", "2Factor");
    }

    // Format phone to E.164
    const formattedPhone = validatedPhone.startsWith("+91") ? validatedPhone : `+91${validatedPhone}`;
    const otpTemplateName = process.env.OTP_TEMPLATE_NAME || "OTP1";

    try {
      const url = `https://2factor.in/API/V1/${smsKey}/SMS/${formattedPhone}/AUTOGEN2/${otpTemplateName}`;
      
      logger.debug('Sending OTP via 2Factor API', { phone: formattedPhone.substring(0, 6) + 'xxxx' });
      
      const startTime = Date.now();
      const response = await axios.get(url, {
        timeout: 10000, // 10 second timeout
        headers: {
          'User-Agent': 'GolBot-Server/1.0'
        }
      });
      const duration = Date.now() - startTime;
      
      logger.apiLog('GET', url, response.status, `${duration}ms`);
      
      const data = response.data;

      if (data.Status !== "Success") {
        logger.error('2Factor API error', { 
          status: data.Status, 
          details: data.Details,
          phone: formattedPhone.substring(0, 6) + 'xxxx'
        });
        throw new ExternalServiceError(`OTP send failed: ${data.Details || "Unknown error"}`, "2Factor");
      }

      const generatedOtp = data.OTP;
      const sessionId = data.Details;

      logger.info('OTP generated successfully via 2Factor', { 
        sessionId,
        phone: formattedPhone.substring(0, 6) + 'xxxx'
      });

      // Save OTP to database with expiration
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      await DatabaseUtil.updateOne(
        User,
        { phone: validatedPhone },
        { 
          phone: validatedPhone, 
          OTP: generatedOtp, 
          sessionId,
          otpExpiry,
          verified: false
        },
        { upsert: true }
      );

      logger.info('OTP saved to database', { 
        phone: validatedPhone.substring(0, 6) + 'xxxx',
        expiry: otpExpiry
      });

      return ApiResponse.success(res, {
        user: { phone: validatedPhone },
        sessionId: process.env.NODE_ENV === 'development' ? sessionId : undefined,
        expiresIn: 600 // 10 minutes in seconds
      }, "OTP sent successfully");

    } catch (apiError) {
      const duration = Date.now() - (apiError.config?.metadata?.startTime || Date.now());
      
      if (apiError.code === 'ECONNABORTED') {
        logger.error('2Factor API timeout', { duration });
        throw new ExternalServiceError("SMS service timeout. Please try again.", "2Factor");
      }
      
      if (apiError.response) {
        logger.apiLog('GET', url, apiError.response.status, `${duration}ms`, apiError);
        throw new ExternalServiceError("Failed to send OTP. Please try again.", "2Factor");
      }
      
      logger.error('2Factor API network error', { 
        error: apiError.message,
        code: apiError.code 
      });
      throw new ExternalServiceError("SMS service unavailable. Please try again later.", "2Factor");
    }
    
  } catch (error) {
    logger.error('Phone send OTP failed', { 
      error: error.message,
      phone: req.body?.phone?.substring(0, 6) + 'xxxx'
    });
    throw error;
  }
};

// ----------------------------------------------------------------
// Verify OTP (validates and issues JWT)
export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    logger.info('OTP verification attempt', { 
      phone: phone?.substring(0, 6) + 'xxxx',
      otpLength: otp?.length 
    });
    
    // Validate input
    const validatedPhone = Validator.validatePhone(phone);
    const validatedOtp = Validator.validateOTP(otp);
    
    // Find user with valid OTP
    const user = await DatabaseUtil.findOne(User, { 
      phone: validatedPhone,
      OTP: { $exists: true, $ne: null },
      otpExpiry: { $gt: new Date() }
    });
    
    if (!user || !user.OTP) {
      logger.warn('OTP verification failed - invalid or expired', { 
        phone: validatedPhone.substring(0, 6) + 'xxxx',
        userExists: !!user,
        hasOtp: !!(user?.OTP),
        expired: user?.otpExpiry ? user.otpExpiry < new Date() : 'no-expiry'
      });
      throw new BadRequestError("Invalid or expired OTP");
    }

    // Verify OTP using timing-safe comparison
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(user.OTP.toString()),
      Buffer.from(validatedOtp.toString())
    );

    if (!isMatch) {
      logger.warn('OTP verification failed - incorrect OTP', { 
        phone: validatedPhone.substring(0, 6) + 'xxxx',
        userId: user._id
      });
      throw new BadRequestError("Invalid OTP");
    }

    // Mark user as verified and clean up OTP data
    await DatabaseUtil.updateById(User, user._id, {
      verified: true,
      $unset: { 
        OTP: 1, 
        sessionId: 1, 
        otpExpiry: 1 
      },
      lastLoginAt: new Date()
    });

    const token = user.createJwt();

    logger.info('OTP verification successful', { 
      userId: user._id,
      phone: validatedPhone.substring(0, 6) + 'xxxx'
    });

    return ApiResponse.success(res, {
      user: { uid: user._id, phone: user.phone },
      token
    }, "OTP verified successfully");
    
  } catch (error) {
    logger.error('OTP verification failed', { 
      error: error.message,
      phone: req.body?.phone?.substring(0, 6) + 'xxxx'
    });
    throw error;
  }
};
