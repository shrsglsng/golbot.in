import { StatusCodes } from "http-status-codes";
import logger from "../utils/logger.js";
import { CustomError, formatErrorResponse } from "../utils/errors.js";

const errorHandlerMiddleware = (err, req, res, next) => {
  // Default error object
  const defaultError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    message: err.message || "Something went wrong, try again later.",
    success: false
  };

  // Handle custom application errors
  if (err instanceof CustomError) {
    // For authentication errors, only log as warning (already logged by auth middleware)
    if (err.statusCode === StatusCodes.UNAUTHORIZED) {
      logger.debug('Authentication error handled', {
        message: err.message,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userId: req.user?.uid || 'anonymous'
      });
    } else {
      // Log other custom errors with full details
      logger.error('Custom error caught by middleware', {
        message: err.message,
        statusCode: err.statusCode,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.uid || 'anonymous'
      });
    }
    
    return res.status(err.statusCode).json(formatErrorResponse(err, req));
  }

  // Log all other errors with full stack trace
  logger.error('Error caught by middleware', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.uid || 'anonymous'
  });

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    defaultError.statusCode = StatusCodes.BAD_REQUEST;
    defaultError.message = Object.values(err.errors)
      .map((item) => item.message)
      .join(", ");
    
    logger.warn('Validation error', { 
      fields: Object.keys(err.errors),
      messages: Object.values(err.errors).map(e => e.message)
    });
  }

  // Handle MongoDB duplicate key errors
  if (err.code && err.code === 11000) {
    defaultError.statusCode = StatusCodes.BAD_REQUEST;
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
    defaultError.message = `${field} already exists. Please use a different value.`;
    
    logger.warn('Duplicate key error', { 
      field,
      value: err.keyValue 
    });
  }

  // Handle MongoDB cast errors
  if (err.name === "CastError") {
    defaultError.statusCode = StatusCodes.BAD_REQUEST;
    defaultError.message = `Invalid ${err.path}: ${err.value}`;
    
    logger.warn('Cast error', { 
      path: err.path,
      value: err.value,
      kind: err.kind 
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    defaultError.statusCode = StatusCodes.UNAUTHORIZED;
    defaultError.message = "Invalid token. Please login again.";
    
    logger.warn('JWT error', { message: err.message });
  }

  if (err.name === "TokenExpiredError") {
    defaultError.statusCode = StatusCodes.UNAUTHORIZED;
    defaultError.message = "Token expired. Please login again.";
    
    logger.warn('Token expired', { expiredAt: err.expiredAt });
  }

  // Handle Multer errors (file upload)
  if (err.code === "LIMIT_FILE_SIZE") {
    defaultError.statusCode = StatusCodes.BAD_REQUEST;
    defaultError.message = "File too large. Please upload a smaller file.";
    
    logger.warn('File upload error', { 
      limit: err.limit,
      field: err.field 
    });
  }

  // Handle network/connection errors
  if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
    defaultError.statusCode = StatusCodes.SERVICE_UNAVAILABLE;
    defaultError.message = "External service unavailable. Please try again later.";
    
    logger.error('Network error', { 
      code: err.code,
      address: err.address,
      port: err.port 
    });
  }

  // Log severe errors (5xx status codes)
  if (defaultError.statusCode >= 500) {
    logger.error('Server error occurred', {
      error: err.message,
      stack: err.stack,
      statusCode: defaultError.statusCode
    });
  }

  // Send error response
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const response = {
    success: false,
    message: defaultError.message,
    ...(isDevelopment && {
      error: {
        stack: err.stack,
        name: err.name,
        code: err.code
      }
    }),
    timestamp: new Date().toISOString()
  };

  // Maintain backward compatibility with legacy format
  if (req.headers['x-legacy-response'] === 'true') {
    return res.status(defaultError.statusCode).json({
      err: defaultError.message,
      msg: defaultError.message
    });
  }

  res.status(defaultError.statusCode).json(response);
};

export default errorHandlerMiddleware;
