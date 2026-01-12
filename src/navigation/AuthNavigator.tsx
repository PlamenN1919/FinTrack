import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList, UserState } from '../types/auth.types';
import { useAuth } from '../contexts/AuthContext';

// Import all authentication screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import TermsOfServiceScreen from '../screens/auth/TermsOfServiceScreen';
import PrivacyPolicyScreen from '../screens/auth/PrivacyPolicyScreen';
import SubscriptionPlansScreen from '../screens/auth/SubscriptionPlansScreen';
import PaymentScreen from '../screens/auth/PaymentScreen';
import PaymentSuccessScreen from '../screens/auth/PaymentSuccessScreen';
import PaymentFailedScreen from '../screens/auth/PaymentFailedScreen';
import SubscriptionManagementScreen from '../screens/auth/SubscriptionManagementScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  const { authState } = useAuth();

  // Dynamic initial route based on user state
  const getInitialRouteName = (): keyof AuthStackParamList => {
    console.log('[AuthNavigator] Determining initial route for userState:', authState.userState);
    
    switch (authState.userState) {
      case UserState.REGISTERED_NO_SUBSCRIPTION:
      case UserState.PAYMENT_FAILED:
        console.log('[AuthNavigator] Starting with SubscriptionPlans - user needs subscription');
        return 'SubscriptionPlans';
      
      case UserState.EXPIRED_SUBSCRIBER:
        console.log('[AuthNavigator] Starting with SubscriptionPlans - subscription expired');
        return 'SubscriptionPlans';
      
      case UserState.UNREGISTERED:
      default:
        console.log('[AuthNavigator] Starting with Welcome - unregistered user');
        return 'Welcome';
    }
  };

  return (
    <Stack.Navigator
      initialRouteName={getInitialRouteName()}
      screenOptions={{
        headerShown: false, // Всички екрани имат custom headers
        gestureEnabled: true, // Enable swipe gestures
        animation: 'slide_from_right', // Premium slide animation
        animationDuration: 300,
        contentStyle: {
          backgroundColor: 'transparent', // Transparent за градиентите
        },
      }}
    >
      {/* Welcome Screen - Entry point */}
      <Stack.Screen 
        name="Welcome" 
        component={WelcomeScreen}
        options={{
          gestureEnabled: false, // Disable back gesture on welcome
          animation: 'fade', // Fade in animation
        }}
      />

      {/* Authentication Screens */}
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{
          animation: 'slide_from_right',
          gestureDirection: 'horizontal',
        }}
      />

      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{
          animation: 'slide_from_right',
          gestureDirection: 'horizontal',
        }}
      />

      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
        options={{
          animation: 'slide_from_bottom', // Modal-style animation
          presentation: 'modal',
          gestureDirection: 'vertical',
        }}
      />

      {/* Legal Screens */}
      <Stack.Screen 
        name="TermsOfService" 
        component={TermsOfServiceScreen}
        options={{
          animation: 'slide_from_right',
          gestureDirection: 'horizontal',
        }}
      />

      <Stack.Screen 
        name="PrivacyPolicy" 
        component={PrivacyPolicyScreen}
        options={{
          animation: 'slide_from_right',
          gestureDirection: 'horizontal',
        }}
      />

      {/* Subscription Screens */}
      <Stack.Screen 
        name="SubscriptionPlans" 
        component={SubscriptionPlansScreen}
        options={{
          animation: 'slide_from_right',
          gestureDirection: 'horizontal',
        }}
      />

      {/* Payment Screens */}
      <Stack.Screen 
        name="Payment" 
        component={PaymentScreen}
        options={{
          animation: 'slide_from_right',
          gestureDirection: 'horizontal',
        }}
      />

      <Stack.Screen 
        name="PaymentSuccess" 
        component={PaymentSuccessScreen}
        options={{
          gestureEnabled: false, // Disable back gesture on success
          animation: 'fade_from_bottom', // Celebration animation
          animationDuration: 500,
        }}
      />

      <Stack.Screen 
        name="PaymentFailed" 
        component={PaymentFailedScreen}
        options={{
          animation: 'slide_from_bottom', // Error modal animation
          presentation: 'modal',
          gestureDirection: 'vertical',
        }}
      />

      <Stack.Screen 
        name="SubscriptionManagement" 
        component={SubscriptionManagementScreen}
        options={{
          animation: 'slide_from_right',
          gestureDirection: 'horizontal',
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator; 