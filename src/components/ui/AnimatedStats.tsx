import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../utils/ThemeContext';
import { HapticUtils } from '../../utils/HapticUtils';
import { SPACING } from '../../utils/TypographySystem';

interface StatItem {
  label: string;
  value: string;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  color?: string;
  icon?: React.ReactNode;
}

interface AnimatedStatsProps {
  stats: StatItem[];
  variant?: 'horizontal' | 'vertical' | 'grid';
  style?: any;
  animationDelay?: number;
  enableHaptic?: boolean;
  onStatPress?: (stat: StatItem, index: number) => void;
}

const AnimatedStats: React.FC<AnimatedStatsProps> = ({
  stats,
  variant = 'horizontal',
  style,
  animationDelay = 0,
  enableHaptic = true,
  onStatPress,
}) => {
  const { theme } = useTheme();
  
  // Анимационни стойности за всяка статистика
  const animatedValues = useRef(
    stats.map(() => ({
      scale: new Animated.Value(0.8),
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(20),
    }))
  ).current;

  // Entrance анимации
  useEffect(() => {
    const animations = animatedValues.map((values, index) => {
      const delay = animationDelay + (index * 100);
      
      return Animated.parallel([
        Animated.timing(values.opacity, {
          toValue: 1,
          duration: 600,
          delay,
          useNativeDriver: true,
        }),
        Animated.spring(values.scale, {
          toValue: 1,
          delay,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(values.translateY, {
          toValue: 0,
          delay,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]);
    });

    Animated.stagger(50, animations).start();
  }, [animationDelay]);

  // Press анимации
  const handleStatPress = (stat: StatItem, index: number) => {
    if (enableHaptic) {
      HapticUtils.cardTap();
    }

    const values = animatedValues[index];
    
    // Micro-interaction
    Animated.sequence([
      Animated.timing(values.scale, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(values.scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();

    if (onStatPress) {
      onStatPress(stat, index);
    }
  };

  // Получаване на стил според варианта
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

  // Получаване на стил за статистика според варианта
  const getStatStyle = () => {
    switch (variant) {
      case 'vertical':
        return styles.verticalStat;
      case 'grid':
        return styles.gridStat;
      default:
        return styles.horizontalStat;
    }
  };

  // Получаване на цвят за промяната
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

  // Получаване на символ за промяната
  const getChangeSymbol = (change: number, changeType?: string) => {
    if (changeType === 'positive' || change > 0) return '+';
    if (changeType === 'negative' || change < 0) return '';
    return '';
  };

  const renderStat = (stat: StatItem, index: number) => {
    const values = animatedValues[index];
    const StatComponent = onStatPress ? TouchableOpacity : Animated.View;

    return (
      <StatComponent
        key={index}
        onPress={() => handleStatPress(stat, index)}
        activeOpacity={0.8}
        style={[
          getStatStyle(),
          {
            transform: [
              { scale: values.scale },
              { translateY: values.translateY },
            ],
            opacity: values.opacity,
          },
        ]}
      >
        <LinearGradient
          colors={[
            stat.color ? `${stat.color}15` : `${theme.colors.primary}15`,
            stat.color ? `${stat.color}05` : `${theme.colors.primary}05`,
          ]}
          style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
        />
        
        <View style={styles.statContent}>
          {stat.icon && (
            <View style={styles.iconContainer}>
              <Text>{stat.icon}</Text>
            </View>
          )}
          
          <View style={styles.statInfo}>
            <Text 
              style={[styles.statLabel, { color: theme.colors.textSecondary }]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.8}
            >
              {stat.label}
            </Text>
            <Text style={[
              styles.statValue, 
              { color: stat.color || theme.colors.text }
            ]}>
              {stat.value}
            </Text>
            
            {stat.change !== undefined && (
              <View style={styles.changeContainer}>
                <Text style={[
                  styles.changeText,
                  { color: getChangeColor(stat.changeType) }
                ]}>
                  {getChangeSymbol(stat.change, stat.changeType)}{Math.abs(stat.change)}%
                </Text>
                <View style={[
                  styles.changeIndicator,
                  { backgroundColor: getChangeColor(stat.changeType) }
                ]} />
              </View>
            )}
          </View>
        </View>
      </StatComponent>
    );
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
    gap: SPACING.sm,
  },
  verticalContainer: {
    gap: SPACING.sm,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  horizontalStat: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  verticalStat: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  gridStat: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  statContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
    minHeight: 60,
  },
  iconContainer: {
    marginBottom: SPACING.xs,
  },
  statInfo: {
    alignItems: 'center',
    width: '100%',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
    letterSpacing: 0.3,
    textAlign: 'center',
    lineHeight: 14,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
    lineHeight: 22,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 6,
  },
  changeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default AnimatedStats; 