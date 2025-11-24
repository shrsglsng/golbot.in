import { UnauthorizedError } from "../../utils/errors.js";
import logger from "../../utils/logger.js";

/**
 * Middleware to block browser access to firmware endpoints
 *
 * Security: Firmware APIs should only be accessible from native applications (ESP32, APK)
 * Browsers always send Origin header in CORS requests
 * Native apps don't send Origin header
 *
 * This prevents:
 * - Phishing sites from making firmware API calls
 * - CSRF attacks using firmware credentials
 * - Credential theft via malicious JavaScript
 */
const blockBrowserAccess = (req, res, next) => {
  // Check if request has Origin header (indicates browser request)
  const origin = req.headers.origin || req.headers.referer;

  if (origin) {
    // Allow localhost origins in development mode
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const isLocalhost = origin && (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.includes('[::1]')
    );

    if (isDevelopment && isLocalhost) {
      logger.info('Firmware API access from localhost (development mode)', {
        origin,
        path: req.path,
        ip: req.ip
      });
      return next();
    }

    logger.warn('Firmware API access attempted from browser', {
      origin,
      path: req.path,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    throw new UnauthorizedError(
      'Firmware API is only accessible from native applications. Browser access is not allowed for security reasons.'
    );
  }

  // Request has no Origin header - likely from native app, allow it
  next();
};

export default blockBrowserAccess;
