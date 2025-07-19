import logger from "./logger.js";
import { RateLimitError } from "./errors.js";

// Simple in-memory rate limiter
class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.windowMs = 15 * 60 * 1000; // 15 minutes
    this.maxRequests = 100; // max 100 requests per window
    
    // Clean up old entries every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  cleanup() {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    
    for (const [key, data] of this.requests.entries()) {
      if (data.resetTime < cutoff) {
        this.requests.delete(key);
      }
    }
  }

  isAllowed(identifier, options = {}) {
    const { 
      windowMs = this.windowMs, 
      maxRequests = this.maxRequests 
    } = options;
    
    const now = Date.now();
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
        firstRequest: now
      });
      return { allowed: true, remaining: maxRequests - 1 };
    }
    
    const data = this.requests.get(identifier);
    
    // Reset window if expired
    if (data.resetTime <= now) {
      data.count = 1;
      data.resetTime = now + windowMs;
      data.firstRequest = now;
      return { allowed: true, remaining: maxRequests - 1 };
    }
    
    // Check if limit exceeded
    if (data.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: data.resetTime
      };
    }
    
    // Increment counter
    data.count++;
    
    return {
      allowed: true,
      remaining: maxRequests - data.count
    };
  }
}

const rateLimiter = new RateLimiter();

// Rate limiting middleware factory
export const createRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    keyGenerator = (req) => req.ip,
    message = "Too many requests"
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const result = rateLimiter.isAllowed(key, { windowMs, maxRequests });
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': result.remaining,
      'X-RateLimit-Reset': result.resetTime ? new Date(result.resetTime).toISOString() : undefined
    });
    
    if (!result.allowed) {
      logger.warn('Rate limit exceeded', {
        key,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        resetTime: new Date(result.resetTime).toISOString()
      });
      
      throw new RateLimitError(message);
    }
    
    next();
  };
};

// Specific rate limiters for different endpoints
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 auth attempts per 15 minutes
  keyGenerator: (req) => `auth:${req.ip}:${req.body.phone || 'unknown'}`,
  message: "Too many authentication attempts. Please try again later."
});

export const otpRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 3, // 3 OTP requests per 5 minutes
  keyGenerator: (req) => `otp:${req.ip}:${req.body.phone || 'unknown'}`,
  message: "Too many OTP requests. Please wait before requesting another."
});

export const orderRateLimit = createRateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 20, // 20 order attempts per 10 minutes
  keyGenerator: (req) => `order:${req.user?.uid || req.ip}`,
  message: "Too many order attempts. Please wait before trying again."
});

export default rateLimiter;
