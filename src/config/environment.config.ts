/**
 * Environment Configuration for FinTrack App
 * Handles different deployment environments and configurations
 */

export interface EnvironmentConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  isStaging: boolean;
  apiUrl: string;
  webUrl: string;
  deepLinking: {
    scheme: string;
    domains: string[];
  };
  firebase: {
    android: {
      apiKey: string;
      authDomain: string;
      databaseURL: string;
      projectId: string;
      storageBucket: string;
      messagingSenderId: string;
      appId: string;
    };
    ios: {
      apiKey: string;
      authDomain: string;
      databaseURL: string;
      projectId: string;
      storageBucket: string;
      messagingSenderId: string;
      appId: string;
    };
  };
  stripe: {
    publishableKey: string;
    merchantIdentifier: string;
  };
  googleSignIn: {
    webClientId: string;
    iosClientId: string;
  };
}

// Current environment detection
const isDevelopment = __DEV__;
const isProduction = !__DEV__;
const isStaging = false; // Could be determined from build configuration

// Development configuration
const developmentConfig: EnvironmentConfig = {
  isDevelopment: true,
  isProduction: false,
  isStaging: false,
  apiUrl: 'http://localhost:3000/api',
  webUrl: 'http://localhost:3000',
  deepLinking: {
    scheme: 'fintrack-dev',
    domains: ['fintrack-dev.local', 'localhost:3000'],
  },
  firebase: {
    android: {
      apiKey: 'AIzaSyAAdL7AafHHBBt0gRq1QJXtuw1tT3ct6Ag',
      authDomain: 'fintrack-bef0a.firebaseapp.com',
      databaseURL: 'https://fintrack-bef0a.firebaseio.com',
      projectId: 'fintrack-bef0a',
      storageBucket: 'fintrack-bef0a.firebasestorage.app',
      messagingSenderId: '917988712524',
      appId: '1:917988712524:android:678aa4263a25b0d59454e9',
    },
    ios: {
      apiKey: 'AIzaSyCderU5HnCZvwgGNrCchqPy137L5fCjeAE',
      authDomain: 'fintrack-bef0a.firebaseapp.com',
      databaseURL: 'https://fintrack-bef0a.firebaseio.com',
      projectId: 'fintrack-bef0a',
      storageBucket: 'fintrack-bef0a.firebasestorage.app',
      messagingSenderId: '917988712524',
      appId: '1:917988712524:ios:26a01f2983d13d0c9454e9',
    },
  },
  stripe: {
    publishableKey: 'pk_test_your_test_key_here',
    merchantIdentifier: 'merchant.com.fintrack.dev',
  },
  googleSignIn: {
    webClientId: 'your-web-client-id.googleusercontent.com',
    iosClientId: 'your-ios-client-id.googleusercontent.com',
  },
};

// Production configuration
const productionConfig: EnvironmentConfig = {
  isDevelopment: false,
  isProduction: true,
  isStaging: false,
  apiUrl: 'https://api.fintrack.bg',
  webUrl: 'https://fintrack.bg',
  deepLinking: {
    scheme: 'fintrack',
    domains: ['fintrack.bg', 'app.fintrack.bg'],
  },
  firebase: {
    android: {
      apiKey: 'your-prod-android-api-key',
      authDomain: 'fintrack-prod.firebaseapp.com',
      databaseURL: '', // TODO: Add your production databaseURL
      projectId: 'fintrack-prod',
      storageBucket: 'fintrack-prod.appspot.com',
      messagingSenderId: '987654321',
      appId: '1:987654321:android:abcdef',
    },
    ios: {
      apiKey: 'your-prod-ios-api-key',
      authDomain: 'fintrack-prod.firebaseapp.com',
      databaseURL: '', // TODO: Add your production databaseURL
      projectId: 'fintrack-prod',
      storageBucket: 'fintrack-prod.appspot.com',
      messagingSenderId: '987654321',
      appId: '1:987654321:ios:abcdef',
    },
  },
  stripe: {
    publishableKey: 'pk_live_your_live_key_here',
    merchantIdentifier: 'merchant.com.fintrack',
  },
  googleSignIn: {
    webClientId: 'your-prod-web-client-id.googleusercontent.com',
    iosClientId: 'your-prod-ios-client-id.googleusercontent.com',
  },
};

// Environment selection
const currentConfig = isDevelopment ? developmentConfig : productionConfig;

export class Environment {
  static get config(): EnvironmentConfig {
    return currentConfig;
  }

  static get isDevelopment(): boolean {
    return currentConfig.isDevelopment;
  }

  static get isProduction(): boolean {
    return currentConfig.isProduction;
  }

  static get apiUrl(): string {
    return currentConfig.apiUrl;
  }

  static get webUrl(): string {
    return currentConfig.webUrl;
  }

  static getFirebaseConfig(platform: 'ios' | 'android') {
    return currentConfig.firebase[platform];
  }

  static getStripeConfig() {
    return currentConfig.stripe;
  }

  static getGoogleSignInConfig() {
    return currentConfig.googleSignIn;
  }

  static getDeepLinkingConfig() {
    return currentConfig.deepLinking;
  }

  // Helper method for logging
  static logEnvironment() {
    if (currentConfig.isDevelopment) {
      console.log('[Environment] Running in development mode');
      console.log('[Environment] API URL:', currentConfig.apiUrl);
      console.log('[Environment] Web URL:', currentConfig.webUrl);
    }
  }
}

// Auto-log environment on import (development only)
if (isDevelopment) {
  Environment.logEnvironment();
}

export default Environment; 