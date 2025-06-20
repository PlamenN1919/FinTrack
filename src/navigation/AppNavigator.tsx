import React, { useRef, useEffect } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { StripeContextProvider } from '../contexts/StripeContext';
import { UserState } from '../types/auth.types';

// Import navigators and linking
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { linkingConfig } from './linking.config';
import { deepLinkHandler } from '../utils/deepLinkHandler';

const Stack = createNativeStackNavigator();

const AppNavigator: React.FC = () => {
  const { authState, isLoading } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  // Initialize deep link handler
  useEffect(() => {
    if (navigationRef.current) {
      deepLinkHandler.setNavigationRef(navigationRef.current);
    }

    // Initialize deep link listener
    const cleanup = deepLinkHandler.initializeListener();

    return cleanup;
  }, []);

  // Show loading screen while checking auth state
  if (isLoading) {
    return null; // Simple loading without styling for now
  }

  // Route Guard Logic
  const shouldShowAuth = () => {
    switch (authState.userState) {
      case UserState.UNREGISTERED:
      case UserState.REGISTERED_NO_SUBSCRIPTION:
      case UserState.EXPIRED_SUBSCRIBER:
      case UserState.PAYMENT_FAILED:
        return true; // Show auth/subscription flow - users must complete payment
      case UserState.ACTIVE_SUBSCRIBER:
        return false; // Only active subscribers can access main app
      default:
        return true; // Default to auth if unknown state
    }
  };

  return (
    <StripeContextProvider>
      <NavigationContainer 
        ref={navigationRef}
        linking={linkingConfig}
        onReady={() => {
          if (navigationRef.current) {
            deepLinkHandler.setNavigationRef(navigationRef.current);
          }
        }}
      >
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            animationDuration: 300,
          }}
        >
          {shouldShowAuth() ? (
            // Show Authentication Flow
            <Stack.Screen 
              name="Auth" 
              component={AuthNavigator}
              options={{
                animationTypeForReplace: 'pop', // Smooth transition when logging out
              }}
            />
          ) : (
            // Show Main App
            <Stack.Screen 
              name="Main" 
              component={MainNavigator}
              options={{
                animationTypeForReplace: 'push', // Smooth transition when logging in
              }}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </StripeContextProvider>
  );
};

export default AppNavigator; 