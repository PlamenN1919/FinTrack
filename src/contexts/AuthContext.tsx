import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import AsyncStorageWrapper from '../utils/AsyncStorageWrapper';
import { Platform } from 'react-native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
// import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { 
  AuthContextType, 
  AuthState, 
  User, 
  UserState, 
  AuthError, 
  LoginCredentials, 
  RegisterCredentials, 
  SocialLoginResult,
  AuthProvider as AuthProviderEnum,
  SubscriptionPlan,
  Subscription,
  SubscriptionStatus,
  AuthErrorCode
} from '../types/auth.types';
import { SUBSCRIPTION_PLANS } from '../config/subscription.config';
import { Environment } from '../config/environment.config';
// import { stripeService } from '../services/StripeService';

// Storage keys
const STORAGE_KEYS = {
  USER: '@fintrack_user',
  SUBSCRIPTION: '@fintrack_subscription',
  AUTH_STATE: '@fintrack_auth_state',
  DEVICE_ID: '@fintrack_device_id',
} as const;

// Initial state - Start with UNREGISTERED to show auth screens
const initialState: AuthState = {
  user: null,
  subscription: null,
  userState: UserState.UNREGISTERED,
  isLoading: false, // Changed from true to false for immediate auth screen
  isInitialized: true, // Changed to true for immediate display
  error: null,
};

// Action types
type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_SUBSCRIPTION'; payload: Subscription | null }
  | { type: 'SET_USER_STATE'; payload: UserState }
  | { type: 'SET_ERROR'; payload: AuthError | null }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_STATE' };

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_SUBSCRIPTION':
      return { ...state, subscription: action.payload };
    case 'SET_USER_STATE':
      return { ...state, userState: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'RESET_STATE':
      return { ...initialState };
    default:
      return state;
  }
};

// Utility functions
const generateDeviceId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const createAuthError = (code: string, message: string, details?: any): AuthError => ({
  code,
  message,
  details,
  timestamp: new Date(),
  recoverable: true,
});

// NEW: Firebase error handler
const handleFirebaseError = (error: any): AuthError => {
  let code = AuthErrorCode.UNKNOWN_ERROR;
  let message = 'Възникна неочаквана грешка. Моля, опитайте отново.';

  if (error.code) {
    switch (error.code) {
      case 'auth/invalid-email':
        code = AuthErrorCode.INVALID_EMAIL;
        message = 'Имейл адресът не е валиден.';
        break;
      case 'auth/user-disabled':
        code = AuthErrorCode.USER_DISABLED;
        message = 'Този потребителски акаунт е деактивиран.';
        break;
      case 'auth/user-not-found':
        code = AuthErrorCode.USER_NOT_FOUND;
        message = 'Няма намерен потребител с този имейл.';
        break;
      case 'auth/wrong-password':
        code = AuthErrorCode.WRONG_PASSWORD;
        message = 'Грешна парола. Моля, опитайте отново.';
        break;
      case 'auth/email-already-in-use':
        code = AuthErrorCode.EMAIL_ALREADY_IN_USE;
        message = 'Имейл адресът вече се използва от друг акаунт.';
        break;
      case 'auth/operation-not-allowed':
        code = AuthErrorCode.OPERATION_NOT_ALLOWED;
        message = 'Влизането с имейл и парола не е активирано.';
        break;
      case 'auth/weak-password':
        code = AuthErrorCode.WEAK_PASSWORD;
        message = 'Паролата е твърде слаба. Трябва да е поне 6 символа.';
        break;
      default:
        console.error('[AuthContext] Unhandled Firebase Error:', error);
    }
  }

  return createAuthError(code, message, error);
};

// NEW: Firebase user mapper
const mapFirebaseUser = (firebaseUser: FirebaseAuthTypes.User): User => {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    emailVerified: firebaseUser.emailVerified,
    displayName: firebaseUser.displayName || null,
    photoURL: firebaseUser.photoURL || null,
    createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
    lastLoginAt: new Date(firebaseUser.metadata.lastSignInTime || Date.now()),
    provider: (firebaseUser.providerData[0]?.providerId || 'password') as AuthProviderEnum,
    metadata: {
      deviceId: generateDeviceId(), // This could be improved to be more stable
      platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : undefined,
      appVersion: '1.0.0', // This should come from device info
    },
  };
};

