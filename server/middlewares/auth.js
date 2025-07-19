import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";
import { UnauthenticatedError } from "../utils/errors.js";

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer")) {
      logger.warn('Authentication failed - missing or invalid header', {
        hasHeader: !!authHeader,
        headerStart: authHeader?.substring(0, 10),
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl
      });
      throw new UnauthenticatedError("Please login to continue");
    }

    const token = authHeader.split(" ")[1];
    
    if (!token) {
      logger.warn('Authentication failed - missing token', {
        ip: req.ip,
        url: req.originalUrl
      });
      throw new UnauthenticatedError("Please login to continue");
    }

    // Verify JWT token
    const payload = jwt.verify(token, process.env.EXPAPP_JWT_SECRET);
    
    // Attach user info to request
    req.user = { 
      uid: payload.uid, 
      phone: payload.phone,
      iat: payload.iat,
      exp: payload.exp
    };
    
    logger.debug('Authentication successful', {
      userId: payload.uid,
      phone: payload.phone?.substring(0, 6) + 'xxxx',
      tokenAge: Math.floor((Date.now() / 1000) - payload.iat),
      url: req.originalUrl
    });
    
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Authentication failed - invalid token', {
        error: error.message,
        ip: req.ip,
        url: req.originalUrl
      });
      throw new UnauthenticatedError("Invalid token. Please login again");
    }
    
    if (error.name === 'TokenExpiredError') {
      logger.warn('Authentication failed - token expired', {
        expiredAt: error.expiredAt,
        ip: req.ip,
        url: req.originalUrl
      });
      throw new UnauthenticatedError("Session expired. Please login again");
    }
    
    if (error instanceof UnauthenticatedError) {
      throw error;
    }
    
    logger.error('Authentication middleware error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      url: req.originalUrl
    });
    
    throw new UnauthenticatedError("Authentication failed");
  }
};

export default auth;
