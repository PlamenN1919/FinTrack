import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
  Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../utils/ThemeContext';
import { HapticUtils } from '../../utils/HapticUtils';

interface PremiumButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'neon' | 'holographic' | 'glass';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradientColors?: string[];
  glowColor?: string;
  enableHaptic?: boolean;
  enablePulse?: boolean;
  borderRadius?: number;
}

const PremiumButton: React.FC<PremiumButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  gradientColors,
  glowColor,
  enableHaptic = true,
  enablePulse = false,
  borderRadius = 16,
}) => {
  const { theme } = useTheme();
  
  // Анимационни стойности
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const glowValue = useRef(new Animated.Value(0.5)).current;
  const shimmerValue = useRef(new Animated.Value(0)).current;

  // Pulse анимация
  useEffect(() => {
    if (enablePulse && !disabled) {
      const pulseAnimation = () => {
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.05,
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
  }, [enablePulse, disabled]);

  // Glow анимация за neon вариант
  useEffect(() => {
    if (variant === 'neon') {
      const glowAnimation = () => {
        Animated.sequence([
          Animated.timing(glowValue, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowValue, {
            toValue: 0.5,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]).start(() => glowAnimation());
      };
      glowAnimation();
    }
  }, [variant]);

  // Shimmer анимация
  useEffect(() => {
    if (variant === 'holographic') {
      const shimmerAnimation = () => {
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }).start(() => {
          shimmerValue.setValue(0);
          setTimeout(shimmerAnimation, 3000);
        });
      };
      shimmerAnimation();
    }
  }, [variant]);

  // Press анимации
  const handlePressIn = () => {
    if (enableHaptic) {
      HapticUtils.buttonPress();
    }
    
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(opacityValue, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Получаване на размери
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 16,
          paddingVertical: 8,
          minHeight: 36,
        };
      case 'large':
        return {
          paddingHorizontal: 32,
          paddingVertical: 16,
          minHeight: 56,
        };
      default: // medium
        return {
          paddingHorizontal: 24,
          paddingVertical: 12,
          minHeight: 48,
        };
    }
  };

  // Получаване на текстов стил
  const getTextSize = () => {
    switch (size) {
      case 'small':
        return { fontSize: 14, fontWeight: '600' as const };
      case 'large':
        return { fontSize: 18, fontWeight: '700' as const };
      default:
        return { fontSize: 16, fontWeight: '600' as const };
    }
  };

  // Получаване на стил според варианта
  const getVariantStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...getSizeStyle(),
      borderRadius,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: iconPosition === 'left' ? 'row' : 'row-reverse',
      overflow: 'hidden',
    };

    if (disabled) {
      return {
        ...baseStyle,
        backgroundColor: theme.colors.disabled,
        opacity: 0.6,
      };
    }

    switch (variant) {
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.cardSecondary,
          borderWidth: 1,
          borderColor: theme.colors.border,
        };
      
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.colors.primary,
        };
      
      case 'neon':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.card,
          borderWidth: 2,
          borderColor: glowColor || theme.colors.primary,
          shadowColor: glowColor || theme.colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 15,
          elevation: 15,
        };
      
      case 'glass':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.glass,
          borderWidth: 1,
          borderColor: theme.colors.glassBorder,
        };
      
      case 'holographic':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.card,
          borderWidth: 1,
          borderColor: theme.colors.primary,
        };
      
      default: // primary
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        };
    }
  };

  // Получаване на текстов цвят
  const getTextColor = () => {
    if (disabled) return theme.colors.textTertiary;
    
    switch (variant) {
      case 'secondary':
        return theme.colors.text;
      case 'ghost':
        return theme.colors.primary;
      case 'neon':
        return glowColor || theme.colors.primary;
      case 'glass':
        return theme.colors.text;
      case 'holographic':
        return theme.colors.text;
      default: // primary
        return '#FFFFFF';
    }
  };

  const buttonStyle = getVariantStyle();
  const textColor = getTextColor();
  const textSizeStyle = getTextSize();

  // Shimmer overlay за holographic
  const shimmerTranslateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  if (variant === 'primary') {
    const colors = gradientColors || theme.colors.primaryGradient;
    
    return (
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled || loading}
      >
        <Animated.View
          style={[
            buttonStyle,
            {
              transform: [
                { scale: scaleValue },
                { scale: pulseValue },
              ],
              opacity: opacityValue,
            },
            style,
          ]}
        >
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius }]}
          />
          
          <Animated.View style={styles.content}>
            {icon && iconPosition === 'left' && (
              <Animated.View style={[styles.icon, { marginRight: 8 }]}>
                {icon}
              </Animated.View>
            )}
            
            <Text style={[textSizeStyle, { color: textColor }, textStyle]}>
              {title}
            </Text>
            
            {icon && iconPosition === 'right' && (
              <Animated.View style={[styles.icon, { marginLeft: 8 }]}>
                {icon}
              </Animated.View>
            )}
          </Animated.View>
        </Animated.View>
      </Pressable>
    );
  }

  if (variant === 'neon') {
    return (
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled || loading}
      >
        <Animated.View
          style={[
            buttonStyle,
            {
              transform: [
                { scale: scaleValue },
                { scale: pulseValue },
              ],
              opacity: opacityValue,
              shadowOpacity: glowValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 0.8],
              }),
            },
            style,
          ]}
        >
          <Animated.View style={styles.content}>
            {icon && iconPosition === 'left' && (
              <Animated.View style={[styles.icon, { marginRight: 8 }]}>
                {icon}
              </Animated.View>
            )}
            
            <Text style={[textSizeStyle, { color: textColor }, textStyle]}>
              {title}
            </Text>
            
            {icon && iconPosition === 'right' && (
              <Animated.View style={[styles.icon, { marginLeft: 8 }]}>
                {icon}
              </Animated.View>
            )}
          </Animated.View>
        </Animated.View>
      </Pressable>
    );
  }

  if (variant === 'holographic') {
    return (
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled || loading}
      >
        <Animated.View
          style={[
            buttonStyle,
            {
              transform: [
                { scale: scaleValue },
                { scale: pulseValue },
              ],
              opacity: opacityValue,
            },
            style,
          ]}
        >
          {/* Holographic background */}
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius }]}
          />
          
          {/* Shimmer effect */}
          <Animated.View
            style={[
              styles.shimmerOverlay,
              {
                transform: [{ translateX: shimmerTranslateX }],
              },
            ]}
          />
          
          <Animated.View style={styles.content}>
            {icon && iconPosition === 'left' && (
              <Animated.View style={[styles.icon, { marginRight: 8 }]}>
                {icon}
              </Animated.View>
            )}
            
            <Text style={[textSizeStyle, { color: textColor }, textStyle]}>
              {title}
            </Text>
            
            {icon && iconPosition === 'right' && (
              <Animated.View style={[styles.icon, { marginLeft: 8 }]}>
                {icon}
              </Animated.View>
            )}
          </Animated.View>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <Animated.View
        style={[
          buttonStyle,
          {
            transform: [
              { scale: scaleValue },
              { scale: pulseValue },
            ],
            opacity: opacityValue,
          },
          style,
        ]}
      >
        <Animated.View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <Animated.View style={[styles.icon, { marginRight: 8 }]}>
              {icon}
            </Animated.View>
          )}
          
          <Text style={[textSizeStyle, { color: textColor }, textStyle]}>
            {title}
          </Text>
          
          {icon && iconPosition === 'right' && (
            <Animated.View style={[styles.icon, { marginLeft: 8 }]}>
              {icon}
            </Animated.View>
          )}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: '30%',
    transform: [{ skewX: '-20deg' }],
  },
});

export default PremiumButton; 