const determineUserState = (user: User | null, subscription: Subscription | null): UserState => {
  if (!user) {
    return UserState.UNREGISTERED;
  }
  
  if (!subscription) {
    return UserState.REGISTERED_NO_SUBSCRIPTION;
  }
  
  // Check subscription status
  if (subscription.status === SubscriptionStatus.ACTIVE) {
    return UserState.ACTIVE_SUBSCRIBER;
  } else if (subscription.status === SubscriptionStatus.FAILED) {
    return UserState.PAYMENT_FAILED;
  } else {
    return UserState.EXPIRED_SUBSCRIBER;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize services (temporarily disabled)
  const initializeServices = useCallback(async () => {
    try {
      console.log('[AuthContext] Initializing services...');
      
      // We are not using Google Sign-in for now.
      // Environment.logEnvironment();
      
      // GoogleSignin.configure({
      //   webClientId: Environment.getGoogleSignInConfig().webClientId,
      // });
      
      console.log('[AuthContext] Services initialized successfully');
    } catch (error) {
      console.error('[AuthContext] Service initialization error:', error);
    }
  }, []);

  // Persist state to AsyncStorage
  const persistState = useCallback(async (user: User | null, subscription: Subscription | null) => {
    try {
      // Check if AsyncStorage is available
      if (!AsyncStorageWrapper) {
        console.log('[AuthContext] AsyncStorage not available, skipping persistence');
        return;
      }

      if (user) {
        await AsyncStorageWrapper.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      } else {
        await AsyncStorageWrapper.removeItem(STORAGE_KEYS.USER);
      }

      if (subscription) {
        await AsyncStorageWrapper.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(subscription));
      } else {
        await AsyncStorageWrapper.removeItem(STORAGE_KEYS.SUBSCRIPTION);
      }
    } catch (error) {
      console.error('Failed to persist auth state:', error);
    }
  }, []);

  // Load persisted state
  const loadPersistedState = useCallback(async () => {
    try {
      // Check if AsyncStorage is available
      if (!AsyncStorageWrapper) {
        console.log('[AuthContext] AsyncStorage not available');
        return { user: null, subscription: null };
      }

      const [userJson, subscriptionJson] = await Promise.all([
        AsyncStorageWrapper.getItem(STORAGE_KEYS.USER),
        AsyncStorageWrapper.getItem(STORAGE_KEYS.SUBSCRIPTION),
      ]);

      const user = userJson ? JSON.parse(userJson) : null;
      const subscription = subscriptionJson ? JSON.parse(subscriptionJson) : null;

      if (user) {
        // Convert date strings back to Date objects
        user.createdAt = new Date(user.createdAt);
        user.lastLoginAt = new Date(user.lastLoginAt);
      }

      if (subscription) {
        subscription.currentPeriodStart = new Date(subscription.currentPeriodStart);
        subscription.currentPeriodEnd = new Date(subscription.currentPeriodEnd);
        subscription.createdAt = new Date(subscription.createdAt);
        subscription.updatedAt = new Date(subscription.updatedAt);
      }

      return { user, subscription };
    } catch (error) {
      console.error('Failed to load persisted state:', error);
      return { user: null, subscription: null };
    }
  }, []);

  // Initialize auth state and listen for changes
  useEffect(() => {
    const initializeAuth = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        await initializeServices();
        
        // Load persisted subscription state, user state will be handled by Firebase
        const { subscription: persistedSubscription } = await loadPersistedState();
        if (persistedSubscription) {
          dispatch({ type: 'SET_SUBSCRIPTION', payload: persistedSubscription });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({ type: 'SET_ERROR', payload: createAuthError(
          AuthErrorCode.UNKNOWN_ERROR,
          'Failed to initialize authentication'
        )});
      } finally {
        // We set initialized to true, but loading will be handled by the auth listener
        dispatch({ type: 'SET_INITIALIZED', payload: true });
      }
    };

    initializeAuth();

    const subscriber = auth().onAuthStateChanged(async (firebaseUser: FirebaseAuthTypes.User | null) => {
      try {
        if (firebaseUser) {
          // User is signed in
          console.log('[AuthContext] Firebase user signed in:', firebaseUser.uid);
          const user = mapFirebaseUser(firebaseUser);
          dispatch({ type: 'SET_USER', payload: user });
          // Note: We might need to fetch subscription status from our backend here
          await persistState(user, state.subscription); 
        } else {
          // User is signed out
          console.log('[AuthContext] Firebase user signed out.');
          dispatch({ type: 'SET_USER', payload: null });
          // We keep subscription info in case they log back in
          await persistState(null, state.subscription);
        }
      } catch (error) {
        console.error('[AuthContext] Error in onAuthStateChanged:', error);
        dispatch({ type: 'SET_ERROR', payload: createAuthError(
          AuthErrorCode.UNKNOWN_ERROR,
          'Failed to handle authentication state change.'
        )});
      } finally {
        // Ensure loading is set to false after the first auth state is received.
        if (state.isLoading) {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    });

    // Unsubscribe on unmount
    return subscriber;
  }, [initializeServices, loadPersistedState, persistState, state.subscription, state.isLoading]);

  // Update user state when user or subscription changes
  useEffect(() => {
    const newUserState = determineUserState(state.user, state.subscription);
    if (newUserState !== state.userState) {
      dispatch({ type: 'SET_USER_STATE', payload: newUserState });
      console.log('[AuthContext] User state changed to:', newUserState);
    }
  }, [state.user, state.subscription, state.userState]);

  // --- REAL AUTHENTICATION METHODS ---
  const signInWithEmail = useCallback(async (credentials: LoginCredentials): Promise<User> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });
    try {
      const userCredential = await auth().signInWithEmailAndPassword(
        credentials.email.trim().toLowerCase(),
        credentials.password
      );
      // The onAuthStateChanged listener will handle setting the user state.
      return mapFirebaseUser(userCredential.user);
    } catch (error: any) {
      const authError = handleFirebaseError(error);
      dispatch({ type: 'SET_ERROR', payload: authError });
      throw authError;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const signUpWithEmail = useCallback(async (credentials: RegisterCredentials): Promise<User> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });
    try {
      if (credentials.password !== credentials.confirmPassword) {
        throw { code: AuthErrorCode.INVALID_PASSWORD, message: 'Паролите не съвпадат.' };
      }
      if (!credentials.acceptTerms) {
        throw { code: AuthErrorCode.PERMISSION_DENIED, message: 'Трябва да приемете общите условия.' };
      }
      
      const userCredential = await auth().createUserWithEmailAndPassword(
        credentials.email.trim().toLowerCase(),
        credentials.password
      );
      // The onAuthStateChanged listener will handle setting the user state.
      return mapFirebaseUser(userCredential.user);
    } catch (error: any) {
      const authError = handleFirebaseError(error);
      dispatch({ type: 'SET_ERROR', payload: authError });
      throw authError;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<SocialLoginResult> => {
    throw createAuthError(
      AuthErrorCode.GOOGLE_SIGNIN_ERROR,
      'Google Sign-In is not implemented.'
    );
  }, []);

  const signInWithApple = useCallback(async (): Promise<SocialLoginResult> => {
    throw createAuthError(
      AuthErrorCode.APPLE_SIGNIN_ERROR,
      'Apple Sign-In not implemented yet'
    );
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await auth().signOut();
      // onAuthStateChanged will handle clearing user data
    } catch (error: any) {
      const authError = handleFirebaseError(error);
      dispatch({ type: 'SET_ERROR', payload: authError });
      throw authError;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Email verification methods (not used since verification is disabled)
  const sendEmailVerification = useCallback(async (): Promise<void> => {
    console.log('[AuthContext] Email verification disabled');
    // No longer needed since we don't require email verification
  }, []);

  const checkEmailVerification = useCallback(async (): Promise<boolean> => {
    console.log('[AuthContext] Email verification disabled - always returning true');
    // Always return true since we don't require email verification
    return true;
  }, []);

  // Password management
  const sendPasswordResetEmail = useCallback(async (email: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await auth().sendPasswordResetEmail(email.trim().toLowerCase());
    } catch (error: any) {
      const authError = handleFirebaseError(error);
      dispatch({ type: 'SET_ERROR', payload: authError });
      throw authError;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<void> => {
    console.log('[AuthContext] Mock update password');
  }, []);

  // Placeholder methods
  const createSubscription = useCallback(async (planId: SubscriptionPlan, paymentMethodId: string): Promise<Subscription> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      if (!state.user) {
        throw createAuthError(AuthErrorCode.USER_NOT_FOUND, 'User not authenticated');
      }

      const planConfig = SUBSCRIPTION_PLANS[planId];
      if (!planConfig) {
        throw createAuthError(AuthErrorCode.UNKNOWN_ERROR, 'Invalid plan selected');
      }

      // In a real app, you would call your backend here to create the subscription
      // and associate it with the user. The backend would then return the full subscription object.
      
      console.log(`[AuthContext] Simulating subscription creation for user ${state.user.uid} with plan ${planId}`);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const now = new Date();
      const endDate = new Date(now);
      if (planId === SubscriptionPlan.MONTHLY) {
        endDate.setMonth(now.getMonth() + 1);
      } else if (planId === SubscriptionPlan.QUARTERLY) {
        endDate.setMonth(now.getMonth() + 3);
      } else {
        endDate.setFullYear(now.getFullYear() + 1);
      }

      const newSubscription: Subscription = {
        id: `sub_mock_${Date.now()}`,
        userId: state.user.uid,
        plan: planId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: endDate,
        cancelAtPeriodEnd: false,
        stripeCustomerId: `cus_mock_${state.user.uid}`,
        stripeSubscriptionId: `sub_mock_${paymentMethodId}`, // Using paymentMethodId as a stand-in
        priceId: planConfig.stripePriceIds.monthly || '', // Simplified
        amount: planConfig.monthlyPrice, // Simplified
        currency: planConfig.currency,
        createdAt: now,
        updatedAt: now,
      };

      dispatch({ type: 'SET_SUBSCRIPTION', payload: newSubscription });
      await persistState(state.user, newSubscription);

      return newSubscription;
    } catch (error: any) {
      const authError = handleFirebaseError(error);
      dispatch({ type: 'SET_ERROR', payload: authError });
      throw authError;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.user, persistState]);

  const cancelSubscription = useCallback(async (): Promise<void> => {
    throw createAuthError(AuthErrorCode.UNKNOWN_ERROR, 'Subscription cancellation not implemented yet');
  }, []);

  const updateSubscription = useCallback(async (planId: SubscriptionPlan): Promise<Subscription> => {
    throw createAuthError(AuthErrorCode.UNKNOWN_ERROR, 'Subscription update not implemented yet');
  }, []);

  const restorePurchases = useCallback(async (): Promise<Subscription[]> => {
    return [];
  }, []);

  const refreshAuthState = useCallback(async (): Promise<void> => {
    console.log('[AuthContext] Mock refresh auth state');
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const getUserState = useCallback((): UserState => {
    return state.userState;
  }, [state.userState]);

  const canAccessFeature = useCallback((feature: string): boolean => {
    return state.userState === UserState.ACTIVE_SUBSCRIBER;
  }, [state.userState]);

  const setSubscription = useCallback(async (subscription: Subscription): Promise<void> => {
    try {
      console.log('[AuthContext] Setting subscription:', subscription);
      dispatch({ type: 'SET_SUBSCRIPTION', payload: subscription });
      await persistState(state.user, subscription);
    } catch (error: any) {
      console.error('[AuthContext] Failed to set subscription:', error);
      const authError = createAuthError(
        AuthErrorCode.UNKNOWN_ERROR,
        'Failed to set subscription'
      );
      dispatch({ type: 'SET_ERROR', payload: authError });
      throw authError;
    }
  }, [state.user, persistState]);

  const updateProfile = useCallback(async (updates: Partial<User>): Promise<void> => {
    throw createAuthError(AuthErrorCode.UNKNOWN_ERROR, 'Profile update not implemented yet');
  }, []);

  const deleteAccount = useCallback(async (): Promise<void> => {
    throw createAuthError(AuthErrorCode.UNKNOWN_ERROR, 'Account deletion not implemented yet');
  }, []);

  const linkAccount = useCallback(async (provider: AuthProviderEnum): Promise<void> => {
    throw createAuthError(AuthErrorCode.UNKNOWN_ERROR, 'Account linking not implemented yet');
  }, []);

  const unlinkAccount = useCallback(async (provider: AuthProviderEnum): Promise<void> => {
    throw createAuthError(AuthErrorCode.UNKNOWN_ERROR, 'Account unlinking not implemented yet');
  }, []);

  const contextValue: AuthContextType = {
    authState: state,
    user: state.user,
    isLoading: state.isLoading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
    signOut,
    logout: signOut,
    sendEmailVerification,
    checkEmailVerification,
    sendPasswordResetEmail,
    updatePassword,
    updateProfile,
    deleteAccount,
    linkAccount,
    unlinkAccount,
    createSubscription,
    cancelSubscription,
    updateSubscription,
    restorePurchases,
    setSubscription,
    refreshAuthState,
    clearError,
    getUserState,
    canAccessFeature,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 