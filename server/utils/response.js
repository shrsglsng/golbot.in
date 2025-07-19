import { StatusCodes } from "http-status-codes";
import logger from "./logger.js";

// Standardized API response utility
export class ApiResponse {
  static success(res, data = null, message = "Success", statusCode = StatusCodes.OK) {
    const response = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    
    logger.debug('API Success Response', { statusCode, message });
    return res.status(statusCode).json(response);
  }

  static created(res, data = null, message = "Resource created successfully") {
    return this.success(res, data, message, StatusCodes.CREATED);
  }

  static error(res, error, message = "An error occurred", statusCode = StatusCodes.INTERNAL_SERVER_ERROR) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const response = {
      success: false,
      message,
      error: {
        message: error.message || 'Unknown error',
        ...(isDevelopment && { 
          stack: error.stack,
          details: error.details || null 
        })
      },
      timestamp: new Date().toISOString()
    };
    
    logger.error('API Error Response', { 
      statusCode, 
      message, 
      error: error.message,
      stack: error.stack 
    });
    
    return res.status(statusCode).json(response);
  }

  static badRequest(res, message = "Bad Request", details = null) {
    const response = {
      success: false,
      message,
      ...(details && { details }),
      timestamp: new Date().toISOString()
    };
    
    return res.status(StatusCodes.BAD_REQUEST).json(response);
  }

  static unauthorized(res, message = "Unauthorized access") {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    };
    
    return res.status(StatusCodes.UNAUTHORIZED).json(response);
  }

  static forbidden(res, message = "Access forbidden") {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    };
    
    return res.status(StatusCodes.FORBIDDEN).json(response);
  }

  static notFound(res, message = "Resource not found") {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    };
    
    return res.status(StatusCodes.NOT_FOUND).json(response);
  }

  static conflict(res, message = "Resource conflict") {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    };
    
    return res.status(StatusCodes.CONFLICT).json(response);
  }

  static tooManyRequests(res, message = "Too many requests") {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    };
    
    return res.status(StatusCodes.TOO_MANY_REQUESTS).json(response);
  }

  // Legacy response format for backward compatibility
  static legacy(res, data = null, message = "Success", statusCode = StatusCodes.OK) {
    const response = {
      result: data,
      msg: message
    };
    
    return res.status(statusCode).json(response);
  }
}

// Middleware to add response helpers to res object
export const responseMiddleware = (req, res, next) => {
  res.apiSuccess = (data, message, statusCode) => 
    ApiResponse.success(res, data, message, statusCode);
  
  res.apiCreated = (data, message) => 
    ApiResponse.created(res, data, message);
  
  res.apiError = (error, message, statusCode) => 
    ApiResponse.error(res, error, message, statusCode);
  
  res.apiBadRequest = (message, details) => 
    ApiResponse.badRequest(res, message, details);
  
  res.apiUnauthorized = (message) => 
    ApiResponse.unauthorized(res, message);
  
  res.apiForbidden = (message) => 
    ApiResponse.forbidden(res, message);
  
  res.apiNotFound = (message) => 
    ApiResponse.notFound(res, message);
  
  res.apiConflict = (message) => 
    ApiResponse.conflict(res, message);
  
  res.apiTooManyRequests = (message) => 
    ApiResponse.tooManyRequests(res, message);
  
  res.apiLegacy = (data, message, statusCode) => 
    ApiResponse.legacy(res, data, message, statusCode);
  
  next();
};

export default ApiResponse;
