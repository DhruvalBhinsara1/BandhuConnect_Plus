/**
 * Design Tokens for BandhuConnect+
 * Comprehensive design system with light/dark theme support
 * Light theme is the default
 */

export type ThemeMode = 'light' | 'dark';

// Base color palette (theme-independent)
const BASE_COLORS = {
  // Primary Brand Colors
  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6', // Primary
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
    950: '#172554',
  },
  
  // Success Colors
  green: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E', // Success
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
    950: '#052e16',
  },
  
  // Warning Colors
  amber: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // Warning
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
    950: '#451a03',
  },
  
  // Error Colors
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444', // Error
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
    950: '#450a0a',
  },
  
  // Neutral Colors
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },
  
  // Pure colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

// Typography scale
export const TYPOGRAPHY = {
  fontFamily: {
    sans: 'System', // Will use system font
    mono: 'Courier', // For code/monospace text
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 28,
    '2xl': 32,
    '3xl': 36,
    '4xl': 40,
    '5xl': 56,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
};

// Spacing scale (8px base)
export const SPACING = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
};

// Border radius scale
export const BORDER_RADIUS = {
  none: 0,
  sm: 2,
  base: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
};

// Shadow/Elevation system
export const SHADOWS = {
  none: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  xl: {
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 12,
  },
};

// Animation durations and easing
export const ANIMATION = {
  duration: {
    fast: 150,
    normal: 200,
    slow: 300,
    slower: 500,
  },
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// Light theme colors
export const LIGHT_THEME = {
  // Semantic colors
  primary: BASE_COLORS.blue[500],
  primaryHover: BASE_COLORS.blue[600],
  primaryActive: BASE_COLORS.blue[700],
  primaryDisabled: BASE_COLORS.blue[300],
  
  secondary: BASE_COLORS.gray[600],
  secondaryHover: BASE_COLORS.gray[700],
  secondaryActive: BASE_COLORS.gray[800],
  
  success: BASE_COLORS.green[500],
  successHover: BASE_COLORS.green[600],
  successLight: BASE_COLORS.green[50],
  
  warning: BASE_COLORS.amber[500],
  warningHover: BASE_COLORS.amber[600],
  warningLight: BASE_COLORS.amber[50],
  
  error: BASE_COLORS.red[500],
  errorHover: BASE_COLORS.red[600],
  errorLight: BASE_COLORS.red[50],
  
  info: BASE_COLORS.blue[500],
  infoLight: BASE_COLORS.blue[50],
  
  // Background colors
  background: {
    primary: BASE_COLORS.white,
    secondary: BASE_COLORS.gray[50],
    tertiary: BASE_COLORS.gray[100],
    elevated: BASE_COLORS.white,
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Surface colors (for cards, sheets, etc.)
  surface: {
    primary: BASE_COLORS.white,
    secondary: BASE_COLORS.gray[50],
    tertiary: BASE_COLORS.gray[100],
    elevated: BASE_COLORS.white,
    disabled: BASE_COLORS.gray[200],
  },
  
  // Text colors
  text: {
    primary: BASE_COLORS.gray[900],
    secondary: BASE_COLORS.gray[600],
    tertiary: BASE_COLORS.gray[500],
    disabled: BASE_COLORS.gray[400],
    inverse: BASE_COLORS.white,
    link: BASE_COLORS.blue[600],
    linkHover: BASE_COLORS.blue[700],
  },
  
  // Border colors
  border: {
    primary: BASE_COLORS.gray[200],
    secondary: BASE_COLORS.gray[300],
    focus: BASE_COLORS.blue[500],
    error: BASE_COLORS.red[500],
    success: BASE_COLORS.green[500],
    warning: BASE_COLORS.amber[500],
  },
  
  // Icon colors
  icon: {
    primary: BASE_COLORS.gray[600],
    secondary: BASE_COLORS.gray[500],
    tertiary: BASE_COLORS.gray[400],
    inverse: BASE_COLORS.white,
    accent: BASE_COLORS.blue[500],
  },
};

// Dark theme colors
export const DARK_THEME = {
  // Semantic colors
  primary: BASE_COLORS.blue[400],
  primaryHover: BASE_COLORS.blue[300],
  primaryActive: BASE_COLORS.blue[200],
  primaryDisabled: BASE_COLORS.blue[700],
  
  secondary: BASE_COLORS.gray[400],
  secondaryHover: BASE_COLORS.gray[300],
  secondaryActive: BASE_COLORS.gray[200],
  
  success: BASE_COLORS.green[400],
  successHover: BASE_COLORS.green[300],
  successLight: BASE_COLORS.green[950],
  
  warning: BASE_COLORS.amber[400],
  warningHover: BASE_COLORS.amber[300],
  warningLight: BASE_COLORS.amber[950],
  
  error: BASE_COLORS.red[400],
  errorHover: BASE_COLORS.red[300],
  errorLight: BASE_COLORS.red[950],
  
  info: BASE_COLORS.blue[400],
  infoLight: BASE_COLORS.blue[950],
  
  // Background colors
  background: {
    primary: BASE_COLORS.gray[900],
    secondary: BASE_COLORS.gray[800],
    tertiary: BASE_COLORS.gray[700],
    elevated: BASE_COLORS.gray[800],
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  
  // Surface colors
  surface: {
    primary: BASE_COLORS.gray[800],
    secondary: BASE_COLORS.gray[700],
    tertiary: BASE_COLORS.gray[600],
    elevated: BASE_COLORS.gray[750] || BASE_COLORS.gray[700],
    disabled: BASE_COLORS.gray[800],
  },
  
  // Text colors
  text: {
    primary: BASE_COLORS.gray[100],
    secondary: BASE_COLORS.gray[300],
    tertiary: BASE_COLORS.gray[400],
    disabled: BASE_COLORS.gray[600],
    inverse: BASE_COLORS.gray[900],
    link: BASE_COLORS.blue[400],
    linkHover: BASE_COLORS.blue[300],
  },
  
  // Border colors
  border: {
    primary: BASE_COLORS.gray[700],
    secondary: BASE_COLORS.gray[600],
    focus: BASE_COLORS.blue[400],
    error: BASE_COLORS.red[400],
    success: BASE_COLORS.green[400],
    warning: BASE_COLORS.amber[400],
  },
  
  // Icon colors
  icon: {
    primary: BASE_COLORS.gray[300],
    secondary: BASE_COLORS.gray[400],
    tertiary: BASE_COLORS.gray[500],
    inverse: BASE_COLORS.gray[900],
    accent: BASE_COLORS.blue[400],
  },
};

// Theme object type
export interface Theme {
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryDisabled: string;
  secondary: string;
  secondaryHover: string;
  secondaryActive: string;
  success: string;
  successHover: string;
  successLight: string;
  warning: string;
  warningHover: string;
  warningLight: string;
  error: string;
  errorHover: string;
  errorLight: string;
  info: string;
  infoLight: string;
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
    overlay: string;
  };
  surface: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
    disabled: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    disabled: string;
    inverse: string;
    link: string;
    linkHover: string;
  };
  border: {
    primary: string;
    secondary: string;
    focus: string;
    error: string;
    success: string;
    warning: string;
  };
  icon: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
    accent: string;
  };
}

// Export themes
export const THEMES: Record<ThemeMode, Theme> = {
  light: LIGHT_THEME,
  dark: DARK_THEME,
};

// Default theme is light
export const DEFAULT_THEME: ThemeMode = 'light';
