// Authentication Types - Изключително детайлни типове за всички сценарии
export enum UserState {
  UNREGISTERED = 'unregistered',
  REGISTERED_NO_SUBSCRIPTION = 'registered_no_subscription', 
  PAYMENT_FAILED = 'payment_failed',
  ACTIVE_SUBSCRIBER = 'active_subscriber',
  EXPIRED_SUBSCRIBER = 'expired_subscriber',
  ACCOUNT_SUSPENDED = 'account_suspended'
}

export enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google.com',
  APPLE = 'apple.com'
}

export enum SubscriptionPlan {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly', 
  YEARLY = 'yearly'
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  PENDING = 'pending',
  FAILED = 'failed'
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  provider: AuthProvider;
  createdAt: Date;
  lastLoginAt: Date;
  metadata: {
    deviceId?: string;
    platform?: 'ios' | 'android';
    appVersion?: string;
  };
}

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  priceId: string;
  amount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  subscription: Subscription | null;
  userState: UserState;
  isLoading: boolean;
  isInitialized: boolean;
  error: AuthError | null;
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  recoverable: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface SocialLoginResult {
  user: User;
  isNewUser: boolean;
  conflictingAccount?: {
    email: string;
    providers: AuthProvider[];
  };
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled';
  planId: SubscriptionPlan;
  userId: string;
  createdAt: Date;
}

export interface AuthContextType {
  // State
  authState: AuthState;
  user: User | null;
  isLoading: boolean;
  
  // Authentication methods
  signInWithEmail: (credentials: LoginCredentials) => Promise<User>;
  signUpWithEmail: (credentials: RegisterCredentials) => Promise<User>;
  signInWithGoogle: () => Promise<SocialLoginResult>;
  signInWithApple: () => Promise<SocialLoginResult>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  
  // Email verification
  sendEmailVerification: () => Promise<void>;
  checkEmailVerification: () => Promise<boolean>;
  
  // Password management
  sendPasswordResetEmail: (email: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  
  // Account management
  updateProfile: (updates: Partial<User>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  linkAccount: (provider: AuthProvider) => Promise<void>;
  unlinkAccount: (provider: AuthProvider) => Promise<void>;
  
  // Subscription management
  createSubscription: (planId: SubscriptionPlan, paymentMethodId: string) => Promise<Subscription>;
  cancelSubscription: () => Promise<void>;
  updateSubscription: (planId: SubscriptionPlan) => Promise<Subscription>;
  restorePurchases: () => Promise<Subscription[]>;
  
  // Utility methods
  refreshAuthState: () => Promise<void>;
  clearError: () => void;
  getUserState: () => UserState;
  canAccessFeature: (feature: string) => boolean;
}

// Navigation types
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: { email?: string };
  SubscriptionPlans: { 
    reason?: 'new_user' | 'expired' | 'upgrade' | 'payment_failed';
    previousPlan?: SubscriptionPlan;
  };
  Payment: {
    planId: SubscriptionPlan;
    amount: number;
    currency: string;
  };
  PaymentSuccess: {
    subscription: Subscription;
  };
  PaymentFailed: {
    error: AuthError;
    planId: SubscriptionPlan;
    retryCount: number;
  };
  SubscriptionManagement: {
    subscription: Subscription;
  };
  AccountLinking: {
    conflictingAccount: {
      email: string;
      providers: AuthProvider[];
    };
  };
};

// Feature flags
export interface FeatureFlags {
  UNLIMITED_TRANSACTIONS: boolean;
  ADVANCED_REPORTS: boolean;
  RECEIPT_SCANNING: boolean;
  BUDGET_GOALS: boolean;
  EXPORT_DATA: boolean;
  PRIORITY_SUPPORT: boolean;
  FAMILY_SHARING: boolean;
  CUSTOM_CATEGORIES: boolean;
  VOICE_ASSISTANT: boolean;
  WHAT_IF_SIMULATIONS: boolean;
}

// Plan configurations
export interface PlanConfig {
  id: SubscriptionPlan;
  name: string;
  description: string;
  monthlyPrice: number;
  quarterlyPrice?: number;
  yearlyPrice?: number;
  currency: string;
  features: FeatureFlags;
  popular?: boolean;
  bestValue?: boolean;
  stripePriceIds: {
    monthly?: string;
    quarterly?: string;
    yearly?: string;
  };
}

// Error codes
export enum AuthErrorCode {
  // Authentication errors
  INVALID_EMAIL = 'auth/invalid-email',
  INVALID_PASSWORD = 'auth/invalid-password',
  USER_NOT_FOUND = 'auth/user-not-found',
  WRONG_PASSWORD = 'auth/wrong-password',
  EMAIL_ALREADY_IN_USE = 'auth/email-already-in-use',
  WEAK_PASSWORD = 'auth/weak-password',
  TOO_MANY_REQUESTS = 'auth/too-many-requests',
  
  // Email verification
  EMAIL_NOT_VERIFIED = 'auth/email-not-verified',
  VERIFICATION_EXPIRED = 'auth/verification-expired',
  
  // Social login
  GOOGLE_SIGNIN_CANCELLED = 'google/signin-cancelled',
  GOOGLE_SIGNIN_ERROR = 'google/signin-error',
  APPLE_SIGNIN_CANCELLED = 'apple/signin-cancelled',
  APPLE_SIGNIN_ERROR = 'apple/signin-error',
  ACCOUNT_LINKING_REQUIRED = 'auth/account-linking-required',
  
  // Payment errors
  PAYMENT_FAILED = 'payment/failed',
  PAYMENT_CANCELLED = 'payment/cancelled',
  CARD_DECLINED = 'payment/card-declined',
  INSUFFICIENT_FUNDS = 'payment/insufficient-funds',
  PAYMENT_METHOD_REQUIRED = 'payment/method-required',
  
  // Subscription errors
  SUBSCRIPTION_NOT_FOUND = 'subscription/not-found',
  SUBSCRIPTION_EXPIRED = 'subscription/expired',
  SUBSCRIPTION_CANCELLED = 'subscription/cancelled',
  
  // Network errors
  NETWORK_ERROR = 'network/error',
  TIMEOUT_ERROR = 'network/timeout',
  
  // Generic errors
  UNKNOWN_ERROR = 'unknown/error',
  PERMISSION_DENIED = 'permission/denied'
} 