/**
 * Crashlytics Utility
 * Production-ready error tracking with Firebase Crashlytics
 * 
 * Usage:
 * - initCrashlytics() in App.tsx
 * - logError() for caught errors
 * - setUserId() after user login
 */

import crashlytics from '@react-native-firebase/crashlytics';
import { logger } from './logger';

/**
 * Initialize Crashlytics
 * Disables in development, enables in production
 */
export const initCrashlytics = () => {
  if (__DEV__) {
    // Disable in development (optional)
    crashlytics().setCrashlyticsCollectionEnabled(false);
    logger.info('[Crashlytics] Disabled in development');
  } else {
    crashlytics().setCrashlyticsCollectionEnabled(true);
    logger.info('[Crashlytics] Enabled for production');
  }
};

/**
 * Log error to Crashlytics
 * @param error - The error object
 * @param context - Optional context description
 */
export const logError = (error: Error, context?: string) => {
  try {
    if (context) {
      crashlytics().log(context);
    }
    
    // Record error in Crashlytics
    crashlytics().recordError(error);
    
    // Also log locally for debugging
    logger.error(`[Crashlytics] Error logged: ${context || 'Unknown context'}`, error);
  } catch (crashError) {
    // Fail silently if Crashlytics fails
    logger.error('[Crashlytics] Failed to log error', crashError);
  }
};

/**
 * Set user ID for crash reports
 * Call this after user login
 * @param userId - Firebase user ID
 */
export const setUserId = (userId: string) => {
  try {
    crashlytics().setUserId(userId);
    logger.info(`[Crashlytics] User ID set: ${userId}`);
  } catch (error) {
    logger.error('[Crashlytics] Failed to set user ID', error);
  }
};

/**
 * Set custom attribute
 * Useful for filtering crashes by user properties
 * @param key - Attribute key
 * @param value - Attribute value
 */
export const setAttribute = (key: string, value: string) => {
  try {
    crashlytics().setAttribute(key, value);
    logger.info(`[Crashlytics] Attribute set: ${key}=${value}`);
  } catch (error) {
    logger.error('[Crashlytics] Failed to set attribute', error);
  }
};

/**
 * Clear user data from Crashlytics
 * Call this on user logout
 */
export const clearUserData = () => {
  try {
    crashlytics().setUserId('');
    logger.info('[Crashlytics] User data cleared');
  } catch (error) {
    logger.error('[Crashlytics] Failed to clear user data', error);
  }
};

/**
 * Force a crash (testing only!)
 * NEVER call this in production code
 * Use only for testing Crashlytics setup
 */
export const testCrash = () => {
  if (__DEV__) {
    logger.warn('[Crashlytics] Test crash triggered');
    crashlytics().crash();
  } else {
    logger.error('[Crashlytics] testCrash() should never be called in production!');
  }
};

/**
 * Log custom message to crash report
 * @param message - Log message
 */
export const logMessage = (message: string) => {
  try {
    crashlytics().log(message);
  } catch (error) {
    logger.error('[Crashlytics] Failed to log message', error);
  }
};

export default {
  init: initCrashlytics,
  logError,
  setUserId,
  setAttribute,
  clearUserData,
  testCrash,
  logMessage,
};
