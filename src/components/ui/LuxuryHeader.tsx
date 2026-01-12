import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ViewStyle,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../utils/ThemeContext';

interface LuxuryHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
  style?: ViewStyle;
  variant?: 'gradient' | 'solid' | 'glass';
  showBackButton?: boolean;
  onBackPress?: () => void;
  enableParallax?: boolean;
  scrollY?: Animated.Value;
}

const LuxuryHeader: React.FC<LuxuryHeaderProps> = ({
  title,
  subtitle,
  rightElement,
  leftElement,
  style,
  variant = 'gradient',
  showBackButton = false,
  onBackPress,
  enableParallax = false,
  scrollY,
}) => {
  const { theme } = useTheme();
  
  // Анимационни стойности
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  // Entrance анимация
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  }, []);

  // Parallax ефект
  const parallaxTranslateY = scrollY?.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  }) || 0;

  const parallaxOpacity = scrollY?.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  }) || 1;

  // Получаване на стил според варианта
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'solid':
        return {
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        };
      
      case 'glass':
        return {
          backgroundColor: theme.colors.glass,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.glassBorder,
        };
      
      default: // gradient
        return {
          backgroundColor: 'transparent',
        };
    }
  };

  const containerStyle = getVariantStyle();

  const renderContent = () => (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              ...(enableParallax ? [{ translateY: parallaxTranslateY }] : []),
            ],
          },
        ]}
      >
        {/* Left Section */}
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBackPress}
            >
              <View style={[styles.backIcon, { borderColor: theme.colors.accent }]}>
                <Text style={[styles.backText, { color: theme.colors.accent }]}>‹</Text>
              </View>
            </TouchableOpacity>
          )}
          {leftElement}
        </View>

        {/* Center Section */}
        <View style={styles.centerSection}>
          <Animated.Text
            style={[
              styles.title,
              { 
                color: variant === 'gradient' ? '#F7E7CE' : theme.colors.text,
                opacity: enableParallax ? parallaxOpacity : 1,
              }
            ]}
          >
            {title}
          </Animated.Text>
          {subtitle && (
            <Animated.Text
              style={[
                styles.subtitle,
                { 
                  color: variant === 'gradient' ? 'rgba(247, 231, 206, 0.8)' : theme.colors.textSecondary,
                  opacity: enableParallax ? parallaxOpacity : 1,
                }
              ]}
            >
              {subtitle}
            </Animated.Text>
          )}
        </View>

        {/* Right Section */}
        <View style={styles.rightSection}>
          {rightElement}
        </View>
      </Animated.View>
    </SafeAreaView>
  );

  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={theme.colors.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.container, style]}
      >
        {renderContent()}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.container, containerStyle, style]}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
  },
  safeArea: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 60,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  backButton: {
    marginRight: 16,
  },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(247, 231, 206, 0.1)',
  },
  backText: {
    fontSize: 24,
    fontWeight: '300',
    marginLeft: -2, // Adjust for visual centering
  },
  title: {
    fontSize: 20,
    fontWeight: '400',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '300',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default LuxuryHeader; 