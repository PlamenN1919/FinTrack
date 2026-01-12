import { ViewStyle, TextStyle } from 'react-native';
import { Theme } from './ThemeContext';

// Градиентни комбинации
export const GRADIENT_PRESETS = {
  primary: ['#007AFF', '#5856D6', '#AF52DE'],
  success: ['#34C759', '#30D158', '#32D74B'],
  warning: ['#FF9500', '#FF9F0A', '#FFCC02'],
  error: ['#FF3B30', '#FF453A', '#FF6961'],
  info: ['#007AFF', '#0A84FF', '#64D2FF'],
  sunset: ['#FF6B6B', '#FF8E53', '#FF6B9D'],
  ocean: ['#667eea', '#764ba2', '#667eea'],
  forest: ['#134E5E', '#71B280', '#134E5E'],
  royal: ['#667eea', '#764ba2', '#667eea'],
  cosmic: ['#243B55', '#141E30', '#243B55'],
  aurora: ['#00C9FF', '#92FE9D', '#00C9FF'],
  fire: ['#FA8072', '#FF6347', '#FF4500'],
  ice: ['#E0EAFC', '#CFDEF3', '#E0EAFC'],
  gold: ['#FFD700', '#FFA500', '#FF8C00'],
  silver: ['#C0C0C0', '#A9A9A9', '#808080'],
} as const;

// Сенки и elevation ефекти
export const SHADOW_PRESETS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  extraLarge: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  colored: (color: string, opacity = 0.3) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: opacity,
    shadowRadius: 16,
    elevation: 8,
  }),
} as const;

// Blur ефекти
export const BLUR_PRESETS = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  medium: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heavy: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  dark: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
} as const;

// Neumorphism ефекти
export const NEUMORPHISM_PRESETS = {
  light: (backgroundColor: string) => ({
    backgroundColor,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  }),
  pressed: (backgroundColor: string) => ({
    backgroundColor,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  }),
  elevated: (backgroundColor: string) => ({
    backgroundColor,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  }),
} as const;

// Модерни border радиуси
export const BORDER_RADIUS = {
  none: 0,
  small: 4,
  medium: 8,
  large: 12,
  extraLarge: 16,
  round: 20,
  pill: 50,
  circle: 9999,
} as const;

// Spacing система
export const SPACING_SYSTEM = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  massive: 64,
} as const;

