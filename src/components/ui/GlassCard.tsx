import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../utils/ThemeContext';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  borderRadius?: number;
  padding?: number;
  blur?: boolean;
  opacity?: number;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  borderRadius = 16,
  padding = 16,
  blur = true,
  opacity = 0.1,
}) => {
  const { theme } = useTheme();
  
  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme.dark 
          ? `rgba(255, 255, 255, ${opacity})` 
          : `rgba(255, 255, 255, ${opacity + 0.1})`,
        borderRadius,
        padding,
        borderWidth: 1,
        borderColor: theme.dark 
          ? 'rgba(255, 255, 255, 0.1)' 
          : 'rgba(255, 255, 255, 0.2)',
      },
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
  },
});

export default GlassCard; 