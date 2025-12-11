import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  StatusBar,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Camera, CameraType } from 'react-native-camera-kit';
import LinearGradient from 'react-native-linear-gradient';

// Тематичен контекст и транзакции
import { useTheme } from '../utils/ThemeContext';
import { useTransactions } from '../utils/TransactionContext';
import { SCREENS, EXPENSE_CATEGORIES } from '../utils/constants';

// Типове
interface ScanResult {
  type: string;
  rawData: string;
  parsedData?: {
    store?: string;
    date?: string;
    items?: Array<{
      name: string;
      price: number;
      quantity?: number;
    }>;
    total?: number;
    fiscalNumber?: string;
    cashierNumber?: string;
    paymentMethod?: string;
  };
}

interface ReceiptData {
  store: string;
  date: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  fiscalNumber?: string;
  cashierNumber?: string;
  paymentMethod?: string;
}

// Debug mode за симулатор (когато няма камера)
const IS_SIMULATOR = Platform.OS === 'ios' && !Platform.isPad && Platform.isTVOS === false;
const ENABLE_DEBUG_MODE = __DEV__ && IS_SIMULATOR;

const ScannerScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { addTransaction } = useTransactions();
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanTimeout, setScanTimeout] = useState<NodeJS.Timeout | null>(null);
  const cameraRef = useRef<any>(null);

  // Проверка за разрешения за камера
  useEffect(() => {
    requestCameraPermission();
  }, []);

  // Cleanup при unmount и back button handling
  useEffect(() => {
    const backAction = () => {
      if (isScanning) {
        setIsScanning(false);
        return true; // Prevent default back action
      }
      return false; // Allow default back action
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => {
      // Cleanup
      setIsScanning(false);
      setIsProcessing(false);
      setScanResult(null);
      setError(null);
      
      // Clear timeout
      if (scanTimeout) {
        clearTimeout(scanTimeout);
      }
      
      // Remove back handler
      backHandler.remove();
    };
  }, [isScanning, scanTimeout]);

  const requestCameraPermission = useCallback(async () => {
    try {
      setError(null);
      
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Разрешение за камера',
            message: 'FinTrack се нуждае от достъп до камерата за сканиране на QR кодове',
            buttonNeutral: 'Попитай по-късно',
            buttonNegative: 'Откажи',
            buttonPositive: 'Разреши',
          }
        );
        setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setError('Достъпът до камерата е необходим за сканиране на QR кодове');
        }
      } else {
        setHasPermission(true); // iOS разрешенията се обработват автоматично
      }
    } catch (err) {
      console.error('Грешка при заявка за разрешения:', err);
      setError('Възникна грешка при заявката за достъп до камерата');
      setHasPermission(false);
    }
  }, []);

  // Валидация на QR данни за безопасност
  const validateQRData = (qrData: string): boolean => {
    try {
      // Проверка за дължина
      if (!qrData || qrData.length > 10000) {
        return false;
      }
      
      // Проверка за подозрителни схеми
      const suspiciousPatterns = [
        /javascript:/i,
        /data:/i,
        /vbscript:/i,
        /<script/i,
        /onclick/i,
        /onerror/i,
      ];
      
      return !suspiciousPatterns.some(pattern => pattern.test(qrData));
    } catch (error) {
      console.error('Грешка при валидация на QR данни:', error);
      return false;
    }
  };

  // Парсиране на QR код от касова бележка с подобрена безопасност
  const parseReceiptQR = useCallback((qrData: string): ReceiptData | null => {
    try {
      // Валидация на входните данни
      if (!validateQRData(qrData)) {
        console.warn('Невалидни или подозрителни QR данни');
        return null;
      }

      // Българските касови бележки обикновено използват специфичен формат
      // Ще поддържаме няколко формата:
      
      // Формат 1: JSON структура
      if (qrData.startsWith('{') && qrData.endsWith('}')) {
        const parsed = JSON.parse(qrData);
        return {
          store: parsed.store || parsed.merchant || 'Неизвестен магазин',
          date: parsed.date || parsed.timestamp || new Date().toISOString(),
          items: parsed.items || [],
          total: parsed.total || parsed.amount || 0,
          fiscalNumber: parsed.fiscalNumber || parsed.fn,
          cashierNumber: parsed.cashierNumber || parsed.operator,
          paymentMethod: parsed.paymentMethod || 'Неизвестен',
        };
      }
      
      // Формат 2: URL формат (често използван в България) - подобрена сигурност
      if (qrData.includes('http') || qrData.includes('www')) {
        try {
          const url = new URL(qrData);
          const params = new URLSearchParams(url.search);
          
          return {
            store: params.get('store') || params.get('merchant') || 'Неизвестен магазин',
            date: params.get('date') || params.get('dt') || new Date().toISOString(),
            items: parseItemsFromParams(params.get('items') || ''),
            total: parseFloat(params.get('total') || params.get('sum') || '0'),
            fiscalNumber: params.get('fn') || params.get('fiscal') || undefined,
            cashierNumber: params.get('op') || params.get('cashier') || undefined,
            paymentMethod: params.get('payment') || 'Карта',
          };
        } catch (urlError) {
          console.warn('URL parsing failed:', urlError);
          // Fallback to simple amount extraction
          const simpleAmountMatch = qrData.match(/(\d+\.\d{2})/);
          if (simpleAmountMatch) {
            return {
              store: 'Сканирана бележка',
              date: new Date().toISOString(),
              items: [{
                name: 'Покупка от URL',
                price: parseFloat(simpleAmountMatch[1]),
                quantity: 1,
              }],
              total: parseFloat(simpleAmountMatch[1]),
              paymentMethod: 'Карта',
            };
          }
        }
      }
      
      // Формат 3: Структуриран текст (разделен с |, ; или ,)
      if (qrData.includes('|') || qrData.includes(';')) {
        const parts = qrData.split(/[|;]/);
        const items = [];
        let total = 0;
        
        // Опитваме се да извлечем информация от структурирания текст
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i].trim();
          
          // Търсим цени (числа с 2 десетични знака)
          const priceMatch = part.match(/(\d+\.\d{2})/);
          if (priceMatch) {
            const price = parseFloat(priceMatch[1]);
            const name = part.replace(priceMatch[0], '').trim() || `Продукт ${i + 1}`;
            items.push({
              name: name,
              price: price,
              quantity: 1,
            });
            total += price;
          }
        }
        
        return {
          store: parts[0] || 'Неизвестен магазин',
          date: new Date().toISOString(),
          items: items,
          total: total,
          paymentMethod: 'Карта',
        };
      }
      
      // Формат 4: Опростен формат - само сума
      const simpleAmountMatch = qrData.match(/(\d+\.\d{2})/);
      if (simpleAmountMatch) {
        const amount = parseFloat(simpleAmountMatch[1]);
        return {
          store: 'Сканирана бележка',
          date: new Date().toISOString(),
          items: [{
            name: 'Покупка',
            price: amount,
            quantity: 1,
          }],
          total: amount,
          paymentMethod: 'Карта',
        };
      }
      
      return null;
    } catch (error) {
      console.error('Грешка при парсиране на QR код:', error);
      return null;
    }
  }, []);

  // Помощна функция за парсиране на продукти от URL параметри
  const parseItemsFromParams = (itemsString: string) => {
    if (!itemsString) return [];
    
    try {
      // Опитваме се да парсираме като JSON
      return JSON.parse(decodeURIComponent(itemsString));
    } catch {
      // Ако не е JSON, опитваме се да парсираме като прост текст
      return itemsString.split(',').map((item, index) => ({
        name: item.trim() || `Продукт ${index + 1}`,
        price: 0,
        quantity: 1,
      }));
    }
  };

  // Обработка на сканиран QR код с подобрено error handling
  const handleQRCodeScanned = useCallback((event: any) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      setIsScanning(false);
      setError(null);
      
      // Clear existing timeout
      if (scanTimeout) {
        clearTimeout(scanTimeout);
        setScanTimeout(null);
      }
      
      const qrData = event?.nativeEvent?.codeStringValue;
      
      if (!qrData) {
        throw new Error('Няма данни от QR кода');
      }
      
      console.log('📱 QR Scanner: Scanned data:', qrData.substring(0, 100) + '...');
      
      // Парсираме QR кода
      const parsedData = parseReceiptQR(qrData);
      
      if (parsedData) {
        setScanResult({
          type: 'QR_CODE',
          rawData: qrData,
          parsedData: parsedData,
        });
        
        console.log('✅ QR Scanner: Successfully parsed receipt data:', {
          store: parsedData.store,
          total: parsedData.total,
          itemsCount: parsedData.items?.length || 0
        });
      } else {
        setError('Не можах да разпозная формата на касовата бележка');
        Alert.alert(
          'Грешка при сканиране',
          'Не можах да разпозная формата на касовата бележка. Моля, опитайте отново или въведете данните ръчно.',
          [
            { text: 'Опитай отново', onPress: startScan },
            { text: 'Въведи ръчно', onPress: () => navigation.navigate(SCREENS.ADD_TRANSACTION) },
          ]
        );
      }
    } catch (error) {
      console.error('❌ QR Scanner: Error processing scanned data:', error);
      setError('Възникна грешка при обработката на QR кода');
      Alert.alert(
        'Грешка',
        'Възникна грешка при обработката на QR кода. Моля, опитайте отново.',
        [
          { text: 'Опитай отново', onPress: startScan },
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, scanTimeout, parseReceiptQR, navigation]);

  // Симулиране на сканиране за DEBUG режим (симулатор)
  const simulateScan = useCallback(() => {
    console.log('🧪 DEBUG MODE: Симулиране на QR сканиране');
    
    // Тестови QR данни
    const mockQRData = JSON.stringify({
      store: "Kaufland (TEST)",
      date: new Date().toISOString(),
      total: 45.99,
      items: [
        { name: "Хляб", price: 2.50, quantity: 2 },
        { name: "Мляко", price: 3.99, quantity: 1 },
        { name: "Кафе", price: 12.00, quantity: 1 },
        { name: "Плодове", price: 15.00, quantity: 1 },
        { name: "Зеленчуци", price: 12.50, quantity: 1 }
      ],
      fiscalNumber: "FN123456789",
      paymentMethod: "Карта"
    });
    
    // Симулираме event от камерата
    const mockEvent = {
      nativeEvent: {
        codeStringValue: mockQRData
      }
    };
    
    // Изчакваме 2 секунди за реалистичност
    setTimeout(() => {
      handleQRCodeScanned(mockEvent);
    }, 2000);
  }, [handleQRCodeScanned]);

  // Рестартиране на сканирането с timeout
  const startScan = useCallback(() => {
    try {
      setScanResult(null);
      setError(null);
      setIsScanning(true);
      
      // DEBUG MODE: Ако сме в симулатор, симулираме сканиране
      if (ENABLE_DEBUG_MODE) {
        console.log('🧪 DEBUG MODE: Активиран - симулиране на сканиране след 2 секунди');
        Alert.alert(
          '🧪 Debug Mode',
          'Симулаторът няма камера. Ще симулирам сканиране на тестова бележка след 2 секунди.',
          [{ text: 'OK' }]
        );
        simulateScan();
        return;
      }
      
      // Set timeout for scanning (30 seconds)
      const timeout = setTimeout(() => {
        setIsScanning(false);
        setError('Времето за сканиране изтече');
        Alert.alert(
          'Timeout',
          'Времето за сканиране изтече. Моля, опитайте отново.',
          [{ text: 'OK' }]
        );
      }, 30000);
      
      setScanTimeout(timeout);
      
      console.log('📱 QR Scanner: Started scanning with 30s timeout');
    } catch (error) {
      console.error('Грешка при стартиране на сканиране:', error);
      setError('Възникна грешка при стартиране на сканирането');
    }
  }, [simulateScan]);

  // Запазване на сканираните данни като транзакция с подобрено error handling
  const saveAsTransaction = useCallback(async () => {
    if (!scanResult?.parsedData) {
      setError('Няма данни за запазване');
      return;
    }
    
    const { parsedData } = scanResult;
    
    // Намираме подходяща категория от съществуващите
    const getAppropriateCategory = (storeName: string, items: any[]): string => {
      const store = storeName.toLowerCase();
      
      // Интелигентно разпознаване на категория според магазина
      if (store.includes('аптека') || store.includes('pharmacy')) {
        return 'Здраве';
      } else if (store.includes('бензин') || store.includes('gas') || store.includes('петрол')) {
        return 'Транспорт';
      } else if (store.includes('ресторант') || store.includes('restaurant') || store.includes('кафе')) {
        return 'Храна';
      } else if (store.includes('магазин') || store.includes('market') || store.includes('shop')) {
        return 'Храна'; // По подразбиране за магазини
      } else {
        // Използваме първата налична категория от EXPENSE_CATEGORIES
        const categories = Object.values(EXPENSE_CATEGORIES);
        return categories.length > 0 ? categories[0].name : 'Битови';
      }
    };

    const categoryName = getAppropriateCategory(parsedData.store || 'Неизвестен магазин', parsedData.items || []);
    
    // Валидация на датата
    const validDate = parsedData.date ? 
      (new Date(parsedData.date).toISOString().split('T')[0]) : 
      (new Date().toISOString().split('T')[0]);
    
    // Създаваме транзакция от сканираните данни
    try {
      // ВАЖНО: чакаме транзакцията да се запише в Firestore
      await addTransaction({
        amount: -Math.abs(parsedData.total || 0), // Винаги отрицателна сума (разход)
        category: categoryName,
        date: validDate,
        merchant: parsedData.store || 'Сканиран магазин',
        note: `🧾 Сканирана бележка - ${parsedData.items?.length || 0} продукта`,
        emotionalState: 'neutral',
        paymentMethod: parsedData.paymentMethod || 'Карта',
        icon: '🧾',
      });
      
      console.log('📱 QR Scanner: Transaction created from scanned receipt', {
        store: parsedData.store,
        total: parsedData.total,
        category: categoryName,
        isScanned: true // This will be detected by the metadata logic
      });
      
      Alert.alert(
        'Успех!',
        `Транзакцията беше добавена успешно от сканираната бележка.\n\nСума: ${parsedData.total?.toFixed(2)} лв.\nКатегория: ${categoryName}`,
        [
          { text: 'Виж транзакции', onPress: () => navigation.navigate('TransactionsTab') },
          { text: 'Сканирай още', onPress: startScan },
        ]
      );
      
      setScanResult(null);
    } catch (error) {
      console.error('Грешка при запазване на транзакция:', error);
      Alert.alert(
        'Грешка',
        'Възникна проблем при запазването на транзакцията. Моля, опитайте отново.',
        [
          { text: 'OK', onPress: () => setScanResult(null) }
        ]
      );
    }
  }, [scanResult, addTransaction, navigation]);

  // Показване на резултата от сканирането
  const renderResult = () => {
    if (!scanResult?.parsedData) return null;

    const { parsedData } = scanResult;

    return (
      <View style={styles.resultContainer}>
        <Text style={[styles.resultTitle, { color: theme.colors.text }]}>
          Сканирана касова бележка
        </Text>
        
        <View style={[styles.storeContainer, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.storeName, { color: theme.colors.text }]}>
            {parsedData.store}
          </Text>
                     <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
             {new Date(parsedData.date || Date.now()).toLocaleString('bg-BG')}
           </Text>
          {parsedData.fiscalNumber && (
            <Text style={[styles.fiscalNumber, { color: theme.colors.textSecondary }]}>
              Фискален номер: {parsedData.fiscalNumber}
            </Text>
          )}
        </View>

        <View style={[styles.itemsContainer, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.itemsTitle, { color: theme.colors.text }]}>
            Продукти ({parsedData.items?.length || 0}):
          </Text>
          {parsedData.items?.map((item, index) => (
            <View key={index} style={styles.itemRow}>
                             <Text style={[styles.itemName, { color: theme.colors.text }]}>
                 {item.name} {(item.quantity || 1) > 1 && `(${item.quantity || 1})`}
               </Text>
              <Text style={[styles.itemPrice, { color: theme.colors.text }]}>
                {item.price.toFixed(2)} лв.
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Общо:</Text>
            <Text style={[styles.totalPrice, { color: theme.colors.primary }]}>
              {parsedData.total?.toFixed(2) || '0.00'} лв.
            </Text>
          </View>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton, { borderColor: theme.colors.error }]}
            onPress={startScan}>
            <Text style={[styles.buttonText, { color: theme.colors.error }]}>Сканирай отново</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.saveButton, { backgroundColor: theme.colors.primary }]}
            onPress={saveAsTransaction}>
            <Text style={[styles.buttonText, { color: '#FFF' }]}>Запази като транзакция</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Error компонент
  const renderErrorState = () => (
    <View style={styles.centerContainer}>
      <Text style={[styles.errorIcon, { color: theme.colors.error }]}>⚠️</Text>
      <Text style={[styles.errorTitle, { color: theme.colors.error }]}>
        Възникна грешка
      </Text>
      <Text style={[styles.errorMessage, { color: theme.colors.textSecondary }]}>
        {error}
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          setError(null);
          startScan();
        }}
      >
        <Text style={styles.retryButtonText}>Опитай отново</Text>
      </TouchableOpacity>
    </View>
  );

  // Визуализиране на екрана за сканиране с error handling
  const renderScanningScreen = () => (
    <View style={styles.cameraContainer}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        cameraType={CameraType.Back}
        onReadCode={handleQRCodeScanned}
        showFrame={true}
        laserColor="red"
        frameColor="white"
        onError={(error) => {
          console.error('Camera error:', error);
          setError('Грешка с камерата: ' + (error?.nativeEvent?.errorMessage || 'Неизвестна грешка'));
          setIsScanning(false);
        }}
      />
      <View style={styles.overlayContainer}>
        <View style={styles.scanFrame} />
        <Text style={styles.scanInstructions}>
          Позиционирайте QR кода на касовата бележка в рамката
        </Text>
        {scanTimeout && (
          <Text style={styles.timeoutWarning}>
            Сканирането ще спре автоматично след 30 секунди
          </Text>
        )}
        <TouchableOpacity 
          style={[styles.cancelScanButton, { backgroundColor: theme.colors.error }]}
          onPress={() => {
            setIsScanning(false);
            if (scanTimeout) {
              clearTimeout(scanTimeout);
              setScanTimeout(null);
            }
          }}
        >
          <Text style={styles.cancelScanText}>Отказ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor={theme.colors.primary}
          translucent={true}
        />
        <SafeAreaView style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.permissionText, { color: theme.colors.text }]}>
            Проверка на разрешенията за камера...
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor={theme.colors.primary}
          translucent={true}
        />
        <SafeAreaView style={styles.centerContainer}>
          <Text style={[styles.permissionText, { color: theme.colors.text }]}>
            Няма достъп до камерата
          </Text>
          <Text style={[styles.permissionSubtext, { color: theme.colors.textSecondary }]}>
            Моля, разрешете достъпа до камерата в настройките на устройството за да можете да сканирате QR кодове.
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: theme.colors.primary }]}
            onPress={requestCameraPermission}
          >
            <Text style={styles.permissionButtonText}>Опитай отново</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={theme.colors.primary}
        translucent={true}
      />
      
      {/* Модерен header с градиент */}
      {!isScanning && (
        <View style={styles.headerWrapper}>
          <LinearGradient
            colors={theme.colors.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <SafeAreaView style={styles.headerContent}>
              <View style={styles.header}>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.headerTitle}>
                    QR Сканер {ENABLE_DEBUG_MODE && '🧪'}
                  </Text>
                  <Text style={styles.headerSubtitle}>
                    {ENABLE_DEBUG_MODE 
                      ? 'Debug Mode - Симулирано сканиране' 
                      : 'Сканиране на касови бележки'}
                  </Text>
                </View>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </View>
      )}

      <View style={[styles.contentContainer, { marginTop: isScanning ? 0 : -12, paddingTop: isScanning ? 0 : 20 }]}>
        {error && !isScanning ? (
          renderErrorState()
        ) : isScanning ? (
          renderScanningScreen()
        ) : isProcessing ? (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.processingText, { color: theme.colors.text }]}>
              Анализирам касовата бележка...
            </Text>
          </View>
        ) : scanResult ? (
          renderResult()
        ) : (
          <View style={styles.centerContainer}>
            <Text style={[styles.welcomeTitle, { color: theme.colors.text }]}>
              QR Сканер за касови бележки
            </Text>
            <Text style={[styles.welcomeText, { color: theme.colors.textSecondary }]}>
              {ENABLE_DEBUG_MODE 
                ? '🧪 Debug Mode: Симулаторът няма камера. При натискане на бутона ще се симулира сканиране на тестова бележка.' 
                : 'Сканирайте QR кода на вашата касова бележка за автоматично добавяне на транзакция'}
            </Text>
            <TouchableOpacity
              style={[styles.startScanButton, { backgroundColor: theme.colors.primary }]}
              onPress={startScan}
            >
              <Text style={styles.startScanText}>
                {ENABLE_DEBUG_MODE ? '🧪 Симулирай сканиране' : 'Започни сканиране'}
              </Text>
            </TouchableOpacity>
            
            {ENABLE_DEBUG_MODE && (
              <View style={[styles.debugBadge, { backgroundColor: 'rgba(255, 165, 0, 0.2)', borderColor: 'orange' }]}>
                <Text style={[styles.debugBadgeText, { color: 'orange' }]}>
                  ⚠️ Debug Mode: За реално тестване използвай физическо устройство
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  scanInstructions: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  cancelScanButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
  },
  cancelScanText: {
    color: 'white',
    fontWeight: 'bold',
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  processingText: {
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
  resultContainer: {
    flex: 1,
    padding: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  storeContainer: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 14,
    marginTop: 4,
  },
  fiscalNumber: {
    fontSize: 12,
    marginTop: 4,
  },
  itemsContainer: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  itemName: {
    flex: 1,
    fontSize: 15,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    elevation: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  startScanButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  startScanText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  permissionText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  permissionSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight || 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '300',
    color: '#F7E7CE',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(247, 231, 206, 0.7)',
    fontWeight: '400',
  },
  contentContainer: {
    flex: 1,
  },
  
  // Error стилове
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  timeoutWarning: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.8)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 10,
  },
  debugBadge: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: '90%',
  },
  debugBadgeText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default ScannerScreen; 