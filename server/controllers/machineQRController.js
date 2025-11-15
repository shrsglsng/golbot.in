/**
 * Machine QR Token Management Controller
 * Admin endpoints for generating, viewing, and revoking machine QR tokens
 */

import Machine from "../models/machineModel.js";
import machineTokenService from "../services/machineTokenService.js";
import logger from "../utils/logger.js";
import { NotFoundError, BadRequestError } from "../utils/errors.js";
import { Validator } from "../utils/validation.js";
import DatabaseUtil from "../utils/database.js";
import ApiResponse from "../utils/response.js";

// ---------------------------------
// Generate QR token for machine
export const generateMachineQRToken = async (req, res) => {
  try {
    const { machineId } = req.params;
    const { label, baseUrl } = req.body;

    logger.info('Generate QR token request', {
      adminId: req.user?.uid,
      machineId,
      label
    });

    // Validate machineId
    if (!machineId) {
      throw new BadRequestError('Machine ID is required');
    }

    // Fetch machine
    const machine = await DatabaseUtil.findOne(Machine, { mid: machineId }, {
      throwIfNotFound: true
    });

    // Determine base URL (from request body or environment)
    const appBaseUrl = baseUrl || process.env.USER_WEB_URL || 'https://golbot.in';

    // Generate QR token and URL
    const qrData = machineTokenService.generateQRCodeUrl(machineId, appBaseUrl);

    // Store token metadata in machine document
    machine.qrTokens = machine.qrTokens || [];
    machine.qrTokens.push({
      tokenId: qrData.tokenId,
      createdAt: new Date(),
      createdBy: req.user?.uid || 'admin',
      label: label || `QR-${machine.qrTokens.length + 1}`
    });

    await machine.save();

    logger.info('QR token generated successfully', {
      adminId: req.user?.uid,
      machineId,
      tokenId: qrData.tokenId
    });

    return ApiResponse.success(res, {
      qrCode: {
        url: qrData.url,
        token: qrData.token,
        tokenId: qrData.tokenId,
        machineId: qrData.machineId,
        label: label || `QR-${machine.qrTokens.length}`,
        createdAt: new Date()
      }
    }, "QR token generated successfully");

  } catch (error) {
    logger.error('Generate QR token failed', {
      error: error.message,
      machineId: req.params?.machineId,
      adminId: req.user?.uid
    });
    throw error;
  }
};

// ---------------------------------
// Get all QR tokens for a machine
export const getMachineQRTokens = async (req, res) => {
  try {
    const { machineId } = req.params;

    logger.info('Get machine QR tokens request', {
      adminId: req.user?.uid,
      machineId
    });

    // Fetch machine with tokens
    const machine = await DatabaseUtil.findOne(Machine, { mid: machineId }, {
      throwIfNotFound: true,
      select: 'mid qrTokens revokedTokens location'
    });

    // Get active and revoked token lists
    const activeTokens = machine.getActiveTokens();
    const revokedTokenIds = machine.revokedTokens || [];

    // Build full token list with status
    const allTokens = (machine.qrTokens || []).map(token => ({
      tokenId: token.tokenId,
      label: token.label,
      createdAt: token.createdAt,
      createdBy: token.createdBy,
      isActive: !revokedTokenIds.includes(token.tokenId),
      status: revokedTokenIds.includes(token.tokenId) ? 'REVOKED' : 'ACTIVE'
    }));

    logger.info('Machine QR tokens retrieved', {
      adminId: req.user?.uid,
      machineId,
      totalTokens: allTokens.length,
      activeTokens: activeTokens.length
    });

    return ApiResponse.success(res, {
      machineId: machine.mid,
      location: machine.location,
      tokens: allTokens,
      summary: {
        total: allTokens.length,
        active: activeTokens.length,
        revoked: revokedTokenIds.length
      }
    }, "Machine QR tokens retrieved successfully");

  } catch (error) {
    logger.error('Get machine QR tokens failed', {
      error: error.message,
      machineId: req.params?.machineId,
      adminId: req.user?.uid
    });
    throw error;
  }
};

// ---------------------------------
// Revoke a QR token
export const revokeMachineQRToken = async (req, res) => {
  try {
    const { machineId, tokenId } = req.params;

    logger.info('Revoke QR token request', {
      adminId: req.user?.uid,
      machineId,
      tokenId
    });

    // Validate inputs
    if (!machineId || !tokenId) {
      throw new BadRequestError('Machine ID and Token ID are required');
    }

    // Fetch machine
    const machine = await DatabaseUtil.findOne(Machine, { mid: machineId }, {
      throwIfNotFound: true
    });

    // Check if token exists
    const tokenExists = machine.qrTokens?.some(t => t.tokenId === tokenId);
    if (!tokenExists) {
      throw new NotFoundError(`Token ${tokenId} not found for machine ${machineId}`);
    }

    // Check if already revoked
    if (machine.isTokenActive(tokenId)) {
      machine.revokeToken(tokenId);
      await machine.save();

      logger.info('QR token revoked successfully', {
        adminId: req.user?.uid,
        machineId,
        tokenId
      });

      return ApiResponse.success(res, {
        machineId,
        tokenId,
        status: 'REVOKED',
        revokedAt: new Date(),
        revokedBy: req.user?.uid || 'admin'
      }, "QR token revoked successfully");
    } else {
      return ApiResponse.success(res, {
        machineId,
        tokenId,
        status: 'ALREADY_REVOKED'
      }, "Token was already revoked");
    }

  } catch (error) {
    logger.error('Revoke QR token failed', {
      error: error.message,
      machineId: req.params?.machineId,
      tokenId: req.params?.tokenId,
      adminId: req.user?.uid
    });
    throw error;
  }
};

// ---------------------------------
// Verify a machine token (for testing/debugging)
export const verifyMachineToken = async (req, res) => {
  try {
    const { token } = req.body;

    logger.info('Verify machine token request', {
      adminId: req.user?.uid
    });

    if (!token) {
      throw new BadRequestError('Token is required');
    }

    // Verify token signature
    const tokenResult = machineTokenService.verifyMachineToken(token);

    if (!tokenResult.valid) {
      logger.warn('Token verification failed', {
        error: tokenResult.error,
        adminId: req.user?.uid
      });

      return ApiResponse.success(res, {
        valid: false,
        error: tokenResult.error,
        message: tokenResult.message
      }, "Token verification result");
    }

    // Check machine exists
    const machine = await DatabaseUtil.findOne(Machine, {
      mid: tokenResult.machineId
    });

    if (!machine) {
      return ApiResponse.success(res, {
        valid: false,
        error: 'MACHINE_NOT_FOUND',
        message: `Machine ${tokenResult.machineId} not found`,
        tokenData: tokenResult
      }, "Token valid but machine not found");
    }

    // Check if token is revoked
    const isActive = machine.isTokenActive(tokenResult.tokenId);

    logger.info('Token verification completed', {
      machineId: tokenResult.machineId,
      tokenId: tokenResult.tokenId,
      isActive,
      adminId: req.user?.uid
    });

    return ApiResponse.success(res, {
      valid: true,
      token: {
        machineId: tokenResult.machineId,
        tokenId: tokenResult.tokenId,
        issuedAt: tokenResult.issuedAt,
        isActive,
        status: isActive ? 'ACTIVE' : 'REVOKED'
      },
      machine: {
        mid: machine.mid,
        location: machine.location,
        status: machine.mstatus,
        isActive: machine.isActive
      }
    }, "Token verification successful");

  } catch (error) {
    logger.error('Verify machine token failed', {
      error: error.message,
      adminId: req.user?.uid
    });
    throw error;
  }
};
