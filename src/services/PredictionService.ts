/**
 * PredictionService - Интелигентна система за финансови предвиждания
 * 
 * Този сервиз предоставя напреднали AI-базирани анализи и прогнози:
 * - Линейна регресия за тенденции
 * - Сезонни фактори
 * - Детекция на аномалии
 * - Анализ по категории
 * - Персонализирани финансови съвети
 * - Прогнози за бюджети
 * - Седмични и дневни паттерни
 */

import { Transaction } from '../utils/TransactionContext';
import { Budget } from '../utils/BudgetContext';

// ================== ТИПОВЕ ==================

export interface PredictionResult {
  type: 'success' | 'warning' | 'info' | 'danger';
  category: 'trend' | 'budget' | 'anomaly' | 'savings' | 'spending' | 'advice' | 'pattern';
  title: string;
  text: string;
  value?: number;
  icon: string;
  priority: number; // 1-10, по-високо = по-важно
  actionable?: boolean;
  action?: string;
}

export interface CategoryAnalysis {
  category: string;
  currentMonthSpending: number;
  lastMonthSpending: number;
  averageSpending: number;
  trend: number; // положително = нарастване, отрицателно = намаляване
  trendPercent: number;
  isAnomaly: boolean;
  predictedNextMonth: number;
}

export interface SpendingPattern {
  dayOfWeek: string;
  averageSpending: number;
  transactionCount: number;
  topCategory: string;
}

export interface MonthlyForecast {
  month: string;
  predictedIncome: number;
  predictedExpenses: number;
  predictedSavings: number;
  confidence: number; // 0-100%
}

export interface BudgetPrediction {
  budgetId: string;
  category: string;
  budget: number;
  spent: number;
  daysRemaining: number;
  predictedEndDate: Date | null;
  willExceed: boolean;
  projectedOverspend: number;
  dailyBurnRate: number;
  recommendedDailyLimit: number;
}

export interface FinancialHealthScore {
  overall: number; // 0-100
  savingsRate: number;
  budgetAdherence: number;
  spendingStability: number;
  incomeStability: number;
  recommendations: string[];
}

// ================== ПОМОЩНИ ФУНКЦИИ ==================

const months = ['Ян', 'Фев', 'Мар', 'Апр', 'Май', 'Юни', 'Юли', 'Авг', 'Сеп', 'Окт', 'Ное', 'Дек'];
const fullMonths = ['Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни', 'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'];
const daysOfWeek = ['Неделя', 'Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота'];

/**
 * Изчислява линейна регресия за определяне на тренд
 */
