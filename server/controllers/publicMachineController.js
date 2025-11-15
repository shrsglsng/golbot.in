/**
 * Public Machine Controller
 * Public endpoints for machine information and token validation (no auth required)
 */

import machineResolver from "../services/machineResolver.js";
import logger from "../utils/logger.js";
import { BadRequestError } from "../utils/errors.js";
import ApiResponse from "../utils/response.js";

// ---------------------------------
// Resolve machine from token (public endpoint for QR code scanning)
export const resolveMachineFromToken = async (req, res) => {
  try {
    const { mt } = req.query;

    if (!mt) {
      throw new BadRequestError('Machine token (mt) is required');
    }

    logger.info('Public machine resolution request', {
      hasToken: !!mt
    });

    // Resolve machine from token
    const result = await machineResolver.resolveMachineFromToken(mt, {
      requireOnline: false, // Don't strictly require online for initial resolution
      requireActive: true
    });

    if (!result.success) {
      // Log failure for monitoring
      logger.warn('Machine resolution failed', {
        error: result.error,
        message: result.message
      });

      // Return structured error response
      return ApiResponse.error(res, {
        error: result.error,
        message: result.message,
        recoverable: result.error !== 'INVALID_SIGNATURE' && result.error !== 'TOKEN_REVOKED',
        machineId: result.machineId,
        machineLocation: result.machineLocation
      }, result.code || 400, result.message);
    }

    // Success: return machine data
    logger.info('Machine resolved successfully', {
      machineId: result.machine.id,
      status: result.machine.status
    });

    return ApiResponse.success(res, {
      machine: result.machine,
      tokenValid: true
    }, "Machine resolved successfully");

  } catch (error) {
    logger.error('Resolve machine from token failed', {
      error: error.message
    });
    throw error;
  }
};

// ---------------------------------
// Get machine info by ID (public endpoint, no token required)
export const getMachineById = async (req, res) => {
  try {
    const { machineId } = req.params;

    logger.info('Get machine by ID request', {
      machineId
    });

    // Resolve machine by ID
    const result = await machineResolver.resolveMachineById(machineId, {
      requireOnline: false,
      requireActive: true
    });

    if (!result.success) {
      logger.warn('Machine not found or inactive', {
        machineId,
        error: result.error
      });

      return ApiResponse.error(res, {
        error: result.error,
        message: result.message
      }, result.code || 404, result.message);
    }

    logger.info('Machine info retrieved', {
      machineId: result.machine.id,
      status: result.machine.status
    });

    return ApiResponse.success(res, {
      machine: result.machine
    }, "Machine retrieved successfully");

  } catch (error) {
    logger.error('Get machine by ID failed', {
      error: error.message,
      machineId: req.params?.machineId
    });
    throw error;
  }
};
