import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, ViewStyle, Animated } from 'react-native';
import { useTheme } from '../../utils/ThemeContext';
import { HapticUtils } from '../../utils/HapticUtils';
import { SPACING } from '../../utils/TypographySystem';

interface SimpleAnimatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass' | 'gradient';
  borderRadius?: number;
  padding?: number;
  margin?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  animationDelay?: number;
}

const SimpleAnimatedCard: React.FC<SimpleAnimatedCardProps> = ({
  children,
  style,
  variant = 'default',
  borderRadius = 16,
  padding = SPACING.md,
  margin = 0,
  onPress,
  onLongPress,
  disabled = false,
  animationDelay = 0,
}) => {
  const { theme } = useTheme();
  
  // Използваме useRef за да избегнем създаването на нови Animated.Value при всяко рендериране
  const scaleValue = useRef(new Animated.Value(0.95)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  // Инициализация на анимациите
  useEffect(() => {
    const delay = animationDelay;
    
    // Entrance анимация
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
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
  }, [animationDelay]);

  // Получаване на стил според варианта
  const getVariantStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius,
      padding,
      margin,
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.card,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
          elevation: 4,
        };
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.card,
          borderWidth: 1,
          borderColor: theme.colors.border,
        };
      case 'glass':
        return {
          ...baseStyle,
          backgroundColor: theme.dark 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
          borderColor: theme.dark 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(255, 255, 255, 0.3)',
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: theme.colors.card,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
        };
    }
  };

  // Press handlers
  const handlePressIn = () => {
    if (disabled) return;
    
    HapticUtils.cardTap();
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handlePress = () => {
    if (disabled || !onPress) return;
    
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
    
    onPress();
  };

  const handleLongPress = () => {
    if (disabled || !onLongPress) return;
    
    HapticUtils.buttonLongPress();
    onLongPress();
  };

  const CardComponent = onPress || onLongPress ? TouchableOpacity : Animated.View;

  return (
    <CardComponent
      onPress={handlePress}
      onLongPress={handleLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1}
      style={[
        getVariantStyle(),
        {
          transform: [{ scale: scaleValue }],
          opacity: opacityValue,
        },
        style,
      ]}
    >
      {children}
    </CardComponent>
  );
};

export default SimpleAnimatedCard; 