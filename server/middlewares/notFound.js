import { StatusCodes } from "http-status-codes";
import logger from "../utils/logger.js";

const notFoundMiddleware = (req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.uid || 'anonymous'
  });

  res.status(StatusCodes.NOT_FOUND).json({ 
    success: false,
    message: "Route does not exist",
    error: {
      path: req.originalUrl,
      method: req.method
    },
    timestamp: new Date().toISOString()
  });
};

export default notFoundMiddleware;