const calculateLinearRegression = (values: number[]): { slope: number; intercept: number; r2: number } => {
  if (values.length < 2) return { slope: 0, intercept: 0, r2: 0 };
  
  const n = values.length;
  const sumX = values.reduce((sum, _, i) => sum + i, 0);
  const sumY = values.reduce((sum, val) => sum + val, 0);
  const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
  const sumXX = values.reduce((sum, _, i) => sum + (i * i), 0);
  const sumYY = values.reduce((sum, val) => sum + (val * val), 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // R² коефициент на детерминация
  const avgY = sumY / n;
  const ssTotal = values.reduce((sum, val) => sum + Math.pow(val - avgY, 2), 0);
  const ssRes = values.reduce((sum, val, i) => sum + Math.pow(val - (slope * i + intercept), 2), 0);
  const r2 = ssTotal > 0 ? 1 - (ssRes / ssTotal) : 0;
  
  return { 
    slope: isNaN(slope) ? 0 : slope, 
    intercept: isNaN(intercept) ? 0 : intercept,
    r2: isNaN(r2) ? 0 : Math.max(0, Math.min(1, r2))
  };
};

/**
 * Изчислява стандартно отклонение
 */
const calculateStandardDeviation = (values: number[]): number => {
  if (values.length < 2) return 0;
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
  return Math.sqrt(squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length);
};

/**
 * Изчислява Z-score за детекция на аномалии
 */
const calculateZScore = (value: number, mean: number, stdDev: number): number => {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
};

/**
 * Определя сезонния фактор за даден месец
 */
const getSeasonalFactor = (monthIndex: number, historicalData: { month: number; value: number }[]): number => {
  const monthData = historicalData.filter(d => d.month === monthIndex);
  if (monthData.length === 0) return 1;
  
  const avgForMonth = monthData.reduce((sum, d) => sum + d.value, 0) / monthData.length;
  const overallAvg = historicalData.reduce((sum, d) => sum + d.value, 0) / historicalData.length;
  
  return overallAvg > 0 ? avgForMonth / overallAvg : 1;
};

// ================== ГЛАВЕН КЛАС ==================

class PredictionService {
  private transactions: Transaction[] = [];
  private budgets: Budget[] = [];

  /**
   * Инициализира сервиза с текущите данни
   */
  initialize(transactions: Transaction[], budgets: Budget[]): void {
    this.transactions = transactions;
    this.budgets = budgets;
  }

  /**
   * Групира транзакции по месеци
   */
  private groupByMonth(transactions: Transaction[]): Map<string, Transaction[]> {
    const groups = new Map<string, Transaction[]>();
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = groups.get(key) || [];
      groups.set(key, [...existing, t]);
    });
    
    return groups;
  }

  /**
   * Получава исторически данни за последните N месеца
   */
  private getHistoricalData(months: number = 12): { 
    month: number; 
    year: number; 
    expenses: number; 
    income: number;
    transactions: Transaction[];
  }[] {
    const now = new Date();
    const data: { month: number; year: number; expenses: number; income: number; transactions: Transaction[] }[] = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthTransactions = this.transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === targetDate.getMonth() && 
               transactionDate.getFullYear() === targetDate.getFullYear();
      });

      const expenses = Math.abs(monthTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
      const income = monthTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
      
      data.push({
        month: targetDate.getMonth(),
        year: targetDate.getFullYear(),
        expenses,
        income,
        transactions: monthTransactions
      });
    }
    
    return data;
  }

  // ================== АНАЛИЗ ПО КАТЕГОРИИ ==================

  /**
   * Анализира разходите по категории
   */
  analyzeCategorySpending(): CategoryAnalysis[] {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Групиране по категории
    const categoryData = new Map<string, { 
      currentMonth: number; 
      lastMonth: number; 
      history: number[];
    }>();
    
    this.transactions
      .filter(t => t.amount < 0)
      .forEach(t => {
        const date = new Date(t.date);
        const monthDiff = (currentYear - date.getFullYear()) * 12 + (currentMonth - date.getMonth());
        const amount = Math.abs(t.amount);
        
        const existing = categoryData.get(t.category) || { 
          currentMonth: 0, 
          lastMonth: 0, 
          history: Array(6).fill(0) 
        };
        
        if (monthDiff === 0) {
          existing.currentMonth += amount;
        } else if (monthDiff === 1) {
          existing.lastMonth += amount;
        }
        
        if (monthDiff < 6) {
          existing.history[monthDiff] += amount;
        }
        
        categoryData.set(t.category, existing);
      });
    
    // Конвертиране в масив с анализи
    const analyses: CategoryAnalysis[] = [];
    
    categoryData.forEach((data, category) => {
      const average = data.history.reduce((sum, val) => sum + val, 0) / Math.max(data.history.filter(v => v > 0).length, 1);
      const regression = calculateLinearRegression(data.history.reverse());
      const stdDev = calculateStandardDeviation(data.history);
      const zScore = calculateZScore(data.currentMonth, average, stdDev);
      
      const trend = data.lastMonth > 0 ? data.currentMonth - data.lastMonth : 0;
      const trendPercent = data.lastMonth > 0 ? ((data.currentMonth - data.lastMonth) / data.lastMonth) * 100 : 0;
      
      analyses.push({
        category,
        currentMonthSpending: data.currentMonth,
        lastMonthSpending: data.lastMonth,
        averageSpending: average,
        trend,
        trendPercent,
        isAnomaly: Math.abs(zScore) > 2, // Z-score > 2 означава аномалия
        predictedNextMonth: Math.max(0, average + regression.slope)
      });
    });
    
    return analyses.sort((a, b) => Math.abs(b.trendPercent) - Math.abs(a.trendPercent));
  }

  // ================== ДЕТЕКЦИЯ НА АНОМАЛИИ ==================

  /**
   * Открива аномалии в разходите
   */
  detectAnomalies(): PredictionResult[] {
    const results: PredictionResult[] = [];
    const categoryAnalyses = this.analyzeCategorySpending();
    
    // Проверка за аномалии по категории
    categoryAnalyses.forEach(analysis => {
      if (analysis.isAnomaly && analysis.currentMonthSpending > analysis.averageSpending) {
        const overSpendPercent = ((analysis.currentMonthSpending - analysis.averageSpending) / analysis.averageSpending * 100).toFixed(0);
        results.push({
          type: 'warning',
          category: 'anomaly',
          title: `Необичайни разходи: ${analysis.category}`,
          text: `Разходите ви за "${analysis.category}" този месец са ${overSpendPercent}% над обичайното. Средно харчите ${analysis.averageSpending.toFixed(0)} €, а този месец - ${analysis.currentMonthSpending.toFixed(0)} €`,
          value: analysis.currentMonthSpending - analysis.averageSpending,
          icon: '⚠️',
          priority: 8,
          actionable: true,
          action: 'Прегледайте транзакциите в тази категория'
        });
      }
    });
    
    // Проверка за необичайно големи единични транзакции
    const expenseTransactions = this.transactions.filter(t => t.amount < 0);
    const avgTransaction = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / Math.max(expenseTransactions.length, 1);
    const stdDev = calculateStandardDeviation(expenseTransactions.map(t => Math.abs(t.amount)));
    
    const recentLargeTransactions = expenseTransactions
      .filter(t => {
        const daysDiff = (Date.now() - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24);
        const zScore = calculateZScore(Math.abs(t.amount), avgTransaction, stdDev);
        return daysDiff <= 7 && zScore > 2.5;
      });
    
    if (recentLargeTransactions.length > 0) {
      const largestTransaction = recentLargeTransactions.reduce((max, t) => 
        Math.abs(t.amount) > Math.abs(max.amount) ? t : max
      );
      
      results.push({
        type: 'info',
        category: 'anomaly',
        title: 'Голяма транзакция',
        text: `Открихме необичайно голям разход от ${Math.abs(largestTransaction.amount).toFixed(0)} € за "${largestTransaction.category}". Това е ${(Math.abs(largestTransaction.amount) / avgTransaction).toFixed(1)}x над средната ви транзакция.`,
        value: Math.abs(largestTransaction.amount),
        icon: '💸',
        priority: 6
      });
    }
    
    return results;
  }

  // ================== ПРОГНОЗИ ЗА БЮДЖЕТИ ==================

  /**
   * Прогнозира състоянието на бюджетите
   */
  predictBudgets(): BudgetPrediction[] {
    const predictions: BudgetPrediction[] = [];
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate();
    const daysRemaining = daysInMonth - currentDay;
    
    this.budgets.filter(b => b.isActive).forEach(budget => {
      const dailyBurnRate = budget.spent / Math.max(currentDay, 1);
      const projectedTotal = budget.spent + (dailyBurnRate * daysRemaining);
      const willExceed = projectedTotal > budget.budget;
      const projectedOverspend = Math.max(0, projectedTotal - budget.budget);
      
      // Изчисляване на препоръчителен дневен лимит
      const remainingBudget = budget.budget - budget.spent;
      const recommendedDailyLimit = daysRemaining > 0 ? remainingBudget / daysRemaining : 0;
      
      // Прогнозна дата на изчерпване
      let predictedEndDate: Date | null = null;
      if (dailyBurnRate > 0 && remainingBudget > 0) {
        const daysUntilExhausted = remainingBudget / dailyBurnRate;
        if (daysUntilExhausted < daysRemaining) {
          predictedEndDate = new Date(now.getTime() + daysUntilExhausted * 24 * 60 * 60 * 1000);
        }
      }
      
      predictions.push({
        budgetId: budget.id,
        category: budget.category,
        budget: budget.budget,
        spent: budget.spent,
        daysRemaining,
        predictedEndDate,
        willExceed,
        projectedOverspend,
        dailyBurnRate,
        recommendedDailyLimit: Math.max(0, recommendedDailyLimit)
      });
    });
    
    return predictions.sort((a, b) => {
      // Сортиране по риск - първо тези, които ще се превишат
      if (a.willExceed !== b.willExceed) return a.willExceed ? -1 : 1;
      return (b.projectedOverspend / b.budget) - (a.projectedOverspend / a.budget);
    });
  }

  // ================== СЕДМИЧНИ И ДНЕВНИ ПАТТЕРНИ ==================

  /**
   * Анализира паттерни на харчене по дни от седмицата
   */
  analyzeSpendingPatterns(): SpendingPattern[] {
    const patterns: SpendingPattern[] = [];
    const dayData: Map<number, { total: number; count: number; categories: Map<string, number> }> = new Map();
    
    // Инициализиране
    for (let i = 0; i < 7; i++) {
      dayData.set(i, { total: 0, count: 0, categories: new Map() });
    }
    
    // Събиране на данни
    this.transactions
      .filter(t => t.amount < 0)
      .forEach(t => {
        const date = new Date(t.date);
        const dayOfWeek = date.getDay();
        const data = dayData.get(dayOfWeek)!;
        
        data.total += Math.abs(t.amount);
        data.count += 1;
        
        const categoryTotal = data.categories.get(t.category) || 0;
        data.categories.set(t.category, categoryTotal + Math.abs(t.amount));
      });
    
    // Генериране на паттерни
    dayData.forEach((data, dayIndex) => {
      let topCategory = 'Няма данни';
      let maxAmount = 0;
      
      data.categories.forEach((amount, category) => {
        if (amount > maxAmount) {
          maxAmount = amount;
          topCategory = category;
        }
      });
      
      patterns.push({
        dayOfWeek: daysOfWeek[dayIndex],
        averageSpending: data.count > 0 ? data.total / data.count : 0,
        transactionCount: data.count,
        topCategory
      });
    });
    
    return patterns;
  }

  // ================== ФИНАНСОВО ЗДРАВЕ ==================

  /**
   * Изчислява финансов здравен рейтинг
   */
  calculateFinancialHealth(): FinancialHealthScore {
    const historicalData = this.getHistoricalData(6);
    const recommendations: string[] = [];
    
    // 1. Процент спестявания
    const totalIncome = historicalData.reduce((sum, d) => sum + d.income, 0);
    const totalExpenses = historicalData.reduce((sum, d) => sum + d.expenses, 0);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    
    let savingsScore = 0;
    if (savingsRate >= 20) savingsScore = 100;
    else if (savingsRate >= 10) savingsScore = 80;
    else if (savingsRate >= 5) savingsScore = 60;
    else if (savingsRate >= 0) savingsScore = 40;
    else savingsScore = 20;
    
    if (savingsRate < 10) {
      recommendations.push('Опитайте се да спестявате поне 10% от доходите си');
    }
    
    // 2. Придържане към бюджети
    const budgetPredictions = this.predictBudgets();
    const budgetsOnTrack = budgetPredictions.filter(b => !b.willExceed).length;
    const budgetAdherence = budgetPredictions.length > 0 ? (budgetsOnTrack / budgetPredictions.length) * 100 : 100;
    
    if (budgetAdherence < 70) {
      recommendations.push('Преразгледайте бюджетите си - няколко категории редовно се превишават');
    }
    
    // 3. Стабилност на разходите
    const expenseValues = historicalData.map(d => d.expenses);
    const avgExpenses = expenseValues.reduce((sum, val) => sum + val, 0) / Math.max(expenseValues.length, 1);
    const expenseStdDev = calculateStandardDeviation(expenseValues);
    const expenseCV = avgExpenses > 0 ? (expenseStdDev / avgExpenses) * 100 : 0; // Coefficient of Variation
    
    let spendingStability = 100 - Math.min(expenseCV, 100);
    
    if (spendingStability < 60) {
      recommendations.push('Разходите ви варират значително - опитайте се да бъдете по-последователни');
    }
    
    // 4. Стабилност на доходите
    const incomeValues = historicalData.map(d => d.income);
    const avgIncome = incomeValues.reduce((sum, val) => sum + val, 0) / Math.max(incomeValues.length, 1);
    const incomeStdDev = calculateStandardDeviation(incomeValues);
    const incomeCV = avgIncome > 0 ? (incomeStdDev / avgIncome) * 100 : 0;
    
    let incomeStability = 100 - Math.min(incomeCV, 100);
    
    // Обща оценка
    const overall = (savingsScore * 0.35 + budgetAdherence * 0.25 + spendingStability * 0.2 + incomeStability * 0.2);
    
    return {
      overall: Math.round(overall),
      savingsRate: Math.round(savingsRate * 10) / 10,
      budgetAdherence: Math.round(budgetAdherence),
      spendingStability: Math.round(spendingStability),
      incomeStability: Math.round(incomeStability),
      recommendations
    };
  }

  // ================== ПРОГНОЗИ ЗА СЛЕДВАЩИ МЕСЕЦИ ==================

  /**
   * Генерира прогнози за следващите месеци
   */
  generateMonthlyForecasts(monthsAhead: number = 6): MonthlyForecast[] {
    const historicalData = this.getHistoricalData(12);
    const forecasts: MonthlyForecast[] = [];
    
    const expenseValues = historicalData.map(d => d.expenses);
    const incomeValues = historicalData.map(d => d.income);
    
    const expenseRegression = calculateLinearRegression(expenseValues);
    const incomeRegression = calculateLinearRegression(incomeValues);
    
    const now = new Date();
    
    for (let i = 1; i <= monthsAhead; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthIndex = futureDate.getMonth();
      
      // Базова прогноза с тренд
      const baseExpense = Math.max(0, expenseRegression.intercept + (expenseRegression.slope * (historicalData.length + i)));
      const baseIncome = Math.max(0, incomeRegression.intercept + (incomeRegression.slope * (historicalData.length + i)));
      
      // Сезонни корекции
      const expenseSeasonalFactor = getSeasonalFactor(monthIndex, historicalData.map(d => ({ month: d.month, value: d.expenses })));
      const incomeSeasonalFactor = getSeasonalFactor(monthIndex, historicalData.map(d => ({ month: d.month, value: d.income })));
      
      const predictedExpenses = baseExpense * expenseSeasonalFactor;
      const predictedIncome = baseIncome * incomeSeasonalFactor;
      
      // Увереност базирана на R² и количество данни
      const dataQuality = Math.min(historicalData.length / 12, 1);
      const confidence = Math.round(((expenseRegression.r2 + incomeRegression.r2) / 2 * 50 + dataQuality * 50) * (1 - i * 0.05));
      
      forecasts.push({
        month: fullMonths[monthIndex],
        predictedIncome: Math.round(predictedIncome * 100) / 100,
        predictedExpenses: Math.round(predictedExpenses * 100) / 100,
        predictedSavings: Math.round((predictedIncome - predictedExpenses) * 100) / 100,
        confidence: Math.max(0, Math.min(100, confidence))
      });
    }
    
    return forecasts;
  }

  // ================== ПЕРСОНАЛИЗИРАНИ СЪВЕТИ ==================

  /**
   * Генерира персонализирани финансови съвети
   */
  generatePersonalizedAdvice(): PredictionResult[] {
    const results: PredictionResult[] = [];
    const categoryAnalyses = this.analyzeCategorySpending();
    const budgetPredictions = this.predictBudgets();
    const healthScore = this.calculateFinancialHealth();
    const patterns = this.analyzeSpendingPatterns();
    
    // === ТРЕНД АНАЛИЗ ===
    const historicalData = this.getHistoricalData(6);
    const expenseValues = historicalData.map(d => d.expenses);
    const incomeValues = historicalData.map(d => d.income);
    const expenseRegression = calculateLinearRegression(expenseValues);
    const incomeRegression = calculateLinearRegression(incomeValues);
    
    // Тренд на разходите
    if (expenseRegression.slope > 50) {
      results.push({
        type: 'warning',
        category: 'trend',
        title: 'Нарастващи разходи',
        text: `Разходите ви нарастват с около ${expenseRegression.slope.toFixed(0)} € на месец. Ако тенденцията продължи, за 6 месеца ще харчите ${(expenseValues[expenseValues.length - 1] + expenseRegression.slope * 6).toFixed(0)} € месечно.`,
        icon: '📈',
        priority: 8,
        actionable: true,
        action: 'Прегледайте категориите с най-голям ръст'
      });
    } else if (expenseRegression.slope < -50) {
      results.push({
        type: 'success',
        category: 'trend',
        title: 'Намаляващи разходи',
        text: `Отлична работа! Разходите ви намаляват с ${Math.abs(expenseRegression.slope).toFixed(0)} € на месец. Продължавайте така!`,
        icon: '📉',
        priority: 5
      });
    }
    
    // Тренд на приходите
    if (incomeRegression.slope > 100) {
      results.push({
        type: 'success',
        category: 'trend',
        title: 'Нарастващи приходи',
        text: `Приходите ви нарастват с ${incomeRegression.slope.toFixed(0)} € на месец. Чудесно развитие!`,
        icon: '💰',
        priority: 6
      });
    } else if (incomeRegression.slope < -100) {
      results.push({
        type: 'warning',
        category: 'trend',
        title: 'Намаляващи приходи',
        text: `Приходите ви намаляват с ${Math.abs(incomeRegression.slope).toFixed(0)} € на месец. Препоръчваме да намалите разходите.`,
        icon: '⚠️',
        priority: 9
      });
    }
    
    // === АНАЛИЗ НА КАТЕГОРИИ ===
    const topGrowingCategory = categoryAnalyses.find(c => c.trendPercent > 30 && c.currentMonthSpending > 100);
    if (topGrowingCategory) {
      results.push({
        type: 'info',
        category: 'spending',
        title: `Ръст в "${topGrowingCategory.category}"`,
        text: `Разходите ви за "${topGrowingCategory.category}" са се увеличили с ${topGrowingCategory.trendPercent.toFixed(0)}% спрямо миналия месец. Проверете дали това е планирано.`,
        icon: '🔍',
        priority: 6,
        actionable: true,
        action: 'Преглед на транзакции'
      });
    }
    
    const topDecreasingCategory = categoryAnalyses.find(c => c.trendPercent < -30 && c.lastMonthSpending > 100);
    if (topDecreasingCategory) {
      results.push({
        type: 'success',
        category: 'spending',
        title: `Спестявания в "${topDecreasingCategory.category}"`,
        text: `Намалихте разходите за "${topDecreasingCategory.category}" с ${Math.abs(topDecreasingCategory.trendPercent).toFixed(0)}%. Спестихте ${Math.abs(topDecreasingCategory.trend).toFixed(0)} € този месец!`,
        icon: '🎯',
        priority: 5
      });
    }
    
    // === БЮДЖЕТНИ ПРЕДУПРЕЖДЕНИЯ ===
    const criticalBudgets = budgetPredictions.filter(b => b.willExceed && b.projectedOverspend > 50);
    if (criticalBudgets.length > 0) {
      const mostCritical = criticalBudgets[0];
      results.push({
        type: 'danger',
        category: 'budget',
        title: `Бюджетът за "${mostCritical.category}" ще се превиши`,
        text: `С текущия темп ще превишите бюджета с ${mostCritical.projectedOverspend.toFixed(0)} €. Препоръчителен дневен лимит: ${mostCritical.recommendedDailyLimit.toFixed(0)} €`,
        icon: '🚨',
        priority: 9,
        actionable: true,
        action: 'Ограничете разходите'
      });
    }
    
    const exhaustingBudgets = budgetPredictions.filter(b => b.predictedEndDate !== null);
    exhaustingBudgets.forEach(budget => {
      const daysUntilExhausted = Math.ceil((budget.predictedEndDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilExhausted <= 7 && daysUntilExhausted > 0) {
        results.push({
          type: 'warning',
          category: 'budget',
          title: `Бюджетът за "${budget.category}" се изчерпва`,
          text: `При текущия темп на харчене, бюджетът за "${budget.category}" ще се изчерпи след ${daysUntilExhausted} дни (на ${budget.predictedEndDate!.toLocaleDateString('bg-BG')}).`,
          icon: '⏰',
          priority: 7,
          actionable: true,
          action: 'Намалете разходите'
        });
      }
    });
    
    // === СЕДМИЧНИ ПАТТЕРНИ ===
    const maxSpendingDay = patterns.reduce((max, p) => p.averageSpending > max.averageSpending ? p : max, patterns[0]);
    if (maxSpendingDay.averageSpending > 0) {
      results.push({
        type: 'info',
        category: 'pattern',
        title: 'Седмичен паттерн',
        text: `Най-много харчите в ${maxSpendingDay.dayOfWeek} - средно ${maxSpendingDay.averageSpending.toFixed(0)} € на транзакция, предимно за "${maxSpendingDay.topCategory}".`,
        icon: '📊',
        priority: 3
      });
    }
    
    // === СЕЗОННИ СЪВЕТИ ===
    const currentMonth = new Date().getMonth();
    const winterMonths = [11, 0, 1];
    const summerMonths = [5, 6, 7];
    const springMonths = [2, 3, 4];
    const autumnMonths = [8, 9, 10];
    
    if (winterMonths.includes(currentMonth)) {
      results.push({
        type: 'info',
        category: 'advice',
        title: 'Сезонен съвет',
        text: 'Зимата носи по-високи сметки за отопление и разходи за празници. Планирайте бюджета предварително.',
        icon: '❄️',
        priority: 2
      });
    } else if (summerMonths.includes(currentMonth)) {
      results.push({
        type: 'info',
        category: 'advice',
        title: 'Сезонен съвет',
        text: 'Лятото е сезон за почивки. Ако планирате пътуване, заделете средства предварително.',
        icon: '☀️',
        priority: 2
      });
    }
    
    // === СПЕСТЯВАНИЯ ===
    if (healthScore.savingsRate < 5) {
      results.push({
        type: 'warning',
        category: 'savings',
        title: 'Нисък процент спестявания',
        text: `Спестявате само ${healthScore.savingsRate.toFixed(1)}% от доходите си. Препоръчително е поне 10-20%. Започнете с малки стъпки.`,
        icon: '🐷',
        priority: 8,
        actionable: true,
        action: 'Създайте спестовен план'
      });
    } else if (healthScore.savingsRate >= 20) {
      results.push({
        type: 'success',
        category: 'savings',
        title: 'Отлични спестявания',
        text: `Спестявате ${healthScore.savingsRate.toFixed(1)}% от доходите си. Това е над препоръчителния минимум!`,
        icon: '🏆',
        priority: 4
      });
    }
    
    // === ПРОГНОЗА ЗА БАЛАНС ===
    const forecasts = this.generateMonthlyForecasts(6);
    const totalPredictedSavings = forecasts.reduce((sum, f) => sum + f.predictedSavings, 0);
    
    if (totalPredictedSavings > 0) {
      results.push({
        type: 'success',
        category: 'savings',
        title: 'Прогноза за 6 месеца',
        text: `Очаква се да спестите около ${totalPredictedSavings.toFixed(0)} € през следващите 6 месеца, ако поддържате текущите навици.`,
        icon: '🔮',
        priority: 5
      });
    } else if (totalPredictedSavings < -500) {
      results.push({
        type: 'danger',
        category: 'savings',
        title: 'Внимание: Прогнозен дефицит',
        text: `При текущите тенденции се очаква дефицит от ${Math.abs(totalPredictedSavings).toFixed(0)} € през следващите 6 месеца. Необходими са корекции.`,
        icon: '⚠️',
        priority: 10,
        actionable: true,
        action: 'Преразгледайте бюджета'
      });
    }
    
    // Сортиране по приоритет
    return results.sort((a, b) => b.priority - a.priority);
  }

  // ================== ГЛАВЕН МЕТОД ==================

  /**
   * Генерира всички интелигентни предвиждания
   */
  generateAllPredictions(): {
    predictions: PredictionResult[];
    categoryAnalyses: CategoryAnalysis[];
    budgetPredictions: BudgetPrediction[];
    patterns: SpendingPattern[];
    forecasts: MonthlyForecast[];
    healthScore: FinancialHealthScore;
  } {
    // Първо добавяме персонализираните съвети
    let predictions = this.generatePersonalizedAdvice();
    
    // Добавяме аномалиите
    const anomalies = this.detectAnomalies();
    predictions = [...predictions, ...anomalies];
    
    // Премахваме дубликати и сортираме отново
    const uniquePredictions = predictions.filter((pred, index, self) =>
      index === self.findIndex(p => p.title === pred.title)
    ).sort((a, b) => b.priority - a.priority);
    
    return {
      predictions: uniquePredictions.slice(0, 8), // Показваме до 8 предвиждания
      categoryAnalyses: this.analyzeCategorySpending(),
      budgetPredictions: this.predictBudgets(),
      patterns: this.analyzeSpendingPatterns(),
      forecasts: this.generateMonthlyForecasts(6),
      healthScore: this.calculateFinancialHealth()
    };
  }
}

// Singleton instance
const predictionService = new PredictionService();
export default predictionService;