// Utility класове за визуални ефекти
export class VisualEffects {
  // Създаване на градиент стил
  static gradient(
    colors: string[],
    direction: 'horizontal' | 'vertical' | 'diagonal' = 'diagonal'
  ) {
    const directions = {
      horizontal: { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },
      vertical: { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
      diagonal: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
    };

    return {
      colors,
      ...directions[direction],
    };
  }

  // Създаване на сенка с цвят
  static coloredShadow(color: string, intensity: 'light' | 'medium' | 'heavy' = 'medium') {
    const intensities = {
      light: { opacity: 0.2, radius: 8, offset: 4 },
      medium: { opacity: 0.3, radius: 12, offset: 6 },
      heavy: { opacity: 0.4, radius: 16, offset: 8 },
    };

    const config = intensities[intensity];
    
    return {
      shadowColor: color,
      shadowOffset: { width: 0, height: config.offset },
      shadowOpacity: config.opacity,
      shadowRadius: config.radius,
      elevation: config.offset,
    };
  }

  // Glassmorphism ефект
  static glassmorphism(theme: Theme, intensity: 'light' | 'medium' | 'heavy' = 'medium') {
    const intensities = {
      light: { opacity: 0.1, blur: 10 },
      medium: { opacity: 0.15, blur: 15 },
      heavy: { opacity: 0.2, blur: 20 },
    };

    const config = intensities[intensity];
    
    return {
      backgroundColor: theme.dark 
        ? `rgba(255, 255, 255, ${config.opacity})` 
        : `rgba(255, 255, 255, ${config.opacity + 0.1})`,
      borderWidth: 1,
      borderColor: theme.dark 
        ? `rgba(255, 255, 255, ${config.opacity * 0.5})` 
        : `rgba(255, 255, 255, ${config.opacity * 0.8})`,
      backdropFilter: `blur(${config.blur}px)`,
    };
  }

  // Neumorphism ефект
  static neumorphism(backgroundColor: string, pressed = false) {
    return pressed 
      ? NEUMORPHISM_PRESETS.pressed(backgroundColor)
      : NEUMORPHISM_PRESETS.elevated(backgroundColor);
  }

  // Модерен card стил
  static modernCard(theme: Theme, variant: 'default' | 'elevated' | 'glass' | 'outlined' = 'default') {
    const baseStyle: ViewStyle = {
      borderRadius: BORDER_RADIUS.large,
      padding: SPACING_SYSTEM.lg,
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.card,
          ...SHADOW_PRESETS.medium,
        };
      case 'glass':
        return {
          ...baseStyle,
          ...this.glassmorphism(theme, 'medium'),
        };
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.card,
          borderWidth: 1,
          borderColor: theme.colors.border,
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: theme.colors.card,
          ...SHADOW_PRESETS.small,
        };
    }
  }

  // Модерен бутон стил
  static modernButton(
    theme: Theme, 
    variant: 'primary' | 'secondary' | 'outline' | 'ghost' = 'primary',
    size: 'small' | 'medium' | 'large' = 'medium'
  ) {
    const sizes = {
      small: { padding: SPACING_SYSTEM.sm, borderRadius: BORDER_RADIUS.medium },
      medium: { padding: SPACING_SYSTEM.md, borderRadius: BORDER_RADIUS.large },
      large: { padding: SPACING_SYSTEM.lg, borderRadius: BORDER_RADIUS.extraLarge },
    };

    const sizeConfig = sizes[size];
    const baseStyle: ViewStyle = {
      paddingHorizontal: sizeConfig.padding * 1.5,
      paddingVertical: sizeConfig.padding,
      borderRadius: sizeConfig.borderRadius,
      alignItems: 'center',
      justifyContent: 'center',
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.primary,
          ...this.coloredShadow(theme.colors.primary, 'medium'),
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.accent,
          ...this.coloredShadow(theme.colors.accent, 'light'),
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: theme.colors.primary,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.primary + '20',
        };
      default:
        return baseStyle;
    }
  }

  // Анимирани преходи
  static transition(property: string, duration = 300, easing = 'ease-in-out') {
    return {
      transition: `${property} ${duration}ms ${easing}`,
    };
  }

  // Responsive размери
  static responsive(
    small: number,
    medium: number,
    large: number,
    screenWidth: number
  ): number {
    if (screenWidth < 375) return small;
    if (screenWidth < 414) return medium;
    return large;
  }

  // Цветови миксове
  static colorMix(color1: string, color2: string, ratio = 0.5) {
    // Опростена версия - в реален проект би използвала color manipulation библиотека
    return color1; // Placeholder
  }

  // Динамични градиенти базирани на данни
  static dataGradient(value: number, min: number, max: number) {
    const ratio = (value - min) / (max - min);
    
    if (ratio < 0.3) return GRADIENT_PRESETS.error;
    if (ratio < 0.6) return GRADIENT_PRESETS.warning;
    if (ratio < 0.8) return GRADIENT_PRESETS.info;
    return GRADIENT_PRESETS.success;
  }

  // Accessibility подобрения
  static accessibleColors(theme: Theme) {
    return {
      highContrast: {
        text: theme.dark ? '#FFFFFF' : '#000000',
        background: theme.dark ? '#000000' : '#FFFFFF',
      },
      reducedMotion: {
        animationDuration: 0,
        transitionDuration: 0,
      },
    };
  }
}

// Предефинирани стилове за често използвани елементи
export const VISUAL_PRESETS = {
  // Карти
  card: {
    default: (theme: Theme) => VisualEffects.modernCard(theme, 'default'),
    elevated: (theme: Theme) => VisualEffects.modernCard(theme, 'elevated'),
    glass: (theme: Theme) => VisualEffects.modernCard(theme, 'glass'),
    outlined: (theme: Theme) => VisualEffects.modernCard(theme, 'outlined'),
  },

  // Бутони
  button: {
    primary: (theme: Theme) => VisualEffects.modernButton(theme, 'primary'),
    secondary: (theme: Theme) => VisualEffects.modernButton(theme, 'secondary'),
    outline: (theme: Theme) => VisualEffects.modernButton(theme, 'outline'),
    ghost: (theme: Theme) => VisualEffects.modernButton(theme, 'ghost'),
  },

  // Сенки
  shadow: SHADOW_PRESETS,

  // Градиенти
  gradient: GRADIENT_PRESETS,

  // Spacing
  spacing: SPACING_SYSTEM,

  // Border radius
  radius: BORDER_RADIUS,
} as const; 