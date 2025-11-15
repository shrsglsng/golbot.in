/**
 * Machine Resolver Service
 *
 * Central service for resolving and validating machine tokens (mt).
 * Handles machine verification, status checks, and provides normalized machine objects.
 */

import machineTokenService from './machineTokenService.js';
import Machine from '../models/machineModel.js';

class MachineResolver {
  /**
   * Resolve machine from token (mt parameter)
   * @param {String} token - Machine token from QR code
   * @param {Object} options - Resolution options
   * @param {Boolean} options.requireOnline - Require machine to be CONNECTED (default: true)
   * @param {Boolean} options.requireActive - Require machine to be active (default: true)
   * @returns {Promise<Object>} Normalized machine object
   */
  async resolveMachineFromToken(token, options = {}) {
    const {
      requireOnline = true,
      requireActive = true,
    } = options;

    // Validate token structure and signature
    const tokenResult = machineTokenService.verifyMachineToken(token);

    if (!tokenResult.valid) {
      return {
        success: false,
        error: tokenResult.error,
        message: tokenResult.message,
        code: this._getErrorCode(tokenResult.error),
      };
    }

    const { machineId, tokenId, issuedAt } = tokenResult;

    // Fetch machine from database
    const machine = await Machine.findOne({ mid: machineId });

    if (!machine) {
      return {
        success: false,
        error: 'MACHINE_NOT_FOUND',
        message: `Machine ${machineId} not found`,
        code: 404,
      };
    }

    // Check if token has been revoked
    if (!machine.isTokenActive(tokenId)) {
      return {
        success: false,
        error: 'TOKEN_REVOKED',
        message: 'This QR code has been deactivated. Please scan the latest QR code.',
        code: 403,
      };
    }

    // Validate machine is active (not disabled by admin)
    if (requireActive && !machine.isActive) {
      return {
        success: false,
        error: 'MACHINE_INACTIVE',
        message: `Machine ${machineId} is currently inactive`,
        code: 403,
      };
    }

    // Validate machine status (online/offline)
    if (requireOnline && machine.mstatus !== 'CONNECTED') {
      return {
        success: false,
        error: 'MACHINE_OFFLINE',
        message: `Machine ${machineId} is currently offline. Please try another machine or contact support.`,
        code: 503,
        machineId: machine.mid,
        machineLocation: machine.location,
      };
    }

    // Return normalized machine object
    return {
      success: true,
      machine: this._normalizeMachine(machine),
      tokenInfo: {
        tokenId,
        issuedAt,
      },
    };
  }

  /**
   * Resolve machine by ID (without token)
   * @param {String} machineId - Machine ID (e.g., "M01")
   * @param {Object} options - Resolution options
   * @returns {Promise<Object>} Normalized machine object
   */
  async resolveMachineById(machineId, options = {}) {
    const {
      requireOnline = false,
      requireActive = true,
    } = options;

    if (!machineId) {
      return {
        success: false,
        error: 'MACHINE_ID_REQUIRED',
        message: 'Machine ID is required',
        code: 400,
      };
    }

    const machine = await Machine.findOne({ mid: machineId });

    if (!machine) {
      return {
        success: false,
        error: 'MACHINE_NOT_FOUND',
        message: `Machine ${machineId} not found`,
        code: 404,
      };
    }

    if (requireActive && !machine.isActive) {
      return {
        success: false,
        error: 'MACHINE_INACTIVE',
        message: `Machine ${machineId} is currently inactive`,
        code: 403,
      };
    }

    if (requireOnline && machine.mstatus !== 'CONNECTED') {
      return {
        success: false,
        error: 'MACHINE_OFFLINE',
        message: `Machine ${machineId} is currently offline`,
        code: 503,
      };
    }

    return {
      success: true,
      machine: this._normalizeMachine(machine),
    };
  }

  /**
   * Validate machine for order creation
   * Checks machine exists, is active, and is online
   * @param {String} machineIdOrToken - Machine ID or machine token
   * @param {String} source - Source of the identifier ('token' or 'id')
   * @returns {Promise<Object>} Validation result with machine data
   */
  async validateForOrderCreation(machineIdOrToken, source = 'id') {
    if (source === 'token') {
      return await this.resolveMachineFromToken(machineIdOrToken, {
        requireOnline: true,
        requireActive: true,
      });
    } else {
      return await this.resolveMachineById(machineIdOrToken, {
        requireOnline: true,
        requireActive: true,
      });
    }
  }

  /**
   * Normalize machine object for consistent API responses
   * @param {Object} machine - Mongoose machine document
   * @returns {Object} Normalized machine data
   * @private
   */
  _normalizeMachine(machine) {
    return {
      id: machine.mid,
      status: machine.mstatus,
      isActive: machine.isActive,
      location: machine.location,
      isOnline: machine.mstatus === 'CONNECTED',
      lastSeen: machine.lastPingedAt,
    };
  }

  /**
   * Map error codes to HTTP status codes
   * @param {String} errorCode - Error code from token verification
   * @returns {Number} HTTP status code
   * @private
   */
  _getErrorCode(errorCode) {
    const errorCodeMap = {
      'TOKEN_MISSING': 400,
      'INVALID_TOKEN_STRUCTURE': 400,
      'INVALID_SIGNATURE': 401,
      'TOKEN_EXPIRED': 401,
      'VERIFICATION_FAILED': 401,
      'MACHINE_NOT_FOUND': 404,
      'TOKEN_REVOKED': 403,
      'MACHINE_INACTIVE': 403,
      'MACHINE_OFFLINE': 503,
    };

    return errorCodeMap[errorCode] || 400;
  }

  /**
   * Log machine resolution event
   * @param {String} event - Event name
   * @param {Object} data - Event data
   * @private
   */
  _logEvent(event, data) {
    // TODO: Implement proper event logging (e.g., to monitoring service)
    console.log(`[MachineResolver] ${event}:`, JSON.stringify(data));
  }
}

export default new MachineResolver();
