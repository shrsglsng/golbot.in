/**
 * PhonePe Payment Service
 * 
 * Handles PhonePe API interactions including:
 * - OAuth token management with caching
 * - Payment order creation
 * - Payment status checking
 * - Error handling and logging
 */

import axios from "axios";
import crypto from "node:crypto";
import { paymentConfig } from "../config/paymentConfig.js";
import logger from "../utils/logger.js";
import { ExternalServiceError } from "../utils/errors.js";

class PhonePeService {
  constructor() {
    this.tokenCache = {
      token: null,
      expiresAt: 0
    };
    
    this.config = paymentConfig.phonepe;
    if (!this.config.enabled) {
      logger.warn('PhonePe service initialized but not enabled');
    }
  }

  /**
   * Get OAuth access token with caching
   * @returns {Promise<string>} Access token
   */
  async getAuthToken() {
    const now = Math.floor(Date.now() / 1000);
    
    // Return cached token if still valid (with 60s buffer)
    if (this.tokenCache.token && this.tokenCache.expiresAt - 60 > now) {
      logger.debug('Using cached PhonePe auth token');
      return this.tokenCache.token;
    }

    logger.info('Requesting new PhonePe auth token');

    try {
      const form = new URLSearchParams({
        client_id: this.config.clientId,
        client_version: this.config.clientVersion,
        client_secret: this.config.clientSecret,
        grant_type: 'client_credentials'
      });

      const response = await axios.post(
        `${this.config.authBaseUrl}/v1/oauth/token`,
        form,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000 // 10 second timeout for auth requests
        }
      );

      const { access_token, expires_at, expires_in } = response.data;

      if (!access_token) {
        throw new Error('No access token in PhonePe auth response');
      }

      // Calculate expiry time (use expires_at if available, otherwise use expires_in)
      const expiresAt = expires_at || (now + (expires_in || 50 * 60));

      this.tokenCache = {
        token: access_token,
        expiresAt
      };

      logger.info('PhonePe auth token obtained successfully', {
        expiresAt: new Date(expiresAt * 1000).toISOString()
      });

      return access_token;

    } catch (error) {
      logger.error('PhonePe auth token request failed', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      throw new ExternalServiceError(
        'Failed to obtain PhonePe authentication token',
        'PhonePe Auth'
      );
    }
  }

