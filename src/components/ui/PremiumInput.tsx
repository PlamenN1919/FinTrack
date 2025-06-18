import React, { useRef, useState, useEffect } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../utils/ThemeContext';

interface PremiumInputProps extends TextInputProps {
  label?: string;
  error?: string;
  variant?: 'default' | 'glass' | 'neon' | 'gradient';
  size?: 'small' | 'medium' | 'large';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  enableGlow?: boolean;
  glowColor?: string;
  borderRadius?: number;
}

const PremiumInput: React.FC<PremiumInputProps> = ({
  label,
  error,
  variant = 'default',
  size = 'medium',
  leftIcon,
  rightIcon,
  style,
  inputStyle,
  labelStyle,
  enableGlow = false,
  glowColor,
  borderRadius = 16,
  ...props
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  
  // Анимационни стойности
  const focusAnimation = useRef(new Animated.Value(0)).current;
  const labelAnimation = useRef(new Animated.Value(0)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;

  // Focus анимации
  useEffect(() => {
    Animated.parallel([
      Animated.timing(focusAnimation, {
        toValue: isFocused ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(labelAnimation, {
        toValue: isFocused || props.value ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isFocused, props.value]);

  // Glow анимация
  useEffect(() => {
    if (enableGlow && isFocused) {
      const glowLoop = () => {
        Animated.sequence([
          Animated.timing(glowAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnimation, {
            toValue: 0.5,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (isFocused) glowLoop();
        });
      };
      glowLoop();
    } else {
      glowAnimation.setValue(0);
    }
  }, [enableGlow, isFocused]);

  // Получаване на размери
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return {
          height: 40,
          paddingHorizontal: 12,
          fontSize: 14,
        };
      case 'large':
        return {
          height: 56,
          paddingHorizontal: 20,
          fontSize: 18,
        };
      default: // medium
        return {
          height: 48,
          paddingHorizontal: 16,
          fontSize: 16,
        };
    }
  };

  // Получаване на стил според варианта
  const getVariantStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius,
      overflow: 'hidden',
    };

    switch (variant) {
      case 'glass':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.glass,
          borderWidth: 1,
          borderColor: theme.colors.glassBorder,
        };
      
      case 'neon':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.card,
          borderWidth: 2,
          borderColor: glowColor || theme.colors.primary,
          shadowColor: glowColor || theme.colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          elevation: 8,
        };
      
      case 'gradient':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      
      default: // default
        return {
          ...baseStyle,
          backgroundColor: theme.colors.card,
          borderWidth: 1,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 2,
        };
    }
  };

  const sizeStyle = getSizeStyle();
  const containerStyle = getVariantStyle();

  // Анимирани стилове
  const animatedBorderColor = focusAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.border, theme.colors.primary],
  });

  const animatedShadowOpacity = focusAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.3],
  });

  const labelTranslateY = labelAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -24],
  });

  const labelScale = labelAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.8],
  });

  if (variant === 'gradient') {
    return (
      <View style={[styles.container, style]}>
        {label && (
          <Animated.Text
            style={[
              styles.label,
              labelStyle,
              { color: theme.colors.text },
              {
                transform: [
                  { translateY: labelTranslateY },
                  { scale: labelScale },
                ],
              },
            ]}
          >
            {label}
          </Animated.Text>
        )}
        
        <Animated.View
          style={[
            containerStyle,
            {
              borderColor: animatedBorderColor,
              shadowOpacity: animatedShadowOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={theme.colors.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius }]}
          />
          
          <View style={[styles.inputContainer, sizeStyle]}>
            {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
            
            <TextInput
              {...props}
              style={[
                styles.input,
                { color: '#FFFFFF' },
                inputStyle,
              ]}
              placeholderTextColor="rgba(255, 255, 255, 0.7)"
              onFocus={(e) => {
                setIsFocused(true);
                props.onFocus?.(e);
              }}
              onBlur={(e) => {
                setIsFocused(false);
                props.onBlur?.(e);
              }}
            />
            
            {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
          </View>
        </Animated.View>
        
        {error && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        )}
      </View>
    );
  }

  if (variant === 'neon') {
    return (
      <View style={[styles.container, style]}>
        {label && (
          <Animated.Text
            style={[
              styles.label,
              labelStyle,
              { color: theme.colors.text },
              {
                transform: [
                  { translateY: labelTranslateY },
                  { scale: labelScale },
                ],
              },
            ]}
          >
            {label}
          </Animated.Text>
        )}
        
        <Animated.View
          style={[
            containerStyle,
            {
              shadowOpacity: glowAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.8],
              }),
            },
          ]}
        >
          <View style={[styles.inputContainer, sizeStyle]}>
            {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
            
            <TextInput
              {...props}
              style={[
                styles.input,
                { color: theme.colors.text },
                inputStyle,
              ]}
              placeholderTextColor={theme.colors.placeholder}
              onFocus={(e) => {
                setIsFocused(true);
                props.onFocus?.(e);
              }}
              onBlur={(e) => {
                setIsFocused(false);
                props.onBlur?.(e);
              }}
            />
            
            {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
          </View>
        </Animated.View>
        
        {error && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Animated.Text
          style={[
            styles.label,
            labelStyle,
            { color: theme.colors.text },
            {
              transform: [
                { translateY: labelTranslateY },
                { scale: labelScale },
              ],
            },
          ]}
        >
          {label}
        </Animated.Text>
      )}
      
      <Animated.View
        style={[
          containerStyle,
          {
            borderColor: animatedBorderColor,
            shadowOpacity: animatedShadowOpacity,
          },
        ]}
      >
        <View style={[styles.inputContainer, sizeStyle]}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          
          <TextInput
            {...props}
            style={[
              styles.input,
              { color: theme.colors.text },
              inputStyle,
            ]}
            placeholderTextColor={theme.colors.placeholder}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
          />
          
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
      </Animated.View>
      
      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  leftIcon: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIcon: {
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});

export default PremiumInput; 