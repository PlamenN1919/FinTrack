import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

// Тематичен контекст
import { useTheme } from '../utils/ThemeContext';
import { useTransactions } from '../utils/TransactionContext';
import { useBudgets } from '../utils/BudgetContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, EMOTIONS } from '../utils/constants';

// UI компоненти
import SimpleAnimatedCard from '../components/ui/SimpleAnimatedCard';
import PremiumButton from '../components/ui/PremiumButton';

const AddTransactionScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { addTransaction } = useTransactions();
  const { updateBudgetSpending } = useBudgets();
  
  // Състояния за формата
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [isExpense, setIsExpense] = useState(true);
  const [emotion, setEmotion] = useState(EMOTIONS.NEUTRAL);
  const [selectedIcon, setSelectedIcon] = useState('');
  
  // Масив с категории според типа транзакция
  const categoryOptions = isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  
  // Емоции за избор
  const emotions = [
    { id: EMOTIONS.HAPPY, label: 'Щастлив', icon: '😊' },
    { id: EMOTIONS.SAD, label: 'Тъжен', icon: '😔' },
    { id: EMOTIONS.STRESSED, label: 'Стресиран', icon: '😖' },
    { id: EMOTIONS.EXCITED, label: 'Развълнуван', icon: '😃' },
    { id: EMOTIONS.BORED, label: 'Отегчен', icon: '😒' },
    { id: EMOTIONS.NEUTRAL, label: 'Неутрален', icon: '😐' },
  ];

  // Функция за избор на категория
  const selectCategory = (categoryKey: string, categoryData: any) => {
    setCategory(categoryData.name);
    // Автоматично избираме първата икона
    if (categoryData.icons && categoryData.icons.length > 0) {
      setSelectedIcon(categoryData.icons[0]);
    }
  };

  // Функция за запазване на транзакцията
  const saveTransaction = () => {
    if (!amount || !category) {
      Alert.alert('Грешка', 'Моля, попълнете сума и категория');
      return;
    }

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount)) {
      Alert.alert('Грешка', 'Моля, въведете валидна сума');
      return;
    }

    // Създаваме обект с данните на транзакцията
    const transactionData = {
      amount: isExpense ? -parsedAmount : parsedAmount,
      category,
      date,
      merchant,
      note,
      emotionalState: emotion,
      paymentMethod: 'Карта', // По подразбиране
      icon: selectedIcon || '💰', // По подразбиране икона
    };

    // Добавяме транзакцията чрез Context
    addTransaction(transactionData);
    
    // ВАЖНО: Обновяваме бюджетите при нова транзакция
    if (isExpense) {
      updateBudgetSpending(category, transactionData.amount);
    }
    
    // Навигация назад с успешно съобщение
    Alert.alert('Успех', 'Транзакцията е запазена успешно', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={theme.colors.primary}
        translucent={true}
      />
      
      {/* Луксозен header с градиент */}
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
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(247, 231, 206, 0.2)', 'rgba(247, 231, 206, 0.1)']}
                  style={styles.backButtonGradient}
                >
                  <Text style={styles.backButtonText}>‹</Text>
                </LinearGradient>
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>Нова транзакция</Text>
                <Text style={styles.headerSubtitle}>
                  Добавете своя разход или приход
                </Text>
              </View>
              <View style={styles.headerRight} />
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Превключвател за тип транзакция - Модернизиран */}
        <SimpleAnimatedCard style={styles.typeSelectorCard} animationDelay={50}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Тип транзакция
          </Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                isExpense && styles.typeButtonActive,
                { 
                  borderColor: isExpense ? '#F44336' : 'rgba(244, 67, 54, 0.3)',
                  backgroundColor: isExpense ? 'transparent' : 'rgba(244, 67, 54, 0.05)'
                }
              ]}
              onPress={() => setIsExpense(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isExpense ? ['#FF5722', '#F44336', '#E53935'] : ['transparent', 'transparent']}
                style={styles.typeButtonGradient}
              >
                <View style={styles.typeButtonIconContainer}>
                  <Text style={[
                    styles.typeButtonIcon,
                    { 
                      color: isExpense ? '#FFFFFF' : '#F44336',
                    }
                  ]}>−</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.typeButton,
                !isExpense && styles.typeButtonActive,
                { 
                  borderColor: !isExpense ? '#4CAF50' : 'rgba(76, 175, 80, 0.3)',
                  backgroundColor: !isExpense ? 'transparent' : 'rgba(76, 175, 80, 0.05)'
                }
              ]}
              onPress={() => setIsExpense(false)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={!isExpense ? ['#66BB6A', '#4CAF50', '#43A047'] : ['transparent', 'transparent']}
                style={styles.typeButtonGradient}
              >
                <View style={styles.typeButtonIconContainer}>
                  <Text style={[
                    styles.typeButtonIcon,
                    { 
                      color: !isExpense ? '#FFFFFF' : '#4CAF50',
                    }
                  ]}>+</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SimpleAnimatedCard>

        {/* Поле за сума - Модернизирано */}
        <SimpleAnimatedCard style={styles.inputCard} animationDelay={100}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Сума
          </Text>
          <View style={styles.amountInputContainer}>
            <TextInput
              style={[styles.amountInput, { color: theme.colors.text }]}
              placeholder="0.00"
              placeholderTextColor={theme.colors.textSecondary + '80'}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <Text style={[styles.currencyLabel, { color: theme.colors.textSecondary }]}>лв</Text>
          </View>
        </SimpleAnimatedCard>

        {/* Поле за категория - Модернизирано */}
        <SimpleAnimatedCard style={styles.inputCard} animationDelay={150}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Категория
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryContainer}
          >
            {Object.entries(categoryOptions).map(([key, categoryData]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.categoryChip,
                  category === categoryData.name && { 
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.primary,
                    elevation: 6,
                    shadowColor: theme.colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    transform: [{ scale: 1.05 }],
                  }
                ]}
                onPress={() => selectCategory(key, categoryData)}
                activeOpacity={0.8}
              >
                <Text style={styles.categoryChipIcon}>
                  {categoryData.icons?.[0] || '📝'}
                </Text>
                <Text 
                  style={[
                    styles.categoryChipText, 
                    { 
                      color: category === categoryData.name 
                        ? 'white' 
                        : theme.colors.text 
                    }
                  ]}
                >
                  {categoryData.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SimpleAnimatedCard>

        {/* Избор на икона - Подобрен */}
        {category && (
          <SimpleAnimatedCard style={styles.inputCard} animationDelay={200}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Избери икона
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.iconContainer}
            >
              {Object.entries(categoryOptions)
                .find(([key, categoryData]) => categoryData.name === category)?.[1]?.icons?.map((icon: string, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.iconButton,
                    selectedIcon === icon && { 
                      backgroundColor: theme.colors.primary + '20',
                      borderColor: theme.colors.primary,
                      elevation: 6,
                      shadowColor: theme.colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.25,
                      shadowRadius: 10,
                      transform: [{ scale: 1.1 }],
                    }
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.iconText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </SimpleAnimatedCard>
        )}

        {/* Поле за търговец - Подобрено */}
        <SimpleAnimatedCard style={styles.inputCard} animationDelay={250}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Търговец / Източник
          </Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>🏪</Text>
            <TextInput
              style={[styles.textInput, { color: theme.colors.text }]}
              placeholder="Въведете име на търговец"
              placeholderTextColor={theme.colors.textSecondary + '80'}
              value={merchant}
              onChangeText={setMerchant}
            />
          </View>
        </SimpleAnimatedCard>

        {/* Поле за дата - Подобрено */}
        <SimpleAnimatedCard style={styles.inputCard} animationDelay={300}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Дата
          </Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>📅</Text>
            <TextInput
              style={[styles.textInput, { color: theme.colors.text }]}
              placeholder="ГГГГ-ММ-ДД"
              placeholderTextColor={theme.colors.textSecondary + '80'}
              value={date}
              onChangeText={setDate}
            />
          </View>
        </SimpleAnimatedCard>

        {/* Поле за бележка - Подобрено */}
        <SimpleAnimatedCard style={styles.inputCard} animationDelay={350}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Бележка
          </Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>📝</Text>
            <TextInput
              style={[styles.textInput, styles.noteInput, { color: theme.colors.text }]}
              placeholder="Добавете допълнителна информация"
              placeholderTextColor={theme.colors.textSecondary + '80'}
              multiline
              value={note}
              onChangeText={setNote}
            />
          </View>
        </SimpleAnimatedCard>

        {/* Емоционален анализ - Подобрен */}
        <SimpleAnimatedCard style={styles.inputCard} animationDelay={400}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Как се чувствате?
          </Text>
          <View style={styles.emotionsGrid}>
            {emotions.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.emotionButton,
                  emotion === item.id && { 
                    backgroundColor: theme.colors.primary + '15',
                    borderColor: theme.colors.primary,
                    elevation: 4,
                    shadowColor: theme.colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    transform: [{ scale: 1.05 }],
                  }
                ]}
                onPress={() => setEmotion(item.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.emotionIcon}>{item.icon}</Text>
                <Text 
                  style={[
                    styles.emotionLabel, 
                    { 
                      color: emotion === item.id 
                        ? theme.colors.primary 
                        : theme.colors.textSecondary 
                    }
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SimpleAnimatedCard>

        {/* Бутон за запазване - Премиум */}
        <SimpleAnimatedCard style={styles.saveButtonCard} animationDelay={450}>
          <PremiumButton
            title="Запази транзакцията"
            onPress={saveTransaction}
            variant="primary"
            size="large"
            style={styles.saveButton}
          />
        </SimpleAnimatedCard>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header стилове
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
    fontSize: 24,
    color: '#F7E7CE',
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 44,
    marginTop: -2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F7E7CE',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(247, 231, 206, 0.7)',
    fontWeight: '400',
  },
  headerRight: {
    width: 44,
  },
  
  // Content стилове
  contentContainer: {
    flex: 1,
    marginTop: -12,
    paddingTop: 20,
  },
  
  // Card стилове
  typeSelectorCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
  },
  inputCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
  },
  saveButtonCard: {
    marginHorizontal: 20,
    marginBottom: 100,
    marginTop: 8,
  },
  
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  
  // Type selector стилове - Модернизирани
  typeSelector: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  typeButton: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  typeButtonActive: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    transform: [{ scale: 1.02 }],
  },
  typeButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    height: 60,
  },
  typeButtonIconContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  typeButtonIcon: {
    fontSize: 32,
    fontWeight: '200',
    textAlign: 'center',
    includeFontPadding: false,
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: 6,
  },
  
  // Amount input стилове
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    paddingBottom: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '300',
    textAlign: 'center',
  },
  currencyLabel: {
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 8,
  },
  
  // Input wrapper стилове
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    paddingBottom: 8,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
  },
  noteInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  
  // Category стилове - Модернизирани
  categoryContainer: {
    paddingVertical: 8,
    gap: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    minHeight: 48,
  },
  categoryChipIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  categoryChipText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  
  // Icon стилове - Модернизирани
  iconContainer: {
    paddingVertical: 8,
    gap: 12,
  },
  iconButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    marginRight: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  iconText: {
    fontSize: 28,
  },
  
  // Emotions стилове - Модернизирани
  emotionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 4,
  },
  emotionButton: {
    width: '30%',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    padding: 18,
    alignItems: 'center',
    minHeight: 88,
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  emotionIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  emotionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  
  // Save button стилове
  saveButton: {
    marginTop: 8,
  },
});

export default AddTransactionScreen; 