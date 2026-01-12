import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import LinearGradient from 'react-native-linear-gradient';

// Модерни UI компоненти
import SimpleAnimatedCard from '../components/ui/SimpleAnimatedCard';
import PremiumButton from '../components/ui/PremiumButton';
import AnimatedStats from '../components/ui/AnimatedStats';

// Тематичен контекст
import { useTheme } from '../utils/ThemeContext';
import { useTransactions, Transaction } from '../utils/TransactionContext';
import { useBudgets } from '../utils/BudgetContext';
import { SCREENS } from '../utils/constants';

// Геймификация
import gamificationService from '../services/GamificationService';
import predictionService, { 
  PredictionResult, 
  CategoryAnalysis, 
  BudgetPrediction,
  SpendingPattern,
  MonthlyForecast,
  FinancialHealthScore
} from '../services/PredictionService';
import { useEffect } from 'react';

const screenWidth = Dimensions.get('window').width;

// Периоди за отчети
const reportPeriods = ['1М', '3М', '6М', '1Г', 'Всички'];

const ReportsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { transactions } = useTransactions();
  const { budgets } = useBudgets();
  const [activePeriod, setActivePeriod] = useState('1М');
  const [activeReport, setActiveReport] = useState('expenses'); // 'expenses', 'income', 'predictive'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 🎮 ГЕЙМИФИКАЦИЯ: Задействане при преглед на отчети
  useEffect(() => {
    try {
      // Задействаме геймификацията при отваряне на екрана
      gamificationService.onReportViewed(activeReport);
      
      console.log(`📊 Report viewed: ${activeReport}`);
    } catch (error) {
      console.error('Gamification report view error:', error);
    }
  }, [activeReport]); // Задействаме при промяна на активния отчет

  
  // Функция за филтриране на транзакции по период
  const getFilteredTransactions = useMemo(() => {
    try {
      setError(null);
      
      if (!transactions || transactions.length === 0) {
        return [];
      }

      const now = new Date();
      let startDate: Date;
      
      switch (activePeriod) {
        case '1М':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case '3М':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          break;
        case '6М':
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
          break;
        case '1Г':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
          break;
        default: // 'Всички'
          startDate = new Date(2020, 0, 1); // Далечна дата в миналото
          break;
      }

      return transactions.filter(t => {
        try {
          return new Date(t.date) >= startDate;
        } catch (dateError) {
          console.warn('Невалидна дата в транзакция:', t.date);
          return false;
        }
      });
    } catch (error) {
      console.error('Грешка при филтриране на транзакции:', error);
      setError('Грешка при зареждане на данните');
      return [];
    }
  }, [transactions, activePeriod]);

  // Изчисляване на месечни данни за последните 6 месеца
  const monthlyData = useMemo(() => {
    try {
      const months = ['Ян', 'Фев', 'Мар', 'Апр', 'Май', 'Юни', 'Юли', 'Авг', 'Сеп', 'Окт', 'Ное', 'Дек'];
      const now = new Date();
      const data: number[] = [];
      const labels: string[] = [];

      // Определяме колко месеца назад да покажем въз основа на избрания период
      let monthsToShow = 6;
      switch (activePeriod) {
        case '1М':
          monthsToShow = 3; // Показваме последните 3 месеца за по-добра визуализация
          break;
        case '3М':
          monthsToShow = 3;
          break;
        case '6М':
          monthsToShow = 6;
          break;
        case '1Г':
          monthsToShow = 12;
          break;
        default: // 'Всички'
          monthsToShow = 12;
          break;
      }

      for (let i = monthsToShow - 1; i >= 0; i--) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthTransactions = getFilteredTransactions.filter(t => {
          try {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === targetDate.getMonth() && 
                   transactionDate.getFullYear() === targetDate.getFullYear();
          } catch (dateError) {
            console.warn('Невалидна дата при месечни данни:', t.date);
            return false;
          }
        });

        let amount = 0;
        try {
          if (activeReport === 'expenses') {
            amount = Math.abs(monthTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + (t.amount || 0), 0));
          } else if (activeReport === 'income') {
            amount = monthTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + (t.amount || 0), 0);
          }
        } catch (calcError) {
          console.warn('Грешка при изчисляване на месечни суми:', calcError);
          amount = 0;
        }

        data.push(amount);
        labels.push(months[targetDate.getMonth()]);
      }

      return {
        labels: labels.length > 0 ? labels : ['Няма данни'],
        datasets: [{
          data: data.length > 0 && data.some(val => val > 0) ? data : [0],
          color: (opacity = 1) => `rgba(78, 127, 255, ${opacity})`,
          strokeWidth: 2,
        }],
      };
    } catch (error) {
      console.error('Грешка при изчисляване на месечни данни:', error);
      return {
        labels: ['Грешка'],
        datasets: [{
          data: [0],
          color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,
          strokeWidth: 2,
        }],
      };
    }
  }, [getFilteredTransactions, activeReport, activePeriod]);

  // Изчисляване на разходи по категории
  const expenseByCategory = useMemo(() => {
    try {
      const filteredTransactions = getFilteredTransactions.filter(t => t.amount < 0);
      
      if (filteredTransactions.length === 0) {
        return {
          labels: ['Няма данни'],
          datasets: [{ data: [0] }],
        };
      }

      const categoryTotals: { [key: string]: number } = {};

      filteredTransactions.forEach(t => {
        const category = t.category || 'Други';
        const amount = Math.abs(t.amount || 0);
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
      });

      const sortedCategories = Object.entries(categoryTotals)
        .filter(([, amount]) => amount > 0)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 6);

      if (sortedCategories.length === 0) {
        return {
          labels: ['Няма данни'],
          datasets: [{ data: [0] }],
        };
      }

      const labels = sortedCategories.map(([category]) => category);
      const data = sortedCategories.map(([, amount]) => amount);

      return {
        labels,
        datasets: [{ data }],
      };
    } catch (error) {
      console.error('Грешка при изчисляване на разходи по категории:', error);
      return {
        labels: ['Грешка'],
        datasets: [{ data: [0] }],
      };
    }
  }, [getFilteredTransactions]);

  // Pie chart данни за категории
  const pieChartData = useMemo(() => {
    try {
      const filteredTransactions = getFilteredTransactions.filter(t => t.amount < 0);
      
      if (filteredTransactions.length === 0) {
        return [];
      }

      const categoryTotals: { [key: string]: number } = {};

      filteredTransactions.forEach(t => {
        const category = t.category || 'Други';
        const amount = Math.abs(t.amount || 0);
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
      });

      const colors = ['#4E7FFF', '#FF7F4E', '#7F4EFF', '#4EFF7F', '#FF4E7F', '#4EFFF7'];
      
      return Object.entries(categoryTotals)
        .filter(([, amount]) => amount > 0)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 6)
        .map(([category, amount], index) => ({
          name: category,
          amount: amount,
          color: colors[index % colors.length],
          legendFontColor: theme.colors.textSecondary,
          legendFontSize: 12,
        }));
    } catch (error) {
      console.error('Грешка при изчисляване на pie chart данни:', error);
      return [];
    }
  }, [getFilteredTransactions, theme.colors.textSecondary]);

  // Предиктивни данни (базирани на исторически средни)
  const predictiveData = useMemo(() => {
    try {
      if (!getFilteredTransactions || getFilteredTransactions.length === 0) {
        return {
          labels: ['Няма данни'],
          datasets: [{ data: [0], color: (opacity = 1) => `rgba(78, 127, 255, ${opacity})`, strokeWidth: 2 }],
          legend: ['Няма данни'],
          meta: { expenseTrend: 0, incomeTrend: 0, historicalData: [], totalPredictedExpenses: 0, totalPredictedIncome: 0 }
        };
      }

      const now = new Date();
      const months = ['Ян', 'Фев', 'Мар', 'Апр', 'Май', 'Юни', 'Юли', 'Авг', 'Сеп', 'Окт', 'Ное', 'Дек'];
    
    // Генериране на следващите 6 месеца от днес
    const futureLabels: string[] = [];
    for (let i = 1; i <= 6; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      futureLabels.push(months[futureDate.getMonth()]);
    }
    
    // Анализ на исторически данни за последните 6-12 месеца
    const historicalData: { month: number, year: number, expenses: number, income: number }[] = [];
    
    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === targetDate.getMonth() && 
               transactionDate.getFullYear() === targetDate.getFullYear();
      });

      const expenses = Math.abs(monthTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
      const income = monthTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
      
      historicalData.push({
        month: targetDate.getMonth(),
        year: targetDate.getFullYear(),
        expenses,
        income
      });
    }

    // Изчисляване на тренд (линейна регресия)
    const calculateTrend = (values: number[]) => {
      if (values.length < 2) return 0;
      
      const n = values.length;
      const sumX = values.reduce((sum, _, i) => sum + i, 0);
      const sumY = values.reduce((sum, val) => sum + val, 0);
      const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
      const sumXX = values.reduce((sum, _, i) => sum + (i * i), 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      return isNaN(slope) ? 0 : slope;
    };

    const expenseValues = historicalData.map(d => d.expenses);
    const incomeValues = historicalData.map(d => d.income);
    
    const expenseTrend = calculateTrend(expenseValues);
    const incomeTrend = calculateTrend(incomeValues);

    // Изчисляване на сезонни фактори
    const getSeasonalFactor = (monthIndex: number, isExpense: boolean) => {
      const monthData = historicalData.filter(d => d.month === monthIndex);
      if (monthData.length === 0) return 1;
      
      const avgForMonth = monthData.reduce((sum, d) => sum + (isExpense ? d.expenses : d.income), 0) / monthData.length;
      const overallAvg = (isExpense ? expenseValues : incomeValues).reduce((sum, val) => sum + val, 0) / Math.max((isExpense ? expenseValues : incomeValues).length, 1);
      
      return overallAvg > 0 ? avgForMonth / overallAvg : 1;
    };

    // Прогнози за следващите 6 месеца
    const latestExpenses = expenseValues.slice(-6).reduce((sum, val) => sum + val, 0) / Math.max(6, 1);
    const latestIncome = incomeValues.slice(-6).reduce((sum, val) => sum + val, 0) / Math.max(6, 1);

    const predictedExpenses: number[] = [];
    const predictedIncome: number[] = [];

    for (let i = 0; i < 6; i++) {
      const futureMonth = (now.getMonth() + i + 1) % 12;
      
      // Базова прогноза с тренд
      const baseExpense = Math.max(0, latestExpenses + (expenseTrend * (i + 1)));
      const baseIncome = Math.max(0, latestIncome + (incomeTrend * (i + 1)));
      
      // Прилагане на сезонни фактори
      const seasonalExpense = baseExpense * getSeasonalFactor(futureMonth, true);
      const seasonalIncome = baseIncome * getSeasonalFactor(futureMonth, false);
      
      predictedExpenses.push(seasonalExpense);
      predictedIncome.push(seasonalIncome);
    }

    return {
      labels: futureLabels,
      datasets: [
        {
          data: predictedIncome.length > 0 && predictedIncome.some(val => val > 0) ? predictedIncome : [0],
          color: (opacity = 1) => `rgba(78, 127, 255, ${opacity})`,
          strokeWidth: 2,
        },
        {
          data: predictedExpenses.length > 0 && predictedExpenses.some(val => val > 0) ? predictedExpenses : [0],
          color: (opacity = 1) => `rgba(255, 127, 78, ${opacity})`,
          strokeWidth: 2,
        },
      ],
      legend: ['Предвидени приходи', 'Предвидени разходи'],
      // Добавяме метаданни за интелигентни анализи
      meta: {
        expenseTrend,
        incomeTrend,
        historicalData: historicalData.slice(-6), // Последните 6 месеца
        totalPredictedExpenses: predictedExpenses.reduce((sum, val) => sum + val, 0),
        totalPredictedIncome: predictedIncome.reduce((sum, val) => sum + val, 0),
      }
    };
    } catch (error) {
      console.error('Грешка при изчисляване на предиктивни данни:', error);
      return {
        labels: ['Грешка'],
        datasets: [{ data: [0], color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`, strokeWidth: 2 }],
        legend: ['Грешка'],
        meta: { expenseTrend: 0, incomeTrend: 0, historicalData: [], totalPredictedExpenses: 0, totalPredictedIncome: 0 }
      };
    }
  }, [getFilteredTransactions]);

  // Изчисляване на статистики
  const expenseStats = useMemo(() => {
    const filteredTransactions = getFilteredTransactions.filter(t => t.amount < 0);
    const totalExpenses = Math.abs(filteredTransactions.reduce((sum, t) => sum + t.amount, 0));
    const avgMonthly = totalExpenses / Math.max(activePeriod === '1М' ? 1 : parseInt(activePeriod.replace(/[^0-9]/g, '')) || 1, 1);
    const maxExpense = filteredTransactions.length > 0 ? Math.abs(Math.min(...filteredTransactions.map(t => t.amount))) : 0;

    // Сравнение с предишен период
    const previousPeriodTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const now = new Date();
      let startDate: Date, endDate: Date;

      switch (activePeriod) {
        case '1М':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        default:
          return false;
      }

      return transactionDate >= startDate && transactionDate <= endDate && t.amount < 0;
    });

    const previousTotal = Math.abs(previousPeriodTransactions.reduce((sum, t) => sum + t.amount, 0));
    const changePercent = previousTotal > 0 ? ((totalExpenses - previousTotal) / previousTotal * 100) : 0;

    return [
      {
        label: 'Средно месечно',
        value: `${avgMonthly.toFixed(0)} €`,
        change: 0,
        changeType: 'neutral' as 'neutral' | 'positive' | 'negative',
        color: theme.colors.text,
      },
      {
        label: 'Най-голям разход',
        value: `${maxExpense.toFixed(0)} €`,
        change: 0,
        changeType: 'neutral' as 'neutral' | 'positive' | 'negative',
        color: theme.colors.text,
      },
      {
        label: 'Спрямо миналия месец',
        value: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%`,
        changeType: (changePercent < 0 ? 'positive' : changePercent > 0 ? 'negative' : 'neutral') as 'neutral' | 'positive' | 'negative',
        color: changePercent < 0 ? theme.colors.success : changePercent > 0 ? theme.colors.error : theme.colors.text,
      },
    ];
  }, [getFilteredTransactions, activePeriod, transactions, theme.colors]);

  // Изчисляване на статистики за приходи
  const incomeStats = useMemo(() => {
    const filteredTransactions = getFilteredTransactions.filter(t => t.amount > 0);
    const totalIncome = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
    const avgMonthly = totalIncome / Math.max(activePeriod === '1М' ? 1 : parseInt(activePeriod.replace(/[^0-9]/g, '')) || 1, 1);
    const maxIncome = filteredTransactions.length > 0 ? Math.max(...filteredTransactions.map(t => t.amount)) : 0;

    // Сравнение с предишен период за приходи
    const previousPeriodTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const now = new Date();
      let startDate: Date, endDate: Date;

      switch (activePeriod) {
        case '1М':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case '3М':
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
          endDate = new Date(now.getFullYear(), now.getMonth() - 3, 0);
          break;
        case '6М':
          startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
          endDate = new Date(now.getFullYear(), now.getMonth() - 6, 0);
          break;
        default:
          return false;
      }

      return transactionDate >= startDate && transactionDate <= endDate && t.amount > 0;
    });

    const previousTotal = previousPeriodTransactions.reduce((sum, t) => sum + t.amount, 0);
    const changePercent = previousTotal > 0 ? ((totalIncome - previousTotal) / previousTotal * 100) : 0;

    return [
      {
        label: 'Средно месечно',
        value: `${avgMonthly.toFixed(0)} €`,
        change: 0,
        changeType: 'neutral' as 'neutral' | 'positive' | 'negative',
        color: theme.colors.text,
      },
      {
        label: 'Най-висок приход',
        value: `${maxIncome.toFixed(0)} €`,
        change: 0,
        changeType: 'neutral' as 'neutral' | 'positive' | 'negative',
        color: theme.colors.text,
      },
      {
        label: 'Спрямо предишния период',
        value: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%`,
        changeType: (changePercent > 0 ? 'positive' : changePercent < 0 ? 'negative' : 'neutral') as 'neutral' | 'positive' | 'negative',
        color: changePercent > 0 ? theme.colors.success : changePercent < 0 ? theme.colors.error : theme.colors.text,
      },
    ];
  }, [getFilteredTransactions, activePeriod, transactions, theme.colors]);
  
  // Конфигурация за графиките
  const chartConfig = {
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => theme.colors.primary,
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

  // Рендер на модерния селектор за периоди
  const renderPeriodSelector = useCallback(() => (
    <View style={styles.periodSelectorContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Период
      </Text>
      <View style={styles.periodSelector}>
        {reportPeriods.map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              {
                backgroundColor: activePeriod === period ? '#D4AF37' : 'rgba(0, 0, 0, 0.05)',
              },
            ]}
            onPress={() => setActivePeriod(period)}
            activeOpacity={0.8}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              style={[
                styles.periodButtonText,
                {
                  color: activePeriod === period ? '#1A1A1A' : theme.colors.textSecondary,
                  fontWeight: activePeriod === period ? '600' : '500',
                },
              ]}
            >
              {period}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  ), [activePeriod, theme.colors]);

  // Рендер на модерния селектор за тип отчет
  const renderReportTypeSelector = useCallback(() => (
    <View style={styles.reportTypeSelectorContainer}>
      <SimpleAnimatedCard variant="elevated" style={styles.reportTypeCard} animationDelay={100}>
    <View style={styles.reportTypeSelector}>
      <TouchableOpacity
        style={[
          styles.reportTypeButton,
              activeReport === 'expenses' && styles.activeReportTypeButton,
        ]}
        onPress={() => setActiveReport('expenses')}
            activeOpacity={0.8}
      >
            <Text style={styles.reportTypeIcon}>💸</Text>
        <Text
          style={[
            styles.reportTypeText,
                { color: activeReport === 'expenses' ? theme.colors.primary : theme.colors.textSecondary },
          ]}
        >
          Разходи
        </Text>
      </TouchableOpacity>
          
      <TouchableOpacity
        style={[
          styles.reportTypeButton,
              activeReport === 'income' && styles.activeReportTypeButton,
        ]}
        onPress={() => setActiveReport('income')}
            activeOpacity={0.8}
      >
            <Text style={styles.reportTypeIcon}>💰</Text>
        <Text
          style={[
            styles.reportTypeText,
                { color: activeReport === 'income' ? theme.colors.primary : theme.colors.textSecondary },
          ]}
        >
          Приходи
        </Text>
      </TouchableOpacity>
          
      <TouchableOpacity
        style={[
          styles.reportTypeButton,
              activeReport === 'predictive' && styles.activeReportTypeButton,
        ]}
        onPress={() => setActiveReport('predictive')}
            activeOpacity={0.8}
      >
            <Text style={styles.reportTypeIcon}>🔮</Text>
        <Text
          style={[
            styles.reportTypeText,
                { color: activeReport === 'predictive' ? theme.colors.primary : theme.colors.textSecondary },
          ]}
        >
          Предиктивни
        </Text>
      </TouchableOpacity>
        </View>
      </SimpleAnimatedCard>
    </View>
  ), [activeReport, theme.colors]);

  // Рендер на съдържание за разходи
  const renderExpensesContent = () => (
    <View>
      {pieChartData.length > 0 ? (
      <SimpleAnimatedCard variant="glass" style={styles.reportCard} animationDelay={200}>
        <View style={styles.reportCardHeader}>
          <Text style={styles.reportCardIcon}>📊</Text>
        <Text style={[styles.reportCardTitle, { color: theme.colors.text }]}>
          Разходи по категории
        </Text>
        </View>
        <PieChart
          data={pieChartData}
          width={screenWidth - 64}
          height={200}
          chartConfig={chartConfig}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft="15"
          avoidFalseZero
        />
      </SimpleAnimatedCard>
      ) : (
        <SimpleAnimatedCard variant="glass" style={styles.reportCard} animationDelay={200}>
          <View style={styles.reportCardHeader}>
            <Text style={styles.reportCardIcon}>📊</Text>
            <Text style={[styles.reportCardTitle, { color: theme.colors.text }]}>
              Разходи по категории
            </Text>
          </View>
          <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>
            Няма данни за избрания период
          </Text>
        </SimpleAnimatedCard>
      )}

      <SimpleAnimatedCard variant="elevated" style={styles.reportCard} animationDelay={250}>
        <View style={styles.reportCardHeader}>
          <Text style={styles.reportCardIcon}>📈</Text>
        <Text style={[styles.reportCardTitle, { color: theme.colors.text }]}>
          Разходи по месеци
        </Text>
        </View>
        {monthlyData.datasets[0].data.some(val => val > 0) ? (
        <BarChart
            data={monthlyData}
          width={screenWidth - 64}
          height={220}
          chartConfig={{
            ...chartConfig,
            barPercentage: 0.7,
            color: (opacity = 1) => `rgba(255, 127, 78, ${opacity})`,
          }}
          style={styles.chart}
          yAxisLabel=""
          yAxisSuffix=" €"
          fromZero
        />
        ) : (
          <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>
            Няма данни за избрания период
          </Text>
        )}
      </SimpleAnimatedCard>

      <AnimatedStats
        stats={expenseStats}
        variant="horizontal"
        style={styles.statsContainer}
        animationDelay={300}
      />
    </View>
  );

  // Рендер на съдържание за приходи
  const renderIncomeContent = () => (
    <View>
      <SimpleAnimatedCard variant="elevated" style={styles.reportCard} animationDelay={300}>
        <View style={styles.reportCardHeader}>
          <Text style={styles.reportCardIcon}>📈</Text>
        <Text style={[styles.reportCardTitle, { color: theme.colors.text }]}>
          Приходи по месеци
        </Text>
        </View>
        {monthlyData.datasets[0].data.some(val => val > 0) ? (
        <LineChart
          data={monthlyData}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          yAxisSuffix=" €"
        />
        ) : (
          <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>
            Няма данни за избрания период
          </Text>
        )}
      </SimpleAnimatedCard>

      <AnimatedStats
        stats={incomeStats}
        variant="horizontal"
        style={styles.statsContainer}
        animationDelay={350}
      />

      <SimpleAnimatedCard variant="glass" style={styles.reportCard} animationDelay={400}>
        <View style={styles.reportCardHeader}>
          <Text style={styles.reportCardIcon}>📈</Text>
        <Text style={[styles.reportCardTitle, { color: theme.colors.text }]}>
          Тренд на приходи
        </Text>
        </View>
        <Text style={[styles.reportDescription, { color: theme.colors.textSecondary }]}>
          {getFilteredTransactions.filter(t => t.amount > 0).length > 0 
            ? "Анализ базиран на вашите реални данни за избрания период."
            : "Няма достатъчно данни за анализ на тренда."
          }
        </Text>
      </SimpleAnimatedCard>
    </View>
  );

  // Рендер на съдържание за предиктивни отчети
  // Компонент за loading състояние
  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
        Зареждане на данни...
      </Text>
    </View>
  );

  // Компонент за error състояние
  const renderErrorState = () => (
    <SimpleAnimatedCard variant="elevated" style={styles.errorCard}>
      <View style={styles.errorContent}>
        <Text style={styles.errorIcon}>⚠️</Text>
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
            setIsLoading(true);
            // Симулираме презареждане
            setTimeout(() => setIsLoading(false), 1000);
          }}
        >
          <Text style={styles.retryButtonText}>Опитай отново</Text>
        </TouchableOpacity>
      </View>
    </SimpleAnimatedCard>
  );

  const renderPredictiveContent = () => {
    // Инициализиране на PredictionService с текущите данни
    predictionService.initialize(transactions, budgets);
    
    // Генериране на всички интелигентни предвиждания
    const allPredictions = predictionService.generateAllPredictions();
    const { 
      predictions, 
      categoryAnalyses, 
      budgetPredictions, 
      patterns, 
      forecasts, 
      healthScore 
    } = allPredictions;

    // Ако няма достатъчно данни, показваме демо режим
    const hasData = transactions.length > 0;
    const isDemo = !hasData;
    
    // Демо транзакции за визуализация когато няма реални данни
    const demoTransactions: Transaction[] = isDemo ? [
      { id: '1', amount: -150, category: 'Храна', date: new Date().toISOString(), merchant: 'Kaufland', emotionalState: 'neutral', paymentMethod: 'card', createdAt: new Date() },
      { id: '2', amount: -45, category: 'Транспорт', date: new Date(Date.now() - 86400000).toISOString(), merchant: 'Shell', emotionalState: 'neutral', paymentMethod: 'card', createdAt: new Date() },
      { id: '3', amount: -89, category: 'Забавления', date: new Date(Date.now() - 172800000).toISOString(), merchant: 'Cinema City', emotionalState: 'happy', paymentMethod: 'card', createdAt: new Date() },
      { id: '4', amount: 2500, category: 'Заплата', date: new Date(Date.now() - 259200000).toISOString(), merchant: 'Работодател', emotionalState: 'happy', paymentMethod: 'bank', createdAt: new Date() },
      { id: '5', amount: -200, category: 'Битови', date: new Date(Date.now() - 345600000).toISOString(), merchant: 'EVN', emotionalState: 'neutral', paymentMethod: 'bank', createdAt: new Date() },
      { id: '6', amount: -75, category: 'Здраве', date: new Date(Date.now() - 432000000).toISOString(), merchant: 'Аптека', emotionalState: 'neutral', paymentMethod: 'card', createdAt: new Date() },
      { id: '7', amount: -320, category: 'Храна', date: new Date(Date.now() - 604800000).toISOString(), merchant: 'Lidl', emotionalState: 'neutral', paymentMethod: 'card', createdAt: new Date() },
      { id: '8', amount: -55, category: 'Транспорт', date: new Date(Date.now() - 691200000).toISOString(), merchant: 'OMV', emotionalState: 'neutral', paymentMethod: 'card', createdAt: new Date() },
      { id: '9', amount: 500, category: 'Бонус', date: new Date(Date.now() - 1209600000).toISOString(), merchant: 'Работодател', emotionalState: 'happy', paymentMethod: 'bank', createdAt: new Date() },
      { id: '10', amount: -180, category: 'Храна', date: new Date(Date.now() - 1296000000).toISOString(), merchant: 'Billa', emotionalState: 'neutral', paymentMethod: 'card', createdAt: new Date() },
    ] : [];
    
    // Използваме реални или демо данни
    const dataToUse = hasData ? transactions : demoTransactions;
    
    // Реинициализираме сервиза с правилните данни
    if (isDemo) {
      predictionService.initialize(demoTransactions, budgets);
    }

    // Функция за определяне на цвета на предвиждането
    const getPredictionColor = (type: string) => {
      switch (type) {
        case 'success': return '#10B981';
        case 'warning': return '#F59E0B';
        case 'danger': return '#EF4444';
        default: return theme.colors.primary;
      }
    };

    // Функция за определяне на бекграунд цвета
    const getPredictionBgColor = (type: string) => {
      switch (type) {
        case 'success': return 'rgba(16, 185, 129, 0.1)';
        case 'warning': return 'rgba(245, 158, 11, 0.1)';
        case 'danger': return 'rgba(239, 68, 68, 0.1)';
        default: return 'rgba(99, 102, 241, 0.1)';
      }
    };

    return (
      <View>
        {/* === ДЕМО БАНЕР === */}
        {isDemo && (
          <View style={styles.demoBanner}>
            <Text style={styles.demoBannerIcon}>🎯</Text>
            <View style={styles.demoBannerContent}>
              <Text style={styles.demoBannerTitle}>Демо режим</Text>
              <Text style={styles.demoBannerText}>
                Показваме примерни данни. Добавете транзакции за реални анализи.
              </Text>
            </View>
          </View>
        )}

        {/* === ФИНАНСОВО ЗДРАВЕ === */}
        <SimpleAnimatedCard variant="elevated" style={styles.reportCard} animationDelay={200}>
          <View style={styles.reportCardHeader}>
            <Text style={styles.reportCardIcon}>💪</Text>
            <Text style={[styles.reportCardTitle, { color: theme.colors.text }]}>
              Финансово здраве
            </Text>
          </View>
          
          {/* Кръгов индикатор за здраве */}
          <View style={styles.healthScoreContainer}>
            <View style={[
              styles.healthScoreCircle,
              { 
                borderColor: healthScore.overall >= 70 ? '#10B981' : 
                             healthScore.overall >= 40 ? '#F59E0B' : '#EF4444'
              }
            ]}>
              <Text style={[
                styles.healthScoreValue,
                { 
                  color: healthScore.overall >= 70 ? '#10B981' : 
                         healthScore.overall >= 40 ? '#F59E0B' : '#EF4444'
                }
              ]}>
                {healthScore.overall}
              </Text>
              <Text style={[styles.healthScoreLabel, { color: theme.colors.textSecondary }]}>
                / 100
              </Text>
            </View>
            <Text style={[styles.healthScoreText, { color: theme.colors.text }]}>
              {healthScore.overall >= 80 ? 'Отлично!' : 
               healthScore.overall >= 60 ? 'Добре' : 
               healthScore.overall >= 40 ? 'Средно' : 'Нужна е работа'}
            </Text>
          </View>

          {/* Детайли за здравето */}
          <View style={styles.healthDetailsContainer}>
            <View style={styles.healthDetailRow}>
              <Text style={[styles.healthDetailLabel, { color: theme.colors.textSecondary }]}>
                🐷 Спестявания
              </Text>
              <Text style={[styles.healthDetailValue, { color: theme.colors.text }]}>
                {healthScore.savingsRate >= 0 ? '+' : ''}{healthScore.savingsRate}%
              </Text>
            </View>
            <View style={styles.healthDetailRow}>
              <Text style={[styles.healthDetailLabel, { color: theme.colors.textSecondary }]}>
                📊 Бюджети
              </Text>
              <Text style={[styles.healthDetailValue, { color: theme.colors.text }]}>
                {healthScore.budgetAdherence}%
              </Text>
            </View>
            <View style={styles.healthDetailRow}>
              <Text style={[styles.healthDetailLabel, { color: theme.colors.textSecondary }]}>
                📈 Стабилност
              </Text>
              <Text style={[styles.healthDetailValue, { color: theme.colors.text }]}>
                {healthScore.spendingStability}%
              </Text>
            </View>
          </View>
        </SimpleAnimatedCard>

        {/* === ПРОГНОЗА ЗА 6 МЕСЕЦА === */}
        <SimpleAnimatedCard variant="elevated" style={styles.reportCard} animationDelay={300}>
          <View style={styles.reportCardHeader}>
            <Text style={styles.reportCardIcon}>🔮</Text>
            <Text style={[styles.reportCardTitle, { color: theme.colors.text }]}>
              Прогноза за следващите 6 месеца
            </Text>
          </View>
          
          {predictiveData.datasets && predictiveData.datasets[0] && predictiveData.datasets[0].data.some((val: number) => val > 0) ? (
            <LineChart
              data={predictiveData}
              width={screenWidth - 32}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              yAxisSuffix=" €"
            />
          ) : (
            <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>
              Няма достатъчно исторически данни за графика
            </Text>
          )}

          {/* Детайли за прогнозата */}
          <View style={styles.forecastSummary}>
            {forecasts.slice(0, 3).map((forecast, index) => (
              <View key={index} style={styles.forecastItem}>
                <Text style={[styles.forecastMonth, { color: theme.colors.text }]}>
                  {forecast.month}
                </Text>
                <Text style={[
                  styles.forecastValue, 
                  { color: forecast.predictedSavings >= 0 ? '#10B981' : '#EF4444' }
                ]}>
                  {forecast.predictedSavings >= 0 ? '+' : ''}{forecast.predictedSavings.toFixed(0)} €
                </Text>
                <Text style={[styles.forecastConfidence, { color: theme.colors.textSecondary }]}>
                  {forecast.confidence}% увереност
                </Text>
              </View>
            ))}
          </View>
        </SimpleAnimatedCard>

        {/* === ИНТЕЛИГЕНТНИ ПРЕДВИЖДАНИЯ === */}
        <SimpleAnimatedCard variant="glass" style={styles.reportCard} animationDelay={400}>
          <View style={styles.reportCardHeader}>
            <Text style={styles.reportCardIcon}>🧠</Text>
            <Text style={[styles.reportCardTitle, { color: theme.colors.text }]}>
              Интелигентни предвиждания
            </Text>
          </View>
          
          {predictions.length > 0 ? (
            predictions.slice(0, 5).map((prediction, index) => (
              <View 
                key={index} 
                style={[
                  styles.advancedPredictionItem,
                  { backgroundColor: getPredictionBgColor(prediction.type) }
                ]}
              >
                <View style={styles.predictionHeader}>
                  <Text style={styles.predictionIcon}>{prediction.icon}</Text>
                  <View style={styles.predictionTitleContainer}>
                    <Text style={[styles.predictionTitle, { color: theme.colors.text }]}>
                      {prediction.title}
                    </Text>
                    <View style={[
                      styles.predictionBadge,
                      { backgroundColor: getPredictionColor(prediction.type) }
                    ]}>
                      <Text style={styles.predictionBadgeText}>
                        {prediction.category === 'trend' ? 'Тренд' :
                         prediction.category === 'budget' ? 'Бюджет' :
                         prediction.category === 'anomaly' ? 'Аномалия' :
                         prediction.category === 'savings' ? 'Спестявания' :
                         prediction.category === 'spending' ? 'Разходи' :
                         prediction.category === 'pattern' ? 'Паттерн' : 'Съвет'}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={[styles.predictionDescription, { color: theme.colors.textSecondary }]}>
                  {prediction.text}
                </Text>
                {prediction.actionable && (
                  <TouchableOpacity style={[styles.predictionAction, { borderColor: getPredictionColor(prediction.type) }]}>
                    <Text style={[styles.predictionActionText, { color: getPredictionColor(prediction.type) }]}>
                      {prediction.action || 'Виж детайли'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          ) : (
            <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>
              Добавете повече транзакции за персонализирани съвети
            </Text>
          )}
        </SimpleAnimatedCard>

        {/* === АНАЛИЗ ПО КАТЕГОРИИ === */}
        {categoryAnalyses.length > 0 && (
          <SimpleAnimatedCard variant="elevated" style={styles.reportCard} animationDelay={500}>
            <View style={styles.reportCardHeader}>
              <Text style={styles.reportCardIcon}>📊</Text>
              <Text style={[styles.reportCardTitle, { color: theme.colors.text }]}>
                Топ категории с промени
              </Text>
            </View>
            
            {categoryAnalyses.slice(0, 4).map((analysis, index) => (
              <View key={index} style={styles.categoryAnalysisItem}>
                <View style={styles.categoryAnalysisLeft}>
                  <Text style={[styles.categoryName, { color: theme.colors.text }]}>
                    {analysis.category}
                  </Text>
                  <Text style={[styles.categorySpending, { color: theme.colors.textSecondary }]}>
                    {analysis.currentMonthSpending.toFixed(0)} € този месец
                  </Text>
                </View>
                <View style={styles.categoryAnalysisRight}>
                  <View style={[
                    styles.trendIndicator,
                    { backgroundColor: analysis.trendPercent > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' }
                  ]}>
                    <Text style={[
                      styles.trendText,
                      { color: analysis.trendPercent > 0 ? '#EF4444' : '#10B981' }
                    ]}>
                      {analysis.trendPercent > 0 ? '↑' : '↓'} {Math.abs(analysis.trendPercent).toFixed(0)}%
                    </Text>
                  </View>
                  {analysis.isAnomaly && (
                    <Text style={styles.anomalyBadge}>⚠️</Text>
                  )}
                </View>
              </View>
            ))}
          </SimpleAnimatedCard>
        )}

        {/* === БЮДЖЕТНИ ПРОГНОЗИ === */}
        {budgetPredictions.length > 0 && (
          <SimpleAnimatedCard variant="glass" style={styles.reportCard} animationDelay={600}>
            <View style={styles.reportCardHeader}>
              <Text style={styles.reportCardIcon}>💰</Text>
              <Text style={[styles.reportCardTitle, { color: theme.colors.text }]}>
                Прогнози за бюджети
              </Text>
            </View>
            
            {budgetPredictions.slice(0, 3).map((budget, index) => (
              <View key={index} style={styles.budgetPredictionItem}>
                <View style={styles.budgetPredictionHeader}>
                  <Text style={[styles.budgetCategory, { color: theme.colors.text }]}>
                    {budget.category}
                  </Text>
                  {budget.willExceed && (
                    <View style={styles.warningBadge}>
                      <Text style={styles.warningBadgeText}>⚠️ Ще превиши</Text>
                    </View>
                  )}
                </View>
                
                {/* Прогрес бар */}
                <View style={styles.budgetProgressContainer}>
                  <View style={[styles.budgetProgressBg, { backgroundColor: theme.colors.border }]}>
                    <View 
                      style={[
                        styles.budgetProgressFill,
                        { 
                          width: `${Math.min((budget.spent / budget.budget) * 100, 100)}%`,
                          backgroundColor: budget.willExceed ? '#EF4444' : 
                                          (budget.spent / budget.budget) > 0.8 ? '#F59E0B' : '#10B981'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.budgetProgressText, { color: theme.colors.textSecondary }]}>
                    {budget.spent.toFixed(0)} / {budget.budget.toFixed(0)} €
                  </Text>
                </View>
                
                <View style={styles.budgetPredictionDetails}>
                  <Text style={[styles.budgetDetailText, { color: theme.colors.textSecondary }]}>
                    📅 Остават {budget.daysRemaining} дни
                  </Text>
                  <Text style={[styles.budgetDetailText, { color: theme.colors.textSecondary }]}>
                    💡 Дневен лимит: {budget.recommendedDailyLimit.toFixed(0)} €
                  </Text>
                </View>
                
                {budget.predictedEndDate && (
                  <Text style={[styles.budgetWarningText, { color: '#EF4444' }]}>
                    ⏰ Изчерпва се на {budget.predictedEndDate.toLocaleDateString('bg-BG')}
                  </Text>
                )}
              </View>
            ))}
          </SimpleAnimatedCard>
        )}

        {/* === СЕДМИЧНИ ПАТТЕРНИ === */}
        {patterns.some(p => p.transactionCount > 0) && (
          <SimpleAnimatedCard variant="elevated" style={styles.reportCard} animationDelay={700}>
            <View style={styles.reportCardHeader}>
              <Text style={styles.reportCardIcon}>📆</Text>
              <Text style={[styles.reportCardTitle, { color: theme.colors.text }]}>
                Седмични паттерни
              </Text>
            </View>
            
            <View style={styles.patternsContainer}>
              {patterns.filter(p => p.transactionCount > 0).map((pattern, index) => (
                <View key={index} style={styles.patternItem}>
                  <Text style={[styles.patternDay, { color: theme.colors.text }]}>
                    {pattern.dayOfWeek.substring(0, 3)}
                  </Text>
                  <View style={[
                    styles.patternBar,
                    { 
                      height: Math.max(4, (pattern.averageSpending / Math.max(...patterns.map(p => p.averageSpending))) * 60),
                      backgroundColor: theme.colors.primary
                    }
                  ]} />
                  <Text style={[styles.patternAmount, { color: theme.colors.textSecondary }]}>
                    {pattern.averageSpending.toFixed(0)}€
                  </Text>
                </View>
              ))}
            </View>
            
            <Text style={[styles.patternInsight, { color: theme.colors.textSecondary }]}>
              💡 Най-активен ден: {patterns.reduce((max, p) => p.averageSpending > max.averageSpending ? p : max, patterns[0]).dayOfWeek}
            </Text>
          </SimpleAnimatedCard>
        )}
      </View>
    );
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
              <View style={styles.headerLeft}>
                <Text style={styles.headerTitle}>Отчети и Анализи</Text>
                <Text style={styles.headerSubtitle}>
                  Детайлен преглед на финансите
          </Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
        </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {error ? (
            renderErrorState()
          ) : isLoading ? (
            renderLoadingState()
          ) : (
            <>
              {renderPeriodSelector()}
              {renderReportTypeSelector()}

              {activeReport === 'expenses' && renderExpensesContent()}
              {activeReport === 'income' && renderIncomeContent()}
              {activeReport === 'predictive' && renderPredictiveContent()}
            </>
          )}
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
  exportButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  exportButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(247, 231, 206, 0.3)',
    borderRadius: 22,
  },
  exportButtonText: {
    fontSize: 18,
    color: '#F7E7CE',
  },
  
  scrollView: {
    flex: 1,
    marginTop: -12,
  },
  contentContainer: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  
  // Период селектор
  periodSelectorContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  activePeriodButton: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  periodButtonGradient: {
    width: '100%',
    height: '100%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  activePeriodButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  
  // Тип отчет селектор
  reportTypeSelectorContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  reportTypeCard: {
    overflow: 'hidden',
  },
  reportTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  reportTypeButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 80,
  },
  activeReportTypeButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  reportTypeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  reportTypeText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Карти за отчети
  reportCard: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  reportCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  reportCardIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  reportCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  reportDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  chart: {
    borderRadius: 16,
    paddingRight: 20,
  },
  
  // Статистики
  statsContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  
  // === СТИЛОВЕ ЗА ИНТЕЛИГЕНТНИ ПРЕДВИЖДАНИЯ ===
  
  // Demo Banner
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  demoBannerIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  demoBannerContent: {
    flex: 1,
  },
  demoBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
    marginBottom: 2,
  },
  demoBannerText: {
    fontSize: 13,
    color: '#6366F1',
    opacity: 0.8,
  },

  // Empty State
  emptyStateContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Health Score
  healthScoreContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  healthScoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  healthScoreValue: {
    fontSize: 36,
    fontWeight: '700',
  },
  healthScoreLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  healthScoreText: {
    fontSize: 18,
    fontWeight: '600',
  },
  healthDetailsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  healthDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  healthDetailLabel: {
    fontSize: 14,
  },
  healthDetailValue: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Forecast Summary
  forecastSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  forecastItem: {
    alignItems: 'center',
    flex: 1,
  },
  forecastMonth: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  forecastValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  forecastConfidence: {
    fontSize: 11,
    marginTop: 2,
  },

  // Advanced Predictions
  advancedPredictionItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  predictionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  predictionTitleContainer: {
    flex: 1,
  },
  predictionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  predictionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  predictionBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  predictionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 36,
  },
  predictionAction: {
    alignSelf: 'flex-start',
    marginLeft: 36,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 8,
  },
  predictionActionText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Category Analysis
  categoryAnalysisItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  categoryAnalysisLeft: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  categorySpending: {
    fontSize: 13,
  },
  categoryAnalysisRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '600',
  },
  anomalyBadge: {
    fontSize: 16,
    marginLeft: 8,
  },

  // Budget Predictions
  budgetPredictionItem: {
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    marginBottom: 12,
  },
  budgetPredictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '600',
  },
  warningBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  warningBadgeText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '500',
  },
  budgetProgressContainer: {
    marginBottom: 8,
  },
  budgetProgressBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetProgressText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  budgetPredictionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetDetailText: {
    fontSize: 12,
  },
  budgetWarningText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },

  // Patterns
  patternsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 100,
    marginTop: 8,
  },
  patternItem: {
    alignItems: 'center',
    flex: 1,
  },
  patternDay: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  patternBar: {
    width: 24,
    borderRadius: 4,
    minHeight: 4,
  },
  patternAmount: {
    fontSize: 10,
    marginTop: 4,
  },
  patternInsight: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },

  // Legacy styles (kept for compatibility)
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  predictionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 8,
  },
  predictionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  noDataText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    padding: 20,
  },
  
  // Loading и Error стилове
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  errorCard: {
    marginHorizontal: 20,
    marginVertical: 20,
  },
  errorContent: {
    alignItems: 'center',
    padding: 20,
  },
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
});

export default ReportsScreen; 