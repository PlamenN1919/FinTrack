import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import LinearGradient from 'react-native-linear-gradient';

// Тематичен контекст и данни
import { useTheme } from '../utils/ThemeContext';
import { useTransactions } from '../utils/TransactionContext';
import { useBudgets } from '../utils/BudgetContext';
import { useUser } from '../contexts/UserContext';

// Типове за симулации
interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'income' | 'expense' | 'savings' | 'investment' | 'debt';
  parameters: {
    amount?: number;
    percentage?: number;
    category?: string;
    duration?: number; // в месеци
    frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  };
}

interface SimulationResult {
  scenario: SimulationScenario;
  currentBalance: number;
  projectedBalance: number;
  monthlyImpact: number;
  yearlyImpact: number;
  breakEvenPoint?: number; // в месеци
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

const WhatIfSimulationScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { userData, loading: userLoading } = useUser();
  const { budgets } = useBudgets();
  
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenario | null>(null);
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [customDuration, setCustomDuration] = useState('12');

  // Изчисляване на финансови показатели
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const currentMonthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
  });

  const monthlyIncome = currentMonthTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpense = Math.abs(currentMonthTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0));
  
  // Използваме реалния баланс от userData + всички транзакции
  const totalTransactionAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = (userData?.initialBalance || 0) + totalTransactionAmount;
  const monthlySavings = monthlyIncome - monthlyExpense;

  // Предефинирани сценарии
  const predefinedScenarios: SimulationScenario[] = [
    {
      id: '1',
      name: 'Увеличение на заплатата',
      description: 'Какво ако получа повишение на заплатата с 15%?',
      icon: '💰',
      type: 'income',
      parameters: {
        percentage: 15,
        duration: 12,
        frequency: 'monthly',
      },
    },
    {
      id: '2',
      name: 'Намаляване на разходи за храна',
      description: 'Какво ако намаля разходите за храна с 20%?',
      icon: '🍽️',
      type: 'expense',
      parameters: {
        percentage: -20,
        category: 'Храна',
        duration: 12,
        frequency: 'monthly',
      },
    },
    {
      id: '3',
      name: 'Месечни спестявания',
      description: 'Какво ако спестявам 300 лв. всеки месец?',
      icon: '🐖',
      type: 'savings',
      parameters: {
        amount: 300,
        duration: 12,
        frequency: 'monthly',
      },
    },
    {
      id: '4',
      name: 'Инвестиция с 5% годишна доходност',
      description: 'Какво ако инвестирам 500 лв. месечно с 5% доходност?',
      icon: '📈',
      type: 'investment',
      parameters: {
        amount: 500,
        percentage: 5,
        duration: 12,
        frequency: 'monthly',
      },
    },
    {
      id: '5',
      name: 'Погасяване на заем',
      description: 'Какво ако взема заем от 5000 лв. за 24 месеца?',
      icon: '💳',
      type: 'debt',
      parameters: {
        amount: -5000,
        duration: 24,
        frequency: 'monthly',
      },
    },
    {
      id: '6',
      name: 'Допълнителен доход',
      description: 'Какво ако започна странична дейност за 200 лв. месечно?',
      icon: '💼',
      type: 'income',
      parameters: {
        amount: 200,
        duration: 12,
        frequency: 'monthly',
      },
    },
  ];

  // Функция за изчисляване на симулация
  const calculateSimulation = (scenario: SimulationScenario): SimulationResult => {
    const { parameters } = scenario;
    let monthlyImpact = 0;
    let projectedBalance = currentBalance;
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    const recommendations: string[] = [];

    switch (scenario.type) {
      case 'income':
        if (parameters.percentage) {
          monthlyImpact = (monthlyIncome * parameters.percentage) / 100;
        } else if (parameters.amount) {
          monthlyImpact = parameters.amount;
        }
        riskLevel = 'low';
        recommendations.push('Отличен начин за подобряване на финансовото положение');
        if (monthlyImpact > 500) {
          recommendations.push('Помислете за увеличаване на спестяванията');
        }
        break;

      case 'expense':
        if (parameters.percentage && parameters.category) {
          const categoryExpenses = currentMonthTransactions
            .filter(t => t.category === parameters.category && t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
          monthlyImpact = (categoryExpenses * parameters.percentage) / 100;
        }
        riskLevel = 'low';
        recommendations.push('Намаляването на разходите е здравословен подход');
        break;

      case 'savings':
        monthlyImpact = -(parameters.amount || 0);
        riskLevel = monthlySavings + monthlyImpact < 0 ? 'high' : 'low';
        if (riskLevel === 'high') {
          recommendations.push('Внимание: Това може да доведе до дефицит');
        } else {
          recommendations.push('Отлична стратегия за дългосрочно спестяване');
        }
        break;

             case 'investment':
         const investmentAmount = parameters.amount || 0;
         const annualReturn = parameters.percentage || 0;
         monthlyImpact = -investmentAmount;
         
         // Изчисляване на сложна лихва
         const monthlyReturn = annualReturn / 12 / 100;
         const investmentMonths = parameters.duration || 12;
         const futureValue = investmentAmount * 
           (((1 + monthlyReturn) ** investmentMonths - 1) / monthlyReturn) * 
           (1 + monthlyReturn);
         
         projectedBalance = currentBalance - (investmentAmount * investmentMonths) + futureValue;
         riskLevel = annualReturn > 7 ? 'high' : annualReturn > 3 ? 'medium' : 'low';
         
         recommendations.push(`Очаквана стойност след ${investmentMonths} месеца: ${futureValue.toFixed(2)} лв.`);
         if (riskLevel === 'high') {
           recommendations.push('Високорискова инвестиция - диверсифицирайте портфолиото');
         }
         break;

       case 'debt':
         const loanAmount = Math.abs(parameters.amount || 0);
         const debtMonths = parameters.duration || 12;
         const monthlyPayment = loanAmount / debtMonths;
         monthlyImpact = -monthlyPayment;
        
        riskLevel = monthlyPayment > monthlySavings * 0.3 ? 'high' : 'medium';
        recommendations.push(`Месечна вноска: ${monthlyPayment.toFixed(2)} лв.`);
        if (riskLevel === 'high') {
          recommendations.push('Внимание: Високо натоварване спрямо доходите');
        }
        break;
    }

    const duration = parameters.duration || 12;
    projectedBalance = currentBalance + (monthlyImpact * duration);
    const yearlyImpact = monthlyImpact * 12;

    return {
      scenario,
      currentBalance,
      projectedBalance,
      monthlyImpact,
      yearlyImpact,
      breakEvenPoint: monthlyImpact < 0 ? Math.ceil(currentBalance / Math.abs(monthlyImpact)) : undefined,
      riskLevel,
      recommendations,
    };
  };

  // Обработка на избор на сценарий
  const handleScenarioSelect = (scenario: SimulationScenario) => {
    const result = calculateSimulation(scenario);
    setSimulationResults([result]);
    setSelectedScenario(scenario);
  };

  // Създаване на персонализиран сценарий
  const createCustomScenario = () => {
    if (!customAmount || !customCategory) {
      Alert.alert('Грешка', 'Моля, попълнете всички полета');
      return;
    }

    const customScenario: SimulationScenario = {
      id: 'custom',
      name: 'Персонализиран сценарий',
      description: `Промяна в категория ${customCategory}`,
      icon: '⚙️',
      type: 'expense',
      parameters: {
        amount: parseFloat(customAmount),
        category: customCategory,
        duration: parseInt(customDuration),
        frequency: 'monthly',
      },
    };

    const result = calculateSimulation(customScenario);
    setSimulationResults([result]);
    setSelectedScenario(customScenario);
    setShowCustomModal(false);
  };

  // Сравнение на множество сценарии
  const compareScenarios = () => {
    const results = predefinedScenarios.slice(0, 3).map(calculateSimulation);
    setSimulationResults(results);
    setSelectedScenario(null);
  };

  // Генериране на данни за графика
  const generateChartData = (result: SimulationResult) => {
    const months = result.scenario.parameters.duration || 12;
    const labels = [];
    const data = [];
    
    for (let i = 0; i <= months; i++) {
      labels.push(`М${i}`);
      data.push(result.currentBalance + (result.monthlyImpact * i));
    }

    return {
      labels: labels.slice(0, 7), // Показваме само първите 7 месеца за четливост
      datasets: [{
        data: data.slice(0, 7),
        color: (opacity = 1) => theme.colors.primary,
        strokeWidth: 2,
      }],
    };
  };

  // Получаване на цвят според риска
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return theme.colors.success;
      case 'medium': return theme.colors.warning;
      case 'high': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  // Рендериране на резултат от симулация
  const renderSimulationResult = (result: SimulationResult, index: number) => (
    <View key={index} style={[styles.resultCard, { backgroundColor: theme.colors.card }]}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultIcon}>{result.scenario.icon}</Text>
        <View style={styles.resultTitleContainer}>
          <Text style={[styles.resultTitle, { color: theme.colors.text }]}>
            {result.scenario.name}
          </Text>
          <View style={[styles.riskBadge, { backgroundColor: getRiskColor(result.riskLevel) + '20' }]}>
            <Text style={[styles.riskText, { color: getRiskColor(result.riskLevel) }]}>
              {result.riskLevel === 'low' ? 'Нисък риск' : 
               result.riskLevel === 'medium' ? 'Среден риск' : 'Висок риск'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.resultMetrics}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>Месечно въздействие</Text>
          <Text style={[
            styles.metricValue, 
            { color: result.monthlyImpact >= 0 ? theme.colors.success : theme.colors.error }
          ]}>
            {result.monthlyImpact >= 0 ? '+' : ''}{result.monthlyImpact.toFixed(2)} лв.
          </Text>
        </View>
        
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>Прогнозен баланс</Text>
          <Text style={[styles.metricValue, { color: theme.colors.text }]}>
            {result.projectedBalance.toFixed(2)} лв.
          </Text>
        </View>
        
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>Годишно въздействие</Text>
          <Text style={[
            styles.metricValue, 
            { color: result.yearlyImpact >= 0 ? theme.colors.success : theme.colors.error }
          ]}>
            {result.yearlyImpact >= 0 ? '+' : ''}{result.yearlyImpact.toFixed(2)} лв.
          </Text>
        </View>
      </View>

      {simulationResults.length === 1 && (
        <View style={styles.chartContainer}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
            Прогноза за баланса
          </Text>
          <LineChart
            data={generateChartData(result)}
            width={320}
            height={200}
            chartConfig={{
              backgroundGradientFrom: theme.colors.card,
              backgroundGradientTo: theme.colors.card,
              decimalPlaces: 0,
              color: (opacity = 1) => theme.colors.primary,
              labelColor: (opacity = 1) => theme.colors.text,
              style: { borderRadius: 16 },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      <View style={styles.recommendationsContainer}>
        <Text style={[styles.recommendationsTitle, { color: theme.colors.text }]}>
          Препоръки:
        </Text>
        {result.recommendations.map((rec, idx) => (
          <Text key={idx} style={[styles.recommendationText, { color: theme.colors.textSecondary }]}>
            • {rec}
          </Text>
        ))}
      </View>
    </View>
  );

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
                <Text style={styles.headerTitle}>Симулации "Какво ако"</Text>
                <Text style={styles.headerSubtitle}>
                  Изследвайте различни финансови сценарии
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Текущо състояние */}
        <View style={[styles.currentStateCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.currentStateTitle, { color: theme.colors.text }]}>
            Текущо финансово състояние
          </Text>
          <View style={styles.currentStateMetrics}>
            <View style={styles.currentMetric}>
              <Text style={[styles.currentMetricLabel, { color: theme.colors.textSecondary }]}>Баланс</Text>
              <Text style={[styles.currentMetricValue, { color: theme.colors.text }]}>
                {currentBalance.toFixed(2)} лв.
              </Text>
            </View>
            <View style={styles.currentMetric}>
              <Text style={[styles.currentMetricLabel, { color: theme.colors.textSecondary }]}>Месечни приходи</Text>
              <Text style={[styles.currentMetricValue, { color: theme.colors.success }]}>
                {monthlyIncome.toFixed(2)} лв.
              </Text>
            </View>
            <View style={styles.currentMetric}>
              <Text style={[styles.currentMetricLabel, { color: theme.colors.textSecondary }]}>Месечни разходи</Text>
              <Text style={[styles.currentMetricValue, { color: theme.colors.error }]}>
                {monthlyExpense.toFixed(2)} лв.
              </Text>
            </View>
          </View>
        </View>

        {/* Предефинирани сценарии */}
        <View style={styles.scenariosSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Популярни сценарии
          </Text>
          <View style={styles.scenariosGrid}>
            {predefinedScenarios.map((scenario) => (
              <TouchableOpacity
                key={scenario.id}
                style={[styles.scenarioCard, { backgroundColor: theme.colors.card }]}
                onPress={() => handleScenarioSelect(scenario)}
              >
                <Text style={styles.scenarioIcon}>{scenario.icon}</Text>
                <Text style={[styles.scenarioName, { color: theme.colors.text }]}>
                  {scenario.name}
                </Text>
                <Text style={[styles.scenarioDescription, { color: theme.colors.textSecondary }]}>
                  {scenario.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Бутони за действия */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => setShowCustomModal(true)}
          >
            <Text style={styles.actionButtonText}>Персонализиран сценарий</Text>
          </TouchableOpacity>
          
                     <TouchableOpacity
             style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
             onPress={compareScenarios}
           >
            <Text style={styles.actionButtonText}>Сравни сценарии</Text>
          </TouchableOpacity>
        </View>

        {/* Резултати от симулации */}
        {simulationResults.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Резултати от симулацията
            </Text>
            {simulationResults.map((result, index) => renderSimulationResult(result, index))}
          </View>
        )}
      </ScrollView>

      {/* Модал за персонализиран сценарий */}
      <Modal
        visible={showCustomModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCustomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Персонализиран сценарий
            </Text>
            
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border 
              }]}
              placeholder="Сума (лв.)"
              placeholderTextColor={theme.colors.textSecondary}
              value={customAmount}
              onChangeText={setCustomAmount}
              keyboardType="numeric"
            />
            
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border 
              }]}
              placeholder="Категория"
              placeholderTextColor={theme.colors.textSecondary}
              value={customCategory}
              onChangeText={setCustomCategory}
            />
            
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border 
              }]}
              placeholder="Продължителност (месеци)"
              placeholderTextColor={theme.colors.textSecondary}
              value={customDuration}
              onChangeText={setCustomDuration}
              keyboardType="numeric"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.error }]}
                onPress={() => setShowCustomModal(false)}
              >
                <Text style={styles.modalButtonText}>Отказ</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={createCustomScenario}
              >
                <Text style={styles.modalButtonText}>Симулирай</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  
  // Обновени стилове за съдържанието
  scrollView: {
    flex: 1,
    marginTop: -12,
    paddingTop: 20,
  },
  currentStateCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
  },
  currentStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  currentStateMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  currentMetric: {
    alignItems: 'center',
  },
  currentMetricLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  currentMetricValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scenariosSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  scenariosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  scenarioCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  scenarioIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  scenarioName: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  scenarioDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 100,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultsSection: {
    padding: 16,
  },
  resultCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  resultTitleContainer: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  riskText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  resultMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  chartContainer: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  recommendationsContainer: {
    marginTop: 8,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default WhatIfSimulationScreen; 