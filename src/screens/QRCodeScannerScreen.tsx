import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { RNCamera } from 'react-native-camera';
import LinearGradient from 'react-native-linear-gradient';

import { useTheme } from '../utils/ThemeContext';
import { useTransactions } from '../utils/TransactionContext';
import { SCREENS } from '../utils/constants';

const QRCodeScannerScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { addTransaction } = useTransactions();
  const [isScanning, setIsScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  const parseReceiptQR = (qrData: string): { amount: number; store: string } | null => {
    try {
      // Формат 1: JSON
      if (qrData.startsWith('{')) {
        const parsed = JSON.parse(qrData);
        return {
          amount: parsed.total || parsed.amount || 0,
          store: parsed.store || parsed.merchant || 'Сканиран магазин',
        };
      }

      // Формат 2: URL
      if (qrData.includes('http')) {
        const url = new URL(qrData);
        const params = new URLSearchParams(url.search);
        return {
          amount: parseFloat(params.get('total') || params.get('amount') || '0'),
          store: params.get('store') || params.get('merchant') || 'Сканиран магазин',
        };
      }

      // Формат 3: Опростен - само сума
      const amountMatch = qrData.match(/(\d+\.\d{2})/);
      if (amountMatch) {
        return {
          amount: parseFloat(amountMatch[1]),
          store: 'Сканиран магазин',
        };
      }

      return null;
    } catch (error) {
      console.error('Error parsing QR:', error);
      return null;
    }
  };

  const handleQRCodeScanned = async (e: any) => {
    if (scanned) return;

    setScanned(true);
    const qrData = e.data;

    console.log('✅ QR Code scanned:', qrData);

    const parsed = parseReceiptQR(qrData);

    if (!parsed) {
      Alert.alert(
        'Неразпознат QR Код',
        'Не можах да разпозная формата на бележката. Искате ли да въведете ръчно?',
        [
          { text: 'Да', onPress: () => navigation.navigate(SCREENS.ADD_TRANSACTION) },
          { text: 'Опитай отново', onPress: () => setScanned(false) },
        ]
      );
      return;
    }

    Alert.alert(
      'QR Код Сканиран!',
      `Магазин: ${parsed.store}\nСума: ${parsed.amount.toFixed(2)} €\n\nИскате ли да създадете транзакция?`,
      [
        {
          text: 'Да',
          onPress: async () => {
            try {
              await addTransaction({
                amount: -Math.abs(parsed.amount),
                category: 'Храна',
                date: new Date().toISOString().split('T')[0],
                merchant: parsed.store,
                note: '🧾 Сканирана бележка',
                emotionalState: 'neutral',
                paymentMethod: 'Карта',
                icon: '🧾',
              });

              Alert.alert('Успех!', 'Транзакцията е създадена!', [
                {
                  text: 'Виж транзакции',
                  onPress: () => {
                    setIsScanning(false);
                    navigation.navigate('TransactionsTab');
                  },
                },
                {
                  text: 'Сканирай още',
                  onPress: () => setScanned(false),
                },
              ]);
            } catch (error) {
              console.error('Error creating transaction:', error);
              Alert.alert('Грешка', 'Не можах да създам транзакция');
              setScanned(false);
            }
          },
        },
        {
          text: 'Не',
          style: 'cancel',
          onPress: () => setScanned(false),
        },
      ]
    );
  };

  if (isScanning) {
    return (
      <View style={styles.scannerContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <QRCodeScanner
          onRead={handleQRCodeScanned}
          flashMode={RNCamera.Constants.FlashMode.off}
          reactivate={!scanned}
          reactivateTimeout={500}
          showMarker={true}
          markerStyle={styles.marker}
          cameraStyle={styles.camera}
          topContent={
            <View style={styles.topContent}>
              <Text style={styles.instructionText}>
                Насочете камерата към QR кода на бележката
              </Text>
            </View>
          }
          bottomContent={
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setIsScanning(false);
                setScanned(false);
              }}
            >
              <Text style={styles.cancelButtonText}>Затвори</Text>
            </TouchableOpacity>
          }
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={theme.colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <SafeAreaView style={styles.headerContent}>
            <Text style={styles.headerTitle}>📷 QR Сканер</Text>
            <Text style={styles.headerSubtitle}>Сканиране на касови бележки</Text>
          </SafeAreaView>
        </LinearGradient>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Готов за сканиране
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Натиснете бутона за да отворите камерата и сканирайте QR кода от вашата касова бележка
        </Text>

        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => {
            console.log('📷 Opening QR scanner...');
            setIsScanning(true);
            setScanned(false);
          }}
        >
          <Text style={styles.scanButtonText}>📷 Започни Сканиране</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => navigation.navigate(SCREENS.ADD_TRANSACTION)}
        >
          <Text style={[styles.manualButtonText, { color: theme.colors.primary }]}>
            Или въведи ръчно
          </Text>
        </TouchableOpacity>

        <View style={[styles.infoBadge, { backgroundColor: 'rgba(0, 180, 219, 0.1)', borderColor: theme.colors.primary }]}>
          <Text style={[styles.infoBadgeText, { color: theme.colors.primary }]}>
            ℹ️ Поддържа JSON, URL и опростени QR формати
          </Text>
        </View>
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
    lineHeight: 24,
  },
  scanButton: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  manualButton: {
    paddingVertical: 12,
    marginBottom: 20,
  },
  manualButtonText: {
    fontSize: 16,
  },
  infoBadge: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: '90%',
  },
  infoBadgeText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  marker: {
    borderColor: 'rgba(0, 180, 219, 0.8)',
    borderWidth: 2,
    borderRadius: 10,
  },
  topContent: {
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  instructionText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default QRCodeScannerScreen;

