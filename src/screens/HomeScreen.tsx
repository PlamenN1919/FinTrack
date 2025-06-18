import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import LinearGradient from 'react-native-linear-gradient';

// Анимирани UI компоненти
import SimpleAnimatedCard from '../components/ui/SimpleAnimatedCard';
import PremiumButton from '../components/ui/PremiumButton';
import AnimatedStats from '../components/ui/AnimatedStats';
import FloatingActionButton from '../components/ui/FloatingActionButton';

// Тематичен контекст
import { useTheme } from '../utils/ThemeContext';
import { useTransactions } from '../utils/TransactionContext';
import { useUser } from '../utils/UserContext';
import { SCREENS } from '../utils/constants';

// Гамификация компоненти и данни
import LevelProgressBar from '../components/gamification/LevelProgressBar';
import AchievementCard from '../components/gamification/AchievementCard';
import MissionCard from '../components/gamification/MissionCard';
import GamificationOverlay from '../components/gamification/GamificationOverlay';
import gamificationService from '../services/GamificationService';

// Примерни данни за демонстрация (ще бъдат заменени с реални данни)
const mockInitialBalance = 2450.75;

// Функция за изчисляване на финансово здраве с error handling
const calculateFinancialHealth = (transactions: any[], monthlyIncome: number, monthlyExpense: number, currentBalance: number) => {
  try {
    // Валидация на входните данни
    if (!Array.isArray(transactions)) {
      console.warn('calculateFinancialHealth: transactions не е масив');
      return 0;
    }
    
    const safeMonthlyIncome = typeof monthlyIncome === 'number' && !isNaN(monthlyIncome) ? monthlyIncome : 0;
    const safeMonthlyExpense = typeof monthlyExpense === 'number' && !isNaN(monthlyExpense) ? monthlyExpense : 0;
    const safeCurrentBalance = typeof currentBalance === 'number' && !isNaN(currentBalance) ? currentBalance : 0;
    
    let score = 50; // Базов резултат
    
    // Фактор 1: Съотношение приходи/разходи (30 точки)
    if (safeMonthlyIncome > 0) {
      const ratio = safeMonthlyExpense / safeMonthlyIncome;
      if (ratio < 0.5) score += 30;
      else if (ratio < 0.7) score += 20;
      else if (ratio < 0.9) score += 10;
      else score -= 10;
    } else if (safeMonthlyExpense > 0) {
      // Ако няма приходи, но има разходи - намаляваме резултата
      score -= 20;
    }
    
    // Фактор 2: Последователност в транзакциите (20 точки)
    const recentDays = 7;
    const recentTransactions = transactions.filter(t => {
      try {
        if (!t || !t.date) return false;
        const daysDiff = (new Date().getTime() - new Date(t.date).getTime()) / (1000 * 3600 * 24);
        return daysDiff <= recentDays && daysDiff >= 0;
      } catch (error) {
        console.warn('Грешка при филтриране на транзакции по дата:', error);
        return false;
      }
    });
    if (recentTransactions.length >= 3) score += 20;
    else if (recentTransactions.length >= 1) score += 10;
    
    // Фактор 3: Текущ баланс (20 точки)
    if (safeCurrentBalance > 2000) score += 20;
    else if (safeCurrentBalance > 1000) score += 15;
    else if (safeCurrentBalance > 0) score += 10;
    else if (safeCurrentBalance > -500) score -= 10;
    else score -= 20;
    
    return Math.max(0, Math.min(100, score));
  } catch (error) {
    console.error('Грешка при изчисляване на финансово здраве:', error);
    return 0;
  }
};

