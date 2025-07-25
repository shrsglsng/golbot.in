// Mobile App Authentication Middleware
import logger from "../utils/logger.js";
import { UnauthenticatedError } from "../utils/errors.js";

export const validateMobileApp = (req, res, next) => {
  try {
    // Check if this is a mobile app request (no origin header or non-web origin)
    const origin = req.get('Origin');
    const userAgent = req.get('User-Agent') || '';
    
    // If there's no origin header or origin is not from known web domains, treat as mobile app
    const isWebBrowser = origin && (
      origin.includes('localhost:3000') || 
      origin.includes('localhost:3001') || 
      origin.includes('vercel.app')
    );
    
    const isMobileApp = !isWebBrowser;
    
    if (isMobileApp) {
      // Validate API key for mobile app requests
      const apiKey = req.get('X-Mobile-API-Key');
      const expectedApiKey = process.env.MOBILE_APP_API_KEY;
      
      if (!apiKey) {
        logger.warn('Mobile app request missing API key', { 
          ip: req.ip,
          userAgent,
          origin,
          path: req.path 
        });
        throw new UnauthenticatedError("Mobile API key required");
      }
      
      if (apiKey !== expectedApiKey) {
        logger.warn('Mobile app request with invalid API key', { 
          ip: req.ip,
          userAgent,
          origin,
          path: req.path,
          providedKey: apiKey?.substring(0, 8) + '...'
        });
        throw new UnauthenticatedError("Invalid mobile API key");
      }
      
      logger.info('Mobile app request authenticated', { 
        ip: req.ip,
        path: req.path 
      });
    }
    
    next();
  } catch (error) {
    logger.error('Mobile app validation failed', { 
      error: error.message,
      ip: req.ip,
      path: req.path 
    });
    throw error;
  }
};

export default validateMobileApp;
