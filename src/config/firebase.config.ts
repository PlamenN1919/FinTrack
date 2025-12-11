import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';

// With React Native Firebase, the native configuration (`GoogleService-Info.plist` & `google-services.json`)
// handles the initialization. We just need to import and re-export the modules for easy access.

// Configure functions for the correct region (us-central1 where our functions are deployed)
const functionsInstance = functions();

// IMPORTANT: Uncomment line below ONLY if using emulator in development
// functionsInstance.useEmulator('localhost', 5001);

// Log configuration for debugging
console.log('[Firebase Config] Functions instance created');
console.log('[Firebase Config] Project ID: fintrack-bef0a');

export { auth, firestore as db, functions };

// Export callable functions with proper region - React Native Firebase automatically uses the default region
// Increased timeout to 60 seconds for better reliability
const FUNCTIONS_TIMEOUT = 60000;

export const createPaymentIntentCallable = functionsInstance.httpsCallable('createPaymentIntent', {
  timeout: FUNCTIONS_TIMEOUT
});

export const createStripeSubscriptionCallable = functionsInstance.httpsCallable('createStripeSubscription', {
  timeout: FUNCTIONS_TIMEOUT
});

export const checkExpiredSubscriptionsCallable = functionsInstance.httpsCallable('manualCheckExpiredSubscriptions', {
  timeout: FUNCTIONS_TIMEOUT
});

// Referral system callable functions
export const generateReferralLinkCallable = functionsInstance.httpsCallable('generateReferralLink', {
  timeout: FUNCTIONS_TIMEOUT
});

export const processReferralRewardCallable = functionsInstance.httpsCallable('processReferralReward', {
  timeout: FUNCTIONS_TIMEOUT
});

export const getReferralStatsCallable = functionsInstance.httpsCallable('getReferralStats', {
  timeout: FUNCTIONS_TIMEOUT
}); 