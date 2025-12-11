/**
 * FinTrack Mobile App - Authentication-Ready Version
 * Entry point with comprehensive authentication system
 * @format
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Временен workaround за react-native-chart-kit грешка
// TODO: Замени react-native-chart-kit с victory-native или react-native-gifted-charts
LogBox.ignoreLogs([
  'Unsupported top level event type',
  'topSvgLayout',
]);

// 🔄 ВРЕМЕННО: Изчистване на стар геймификационен профил
// ПРЕМАХНИ ТОЗИ КОД СЛЕД ПЪРВО СТАРТИРАНЕ!
const RESET_GAMIFICATION = true; // Промени на false след първо стартиране

if (RESET_GAMIFICATION) {
  AsyncStorage.removeItem('fintrack_gamification').then(() => {
    console.log('✅ Gamification profile cleared! Starting fresh from level 1.');
  }).catch(err => {
    console.error('❌ Error clearing gamification:', err);
  });
}

// Import new authentication system
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

// Import legacy providers for backward compatibility
import { ThemeProvider } from './src/utils/ThemeContext';
import { UserProvider } from './src/utils/UserContext';
import { TransactionProvider } from './src/utils/TransactionContext';
import { BudgetProviderWithCalculations } from './src/utils/BudgetContext';

// Import splash screen
import SplashScreen from './src/components/SplashScreen';

// App wrapper component
function AppContent(): React.JSX.Element {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <AppNavigator />
      {showSplash && <SplashScreen onAnimationComplete={handleSplashComplete} />}
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
