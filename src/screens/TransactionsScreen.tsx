import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  StatusBar,
  Animated,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../utils/ThemeContext';
import { useTransactions } from '../utils/TransactionContext';
import { SCREENS, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/constants';

// Модерни UI компоненти
import ModernCard from '../components/ui/ModernCard';
import ModernButton from '../components/ui/ModernButton';
import ModernInput from '../components/ui/ModernInput';
import SimpleAnimatedCard from '../components/ui/SimpleAnimatedCard';
import PremiumButton from '../components/ui/PremiumButton';
import AnimatedTransactionItem from '../components/ui/AnimatedTransactionItem';
import FloatingActionButton from '../components/ui/FloatingActionButton';
import AnimatedStats from '../components/ui/AnimatedStats';

const TransactionsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { transactions, refetchTransactions } = useTransactions();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Всички');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState('date'); // 'date', 'amount', 'category'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  
  // Филтриране и търсене на транзакции с error handling и мемоизация
  const filteredTransactions = useMemo(() => {
    try {
      setError(null);
      
      if (!transactions || transactions.length === 0) {
        return [];
      }

      return transactions
        .filter(transaction => {
          try {
            if (!transaction) return false;
            
            const merchant = transaction.merchant || '';
            const description = transaction.description || transaction.note || '';
            const category = transaction.category || '';
            
            const matchesSearch = merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'Всички' || category === selectedCategory;
            
            return matchesSearch && matchesCategory;
          } catch (filterError) {
            console.warn('Грешка при филтриране на транзакция:', filterError);
            return false;
          }
        })
        .sort((a, b) => {
          try {
            let comparison = 0;
            
            switch (sortBy) {
              case 'date':
                const dateA = new Date(a.date || Date.now()).getTime();
                const dateB = new Date(b.date || Date.now()).getTime();
                comparison = dateA - dateB;
                break;
              case 'amount':
                const amountA = Math.abs(a.amount || 0);
                const amountB = Math.abs(b.amount || 0);
                comparison = amountA - amountB;
                break;
              case 'category':
                const categoryA = a.category || '';
                const categoryB = b.category || '';
                comparison = categoryA.localeCompare(categoryB);
                break;
              default:
                comparison = 0;
            }
            
            return sortOrder === 'asc' ? comparison : -comparison;
          } catch (sortError) {
            console.warn('Грешка при сортиране на транзакции:', sortError);
            return 0;
          }
        });
    } catch (error) {
      console.error('Грешка при обработка на транзакции:', error);
      setError('Грешка при зареждане на транзакциите');
      return [];
    }
  }, [transactions, searchQuery, selectedCategory, sortBy, sortOrder]);

  // Изчисляване на статистики с trend и error handling
  const monthlyStats = useMemo(() => {
    try {
      if (!filteredTransactions || filteredTransactions.length === 0) {
        return { currentMonthIncome: 0, currentMonthExpense: 0 };
      }

      const currentMonthIncome = filteredTransactions
        .filter(t => t && typeof t.amount === 'number' && t.amount > 0)
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const currentMonthExpense = filteredTransactions
        .filter(t => t && typeof t.amount === 'number' && t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

      return { currentMonthIncome, currentMonthExpense };
    } catch (error) {
      console.error('Грешка при изчисляване на статистики:', error);
      return { currentMonthIncome: 0, currentMonthExpense: 0 };
    }
  }, [filteredTransactions]);

  const { currentMonthIncome, currentMonthExpense } = monthlyStats;

  // Изчисляване на данни за предишния месец за сравнение
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const previousMonth = currentDate.getMonth() - 1;
  const previousYear = previousMonth < 0 ? currentYear - 1 : currentYear;
  const adjustedPreviousMonth = previousMonth < 0 ? 11 : previousMonth;

  const previousMonthTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate.getMonth() === adjustedPreviousMonth && 
           transactionDate.getFullYear() === previousYear;
  });

  const previousMonthIncome = previousMonthTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
    
  const previousMonthExpense = Math.abs(previousMonthTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0));

  // Изчисляване на реални проценти за промяна
  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const incomeChange = calculatePercentageChange(currentMonthIncome, previousMonthIncome);
  const expenseChange = calculatePercentageChange(currentMonthExpense, previousMonthExpense);
  const currentBalance = currentMonthIncome - currentMonthExpense;
  const previousBalance = previousMonthIncome - previousMonthExpense;
  const balanceChange = calculatePercentageChange(currentBalance, previousBalance);

  // Обновяване на статистиките при промяна на транзакциите
  useEffect(() => {
    console.log('Статистиките се обновиха:', {
      totalTransactions: transactions.length,
      currentMonthIncome: currentMonthIncome.toFixed(2),
      currentMonthExpense: currentMonthExpense.toFixed(2),
      incomeChange: `${incomeChange}%`,
      expenseChange: `${expenseChange}%`,
      balanceChange: `${balanceChange}%`
    });
  }, [transactions, currentMonthIncome, currentMonthExpense, incomeChange, expenseChange, balanceChange]);

  // Получаване на емоция икона
  const getEmotionIcon = (emotion: string) => {
    switch (emotion) {
      case 'happy': return '😊';
      case 'stressed': return '😰';
      case 'sad': return '😢';
      case 'angry': return '😠';
      case 'excited': return '🤩';
      default: return '😐';
    }
  };

  // Получаване на категория цвят с error handling
  const getCategoryColor = useCallback((category: string, amount: number) => {
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
  }, []);

  // Рендериране на транзакция с подобрени визуални ефекти и error handling
  const renderTransaction = useCallback(({ item, index }: { item: any; index: number }) => {
    try {
      if (!item) {
        return null;
      }

      const safeItem = {
        id: item.id || `transaction-${index}`,
        merchant: item.merchant || 'Неизвестен търговец',
        category: item.category || 'Други',
        amount: typeof item.amount === 'number' ? item.amount : 0,
        date: item.date || new Date().toISOString(),
        description: item.description || item.note || 'Няма описание',
        emotion: item.emotion || item.emotionalState || 'neutral',
        icon: item.icon || (item.amount > 0 ? '💰' : '💳'),
      };

      return (
    <SimpleAnimatedCard 
      variant="elevated" 
      style={styles.transactionItem}
      onPress={() => navigation.navigate(SCREENS.TRANSACTION_DETAILS, { id: safeItem.id })}
      animationDelay={index * 50}
    >
      <View style={styles.transactionHeader}>
        <LinearGradient
          colors={[
            getCategoryColor(safeItem.category, safeItem.amount) + '20',
            getCategoryColor(safeItem.category, safeItem.amount) + '10'
          ]}
          style={[styles.categoryIcon, { borderColor: getCategoryColor(safeItem.category, safeItem.amount) + '40' }]}
        >
          <Text style={styles.categoryIconText}>
            {safeItem.icon}
          </Text>
        </LinearGradient>
        
        <View style={styles.transactionInfo}>
          <Text style={[styles.merchantName, { color: theme.colors.text }]}>
            {safeItem.merchant}
          </Text>
          <Text style={[styles.transactionDescription, { color: theme.colors.textSecondary }]}>
            {safeItem.description}
          </Text>
          <View style={styles.categoryRow}>
            <View style={[
              styles.categoryBadge,
              { backgroundColor: getCategoryColor(safeItem.category, safeItem.amount) + '20' }
            ]}>
              <Text style={[
                styles.categoryBadgeText,
                { color: getCategoryColor(safeItem.category, safeItem.amount) }
              ]}>
                {safeItem.category}
              </Text>
            </View>
            <Text style={styles.emotionIcon}>
              {getEmotionIcon(safeItem.emotion)}
            </Text>
          </View>
        </View>
        
        <View style={styles.transactionRight}>
          <Text style={[
            styles.transactionAmount,
            { color: safeItem.amount > 0 ? '#4CAF50' : theme.colors.text }
          ]}>
            {safeItem.amount > 0 ? '+' : ''}{safeItem.amount.toFixed(2)} €
          </Text>
          <Text style={[styles.transactionDate, { color: theme.colors.textSecondary }]}>
            {new Date(safeItem.date).toLocaleDateString('bg-BG')}
          </Text>
          <View style={[
            styles.amountBadge,
            { backgroundColor: safeItem.amount > 0 ? '#4CAF5020' : '#F4433620' }
          ]}>
            <Text style={[
              styles.amountBadgeText,
              { color: safeItem.amount > 0 ? '#4CAF50' : '#F44336' }
            ]}>
              {safeItem.amount > 0 ? 'Приход' : 'Разход'}
            </Text>
          </View>
        </View>
      </View>
    </SimpleAnimatedCard>
      );
    } catch (error) {
      console.error('Грешка при рендериране на транзакция:', error);
      return null;
    }
  }, [theme.colors, navigation]);

  // Рендериране на филтър модал
  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            Филтри и сортиране
          </Text>
          
          {/* Категории */}
          <Text style={[styles.filterSectionTitle, { color: theme.colors.text }]}>
            Категория
          </Text>
          <View style={styles.categoryFilters}>
            {['Всички', 
              ...Object.values(EXPENSE_CATEGORIES).map(cat => cat.name),
              ...Object.values(INCOME_CATEGORIES).map(cat => cat.name)
            ].map((category, index) => (
              <TouchableOpacity
                key={`category-${index}-${category}`}
                style={[
                  styles.categoryFilter,
                  {
                    backgroundColor: selectedCategory === category 
                      ? theme.colors.primary 
                      : theme.colors.background
                  }
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryFilterText,
                  {
                    color: selectedCategory === category 
                      ? 'white' 
                      : theme.colors.text
                  }
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Сортиране */}
          <Text style={[styles.filterSectionTitle, { color: theme.colors.text }]}>
            Сортиране по
          </Text>
          <View style={styles.sortOptions}>
            {[
              { key: 'date', label: 'Дата' },
              { key: 'amount', label: 'Сума' },
              { key: 'category', label: 'Категория' }
            ].map(option => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortOption,
                  {
                    backgroundColor: sortBy === option.key 
                      ? theme.colors.primary 
                      : theme.colors.background
                  }
                ]}
                onPress={() => setSortBy(option.key)}
              >
                <Text style={[
                  styles.sortOptionText,
                  {
                    color: sortBy === option.key 
                      ? 'white' 
                      : theme.colors.text
                  }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Ред на сортиране */}
          <View style={styles.sortOrderContainer}>
            <TouchableOpacity
              style={[
                styles.sortOrderButton,
                {
                  backgroundColor: sortOrder === 'desc' 
                    ? theme.colors.primary 
                    : theme.colors.background
                }
              ]}
              onPress={() => setSortOrder('desc')}
            >
              <Text style={[
                styles.sortOrderText,
                {
                  color: sortOrder === 'desc' 
                    ? 'white' 
                    : theme.colors.text
                }
              ]}>
                Низходящо
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sortOrderButton,
                {
                  backgroundColor: sortOrder === 'asc' 
                    ? theme.colors.primary 
                    : theme.colors.background
                }
              ]}
              onPress={() => setSortOrder('asc')}
            >
              <Text style={[
                styles.sortOrderText,
                {
                  color: sortOrder === 'asc' 
                    ? 'white' 
                    : theme.colors.text
                }
              ]}>
                Възходящо
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={[styles.closeModalButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => setShowFilterModal(false)}
          >
            <Text style={styles.closeModalButtonText}>Затвори</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Pull to refresh с error handling
  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      // Използваме реалната refetchTransactions функция
      await refetchTransactions();
      
    } catch (error) {
      console.error('Грешка при обновяване на транзакции:', error);
      setError('Неуспешно обновяване. Опитайте отново.');
    } finally {
      setRefreshing(false);
    }
  }, [refetchTransactions]);

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
                <Text style={styles.headerTitle}>Транзакции</Text>
                <Text style={styles.headerSubtitle}>
                  {filteredTransactions.length} от {transactions.length} транзакции
                </Text>
              </View>
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => setShowFilterModal(true)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['rgba(247, 231, 206, 0.2)', 'rgba(247, 231, 206, 0.1)']}
                    style={styles.filterButtonGradient}
                  >
                    <Text style={styles.filterButtonText}>🔧</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      <View style={styles.contentContainer}>
        {/* Модерно търсене */}
        <View style={styles.searchContainer}>
          <View style={styles.searchWrapper}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Търси транзакции..."
              placeholderTextColor="rgba(26, 26, 26, 0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

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
                  onRefresh();
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
              Зареждане на транзакции...
            </Text>
          </View>
        )}

        {/* Статистики с AnimatedStats компонент като в HomeScreen */}
        <View style={styles.statsSection}>
          <AnimatedStats
            stats={[
              {
                label: 'Приходи',
                value: `+${currentMonthIncome.toFixed(0)} €`,
                change: incomeChange,
                changeType: incomeChange > 0 ? 'positive' as const : 'negative' as const,
                color: '#4CAF50',
              },
              {
                label: 'Разходи',
                value: `-${currentMonthExpense.toFixed(0)} €`,
                change: Math.abs(expenseChange),
                changeType: expenseChange > 0 ? 'negative' as const : 'positive' as const,
                color: '#F44336',
              },
              {
                label: 'Баланс',
                value: `${(currentMonthIncome - currentMonthExpense).toFixed(0)} €`,
                change: balanceChange,
                changeType: balanceChange > 0 ? 'positive' as const : 'negative' as const,
                color: '#FF9800',
              },
            ]}
            variant="horizontal"
            style={styles.statsContainer}
            animationDelay={100}
            onStatPress={(stat, index) => {
              console.log(`Статистика ${index} натисната:`, stat.label);
            }}
          />
        </View>

        {/* Списък с транзакции с pull-to-refresh и оптимизации */}
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item?.id || `transaction-${Math.random()}`}
          getItemLayout={(data, index) => ({
            length: 120,
            offset: 120 * index,
            index,
          })}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
          style={[styles.transactionsList, { marginTop: 16 }]}
          contentContainerStyle={styles.transactionsListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
              progressBackgroundColor={theme.colors.card}
            />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Няма намерени транзакции
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                Опитайте различни филтри или добавете нови транзакции
              </Text>
            </View>
          }
        />

        {/* Филтър модал */}
        {renderFilterModal()}
      </View>

      {/* Floating Action Button - подобрено позициониране */}
      <FloatingActionButton
        title="Добави транзакция"
        onPress={() => navigation.navigate(SCREENS.ADD_TRANSACTION)}
        variant="primary"
        size="large"
        style={styles.fab}
        enablePulse={true}
      />
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
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  filterButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(247, 231, 206, 0.3)',
    borderRadius: 22,
  },
  filterButtonText: {
    fontSize: 18,
    color: '#F7E7CE',
  },
  
  // Нови content стилове
  contentContainer: {
    flex: 1,
    marginTop: -12,
    paddingTop: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 12,
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  clearIcon: {
    fontSize: 18,
    color: '#D4AF37',
    marginLeft: 8,
    fontWeight: 'bold',
    padding: 4,
  },
  
  // Нови статистики стилове - Луксозни и премиум НА ЕДИН РЕД - ОПРАВЕН SPACING
  statsSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  transactionsList: {
    flex: 1,
  },
  transactionsListContent: {
    paddingBottom: 120,
  },
  transactionItem: {
    marginBottom: 8,
    marginHorizontal: 16,
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
  emotionIcon: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 16,
  },
  categoryFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryFilter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryFilterText: {
    fontSize: 14,
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sortOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortOrderContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  sortOrderButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  sortOrderText: {
    fontSize: 14,
    fontWeight: '500',
  },
  closeModalButton: {
    marginTop: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
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
  amountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  amountBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    zIndex: 1000,
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

export default TransactionsScreen; 