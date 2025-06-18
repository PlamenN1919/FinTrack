import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import AsyncStorageWrapper from '../utils/AsyncStorageWrapper';
import { Platform } from 'react-native';
// import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
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

// Mock Firebase user mapping (for testing)
const createMockUser = (email: string): User => ({
  uid: Math.random().toString(36).substring(2, 15),
  email,
  emailVerified: true, // Always verified since we don't require email verification
  displayName: null,
  photoURL: null,
  createdAt: new Date(),
  lastLoginAt: new Date(),
  provider: AuthProviderEnum.EMAIL,
  metadata: {
    deviceId: generateDeviceId(),
    platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'android',
    appVersion: '1.0.0',
  },
});

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
      console.log('[AuthContext] Initializing services (simplified version)...');
      
      // TODO: Initialize Firebase later
      // Environment.logEnvironment();
      
      // TODO: Configure Google Sign-In later
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

  // Initialize auth state (simplified)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('[AuthContext] Starting simplified authentication initialization...');
        
        // Check AsyncStorage availability first
        try {
          await AsyncStorageWrapper.getItem('test');
          console.log('[AuthContext] AsyncStorage is available');
        } catch (asyncStorageError) {
          console.error('[AuthContext] AsyncStorage test failed:', asyncStorageError);
          // Continue anyway, app should work without persistence
        }
        
        await initializeServices();
        
        // Load persisted state
        const { user: persistedUser, subscription: persistedSubscription } = await loadPersistedState();
        console.log('[AuthContext] Persisted user:', persistedUser);
        console.log('[AuthContext] Persisted subscription:', persistedSubscription);

        if (persistedUser) {
          dispatch({ type: 'SET_USER', payload: persistedUser });
          dispatch({ type: 'SET_SUBSCRIPTION', payload: persistedSubscription });
        }

        console.log('[AuthContext] Auth initialization completed');
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({ type: 'SET_ERROR', payload: createAuthError(
          AuthErrorCode.UNKNOWN_ERROR,
          'Failed to initialize authentication'
        )});
      }
    };

    initializeAuth();
  }, [initializeServices, loadPersistedState]);

  // Update user state when user or subscription changes
  useEffect(() => {
    const newUserState = determineUserState(state.user, state.subscription);
    if (newUserState !== state.userState) {
      dispatch({ type: 'SET_USER_STATE', payload: newUserState });
      console.log('[AuthContext] User state changed to:', newUserState);
    }
  }, [state.user, state.subscription, state.userState]);

  // Mock authentication methods (for testing UI)
  const signInWithEmail = useCallback(async (credentials: LoginCredentials): Promise<User> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      console.log('[AuthContext] Mock sign in with email:', credentials.email);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create mock user
      const user = createMockUser(credentials.email);
      
      dispatch({ type: 'SET_USER', payload: user });
      await persistState(user, null);
      
      return user;
    } catch (error: any) {
      const authError = createAuthError(
        AuthErrorCode.UNKNOWN_ERROR,
        'Failed to sign in'
      );
      dispatch({ type: 'SET_ERROR', payload: authError });
      throw authError;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [persistState]);

  const signUpWithEmail = useCallback(async (credentials: RegisterCredentials): Promise<User> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      if (credentials.password !== credentials.confirmPassword) {
        throw createAuthError(
          AuthErrorCode.INVALID_PASSWORD,
          'Passwords do not match'
        );
      }

      if (!credentials.acceptTerms) {
        throw createAuthError(
          AuthErrorCode.PERMISSION_DENIED,
          'You must accept the terms and conditions'
        );
      }

      console.log('[AuthContext] Mock sign up with email:', credentials.email);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create mock user
      const user = createMockUser(credentials.email);
      
      dispatch({ type: 'SET_USER', payload: user });
      await persistState(user, null);
      
      return user;
    } catch (error: any) {
      const authError = createAuthError(
        error.code || AuthErrorCode.UNKNOWN_ERROR,
        error.message || 'Failed to register'
      );
      dispatch({ type: 'SET_ERROR', payload: authError });
      throw authError;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [persistState]);

  const signInWithGoogle = useCallback(async (): Promise<SocialLoginResult> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      console.log('[AuthContext] Mock Google sign in');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const user = createMockUser('user@gmail.com');
      user.provider = AuthProviderEnum.GOOGLE;
      
      dispatch({ type: 'SET_USER', payload: user });
      await persistState(user, null);

      return {
        user,
        isNewUser: false,

        conflictingAccount: undefined,
      };
    } catch (error: any) {
      const authError = createAuthError(
        AuthErrorCode.GOOGLE_SIGNIN_ERROR,
        'Google sign-in failed (mock)'
      );
      dispatch({ type: 'SET_ERROR', payload: authError });
      throw authError;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [persistState]);

  const signInWithApple = useCallback(async (): Promise<SocialLoginResult> => {
    throw createAuthError(
      AuthErrorCode.APPLE_SIGNIN_ERROR,
      'Apple Sign-In not implemented yet'
    );
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      console.log('[AuthContext] Mock sign out');
      
      // Clear persisted state
      if (AsyncStorageWrapper) {
        await AsyncStorageWrapper.multiRemove([
        STORAGE_KEYS.USER,
        STORAGE_KEYS.SUBSCRIPTION,
        STORAGE_KEYS.AUTH_STATE,
      ]);
      }
      
      dispatch({ type: 'RESET_STATE' });
    } catch (error: any) {
      const authError = createAuthError(
        AuthErrorCode.UNKNOWN_ERROR,
        'Failed to sign out'
      );
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

  // Password management (mock)
  const sendPasswordResetEmail = useCallback(async (email: string): Promise<void> => {
    console.log('[AuthContext] Mock send password reset email to:', email);
  }, []);

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<void> => {
    console.log('[AuthContext] Mock update password');
  }, []);

  // Placeholder methods
  const createSubscription = useCallback(async (planId: SubscriptionPlan, paymentMethodId: string): Promise<Subscription> => {
    throw createAuthError(AuthErrorCode.UNKNOWN_ERROR, 'Subscription creation not implemented yet');
  }, []);

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