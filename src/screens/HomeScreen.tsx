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
import { GamificationProfile } from '../models/gamification';
import FlameIcon from '../components/icons/FlameIcon';
import TrophyIcon from '../components/icons/TrophyIcon';
import TargetIcon from '../components/icons/TargetIcon';
import GiftIcon from '../components/icons/GiftIcon';

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
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { userData, loading: userLoading } = useUser();

  // Анимация за кръга
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const isLoading = transactionsLoading || userLoading;
  const [error, setError] = useState<string | null>(null);

  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2); // Вземаме максимум 2 инициала
  };
  
  const calculatePercentageChange = useCallback((current: number, previous: number) => {
    try {
      const safeCurrent = typeof current === 'number' && !isNaN(current) ? current : 0;
      const safePrevious = typeof previous === 'number' && !isNaN(previous) ? previous : 0;
      
      if (safePrevious === 0) return safeCurrent > 0 ? 100 : 0;
      return Math.round(((current - safePrevious) / safePrevious) * 100);
    } catch (error) {
      console.warn('Грешка при изчисляване на процентна промяна:', error);
      return 0;
    }
  }, []);

  const memoizedData = useMemo(() => {
    try {
      setError(null);
      if (!transactions || !userData) {
        return {
          balance: 0,
          monthlyIncome: 0,
          monthlyExpense: 0,
          incomeChange: 0,
          expenseChange: 0,
          balanceChange: 0,
          recentTransactions: [],
          chartData: generateChartData([]),
          financialHealthScore: 0,
        };
      }

      // --- Основни изчисления ---
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      const currentMonthTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });

      const monthlyIncome = currentMonthTransactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const monthlyExpense = Math.abs(currentMonthTransactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0));
      
      const totalTransactionAmount = transactions.reduce((s, t) => s + t.amount, 0);
      const balance = (userData.initialBalance || 0) + totalTransactionAmount;

      // --- Изчисления за предходен месец ---
      const prevMonthDate = new Date();
      prevMonthDate.setMonth(currentDate.getMonth() - 1);
      const previousMonth = prevMonthDate.getMonth();
      const previousYear = prevMonthDate.getFullYear();
      
      const previousMonthTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === previousMonth && d.getFullYear() === previousYear;
      });

      const previousMonthIncome = previousMonthTransactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const previousMonthExpense = Math.abs(previousMonthTransactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0));

      const prevTotalTransactionAmount = transactions
        .filter(t => new Date(t.date) <= prevMonthDate)
        .reduce((s, t) => s + t.amount, 0);
      const previousBalance = (userData.initialBalance || 0) + prevTotalTransactionAmount;
      
      // --- Изчисляване на промени и други данни ---
      const incomeChange = calculatePercentageChange(monthlyIncome, previousMonthIncome);
      const expenseChange = calculatePercentageChange(monthlyExpense, previousMonthExpense);
      const balanceChange = calculatePercentageChange(balance, previousBalance);
      
      const recentTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
      const chartData = generateChartData(transactions);
      const financialHealthScore = calculateFinancialHealth(transactions, monthlyIncome, monthlyExpense, balance);

      return {
        balance,
        monthlyIncome,
        monthlyExpense,
        incomeChange,
        expenseChange,
        balanceChange,
        recentTransactions,
        chartData,
        financialHealthScore,
      };

    } catch (e) {
      console.error("Грешка в useMemo:", e);
      setError("Грешка при обработка на данните");
      return {
          balance: 0, monthlyIncome: 0, monthlyExpense: 0, incomeChange: 0, expenseChange: 0,
          balanceChange: 0, recentTransactions: [], chartData: generateChartData([]), financialHealthScore: 0
      };
    }
  }, [transactions, userData, calculatePercentageChange]);
  
  // Интеграция с гамификация за финансово здраве
  useEffect(() => {
    if (memoizedData.financialHealthScore > 0) {
      gamificationService.onFinancialHealthUpdated(memoizedData.financialHealthScore, {
        monthlyIncome: memoizedData.monthlyIncome,
        monthlyExpense: memoizedData.monthlyExpense,
        balance: memoizedData.balance,
        ratio: memoizedData.monthlyIncome > 0 ? (memoizedData.monthlyExpense / memoizedData.monthlyIncome) : 0,
        savingsRate: memoizedData.monthlyIncome > 0 ? ((memoizedData.monthlyIncome - memoizedData.monthlyExpense) / memoizedData.monthlyIncome) : 0
      });
    }
  }, [memoizedData]);
  
  // Получаване на данни за гамификация с автоматично обновяване
  const [gamificationProfile, setGamificationProfile] = useState(gamificationService.getProfile());
  const [notifications, setNotifications] = useState<React.ReactNode[]>([]);

  // Показва нотификация за геймификация
  const showGamificationNotification = useCallback((title: string, message: string, icon: string, color: string, xpAmount: number = 0) => {
    const notificationId = Date.now().toString();
    
    const notification = (
      <GamificationOverlay
        key={notificationId}
        title={title}
        message={message}
        icon={icon}
        color={color}
        showXP={xpAmount > 0}
        xpAmount={xpAmount}
        onDismiss={() => {
          setNotifications(prev => prev.filter(n => (n as any).key !== notificationId));
        }}
      />
    );
    
    setNotifications(prev => [...prev, notification]);
  }, []);

  // Gamification setup
  useEffect(() => {
    const onProfileUpdate = (profile: GamificationProfile) => {
      setGamificationProfile(profile);
    };
    
    // Слушаме за промени в профила
    gamificationService.onProfileUpdated(onProfileUpdate);
    
    // Зареждаме текущия профил (GamificationService се инициализира автоматично)
    gamificationService.getProfileAsync().then((currentProfile) => {
      if (currentProfile) {
        setGamificationProfile(currentProfile);
      }
    });
    
    // Слушаме за завършени постижения
    const onAchievementCompleted = (achievement: any) => {
      showGamificationNotification(
        'Ново постижение!',
        achievement.name,
        achievement.icon,
        '#FF9800',
        achievement.xpReward
      );
    };

    // Слушаме за завършени мисии
    const onMissionCompleted = (mission: any) => {
      showGamificationNotification(
        'Мисия завършена!',
        mission.name,
        mission.icon,
        '#2196F3',
        mission.xpReward
      );
    };

    // Слушаме за level up
    const onXPAdded = (data: any) => {
      if (data.result.leveledUp) {
        showGamificationNotification(
          `🎊 Ниво ${data.result.level}!`,
          'Поздравления! Качихте ниво!',
          '🏆',
          '#FFD700',
          data.amount
        );
      }
    };

    // Регистрираме event listeners
    gamificationService.eventEmitter.on('achievementCompleted', onAchievementCompleted);
    gamificationService.eventEmitter.on('missionCompleted', onMissionCompleted);
    gamificationService.eventEmitter.on('xpAdded', onXPAdded);
    
    return () => {
      gamificationService.offProfileUpdated(onProfileUpdate);
      gamificationService.eventEmitter.off('achievementCompleted', onAchievementCompleted);
      gamificationService.eventEmitter.off('missionCompleted', onMissionCompleted);
      gamificationService.eventEmitter.off('xpAdded', onXPAdded);
    };
  }, [showGamificationNotification]);

  // Показва здравен статус въз основа на резултата
  const getHealthStatus = useCallback((score: number) => {
    if (score >= 80) return { status: 'Отлично', color: theme.colors.success };
    if (score >= 60) return { status: 'Добро', color: theme.colors.warning };
    if (score >= 40) return { status: 'Средно', color: theme.colors.error };
    return { status: 'Слабо', color: theme.colors.error };
  }, [theme.colors]);

  // Генериране на персонализирани съвети за финансово здраве
  const getHealthAdvice = () => {
    const { monthlyIncome, monthlyExpense, balance } = memoizedData;
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

  const healthStatus = getHealthStatus(memoizedData.financialHealthScore);
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
      value: `${memoizedData.balance.toFixed(2)} лв.`,
      change: Math.abs(memoizedData.balanceChange),
      changeType: memoizedData.balanceChange > 0 ? 'positive' as const : 'negative' as const,
      color: theme.colors.primary,
    },
    {
      label: 'Приходи',
      value: `${memoizedData.monthlyIncome.toFixed(2)} лв.`,
      change: Math.abs(memoizedData.incomeChange),
      changeType: memoizedData.incomeChange > 0 ? 'positive' as const : 'negative' as const,
      color: theme.colors.success,
    },
    {
      label: 'Разходи',
      value: `${memoizedData.monthlyExpense.toFixed(2)} лв.`,
      change: Math.abs(memoizedData.expenseChange),
      changeType: memoizedData.expenseChange > 0 ? 'negative' as const : 'positive' as const,
      color: theme.colors.error,
    },
  ];

  // Debug информация за финансово здраве
  useEffect(() => {
    const { financialHealthScore, monthlyIncome, monthlyExpense, balance } = memoizedData;
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
  }, [memoizedData, healthStatus, healthAdvice]);

  // Обновяване на статистиките при промяна на транзакциите
  useEffect(() => {
    console.log('HomeScreen статистиките се обновиха:', memoizedData);
  }, [memoizedData]);

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
              
              {gamificationProfile && (
                <LinearGradient
                  colors={theme.colors.accentGradient}
                  style={styles.levelBadge}
                >
                  <Text style={styles.levelText}>{gamificationProfile.level}</Text>
                </LinearGradient>
              )}
              
              <LinearGradient
                colors={['rgba(247, 231, 206, 0.25)', 'rgba(247, 231, 206, 0.1)']}
                style={styles.profileButton}
              >
                <Text style={styles.profileButtonText}>
                  {userData ? getUserInitials(userData.name) : '...'}
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
              <Text style={styles.balanceAmount}>{isLoading ? '...' : memoizedData.balance.toFixed(2)}</Text>
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
                  // Данните ще се опитат да се заредят автоматично от контекста.
                  // Можем да добавим refetch функции в бъдеще.
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
          animationDelay={150}
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
                      <Text style={styles.scoreText}>{memoizedData.financialHealthScore}</Text>
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
                      Приходи: {memoizedData.monthlyIncome.toFixed(0)} лв.
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <View style={[styles.metricDot, { backgroundColor: theme.colors.error }]} />
                    <Text style={[styles.metricText, { color: theme.colors.textSecondary }]}>
                      Разходи: {memoizedData.monthlyExpense.toFixed(0)} лв.
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <View style={[styles.metricDot, { backgroundColor: memoizedData.monthlyIncome > 0 ? 
                      (memoizedData.monthlyExpense / memoizedData.monthlyIncome > 0.7 ? theme.colors.warning : theme.colors.primary) : theme.colors.textSecondary }]} />
                    <Text style={[styles.metricText, { color: theme.colors.textSecondary }]}>
                      {memoizedData.monthlyIncome > 0 ? 
                        `Съотношение: ${((memoizedData.monthlyExpense / memoizedData.monthlyIncome) * 100).toFixed(0)}%` :
                        'Няма приходи'
                      }
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </SimpleAnimatedCard>

        {/* Геймификация: Level и Streak */}
        <SimpleAnimatedCard 
          variant="elevated" 
          style={styles.gamificationCard}
          animationDelay={200}
        >
          <View style={styles.gamificationHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Твоят напредък
            </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate(SCREENS.ACHIEVEMENTS)}
              activeOpacity={0.8}
            >
              <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
                Виж всички →
              </Text>
            </TouchableOpacity>
          </View>

          {/* Level Progress */}
          <LevelProgressBar 
            xp={gamificationProfile.xp}
            level={gamificationProfile.level}
            compact={false}
          />

          {/* Streak информация - Подобрен дизайн */}
          <View style={styles.streakContainer}>
            <LinearGradient
              colors={theme.colors.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.streakGradient}
            >
              {/* Декоративни елементи */}
              <View style={styles.streakDecoTop} />
              <View style={styles.streakDecoBottom} />
              
              <View style={styles.streakContent}>
                {/* Само икона и число */}
                <View style={styles.streakIconContainer}>
                  <FlameIcon size={56} />
                  {gamificationProfile.streakDays > 0 && (
                    <View style={styles.streakPulse} />
                  )}
                </View>
                <View style={styles.streakNumberContainer}>
                  <Text style={styles.streakNumber}>{gamificationProfile.streakDays}</Text>
                  <Text style={styles.streakNumberLabel}>
                    {gamificationProfile.streakDays === 1 ? 'ден' : 'дни'}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Бързи статистики */}
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <View style={styles.quickStatIconContainer}>
                <TrophyIcon size={32} />
              </View>
              <Text style={[styles.quickStatValue, { color: theme.colors.text }]}>
                {gamificationProfile.completedAchievements}
              </Text>
              <Text style={[styles.quickStatLabel, { color: theme.colors.textSecondary }]}>
                Постижения
              </Text>
            </View>
            <View style={styles.quickStatItem}>
              <View style={styles.quickStatIconContainer}>
                <TargetIcon size={32} />
              </View>
              <Text style={[styles.quickStatValue, { color: theme.colors.text }]}>
                {gamificationProfile.missions.active.length}
              </Text>
              <Text style={[styles.quickStatLabel, { color: theme.colors.textSecondary }]}>
                Активни мисии
              </Text>
            </View>
            <View style={styles.quickStatItem}>
              <View style={styles.quickStatIconContainer}>
                <GiftIcon size={32} />
              </View>
              <Text style={[styles.quickStatValue, { color: theme.colors.text }]}>
                {gamificationProfile.rewards.filter(r => r.isUnlocked).length}
              </Text>
              <Text style={[styles.quickStatLabel, { color: theme.colors.textSecondary }]}>
                Награди
              </Text>
            </View>
          </View>
        </SimpleAnimatedCard>

        {/* Подобрена графика с модерен дизайн */}
        <SimpleAnimatedCard 
          variant="elevated" 
          style={styles.chartCard}
          animationDelay={300}
        >
          {/* Header с градиент фон */}
          <LinearGradient
            colors={[theme.colors.primary + '15', theme.colors.primary + '05']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.chartHeaderGradient}
          >
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
          </LinearGradient>
          
          {/* Допълнителни статистики */}
          <View style={styles.chartMetrics}>
            <View style={styles.chartMetricItem}>
              <View style={[styles.chartMetricDot, { backgroundColor: theme.colors.success }]} />
              <View>
                <Text style={[styles.chartMetricLabel, { color: theme.colors.textSecondary }]}>
                  Средно
                </Text>
                <Text style={[styles.chartMetricValue, { color: theme.colors.text }]}>
                  {(() => {
                    try {
                      const data = memoizedData.chartData?.datasets?.[0]?.data;
                      if (!data || data.length === 0) return '0';
                      const avg = data.reduce((a, b) => a + b, 0) / data.length;
                      return avg.toFixed(0);
                    } catch (error) {
                      console.warn('Грешка при изчисляване на средно:', error);
                      return '0';
                    }
                  })()} лв.
                </Text>
              </View>
            </View>
            <View style={styles.chartMetricDivider} />
            <View style={styles.chartMetricItem}>
              <View style={[styles.chartMetricDot, { backgroundColor: theme.colors.warning }]} />
              <View>
                <Text style={[styles.chartMetricLabel, { color: theme.colors.textSecondary }]}>
                  Най-нисък
                </Text>
                <Text style={[styles.chartMetricValue, { color: theme.colors.text }]}>
                  {(() => {
                    try {
                      const data = memoizedData.chartData?.datasets?.[0]?.data;
                      if (!data || data.length === 0) return '0';
                      return Math.min(...data).toFixed(0);
                    } catch (error) {
                      console.warn('Грешка при изчисляване на най-нисък:', error);
                      return '0';
                    }
                  })()} лв.
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.chartContainer}>
            <View style={styles.chartWrapper}>
              <LineChart
                data={memoizedData.chartData}
                width={320}
                height={200}
                yAxisLabel=""
                yAxisSuffix=" лв."
                chartConfig={{
                  backgroundGradientFrom: 'transparent',
                  backgroundGradientTo: 'transparent',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(${parseInt(theme.colors.accent.slice(1, 3), 16)}, ${parseInt(theme.colors.accent.slice(3, 5), 16)}, ${parseInt(theme.colors.accent.slice(5, 7), 16)}, ${opacity})`,
                  labelColor: (opacity = 1) => theme.colors.textSecondary,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: "7",
                    strokeWidth: "3",
                    stroke: theme.colors.accent,
                    fill: theme.colors.background
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: "5,5",
                    stroke: theme.colors.borderLight,
                    strokeWidth: 1,
                    opacity: 0.3
                  },
                  fillShadowGradient: theme.colors.accent,
                  fillShadowGradientOpacity: 0.2,
                }}
                bezier
                withShadow={false}
                withInnerLines={true}
                withOuterLines={false}
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
                  {memoizedData.recentTransactions.length} от общо {transactions.length}
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

          {memoizedData.recentTransactions.length > 0 ? (
            <View style={styles.transactionsContainer}>
              {memoizedData.recentTransactions.map((transaction, index) => (
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
                  {index < memoizedData.recentTransactions.length - 1 && (
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
          
          {gamificationProfile && gamificationProfile.missions.active.length > 0 ? (
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

        {/* Level Progress Bar */}
        {/* Временно премахнато докато не се имплементира правилно
        {gamificationProfile && (
          <View style={styles.levelContainer}>
            <LevelProgressBar
              level={gamificationProfile.level}
              currentXP={gamificationProfile.xp}
              nextLevelXP={gamificationProfile.level * 1000}
              showAnimation={true}
            />
          </View>
        )}
        */}

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
  chartHeaderGradient: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartIconInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F7E7CE',
  },
  chartSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
  },
  chartStats: {
    alignItems: 'flex-end',
  },
  chartStatsLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  chartStatsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  chartStatsValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  chartMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 12,
    marginHorizontal: 16,
  },
  chartMetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chartMetricDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  chartMetricLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  chartMetricValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  chartMetricDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 12,
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
  levelContainer: {
    marginBottom: 24,
  },

  // Геймификация стилове
  gamificationCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
  },
  gamificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  streakContainer: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  streakGradient: {
    borderRadius: 16,
    position: 'relative',
    minHeight: 120,
    justifyContent: 'center',
  },
  streakDecoTop: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  streakDecoBottom: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 40,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  streakIcon: {
    fontSize: 48,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  streakPulse: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    opacity: 0.5,
  },
  streakNumberContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    lineHeight: 36,
  },
  streakNumberLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  streakMiddle: {
    flex: 1,
    marginLeft: 16,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  streakSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  streakBonus: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  streakBonusIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  streakBonusText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  streakProgress: {
    alignItems: 'center',
    minWidth: 60,
  },
  streakProgressBar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 4,
    marginBottom: 4,
  },
  streakProgressFill: {
    height: '100%',
    borderRadius: 21,
    backgroundColor: '#00d4ff',
  },
  streakProgressText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  quickStatItem: {
    alignItems: 'center',
  },
  quickStatIconContainer: {
    marginBottom: 8,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  quickStatLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default HomeScreen; 