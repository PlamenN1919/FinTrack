import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

function SimplifiedMainScreen() {
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
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Main App Screen</Text>
      <Text style={styles.subtext}>Ако виждате това, значи работи!</Text>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>← Обратно към началото</Text>
      </TouchableOpacity>
    </View>
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
    },
    logoutButton: {
        marginTop: 40,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#00B4DB',
        borderRadius: 8,
    },
    logoutButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    }
});

function MainNavigator() {
  // Цялото оригинално съдържание е заменено с този прост компонент,
  // за да изолираме проблема.
  return <SimplifiedMainScreen />;
}

export default MainNavigator; 