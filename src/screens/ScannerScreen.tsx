import React, { useState, useRef, useEffect, useCallback, Component, ErrorInfo, ReactNode } from 'react';
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
  Linking,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Camera, CameraType } from 'react-native-camera-kit';
import LinearGradient from 'react-native-linear-gradient';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

// Тематичен контекст и транзакции
import { useTheme } from '../utils/ThemeContext';
import { useTransactions } from '../utils/TransactionContext';
import { SCREENS, EXPENSE_CATEGORIES } from '../utils/constants';

// Error Boundary за Camera компонента
interface CameraErrorBoundaryProps {
  children: ReactNode;
  onError: () => void;
  fallback: ReactNode;
}

interface CameraErrorBoundaryState {
  hasError: boolean;
}

class CameraErrorBoundary extends Component<CameraErrorBoundaryProps, CameraErrorBoundaryState> {
  constructor(props: CameraErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): CameraErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('📷 CameraErrorBoundary caught error:', error, errorInfo);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

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

// Детекция на симулатор - ОПРОСТЕНА ВЕРСИЯ
// На iOS реално устройство Platform.constants.isSimulator е undefined или false
// На симулатор е true
const IS_SIMULATOR = (() => {
  try {
    if (Platform.OS === 'ios') {
      // @ts-ignore
      return Platform.constants?.isSimulator === true;
    }
    if (Platform.OS === 'android') {
      // @ts-ignore
      const brand = Platform.constants?.Brand || '';
      // @ts-ignore  
      const model = Platform.constants?.Model || '';
      return brand === 'google' || brand === 'generic' || model.includes('sdk');
    }
  } catch (e) {
    console.error('Error detecting simulator:', e);
  }
  return false;
})();

// Production ready - no debug logs in UI

const ScannerScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { addTransaction } = useTransactions();
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanTimeout, setScanTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [cameraFailed, setCameraFailed] = useState(false); // Runtime детекция - камерата не работи
  const [cameraInitializing, setCameraInitializing] = useState(false); // Камерата се инициализира
  const [cameraKey, setCameraKey] = useState(0); // За force remount на камерата
  const [isLocked, setIsLocked] = useState(true); // QR Scanner е заключен временно
  const cameraRef = useRef<any>(null);
  const cameraInitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockedOpacity = useRef(new Animated.Value(0)).current; // Анимация за locked overlay

  // Проверка за разрешения за камера
  useEffect(() => {
    requestCameraPermission();
  }, []);

