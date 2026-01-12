import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

// Тематичен контекст
import { useTheme } from '../utils/ThemeContext';
import { useTransactions } from '../utils/TransactionContext';
import { SCREENS } from '../utils/constants';
import gamificationService from '../services/GamificationService';
import { useUser } from '../utils/UserContext';

// Модерни UI компоненти
import SimpleAnimatedCard from '../components/ui/SimpleAnimatedCard';
import PremiumButton from '../components/ui/PremiumButton';

// Функция за изчисляване на финансово здраве (същата като в HomeScreen)
const calculateFinancialHealth = (transactions: any[], monthlyIncome: number, monthlyExpense: number, currentBalance: number) => {
  let score = 50; // Базов резултат
  
  // Фактор 1: Съотношение приходи/разходи (30 точки)
  if (monthlyIncome > 0) {
    const ratio = monthlyExpense / monthlyIncome;
    if (ratio < 0.5) score += 30;
    else if (ratio < 0.7) score += 20;
    else if (ratio < 0.9) score += 10;
    else score -= 10;
  } else if (monthlyExpense > 0) {
    // Ако няма приходи, но има разходи - намаляваме резултата
    score -= 20;
  }
  
  // Фактор 2: Последователност в транзакциите (20 точки)
  const recentDays = 7;
  const recentTransactions = transactions.filter(t => {
    const daysDiff = (new Date().getTime() - new Date(t.date).getTime()) / (1000 * 3600 * 24);
    return daysDiff <= recentDays;
  });
  if (recentTransactions.length >= 3) score += 20;
  else if (recentTransactions.length >= 1) score += 10;
  
  // Фактор 3: Текущ баланс (20 точки) - използваме правилния баланс
  if (currentBalance > 2000) score += 20;
  else if (currentBalance > 1000) score += 15;
  else if (currentBalance > 0) score += 10;
  else if (currentBalance > -500) score -= 10;
  else score -= 20;
  
  return Math.max(0, Math.min(100, score));
};

const FinancialHealthScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { userData, loading: userLoading } = useUser();

  const isLoading = transactionsLoading || userLoading;

  const financialData = useMemo(() => {
    if (!userData || !transactions) {
      return null; 
    }
    
    const initialBalance = userData.initialBalance || 0;
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
    });

    const monthlyIncome = currentMonthTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpense = Math.abs(currentMonthTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
    
    const totalTransactionAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const balance = initialBalance + totalTransactionAmount;
    
    const financialHealthScore = calculateFinancialHealth(transactions, monthlyIncome, monthlyExpense, balance);

    return {
      monthlyIncome,
      monthlyExpense,
      balance,
      financialHealthScore,
    };
  }, [transactions, userData]);

  useEffect(() => {
    if (financialData) {
      gamificationService.onFinancialHealthUpdated(financialData.financialHealthScore, {
        monthlyIncome: financialData.monthlyIncome,
        monthlyExpense: financialData.monthlyExpense,
        balance: financialData.balance,
        ratio: financialData.monthlyIncome > 0 ? (financialData.monthlyExpense / financialData.monthlyIncome) : 0,
        savingsRate: financialData.monthlyIncome > 0 ? ((financialData.monthlyIncome - financialData.monthlyExpense) / financialData.monthlyIncome) : 0
      });
      gamificationService.onReportViewed('financial_health');
    }
  }, [financialData]);

  if (isLoading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color={theme.colors.primary} />;
  }
  
  if (!financialData) {
    return <Text>Не могат да се заредят данните.</Text>;
  }

  // Получава здравен статус въз основа на резултата
  const getHealthStatus = (score: number) => {
    if (score >= 80) return { status: 'Отлично', color: theme.colors.success };
    if (score >= 60) return { status: 'Добро', color: '#3CB371' };
    if (score >= 40) return { status: 'Средно', color: theme.colors.warning };
    if (score >= 20) return { status: 'Лошо', color: '#DAA520' };
    return { status: 'Критично', color: theme.colors.error };
  };

  // Генериране на персонализирани съвети за финансово здраве
  const getHealthAdvice = () => {
    const ratio = financialData.monthlyIncome > 0 ? (financialData.monthlyExpense / financialData.monthlyIncome) : 0;
    
    if (financialData.monthlyIncome === 0 && financialData.monthlyExpense > 0) {
      return 'Добавете приходи за подобряване на финансовото здраве';
    } else if (ratio > 0.9) {
      return 'Намалете разходите - те са над 90% от приходите';
    } else if (ratio > 0.7) {
      return 'Подобрете спестяванията - разходите са високи';
    } else if (financialData.balance < 0) {
      return 'Балансът е отрицателен - фокусирайте се върху приходите';
    } else if (financialData.balance < 1000) {
      return 'Увеличете спестяванията за по-добра финансова сигурност';
    } else {
      return 'Отлично управление! Продължавайте в същия дух';
    }
  };

  // Генериране на реални фактори според данните
  const generateFactors = () => {
    const ratio = financialData.monthlyIncome > 0 ? (financialData.monthlyExpense / financialData.monthlyIncome) : 0;
    const savingsRate = financialData.monthlyIncome > 0 ? ((financialData.monthlyIncome - financialData.monthlyExpense) / financialData.monthlyIncome) : 0;
    const recentTransactions = transactions.filter(t => {
      const daysDiff = (new Date().getTime() - new Date(t.date).getTime()) / (1000 * 3600 * 24);
      return daysDiff <= 30;
    });

    return [
      {
        id: '1',
        name: 'Съотношение разходи/приходи',
        score: Math.max(0, Math.min(100, (1 - ratio) * 100)),
        maxScore: 100,
        description: financialData.monthlyIncome > 0 ? 
          `${(ratio * 100).toFixed(0)}% от приходите се изразходват` :
          'Няма приходи за текущия месец'
      },
      {
        id: '2',
        name: 'Спестявания',
        score: Math.max(0, savingsRate * 100),
        maxScore: 100,
        description: savingsRate > 0 ? 
          `Спестявате ${(savingsRate * 100).toFixed(0)}% от приходите` :
          'Няма спестявания за текущия месец'
      },
      {
        id: '3',
        name: 'Финансова активност',
        score: Math.min(100, recentTransactions.length * 10),
        maxScore: 100,
        description: `${recentTransactions.length} транзакции през последния месец`
      },
      {
        id: '4',
        name: 'Финансов баланс',
        score: financialData.balance > 2000 ? 100 : financialData.balance > 1000 ? 75 : financialData.balance > 0 ? 50 : financialData.balance > -500 ? 25 : 0,
        maxScore: 100,
        description: `Текущ баланс: ${financialData.balance.toFixed(2)} €`
      }
    ];
  };

  // Генериране на персонализирани препоръки
  const generateRecommendations = () => {
    const ratio = financialData.monthlyIncome > 0 ? (financialData.monthlyExpense / financialData.monthlyIncome) : 0;
    const recommendations = [];

    if (financialData.monthlyIncome === 0) {
      recommendations.push({
        id: '1',
        title: 'Добавете източници на приходи',
        description: 'Няма регистрирани приходи за текущия месец',
        priority: 'high'
      });
    } else if (ratio > 0.9) {
      recommendations.push({
        id: '2',
        title: 'Намалете месечните разходи',
        description: 'Разходите са над 90% от приходите',
        priority: 'high'
      });
    } else if (ratio > 0.7) {
      recommendations.push({
        id: '3',
        title: 'Подобрете спестяванията',
        description: 'Увеличете процента на спестяванията',
        priority: 'medium'
      });
    }

    if (financialData.balance < 500) {
      recommendations.push({
        id: '4',
        title: 'Създайте резерв за спешни случаи',
        description: 'Препоръчваме резерв от 3-6 месечни разхода',
        priority: 'high'
      });
    }

    if (transactions.length < 5) {
      recommendations.push({
        id: '5',
        title: 'Записвайте всички транзакции',
        description: 'Добавете повече транзакции за по-точен анализ',
        priority: 'medium'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        id: '6',
        title: 'Отлично управление!',
        description: 'Финансите ви са в добро състояние',
        priority: 'low'
      });
    }

    return recommendations;
  };

  // Променливите се извличат от memoized данните
  const { financialHealthScore, balance, monthlyIncome, monthlyExpense } = financialData;
  const healthStatus = getHealthStatus(financialHealthScore);
  const healthAdvice = getHealthAdvice();
  const factors = generateFactors();
  const recommendations = generateRecommendations();

  // Debug информация
  useEffect(() => {
    console.log('FinancialHealthScreen - Debug:', {
      score: financialHealthScore,
      monthlyIncome: monthlyIncome.toFixed(2),
      monthlyExpense: monthlyExpense.toFixed(2),
      balance: balance.toFixed(2),
      status: healthStatus.status,
      advice: healthAdvice,
      transactionsCount: transactions.length
    });
  }, [financialHealthScore, monthlyIncome, monthlyExpense, balance, healthStatus, healthAdvice, transactions.length]);

  // Получаване на цвят на прогреса въз основа на процента
  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return theme.colors.success;
    if (percentage >= 60) return '#3DD598';
    if (percentage >= 40) return theme.colors.warning;
    if (percentage >= 20) return '#FF9500';
    return theme.colors.error;
  };

  // Получаване на цвят на приоритет
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return theme.colors.error;
      case 'medium':
        return theme.colors.warning;
      case 'low':
        return theme.colors.success;
      default:
        return theme.colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={theme.colors.primary}
        translucent={true}
      />
      
      {/* Модерен header с градиент */}
      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={theme.colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <SafeAreaView style={styles.headerContent}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerTitle}>Финансово здраве</Text>
                <Text style={styles.headerSubtitle}>
                  Резултат: {financialHealthScore}/100 • {healthStatus.status}
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      <View style={styles.contentContainer}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Здравен индекс */}
          <SimpleAnimatedCard 
            variant="elevated" 
            style={styles.scoreCard}
            animationDelay={100}
          >
            <View style={styles.scoreHeader}>
              <Text style={[styles.scoreTitle, { color: theme.colors.text }]}>
                Вашият индекс
              </Text>
              <View style={[styles.scoreStatus, { backgroundColor: healthStatus.color }]}>
                <Text style={styles.scoreStatusText}>{healthStatus.status}</Text>
              </View>
            </View>

            <View style={styles.scoreCircleContainer}>
              <LinearGradient
                colors={theme.colors.accentGradient}
                style={styles.scoreCircle}
              >
                <Text style={styles.scoreText}>{financialHealthScore}</Text>
                <Text style={styles.scoreLabel}>/ 100</Text>
              </LinearGradient>
              <View style={styles.scoreSummary}>
                <Text style={[styles.scoreSummaryText, { color: theme.colors.text }]}>
                  {healthAdvice}
                </Text>
              </View>
            </View>
          </SimpleAnimatedCard>

          {/* Фактори */}
          <SimpleAnimatedCard 
            variant="elevated" 
            style={styles.factorsCard}
            animationDelay={200}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Ключови фактори
            </Text>

            {factors.map((factor) => (
              <View key={factor.id} style={styles.factorItem}>
                <View style={styles.factorHeader}>
                  <Text style={[styles.factorName, { color: theme.colors.text }]}>
                    {factor.name}
                  </Text>
                  <Text style={[styles.factorScore, { color: getProgressColor(factor.score) }]}>
                    {factor.score}/{factor.maxScore}
                  </Text>
                </View>
                
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { 
                        backgroundColor: getProgressColor(factor.score), 
                        width: `${factor.score}%` 
                      }
                    ]} 
                  />
                </View>
                
                <Text style={[styles.factorDescription, { color: theme.colors.textSecondary }]}>
                  {factor.description}
                </Text>
              </View>
            ))}
          </SimpleAnimatedCard>

          {/* Препоръки */}
          <SimpleAnimatedCard 
            variant="elevated" 
            style={styles.recommendationsCard}
            animationDelay={300}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Препоръки за подобрение
            </Text>

            {recommendations.map((recommendation) => (
              <TouchableOpacity 
                key={recommendation.id} 
                style={styles.recommendationItem}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.priorityIndicator, 
                  { backgroundColor: getPriorityColor(recommendation.priority) }
                ]} />
                <View style={styles.recommendationContent}>
                  <Text style={[styles.recommendationTitle, { color: theme.colors.text }]}>
                    {recommendation.title}
                  </Text>
                  <Text style={[styles.recommendationDescription, { color: theme.colors.textSecondary }]}>
                    {recommendation.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </SimpleAnimatedCard>

          {/* Тренд */}
          <View style={[styles.trendCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Тренд на финансовото здраве
            </Text>
            <Text style={[styles.trendDescription, { color: theme.colors.textSecondary }]}>
              През последните 6 месеца вашият финансов индекс е нараснал с 8 точки. Продължавайте в същия дух!
            </Text>
            
            {/* Тук би могла да има графика, показваща тренда на финансово здраве */}
            <View style={[styles.chartPlaceholder, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.chartPlaceholderText, { color: theme.colors.textSecondary }]}>
                Графика на тренда (6 месеца)
              </Text>
            </View>
          </View>

          {/* Награди */}
          <View style={[styles.achievementsCard, { backgroundColor: theme.colors.card }]}>
            <View style={styles.achievementsHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Постижения
              </Text>
              <TouchableOpacity>
                <Text style={[styles.viewAllButton, { color: theme.colors.primary }]}>
                  Виж всички
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.achievementsContainer}>
              <View style={[styles.achievementItem, { backgroundColor: theme.colors.primary + '20' }]}>
                <Text style={styles.achievementEmoji}>🏆</Text>
                <Text style={[styles.achievementName, { color: theme.colors.text }]}>
                  Бюджетен майстор
                </Text>
              </View>
              <View style={[styles.achievementItem, { backgroundColor: theme.colors.primary + '20' }]}>
                <Text style={styles.achievementEmoji}>💰</Text>
                <Text style={[styles.achievementName, { color: theme.colors.text }]}>
                  Цел за спестяване
                </Text>
              </View>
              <View style={[styles.achievementItem, { backgroundColor: theme.colors.primary + '20' }]}>
                <Text style={styles.achievementEmoji}>📊</Text>
                <Text style={[styles.achievementName, { color: theme.colors.text }]}>
                  Анализатор
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
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
  scoreCard: {
    margin: 16,
    marginTop: 0,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  scoreStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreCircleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scoreText: {
    color: '#1A1A1A',
    fontSize: 32,
    fontWeight: '300',
  },
  scoreLabel: {
    color: 'rgba(26, 26, 26, 0.7)',
    fontSize: 14,
    fontWeight: '400',
  },
  scoreSummary: {
    flex: 1,
  },
  scoreSummaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  factorsCard: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  factorItem: {
    marginBottom: 16,
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  factorName: {
    fontSize: 16,
    fontWeight: '500',
  },
  factorScore: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  factorDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  recommendationsCard: {
    margin: 16,
    marginTop: 0,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  priorityIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  recommendationDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  trendCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
  },
  trendDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  chartPlaceholder: {
    height: 150,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholderText: {
    fontSize: 14,
  },
  achievementsCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    fontSize: 14,
    fontWeight: '500',
  },
  achievementsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  achievementItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 100,
  },
  contentContainer: {
    flex: 1,
    marginTop: -12,
    paddingTop: 20,
  },
});

export default FinancialHealthScreen; 