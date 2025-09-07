/**
 * Simple Theme System for BandhuConnect+
 * Clean, single theme approach - back to the sweet spot
 */

export type ThemeMode = 'light';

// Typography
export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
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
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
  40: 160,
  48: 192,
  56: 224,
  64: 256,
};

// Border radius
export const BORDER_RADIUS = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  full: 9999,
};

// Shadows
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
    shadowOpacity: 0.1,
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

// Animation
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

// Theme interface
export interface Theme {
  // Background colors
  background: string;
  surface: string;
  
  // Brand colors
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryDisabled: string;
  
  secondary: string;
  secondaryHover: string;
  secondaryActive: string;
  
  accent: string;
  accentHover: string;
  accentActive: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  
  // State colors
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
  infoHover: string;
  infoLight: string;
  
  // Additional color variations
  purple: string;
  purpleHover: string;
  purpleLight: string;
  
  teal: string;
  tealHover: string;
  tealLight: string;
  
  indigo: string;
  indigoHover: string;
  indigoLight: string;
  
  pink: string;
  pinkHover: string;
  pinkLight: string;
  
  amber: string;
  amberHover: string;
  amberLight: string;
  
  // Border and divider colors
  border: string;
  borderLight: string;
  divider: string;
  
  // Interactive states
  hover: string;
  pressed: string;
  focus: string;
  disabled: string;
  
  // Overlay colors
  overlay: string;
  overlayLight: string;
}

// Simple, clean theme - the perfect red, green, blue mix
export const THEME: Theme = {
  // Background colors
  background: '#FFFFFF',
  surface: '#F5F7FA',
  
  // Brand colors - the perfect mix!
  primary: '#059669', // Beautiful green brand color
  primaryHover: '#047857',
  primaryActive: '#065F46',
  primaryDisabled: '#93C5FD',
  
  secondary: '#27AE60', // Perfect support green
  secondaryHover: '#16A34A',
  secondaryActive: '#15803D',
  
  accent: '#F2994A', // Warm orange for perfect balance
  accentHover: '#D97706',
  accentActive: '#B45309',
  
  // Text colors
  textPrimary: '#1A1A1A',
  textSecondary: '#4F4F4F',
  textTertiary: '#6B7280',
  textInverse: '#FFFFFF',
  
  // State colors - beautiful red, green, blue mix
  success: '#27AE60', // Perfect green
  successHover: '#16A34A',
  successLight: '#DCFCE7',
  
  warning: '#F2994A', // Perfect orange/amber
  warningHover: '#D97706',
  warningLight: '#FEF3C7',
  
  error: '#EB5757', // Beautiful soft red
  errorHover: '#DC2626',
  errorLight: '#FEE2E2',
  
  info: '#2F80ED', // Perfect blue
  infoHover: '#2563EB',
  infoLight: '#EFF6FF',
  
  // Additional color variations for rich UI
  purple: '#8B5CF6', // Beautiful purple
  purpleHover: '#7C3AED',
  purpleLight: '#F3E8FF',
  
  teal: '#14B8A6', // Fresh teal
  tealHover: '#0D9488',
  tealLight: '#F0FDFA',
  
  indigo: '#6366F1', // Rich indigo
  indigoHover: '#5B21B6',
  indigoLight: '#EEF2FF',
  
  pink: '#EC4899', // Vibrant pink
  pinkHover: '#DB2777',
  pinkLight: '#FDF2F8',
  
  amber: '#F59E0B', // Warm amber
  amberHover: '#D97706',
  amberLight: '#FFFBEB',
  
  // Border and divider colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  divider: '#E5E7EB',
  
  // Interactive states
  hover: '#F9FAFB',
  pressed: '#F3F4F6',
  focus: '#2F80ED', // Beautiful blue focus
  disabled: '#F3F4F6',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.1)',
};

// Default theme
export const DEFAULT_THEME = THEME;

// Helper function
export const getTheme = (): Theme => THEME;
