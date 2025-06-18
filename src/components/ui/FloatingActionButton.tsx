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
  
  // Анимационни стойности
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;

  // Entrance анимация
  useEffect(() => {
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
        Animated.timing(rotateValue, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, animationDelay);
  }, [animationDelay]);

  // Pulse анимация
  useEffect(() => {
    if (enablePulse) {
      const pulseAnimation = () => {
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => pulseAnimation());
      };
      pulseAnimation();
    }
  }, [enablePulse]);

  // Press анимации
  const handlePressIn = () => {
    HapticUtils.buttonPress();
    
    Animated.spring(scaleValue, {
      toValue: 0.95,
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
        toValue: 1.05,
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

  // Получаване на размери
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
          paddingHorizontal: 32,
          paddingVertical: 16,
          minHeight: 60,
          borderRadius: 30,
        };
      default: // medium
        return {
          paddingHorizontal: 24,
          paddingVertical: 12,
          minHeight: 50,
          borderRadius: 25,
        };
    }
  };

  const sizeStyle = getSizeStyle();
  const gradientColors = getGradientColors();

  // Rotation interpolation
  const rotateInterpolate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={[styles.container, style]}
    >
      <Animated.View
        style={[
          styles.button,
          sizeStyle,
          {
            transform: [
              { scale: scaleValue },
              { scale: pulseValue },
              { rotate: rotateInterpolate },
            ],
            opacity: opacityValue,
          },
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: sizeStyle.borderRadius }]}
        />
        
        {/* Glow effect */}
        <View style={[
          StyleSheet.absoluteFill,
          styles.glowEffect,
          { borderRadius: sizeStyle.borderRadius }
        ]} />
        
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  glowEffect: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default FloatingActionButton; 