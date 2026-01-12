import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  ScrollView,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../utils/ThemeContext';
import { useBudgets } from '../utils/BudgetContext';
import { SCREENS } from '../utils/constants';

// Премиум UI компоненти
import SimpleAnimatedCard from '../components/ui/SimpleAnimatedCard';
import PremiumCard from '../components/ui/PremiumCard';
import PremiumButton from '../components/ui/PremiumButton';

// Икони
import BudgetsIcon from '../components/icons/BudgetsIcon';

// Геймификация
import gamificationService from '../services/GamificationService';
import { useEffect } from 'react';

const BudgetsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { budgets, toggleBudgetActive } = useBudgets();

  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🎮 ГЕЙМИФИКАЦИЯ: Проверка на бюджетно спазване
  useEffect(() => {
    if (!budgets || budgets.length === 0) return;

    try {
      // Изчисляваме колко дни потребителят е спазвал бюджета
      const activeBudgets = budgets.filter(b => b && b.isActive);
      const budgetsWithinLimit = activeBudgets.filter(b => {
        const percentage = (b.spent / b.budget) * 100;
        return percentage <= 100;
      });

      const complianceRate = activeBudgets.length > 0 
        ? budgetsWithinLimit.length / activeBudgets.length 
        : 0;

      // Ако повече от 80% от бюджетите са спазени, задействаме геймификацията
      if (complianceRate >= 0.8) {
        gamificationService.onBudgetComplianceCheck({
          isWithinBudget: true,
          daysInBudget: Math.floor(complianceRate * 30), // Приблизително изчисление
          budgetsCount: activeBudgets.length,
          complianceRate: complianceRate
        });
      }
    } catch (error) {
      console.error('Gamification budget check error:', error);
    }
  }, [budgets]);

  // Изчисляване на общи статистики с error handling
  const budgetStats = useMemo(() => {
    try {
      if (!budgets || budgets.length === 0) {
        return { totalBudget: 0, totalSpent: 0, totalRemaining: 0, activeBudgets: 0 };
      }

      const activeBudgets = budgets.filter(b => b && b.isActive && typeof b.budget === 'number' && typeof b.spent === 'number');
      
      const totalBudget = activeBudgets.reduce((sum, b) => sum + (b.budget || 0), 0);
      const totalSpent = activeBudgets.reduce((sum, b) => sum + (b.spent || 0), 0);
      const totalRemaining = totalBudget - totalSpent;

      return {
        totalBudget,
        totalSpent,
        totalRemaining,
        activeBudgets: activeBudgets.length
      };
    } catch (error) {
      console.error('Грешка при изчисляване на статистики:', error);
      setError('Грешка при зареждане на статистики');
      return { totalBudget: 0, totalSpent: 0, totalRemaining: 0, activeBudgets: 0 };
    }
  }, [budgets]);

  // Филтрирани и валидирани бюджети
  const validBudgets = useMemo(() => {
    try {
      if (!budgets || budgets.length === 0) {
        return [];
      }

      return budgets.filter(budget => 
        budget && 
        budget.id && 
        typeof budget.budget === 'number' && 
        typeof budget.spent === 'number' &&
        budget.category &&
        budget.color
      );
    } catch (error) {
      console.error('Грешка при филтриране на бюджети:', error);
      return [];
    }
  }, [budgets]);

  // Получаване на статус на бюджет с error handling
  const getBudgetStatus = useCallback((budget: any) => {
    try {
      if (!budget || typeof budget.spent !== 'number' || typeof budget.budget !== 'number' || budget.budget <= 0) {
        return { status: 'Невалидни данни', color: theme.colors.error, icon: '❌' };
      }

      const percentage = (budget.spent / budget.budget) * 100;
      
      if (percentage >= 100) return { status: 'Превишен', color: theme.colors.error, icon: '🚨' };
      if (percentage >= 80) return { status: 'Близо до лимита', color: theme.colors.warning, icon: '⚠️' };
      if (percentage >= 60) return { status: 'В норма', color: theme.colors.success, icon: '✅' };
      return { status: 'Добър прогрес', color: theme.colors.primary, icon: '🎯' };
    } catch (error) {
      console.error('Грешка при изчисляване на статус:', error);
      return { status: 'Грешка', color: theme.colors.error, icon: '❌' };
    }
  }, [theme.colors]);

  // Получаване на икона за контекстуално правило
  const getRuleIcon = useCallback((type: string) => {
    switch (type) {
      case 'seasonal': return '🌟';
      case 'compensatory': return '⚖️';
      case 'weather': return '🌦️';
      case 'social': return '👥';
      case 'emotional': return '💭';
      default: return '📋';
    }
  }, []);

  // Получаване на уникален градиент за всеки бюджет
  const getBudgetGradient = useCallback((index: number, color: string) => {
    try {
      if (!color || typeof index !== 'number') {
        return ['#D4AF37', '#D4AF3780', '#D4AF3740']; // Fallback градиент
      }

      const gradients = [
        [color, `${color}80`, `${color}40`],
        [`${color}E0`, color, `${color}60`],
        [`${color}C0`, `${color}90`, color],
        [color, `${color}A0`, `${color}60`],
        [`${color}F0`, `${color}B0`, `${color}70`],
      ];
      return gradients[index % gradients.length];
    } catch (error) {
      console.error('Грешка при генериране на градиент:', error);
      return ['#D4AF37', '#D4AF3780', '#D4AF3740'];
    }
  }, []);

  // Loading компонент
  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
        Зареждане на бюджети...
      </Text>
    </View>
  );

  // Error компонент
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
            setTimeout(() => setIsLoading(false), 1000);
          }}
        >
          <Text style={styles.retryButtonText}>Опитай отново</Text>
        </TouchableOpacity>
      </View>
    </SimpleAnimatedCard>
  );

  // Рендериране на бюджет с error handling
  const renderBudget = useCallback(({ item, index }: { item: any, index: number }) => {
    try {
      if (!item) {
        return null;
      }

      const percentage = item.budget > 0 ? Math.min((item.spent / item.budget) * 100, 100) : 0;
      const status = getBudgetStatus(item);
      const budgetGradient = getBudgetGradient(index, item.color);

    const cardStyle = {
      ...styles.budgetCard,
      opacity: item.isActive ? 1 : 0.7,
      borderWidth: 2,
      borderColor: item.color + '40', // Полупрозрачен border в цвета на бюджета
    };

    return (
      <PremiumCard
        variant="elevated"
        style={cardStyle}
        animationDelay={100 + (index * 50)}
        enableShimmer={false}
        enableHover={true}
        glowColor={item.color}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate(SCREENS.BUDGET_DETAILS, { id: item.id })}
          style={styles.budgetContent}
          activeOpacity={0.8}
        >
          {/* Header с категория и статус */}
          <View style={styles.budgetHeader}>
            <View style={styles.categorySection}>
              <View style={[styles.categoryIcon, { borderColor: item.color, borderWidth: 3 }]}>
                <LinearGradient
                  colors={[item.color + 'E0', item.color + '80']}
                  style={styles.categoryIconGradient}
                >
                  <Text style={styles.categoryIconText}>{item.icon || '💰'}</Text>
                </LinearGradient>
              </View>
              
              <View style={styles.categoryInfo}>
                <View style={styles.categoryTitleRow}>
                  <Text style={[styles.categoryName, { color: theme.colors.text }]}>
                    {item.category}
                  </Text>
                  {!item.isActive && (
                    <View style={[styles.inactiveBadge, { backgroundColor: theme.colors.textSecondary }]}>
                      <Text style={styles.inactiveBadgeText}>Неактивен</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.statusRow}>
                  <Text style={styles.statusIcon}>{status.icon}</Text>
                  <Text style={[styles.budgetStatus, { color: status.color }]}>
                    {status.status}
                  </Text>
                  <Text style={[styles.periodBadge, { backgroundColor: item.color + '20', color: item.color }]}>
                    {item.period === 'weekly' ? 'Седмично' : 
                     item.period === 'monthly' ? 'Месечно' : 
                     item.period === 'yearly' ? 'Годишно' : 'Месечно'}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => toggleBudgetActive(item.id)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={item.isActive ? [item.color, item.color + '80'] : ['#666', '#888']}
                style={styles.toggleButtonGradient}
              >
                <Text style={styles.toggleButtonText}>
                  {item.isActive ? '⏸️' : '▶️'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Модерен прогрес бар */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>
                Прогрес
              </Text>
              <Text style={[styles.progressPercentage, { color: status.color }]}>
                {percentage.toFixed(0)}%
              </Text>
            </View>
            
            <View style={[styles.progressTrack, { backgroundColor: theme.colors.background, borderColor: item.color + '30', borderWidth: 1 }]}>
              <LinearGradient
                colors={percentage >= 100 ? [theme.colors.error, `${theme.colors.error}80`] : [item.color, item.color + '80']}
                style={[styles.progressFill, { width: `${percentage}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              
              {/* Светещ ефект */}
              {percentage > 0 && (
                <View 
                  style={[
                    styles.progressGlow,
                    { 
                      width: `${percentage}%`,
                      backgroundColor: percentage >= 100 ? theme.colors.error : item.color,
                      shadowColor: item.color,
                    }
                  ]} 
                />
              )}
            </View>
          </View>

          {/* Суми в grid layout */}
          <View style={styles.amountGrid}>
            <View style={styles.amountItem}>
              <Text style={[styles.amountLabel, { color: theme.colors.textSecondary }]}>
                Изразходвано
              </Text>
              <Text style={[styles.amountValue, { color: theme.colors.text }]}>
                {item.spent.toFixed(2)} €
              </Text>
              <View style={[styles.amountIndicator, { backgroundColor: theme.colors.error }]} />
            </View>
            
            <View style={styles.amountItem}>
              <Text style={[styles.amountLabel, { color: theme.colors.textSecondary }]}>
                Бюджет
              </Text>
              <Text style={[styles.amountValue, { color: theme.colors.text }]}>
                {item.budget.toFixed(2)} €
              </Text>
              <View style={[styles.amountIndicator, { backgroundColor: item.color }]} />
            </View>
            
            <View style={styles.amountItem}>
              <Text style={[styles.amountLabel, { color: theme.colors.textSecondary }]}>
                Остава
              </Text>
              <Text style={[
                styles.amountValue,
                { color: item.budget - item.spent >= 0 ? theme.colors.success : theme.colors.error }
              ]}>
                {(item.budget - item.spent).toFixed(2)} €
              </Text>
              <View style={[
                styles.amountIndicator, 
                { backgroundColor: item.budget - item.spent >= 0 ? theme.colors.success : theme.colors.error }
              ]} />
            </View>
          </View>

          {/* Контекстуални правила */}
          {item.contextualRules && item.contextualRules.length > 0 && (
            <View style={styles.rulesSection}>
              <View style={[styles.rulesSeparator, { backgroundColor: item.color + '20' }]} />
              <View style={styles.rulesHeader}>
                <View style={[styles.rulesIcon, { backgroundColor: item.color + '20' }]}>
                  <Text style={styles.rulesIconText}>🎯</Text>
                </View>
                <Text style={[styles.rulesTitle, { color: theme.colors.text }]}>
                  Интелигентни правила ({item.contextualRules.length})
                </Text>
              </View>
              
              <View style={styles.rulesList}>
                {item.contextualRules.map((rule: any, ruleIndex: number) => (
                  <View key={ruleIndex} style={styles.ruleItem}>
                    <View style={[styles.ruleIconContainer, { backgroundColor: item.color + '15' }]}>
                      <Text style={styles.ruleIcon}>
                        {getRuleIcon(rule.type)}
                      </Text>
                    </View>
                    <Text style={[styles.ruleDescription, { color: theme.colors.textSecondary }]}>
                      {rule.description}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </TouchableOpacity>
      </PremiumCard>
    );
    } catch (error) {
      console.error('Грешка при рендериране на бюджет:', error);
      return null;
    }
  }, [getBudgetStatus, getBudgetGradient, theme.colors, navigation]);

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
                <Text style={styles.headerTitle}>Бюджети</Text>
                <Text style={styles.headerSubtitle}>
                  Интелигентно управление на разходите
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate(SCREENS.ADD_BUDGET)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(247, 231, 206, 0.2)', 'rgba(247, 231, 206, 0.1)']}
                  style={styles.addButtonGradient}
                >
                  <Text style={styles.addButtonText}>+</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Общ прогрес */}
        <View style={styles.statsSection}>
          <SimpleAnimatedCard 
            variant="glass" 
            style={styles.overallProgressCard}
            animationDelay={50}
          >
            <View style={styles.overallProgressHeader}>
              <Text style={[styles.overallProgressTitle, { color: theme.colors.text }]}>
                Общо изпълнение
              </Text>
              <Text style={[styles.overallProgressPercentage, { color: theme.colors.accent }]}>
                {budgetStats.totalBudget > 0 ? ((budgetStats.totalSpent / budgetStats.totalBudget) * 100).toFixed(0) : 0}%
              </Text>
            </View>
            
            <View style={[styles.overallProgressTrack, { backgroundColor: theme.colors.background }]}>
              <LinearGradient
                colors={budgetStats.totalSpent > budgetStats.totalBudget ? [theme.colors.error, `${theme.colors.error}80`] : theme.colors.primaryGradient}
                style={[
                  styles.overallProgressFill,
                  { width: `${budgetStats.totalBudget > 0 ? Math.min((budgetStats.totalSpent / budgetStats.totalBudget) * 100, 100) : 0}%` }
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            
            <View style={styles.progressDetails}>
              <Text style={[styles.progressDetailText, { color: theme.colors.textSecondary }]}>
                {budgetStats.totalBudget > 0 ? (
                  budgetStats.totalSpent > budgetStats.totalBudget 
                    ? `Превишен с ${(budgetStats.totalSpent - budgetStats.totalBudget).toFixed(2)} €`
                    : `В рамките на бюджета`
                ) : 'Няма активни бюджети'}
              </Text>
            </View>
          </SimpleAnimatedCard>
        </View>

        {/* Списък с бюджети */}
        <View style={styles.budgetsSection}>
          {error ? (
            renderErrorState()
          ) : isLoading ? (
            renderLoadingState()
          ) : (
            <>
              <View style={styles.budgetsSectionHeader}>
                <Text style={[styles.budgetsSectionTitle, { color: theme.colors.text }]}>
                  Активни бюджети ({budgetStats.activeBudgets})
                </Text>
              </View>
              
              {validBudgets.length > 0 ? (
                <FlatList
                  data={validBudgets}
                  renderItem={renderBudget}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={5}
                  windowSize={10}
                />
              ) : (
                <SimpleAnimatedCard 
                  variant="glass" 
                  style={styles.emptyCard}
                  animationDelay={200}
                >
                  <View style={styles.emptyContent}>
                    <View style={styles.emptyIcon}>
                      <LinearGradient
                        colors={theme.colors.primaryGradient}
                        style={styles.emptyIconGradient}
                      >
                        <BudgetsIcon color="#F7E7CE" size={32} />
                      </LinearGradient>
                    </View>
                    
                    <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                      Няма създадени бюджети
                    </Text>
                    <Text style={[styles.emptyDescription, { color: theme.colors.textSecondary }]}>
                      Създайте първия си бюджет и започнете да следите разходите си
                    </Text>
                    
                    <PremiumButton
                      title="Създай първи бюджет"
                      variant="primary"
                      onPress={() => navigation.navigate(SCREENS.ADD_BUDGET)}
                      style={styles.createFirstButton}
                    />
                  </View>
                </SimpleAnimatedCard>
              )}
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
    alignItems: 'center',
    gap: 16,
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  addButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(247, 231, 206, 0.3)',
    borderRadius: 22,
  },
  addButtonText: {
    fontSize: 24,
    color: '#F7E7CE',
    fontWeight: '300',
  },
  
  // Обновени стилове за съдържанието
  scrollView: {
    flex: 1,
    marginTop: -12,
    paddingTop: 20,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  
  // Статистики секция
  statsSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
  },
  sectionIcon: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionIconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '400',
  },
  statsContainer: {
    marginBottom: 20,
  },
  
  // Общ прогрес карта
  overallProgressCard: {
    padding: 20,
    marginBottom: 8,
  },
  overallProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  overallProgressTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  overallProgressPercentage: {
    fontSize: 18,
    fontWeight: '700',
  },
  overallProgressTrack: {
    height: 12,
    borderRadius: 6,
    marginBottom: 12,
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressDetails: {
    alignItems: 'center',
  },
  progressDetailText: {
    fontSize: 13,
    fontWeight: '500',
  },
  
  // Бюджети секция
  budgetsSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  budgetsSectionHeader: {
    marginBottom: 16,
  },
  budgetsSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  
  // Бюджет карти
  budgetCard: {
    marginBottom: 16,
    padding: 0,
  },
  budgetContent: {
    padding: 20,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  categorySection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    overflow: 'hidden',
  },
  categoryIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIconText: {
    fontSize: 24,
    fontWeight: '700',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 12,
  },
  inactiveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  inactiveBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  budgetStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  periodBadge: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  toggleButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButtonText: {
    fontSize: 16,
  },
  
  // Прогрес секция
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressTrack: {
    height: 12,
    borderRadius: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 6,
    opacity: 0.3,
    shadowColor: 'currentColor',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  
  // Суми grid
  amountGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  amountItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  amountIndicator: {
    width: 24,
    height: 3,
    borderRadius: 1.5,
  },
  
  // Правила секция
  rulesSection: {
    marginTop: 8,
  },
  rulesSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rulesIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  rulesIconText: {
    fontSize: 12,
  },
  rulesTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  rulesList: {
    gap: 8,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ruleIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ruleIcon: {
    fontSize: 10,
  },
  ruleDescription: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  
  // Празно състояние
  emptyCard: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 24,
    overflow: 'hidden',
  },
  emptyIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIconText: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createFirstButton: {
    minWidth: 200,
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

export default BudgetsScreen; 