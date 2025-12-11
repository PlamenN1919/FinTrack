import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SCREENS } from '../utils/constants';

// Import Tab Screens
import HomeScreen from '../screens/HomeScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import BudgetsScreen from '../screens/BudgetsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import ScannerScreen from '../screens/ScannerScreen';

// Import Stack Screens
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import AddBudgetScreen from '../screens/AddBudgetScreen';
import TransactionDetailsScreen from '../screens/TransactionDetailsScreen';
import BudgetDetailsScreen from '../screens/BudgetDetailsScreen';
import FinancialHealthScreen from '../screens/FinancialHealthScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import VoiceAssistantScreen from '../screens/VoiceAssistantScreen';
import WhatIfSimulationScreen from '../screens/WhatIfSimulationScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ReferralScreen from '../screens/ReferralScreen';

// Import Custom Tab Bar
import CustomTabBar from '../components/navigation/CustomTabBar';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Tab Navigator Component
function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Начало',
        }}
      />
      <Tab.Screen 
        name="TransactionsTab" 
        component={TransactionsScreen}
        options={{
          tabBarLabel: 'Транзакции',
        }}
      />
      <Tab.Screen 
        name="ScannerTab" 
        component={ScannerScreen}
        options={{
          tabBarLabel: '',
        }}
      />
      <Tab.Screen 
        name="BudgetsTab" 
        component={BudgetsScreen}
        options={{
          tabBarLabel: 'Бюджети',
        }}
      />
      <Tab.Screen 
        name="ReportsTab" 
        component={ReportsScreen}
        options={{
          tabBarLabel: 'Отчети',
        }}
      />
    </Tab.Navigator>
  );
}

// Main Navigator with Stack for modals and detail screens
function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        presentation: 'card',
      }}
    >
      {/* Main Tab Navigator */}
      <Stack.Screen 
        name="MainTabs" 
        component={TabNavigator}
      />
      
      {/* Stack Screens - Accessible from any tab */}
      <Stack.Screen 
        name={SCREENS.PROFILE} 
        component={ProfileScreen}
      />
      <Stack.Screen 
        name={SCREENS.SETTINGS} 
        component={SettingsScreen}
      />
      <Stack.Screen 
        name={SCREENS.ADD_TRANSACTION} 
        component={AddTransactionScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name={SCREENS.ADD_BUDGET} 
        component={AddBudgetScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name={SCREENS.TRANSACTION_DETAILS} 
        component={TransactionDetailsScreen}
      />
      <Stack.Screen 
        name={SCREENS.BUDGET_DETAILS} 
        component={BudgetDetailsScreen}
      />
      <Stack.Screen 
        name={SCREENS.FINANCIAL_HEALTH} 
        component={FinancialHealthScreen}
      />
      <Stack.Screen 
        name={SCREENS.ACHIEVEMENTS} 
        component={AchievementsScreen}
      />
      <Stack.Screen 
        name={SCREENS.VOICE_ASSISTANT} 
        component={VoiceAssistantScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name={SCREENS.WHAT_IF_SIMULATION} 
        component={WhatIfSimulationScreen}
      />
      <Stack.Screen 
        name={SCREENS.EDIT_PROFILE} 
        component={EditProfileScreen}
      />
      <Stack.Screen 
        name={SCREENS.REFERRAL} 
        component={ReferralScreen}
      />
    </Stack.Navigator>
  );
}

export default MainNavigator; 