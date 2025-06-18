import React, { useRef, useEffect } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { UserState } from '../types/auth.types';

// Import navigators and linking
import AuthNavigator from './AuthNavigator';
import { linkingConfig } from './linking.config';
import { deepLinkHandler } from '../utils/deepLinkHandler';
// TODO: Import MainNavigator when created
// import MainNavigator from './MainNavigator';

// Temporary placeholder for main app
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const Stack = createNativeStackNavigator();

// Temporary Main App Screen (placeholder)
const MainAppScreen: React.FC = () => {
  const { logout, user, authState } = useAuth();

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>🎉 Добре дошли в FinTrack!</Text>
        <Text style={styles.subtitle}>
          Вашата абонаментна система работи перфектно!
        </Text>
        
        <View style={styles.userInfo}>
          <Text style={styles.userText}>Потребител: {user?.email}</Text>
          <Text style={styles.userText}>
            Абонамент: {authState.subscription?.plan || 'Неизвестен'}
          </Text>
          <Text style={styles.userText}>
            Статус: {authState.subscription?.status || 'Неизвестен'}
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Изход</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

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
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.loadingContainer}
      >
        <Text style={styles.loadingText}>Зареждане...</Text>
      </LinearGradient>
    );
  }

  // Route Guard Logic
  const shouldShowAuth = () => {
    switch (authState.userState) {
      case UserState.UNREGISTERED:
      case UserState.REGISTERED_NO_SUBSCRIPTION:
      case UserState.EXPIRED_SUBSCRIBER:
      case UserState.PAYMENT_FAILED:
        return true;
      case UserState.ACTIVE_SUBSCRIBER:
        return false;
      default:
        return true; // Default to auth if unknown state
    }
  };

  return (
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
            component={MainAppScreen} // TODO: Replace with MainNavigator
            options={{
              animationTypeForReplace: 'push', // Smooth transition when logging in
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  userInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
    minWidth: 280,
  },
  userText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default AppNavigator; 