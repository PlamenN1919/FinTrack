import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../utils/ThemeContext';

interface StatItem {
  label: string;
  value: string | number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  color?: string;
}

interface PremiumStatsProps {
  stats: StatItem[];
  variant?: 'horizontal' | 'vertical' | 'grid';
  style?: ViewStyle;
  animationDelay?: number;
  enableGlow?: boolean;
  showTrend?: boolean;
}

const PremiumStats: React.FC<PremiumStatsProps> = ({
  stats,
  variant = 'horizontal',
  style,
  animationDelay = 0,
  enableGlow = false,
  showTrend = true,
}) => {
  const { theme } = useTheme();
  
  // Анимационни стойности
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  // Entrance анимация
  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    }, animationDelay);
  }, [animationDelay]);

  // Glow анимация
  useEffect(() => {
    if (enableGlow) {
      const glowLoop = () => {
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.5,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]).start(() => glowLoop());
      };
      glowLoop();
    }
  }, [enableGlow]);

  // Получаване на цвят за промяна
  const getChangeColor = (changeType?: string) => {
    switch (changeType) {
      case 'positive':
        return theme.colors.success;
      case 'negative':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  // Получаване на символ за промяна
  const getChangeSymbol = (changeType?: string, change?: number) => {
    if (!change) return '';
    if (changeType === 'positive') return '↗️ +';
    if (changeType === 'negative') return '↘️ ';
    return change > 0 ? '↗️ +' : '↘️ ';
  };

  // Рендериране на статистика
  const renderStat = (stat: StatItem, index: number) => {
    const animatedStyle = {
      opacity: fadeAnim,
      transform: [
        {
          translateY: slideAnim.interpolate({
            inputRange: [0, 30],
            outputRange: [0, 30],
          }),
        },
      ],
    };

    return (
      <Animated.View
        key={index}
        style={[
          styles.statItem,
          variant === 'grid' && styles.gridItem,
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={[
            stat.color ? `${stat.color}15` : `${theme.colors.primary}15`,
            stat.color ? `${stat.color}05` : `${theme.colors.primary}05`,
          ]}
          style={styles.statBackground}
        />
        
        {enableGlow && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: stat.color || theme.colors.primary,
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.05, 0.15],
                }),
                borderRadius: 16,
              },
            ]}
          />
        )}
        
        <View style={styles.statContent}>
          <View style={styles.statHeader}>
            {stat.icon && (
              <View style={[
                styles.iconContainer,
                { backgroundColor: `${stat.color || theme.colors.primary}20` }
              ]}>
                {stat.icon}
              </View>
            )}
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              {stat.label}
            </Text>
          </View>
          
          <Text style={[
            styles.statValue,
            { color: stat.color || theme.colors.text }
          ]}>
            {stat.value}
          </Text>
          
          {showTrend && stat.change !== undefined && (
            <View style={styles.changeContainer}>
              <Text style={[
                styles.changeText,
                { color: getChangeColor(stat.changeType) }
              ]}>
                {getChangeSymbol(stat.changeType, stat.change)}
                {Math.abs(stat.change)}%
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  // Получаване на стил за контейнера
  const getContainerStyle = () => {
    switch (variant) {
      case 'vertical':
        return styles.verticalContainer;
      case 'grid':
        return styles.gridContainer;
      default:
        return styles.horizontalContainer;
    }
  };

  return (
    <View style={[getContainerStyle(), style]}>
      {stats.map((stat, index) => renderStat(stat, index))}
    </View>
  );
};

const styles = StyleSheet.create({
  horizontalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  verticalContainer: {
    gap: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minHeight: 100,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  gridItem: {
    width: '48%',
    flex: 0,
  },
  statBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  statContent: {
    padding: 16,
    height: '100%',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  changeContainer: {
    alignSelf: 'flex-start',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default PremiumStats; 