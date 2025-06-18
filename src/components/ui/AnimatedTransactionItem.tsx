import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useTheme } from '../../utils/ThemeContext';
import { HapticUtils } from '../../utils/HapticUtils';
import { SPACING } from '../../utils/TypographySystem';

interface Transaction {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  date: string;
}

interface AnimatedTransactionItemProps {
  transaction: Transaction;
  index: number;
  isLast?: boolean;
  animationDelay?: number;
  onPress?: () => void;
}

const AnimatedTransactionItem: React.FC<AnimatedTransactionItemProps> = ({
  transaction,
  index,
  isLast = false,
  animationDelay = 0,
  onPress,
}) => {
  const { theme } = useTheme();
  
  // Анимационни стойности
  const scaleValue = useRef(new Animated.Value(0.9)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const translateXValue = useRef(new Animated.Value(50)).current;

  // Entrance анимация
  useEffect(() => {
    const delay = animationDelay + (index * 80);
    
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(translateXValue, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    }, delay);
  }, [index, animationDelay]);

  // Press анимации
  const handlePressIn = () => {
    HapticUtils.cardTap();
    
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePress = () => {
    // Micro-interaction
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.02,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();

    if (onPress) {
      onPress();
    }
  };

  // Получаване на цвят за категорията
  const getCategoryColor = () => {
    return transaction.amount > 0 ? theme.colors.success : theme.colors.accent;
  };

  // Получаване на background цвят за иконата
  const getIconBackgroundColor = () => {
    return transaction.amount > 0 
      ? `${theme.colors.success}15` 
      : `${theme.colors.accent}15`;
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          styles.container,
          !isLast && styles.withBorder,
          {
            borderBottomColor: theme.colors.borderLight,
            transform: [
              { scale: scaleValue },
              { translateX: translateXValue },
            ],
            opacity: opacityValue,
          },
        ]}
      >
        {/* Категория икона */}
        <Animated.View
          style={[
            styles.categoryIcon,
            { backgroundColor: getIconBackgroundColor() },
          ]}
        >
          <Text style={[
            styles.categoryInitial,
            { color: getCategoryColor() }
          ]}>
            {transaction.category.charAt(0)}
          </Text>
        </Animated.View>

        {/* Информация за транзакцията */}
        <View style={styles.transactionInfo}>
          <Text style={[styles.transactionTitle, { color: theme.colors.text }]}>
            {transaction.merchant}
          </Text>
          <Text style={[styles.transactionCategory, { color: theme.colors.textSecondary }]}>
            {transaction.category}
          </Text>
        </View>

        {/* Сума и дата */}
        <View style={styles.transactionAmount}>
          <Text style={[
            styles.amountText, 
            { color: transaction.amount > 0 ? theme.colors.success : theme.colors.text }
          ]}>
            {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)} лв.
          </Text>
          <Text style={[styles.transactionDate, { color: theme.colors.textTertiary }]}>
            {new Date(transaction.date).toLocaleDateString('bg-BG')}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  withBorder: {
    borderBottomWidth: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  categoryInitial: {
    fontSize: 18,
    fontWeight: '600',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 14,
    fontWeight: '300',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    fontWeight: '300',
  },
});

export default AnimatedTransactionItem; 