import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { useTheme } from '../../utils/ThemeContext';

interface ModernInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  variant?: 'default' | 'filled' | 'outline';
}

const ModernInput: React.FC<ModernInputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  labelStyle,
  variant = 'default',
  ...props
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 2,
    };

    switch (variant) {
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surface,
          borderColor: error 
            ? theme.colors.error 
            : isFocused 
              ? theme.colors.primary 
              : 'transparent',
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderColor: error 
            ? theme.colors.error 
            : isFocused 
              ? theme.colors.primary 
              : theme.colors.border,
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: theme.colors.card,
          borderColor: error 
            ? theme.colors.error 
            : isFocused 
              ? theme.colors.primary 
              : theme.colors.border,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isFocused ? 0.1 : 0.05,
          shadowRadius: 8,
          elevation: isFocused ? 4 : 2,
        };
    }
  };

  return (
    <View style={containerStyle}>
      {label && (
        <Text style={[
          styles.label,
          { color: error ? theme.colors.error : theme.colors.text },
          labelStyle
        ]}>
          {label}
        </Text>
      )}
      
      <View style={[getContainerStyle()]}>
        {leftIcon && (
          <View style={styles.iconContainer}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={[
            styles.input,
            {
              color: theme.colors.text,
              flex: 1,
            },
            inputStyle
          ]}
          placeholderTextColor={theme.colors.placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {rightIcon && (
          <View style={styles.iconContainer}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {error && (
        <Text style={[styles.error, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    paddingVertical: 0,
  },
  iconContainer: {
    marginHorizontal: 8,
  },
  error: {
    fontSize: 14,
    marginTop: 4,
  },
});

export default ModernInput; 