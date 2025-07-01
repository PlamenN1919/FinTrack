import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

function SimplifiedMainScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Main App Screen</Text>
      <Text style={styles.subtext}>Ако виждате това, значи работи!</Text>
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
    }
});

function MainNavigator() {
  // Цялото оригинално съдържание е заменено с този прост компонент,
  // за да изолираме проблема.
  return <SimplifiedMainScreen />;
}

export default MainNavigator; 