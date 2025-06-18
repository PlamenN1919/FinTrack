import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { useTheme } from '../../utils/ThemeContext';

interface LuxuryTextProps {
  children: React.ReactNode;
  variant?: 
    | 'display' 
    | 'headline' 
    | 'title' 
    | 'subtitle' 
    | 'body' 
    | 'caption' 
    | 'overline'
    | 'button';
  weight?: 'ultralight' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold';
  color?: string;
  align?: 'left' | 'center' | 'right';
  style?: TextStyle;
  numberOfLines?: number;
  onPress?: () => void;
}

const LuxuryText: React.FC<LuxuryTextProps> = ({
  children,
  variant = 'body',
  weight = 'regular',
  color,
  align = 'left',
  style,
  numberOfLines,
  onPress,
}) => {
  const { theme } = useTheme();

  // Получаване на стил според варианта
  const getVariantStyle = (): TextStyle => {
    switch (variant) {
      case 'display':
        return {
          fontSize: 48,
          lineHeight: 56,
          letterSpacing: -0.5,
        };
      
      case 'headline':
        return {
          fontSize: 32,
          lineHeight: 40,
          letterSpacing: 0,
        };
      
      case 'title':
        return {
          fontSize: 24,
          lineHeight: 32,
          letterSpacing: 0.5,
        };
      
      case 'subtitle':
        return {
          fontSize: 18,
          lineHeight: 24,
          letterSpacing: 0.25,
        };
      
      case 'body':
        return {
          fontSize: 16,
          lineHeight: 24,
          letterSpacing: 0.15,
        };
      
      case 'caption':
        return {
          fontSize: 12,
          lineHeight: 16,
          letterSpacing: 0.4,
        };
      
      case 'overline':
        return {
          fontSize: 10,
          lineHeight: 16,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
        };
      
      case 'button':
        return {
          fontSize: 14,
          lineHeight: 20,
          letterSpacing: 1.25,
          textTransform: 'uppercase',
        };
      
      default:
        return {};
    }
  };

  // Получаване на font weight
  const getFontWeight = (): TextStyle['fontWeight'] => {
    switch (weight) {
      case 'ultralight':
        return '100';
      case 'light':
        return '300';
      case 'regular':
        return '400';
      case 'medium':
        return '500';
      case 'semibold':
        return '600';
      case 'bold':
        return '700';
      default:
        return '400';
    }
  };

  // Получаване на цвят
  const getTextColor = (): string => {
    if (color) return color;
    
    // Default colors based on variant
    switch (variant) {
      case 'display':
      case 'headline':
      case 'title':
        return theme.colors.text;
      
      case 'subtitle':
      case 'body':
        return theme.colors.text;
      
      case 'caption':
      case 'overline':
        return theme.colors.textSecondary;
      
      case 'button':
        return theme.colors.primary;
      
      default:
        return theme.colors.text;
    }
  };

  const variantStyle = getVariantStyle();
  const fontWeight = getFontWeight();
  const textColor = getTextColor();

  return (
    <Text
      style={[
        styles.base,
        variantStyle,
        {
          fontWeight,
          color: textColor,
          textAlign: align,
        },
        style,
      ]}
      numberOfLines={numberOfLines}
      onPress={onPress}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: 'System', // Use system font for consistency
  },
});

export default LuxuryText; 