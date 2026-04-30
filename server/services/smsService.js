import axios from 'axios';
import logger from '../utils/logger.js';
import { ExternalServiceError, UnauthorizedError, RateLimitError } from '../utils/errors.js';

const STARTMESSAGING_API_URL = 'https://api.startmessaging.com';
const DEFAULT_TEMPLATE_ID = '0afbdeb0-785d-4dd0-bd48-365a182df276';

/**
 * Handles errors from the StartMessaging API
 * @param {Error} error - The axios error object
 */
const handleApiError = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    
    logger.error(`StartMessaging API Error: ${status}`, { data });

    switch (status) {
      case 401:
        throw new UnauthorizedError('Invalid StartMessaging API Key');
      case 402:
        throw new ExternalServiceError('Insufficient Balance for SMS', 'StartMessaging');
      case 429:
        throw new RateLimitError('SMS Rate limit exceeded');
      default:
        throw new ExternalServiceError(
          `StartMessaging API error: ${data?.message || 'Unknown error'}`, 
          'StartMessaging'
        );
    }
  } else if (error.request) {
    logger.error('StartMessaging API Network Error', { error: error.message });
    throw new ExternalServiceError('Network error connecting to SMS provider', 'StartMessaging');
  } else {
    logger.error('StartMessaging Error', { error: error.message });
    throw new ExternalServiceError('Error sending SMS', 'StartMessaging');
  }
};

/**
 * Sends an OTP using the StartMessaging API
 * @param {string} phoneNumber - The phone number in E.164 format
 * @param {string} otpCode - The 4-6 digit OTP code
 * @param {string} [appName='GolBot'] - Optional app name
 * @returns {Promise<Object>} The API response containing message details
 */
export const sendOTP = async (phoneNumber, otpCode, appName = 'GolBot') => {
  const apiKey = process.env.STARTMESSAGING_API_KEY;
  if (!apiKey) {
    logger.error('STARTMESSAGING_API_KEY is not configured');
    throw new ExternalServiceError('SMS service not configured', 'StartMessaging');
  }

  try {
    const response = await axios.post(
      `${STARTMESSAGING_API_URL}/otp/send`,
      {
        phoneNumber,
        templateId: process.env.OTP_TEMPLATE_ID || DEFAULT_TEMPLATE_ID,
        variables: {
          otp: otpCode,
          appName
        }
      },
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info('OTP sent successfully via StartMessaging', { 
      phoneNumber: phoneNumber.replace(/\d{4}$/, '****'), // Mask last 4 digits
      messageId: response.data?.id || response.data?.messageId 
    });

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Checks the status of a sent message
 * @param {string} messageId - The ID of the message to check
 * @returns {Promise<Object>} The status of the message (initiated, queued, sent, delivered, failed)
 */
export const checkStatus = async (messageId) => {
  const apiKey = process.env.STARTMESSAGING_API_KEY;
  if (!apiKey) {
    throw new ExternalServiceError('SMS service not configured', 'StartMessaging');
  }

  try {
    const response = await axios.get(
      `${STARTMESSAGING_API_URL}/messages/${messageId}`,
      {
        headers: {
          'X-API-Key': apiKey
        }
      }
    );

    logger.debug('Checked StartMessaging message status', { 
      messageId, 
      status: response.data?.status 
    });

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export default {
  sendOTP,
  checkStatus
};
