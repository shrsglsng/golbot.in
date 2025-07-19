import { ValidationError } from "./errors.js";
import validator from "validator";

// Validation utility for common validation patterns
export class Validator {
  static validateRequired(fields, data) {
    const missing = [];
    
    fields.forEach(field => {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        missing.push(field);
      }
    });
    
    if (missing.length > 0) {
      throw new ValidationError(`Missing required fields: ${missing.join(', ')}`, { missing });
    }
  }

  static validatePhone(phone) {
    if (!phone || typeof phone !== 'string') {
      throw new ValidationError('Phone number is required');
    }
    
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if it's a valid Indian mobile number (10 digits starting with 6-9)
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      throw new ValidationError('Invalid phone number format. Must be a 10-digit Indian mobile number');
    }
    
    return cleanPhone;
  }

  static validateEmail(email) {
    if (!email || typeof email !== 'string') {
      throw new ValidationError('Email is required');
    }
    
    if (!validator.isEmail(email)) {
      throw new ValidationError('Invalid email format');
    }
    
    return email.toLowerCase().trim();
  }

  static validateObjectId(id, fieldName = 'ID') {
    if (!id || typeof id !== 'string') {
      throw new ValidationError(`${fieldName} is required`);
    }
    
    if (!validator.isMongoId(id)) {
      throw new ValidationError(`Invalid ${fieldName} format`);
    }
    
    return id;
  }

  static validateString(value, fieldName, options = {}) {
    const { minLength = 0, maxLength = Infinity, required = true } = options;
    
    if (!value || typeof value !== 'string') {
      if (required) {
        throw new ValidationError(`${fieldName} is required`);
      }
      return value;
    }
    
    const trimmed = value.trim();
    
    if (required && trimmed.length === 0) {
      throw new ValidationError(`${fieldName} cannot be empty`);
    }
    
    if (trimmed.length < minLength) {
      throw new ValidationError(`${fieldName} must be at least ${minLength} characters long`);
    }
    
    if (trimmed.length > maxLength) {
      throw new ValidationError(`${fieldName} must not exceed ${maxLength} characters`);
    }
    
    return trimmed;
  }

  static validateNumber(value, fieldName, options = {}) {
    const { min = -Infinity, max = Infinity, integer = false, required = true } = options;
    
    if (value === undefined || value === null) {
      if (required) {
        throw new ValidationError(`${fieldName} is required`);
      }
      return value;
    }
    
    const num = Number(value);
    
    if (isNaN(num)) {
      throw new ValidationError(`${fieldName} must be a valid number`);
    }
    
    if (integer && !Number.isInteger(num)) {
      throw new ValidationError(`${fieldName} must be an integer`);
    }
    
    if (num < min) {
      throw new ValidationError(`${fieldName} must be at least ${min}`);
    }
    
    if (num > max) {
      throw new ValidationError(`${fieldName} must not exceed ${max}`);
    }
    
    return num;
  }

  static validateArray(value, fieldName, options = {}) {
    const { minLength = 0, maxLength = Infinity, required = true } = options;
    
    if (!value) {
      if (required) {
        throw new ValidationError(`${fieldName} is required`);
      }
      return value;
    }
    
    if (!Array.isArray(value)) {
      throw new ValidationError(`${fieldName} must be an array`);
    }
    
    if (value.length < minLength) {
      throw new ValidationError(`${fieldName} must contain at least ${minLength} items`);
    }
    
    if (value.length > maxLength) {
      throw new ValidationError(`${fieldName} must not contain more than ${maxLength} items`);
    }
    
    return value;
  }

  static validateOTP(otp) {
    if (!otp || typeof otp !== 'string') {
      throw new ValidationError('OTP is required');
    }
    
    const cleanOTP = otp.trim();
    
    if (!/^\d{4,6}$/.test(cleanOTP)) {
      throw new ValidationError('OTP must be 4-6 digits');
    }
    
    return cleanOTP;
  }

  static validateMachineId(machineId) {
    if (!machineId || typeof machineId !== 'string') {
      throw new ValidationError('Machine ID is required');
    }
    
    const cleanId = machineId.trim();
    
    if (cleanId.length < 3 || cleanId.length > 20) {
      throw new ValidationError('Machine ID must be between 3-20 characters');
    }
    
    return cleanId;
  }

  static validateOrderItems(items) {
    this.validateArray(items, 'items', { minLength: 1 });
    
    items.forEach((item, index) => {
      if (!item || typeof item !== 'object') {
        throw new ValidationError(`Item at index ${index} must be an object`);
      }
      
      this.validateObjectId(item.id || item._id, `Item ${index} ID`);
      this.validateNumber(item.quantity, `Item ${index} quantity`, { 
        min: 1, 
        max: 10, 
        integer: true 
      });
    });
    
    return items;
  }

  static sanitizeInput(input) {
    if (typeof input === 'string') {
      return validator.escape(input.trim());
    }
    return input;
  }
}

// Validation middleware factory
export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      if (schema.body) {
        req.body = schema.body(req.body);
      }
      
      if (schema.params) {
        req.params = schema.params(req.params);
      }
      
      if (schema.query) {
        req.query = schema.query(req.query);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default Validator;
