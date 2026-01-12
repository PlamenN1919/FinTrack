import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

// Луксозна цветова палитра - вдъхновена от премиум брандове
const LUXURY_COLORS = {
  // Основни луксозни цветове
  primary: '#1A1A1A', // Deep Black - елегантност
  primaryLight: '#2D2D2D', // Charcoal
  primaryAccent: '#B8860B', // Dark Goldenrod - луксозен акцент
  
  // Златни акценти
  gold: '#D4AF37', // Класическо злато
  goldLight: '#F7E7CE', // Светло златисто
  goldDark: '#B8860B', // Тъмно злато
  
  // Сребърни тонове
  silver: '#C0C0C0', // Сребро
  silverLight: '#E8E8E8', // Светло сребро
  silverDark: '#A9A9A9', // Тъмно сребро
  
  // Премиум неутрални
  charcoal: '#36454F', // Charcoal
  slate: '#708090', // Slate Gray
  pearl: '#F8F6F0', // Pearl White
  ivory: '#FFFFF0', // Ivory
  
  // Луксозни градиенти
  gradients: {
    luxury: ['#1A1A1A', '#2D2D2D', '#36454F'], // Black to Charcoal
    gold: ['#D4AF37', '#F7E7CE', '#B8860B'], // Gold spectrum
    silver: ['#C0C0C0', '#E8E8E8', '#A9A9A9'], // Silver spectrum
    platinum: ['#E5E4E2', '#F8F8FF', '#DCDCDC'], // Platinum
    obsidian: ['#0F0F0F', '#1A1A1A', '#2F2F2F'], // Deep blacks
    champagne: ['#F7E7CE', '#F5DEB3', '#DDD6C0'], // Champagne
    bronze: ['#CD7F32', '#B87333', '#A0522D'], // Bronze
    titanium: ['#878681', '#A8A8A8', '#696969'], // Titanium
    diamond: ['#B9F2FF', '#E6F3FF', '#F0F8FF'], // Diamond blue
    emerald: ['#50C878', '#40826D', '#355E3B'], // Emerald green
  },
  
  // Семантични цветове - изискани
  success: '#2E8B57', // Sea Green - елегантен успех
  warning: '#DAA520', // Goldenrod - луксозно предупреждение
  error: '#8B0000', // Dark Red - дискретна грешка
  info: '#4682B4', // Steel Blue - професионална информация
  
  // Неутрални тонове
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
};

// Светла тема - Луксозна
const lightTheme = {
  dark: false,
  colors: {
    // Основни цветове
    primary: LUXURY_COLORS.primary,
    primaryLight: LUXURY_COLORS.primaryLight,
    primaryAccent: LUXURY_COLORS.primaryAccent,
    accent: LUXURY_COLORS.gold,
    accentLight: LUXURY_COLORS.goldLight,
    accentDark: LUXURY_COLORS.goldDark,
    
    // Фонове - минималистични и елегантни
    background: LUXURY_COLORS.pearl, // Pearl white background
    backgroundSecondary: LUXURY_COLORS.ivory,
    surface: LUXURY_COLORS.white,
    card: LUXURY_COLORS.white,
    cardSecondary: LUXURY_COLORS.silverLight,
    
    // Текст - контрастен и четлив
    text: LUXURY_COLORS.primary,
    textSecondary: LUXURY_COLORS.charcoal,
    textTertiary: LUXURY_COLORS.slate,
    placeholder: LUXURY_COLORS.gray[500],
    
    // Граници - фини и елегантни
    border: LUXURY_COLORS.silverLight,
    borderLight: LUXURY_COLORS.gray[200],
    divider: LUXURY_COLORS.gray[200],
    
    // Състояния
    success: LUXURY_COLORS.success,
    warning: LUXURY_COLORS.warning,
    error: LUXURY_COLORS.error,
    info: LUXURY_COLORS.info,
    disabled: LUXURY_COLORS.gray[300],
    
    // Сенки - дискретни и професионални
    shadow: 'rgba(26, 26, 26, 0.08)',
    shadowDark: 'rgba(0, 0, 0, 0.12)',
    
    // Градиенти - луксозни комбинации
    primaryGradient: LUXURY_COLORS.gradients.luxury,
    secondaryGradient: LUXURY_COLORS.gradients.gold,
    cardGradient: LUXURY_COLORS.gradients.platinum,
    accentGradient: LUXURY_COLORS.gradients.champagne,
    
    // Специални ефекти
    glass: 'rgba(255, 255, 255, 0.15)',
    glassBorder: 'rgba(255, 255, 255, 0.25)',
    overlay: 'rgba(26, 26, 26, 0.6)',
    shimmer: 'rgba(212, 175, 55, 0.3)', // Златист shimmer
  },
};

// Тъмна тема - Луксозна
// Тип за тема
export type Theme = typeof lightTheme;

const darkTheme = {
  dark: true,
  colors: {
    // Основни цветове
    primary: LUXURY_COLORS.gold,
    primaryLight: LUXURY_COLORS.goldLight,
    primaryAccent: LUXURY_COLORS.goldDark,
    accent: LUXURY_COLORS.silver,
    accentLight: LUXURY_COLORS.silverLight,
    accentDark: LUXURY_COLORS.silverDark,
    
    // Фонове - тъмни и елегантни
    background: '#0A0A0A', // Почти черно
    backgroundSecondary: LUXURY_COLORS.primary,
    surface: '#1A1A1A',
    card: '#2D2D2D',
    cardSecondary: '#36454F',
    
    // Текст - златист и сребърен
    text: LUXURY_COLORS.goldLight,
    textSecondary: LUXURY_COLORS.silverLight,
    textTertiary: LUXURY_COLORS.gray[400],
    placeholder: LUXURY_COLORS.gray[500],
    
    // Граници
    border: LUXURY_COLORS.charcoal,
    borderLight: LUXURY_COLORS.gray[800],
    divider: LUXURY_COLORS.gray[800],
    
    // Състояния - приглушени за тъмната тема
    success: '#3CB371', // Medium Sea Green
    warning: '#DAA520', // Goldenrod
    error: '#CD5C5C', // Indian Red
    info: '#87CEEB', // Sky Blue
    disabled: LUXURY_COLORS.gray[600],
    
    // Сенки
    shadow: 'rgba(212, 175, 55, 0.15)',
    shadowDark: 'rgba(0, 0, 0, 0.8)',
    
    // Градиенти
    primaryGradient: LUXURY_COLORS.gradients.obsidian,
    secondaryGradient: LUXURY_COLORS.gradients.gold,
    cardGradient: LUXURY_COLORS.gradients.titanium,
    accentGradient: LUXURY_COLORS.gradients.bronze,
    
    // Специални ефекти
    glass: 'rgba(26, 26, 26, 0.3)',
    glassBorder: 'rgba(212, 175, 55, 0.2)',
    overlay: 'rgba(0, 0, 0, 0.8)',
    shimmer: 'rgba(212, 175, 55, 0.4)',
  },
};

interface ThemeContextType {
  theme: typeof lightTheme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDark(colorScheme === 'dark');
    });

    // Инициализация с текущата тема на системата
    const currentScheme = Appearance.getColorScheme();
    setIsDark(currentScheme === 'dark');

    return () => subscription?.remove();
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const setTheme = (dark: boolean) => {
    setIsDark(dark);
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 