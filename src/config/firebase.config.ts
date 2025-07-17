import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';

// With React Native Firebase, the native configuration (`GoogleService-Info.plist` & `google-services.json`)
// handles the initialization. We just need to import and re-export the modules for easy access.

// Configure functions for the correct region (us-central1 where our functions are deployed)
const functionsInstance = functions();

export { auth, firestore as db, functions };

// Export callable functions with proper region - React Native Firebase automatically uses the default region
export const createPaymentIntentCallable = functionsInstance.httpsCallable('createPaymentIntent');
export const createStripeSubscriptionCallable = functionsInstance.httpsCallable('createStripeSubscription');
export const checkExpiredSubscriptionsCallable = functionsInstance.httpsCallable('manualCheckExpiredSubscriptions'); 