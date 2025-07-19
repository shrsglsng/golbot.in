import { StatusCodes } from "http-status-codes";
import logger from "./logger.js";

// Base custom error class
export class CustomError extends Error {
  constructor(message, statusCode = StatusCodes.INTERNAL_SERVER_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguish from programming errors
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
    
    // Log the error
    logger.error(`${this.constructor.name}: ${message}`, {
      statusCode,
      stack: this.stack
    });
  }
}

export class BadRequestError extends CustomError {
  constructor(message = "Bad Request") {
    super(message, StatusCodes.BAD_REQUEST);
  }
}

export class NotFoundError extends CustomError {
  constructor(message = "Resource not found") {
    super(message, StatusCodes.NOT_FOUND);
  }
}

export class UnauthenticatedError extends CustomError {
  constructor(message = "Authentication required") {
    super(message, StatusCodes.UNAUTHORIZED);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message = "Insufficient permissions") {
    super(message, StatusCodes.FORBIDDEN);
  }
}

export class ConflictError extends CustomError {
  constructor(message = "Resource conflict") {
    super(message, StatusCodes.CONFLICT);
  }
}

export class ValidationError extends CustomError {
  constructor(message = "Validation failed", details = {}) {
    super(message, StatusCodes.BAD_REQUEST);
    this.details = details;
  }
}

export class DatabaseError extends CustomError {
  constructor(message = "Database operation failed", operation = null) {
    super(message, StatusCodes.INTERNAL_SERVER_ERROR);
    this.operation = operation;
  }
}

export class ExternalServiceError extends CustomError {
  constructor(message = "External service error", service = null) {
    super(message, StatusCodes.BAD_GATEWAY);
    this.service = service;
  }
}

export class RateLimitError extends CustomError {
  constructor(message = "Rate limit exceeded") {
    super(message, StatusCodes.TOO_MANY_REQUESTS);
  }
}

// Error response formatter
export const formatErrorResponse = (error, req) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    success: false,
    error: {
      message: error.message,
      statusCode: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      ...(isDevelopment && { 
        stack: error.stack,
        details: error.details || null 
      }),
      timestamp: new Date().toISOString(),
      path: req?.originalUrl || 'unknown',
      method: req?.method || 'unknown'
    }
  };
};
