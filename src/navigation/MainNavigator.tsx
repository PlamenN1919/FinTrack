import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { SCREENS } from '../utils/constants';

// Import screens
import ProfileScreen from '../screens/ProfileScreen';
import ReferralScreen from '../screens/ReferralScreen';

const Stack = createNativeStackNavigator();

function SimplifiedMainScreen({ navigation }: any) {
  const { logout } = useAuth();
  
  const handleLogout = () => {
    Alert.alert(
      'Излизане', 
      'Искате ли да излезете и да се върнете към началния екран?',
      [
        { text: 'Отказ', style: 'cancel' },
        { 
          text: 'Излизане', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  const handleNavigateToProfile = () => {
    navigation.navigate(SCREENS.PROFILE);
  };

  const handleNavigateToReferral = () => {
    navigation.navigate(SCREENS.REFERRAL);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Main App Screen</Text>
      <Text style={styles.subtext}>Ако виждате това, значи работи!</Text>
      
      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.navButton} onPress={handleNavigateToProfile}>
          <Text style={styles.navButtonText}>👤 Профил</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navButton} onPress={handleNavigateToReferral}>
          <Text style={styles.navButtonText}>🎉 Покани приятел</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>← Обратно към началото</Text>
      </TouchableOpacity>
    </View>
  );
}

function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="MainHome" 
        component={SimplifiedMainScreen} 
      />
      <Stack.Screen 
        name={SCREENS.PROFILE} 
        component={ProfileScreen} 
      />
      <Stack.Screen 
        name={SCREENS.REFERRAL} 
        component={ReferralScreen} 
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1A1A1A',
    },
    text: {
        color: 'white',
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    subtext: {
        color: 'lightgray',
        fontSize: 18,
        marginTop: 10,
        marginBottom: 40,
    },
    buttonContainer: {
        width: '80%',
        gap: 16,
        marginBottom: 40,
    },
    navButton: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        backgroundColor: '#00B4DB',
        borderRadius: 12,
        alignItems: 'center',
    },
    navButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    logoutButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#FF6B6B',
        borderRadius: 8,
    },
    logoutButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    }
});

export default MainNavigator; 