// Функция за генериране на данни за графика с error handling
const generateChartData = (transactions: any[]) => {
  try {
    if (!Array.isArray(transactions)) {
      console.warn('generateChartData: transactions не е масив');
      return {
        labels: ['Ян', 'Фев', 'Мар', 'Апр', 'Май', 'Юни'],
        datasets: [{ data: [0, 0, 0, 0, 0, 0], color: (opacity = 1) => `rgba(212, 175, 55, ${opacity})`, strokeWidth: 2 }],
      };
    }

    const months = ['Ян', 'Фев', 'Мар', 'Апр', 'Май', 'Юни'];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    const monthlyData = months.map((_, index) => {
      try {
        const monthTransactions = transactions.filter(transaction => {
          try {
            if (!transaction || !transaction.date) return false;
            const transactionDate = new Date(transaction.date);
            return !isNaN(transactionDate.getTime()) &&
                   transactionDate.getMonth() === index && 
                   transactionDate.getFullYear() === currentYear;
          } catch (error) {
            console.warn('Грешка при филтриране на транзакция по месец:', error);
            return false;
          }
        });
        
        return monthTransactions
          .filter(t => t && typeof t.amount === 'number' && t.amount > 0)
          .reduce((sum, t) => sum + (t.amount || 0), 0);
      } catch (error) {
        console.warn(`Грешка при обработка на месец ${index}:`, error);
        return 0;
      }
    });
    
    return {
      labels: months,
      datasets: [
        {
          data: monthlyData.length > 0 ? monthlyData : [0, 0, 0, 0, 0, 0],
          color: (opacity = 1) => `rgba(212, 175, 55, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  } catch (error) {
    console.error('Грешка при генериране на данни за графика:', error);
    return {
      labels: ['Ян', 'Фев', 'Мар', 'Апр', 'Май', 'Юни'],
      datasets: [{ data: [0, 0, 0, 0, 0, 0], color: (opacity = 1) => `rgba(212, 175, 55, ${opacity})`, strokeWidth: 2 }],
    };
  }
};

// Функция за получаване на емоция икона с error handling
const getEmotionIcon = (emotion: string) => {
  try {
    if (!emotion || typeof emotion !== 'string') return '😐';
    
    switch (emotion.toLowerCase()) {
      case 'happy': return '😊';
      case 'stressed': return '😰';
      case 'sad': return '😢';
      case 'angry': return '😠';
      case 'excited': return '🤩';
      default: return '😐';
    }
  } catch (error) {
    console.warn('Грешка при получаване на емоция икона:', error);
    return '😐';
  }
};

// Функция за получаване на категория цвят с error handling
const getCategoryColor = (category: string, amount: number) => {
  try {
    if (typeof amount === 'number' && amount > 0) return '#4CAF50';
    
    const categoryColors: { [key: string]: string } = {
      'Храна': '#FF9800',
      'Транспорт': '#2196F3',
      'Забавления': '#9C27B0',
      'Битови': '#607D8B',
      'Здраве': '#F44336',
      'Образование': '#3F51B5',
      'Дрехи': '#E91E63',
      'Подарък': '#FF5722',
    };
    
    return categoryColors[category] || '#757575';
  } catch (error) {
    console.warn('Грешка при получаване на цвят за категория:', error);
    return '#757575';
  }
};

const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { transactions } = useTransactions();
  const { userData } = useUser();

  // Анимация за кръга
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Loading и error състояния
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Функция за генериране на инициали от името
  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2); // Вземаме максимум 2 инициала
  };
  
  // Изчисляване на реални данни от транзакциите с error handling и мемоизация
  const monthlyStats = useMemo(() => {
    try {
      setError(null);
      
      if (!transactions || !Array.isArray(transactions)) {
        return { monthlyIncome: 0, monthlyExpense: 0, currentMonthTransactions: [] };
      }

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      // Филтриране на транзакции за текущия месец
      const currentMonthTransactions = transactions.filter(transaction => {
        try {
          if (!transaction || !transaction.date) return false;
          const transactionDate = new Date(transaction.date);
          return !isNaN(transactionDate.getTime()) &&
                 transactionDate.getMonth() === currentMonth && 
                 transactionDate.getFullYear() === currentYear;
        } catch (error) {
          console.warn('Грешка при филтриране на транзакция:', error);
          return false;
        }
      });
      
      // Изчисляване на месечни приходи и разходи
      const monthlyIncome = currentMonthTransactions
        .filter(t => t && typeof t.amount === 'number' && t.amount > 0)
        .reduce((sum, t) => sum + (t.amount || 0), 0);
        
      const monthlyExpense = Math.abs(currentMonthTransactions
        .filter(t => t && typeof t.amount === 'number' && t.amount < 0)
        .reduce((sum, t) => sum + (t.amount || 0), 0));

      return { monthlyIncome, monthlyExpense, currentMonthTransactions };
    } catch (error) {
      console.error('Грешка при изчисляване на месечни статистики:', error);
      setError('Грешка при зареждане на статистиките');
      return { monthlyIncome: 0, monthlyExpense: 0, currentMonthTransactions: [] };
    }
  }, [transactions]);

  const { monthlyIncome, monthlyExpense, currentMonthTransactions } = monthlyStats;
  
  // Изчисляване на текущ баланс (начален баланс + всички транзакции) с error handling
  const balanceData = useMemo(() => {
    try {
      if (!transactions || !Array.isArray(transactions)) {
        return { balance: mockInitialBalance, totalTransactionAmount: 0 };
      }

      const totalTransactionAmount = transactions
        .filter(t => t && typeof t.amount === 'number')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const balance = mockInitialBalance + totalTransactionAmount;

      return { balance, totalTransactionAmount };
    } catch (error) {
      console.error('Грешка при изчисляване на баланс:', error);
      return { balance: mockInitialBalance, totalTransactionAmount: 0 };
    }
  }, [transactions]);

  const { balance, totalTransactionAmount } = balanceData;
  
  // Изчисляване на данни за предишния месец за сравнение с error handling
  const previousMonthData = useMemo(() => {
    try {
      if (!transactions || !Array.isArray(transactions)) {
        return { previousMonthIncome: 0, previousMonthExpense: 0, previousMonthTransactions: [] };
      }

      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const previousMonth = currentDate.getMonth() - 1;
      const previousYear = previousMonth < 0 ? currentYear - 1 : currentYear;
      const adjustedPreviousMonth = previousMonth < 0 ? 11 : previousMonth;

      const previousMonthTransactions = transactions.filter(transaction => {
        try {
          if (!transaction || !transaction.date) return false;
          const transactionDate = new Date(transaction.date);
          return !isNaN(transactionDate.getTime()) &&
                 transactionDate.getMonth() === adjustedPreviousMonth && 
                 transactionDate.getFullYear() === previousYear;
        } catch (error) {
          console.warn('Грешка при филтриране на предишен месец:', error);
          return false;
        }
      });

      const previousMonthIncome = previousMonthTransactions
        .filter(t => t && typeof t.amount === 'number' && t.amount > 0)
        .reduce((sum, t) => sum + (t.amount || 0), 0);
        
      const previousMonthExpense = Math.abs(previousMonthTransactions
        .filter(t => t && typeof t.amount === 'number' && t.amount < 0)
        .reduce((sum, t) => sum + (t.amount || 0), 0));

      return { previousMonthIncome, previousMonthExpense, previousMonthTransactions };
    } catch (error) {
      console.error('Грешка при изчисляване на данни за предишен месец:', error);
      return { previousMonthIncome: 0, previousMonthExpense: 0, previousMonthTransactions: [] };
    }
  }, [transactions]);

  const { previousMonthIncome, previousMonthExpense, previousMonthTransactions } = previousMonthData;

  // Изчисляване на реални проценти за промяна с error handling
  const calculatePercentageChange = useCallback((current: number, previous: number) => {
    try {
      const safeCurrent = typeof current === 'number' && !isNaN(current) ? current : 0;
      const safePrevious = typeof previous === 'number' && !isNaN(previous) ? previous : 0;
      
      if (safePrevious === 0) return safeCurrent > 0 ? 100 : 0;
      return Math.round(((safeCurrent - safePrevious) / safePrevious) * 100);
    } catch (error) {
      console.warn('Грешка при изчисляване на процентна промяна:', error);
      return 0;
    }
  }, []);

  // Мемоизирани изчисления за промени и данни
  const calculatedData = useMemo(() => {
    try {
      const incomeChange = calculatePercentageChange(monthlyIncome, previousMonthIncome);
      const expenseChange = calculatePercentageChange(monthlyExpense, previousMonthExpense);
      
      // За баланса изчисляваме промяната на общия баланс
      const previousTotalTransactionAmount = previousMonthTransactions
        .filter(t => t && typeof t.amount === 'number')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const previousBalance = mockInitialBalance + previousTotalTransactionAmount;
      const balanceChange = calculatePercentageChange(balance, previousBalance);
      
      // Последни 3 транзакции за показване
      const recentTransactions = transactions
        .filter(t => t && t.date)
        .sort((a, b) => {
          try {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          } catch (error) {
            console.warn('Грешка при сортиране на транзакции:', error);
            return 0;
          }
        })
        .slice(0, 3);
        
      // Генериране на данни за графика
      const chartData = generateChartData(transactions);
      
      // Изчисляване на финансово здраве
      const financialHealthScore = calculateFinancialHealth(transactions, monthlyIncome, monthlyExpense, balance);

      return {
        incomeChange,
        expenseChange,
        balanceChange,
        recentTransactions,
        chartData,
        financialHealthScore,
      };
    } catch (error) {
      console.error('Грешка при изчисляване на данни:', error);
      setError('Грешка при обработка на данните');
      return {
        incomeChange: 0,
        expenseChange: 0,
        balanceChange: 0,
        recentTransactions: [],
        chartData: generateChartData([]),
        financialHealthScore: 0,
      };
    }
  }, [
    monthlyIncome,
    monthlyExpense,
    previousMonthIncome,
    previousMonthExpense,
    previousMonthTransactions,
    balance,
    transactions,
    calculatePercentageChange,
  ]);

  const {
    incomeChange,
    expenseChange,
    balanceChange,
    recentTransactions,
    chartData,
    financialHealthScore,
  } = calculatedData;
  
  // Интеграция с гамификация за финансово здраве
  useEffect(() => {
    if (financialHealthScore > 0) {
      gamificationService.onFinancialHealthUpdated(financialHealthScore, {
        monthlyIncome,
        monthlyExpense,
        balance,
        ratio: monthlyIncome > 0 ? (monthlyExpense / monthlyIncome) : 0,
        savingsRate: monthlyIncome > 0 ? ((monthlyIncome - monthlyExpense) / monthlyIncome) : 0
      });
    }
  }, [financialHealthScore, monthlyIncome, monthlyExpense, balance]);
  
  // Получаване на данни за гамификация с автоматично обновяване
  const [gamificationProfile, setGamificationProfile] = useState(gamificationService.getProfile());
  const [notifications, setNotifications] = useState<React.ReactNode[]>([]);

  // Автоматично обновяване на гамификационния профил
  useEffect(() => {
    console.log('🔄 HomeScreen: Setting up gamification listeners');
    
    const handleGamificationUpdate = (updatedProfile: any) => {
      console.log('📱 HomeScreen: Gamification profile updated', {
        level: updatedProfile.level,
        xp: updatedProfile.xp,
        streakDays: updatedProfile.streakDays,
      });
      setGamificationProfile(updatedProfile);
    };

    // Слушаме за промени в гамификационния профил
    gamificationService.onProfileUpdated(handleGamificationUpdate);
    gamificationService.onInitialized(handleGamificationUpdate);

    // Проверяваме дали има готов профил
    if (gamificationService.isReady()) {
      const currentProfile = gamificationService.getProfile();
      console.log('✅ HomeScreen: Initial gamification profile loaded', currentProfile);
      setGamificationProfile(currentProfile);
    }

    // Cleanup при unmount
    return () => {
      console.log('🧹 HomeScreen: Cleaning up gamification listeners');
      gamificationService.offProfileUpdated(handleGamificationUpdate);
    };
  }, []);

  // Показва здравен статус въз основа на резултата
  const getHealthStatus = (score: number) => {
    if (score >= 80) return { status: 'Отлично', color: theme.colors.success };
    if (score >= 60) return { status: 'Добро', color: '#3CB371' };
    if (score >= 40) return { status: 'Средно', color: theme.colors.warning };
    if (score >= 20) return { status: 'Лошо', color: '#DAA520' };
    return { status: 'Критично', color: theme.colors.error };
  };

  // Генериране на персонализирани съвети за финансово здраве
  const getHealthAdvice = () => {
    const ratio = monthlyIncome > 0 ? (monthlyExpense / monthlyIncome) : 0;
    
    if (monthlyIncome === 0 && monthlyExpense > 0) {
      return 'Добавете приходи за подобряване на финансовото здраве';
    } else if (ratio > 0.9) {
      return 'Намалете разходите - те са над 90% от приходите';
    } else if (ratio > 0.7) {
      return 'Подобрете спестяванията - разходите са високи';
    } else if (balance < 0) {
      return 'Балансът е отрицателен - фокусирайте се върху приходите';
    } else if (balance < 1000) {
      return 'Увеличете спестяванията за по-добра финансова сигурност';
    } else {
      return 'Отлично управление! Продължавайте в същия дух';
    }
  };

  const healthStatus = getHealthStatus(financialHealthScore);
  const healthAdvice = getHealthAdvice();

  // Анимация за появяване на кръга
  useEffect(() => {
    // Fade-in анимация при зареждане
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      delay: 300,
      useNativeDriver: true,
    }).start();

    // Pulse анимация
    const startPulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Повтаряме анимацията на всеки 3 секунди
        setTimeout(startPulse, 3000);
      });
    };

    // Започваме pulse анимацията след 1 секунда
    const pulseTimeout = setTimeout(startPulse, 1000);

    return () => clearTimeout(pulseTimeout);
  }, [scaleAnim, pulseAnim]);

  // Статистики за премиум компонента
  const statsData = [
    {
      label: 'Баланс',
      value: `${balance.toFixed(2)} лв.`,
      change: Math.abs(balanceChange),
      changeType: balanceChange > 0 ? 'positive' as const : 'negative' as const,
      color: theme.colors.primary,
    },
    {
      label: 'Приходи',
      value: `${monthlyIncome.toFixed(2)} лв.`,
      change: Math.abs(incomeChange),
      changeType: incomeChange > 0 ? 'positive' as const : 'negative' as const,
      color: theme.colors.success,
    },
    {
      label: 'Разходи',
      value: `${monthlyExpense.toFixed(2)} лв.`,
      change: Math.abs(expenseChange),
      changeType: expenseChange > 0 ? 'negative' as const : 'positive' as const,
      color: theme.colors.error,
    },
  ];

  // Debug информация за финансово здраве
  useEffect(() => {
    const ratio = monthlyIncome > 0 ? (monthlyExpense / monthlyIncome) : 0;
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpense) / monthlyIncome) : 0;
    
    console.log('Финансово здраве - Debug:', {
      score: financialHealthScore,
      monthlyIncome: monthlyIncome.toFixed(2),
      monthlyExpense: monthlyExpense.toFixed(2),
      currentBalance: balance.toFixed(2),
      expenseRatio: (ratio * 100).toFixed(1) + '%',
      savingsRate: (savingsRate * 100).toFixed(1) + '%',
      status: healthStatus.status,
      advice: healthAdvice
    });
  }, [financialHealthScore, monthlyIncome, monthlyExpense, balance, healthStatus, healthAdvice]);

  // Обновяване на статистиките при промяна на транзакциите
  useEffect(() => {
    console.log('HomeScreen статистиките се обновиха:', {
      totalTransactions: transactions.length,
      balance: balance.toFixed(2),
      monthlyIncome: monthlyIncome.toFixed(2),
      monthlyExpense: monthlyExpense.toFixed(2),
      balanceChange: `${balanceChange}%`,
      incomeChange: `${incomeChange}%`,
      expenseChange: `${expenseChange}%`
    });
  }, [transactions, balance, monthlyIncome, monthlyExpense, balanceChange, incomeChange, expenseChange]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={theme.colors.primary}
        translucent={true}
      />
      {/* Гамификация съобщения */}
      {notifications.map(notification => notification)}
      
      {/* Луксозен header с заоблени ъгли и модерен дизайн */}
      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={theme.colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Декоративни елементи за дълбочина */}
          <View style={styles.headerDecorations}>
            <View style={[styles.decorativeCircle, styles.decorativeCircle1]} />
            <View style={[styles.decorativeCircle, styles.decorativeCircle2]} />
            <View style={[styles.decorativeCircle, styles.decorativeCircle3]} />
            {/* Нови декоративни елементи */}
            <View style={[styles.decorativeCircle, styles.decorativeCircle4]} />
            <View style={[styles.decorativeCircle, styles.decorativeCircle5]} />
          </View>
          
          {/* Floating ефект с допълнителен градиент */}
          <View style={styles.headerFloatingEffect}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'transparent', 'rgba(0, 0, 0, 0.05)']}
              style={styles.floatingGradient}
            />
          </View>
          
          <SafeAreaView style={styles.headerContent}>
          <View style={styles.header}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>Добре дошли</Text>
              <View style={styles.dateContainer}>
                <View style={styles.dateIcon} />
                <Text style={styles.date}>
                  {new Date().toLocaleDateString('bg-BG', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.profileContainer}
              onPress={() => navigation.navigate(SCREENS.PROFILE)}
              activeOpacity={0.8}
            >
              {/* Светещ ефект около профила */}
              <View style={styles.profileGlow} />
              
              <LinearGradient
                colors={theme.colors.accentGradient}
                style={styles.levelBadge}
              >
                <Text style={styles.levelText}>{gamificationProfile.level}</Text>
              </LinearGradient>
              
              <LinearGradient
                colors={['rgba(247, 231, 206, 0.25)', 'rgba(247, 231, 206, 0.1)']}
                style={styles.profileButton}
              >
                <Text style={styles.profileButtonText}>
                  {getUserInitials(userData.name)}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Подобрена баланс секция */}
          <View style={styles.balanceSection}>
            <View style={styles.balanceLabelContainer}>
              <View style={styles.balanceIcon} />
              <Text style={styles.balanceLabel}>Общ баланс</Text>
            </View>
            
            <View style={styles.balanceAmountContainer}>
              <Text style={styles.balanceAmount}>{balance.toFixed(2)}</Text>
              <Text style={styles.balanceCurrency}>лв.</Text>
            </View>
          </View>
        </SafeAreaView>
        </LinearGradient>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Error състояние */}
        {error && (
          <View style={styles.errorContainer}>
            <View style={[styles.errorCard, { backgroundColor: theme.colors.card }]}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={[styles.errorText, { color: theme.colors.text }]}>
                {error}
              </Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  setError(null);
                  setIsLoading(true);
                  // Simulate data reload
                  setTimeout(() => setIsLoading(false), 1000);
                }}
              >
                <Text style={styles.retryButtonText}>Опитай отново</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Loading състояние */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Зареждане на данни...
            </Text>
          </View>
        )}
        {/* Подобрени статистики с нов layout */}
        <View style={styles.statsSection}>
          <View style={styles.sectionHeaderContainer}>
            <View style={styles.sectionIconContainer}>
              <LinearGradient
                colors={theme.colors.accentGradient}
                style={styles.sectionIcon}
              >
                <View style={styles.sectionIconDot} />
              </LinearGradient>
            </View>
            <Text style={[styles.sectionHeaderTitle, { color: theme.colors.text }]}>
              Финансов преглед
            </Text>
          </View>
          
          <AnimatedStats
            stats={statsData}
            variant="horizontal"
            style={styles.statsContainer}
            animationDelay={100}
          />
        </View>

        {/* Подобрено финансово здраве */}
        <SimpleAnimatedCard 
          variant="glass" 
          style={styles.healthCard}
          animationDelay={200}
        >
          <TouchableOpacity 
            onPress={() => navigation.navigate(SCREENS.FINANCIAL_HEALTH)}
            style={styles.healthContent}
            activeOpacity={0.8}
          >
            <View style={styles.healthHeader}>
              <View style={styles.healthTitleContainer}>
                <LinearGradient
                  colors={['rgba(76, 175, 80, 0.2)', 'rgba(76, 175, 80, 0.1)']}
                  style={styles.healthIcon}
                >
                  <View style={styles.healthIconInner} />
                </LinearGradient>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Финансово здраве
                </Text>
              </View>
              <View style={[styles.healthBadge, { backgroundColor: healthStatus.color }]}>
                <Text style={styles.healthStatus}>{healthStatus.status}</Text>
              </View>
            </View>

            <View style={styles.healthScoreContainer}>
              <View style={styles.scoreSection}>
                <Animated.View
                  style={[
                    styles.animatedScoreContainer,
                    {
                      transform: [
                        { scale: Animated.multiply(scaleAnim, pulseAnim) }
                      ]
                    }
                  ]}
                >
                  <LinearGradient
                    colors={theme.colors.accentGradient}
                    style={styles.scoreCircle}
                  >
                    <View style={[styles.scoreOverlay, { backgroundColor: `${healthStatus.color}40` }]}>
                      <Text style={styles.scoreText}>{financialHealthScore}</Text>
                      <Text style={styles.scoreLabel}>/ 100</Text>
                    </View>
                  </LinearGradient>
                </Animated.View>
              </View>
              
              <View style={styles.healthInsights}>
                <Text style={[styles.insightText, { color: theme.colors.text }]}>
                  Вашето финансово здраве е {healthStatus.status.toLowerCase()}
                </Text>
                <Text style={[styles.insightTip, { color: theme.colors.textSecondary }]}>
                  {healthAdvice}
                </Text>
                
                {/* Нови индикатори */}
                <View style={styles.healthMetrics}>
                  <View style={styles.metricItem}>
                    <View style={[styles.metricDot, { backgroundColor: theme.colors.success }]} />
                    <Text style={[styles.metricText, { color: theme.colors.textSecondary }]}>
                      Приходи: {monthlyIncome.toFixed(0)} лв.
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <View style={[styles.metricDot, { backgroundColor: theme.colors.error }]} />
                    <Text style={[styles.metricText, { color: theme.colors.textSecondary }]}>
                      Разходи: {monthlyExpense.toFixed(0)} лв.
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <View style={[styles.metricDot, { backgroundColor: monthlyIncome > 0 ? 
                      (monthlyExpense / monthlyIncome > 0.7 ? theme.colors.warning : theme.colors.primary) : theme.colors.textSecondary }]} />
                    <Text style={[styles.metricText, { color: theme.colors.textSecondary }]}>
                      {monthlyIncome > 0 ? 
                        `Съотношение: ${((monthlyExpense / monthlyIncome) * 100).toFixed(0)}%` :
                        'Няма приходи'
                      }
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </SimpleAnimatedCard>

        {/* Подобрена графика с модерен дизайн */}
        <SimpleAnimatedCard 
          variant="elevated" 
          style={styles.chartCard}
          animationDelay={300}
        >
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleContainer}>
              <LinearGradient
                colors={theme.colors.primaryGradient}
                style={styles.chartIcon}
              >
                <View style={styles.chartIconInner} />
              </LinearGradient>
              <View>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Месечни приходи
                </Text>
                <Text style={[styles.chartSubtitle, { color: theme.colors.textSecondary }]}>
                  Последни 6 месеца
                </Text>
              </View>
            </View>
            
            {/* Статистика за най-добър месец */}
            <View style={styles.chartStats}>
              <Text style={[styles.chartStatsLabel, { color: theme.colors.textSecondary }]}>
                Най-добър
              </Text>
              <Text style={[styles.chartStatsValue, { color: theme.colors.accent }]}>
                {Math.max(...chartData.datasets[0].data).toFixed(0)} лв.
              </Text>
            </View>
          </View>
          
          <View style={styles.chartContainer}>
            <View style={styles.chartWrapper}>
              <LineChart
                data={chartData}
                width={320}
                height={200}
                yAxisLabel=""
                yAxisSuffix=" лв."
                chartConfig={{
                  backgroundGradientFrom: 'transparent',
                  backgroundGradientTo: 'transparent',
                  decimalPlaces: 0,
                  color: (opacity = 1) => theme.colors.accent,
                  labelColor: (opacity = 1) => theme.colors.textSecondary,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: "6",
                    strokeWidth: "3",
                    stroke: theme.colors.accent,
                    fill: theme.colors.background
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: "5,5",
                    stroke: theme.colors.borderLight,
                    strokeWidth: 1
                  }
                }}
                bezier
                style={styles.chart}
              />
              
              {/* Градиентен overlay за по-модерен вид */}
              <LinearGradient
                colors={['transparent', 'rgba(212, 175, 55, 0.1)', 'transparent']}
                style={styles.chartOverlay}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </View>
        </SimpleAnimatedCard>

        {/* Подобрени последни транзакции */}
        <SimpleAnimatedCard 
          variant="elevated" 
          style={styles.transactionsCard}
          animationDelay={400}
        >
          <View style={styles.enhancedCardHeader}>
            <View style={styles.cardTitleContainer}>
              <LinearGradient
                colors={theme.colors.secondaryGradient}
                style={styles.cardIcon}
              >
                <View style={styles.cardIconInner} />
              </LinearGradient>
              <View>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Последни транзакции
                </Text>
                <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                  {recentTransactions.length} от общо {transactions.length}
                </Text>
              </View>
            </View>
            <PremiumButton
              title="Виж всички"
              onPress={() => navigation.navigate('TransactionsTab')}
              variant="ghost"
              size="small"
            />
          </View>

          {recentTransactions.length > 0 ? (
            <View style={styles.transactionsContainer}>
              {recentTransactions.map((transaction, index) => (
                <View key={transaction.id} style={styles.transactionWrapper}>
                  <TouchableOpacity
                    style={styles.enhancedTransactionItem}
                    onPress={() => navigation.navigate(
                      SCREENS.TRANSACTION_DETAILS, 
                      { id: transaction.id }
                    )}
                    activeOpacity={0.8}
                  >
                    <View style={styles.transactionHeader}>
                      <LinearGradient
                        colors={[
                          getCategoryColor(transaction.category, transaction.amount) + '20',
                          getCategoryColor(transaction.category, transaction.amount) + '10'
                        ]}
                        style={[styles.categoryIcon, { borderColor: getCategoryColor(transaction.category, transaction.amount) + '40' }]}
                      >
                        <Text style={styles.categoryIconText}>
                          {transaction.icon || (transaction.amount > 0 ? '💰' : '💳')}
                        </Text>
                      </LinearGradient>
                      
                      <View style={styles.transactionInfo}>
                        <Text style={[styles.merchantName, { color: theme.colors.text }]}>
                          {transaction.merchant}
                        </Text>
                        <Text style={[styles.transactionDescription, { color: theme.colors.textSecondary }]}>
                          {transaction.description || transaction.note || 'Няма описание'}
                        </Text>
                        <View style={styles.categoryRow}>
                          <View style={[
                            styles.categoryBadge,
                            { backgroundColor: getCategoryColor(transaction.category, transaction.amount) + '20' }
                          ]}>
                            <Text style={[
                              styles.categoryBadgeText,
                              { color: getCategoryColor(transaction.category, transaction.amount) }
                            ]}>
                              {transaction.category}
                            </Text>
                          </View>
                          <Text style={styles.emotionIcon}>
                            {getEmotionIcon(transaction.emotion || 'neutral')}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.transactionRight}>
                        <Text style={[
                          styles.transactionAmount,
                          { color: transaction.amount > 0 ? '#4CAF50' : theme.colors.text }
                        ]}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)} лв.
                        </Text>
                        <Text style={[styles.transactionDate, { color: theme.colors.textSecondary }]}>
                          {new Date(transaction.date).toLocaleDateString('bg-BG')}
                        </Text>
                        <View style={[
                          styles.amountBadge,
                          { backgroundColor: transaction.amount > 0 ? '#4CAF5020' : '#F4433620' }
                        ]}>
                          <Text style={[
                            styles.amountBadgeText,
                            { color: transaction.amount > 0 ? '#4CAF50' : '#F44336' }
                          ]}>
                            {transaction.amount > 0 ? 'Приход' : 'Разход'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                  {index < recentTransactions.length - 1 && (
                    <View style={styles.transactionDivider} />
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyTransactions}>
              <LinearGradient
                colors={['rgba(158, 158, 158, 0.1)', 'rgba(158, 158, 158, 0.05)']}
                style={styles.emptyIcon}
              >
                <View style={styles.emptyIconInner} />
              </LinearGradient>
              <Text style={[styles.emptyTransactionsText, { color: theme.colors.textSecondary }]}>
                Няма транзакции за показване
              </Text>
              <Text style={[styles.emptyTransactionsSubtext, { color: theme.colors.textSecondary }]}>
                Добавете първата си транзакция
              </Text>
            </View>
          )}
        </SimpleAnimatedCard>

        {/* Активни мисии */}
        <SimpleAnimatedCard 
          variant="glass" 
          style={styles.missionsCard}
          animationDelay={500}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Активни цели
            </Text>
            <PremiumButton
              title="Виж всички"
              onPress={() => navigation.navigate(SCREENS.ACHIEVEMENTS, { initialTab: 'missions' })}
              variant="ghost"
              size="small"
            />
          </View>
          
          {gamificationProfile.missions.active.length > 0 ? (
            <MissionCard 
              mission={gamificationProfile.missions.active[0]} 
              onPress={() => navigation.navigate(SCREENS.ACHIEVEMENTS, { initialTab: 'missions' })}
            />
          ) : (
            <View style={styles.emptyMissions}>
              <Text style={[styles.emptyMissionsText, { color: theme.colors.textSecondary }]}>
                Няма активни цели в момента
              </Text>
            </View>
          )}
          
        </SimpleAnimatedCard>

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight || 0,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '300', // Light weight for elegance
    color: '#F7E7CE',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 14,
    color: 'rgba(247, 231, 206, 0.7)',
    fontWeight: '400',
  },
  profileContainer: {
    position: 'relative',
  },
  levelBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    borderWidth: 2,
    borderColor: '#F7E7CE',
    display: 'flex',
  },
  levelText: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 12,
    includeFontPadding: false,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(247, 231, 206, 0.4)',
    shadowColor: '#D4AF37',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  profileButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F7E7CE',
  },
  balanceSection: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: 'rgba(247, 231, 206, 0.8)',
    marginBottom: 8,
    fontWeight: '400',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '200', // Ultra light for luxury feel
    color: '#F7E7CE',
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
    marginTop: -16,
    paddingTop: 32,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: 'transparent',
  },
  statsContainer: {
    marginBottom: 24,
  },
  healthCard: {
    marginBottom: 24,
  },
  healthContent: {
    // Премахваме padding защото PremiumCard вече има
  },
    healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  healthBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  healthStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  healthScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 24,
    aspectRatio: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  scoreOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scoreLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 16,
  },
  healthInsights: {
    flex: 1,
  },
  insightText: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: '400',
  },
  insightTip: {
    fontSize: 14,
    fontWeight: '300',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '400',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartCard: {
    marginBottom: 24,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  chart: {
    borderRadius: 16,
  },
  transactionsCard: {
    marginBottom: 24,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(232, 232, 232, 0.3)',
  },
  lastTransactionItem: {
    borderBottomWidth: 0,
  },
  categoryInitial: {
    fontSize: 18,
    fontWeight: '600',
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 14,
    fontWeight: '300',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  missionsCard: {
    marginBottom: 24,
  },
  emptyMissions: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMissionsText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '300',
  },

  bottomSpacing: {
    height: 100,
  },
  
  // Нови стилове за подобрения header
  headerDecorations: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(247, 231, 206, 0.08)',
  },
  decorativeCircle1: {
    width: 120,
    height: 120,
    top: -40,
    right: -20,
  },
  decorativeCircle2: {
    width: 80,
    height: 80,
    top: 60,
    left: -30,
  },
  decorativeCircle3: {
    width: 60,
    height: 60,
    bottom: 20,
    right: 80,
  },
  decorativeCircle4: {
    width: 40,
    height: 40,
    top: 120,
    right: 40,
    backgroundColor: 'rgba(247, 231, 206, 0.05)',
  },
  decorativeCircle5: {
    width: 100,
    height: 100,
    bottom: -30,
    left: 60,
    backgroundColor: 'rgba(247, 231, 206, 0.06)',
  },
  headerFloatingEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  floatingGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  greetingContainer: {
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateIcon: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(247, 231, 206, 0.6)',
    marginRight: 8,
  },
  profileGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 28,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    opacity: 0.6,
  },
  balanceLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  balanceIcon: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(247, 231, 206, 0.8)',
    marginRight: 8,
  },
  balanceAmountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 16,
  },
  balanceCurrency: {
    fontSize: 24,
    fontWeight: '300',
    color: 'rgba(247, 231, 206, 0.8)',
    marginLeft: 8,
    letterSpacing: 0.5,
  },

  
  // Нови стилове за подобрените секции
  statsSection: {
    marginBottom: 24,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionIconContainer: {
    marginRight: 12,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionIconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1A1A1A',
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  
  // Подобрени стилове за финансово здраве
  healthTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 32,
  },
  healthIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  healthIconInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  scoreSection: {
    marginRight: 24,
  },
  animatedScoreContainer: {
    // Контейнер за анимацията, наследява размерите от scoreCircle
  },

  healthMetrics: {
    marginTop: 16,
    gap: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  metricText: {
    fontSize: 13,
    fontWeight: '400',
  },
  
  // Подобрени стилове за графика
  chartHeader: {
    marginBottom: 20,
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chartIconInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F7E7CE',
  },
  chartSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
  },
  chartStats: {
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  chartStatsLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartStatsValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  chartOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  
  // Подобрени стилове за транзакции
  enhancedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardIconInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1A1A1A',
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
  },
  transactionsContainer: {
    gap: 0,
  },
  transactionWrapper: {
    position: 'relative',
  },
  enhancedTransactionItem: {
    paddingVertical: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
  },
  categoryIconText: {
    fontSize: 22,
  },
  transactionInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 14,
    marginBottom: 6,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    marginBottom: 6,
  },
  amountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  amountBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emotionIcon: {
    fontSize: 16,
  },
  transactionDivider: {
    height: 1,
    backgroundColor: 'rgba(232, 232, 232, 0.2)',
    marginVertical: 8,
    marginLeft: 64,
  },
  emptyTransactions: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTransactionsText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '300',
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIconInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(158, 158, 158, 0.3)',
  },
  emptyTransactionsSubtext: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '300',
    marginTop: 4,
  },
  
  // Error и Loading стилове
  errorContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  errorCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default HomeScreen; 