/**
 * Machine Token Service
 *
 * Handles generation and verification of machine tokens (mt) for QR code-based routing.
 * Tokens are permanent (no expiration) and multiple tokens can be valid per machine.
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

class MachineTokenService {
  /**
   * Get JWT secret (lazy-loaded)
   * @private
   */
  _getSecret() {
    const secret = process.env.EXPAPP_JWT_SECRET;
    if (!secret) {
      throw new Error('EXPAPP_JWT_SECRET is not configured');
    }
    return secret;
  }

  /**
   * Generate a machine token (mt) for QR code
   * @param {String} machineId - Machine ID (e.g., "M01")
   * @param {String} tokenId - Optional unique token identifier for tracking/revocation
   * @returns {Object} { token, tokenId, machineId, issuedAt }
   */
  generateMachineToken(machineId, tokenId = null) {
    if (!machineId) {
      throw new Error('machineId is required to generate machine token');
    }

    // Generate unique token ID if not provided (for tracking/rotation)
    const tid = tokenId || crypto.randomBytes(16).toString('hex');
    const issuedAt = Math.floor(Date.now() / 1000);

    const payload = {
      machineId,      // Machine identifier
      tid,            // Token ID for tracking
      iat: issuedAt,  // Issued at timestamp
      type: 'machine_qr' // Token type identifier
    };

    // Sign token without expiration (permanent)
    const token = jwt.sign(payload, this._getSecret(), {
      algorithm: 'HS256'
    });

    return {
      token,
      tokenId: tid,
      machineId,
      issuedAt: new Date(issuedAt * 1000)
    };
  }

  /**
   * Verify and decode a machine token
   * @param {String} token - Machine token to verify
   * @returns {Object|null} { machineId, tokenId, issuedAt, valid } or null if invalid
   */
  verifyMachineToken(token) {
    if (!token || typeof token !== 'string') {
      return {
        valid: false,
        error: 'TOKEN_MISSING',
        message: 'Machine token is required'
      };
    }

    try {
      // Verify signature and decode
      const decoded = jwt.verify(token, this._getSecret(), {
        algorithms: ['HS256']
      });

      // Validate token structure
      if (!decoded.machineId || !decoded.tid || decoded.type !== 'machine_qr') {
        return {
          valid: false,
          error: 'INVALID_TOKEN_STRUCTURE',
          message: 'Token is not a valid machine QR token'
        };
      }

      return {
        valid: true,
        machineId: decoded.machineId,
        tokenId: decoded.tid,
        issuedAt: new Date(decoded.iat * 1000)
      };
    } catch (error) {
      // Handle JWT verification errors
      if (error.name === 'JsonWebTokenError') {
        return {
          valid: false,
          error: 'INVALID_SIGNATURE',
          message: 'Token signature is invalid'
        };
      }

      if (error.name === 'TokenExpiredError') {
        // This shouldn't happen as we don't set expiration, but handle it anyway
        return {
          valid: false,
          error: 'TOKEN_EXPIRED',
          message: 'Token has expired'
        };
      }

      return {
        valid: false,
        error: 'VERIFICATION_FAILED',
        message: error.message || 'Token verification failed'
      };
    }
  }

  /**
   * Generate QR code URL with machine token
   * @param {String} machineId - Machine ID
   * @param {String} baseUrl - Base URL of the application (e.g., "https://golbot.in")
   * @param {String} tokenId - Optional token ID for tracking
   * @returns {Object} { url, token, tokenId }
   */
  generateQRCodeUrl(machineId, baseUrl, tokenId = null) {
    const { token, tokenId: tid } = this.generateMachineToken(machineId, tokenId);

    // Construct QR URL: https://<host>/auth/login?next=<machineId>
    const url = `${baseUrl}/auth/login?next=${machineId}`;

    return {
      url,
      token,
      tokenId: tid,
      machineId
    };
  }

  /**
   * Validate if a machine token is active (not revoked)
   * This checks against the machine's revokedTokens list
   * @param {String} tokenId - Token ID to check
   * @param {Array} revokedTokens - Array of revoked token IDs from machine document
   * @returns {Boolean} true if active, false if revoked
   */
  isTokenActive(tokenId, revokedTokens = []) {
    return !revokedTokens.includes(tokenId);
  }
}

export default new MachineTokenService();
