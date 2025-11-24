import Machine from "../../models/machineModel.js";
import bcrypt from "bcryptjs";
import logger from "../../utils/logger.js";
import { UnauthenticatedError } from "../../utils/errors.js";

/**
 * Firmware Authentication Middleware
 *
 * Supports two authentication methods:
 * 1. Header-based: X-Machine-ID + X-Machine-Password
 * 2. Query-based: ?mid=M01&password=secret (for simple ESP32 GET requests)
 *
 * Usage:
 *   router.get("/orders/next", firmwareAuth, controller);
 */
export const firmwareAuth = async (req, res, next) => {
  try {
    // Extract machine credentials from headers or query params
    const machineId = req.headers['x-machine-id'] || req.query.mid;
    const password = req.headers['x-machine-password'] || req.query.password;

    logger.debug('Firmware auth attempt', {
      machineId,
      hasPassword: !!password,
      source: req.headers['x-machine-id'] ? 'header' : 'query',
      ip: req.ip
    });

    // Validate credentials provided
    if (!machineId || !password) {
      throw new UnauthenticatedError(
        'Machine credentials required. Provide X-Machine-ID and X-Machine-Password headers or mid/password query params.'
      );
    }

    // Find machine
    const machine = await Machine.findOne({
      mid: machineId.toUpperCase(),
      isActive: true
    });

    if (!machine) {
      logger.warn('Firmware auth failed: Machine not found', {
        machineId,
        ip: req.ip
      });
      throw new UnauthenticatedError('Invalid machine credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, machine.password);

    if (!isValidPassword) {
      logger.warn('Firmware auth failed: Invalid password', {
        machineId,
        ip: req.ip
      });
      throw new UnauthenticatedError('Invalid machine credentials');
    }

    // Check if machine is connected
    if (machine.mstatus === 'DISCONNECTED') {
      logger.warn('Firmware auth: Machine is disconnected', {
        machineId: machine.mid
      });
      // Don't block auth, just log warning
    }

    // Attach machine to request
    req.machine = machine;

    logger.debug('Firmware auth successful', {
      machineId: machine.mid,
      location: machine.location
    });

    next();
  } catch (error) {
    logger.error('Firmware auth error', {
      error: error.message,
      machineId: req.headers['x-machine-id'] || req.query.mid
    });
    next(error);
  }
};

/**
 * Optional firmware auth - allows requests without credentials
 * but attaches machine if credentials are valid
 */
export const optionalFirmwareAuth = async (req, res, next) => {
  const machineId = req.headers['x-machine-id'] || req.query.mid;
  const password = req.headers['x-machine-password'] || req.query.password;

  if (!machineId || !password) {
    // No credentials provided, continue without machine context
    return next();
  }

  try {
    // Try to authenticate
    await firmwareAuth(req, res, next);
  } catch (error) {
    // Auth failed, continue without machine context
    logger.debug('Optional firmware auth skipped', {
      machineId,
      error: error.message
    });
    next();
  }
};

export default firmwareAuth;
