import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../utils/ThemeContext';

interface GradientCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  colors?: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  borderRadius?: number;
  padding?: number;
  shadow?: boolean;
}

const GradientCard: React.FC<GradientCardProps> = ({
  children,
  style,
  colors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  borderRadius = 16,
  padding = 16,
  shadow = true,
}) => {
  const { theme } = useTheme();
  
  const gradientColors = colors || theme.colors.primaryGradient;
  
  return (
    <View style={[
      styles.container,
      shadow && styles.shadow,
      { 
        borderRadius, 
        padding,
        backgroundColor: gradientColors[0], // Използваме първия цвят като fallback
      },
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
});

export default GradientCard; 