import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

// Тематичен контекст
import { useTheme } from '../utils/ThemeContext';
import { useBudgets } from '../utils/BudgetContext';
import { useTransactions } from '../utils/TransactionContext';
import { SCREENS } from '../utils/constants';

// Ширина на екрана за графиките
const screenWidth = Dimensions.get('window').width;

// Тип за параметрите на маршрута
type ParamList = {
  BudgetDetails: { id: string };
};

const BudgetDetailsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ParamList, 'BudgetDetails'>>();
  const { budgets, deleteBudget } = useBudgets();
  const { transactions } = useTransactions();
  
  // Намираме конкретния бюджет по ID
  const budgetId = route.params?.id;
  const budget = budgets.find(b => b.id === budgetId);

  // Ако няма намерен бюджет, показваме съобщение
  if (!budget) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            Бюджетът не е намерен
          </Text>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Назад</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Филтрираме транзакциите за тази категория (само разходи и само след създаване на бюджета)
  const budgetCreatedDate = new Date(budget.createdAt);
  const categoryTransactions = transactions.filter(t => {
    const transactionCreatedDate = new Date(t.createdAt);
    return t.category === budget.category && 
           t.amount < 0 && 
           transactionCreatedDate >= budgetCreatedDate; // Само транзакции след създаване на бюджета
  });

  // Последни транзакции (реални)
  const recentTransactions = categoryTransactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // Текущ месец транзакции за по-точни статистики (вече филтрирани по дата на създаване)
  const getCurrentMonthTransactions = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // categoryTransactions вече са филтрирани по дата на създаване на бюджета
    return categoryTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });
  };

  const currentMonthTransactions = getCurrentMonthTransactions();
  const currentMonthSpent = Math.abs(currentMonthTransactions.reduce((sum, t) => sum + t.amount, 0));

  // Изчисляване на общите статистики (всички транзакции)
  const realSpent = Math.abs(categoryTransactions.reduce((sum, t) => sum + t.amount, 0));
  const percentage = Math.min((currentMonthSpent / budget.budget) * 100, 100);
  const remaining = budget.budget - currentMonthSpent;

  // Средна сума на транзакция
  const getAverageTransactionAmount = () => {
    if (currentMonthTransactions.length === 0) return 0;
    return currentMonthSpent / currentMonthTransactions.length;
  };

  // Получаване на цвят на прогреса въз основа на процента
  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return theme.colors.error;
    if (percentage >= 80) return theme.colors.warning;
    return theme.colors.success;
  };

  // Колко дни остават до края на месеца
  const getRemainingDaysInMonth = () => {
    const currentDate = new Date();
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const currentDay = currentDate.getDate();
    return Math.max(0, lastDayOfMonth - currentDay);
  };

  // Прогноза за месеца базирана на текущия темп
  const getMonthlyForecast = () => {
    const remainingDays = getRemainingDaysInMonth();
    if (remainingDays === 0 || currentMonthTransactions.length === 0) {
      return currentMonthSpent; // Ако месецът е приключил или няма транзакции
    }
    
    const currentDate = new Date();
    const daysPassedInMonth = currentDate.getDate();
    const dailyAverage = currentMonthSpent / daysPassedInMonth;
    const projectedTotal = dailyAverage * new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    
    return projectedTotal;
  };

  // Дни до изчерпване на бюджета при текущия темп
  const getDaysUntilBudgetExhausted = () => {
    const remainingBudget = remaining;
    if (remainingBudget <= 0) return 0;
    
    const currentDate = new Date();
    const daysPassedInMonth = currentDate.getDate();
    
    if (currentMonthSpent === 0 || daysPassedInMonth === 0) return getRemainingDaysInMonth();
    
    const dailyAverage = currentMonthSpent / daysPassedInMonth;
    if (dailyAverage === 0) return getRemainingDaysInMonth();
    
    return Math.floor(remainingBudget / dailyAverage);
  };

  // Най-честа сума за транзакция
  const getMostCommonAmount = () => {
    if (currentMonthTransactions.length === 0) return 0;
    
    // Групираме по близки суми (± 5 лв)
    const amounts = currentMonthTransactions.map(t => Math.abs(t.amount));
    const roundedAmounts = amounts.map(a => Math.round(a / 5) * 5); // Закръгляме до най-близките 5 лв
    
    const frequency = roundedAmounts.reduce((acc, amount) => {
      acc[amount] = (acc[amount] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    if (Object.keys(frequency).length === 0) return 0;
    
    const mostCommon = Object.entries(frequency).reduce((a, b) => 
      frequency[parseInt(a[0])] > frequency[parseInt(b[0])] ? a : b
    );
    
    return parseInt(mostCommon[0]);
  };

  // Конфигурация за графиките
  const chartConfig = {
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => budget.color || theme.colors.primary,
    labelColor: (opacity = 1) => theme.colors.text,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: theme.dark ? '#1A1D1F' : '#FFFFFF',
    },
  };

  // Генериране на реални данни за месечна история
  const generateRealHistoryData = (): number[] => {
    const months = ['Ян', 'Фев', 'Мар', 'Апр', 'Май', 'Юни'];
    const currentDate = new Date();
    const data: number[] = [];

    months.forEach((_, monthIndex) => {
      const targetMonth = currentDate.getMonth() - (months.length - 1 - monthIndex);
      const targetYear = currentDate.getFullYear() + Math.floor(targetMonth / 12);
      const adjustedMonth = ((targetMonth % 12) + 12) % 12;

      const monthTransactions = categoryTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === adjustedMonth && 
               transactionDate.getFullYear() === targetYear;
      });

      const monthlySpent = Math.abs(monthTransactions.reduce((sum, t) => sum + t.amount, 0));
      data.push(monthlySpent);
    });

    return data;
  };

  // Генериране на седмични данни за текущия месец
  const generateWeeklyData = (): number[] => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const currentMonthTransactions = categoryTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    // Разделяме по седмици
    const weeks = ['1-7', '8-14', '15-21', '22-31'];
    const weeklyData: number[] = [0, 0, 0, 0];

    currentMonthTransactions.forEach(t => {
      const day = new Date(t.date).getDate();
      let weekIndex = 0;
      if (day <= 7) weekIndex = 0;
      else if (day <= 14) weekIndex = 1;
      else if (day <= 21) weekIndex = 2;
      else weekIndex = 3;

      weeklyData[weekIndex] += Math.abs(t.amount);
    });

    return weeklyData;
  };

  const historyData = {
    labels: ['Ян', 'Фев', 'Мар', 'Апр', 'Май', 'Юни'],
    data: generateRealHistoryData(),
  };

  const weeklyData = {
    labels: ['1-7', '8-14', '15-21', '22-31'],
    data: generateWeeklyData()
  };

  // Средна дневна сума
  const getDailyAverage = () => {
    if (categoryTransactions.length === 0) return 0;
    
    const dates = categoryTransactions.map(t => new Date(t.date));
    const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const latestDate = new Date(Math.max(...dates.map(d => d.getTime())));
    const daysDiff = Math.max(1, Math.ceil((latestDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    return currentMonthSpent / daysDiff;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(247, 231, 206, 0.2)', 'rgba(247, 231, 206, 0.1)']}
                  style={styles.backButtonGradient}
                >
                  <Text style={styles.backButtonText}>←</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <View style={styles.headerLeft}>
                <Text style={styles.headerTitle}>Детайли за бюджет</Text>
                <Text style={styles.headerSubtitle}>
                  {budget.category} • {budget.period || 'Месечен'}
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Заглавие и прогрес */}
        <View style={[styles.progressCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.progressCardContent}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryDot, { backgroundColor: budget.color }]} />
              <Text style={[styles.category, { color: theme.colors.text }]}>
                {budget.category}
              </Text>
            </View>
            <Text style={[styles.period, { color: theme.colors.textSecondary }]}>
              {budget.period || 'Месечен'} бюджет
            </Text>
            
            <View style={styles.progressContainer}>
              <View style={styles.amountsRow}>
                <Text style={[styles.spent, { color: theme.colors.text }]}>
                  {currentMonthSpent.toFixed(2)} лв.
                </Text>
                <Text style={[styles.budget, { color: theme.colors.textSecondary }]}>
                  / {budget.budget.toFixed(2)} лв.
                </Text>
              </View>
              
              <View style={[styles.progressBarContainer, { backgroundColor: theme.colors.background }]}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      backgroundColor: getProgressColor(percentage),
                      width: `${Math.min(percentage, 100)}%` 
                    }
                  ]} 
                />
              </View>
              
              <View style={styles.percentageRow}>
                <Text 
                  style={[
                    styles.percentage, 
                    { color: getProgressColor(percentage) }
                  ]}
                >
                  {percentage.toFixed(0)}%
                </Text>
                <Text style={[styles.remaining, { color: remaining >= 0 ? theme.colors.success : theme.colors.error }]}>
                  {remaining >= 0 ? `${remaining.toFixed(2)} лв. остават` : `Превишен с ${Math.abs(remaining).toFixed(2)} лв.`}
                </Text>
              </View>
            </View>

            {/* Статус badge */}
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: `${budget.isActive ? theme.colors.success : theme.colors.warning}20` }
              ]}>
                <Text style={[styles.statusText, { color: budget.isActive ? theme.colors.success : theme.colors.warning }]}>
                  {budget.isActive ? 'Активен' : 'Неактивен'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Допълнителни статистики */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
                      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Анализ за {budget.category} - само от {new Date(budget.createdAt).toLocaleDateString('bg-BG')}
            </Text>
          
          <View style={styles.analysisContainer}>
            <View style={styles.analysisItem}>
              <View style={styles.analysisIconContainer}>
                <LinearGradient
                  colors={[theme.colors.primary, `${theme.colors.primary}80`]}
                  style={styles.analysisIcon}
                >
                  <Text style={styles.analysisIconText}>📊</Text>
                </LinearGradient>
              </View>
              <View style={styles.analysisContent}>
                <Text style={[styles.analysisLabel, { color: theme.colors.textSecondary }]}>
                  Средна транзакция
                </Text>
                <Text style={[styles.analysisValue, { color: theme.colors.text }]}>
                  {getAverageTransactionAmount().toFixed(2)} лв.
                </Text>
              </View>
            </View>
            
            <View style={styles.analysisItem}>
              <View style={styles.analysisIconContainer}>
                <LinearGradient
                  colors={[theme.colors.accent, `${theme.colors.accent}80`]}
                  style={styles.analysisIcon}
                >
                  <Text style={styles.analysisIconText}>🔢</Text>
                </LinearGradient>
              </View>
              <View style={styles.analysisContent}>
                <Text style={[styles.analysisLabel, { color: theme.colors.textSecondary }]}>
                  Брой транзакции
                </Text>
                <Text style={[styles.analysisValue, { color: theme.colors.text }]}>
                  {currentMonthTransactions.length}
                </Text>
              </View>
            </View>
            
            <View style={styles.analysisItem}>
              <View style={styles.analysisIconContainer}>
                <LinearGradient
                  colors={[theme.colors.error, `${theme.colors.error}80`]}
                  style={styles.analysisIcon}
                >
                  <Text style={styles.analysisIconText}>🏆</Text>
                </LinearGradient>
              </View>
              <View style={styles.analysisContent}>
                <Text style={[styles.analysisLabel, { color: theme.colors.textSecondary }]}>
                  Най-голяма покупка
                </Text>
                <Text style={[styles.analysisValue, { color: theme.colors.text }]}>
                  {currentMonthTransactions.length > 0 
                    ? Math.abs(Math.min(...currentMonthTransactions.map(t => t.amount))).toFixed(2) + ' лв.'
                    : '0.00 лв.'
                  }
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* История на бюджета - само ако има данни */}
        {historyData.data.some(value => value > 0) && (
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              История на разходите за {budget.category}
            </Text>
            <LineChart
              data={{
                labels: historyData.labels,
                datasets: [
                  {
                    data: historyData.data.map(val => val || 0), // Избягваме NaN
                    color: (opacity = 1) => `${budget.color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`,
                    strokeWidth: 3,
                  },
                ],
              }}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              yAxisSuffix=" лв"
            />
          </View>
        )}

        {/* Разходи по седмици - само ако има данни */}
        {weeklyData.data.some(value => value > 0) && (
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Разходи по седмици този месец
            </Text>
            <BarChart
              data={{
                labels: weeklyData.labels,
                datasets: [
                  {
                    data: weeklyData.data.map(val => val || 0), // Избягваме NaN
                  }
                ]
              }}
              width={screenWidth - 64}
              height={220}
              chartConfig={{
                ...chartConfig,
                barPercentage: 0.7,
                color: (opacity = 1) => `${budget.color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`,
              }}
              style={styles.chart}
              yAxisLabel=""
              yAxisSuffix=" лв"
              fromZero
              showValuesOnTopOfBars
            />
          </View>
        )}

        {/* Последни транзакции - само реални транзакции */}
        {recentTransactions.length > 0 ? (
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Последни транзакции
              </Text>
              <TouchableOpacity>
                <Text style={[styles.seeAllButton, { color: theme.colors.primary }]}>
                  Виж всички ({categoryTransactions.length})
                </Text>
              </TouchableOpacity>
            </View>
            
            {recentTransactions.slice(0, 5).map((transaction) => (
              <TouchableOpacity 
                key={transaction.id}
                style={[styles.transactionItem, { borderBottomColor: theme.colors.border }]}
                onPress={() => navigation.navigate(
                  SCREENS.TRANSACTION_DETAILS, 
                  { id: transaction.id }
                )}
              >
                <View style={styles.transactionInfo}>
                  <View style={styles.transactionHeader}>
                    <Text style={[styles.transactionTitle, { color: theme.colors.text }]}>
                      {transaction.merchant}
                    </Text>
                    {transaction.icon && (
                      <Text style={styles.transactionIcon}>{transaction.icon}</Text>
                    )}
                  </View>
                  <Text style={[styles.transactionDate, { color: theme.colors.textSecondary }]}>
                    {new Date(transaction.date).toLocaleDateString('bg-BG')} • {transaction.emotionalState}
                  </Text>
                </View>
                <Text style={[styles.transactionAmount, { color: theme.colors.error }]}>
                  {transaction.amount.toFixed(2)} лв.
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Транзакции
            </Text>
            <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>
              Няма транзакции за категория "{budget.category}"
            </Text>
          </View>
        )}

        {/* Контекстуални правила */}
        {budget.contextualRules && budget.contextualRules.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Интелигентни правила
            </Text>
            
            {budget.contextualRules.map((rule, index) => (
              <View key={index} style={[styles.ruleItem, { borderBottomColor: theme.colors.border }]}>
                <View style={styles.ruleInfo}>
                  <Text style={[styles.ruleName, { color: theme.colors.text }]}>
                    {rule.type === 'seasonal' ? 'Сезонно' : 
                     rule.type === 'weather' ? 'Времето' :
                     rule.type === 'social' ? 'Социално' :
                     rule.type === 'emotional' ? 'Емоционално' :
                     rule.type === 'compensatory' ? 'Компенсиращо' : 'Правило'}
                  </Text>
                  <Text style={[styles.ruleDescription, { color: theme.colors.textSecondary }]}>
                    {rule.description}
                  </Text>
                </View>
                <Text style={[styles.ruleStatus, { color: theme.colors.success }]}>
                  Активно
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Бутони за действия */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: theme.colors.error }]}
            onPress={() => {
              Alert.alert(
                'Изтриване на бюджет',
                `Сигурни ли сте, че искате да изтриете бюджета за "${budget.category}"? Това действие не може да бъде отменено.`,
                [
                  {
                    text: 'Отказ',
                    style: 'cancel',
                  },
                  {
                    text: 'Изтрий',
                    style: 'destructive',
                    onPress: () => {
                      deleteBudget(budget.id);
                      navigation.goBack();
                    },
                  },
                ],
              );
            }}
          >
            <Text style={[styles.deleteButtonText, { color: '#FFFFFF' }]}>
              🗑️ Изтрий бюджет
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Нови header стилове
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
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  backButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(247, 231, 206, 0.3)',
    borderRadius: 22,
  },
  backButtonText: {
    fontSize: 20,
    color: '#F7E7CE',
    fontWeight: '600',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
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
  
  // Обновени стилове за съдържанието
  scrollView: {
    flex: 1,
    marginTop: -12,
    paddingTop: 20,
  },
  progressCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  progressCardContent: {
    // Existing styles remain the same
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  category: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  period: {
    fontSize: 14,
    marginBottom: 16,
  },
  progressContainer: {
    marginTop: 8,
  },
  amountsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  spent: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  budget: {
    fontSize: 16,
    marginLeft: 4,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 5,
    marginBottom: 8,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
  },
  percentageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  percentage: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  remaining: {
    fontSize: 14,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusBadge: {
    padding: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    margin: 16,
    marginTop: 0,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  seeAllButton: {
    fontSize: 14,
    fontWeight: '500',
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  transactionIcon: {
    marginLeft: 8,
  },
  transactionDate: {
    fontSize: 13,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  ruleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  ruleInfo: {
    flex: 1,
  },
  ruleName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  ruleDescription: {
    fontSize: 13,
  },
  ruleStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    margin: 16,
    marginTop: 0,
    marginBottom: 100,
  },
  deleteButton: {
    width: '100%',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  analysisContainer: {
    flexDirection: 'column',
    gap: 16,
  },
  analysisItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  analysisIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    overflow: 'hidden',
  },
  analysisIcon: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analysisIconText: {
    fontSize: 20,
  },
  analysisContent: {
    flex: 1,
  },
  analysisLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  analysisValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  noDataText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default BudgetDetailsScreen; 