  /**
   * Create a payment order
   * @param {string} orderId - Merchant order ID  
   * @param {number} amountPaise - Amount in paise
   * @param {string} redirectUrl - URL to redirect after payment
   * @param {Object} metadata - Additional order metadata
   * @returns {Promise<Object>} Payment order response
   */
  async createPayment(orderId, amountPaise, redirectUrl, metadata = {}) {
    logger.info('Creating PhonePe payment order', {
      orderId,
      amountPaise,
      redirectUrl: redirectUrl?.substring(0, 50) + '...'
    });

    try {
      const token = await this.getAuthToken();

      const payload = {
        merchantOrderId: orderId,
        amount: amountPaise,
        paymentFlow: {
          type: 'PG_CHECKOUT',
          merchantUrls: {
            redirectUrl: redirectUrl || this.config.redirectUrl
          }
        },
        // Optional additional data
        ...(metadata.userId && { userId: metadata.userId }),
        ...(metadata.description && { description: metadata.description })
      };

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${token}`
      };

      const response = await axios.post(
        `${this.config.baseUrl}/checkout/v2/pay`,
        payload,
        {
          headers,
          timeout: 15000 // 15 second timeout for payment creation
        }
      );

      logger.info('PhonePe payment order created successfully', {
        orderId,
        success: response.data?.success,
        hasPayPageUrl: !!(response.data?.payload?.payPageUrl || response.data?.payPageUrl),
        responseKeys: Object.keys(response.data || {}),
        payloadKeys: response.data?.payload ? Object.keys(response.data.payload) : 'no payload'
      });

      // Log the full response structure for debugging
      logger.debug('PhonePe API response structure', {
        orderId,
        responseData: response.data
      });

      return response.data;

    } catch (error) {
      logger.error('PhonePe payment creation failed', {
        orderId,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      throw new ExternalServiceError(
        `Failed to create PhonePe payment order: ${error.response?.data?.message || error.message}`,
        'PhonePe Payment'
      );
    }
  }

  /**
   * Get payment order status
   * @param {string} orderId - Merchant order ID
   * @returns {Promise<Object>} Order status response
   */
  async getOrderStatus(orderId) {
    logger.info('Checking PhonePe order status', { orderId });

    try {
      const token = await this.getAuthToken();

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${token}`
      };

      const response = await axios.get(
        `${this.config.baseUrl}/checkout/v2/order/${orderId}/status?details=false`,
        {
          headers,
          timeout: 10000 // 10 second timeout for status check
        }
      );

      const status = response.data?.status || response.data?.payload?.status || 'UNKNOWN';

      logger.info('PhonePe order status retrieved', {
        orderId,
        status,
        success: response.data?.success
      });

      return response.data;

    } catch (error) {
      logger.error('PhonePe status check failed', {
        orderId,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      throw new ExternalServiceError(
        `Failed to check PhonePe order status: ${error.response?.data?.message || error.message}`,
        'PhonePe Status'
      );
    }
  }

  /**
   * Verify payment completion
   * @param {string} orderId - Merchant order ID
   * @returns {Promise<Object>} Verification result with payment details
   */
  async verifyPayment(orderId) {
    logger.info('Verifying PhonePe payment', { orderId });

    try {
      const statusResponse = await this.getOrderStatus(orderId);

      // DEBUG: Log the entire raw response
      logger.info('🔍 PhonePe RAW STATUS RESPONSE', {
        orderId,
        fullResponse: JSON.stringify(statusResponse, null, 2),
        hasPayload: !!statusResponse?.payload,
        topLevelKeys: Object.keys(statusResponse || {})
      });

      const payload = statusResponse?.payload || statusResponse;
      const status = payload?.status;
      const state = payload?.state;

      // PhonePe UAT uses 'paymentDetails' array instead of 'paymentInstrument'
      const hasPaymentInstrument = !!payload?.paymentInstrument;
      const hasPaymentDetails = Array.isArray(payload?.paymentDetails) && payload.paymentDetails.length > 0;
      const hasPayment = hasPaymentInstrument || hasPaymentDetails;

      // DEBUG: Log extracted values
      logger.info('🔍 PhonePe EXTRACTED VALUES', {
        orderId,
        status,
        state,
        hasPaymentInstrument,
        hasPaymentDetails,
        hasPayment,
        paymentDetailsCount: payload?.paymentDetails?.length || 0,
        payloadKeys: Object.keys(payload || {})
      });

      // PhonePe payment states: COMPLETED, FAILED, PENDING
      // Payment is successful if:
      // 1. Production: status=PAID + state=COMPLETED + hasPaymentInstrument
      // 2. UAT/Test: state=COMPLETED + hasPaymentDetails (status field doesn't exist in UAT)
      const isSuccessful = state === 'COMPLETED' && (
        (status === 'PAID' && hasPaymentInstrument) || // Production
        (!status && hasPaymentDetails) || // UAT (no status field, uses paymentDetails)
        status === 'UNKNOWN' // Fallback for other test scenarios
      );
      const isFailed = status === 'FAILED' || state === 'FAILED';
      
      // Extract payment method from either Production or UAT format
      let paymentMethod = payload?.paymentInstrument?.type;
      let paymentInfo = {
        type: payload?.paymentInstrument?.type,
        upi: payload?.paymentInstrument?.upi,
        card: payload?.paymentInstrument?.card
      };

      // UAT format: extract from paymentDetails array
      if (!paymentMethod && hasPaymentDetails) {
        const firstPayment = payload.paymentDetails[0];
        paymentMethod = firstPayment?.paymentMode;
        const firstInstrument = firstPayment?.splitInstruments?.[0];

        paymentInfo = {
          type: firstPayment?.paymentMode,
          transactionId: firstPayment?.transactionId,
          upi: firstInstrument?.rail?.vpa,
          bankId: firstInstrument?.instrument?.bankId,
          accountType: firstInstrument?.instrument?.accountType
        };
      }

      const result = {
        orderId,
        success: isSuccessful,
        failed: isFailed,
        pending: !isSuccessful && !isFailed,
        status,
        state,
        transactionId: payload?.merchantTransactionId || payload?.transactionId || payload?.paymentDetails?.[0]?.transactionId,
        amount: payload?.amount,
        currency: payload?.currency || this.config.currency,
        paymentMethod,
        paymentDetails: paymentInfo,
        rawResponse: payload
      };

      logger.info('PhonePe payment verification completed', {
        orderId,
        success: result.success,
        failed: result.failed,
        pending: result.pending,
        status: result.status,
        state: result.state,
        hasPaymentInstrument,
        hasPaymentDetails,
        paymentMethod: result.paymentMethod
      });

      return result;

    } catch (error) {
      logger.error('PhonePe payment verification failed', {
        orderId,
        error: error.message
      });

      throw new ExternalServiceError(
        `Failed to verify PhonePe payment: ${error.message}`,
        'PhonePe Verification'
      );
    }
  }

  /**
   * Extract payment URL from various response formats
   * @param {Object} response - PhonePe API response
   * @returns {string|null} Payment URL
   */
  extractPaymentUrl(response) {
    if (!response) return null;

    const candidates = [
      response?.payload?.payPageUrl,
      response?.payload?.redirectUrl,
      response?.payPageUrl,
      response?.redirectUrl,
      response?.paymentDetails?.payPageUrl,
      response?.paymentDetails?.redirectUrl
    ];

    return candidates.find(Boolean) || null;
  }

  /**
   * Validate webhook signature (if authentication is enabled)
   * @param {string} signature - Received signature
   * @param {string} payload - Webhook payload
   * @returns {boolean} Whether signature is valid
   */
  validateWebhookSignature(signature, payload) {
    if (!this.config.webhookUser || !this.config.webhookPass) {
      logger.debug('PhonePe webhook authentication disabled');
      return true; // No auth configured
    }

    try {
      const expectedHash = crypto.createHash('sha256')
        .update(`${this.config.webhookUser}:${this.config.webhookPass}`)
        .digest('hex');
      const expectedSignature = `SHA256(${expectedHash})`;

      const isValid = signature === expectedSignature;
      
      if (!isValid) {
        logger.warn('PhonePe webhook signature mismatch', {
          expected: expectedSignature.substring(0, 20) + '...',
          received: signature?.substring(0, 20) + '...'
        });
      }

      return isValid;

    } catch (error) {
      logger.error('PhonePe webhook signature validation error', { error: error.message });
      return false;
    }
  }

  /**
   * Get service health status
   * @returns {Object} Health status
   */
  getHealthStatus() {
    return {
      service: 'PhonePe',
      enabled: this.config.enabled,
      environment: this.config.environment,
      hasCredentials: !!(this.config.clientId && this.config.clientSecret),
      tokenCached: !!this.tokenCache.token,
      tokenExpiry: this.tokenCache.expiresAt ? new Date(this.tokenCache.expiresAt * 1000) : null
    };
  }
}

// Export singleton instance
export const phonePeService = new PhonePeService();
export default phonePeService;