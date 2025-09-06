/**
 * Theme System Index for BandhuConnect+
 * Centralized exports for theme system with light/dark support
 */

// Core theme tokens
export {
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  ANIMATION,
  LIGHT_THEME,
  DARK_THEME,
  THEMES,
  DEFAULT_THEME,
} from './tokens';

export type {
  ThemeMode,
  Theme,
} from './tokens';

// Theme context and hooks
export {
  ThemeProvider,
  useTheme,
  useThemeMode,
  useThemeColors,
  useDesignTokens,
} from './ThemeContext';

// Theme utilities
export {
  createThemedStyles,
  createTextStyle,
  createLayoutStyle,
  getTextStyles,
  getLayoutStyles,
  getButtonStyles,
  getInputStyles,
  getSafeAreaStyles,
  createThemedAnimation,
  getAccessibilityColors,
  isDarkTheme,
} from './utils';

export type {
  ThemedStyleFunction,
} from './utils';
