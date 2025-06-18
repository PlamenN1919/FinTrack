/**
 * FinTrack Mobile App - Authentication-Ready Version
 * Entry point with comprehensive authentication system
 * @format
 */

import React from 'react';
import { StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
