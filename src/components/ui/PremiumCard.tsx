import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../utils/ThemeContext';

interface PremiumCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'glass' | 'gradient' | 'elevated' | 'neon' | 'holographic';
  borderRadius?: number;
  padding?: number;
  margin?: number;
  animationDelay?: number;
  glowColor?: string;
  gradientColors?: string[];
  enableShimmer?: boolean;
  enableHover?: boolean;
}

const PremiumCard: React.FC<PremiumCardProps> = ({
  children,
  style,
  variant = 'glass',
  borderRadius = 24,
  padding = 20,
  margin = 0,
  animationDelay = 0,
  glowColor,
  gradientColors,
  enableShimmer = false,
  enableHover = true,
}) => {
  const { theme } = useTheme();
  
  // Анимационни стойности
  const scaleValue = useRef(new Animated.Value(0.95)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const translateYValue = useRef(new Animated.Value(20)).current;
  const shimmerValue = useRef(new Animated.Value(0)).current;
  const glowValue = useRef(new Animated.Value(0.5)).current;

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
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(translateYValue, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    }, animationDelay);
  }, [animationDelay]);

  // Shimmer анимация
  useEffect(() => {
    if (enableShimmer) {
      const shimmerAnimation = () => {
        Animated.sequence([
          Animated.timing(shimmerValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerValue, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]).start(() => shimmerAnimation());
      };
      shimmerAnimation();
    }
  }, [enableShimmer]);

  // Glow анимация
  useEffect(() => {
    const glowAnimation = () => {
      Animated.sequence([
        Animated.timing(glowValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowValue, {
          toValue: 0.5,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start(() => glowAnimation());
    };
    glowAnimation();
  }, []);

  // Получаване на стил според варианта
  const getVariantStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius,
      padding,
      margin,
      overflow: 'hidden',
    };

    switch (variant) {
      case 'glass':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.glass,
          borderWidth: 1,
          borderColor: theme.colors.glassBorder,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 24,
          elevation: 8,
        };
      
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.card,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.2,
          shadowRadius: 32,
          elevation: 12,
        };
      
      case 'neon':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.card,
          borderWidth: 2,
          borderColor: glowColor || theme.colors.primary,
          shadowColor: glowColor || theme.colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 20,
          elevation: 15,
        };
      
      case 'holographic':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.card,
          borderWidth: 1,
          borderColor: theme.colors.primary,
        };
      
      default: // gradient
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 24,
          elevation: 8,
        };
    }
  };

  const cardStyle = getVariantStyle();

  // Shimmer overlay
  const shimmerTranslateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  if (variant === 'gradient') {
    const colors = gradientColors || theme.colors.primaryGradient;
    
    return (
      <Animated.View
        style={[
          cardStyle,
          {
            transform: [
              { scale: scaleValue },
              { translateY: translateYValue },
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
        
        {enableShimmer && (
          <Animated.View
            style={[
              styles.shimmerOverlay,
              {
                transform: [{ translateX: shimmerTranslateX }],
              },
            ]}
          />
        )}
        
        <View style={styles.content}>
          {children}
        </View>
      </Animated.View>
    );
  }

  if (variant === 'holographic') {
    return (
      <Animated.View
        style={[
          cardStyle,
          {
            transform: [
              { scale: scaleValue },
              { translateY: translateYValue },
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
        
        {/* Animated glow */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius,
              backgroundColor: theme.colors.primary,
              opacity: glowValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.05, 0.15],
              }),
            },
          ]}
        />
        
        <View style={styles.content}>
          {children}
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        cardStyle,
        {
          transform: [
            { scale: scaleValue },
            { translateY: translateYValue },
          ],
          opacity: opacityValue,
        },
        style,
      ]}
    >
      {enableShimmer && (
        <Animated.View
          style={[
            styles.shimmerOverlay,
            {
              transform: [{ translateX: shimmerTranslateX }],
            },
          ]}
        />
      )}
      
      <View style={styles.content}>
        {children}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  content: {
    position: 'relative',
    zIndex: 1,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: '30%',
    transform: [{ skewX: '-20deg' }],
  },
});

export default PremiumCard; 