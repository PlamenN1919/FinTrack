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
import { useBudgets, ContextualRule } from '../utils/BudgetContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/constants';

// Предефинирани цветове за бюджети
const BUDGET_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

// Типове контекстуални правила
const RULE_TYPES = [
  { type: 'seasonal', name: 'Сезонно', icon: '🌟', description: 'Промени според сезона' },
  { type: 'compensatory', name: 'Компенсаторно', icon: '⚖️', description: 'Компенсация при превишаване' },
  { type: 'weather', name: 'Времето', icon: '🌦️', description: 'Зависи от времето' },
  { type: 'social', name: 'Социално', icon: '👥', description: 'Социални фактори' },
  { type: 'emotional', name: 'Емоционално', icon: '💭', description: 'Емоционално състояние' },
];

const AddBudgetScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { addBudget } = useBudgets();
  
  // Състояния за формата
  const [category, setCategory] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [selectedColor, setSelectedColor] = useState(BUDGET_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState('');
  const [contextualRules, setContextualRules] = useState<ContextualRule[]>([]);
  const [newRuleType, setNewRuleType] = useState<ContextualRule['type']>('seasonal');
  const [newRuleDescription, setNewRuleDescription] = useState('');

  // Всички категории (разходи + приходи)
  const allCategories = {
    ...EXPENSE_CATEGORIES,
    ...INCOME_CATEGORIES,
  };

  // Функция за избор на категория
  const selectCategory = (categoryKey: string, categoryData: any) => {
    setCategory(categoryData.name);
    // Автоматично избираме първата икона
    if (categoryData.icons && categoryData.icons.length > 0) {
      setSelectedIcon(categoryData.icons[0]);
    }
  };

  // Функция за добавяне на контекстуално правило
  const addContextualRule = () => {
    if (!newRuleDescription.trim()) {
      Alert.alert('Грешка', 'Моля, въведете описание на правилото');
      return;
    }

    const newRule: ContextualRule = {
      type: newRuleType,
      description: newRuleDescription.trim(),
    };

    setContextualRules(prev => [...prev, newRule]);
    setNewRuleDescription('');
  };

  // Функция за премахване на контекстуално правило
  const removeContextualRule = (index: number) => {
    setContextualRules(prev => prev.filter((_, i) => i !== index));
  };

  // Функция за изчисляване на дати според периода
  const calculateDates = (period: string) => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    let endDate = new Date();

    switch (period) {
      case 'weekly':
        const dayOfWeek = now.getDay();
        startDate.setDate(now.getDate() - dayOfWeek);
        endDate.setDate(startDate.getDate() + 6);
        break;
      case 'monthly':
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'yearly':
        startDate.setMonth(0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  };

  // Функция за запазване на бюджета
  const saveBudget = () => {
    if (!category || !budgetAmount) {
      Alert.alert('Грешка', 'Моля, попълнете категория и сума');
      return;
    }

    const parsedAmount = parseFloat(budgetAmount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Грешка', 'Моля, въведете валидна сума');
      return;
    }

    const { startDate, endDate } = calculateDates(period);

    // Създаваме обект с данните на бюджета
    const budgetData = {
      category,
      budget: parsedAmount,
      period,
      contextualRules,
      isActive: true,
      color: selectedColor,
      icon: selectedIcon || '💰',
      startDate,
      endDate,
    };

    // Добавяме бюджета чрез Context
    addBudget(budgetData);
    
    // Навигация към екрана с бюджети
    Alert.alert('Успех', `Бюджетът е създаден успешно!\n\nБюджетът ще проследява всички транзакции за периода ${startDate} - ${endDate}.`, [
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
                <Text style={styles.headerTitle}>Нов бюджет</Text>
                <Text style={styles.headerSubtitle}>
                  Създайте персонализиран бюджет
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Информативен панел */}
        <View style={[styles.infoPanel, { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary + '30' }]}>
          <View style={styles.infoPanelHeader}>
            <Text style={styles.infoPanelIcon}>ℹ️</Text>
            <Text style={[styles.infoPanelTitle, { color: theme.colors.primary }]}>
              Важно за бюджетите
            </Text>
          </View>
          <Text style={[styles.infoPanelText, { color: theme.colors.text }]}>
            Бюджетът ще проследява{' '}
            <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>
              всички транзакции за избрания период
            </Text>
            {' '}(седмичен, месечен или годишен), независимо дали са направени преди или след създаването на бюджета.
          </Text>
        </View>

        {/* Поле за категория */}
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Категория</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryContainer}
          >
            {Object.entries(allCategories).map(([key, categoryData]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.categoryButton,
                  category === categoryData.name && { backgroundColor: theme.colors.primary }
                ]}
                onPress={() => selectCategory(key, categoryData)}
              >
                <Text 
                  style={[
                    styles.categoryButtonText, 
                    { color: category === categoryData.name ? '#FFFFFF' : theme.colors.text }
                  ]}
                >
                  {categoryData.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Избор на икона */}
        {category && (
          <View style={[styles.inputContainer, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Избери икона</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.iconContainer}
            >
              {Object.entries(allCategories)
                .find(([key, categoryData]) => categoryData.name === category)?.[1]?.icons?.map((icon: string, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.iconButton,
                    selectedIcon === icon && { backgroundColor: theme.colors.primary + '30', borderColor: theme.colors.primary }
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <Text style={styles.iconText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Поле за сума */}
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Бюджет</Text>
          <TextInput
            style={[styles.amountInput, { color: theme.colors.text }]}
            placeholder="0.00"
            placeholderTextColor={theme.colors.textSecondary + '80'}
            keyboardType="numeric"
            value={budgetAmount}
            onChangeText={setBudgetAmount}
          />
          <Text style={[styles.currencyLabel, { color: theme.colors.textSecondary }]}>€</Text>
        </View>

        {/* Избор на период */}
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Период</Text>
          <View style={styles.periodContainer}>
            {[
              { key: 'weekly', label: 'Седмично' },
              { key: 'monthly', label: 'Месечно' },
              { key: 'yearly', label: 'Годишно' }
            ].map((periodOption) => (
              <TouchableOpacity
                key={periodOption.key}
                style={[
                  styles.periodButton,
                  period === periodOption.key && { backgroundColor: theme.colors.primary }
                ]}
                onPress={() => setPeriod(periodOption.key as any)}
              >
                <Text 
                  style={[
                    styles.periodButtonText, 
                    { color: period === periodOption.key ? '#FFFFFF' : theme.colors.text }
                  ]}
                >
                  {periodOption.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Избор на цвят */}
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Цвят</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.colorContainer}
          >
            {BUDGET_COLORS.map((color, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.colorButton,
                  { backgroundColor: color },
                  selectedColor === color && { borderWidth: 3, borderColor: theme.colors.text }
                ]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Контекстуални правила */}
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Контекстуални правила</Text>
          
          {/* Съществуващи правила */}
          {contextualRules.map((rule, index) => (
            <View key={index} style={styles.ruleItem}>
              <View style={styles.ruleInfo}>
                <Text style={styles.ruleIcon}>
                  {RULE_TYPES.find(r => r.type === rule.type)?.icon || '📋'}
                </Text>
                <View style={styles.ruleTextContainer}>
                  <Text style={[styles.ruleType, { color: theme.colors.text }]}>
                    {RULE_TYPES.find(r => r.type === rule.type)?.name || rule.type}
                  </Text>
                  <Text style={[styles.ruleDescription, { color: theme.colors.textSecondary }]}>
                    {rule.description}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.removeRuleButton}
                onPress={() => removeContextualRule(index)}
              >
                <Text style={[styles.removeRuleText, { color: theme.colors.error }]}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Добавяне на ново правило */}
          <View style={styles.addRuleContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.ruleTypeContainer}
            >
              {RULE_TYPES.map((ruleType) => (
                <TouchableOpacity
                  key={ruleType.type}
                  style={[
                    styles.ruleTypeButton,
                    newRuleType === ruleType.type && { backgroundColor: theme.colors.primary }
                  ]}
                                     onPress={() => setNewRuleType(ruleType.type as ContextualRule['type'])}
                >
                  <Text style={styles.ruleTypeIcon}>{ruleType.icon}</Text>
                  <Text 
                    style={[
                      styles.ruleTypeText, 
                      { color: newRuleType === ruleType.type ? '#FFFFFF' : theme.colors.text }
                    ]}
                  >
                    {ruleType.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={[styles.ruleDescriptionInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Описание на правилото..."
              placeholderTextColor={theme.colors.textSecondary + '80'}
              value={newRuleDescription}
              onChangeText={setNewRuleDescription}
              multiline
            />

            <TouchableOpacity
              style={[styles.addRuleButton, { backgroundColor: theme.colors.primary }]}
              onPress={addContextualRule}
            >
              <Text style={styles.addRuleButtonText}>Добави правило</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Бутон за запазване */}
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          onPress={saveBudget}
        >
          <Text style={styles.saveButtonText}>Създай бюджет</Text>
        </TouchableOpacity>
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
  
  // Обновени стилове за съдържанието
  scrollView: {
    flex: 1,
    marginTop: -12,
    paddingTop: 20,
  },
  
  // Информативен панел стилове
  infoPanel: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoPanelIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  infoPanelTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoPanelText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'left',
  },
  inputContainer: {
    margin: 16,
    marginTop: 0,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  categoryContainer: {
    paddingVertical: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  iconContainer: {
    paddingVertical: 8,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconText: {
    fontSize: 24,
  },
  amountInput: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 0,
  },
  currencyLabel: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    fontSize: 16,
  },
  periodContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  colorContainer: {
    paddingVertical: 8,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  ruleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ruleIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  ruleTextContainer: {
    flex: 1,
  },
  ruleType: {
    fontSize: 14,
    fontWeight: '600',
  },
  ruleDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  removeRuleButton: {
    padding: 4,
  },
  removeRuleText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addRuleContainer: {
    marginTop: 16,
  },
  ruleTypeContainer: {
    paddingVertical: 8,
  },
  ruleTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
  },
  ruleTypeIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  ruleTypeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  ruleDescriptionInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  addRuleButton: {
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  addRuleButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    margin: 16,
    marginTop: 8,
    marginBottom: 140,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddBudgetScreen; 