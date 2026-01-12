/**
 * Analytics Utility
 * Production-ready user behavior tracking with Firebase Analytics
 * 
 * Usage:
 * - initAnalytics() in App.tsx
 * - logScreenView() for navigation
 * - logEvent() for custom events
 * - logPurchase() for subscription purchases
 */

import analytics from '@react-native-firebase/analytics';
import { logger } from './logger';

/**
 * Initialize Analytics
 * Disables in development, enables in production
 */
export const initAnalytics = async () => {
  try {
    if (__DEV__) {
      await analytics().setAnalyticsCollectionEnabled(false);
      logger.info('[Analytics] Disabled in development');
    } else {
      await analytics().setAnalyticsCollectionEnabled(true);
      logger.info('[Analytics] Enabled for production');
    }
  } catch (error) {
    logger.error('[Analytics] Initialization failed', error);
  }
};

/**
 * Log screen view
 * Called automatically by navigation
 * @param screenName - Screen name (e.g., 'PaymentScreen')
 * @param screenClass - Optional screen class
 */
export const logScreenView = async (screenName: string, screenClass?: string) => {
  try {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenClass || screenName,
    });
    logger.log(`[Analytics] Screen view: ${screenName}`);
  } catch (error) {
    logger.error('[Analytics] Failed to log screen view', error);
  }
};

/**
 * Set user property
 * Use for segmentation in analytics
 * @param name - Property name
 * @param value - Property value
 */
export const setUserProperty = async (name: string, value: string) => {
  try {
    await analytics().setUserProperty(name, value);
    logger.log(`[Analytics] User property: ${name}=${value}`);
  } catch (error) {
    logger.error('[Analytics] Failed to set user property', error);
  }
};

/**
 * Set user ID
 * Call after user login
 * @param userId - Firebase user ID
 */
export const setUserId = async (userId: string) => {
  try {
    await analytics().setUserId(userId);
    logger.info(`[Analytics] User ID set: ${userId}`);
  } catch (error) {
    logger.error('[Analytics] Failed to set user ID', error);
  }
};

/**
 * Log custom event
 * @param name - Event name (lowercase, underscores)
 * @param params - Event parameters
 */
export const logEvent = async (name: string, params?: { [key: string]: any }) => {
  try {
    await analytics().logEvent(name, params);
    logger.log(`[Analytics] Event: ${name}`, params);
  } catch (error) {
    logger.error('[Analytics] Failed to log event', error);
  }
};

// ============================================
// Predefined Events (Firebase recommended)
// ============================================

/**
 * Log user login
 * @param method - Login method ('email', 'google', etc.)
 */
export const logLogin = async (method: string) => {
  try {
    await analytics().logLogin({ method });
    logger.info(`[Analytics] Login: ${method}`);
  } catch (error) {
    logger.error('[Analytics] Failed to log login', error);
  }
};

/**
 * Log user sign up
 * @param method - Sign up method ('email', 'google', etc.)
 */
export const logSignUp = async (method: string) => {
  try {
    await analytics().logSignUp({ method });
    logger.info(`[Analytics] Sign up: ${method}`);
  } catch (error) {
    logger.error('[Analytics] Failed to log sign up', error);
  }
};

/**
 * Log purchase/subscription
 * @param value - Purchase amount
 * @param currency - Currency code ('EUR', 'USD', etc.)
 * @param items - Optional items array
 */
export const logPurchase = async (
  value: number, 
  currency: string, 
  items?: Array<{ item_id: string; item_name?: string; quantity?: number }>
) => {
  try {
    await analytics().logPurchase({
      value,
      currency,
      items: items || [],
    });
    logger.info(`[Analytics] Purchase: ${value} ${currency}`);
  } catch (error) {
    logger.error('[Analytics] Failed to log purchase', error);
  }
};

/**
 * Log content selection
 * @param contentType - Type of content ('subscription_plan', 'feature', etc.)
 * @param itemId - Item ID
 */
export const logSelectContent = async (contentType: string, itemId: string) => {
  try {
    await analytics().logSelectContent({
      content_type: contentType,
      item_id: itemId,
    });
    logger.log(`[Analytics] Select content: ${contentType} - ${itemId}`);
  } catch (error) {
    logger.error('[Analytics] Failed to log select content', error);
  }
};

/**
 * Log app open
 */
export const logAppOpen = async () => {
  try {
    await analytics().logAppOpen();
    logger.info('[Analytics] App opened');
  } catch (error) {
    logger.error('[Analytics] Failed to log app open', error);
  }
};

// ============================================
// FinTrack-specific Events
// ============================================

/**
 * Log transaction creation
 * @param category - Transaction category
 * @param amount - Transaction amount
 * @param type - Transaction type ('expense' or 'income')
 */
export const logTransactionCreated = async (
  category: string, 
  amount: number,
  type: 'expense' | 'income'
) => {
  await logEvent('transaction_created', {
    category,
    amount,
    type,
  });
};

/**
 * Log QR code scan
 * @param success - Whether scan was successful
 */
export const logQRScan = async (success: boolean) => {
  await logEvent('qr_scan', { success });
};

/**
 * Log budget creation
 * @param category - Budget category
 * @param amount - Budget amount
 */
export const logBudgetCreated = async (category: string, amount: number) => {
  await logEvent('budget_created', {
    category,
    amount,
  });
};

/**
 * Log subscription plan selection
 * @param planId - Plan ID ('monthly', 'quarterly', 'yearly')
 */
export const logPlanSelected = async (planId: string) => {
  await logSelectContent('subscription_plan', planId);
};

/**
 * Log payment attempt
 * @param planId - Plan ID
 * @param amount - Payment amount
 */
export const logPaymentAttempt = async (planId: string, amount: number) => {
  await logEvent('payment_attempt', {
    plan: planId,
    amount,
  });
};

/**
 * Log payment failure
 * @param planId - Plan ID
 * @param errorCode - Error code
 */
export const logPaymentFailure = async (planId: string, errorCode?: string) => {
  await logEvent('payment_failure', {
    plan: planId,
    error_code: errorCode || 'unknown',
  });
};

/**
 * Log payment success
 * @param planId - Plan ID
 * @param amount - Payment amount
 * @param currency - Currency
 */
export const logPaymentSuccess = async (
  planId: string, 
  amount: number, 
  currency: string
) => {
  await logPurchase(amount, currency, [
    { item_id: planId, item_name: `Subscription ${planId}`, quantity: 1 }
  ]);
  
  await logEvent('payment_success', {
    plan: planId,
    amount,
    currency,
  });
};

export default {
  init: initAnalytics,
  logScreenView,
  setUserProperty,
  setUserId,
  logEvent,
  logLogin,
  logSignUp,
  logPurchase,
  logSelectContent,
  logAppOpen,
  // FinTrack-specific
  logTransactionCreated,
  logQRScan,
  logBudgetCreated,
  logPlanSelected,
  logPaymentAttempt,
  logPaymentFailure,
  logPaymentSuccess,
};
