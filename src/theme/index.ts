/**
 * Simple Theme System Index for BandhuConnect+
 * Clean, straightforward theme exports - back to the sweet spot
 */

// Simple theme tokens
export {
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  ANIMATION,
  THEME,
  DEFAULT_THEME,
  getTheme,
} from './simpleTheme';

export type {
  Theme,
  ThemeMode,
} from './simpleTheme';

// Simple theme context
export {
  ThemeProvider,
  useTheme,
} from './SimpleThemeContext';
