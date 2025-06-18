import { Platform, TextStyle } from 'react-native';

// Типографска система базирана на Apple Human Interface Guidelines
export const FONT_WEIGHTS = {
  ultraLight: Platform.select({ ios: '100', android: 'normal' }),
  thin: Platform.select({ ios: '200', android: 'normal' }),
  light: Platform.select({ ios: '300', android: 'normal' }),
  regular: Platform.select({ ios: '400', android: 'normal' }),
  medium: Platform.select({ ios: '500', android: 'normal' }),
  semibold: Platform.select({ ios: '600', android: 'normal' }),
  bold: Platform.select({ ios: '700', android: 'bold' }),
  heavy: Platform.select({ ios: '800', android: 'bold' }),
  black: Platform.select({ ios: '900', android: 'bold' }),
} as const;

// Font families
export const FONT_FAMILIES = {
  system: Platform.select({
    ios: 'SF Pro Display',
    android: 'Roboto',
  }),
  systemRounded: Platform.select({
    ios: 'SF Pro Rounded',
    android: 'Roboto',
  }),
  mono: Platform.select({
    ios: 'SF Mono',
    android: 'monospace',
  }),
} as const;

// Spacing система (8pt grid)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// Line heights
export const LINE_HEIGHTS = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
  loose: 1.8,
} as const;

// Типографски стилове
export const TYPOGRAPHY = {
  // Заглавия
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: FONT_WEIGHTS.bold,
    fontFamily: FONT_FAMILIES.system,
    letterSpacing: 0.37,
  } as TextStyle,

  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: FONT_WEIGHTS.bold,
    fontFamily: FONT_FAMILIES.system,
    letterSpacing: 0.36,
  } as TextStyle,

  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: FONT_WEIGHTS.bold,
    fontFamily: FONT_FAMILIES.system,
    letterSpacing: 0.35,
  } as TextStyle,

  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILIES.system,
    letterSpacing: 0.38,
  } as TextStyle,

  // Заглавия за карти и секции
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILIES.system,
    letterSpacing: -0.41,
  } as TextStyle,

  // Основен текст
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: FONT_WEIGHTS.regular,
    fontFamily: FONT_FAMILIES.system,
    letterSpacing: -0.41,
  } as TextStyle,

  bodyEmphasized: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILIES.system,
    letterSpacing: -0.41,
  } as TextStyle,

  // Вторичен текст
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: FONT_WEIGHTS.regular,
    fontFamily: FONT_FAMILIES.system,
    letterSpacing: -0.32,
  } as TextStyle,

  subheadline: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: FONT_WEIGHTS.regular,
    fontFamily: FONT_FAMILIES.system,
    letterSpacing: -0.24,
  } as TextStyle,

  // Малък текст
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: FONT_WEIGHTS.regular,
    fontFamily: FONT_FAMILIES.system,
    letterSpacing: -0.08,
  } as TextStyle,

  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: FONT_WEIGHTS.regular,
    fontFamily: FONT_FAMILIES.system,
    letterSpacing: 0,
  } as TextStyle,

  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: FONT_WEIGHTS.regular,
    fontFamily: FONT_FAMILIES.system,
    letterSpacing: 0.07,
  } as TextStyle,

  // Специални стилове
  number: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: FONT_WEIGHTS.medium,
    fontFamily: FONT_FAMILIES.mono,
    letterSpacing: 0,
  } as TextStyle,

  numberLarge: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: FONT_WEIGHTS.bold,
    fontFamily: FONT_FAMILIES.mono,
    letterSpacing: 0,
  } as TextStyle,

  // Бутони
  buttonLarge: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILIES.system,
    letterSpacing: -0.41,
  } as TextStyle,

  buttonMedium: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILIES.system,
    letterSpacing: -0.24,
  } as TextStyle,

  buttonSmall: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILIES.system,
    letterSpacing: -0.08,
  } as TextStyle,
} as const;

// Utility функции за типография
export class TypographyUtils {
  // Създаване на custom стил с базов стил
  static createStyle(baseStyle: keyof typeof TYPOGRAPHY, overrides: Partial<TextStyle> = {}): TextStyle {
    return {
      ...TYPOGRAPHY[baseStyle],
      ...overrides,
    };
  }

  // Адаптивен размер на шрифта
  static adaptiveSize(baseSize: number, scale = 1): number {
    return Math.round(baseSize * scale);
  }

  // Динамичен line height
  static dynamicLineHeight(fontSize: number, ratio = 1.4): number {
    return Math.round(fontSize * ratio);
  }

  // Responsive typography
  static responsive(
    small: Partial<TextStyle>,
    medium: Partial<TextStyle>,
    large: Partial<TextStyle>,
    screenWidth: number
  ): TextStyle {
    if (screenWidth < 375) {
      return small as TextStyle;
    } else if (screenWidth < 414) {
      return medium as TextStyle;
    } else {
      return large as TextStyle;
    }
  }

  // Accessibility scaling
  static withAccessibilityScale(style: TextStyle, scale: number): TextStyle {
    return {
      ...style,
      fontSize: (style.fontSize || 17) * scale,
      lineHeight: style.lineHeight ? (style.lineHeight * scale) : undefined,
    };
  }
}

// Предефинирани комбинации за често използвани елементи
export const TEXT_PRESETS = {
  // Заглавия на екрани
  screenTitle: TYPOGRAPHY.title1,
  sectionTitle: TYPOGRAPHY.title3,
  cardTitle: TYPOGRAPHY.headline,

  // Основен съдържание
  primaryText: TYPOGRAPHY.body,
  secondaryText: TYPOGRAPHY.subheadline,
  tertiaryText: TYPOGRAPHY.footnote,

  // Числа и стойности
  amount: TYPOGRAPHY.numberLarge,
  smallAmount: TYPOGRAPHY.number,
  percentage: TYPOGRAPHY.bodyEmphasized,

  // Етикети и описания
  label: TYPOGRAPHY.callout,
  description: TYPOGRAPHY.footnote,
  caption: TYPOGRAPHY.caption1,

  // Бутони
  primaryButton: TYPOGRAPHY.buttonLarge,
  secondaryButton: TYPOGRAPHY.buttonMedium,
  smallButton: TYPOGRAPHY.buttonSmall,

  // Специални
  error: {
    ...TYPOGRAPHY.footnote,
    fontWeight: FONT_WEIGHTS.medium,
  } as TextStyle,

  success: {
    ...TYPOGRAPHY.footnote,
    fontWeight: FONT_WEIGHTS.medium,
  } as TextStyle,

  warning: {
    ...TYPOGRAPHY.footnote,
    fontWeight: FONT_WEIGHTS.medium,
  } as TextStyle,
} as const;

// Hook за типография
export const useTypography = () => {
  return {
    styles: TYPOGRAPHY,
    presets: TEXT_PRESETS,
    utils: TypographyUtils,
    spacing: SPACING,
    weights: FONT_WEIGHTS,
    families: FONT_FAMILIES,
  };
}; 