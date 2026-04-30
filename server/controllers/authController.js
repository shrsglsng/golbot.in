// server/controllers/authController.js - COMPLETE FIXED VERSION

import axios from "axios";
import crypto from "crypto";
import User from "../models/userModel.js";
import logger from "../utils/logger.js";
import { BadRequestError, ExternalServiceError } from "../utils/errors.js";
import { Validator } from "../utils/validation.js";
import DatabaseUtil from "../utils/database.js";
import ApiResponse from "../utils/response.js";
import smsService from "../services/smsService.js";

// Import demo configuration
import { isDemoMode, isDemoCredentials, getDemoConfig } from "../config/demoConfig.js";

// ================================================================
// Anonymous registration
export const anonRegister = async (req, res) => {
  try {
    logger.info('Anonymous registration attempt');

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

// ================================================================
// Send OTP via SMS
export const phoneSendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    logger.info('OTP send request received', { phone: phone?.substring(0, 6) + 'xxxx' });

    const validatedPhone = Validator.validatePhone(phone);

    console.log('🎪 DEBUG: isDemoCredentials imported?', typeof isDemoCredentials);
    console.log('🎪 DEBUG: Calling isDemoCredentials with phone:', validatedPhone);

    // ✅ DEMO MODE CHECK
    if (isDemoCredentials(validatedPhone)) {
      console.log('🎪 DEMO MODE TRIGGERED!');
      logger.info('🎪 Demo Mode: OTP send request for demo phone', {
        phone: validatedPhone.substring(0, 6) + 'xxxx'
      });

      const demoConfig = getDemoConfig();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      await DatabaseUtil.updateOne(
        User,
        { phone: validatedPhone },
        {
          phone: validatedPhone,
          OTP: demoConfig.otp,
          sessionId: 'DEMO_SESSION',
          otpExpiry,
          verified: false,
          isDemo: true
        },
        { upsert: true }
      );

      logger.info('Demo OTP saved to database', {
        phone: validatedPhone.substring(0, 6) + 'xxxx',
        expiry: otpExpiry
      });

      return ApiResponse.success(res, {
        user: { phone: validatedPhone },
        sessionId: process.env.NODE_ENV === 'local' ? 'DEMO_SESSION' : undefined,
        expiresIn: 600,
        isDemo: true
      }, "OTP sent successfully (Demo Mode)");
    }

    // NORMAL SMS OTP FLOW
    const apiKey = process.env.STARTMESSAGING_API_KEY;
    if (!apiKey) {
      logger.error('SMS service not configured - STARTMESSAGING_API_KEY missing');
      throw new ExternalServiceError("SMS service not configured", "StartMessaging");
    }

    const formattedPhone = validatedPhone.startsWith("+91") ? validatedPhone : `+91${validatedPhone}`;

    // Generate a 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const sessionId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');

    try {
      logger.debug('Sending OTP via StartMessaging API', { phone: formattedPhone.substring(0, 6) + 'xxxx' });

      const startTime = Date.now();
      await smsService.sendOTP(formattedPhone, generatedOtp);
      const duration = Date.now() - startTime;

      logger.info('OTP sent successfully via StartMessaging', {
        sessionId,
        phone: formattedPhone.substring(0, 6) + 'xxxx',
        duration: `${duration}ms`
      });

      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await DatabaseUtil.updateOne(
        User,
        { phone: validatedPhone },
        {
          phone: validatedPhone,
          OTP: generatedOtp,
          sessionId,
          otpExpiry,
          verified: false,
          isDemo: false
        },
        { upsert: true }
      );

      logger.info('OTP saved to database', {
        phone: validatedPhone.substring(0, 6) + 'xxxx',
        expiry: otpExpiry
      });

      return ApiResponse.success(res, {
        user: { phone: validatedPhone },
        sessionId: process.env.NODE_ENV === 'local' ? sessionId : undefined,
        expiresIn: 600
      }, "OTP sent successfully");

    } catch (apiError) {
      throw apiError;
    }

  } catch (error) {
    logger.error('Phone send OTP failed', {
      error: error.message,
      phone: req.body?.phone?.substring(0, 6) + 'xxxx'
    });
    throw error;
  }
};

// ================================================================
// Verify OTP
export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    logger.info('OTP verification attempt', {
      phone: phone?.substring(0, 6) + 'xxxx',
      otpLength: otp?.length
    });

    const validatedPhone = Validator.validatePhone(phone);
    const validatedOtp = Validator.validateOTP(otp);

    // ✅ DEMO MODE CHECK
    if (isDemoCredentials(validatedPhone, validatedOtp)) {
      logger.info('🎪 Demo Mode: OTP verification for demo user', {
        phone: validatedPhone.substring(0, 6) + 'xxxx'
      });

      let user = await DatabaseUtil.findOne(User, { phone: validatedPhone });

      if (!user) {
        user = await DatabaseUtil.create(User, {
          phone: validatedPhone,
          verified: true,
          isDemo: true
        });
        logger.info('Created new demo user', { userId: user._id });
      } else {
        await DatabaseUtil.updateById(User, user._id, {
          verified: true,
          isDemo: true,
          $unset: {
            OTP: 1,
            sessionId: 1,
            otpExpiry: 1
          },
          lastLoginAt: new Date()
        });
      }

      const token = user.createJwt();

      logger.info('🎪 Demo OTP verification successful', {
        userId: user._id,
        phone: validatedPhone.substring(0, 6) + 'xxxx'
      });

      return ApiResponse.success(res, {
        user: {
          uid: user._id,
          phone: user.phone,
          isDemo: true
        },
        token,
        isDemo: true
      }, "OTP verified successfully (Demo Mode)");
    }

    // NORMAL OTP VERIFICATION
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

    await DatabaseUtil.updateById(User, user._id, {
      verified: true,
      isDemo: false,
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