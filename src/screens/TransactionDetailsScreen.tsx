import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

// Тематичен контекст
import { useTheme } from '../utils/ThemeContext';
import { EMOTIONS } from '../utils/constants';

// Примерни данни за транзакцията
const mockTransaction = {
  id: '1',
  amount: -35.50,
  category: 'Храна',
  date: '2024-05-19',
  time: '14:30',
  merchant: 'Супермаркет Фреш',
  items: [
    { id: '1', name: 'Хляб пълнозърнест', price: 2.50, quantity: 1 },
    { id: '2', name: 'Ябълки', price: 3.20, quantity: 1.5 },
    { id: '3', name: 'Кисело мляко', price: 1.80, quantity: 2 },
    { id: '4', name: 'Сирене', price: 15.40, quantity: 0.5 },
    { id: '5', name: 'Кафе', price: 12.60, quantity: 1 },
  ],
  note: 'Седмични покупки',
  emotionalState: 'neutral', // could be 'happy', 'sad', 'stressed', 'excited', 'bored', 'neutral'
  paymentMethod: 'Карта',
  receiptImage: null, // URL to image if available
  location: 'ул. Иван Вазов 12, София',
};

// Тип за параметрите на маршрута
type ParamList = {
  TransactionDetails: { id: string };
};

const TransactionDetailsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ParamList, 'TransactionDetails'>>();
  const [transaction, setTransaction] = useState(mockTransaction);
  const [selectedEmotion, setSelectedEmotion] = useState<string>(mockTransaction.emotionalState);
  
  // Изчисляване на общата сума
  const totalAmount = transaction.items.reduce(
    (sum, item) => sum + item.price * item.quantity, 
    0
  ).toFixed(2);
  
  // Емоции за избор
  const emotions = [
    { id: EMOTIONS.HAPPY, label: 'Щастлив', icon: '😊' },
    { id: EMOTIONS.SAD, label: 'Тъжен', icon: '😔' },
    { id: EMOTIONS.STRESSED, label: 'Стресиран', icon: '😖' },
    { id: EMOTIONS.EXCITED, label: 'Развълнуван', icon: '😃' },
    { id: EMOTIONS.BORED, label: 'Отегчен', icon: '😒' },
    { id: EMOTIONS.NEUTRAL, label: 'Неутрален', icon: '😐' },
  ];

  // Получаване на съвет въз основа на емоцията
  const getEmotionalAdvice = (emotion: string) => {
    switch (emotion) {
      case EMOTIONS.HAPPY:
        return 'Когато сте щастливи, често сте по-склонни да похарчите повече. Помислете дали покупката не е импулсивна.';
      case EMOTIONS.SAD:
        return 'Понякога харченето, когато сме тъжни, може да бъде утешително, но не е решение. Опитайте се да обмислите дали е необходимо.';
      case EMOTIONS.STRESSED:
        return 'Харченето под стрес може да бъде начин за справяне. Помислете дали тази покупка ви помага да се справите със стреса.';
      case EMOTIONS.EXCITED:
        return 'Вълнението може да доведе до импулсивни покупки. Следващия път може да изчакате ден преди да вземете решение.';
      case EMOTIONS.BORED:
        return 'Понякога правим покупки от скука. Помислете за други начини да се занимавате, които не изискват харчене.';
      case EMOTIONS.NEUTRAL:
        return 'Неутралното емоционално състояние обикновено води до по-балансирани покупки. Добра работа!';
      default:
        return 'Помислете как емоциите ви влияят върху навиците ви за харчене.';
    }
  };

  // Емоционален анализ на базата на избраната емоция
  const emotionalAdvice = getEmotionalAdvice(selectedEmotion);

  // Вземане на нужната информация от маршрута
  useEffect(() => {
    // В реално приложение тук бихме извършили API заявка за вземане на данните
    // за транзакцията с ID: route.params.id
    console.log('Транзакция с ID:', route.params?.id);
  }, [route.params?.id]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        {/* Заглавие и сума */}
        <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
          <View style={styles.headerContent}>
            <Text style={[styles.merchant, { color: theme.colors.text }]}>
              {transaction.merchant}
            </Text>
            <Text style={[styles.dateTime, { color: theme.colors.textSecondary }]}>
              {new Date(transaction.date).toLocaleDateString('bg-BG')} • {transaction.time}
            </Text>
            <Text 
              style={[
                styles.amount, 
                { 
                  color: transaction.amount >= 0 
                    ? theme.colors.success 
                    : theme.colors.error 
                }
              ]}
            >
              {transaction.amount >= 0 ? '+' : ''}{Math.abs(transaction.amount).toFixed(2)} лв.
            </Text>
          </View>
        </View>

        {/* Детайли */}
        <View style={[styles.detailsCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Категория</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>{transaction.category}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Начин на плащане</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>{transaction.paymentMethod}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Местоположение</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>{transaction.location}</Text>
          </View>
          {transaction.note && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Бележка</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>{transaction.note}</Text>
              </View>
            </>
          )}
        </View>

        {/* Елементи от покупката */}
        {transaction.items && transaction.items.length > 0 && (
          <View style={[styles.itemsCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Продукти</Text>
            
            {transaction.items.map((item, index) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemDetails}>
                  <Text style={[styles.itemName, { color: theme.colors.text }]}>{item.name}</Text>
                  {item.quantity !== 1 && (
                    <Text style={[styles.itemQuantity, { color: theme.colors.textSecondary }]}>
                      {item.quantity} x {item.price.toFixed(2)} лв.
                    </Text>
                  )}
                </View>
                <Text style={[styles.itemPrice, { color: theme.colors.text }]}>
                  {(item.price * item.quantity).toFixed(2)} лв.
                </Text>
              </View>
            ))}
            
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Общо</Text>
              <Text style={[styles.totalAmount, { color: theme.colors.text }]}>{totalAmount} лв.</Text>
            </View>
          </View>
        )}

        {/* Емоционален анализ */}
        <View style={[styles.emotionalCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Емоционален анализ</Text>
          <Text style={[styles.emotionalDescription, { color: theme.colors.textSecondary }]}>
            Как се чувствахте, когато направихте тази покупка?
          </Text>
          
          <View style={styles.emotionsContainer}>
            {emotions.map((emotion) => (
              <TouchableOpacity
                key={emotion.id}
                style={[
                  styles.emotionButton,
                  selectedEmotion === emotion.id && 
                  { 
                    backgroundColor: theme.colors.primary + '20',
                    borderColor: theme.colors.primary 
                  }
                ]}
                onPress={() => setSelectedEmotion(emotion.id)}
              >
                <Text style={styles.emotionIcon}>{emotion.icon}</Text>
                <Text 
                  style={[
                    styles.emotionLabel, 
                    { 
                      color: selectedEmotion === emotion.id 
                        ? theme.colors.primary 
                        : theme.colors.text 
                    }
                  ]}
                >
                  {emotion.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={[styles.adviceContainer, { backgroundColor: theme.colors.primary + '10' }]}>
            <Text style={[styles.adviceText, { color: theme.colors.text }]}>
              {emotionalAdvice}
            </Text>
          </View>
        </View>

        {/* Кнопки за действия */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.card }]}
          >
            <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>Редактирай</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
          >
            <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>Изтрий</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  header: {
    borderRadius: 0,
    paddingBottom: 24,
  },
  headerContent: {
    padding: 16,
    alignItems: 'center',
  },
  merchant: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dateTime: {
    fontSize: 14,
    marginBottom: 12,
  },
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  detailsCard: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  itemsCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
  },
  itemQuantity: {
    fontSize: 13,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emotionalCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
  },
  emotionalDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  emotionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  emotionButton: {
    width: '30%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    padding: 12,
    marginRight: '5%',
    marginBottom: 12,
    alignItems: 'center',
  },
  emotionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  emotionLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  adviceContainer: {
    padding: 16,
    borderRadius: 8,
  },
  adviceText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    margin: 16,
    marginTop: 0,
    marginBottom: 100,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TransactionDetailsScreen; 