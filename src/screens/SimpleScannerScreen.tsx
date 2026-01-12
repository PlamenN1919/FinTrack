import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Camera, CameraType } from 'react-native-camera-kit';
import LinearGradient from 'react-native-linear-gradient';

import { useTheme } from '../utils/ThemeContext';
import { useTransactions } from '../utils/TransactionContext';
import { SCREENS } from '../utils/constants';

const SimpleScannerScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { addTransaction } = useTransactions();
  const [isScanning, setIsScanning] = useState(false);

  const handleQRCodeScanned = async (event: any) => {
    const qrData = event?.nativeEvent?.codeStringValue;
    
    if (!qrData) {
      Alert.alert('Грешка', 'Няма данни от QR кода');
      return;
    }

    console.log('✅ QR Code scanned:', qrData);
    setIsScanning(false);

    // Опростено парсиране - само извличаме сумата
    const amountMatch = qrData.match(/(\d+\.\d{2})/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 10.00;

    Alert.alert(
      'QR Код Сканиран!',
      `Открита сума: ${amount.toFixed(2)} €\n\nИскате ли да създадете транзакция?`,
      [
        {
          text: 'Да',
          onPress: async () => {
            try {
              await addTransaction({
                amount: -Math.abs(amount),
                category: 'Храна',
                date: new Date().toISOString().split('T')[0],
                merchant: 'Сканиран магазин',
                note: '🧾 Сканирана бележка',
                emotionalState: 'neutral',
                paymentMethod: 'Карта',
                icon: '🧾',
              });

              Alert.alert('Успех!', 'Транзакцията е създадена!', [
                { text: 'OK', onPress: () => navigation.navigate('TransactionsTab') },
              ]);
            } catch (error) {
              console.error('Error creating transaction:', error);
              Alert.alert('Грешка', 'Не можах да създам транзакция');
            }
          },
        },
        {
          text: 'Не',
          style: 'cancel',
          onPress: () => setIsScanning(false),
        },
      ]
    );
  };

  if (isScanning) {
    return (
      <View style={styles.container}>
        <Camera
          style={StyleSheet.absoluteFillObject}
          cameraType={CameraType.Back}
          scanBarcode={true}
          showFrame={true}
          laserColor="rgba(0, 180, 219, 0.8)"
          frameColor="rgba(0, 180, 219, 0.8)"
          onReadCode={handleQRCodeScanned}
        />
        
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setIsScanning(false)}
        >
          <Text style={styles.cancelButtonText}>Затвори</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={theme.colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <SafeAreaView style={styles.headerContent}>
            <Text style={styles.headerTitle}>📷 QR Сканер</Text>
            <Text style={styles.headerSubtitle}>Опростена версия</Text>
          </SafeAreaView>
        </LinearGradient>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Готов за сканиране
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Натиснете бутона за да отворите камерата
        </Text>

        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => {
            console.log('📷 Opening camera...');
            setIsScanning(true);
          }}
        >
          <Text style={styles.scanButtonText}>📷 Отвори Камерата</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => navigation.navigate(SCREENS.ADD_TRANSACTION)}
        >
          <Text style={[styles.manualButtonText, { color: theme.colors.primary }]}>
            Или въведи ръчно
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '300',
    color: '#F7E7CE',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(247, 231, 206, 0.7)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
  },
  scanButton: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 25,
    marginBottom: 20,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  manualButton: {
    paddingVertical: 12,
  },
  manualButtonText: {
    fontSize: 16,
  },
  cancelButton: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default SimpleScannerScreen;