  // Анимация на locked overlay
  useEffect(() => {
    if (isLocked) {
      // Ако е заключен, затваряме камерата ако е отворена
      if (isScanning) {
        setIsScanning(false);
      }
      Animated.timing(lockedOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(lockedOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isLocked]);

  // Back button handling - само за Android
  useEffect(() => {
    const backAction = () => {
      console.log('📷 Back button pressed - isScanning:', isScanning);
      if (isScanning) {
        setIsScanning(false);
        return true; // Prevent default back action
      }
      return false; // Allow default back action
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => {
      backHandler.remove();
    };
  }, [isScanning]);

  // Cleanup само при unmount на компонента
  useEffect(() => {
    return () => {
      console.log('📷 Component unmounting - cleaning up');
      // Clear timeout при unmount
      if (scanTimeout) {
        clearTimeout(scanTimeout);
      }
      // Clear camera init timeout
      if (cameraInitTimeoutRef.current) {
        clearTimeout(cameraInitTimeoutRef.current);
      }
    };
  }, []);

  // Log when camera scanning state changes
  useEffect(() => {
    if (isScanning) {
      console.log('📷 Camera scanning state changed to TRUE');
      console.log('📷 Camera ref:', cameraRef.current ? 'EXISTS' : 'NULL');
      
      // After 3 seconds, if still initializing, try to force camera ready
      const forceReadyTimeout = setTimeout(() => {
        if (cameraInitializing) {
          console.log('⚠️ Forcing camera ready state after 3 seconds');
          setCameraInitializing(false);
        }
      }, 3000);
      
      return () => clearTimeout(forceReadyTimeout);
    }
    return undefined;
  }, [isScanning, cameraInitializing]);

  const requestCameraPermission = useCallback(async () => {
    try {
      setError(null);
      console.log('📷 ========================================');
      console.log('📷 Requesting camera permission...');
      console.log('📷 Platform:', Platform.OS);
      console.log('📷 Platform Version:', Platform.Version);
      
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.CAMERA 
        : PERMISSIONS.ANDROID.CAMERA;
      
      console.log('📷 Permission constant:', permission);
      
      // Първо проверяваме текущия статус
      const checkResult = await check(permission);
      console.log('📷 Permission check result:', checkResult);
      console.log('📷 RESULTS.GRANTED:', RESULTS.GRANTED);
      console.log('📷 RESULTS.DENIED:', RESULTS.DENIED);
      console.log('📷 RESULTS.BLOCKED:', RESULTS.BLOCKED);
      console.log('📷 RESULTS.UNAVAILABLE:', RESULTS.UNAVAILABLE);
      
      if (checkResult === RESULTS.GRANTED) {
        console.log('✅ Permission already granted');
        setHasPermission(true);
        return;
      }
      
      if (checkResult === RESULTS.DENIED) {
        // Можем да поискаме разрешение
        console.log('⚠️ Permission denied, requesting...');
        const requestResult = await request(permission);
        console.log('📷 Permission request result:', requestResult);
        
        if (requestResult === RESULTS.GRANTED) {
          console.log('✅ Permission granted after request');
          setHasPermission(true);
        } else {
          console.log('❌ Permission not granted:', requestResult);
          setHasPermission(false);
          setError('Достъпът до камерата е необходим за сканиране на QR кодове');
        }
        return;
      }
      
      if (checkResult === RESULTS.BLOCKED) {
        // Потребителят е блокирал разрешението - трябва да отиде в настройките
        console.log('🚫 Permission blocked, need to open settings');
        setHasPermission(false);
        Alert.alert(
          'Разрешение за камера',
          'Достъпът до камерата е блокиран. Моля, отворете настройките на приложението и разрешете достъп до камерата.',
          [
            { text: 'Отвори настройки', onPress: () => Linking.openSettings() },
            { text: 'Отказ', style: 'cancel' },
          ]
        );
        return;
      }
      
      if (checkResult === RESULTS.UNAVAILABLE) {
        console.log('❌ Camera unavailable on this device');
        setHasPermission(false);
        setError('Камерата не е налична на това устройство');
        return;
      }
      
      // За всички други случаи
      console.log('⚠️ Unknown permission result:', checkResult);
      setHasPermission(false);
      
    } catch (err) {
      console.error('❌ Error requesting camera permission:', err);
      setError('Възникна грешка при заявката за достъп до камерата');
      setHasPermission(false);
    } finally {
      console.log('📷 ========================================');
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

  // Функция за директно симулиране (без камера)
  const startSimulation = useCallback(() => {
    console.log('🧪 Starting simulation directly');
    setScanResult(null);
    setError(null);
    setIsScanning(false);
    setIsProcessing(true);
    
    Alert.alert(
      '🧪 Симулация',
      'Ще симулирам сканиране на тестова бележка след 2 секунди.',
      [{ text: 'OK' }]
    );
    simulateScan();
  }, [simulateScan]);

  // Рестартиране на сканирането с timeout
  const startScan = useCallback(() => {
    try {
      console.log('📷 ========================================');
      console.log('📷 startScan called');
      console.log('📷 hasPermission:', hasPermission);
      console.log('📷 cameraFailed:', cameraFailed);
      console.log('📷 IS_SIMULATOR:', IS_SIMULATOR);
      console.log('📷 isLocked:', isLocked);
      
      // Ако е заключен, не позволяваме сканиране
      if (isLocked) {
        console.log('🔒 Scanner is locked - showing locked message');
        Alert.alert(
          '🔒 Функцията е временно недостъпна',
          'QR сканерът скоро ще бъде достъпен. Очаквайте скоро!',
          [{ text: 'OK' }]
        );
        return;
      }
      
      setScanResult(null);
      setError(null);
      
      // Проверка дали имаме permission
      if (hasPermission === false) {
        console.log('❌ No camera permission, requesting...');
        requestCameraPermission();
        return;
      }
      
      // Ако камерата вече е паднала преди (на симулатор), използваме симулация
      if (cameraFailed) {
        console.log('🧪 Camera previously failed - using simulation');
        startSimulation();
        return;
      }
      
      // САМО на СИМУЛАТОР използваме симулация
      // IS_SIMULATOR е true само на симулатор, не на реално устройство
      if (IS_SIMULATOR) {
        console.log('🧪 SIMULATOR detected - using simulation');
        startSimulation();
        return;
      }
      
      // На РЕАЛНО УСТРОЙСТВО - винаги отваряме камерата
      console.log('📱 QR Scanner: Opening camera on real device...');
      console.log('📱 Setting isScanning to true...');
      
      // Веднага показваме камерата - БЕЗ loading state първоначално
      setIsScanning(true);
      
      // След 2 секунди показваме loading ако все още не е готова
      setTimeout(() => {
        if (isScanning && !scanResult) {
          console.log('📷 Camera still loading after 2 seconds...');
          setCameraInitializing(true);
        }
      }, 2000);
      
      // Timeout за camera initialization (5 секунди за iOS - по-кратко)
      cameraInitTimeoutRef.current = setTimeout(() => {
        console.log('⚠️ Camera initialization timeout - trying to remount camera');
        setCameraInitializing(false);
        
        // При черен екран, опитваме да remount-нем камерата
        if (cameraKey < 2) {
          console.log('🔄 Attempting camera remount, attempt:', cameraKey + 1);
          setCameraKey(prev => prev + 1);
        } else {
          // След 2 неуспешни опита, показваме грешка
          Alert.alert(
            'Камерата се зарежда бавно',
            'Камерата не може да се инициализира. Искате ли да опитате отново?',
            [
              {
                text: 'Опитай отново',
                onPress: () => {
                  setIsScanning(false);
                  setCameraFailed(false);
                  setCameraKey(0);
                  setTimeout(() => startScan(), 500);
                }
              },
              {
                text: 'Въведи ръчно',
                onPress: () => {
                  setIsScanning(false);
                  navigation.navigate(SCREENS.ADD_TRANSACTION);
                }
              },
              {
                text: 'Изчакай още',
                style: 'cancel',
                onPress: () => {
                  console.log('⏳ User chose to wait more...');
                }
              }
            ]
          );
        }
      }, 5000);
      
      // Set timeout for scanning (30 seconds)
      const timeout = setTimeout(() => {
        console.log('⏰ Scan timeout reached');
        setIsScanning(false);
        setCameraInitializing(false);
        setError('Времето за сканиране изтече');
        Alert.alert(
          'Timeout',
          'Времето за сканиране изтече. Моля, опитайте отново.',
          [{ text: 'OK' }]
        );
      }, 30000);
      
      setScanTimeout(timeout);
      
      console.log('✅ Camera should be opening now...');
      console.log('📷 ========================================');
    } catch (error) {
      console.error('❌ Error in startScan:', error);
      setError('Възникна грешка при стартиране на сканирането');
    }
  }, [simulateScan, cameraFailed, startSimulation, hasPermission, requestCameraPermission]);

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
        `Транзакцията беше добавена успешно от сканираната бележка.\n\nСума: ${parsedData.total?.toFixed(2)} €\nКатегория: ${categoryName}`,
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
                {item.price.toFixed(2)} €
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Общо:</Text>
            <Text style={[styles.totalPrice, { color: theme.colors.primary }]}>
              {parsedData.total?.toFixed(2) || '0.00'} €
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

  // Handler за грешки от камерата
  const handleCameraError = useCallback((error: any) => {
    console.error('❌ ========================================');
    console.error('❌ Camera error occurred!');
    console.error('❌ Error object:', JSON.stringify(error, null, 2));
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error.message:', error?.message);
    console.error('❌ Error.nativeEvent:', error?.nativeEvent);
    console.error('❌ ========================================');
    
    const errorMessage = error?.nativeEvent?.errorMessage || error?.message || 'Неизвестна грешка';
    
    // Маркираме, че камерата не работи (вероятно симулатор)
    setCameraFailed(true);
    setIsScanning(false);
    setCameraInitializing(false);
    
    // Clear camera init timeout
    if (cameraInitTimeoutRef.current) {
      clearTimeout(cameraInitTimeoutRef.current);
      cameraInitTimeoutRef.current = null;
    }
    
    // Ако сме в dev mode, предлагаме симулация
    if (__DEV__) {
      Alert.alert(
        '📷 Камерата не е налична',
        `Грешка: ${errorMessage}\n\nИзглежда използвате симулатор или камерата не работи.\n\nИскате ли да симулирате сканиране на тестова касова бележка?`,
        [
          { 
            text: 'Да, симулирай', 
            onPress: () => {
              console.log('🧪 Switching to debug mode due to camera failure');
              setIsProcessing(true);
              simulateScan();
            }
          },
          { 
            text: 'Въведи ръчно', 
            onPress: () => {
              navigation.navigate(SCREENS.ADD_TRANSACTION);
            }
          },
          { 
            text: 'Отказ', 
            style: 'cancel'
          },
        ]
      );
    } else {
      // В production показваме стандартно съобщение
      Alert.alert(
        'Грешка с камерата',
        `${errorMessage}\n\nМоля, проверете дали приложението има достъп до камерата в настройките на устройството.`,
        [
          { 
            text: 'Опитай отново', 
            onPress: () => {
              setError(null);
              setCameraFailed(false);
              setTimeout(() => startScan(), 500);
            }
          },
          { 
            text: 'Въведи ръчно', 
            onPress: () => {
              navigation.navigate(SCREENS.ADD_TRANSACTION);
            }
          },
          { 
            text: 'Отказ', 
            style: 'cancel'
          },
        ]
      );
    }
  }, [navigation, startScan, simulateScan]);

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
  const renderScanningScreen = () => {
    console.log('📷 renderScanningScreen called - isScanning:', isScanning, 'cameraFailed:', cameraFailed);
    
    // Ако вече знаем, че камерата не работи, не я рендерираме
    if (cameraFailed) {
      console.log('📷 Camera previously failed, not rendering');
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.welcomeTitle, { color: theme.colors.text }]}>
            Камерата не е налична
          </Text>
          <Text style={[styles.welcomeText, { color: theme.colors.textSecondary }]}>
            Моля, въведете данните ръчно или опитайте отново по-късно.
          </Text>
          <TouchableOpacity
            style={[styles.startScanButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              setIsScanning(false);
              navigation.navigate(SCREENS.ADD_TRANSACTION);
            }}
          >
            <Text style={styles.startScanText}>Въведи ръчно</Text>
          </TouchableOpacity>
        </View>
      );
    }

    console.log('📷 About to render Camera component');
    console.log('📷 hasPermission:', hasPermission);
    console.log('📷 cameraKey:', cameraKey);
    
    // Получаваме размерите на екрана за explicit sizing (fix за черен екран)
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    console.log('📷 Screen dimensions:', screenWidth, 'x', screenHeight);
    
    return (
      <View style={{ flex: 1, backgroundColor: '#000', width: screenWidth, height: screenHeight }}>
        <Camera
          key={`camera-${cameraKey}`}
          ref={cameraRef}
          style={{ 
            flex: 1,
            width: screenWidth,
            height: screenHeight,
          }}
          cameraType={CameraType.Back}
          scanBarcode={true}
          showFrame={true}
          laserColor="rgba(0, 180, 219, 0.8)"
          frameColor="rgba(0, 180, 219, 0.8)"
          onReadCode={(event: any) => {
            console.log('✅ QR Code detected!', event);
            console.log('✅ QR Data:', event?.nativeEvent?.codeStringValue);
            // Clear camera init timeout
            if (cameraInitTimeoutRef.current) {
              clearTimeout(cameraInitTimeoutRef.current);
              cameraInitTimeoutRef.current = null;
            }
            setCameraInitializing(false);
            handleQRCodeScanned(event);
          }}
          onError={(error: any) => {
            console.error('❌ Camera error:', error);
            handleCameraError(error);
          }}
        />
        
        {/* Loading overlay when camera is initializing */}
        {cameraInitializing && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 50,
            pointerEvents: 'none',
          }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ color: '#FFF', marginTop: 16, fontSize: 16, textAlign: 'center', paddingHorizontal: 20 }}>
              Зареждане на камерата...{'\n'}
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                Ако камерата не се зареди, натиснете Отказ и опитайте отново
              </Text>
            </Text>
          </View>
        )}
        
        {/* Минимален overlay за инструкции - НЕ блокира камерата */}
        {!cameraInitializing && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            pointerEvents: 'none',
          }}>
            <View style={{
              width: 250,
              height: 250,
              borderWidth: 2,
              borderColor: 'rgba(0, 180, 219, 0.8)',
              borderRadius: 10,
              backgroundColor: 'transparent',
            }} />
            <Text style={{
              color: '#FFFFFF',
              fontSize: 16,
              textAlign: 'center',
              backgroundColor: 'rgba(0,0,0,0.6)',
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 8,
              marginTop: 20,
            }}>
              Насочете камерата към QR кода
            </Text>
          </View>
        )}
        
        {/* Overlay бутон за отказ */}
        <TouchableOpacity 
          style={{
            position: 'absolute',
            bottom: 50,
            alignSelf: 'center',
            backgroundColor: theme.colors.error,
            paddingHorizontal: 30,
            paddingVertical: 15,
            borderRadius: 25,
            zIndex: 100,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
          }}
          onPress={() => {
            console.log('📷 Cancel button pressed');
            setIsScanning(false);
            setCameraInitializing(false);
            if (scanTimeout) {
              clearTimeout(scanTimeout);
              setScanTimeout(null);
            }
            if (cameraInitTimeoutRef.current) {
              clearTimeout(cameraInitTimeoutRef.current);
              cameraInitTimeoutRef.current = null;
            }
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Отказ</Text>
        </TouchableOpacity>
      </View>
    );
  };

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
                    QR Сканер
                  </Text>
                  <Text style={styles.headerSubtitle}>
                    Сканиране на касови бележки
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
        ) : isScanning && !isLocked ? (
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
            {/* Замъглен overlay когато е заключен */}
            {isLocked && (
              <Animated.View style={[styles.lockedOverlay, { opacity: lockedOpacity }]}>
                <View style={styles.lockedContent}>
                  <Text style={styles.lockedIcon}>🔒</Text>
                  <Text style={styles.lockedTitle}>Очаквайте скоро...</Text>
                  <Text style={styles.lockedSubtitle}>
                    QR сканерът скоро ще бъде достъпен
                  </Text>
                </View>
              </Animated.View>
            )}
            
            <Text style={[styles.welcomeTitle, { color: theme.colors.text, opacity: isLocked ? 0.3 : 1 }]}>
              QR Сканер за касови бележки
            </Text>
            <Text style={[styles.welcomeText, { color: theme.colors.textSecondary, opacity: isLocked ? 0.3 : 1 }]}>
              Сканирайте QR кода на вашата касова бележка за автоматично добавяне на транзакция
            </Text>
            <TouchableOpacity
              style={[
                styles.startScanButton, 
                { 
                  backgroundColor: isLocked ? theme.colors.textSecondary : theme.colors.primary,
                  opacity: isLocked ? 0.5 : 1 
                }
              ]}
              onPress={startScan}
              disabled={isLocked}
            >
              <Text style={styles.startScanText}>
                {isLocked ? '🔒 Заключено' : '📷 Започни сканиране'}
              </Text>
            </TouchableOpacity>
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
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
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
  
  // Locked overlay стилове
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  lockedContent: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  lockedIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  lockedSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ScannerScreen; 