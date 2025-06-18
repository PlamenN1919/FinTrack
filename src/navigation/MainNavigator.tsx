import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Импортиране на custom tab bar
import CustomTabBar from '../components/navigation/CustomTabBar';



// Импортиране на екрани
import HomeScreen from '../screens/HomeScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import BudgetsScreen from '../screens/BudgetsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import ScannerScreen from '../screens/ScannerScreen';
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

// Импортиране на константи и контекст
import { SCREENS } from '../utils/constants';
import { useTheme } from '../utils/ThemeContext';

// Дефиниране на главен стек навигатор
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Навигатор за начален екран
function HomeStack() {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}>
      <Stack.Screen 
        name={SCREENS.HOME} 
        component={HomeScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={SCREENS.PROFILE} 
        component={ProfileScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={SCREENS.SETTINGS} 
        component={SettingsScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={SCREENS.FINANCIAL_HEALTH} 
        component={FinancialHealthScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={SCREENS.ACHIEVEMENTS} 
        component={AchievementsScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={SCREENS.VOICE_ASSISTANT} 
        component={VoiceAssistantScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={SCREENS.WHAT_IF_SIMULATION} 
        component={WhatIfSimulationScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={SCREENS.EDIT_PROFILE} 
        component={EditProfileScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={SCREENS.TRANSACTION_DETAILS} 
        component={TransactionDetailsScreen} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Навигатор за транзакции
function TransactionsStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}>
      <Stack.Screen 
        name={SCREENS.TRANSACTIONS} 
        component={TransactionsScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={SCREENS.ADD_TRANSACTION} 
        component={AddTransactionScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={SCREENS.TRANSACTION_DETAILS} 
        component={TransactionDetailsScreen} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Навигатор за бюджети
function BudgetsStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}>
      <Stack.Screen 
        name={SCREENS.BUDGETS} 
        component={BudgetsScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={SCREENS.ADD_BUDGET} 
        component={AddBudgetScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={SCREENS.BUDGET_DETAILS} 
        component={BudgetDetailsScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={SCREENS.TRANSACTION_DETAILS} 
        component={TransactionDetailsScreen} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Основен навигатор с табове и custom tab bar
function MainNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}>
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
      />
      <Tab.Screen
        name="TransactionsTab"
        component={TransactionsStack}
      />
      <Tab.Screen
        name="ScannerTab"
        component={ScannerScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="BudgetsTab"
        component={BudgetsStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="ReportsTab"
        component={ReportsScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}

export default MainNavigator; 