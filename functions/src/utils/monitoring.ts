/**
 * Cloud Monitoring Utilities
 * Structured logging for Cloud Functions
 */

import * as functions from 'firebase-functions';

export const monitoringLogger = {
  /**
   * Log info message
   * @param message - Log message
   * @param data - Additional data
   */
  info: (message: string, data?: any) => {
    functions.logger.info(message, data);
  },

  /**
   * Log warning
   * @param message - Warning message
   * @param data - Additional data
   */
  warn: (message: string, data?: any) => {
    functions.logger.warn(message, data);
  },

  /**
   * Log error with structured data
   * @param message - Error message
   * @param error - Error object
   */
  error: (message: string, error: any) => {
    functions.logger.error(message, {
      error: error.message || String(error),
      stack: error.stack,
      code: error.code
    });
  },

  /**
   * Log function execution time
   * @param functionName - Name of the function
   * @param startTime - Start timestamp
   */
  logExecutionTime: (functionName: string, startTime: number) => {
    const duration = Date.now() - startTime;
    functions.logger.info(`Function ${functionName} executed in ${duration}ms`, {
      function: functionName,
      duration_ms: duration
    });
  },

  /**
   * Log API usage for billing and monitoring
   * @param userId - User ID
   * @param apiName - API name (e.g., 'gemini-treatment', 'gemini-vision')
   * @param cost - Estimated cost in USD
   */
  logAPIUsage: (userId: string, apiName: string, cost: number) => {
    functions.logger.info('API Usage', {
      userId,
      apiName,
      cost,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log security event
   * @param event - Security event type
   * @param userId - User ID (if available)
   * @param details - Event details
   */
  logSecurityEvent: (event: string, userId: string | null, details: any) => {
    functions.logger.warn('Security Event', {
      event,
      userId,
      details,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log rate limit event
   * @param userId - User ID
   * @param requestCount - Number of requests
   */
  logRateLimit: (userId: string, requestCount: number) => {
    functions.logger.warn('Rate Limit Exceeded', {
      userId,
      requestCount,
      timestamp: new Date().toISOString()
    });
  }
};

export default monitoringLogger;
