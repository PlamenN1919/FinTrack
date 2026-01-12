import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../utils/ThemeContext';
import { HapticUtils } from '../../utils/HapticUtils';

interface FloatingActionButtonProps {
  title: string;
  onPress: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'small' | 'medium' | 'large';
  style?: any;
  animationDelay?: number;
  enablePulse?: boolean;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  title,
  onPress,
  icon,
  variant = 'primary',
  size = 'medium',
  style,
  animationDelay = 0,
  enablePulse = false,
}) => {
  const { theme } = useTheme();
  
  // Анимационни стойности - минималистични
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  // Entrance анимация - по-бърза и фина
  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 7,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, animationDelay);
  }, [animationDelay]);

  // Pulse анимация - по-фина и деликатна
  useEffect(() => {
    if (enablePulse) {
      const pulseAnimation = () => {
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]).start(() => pulseAnimation());
      };
      pulseAnimation();
    }
  }, [enablePulse]);

  // Press анимации - минималистични
  const handlePressIn = () => {
    HapticUtils.buttonPress();
    
    Animated.spring(scaleValue, {
      toValue: 0.96,
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
    onPress();
  };

  // Получаване на градиентни цветове според варианта
  const getGradientColors = () => {
    switch (variant) {
      case 'secondary':
        return theme.colors.secondaryGradient;
      case 'accent':
        return theme.colors.accentGradient;
      default:
        return theme.colors.primaryGradient;
    }
  };

  // Получаване на размери - минималистични
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 16,
          paddingVertical: 8,
          minHeight: 40,
          borderRadius: 20,
        };
      case 'large':
        return {
          paddingHorizontal: 28,
          paddingVertical: 14,
          minHeight: 56,
          borderRadius: 28,
        };
      default: // medium
        return {
          paddingHorizontal: 22,
          paddingVertical: 11,
          minHeight: 48,
          borderRadius: 24,
        };
    }
  };

  const sizeStyle = getSizeStyle();
  const gradientColors = getGradientColors();

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      style={[styles.container, style]}
    >
      <Animated.View
        style={[
          styles.button,
          sizeStyle,
          {
            transform: [
              { scale: Animated.multiply(scaleValue, pulseValue) },
            ],
            opacity: opacityValue,
          },
        ]}
      >
        {/* Фон градиент */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: sizeStyle.borderRadius }]}
        />
        
        {/* Тънка бяла рамка за елегантност */}
        <View style={[
          StyleSheet.absoluteFill,
          styles.borderOverlay,
          { borderRadius: sizeStyle.borderRadius }
        ]} />
        
        {/* Съдържание */}
        <View style={styles.content}>
          {icon && (
            <View style={styles.iconContainer}>
              {icon}
            </View>
          )}
          <Text style={styles.text}>{title}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    // Минималистична сянка
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  borderOverlay: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default FloatingActionButton; 