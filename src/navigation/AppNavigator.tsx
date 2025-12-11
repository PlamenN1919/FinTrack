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

  // Initialize deep link handler and navigation listeners
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

  // Route Guard Logic - Smart navigation based on UserState
  // 🚧 TEMPORARY: Bypass auth for development - always show Main App
  const shouldShowAuth = () => {
    console.log('[AppNavigator] 🚧 DEV MODE: Bypassing auth, showing Main App');
    console.log('[AppNavigator] Current userState:', authState.userState);
    console.log('[AppNavigator] User:', authState.user?.uid || 'null');
    console.log('[AppNavigator] Subscription:', authState.subscription?.status || 'null');
    
    // 🚧 TEMPORARY: Always return false to show Main App
    return false;
    
    /* ORIGINAL CODE - RESTORE WHEN DONE:
    // Show Main App only for active subscribers
    if (authState.userState === UserState.ACTIVE_SUBSCRIBER) {
      console.log('[AppNavigator] Showing Main App - user is active subscriber');
      return false;
    }
    
    // Show Auth flow for all other states
    console.log('[AppNavigator] Showing Auth flow for userState:', authState.userState);
    return true;
    */
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