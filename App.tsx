/**
 * FinTrack Mobile App - Authentication-Ready Version
 * Entry point with comprehensive authentication system
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import monitoring utilities
import { initCrashlytics } from './src/utils/crashlytics';
import { initAnalytics } from './src/utils/analytics';
import { logger } from './src/utils/logger';

// Suppress known warnings from third-party libraries
// These are known issues that don't affect functionality
if (__DEV__) {
  LogBox.ignoreLogs([
    'Unsupported top level event type', // react-native-chart-kit known issue
    'topSvgLayout', // react-native-svg known issue
  ]);
}

// NOTE: Consider updating to victory-native or react-native-gifted-charts
// when time permits for better chart rendering and fewer warnings

// Development-only gamification reset
// Only runs in development mode to avoid production issues
if (__DEV__) {
  const DEV_RESET_GAMIFICATION = false; // Set to true only when needed in development
  
  if (DEV_RESET_GAMIFICATION) {
    AsyncStorage.removeItem('fintrack_gamification').then(() => {
      console.log('✅ [DEV] Gamification profile cleared! Starting fresh from level 1.');
    }).catch(err => {
      console.error('❌ [DEV] Error clearing gamification:', err);
    });
  }
}

// Import new authentication system
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

// Import legacy providers for backward compatibility
import { ThemeProvider } from './src/utils/ThemeContext';
import { UserProvider } from './src/utils/UserContext';
import { TransactionProvider } from './src/utils/TransactionContext';
import { BudgetProviderWithCalculations } from './src/utils/BudgetContext';

// App wrapper component
function AppContent(): React.JSX.Element {
  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <AppNavigator />
    </>
  );
}

// Main App component with all providers
function App(): React.JSX.Element {
  // Initialize monitoring on app startup
  useEffect(() => {
    const initMonitoring = async () => {
      try {
        // Initialize Crashlytics
        initCrashlytics();
        logger.info('✅ Crashlytics initialized');

        // Initialize Analytics
        await initAnalytics();
        logger.info('✅ Analytics initialized');
      } catch (error) {
        logger.error('❌ Failed to initialize monitoring:', error);
      }
    };

    initMonitoring();
  }, []);

  return (
    <SafeAreaProvider>
      {/* Theme provider for app-wide theming */}
      <ThemeProvider>
        {/* Authentication provider - handles all auth state */}
        <AuthProvider>
          {/* Legacy providers for existing functionality */}
          <UserProvider>
            <TransactionProvider>
              <BudgetProviderWithCalculations>
                <AppContent />
              </BudgetProviderWithCalculations>
            </TransactionProvider>
          </UserProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
