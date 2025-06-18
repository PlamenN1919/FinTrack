import { LinkingOptions } from '@react-navigation/native';
import { AuthStackParamList } from '../types/auth.types';
import { Environment } from '../config/environment.config';

// Deep linking configuration for FinTrack
const deepLinkConfig = Environment.getDeepLinkingConfig();

export const linkingConfig: LinkingOptions<any> = {
  prefixes: [
    `${deepLinkConfig.scheme}://`,
    ...deepLinkConfig.domains.map(domain => `https://${domain}`),
  ],
  config: {
    screens: {
      Auth: {
        screens: {
          Welcome: 'welcome',
          Login: 'login',
          Register: 'register',
          ForgotPassword: {
            path: 'forgot-password/:email?',
            parse: {
              email: (email: string) => email ? decodeURIComponent(email) : undefined,
            },
          },
          EmailVerification: {
            path: 'verify-email/:email/:token?',
            parse: {
              email: (email: string) => decodeURIComponent(email),
              token: (token: string) => token ? decodeURIComponent(token) : undefined,
            },
          },
          SubscriptionPlans: {
            path: 'plans/:reason?/:previousPlan?',
            parse: {
              reason: (reason: string) => reason || 'new_user',
              previousPlan: (plan: string) => plan || undefined,
            },
          },
          Payment: {
            path: 'payment/:planId/:amount/:currency',
            parse: {
              planId: (planId: string) => planId,
              amount: (amount: string) => parseFloat(amount),
              currency: (currency: string) => currency,
            },
          },
          PaymentSuccess: {
            path: 'payment/success/:subscriptionId',
            parse: {
              subscriptionId: (id: string) => id,
            },
          },
          PaymentFailed: {
            path: 'payment/failed/:errorCode/:planId/:retryCount',
            parse: {
              errorCode: (code: string) => code,
              planId: (planId: string) => planId,
              retryCount: (count: string) => parseInt(count, 10),
            },
          },
        },
      },
      Main: {
        screens: {
          // TODO: Add main app screens when created
          Home: 'home',
          Transactions: 'transactions',
          Budgets: 'budgets',
          Reports: 'reports',
          Profile: 'profile',
        },
      },
    },
  },
};

// Helper functions for creating deep links
export const createDeepLink = {
  // Email verification link
  emailVerification: (email: string, token?: string): string => {
    const encodedEmail = encodeURIComponent(email);
    const tokenParam = token ? `/${encodeURIComponent(token)}` : '';
    return `${deepLinkConfig.scheme}://verify-email/${encodedEmail}${tokenParam}`;
  },

  // Password reset link
  passwordReset: (email: string): string => {
    const encodedEmail = encodeURIComponent(email);
    return `${deepLinkConfig.scheme}://forgot-password/${encodedEmail}`;
  },

  // Subscription plans with reason
  subscriptionPlans: (reason?: string, previousPlan?: string): string => {
    let path = `${deepLinkConfig.scheme}://plans`;
    if (reason) {
      path += `/${reason}`;
      if (previousPlan) {
        path += `/${previousPlan}`;
      }
    }
    return path;
  },

  // Payment flow
  payment: (planId: string, amount: number, currency: string): string => {
    return `${deepLinkConfig.scheme}://payment/${planId}/${amount}/${currency}`;
  },

  // Payment success
  paymentSuccess: (subscriptionId: string): string => {
    return `${deepLinkConfig.scheme}://payment/success/${subscriptionId}`;
  },

  // Payment failed
  paymentFailed: (errorCode: string, planId: string, retryCount: number): string => {
    return `${deepLinkConfig.scheme}://payment/failed/${errorCode}/${planId}/${retryCount}`;
  },

  // Main app screens
  home: (): string => `${deepLinkConfig.scheme}://home`,
  transactions: (): string => `${deepLinkConfig.scheme}://transactions`,
  budgets: (): string => `${deepLinkConfig.scheme}://budgets`,
  reports: (): string => `${deepLinkConfig.scheme}://reports`,
  profile: (): string => `${deepLinkConfig.scheme}://profile`,
};

// URL validation helpers
export const validateDeepLink = {
  isFinTrackLink: (url: string): boolean => {
    const scheme = `${deepLinkConfig.scheme}://`;
    const domains = deepLinkConfig.domains.map(domain => `https://${domain}`);
    
    return url.startsWith(scheme) || domains.some(domain => url.startsWith(domain));
  },

  isEmailVerificationLink: (url: string): boolean => {
    return url.includes('/verify-email/');
  },

  isPasswordResetLink: (url: string): boolean => {
    return url.includes('/forgot-password/');
  },

  isPaymentLink: (url: string): boolean => {
    return url.includes('/payment/');
  },

  extractEmailFromVerificationLink: (url: string): string | null => {
    const match = url.match(/\/verify-email\/([^\/]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  },

  extractEmailFromPasswordResetLink: (url: string): string | null => {
    const match = url.match(/\/forgot-password\/([^\/]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  },
};

export default linkingConfig; 