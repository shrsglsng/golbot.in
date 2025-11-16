import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";

/**
 * Optional authentication middleware
 * Attaches user info if valid token is present, but doesn't throw error if missing
 * Used for endpoints that work for both authenticated and anonymous users
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    // If no auth header, just continue without user info
    if (!authHeader || !authHeader.startsWith("Bearer")) {
      logger.debug('Optional auth - no token provided', {
        ip: req.ip,
        url: req.originalUrl
      });
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      req.user = null;
      return next();
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

    logger.debug('Optional auth - authentication successful', {
      userId: payload.uid,
      url: req.originalUrl
    });

    next();

  } catch (error) {
    // On any error, just continue without user info
    logger.debug('Optional auth - token invalid but continuing', {
      error: error.message,
      ip: req.ip,
      url: req.originalUrl
    });

    req.user = null;
    next();
  }
};

export default optionalAuth;
