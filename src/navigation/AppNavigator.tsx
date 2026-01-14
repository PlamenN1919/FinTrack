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

// Import analytics for screen tracking
import { logScreenView } from '../utils/analytics';

const Stack = createNativeStackNavigator();

const AppNavigator: React.FC = () => {
  const { authState, isLoading } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const routeNameRef = useRef<string | undefined>(undefined);

  // Initialize deep link handler and navigation listeners
  useEffect(() => {
    if (navigationRef.current) {
      deepLinkHandler.setNavigationRef(navigationRef.current);
    }

    // Initialize deep link listener
    const cleanup = deepLinkHandler.initializeListener();

    return cleanup;
  }, []);

  // Log auth state changes for debugging
  useEffect(() => {
    console.log('[AppNavigator] Auth state changed:', {
      userState: authState.userState,
      isLoading,
      hasUser: !!authState.user,
      hasSubscription: !!authState.subscription,
      subscriptionStatus: authState.subscription?.status || 'null',
      isInitialized: authState.isInitialized,
    });
  }, [authState.userState, isLoading, authState.user, authState.subscription, authState.isInitialized]);

  // Show loading screen while checking auth state or not initialized
  if (isLoading || !authState.isInitialized) {
    console.log('[AppNavigator] Showing loading screen...', { isLoading, isInitialized: authState.isInitialized });
    return null; // Simple loading without styling for now
  }

  // Route Guard Logic - Smart navigation based on UserState
  const shouldShowAuth = () => {
    console.log('========================================');
    console.log('[AppNavigator] 🚀 NAVIGATION DECISION');
    console.log('[AppNavigator] 👤 User State:', authState.userState);
    console.log('[AppNavigator] 🆔 User ID:', authState.user?.uid || 'null');
    console.log('[AppNavigator] 📧 Email:', authState.user?.email || 'null');
    console.log('[AppNavigator] 💳 Subscription Status:', authState.subscription?.status || 'null');
    console.log('[AppNavigator] 📋 Subscription Plan:', authState.subscription?.plan || 'null');
    console.log('========================================');
    
    // Show Main App only for active subscribers
    if (authState.userState === UserState.ACTIVE_SUBSCRIBER) {
      console.log('[AppNavigator] ✅ SHOWING MAIN APP - User is active subscriber!');
      console.log('========================================');
      return false;
    }
    
    // Show Auth flow for all other states
    console.log('[AppNavigator] 🔐 SHOWING AUTH FLOW for userState:', authState.userState);
    console.log('[AppNavigator] 📍 Reason: User state is NOT ACTIVE_SUBSCRIBER');
    console.log('========================================');
    return true;
  };

  return (
    <StripeContextProvider>
      <NavigationContainer 
        ref={navigationRef}
        linking={linkingConfig}
        onReady={() => {
          if (navigationRef.current) {
            deepLinkHandler.setNavigationRef(navigationRef.current);
            // Set initial route name
            const currentRoute = navigationRef.current.getCurrentRoute();
            routeNameRef.current = currentRoute?.name;
          }
        }}
        onStateChange={async () => {
          if (navigationRef.current) {
            const previousRouteName = routeNameRef.current;
            const currentRoute = navigationRef.current.getCurrentRoute();
            const currentRouteName = currentRoute?.name;

            // Track screen view if route changed
            if (previousRouteName !== currentRouteName && currentRouteName) {
              await logScreenView(currentRouteName);
            }

            // Update ref for next comparison
            routeNameRef.current = currentRouteName;
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