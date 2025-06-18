import { Linking } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';
import { validateDeepLink, createDeepLink } from '../navigation/linking.config';

// Deep link handler for special authentication scenarios
export class DeepLinkHandler {
  private navigationRef: NavigationContainerRef<any> | null = null;

  constructor(navigationRef?: NavigationContainerRef<any>) {
    this.navigationRef = navigationRef || null;
  }

  // Set navigation reference
  setNavigationRef(ref: NavigationContainerRef<any>) {
    this.navigationRef = ref;
  }

  // Handle incoming deep links
  async handleDeepLink(url: string): Promise<boolean> {
    try {
      console.log('Handling deep link:', url);

      if (!validateDeepLink.isFinTrackLink(url)) {
        console.log('Not a FinTrack link, ignoring');
        return false;
      }

      // Handle email verification links
      if (validateDeepLink.isEmailVerificationLink(url)) {
        return this.handleEmailVerificationLink(url);
      }

      // Handle password reset links
      if (validateDeepLink.isPasswordResetLink(url)) {
        return this.handlePasswordResetLink(url);
      }

      // Handle payment links
      if (validateDeepLink.isPaymentLink(url)) {
        return this.handlePaymentLink(url);
      }

      console.log('Deep link handled by navigation system');
      return true;
    } catch (error) {
      console.error('Error handling deep link:', error);
      return false;
    }
  }

  // Handle email verification deep links
  private handleEmailVerificationLink(url: string): boolean {
    try {
      const email = validateDeepLink.extractEmailFromVerificationLink(url);
      
      if (!email) {
        console.error('Could not extract email from verification link');
        return false;
      }

      // Extract token if present
      const tokenMatch = url.match(/\/verify-email\/[^\/]+\/([^\/]+)/);
      const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : undefined;

      console.log('Email verification link:', { email, token });

      // Navigate to email verification screen
      if (this.navigationRef?.isReady()) {
        this.navigationRef.navigate('Auth', {
          screen: 'EmailVerification',
          params: { email, token },
        });
      }

      return true;
    } catch (error) {
      console.error('Error handling email verification link:', error);
      return false;
    }
  }

  // Handle password reset deep links
  private handlePasswordResetLink(url: string): boolean {
    try {
      const email = validateDeepLink.extractEmailFromPasswordResetLink(url);
      
      if (!email) {
        console.error('Could not extract email from password reset link');
        return false;
      }

      console.log('Password reset link:', { email });

      // Navigate to forgot password screen
      if (this.navigationRef?.isReady()) {
        this.navigationRef.navigate('Auth', {
          screen: 'ForgotPassword',
          params: { email },
        });
      }

      return true;
    } catch (error) {
      console.error('Error handling password reset link:', error);
      return false;
    }
  }

  // Handle payment deep links
  private handlePaymentLink(url: string): boolean {
    try {
      console.log('Payment link detected:', url);

      // Payment success
      if (url.includes('/payment/success/')) {
        const match = url.match(/\/payment\/success\/([^\/]+)/);
        const subscriptionId = match ? match[1] : null;

        if (subscriptionId && this.navigationRef?.isReady()) {
          console.log('Payment success for subscription:', subscriptionId);
        }
        return true;
      }

      // Payment failed
      if (url.includes('/payment/failed/')) {
        const match = url.match(/\/payment\/failed\/([^\/]+)\/([^\/]+)\/(\d+)/);
        if (match && this.navigationRef?.isReady()) {
          const [, errorCode, planId, retryCount] = match;
          console.log('Payment failed:', { errorCode, planId, retryCount: parseInt(retryCount) });
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error handling payment link:', error);
      return false;
    }
  }

  // Initialize deep link listener
  initializeListener(): () => void {
    // Handle initial URL (app opened from deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Initial URL:', url);
        setTimeout(() => this.handleDeepLink(url), 1000);
      }
    });

    // Handle URLs when app is already open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('Deep link received:', url);
      this.handleDeepLink(url);
    });

    // Return cleanup function
    return () => {
      subscription?.remove();
    };
  }

  // Utility methods for creating deep links
  static createEmailVerificationLink(email: string, token?: string): string {
    return createDeepLink.emailVerification(email, token);
  }

  static createPasswordResetLink(email: string): string {
    return createDeepLink.passwordReset(email);
  }

  static createSubscriptionLink(reason?: string, previousPlan?: string): string {
    return createDeepLink.subscriptionPlans(reason, previousPlan);
  }
}

// Singleton instance
export const deepLinkHandler = new DeepLinkHandler();

export default DeepLinkHandler; 