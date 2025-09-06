/**
 * Theme Utilities for BandhuConnect+
 * Helper functions for creating theme-aware styles and components
 */

import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { Theme, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from './tokens';

// Type for style functions that depend on theme
export type ThemedStyleFunction<T> = (theme: Theme) => T;

// Create theme-aware StyleSheet
export const createThemedStyles = <T extends StyleSheet.NamedStyles<T>>(
  stylesFunction: ThemedStyleFunction<T>
) => {
  return (theme: Theme): T => StyleSheet.create(stylesFunction(theme));
};

// Typography helpers
export const createTextStyle = (params: {
  size?: keyof typeof TYPOGRAPHY.fontSize;
  weight?: keyof typeof TYPOGRAPHY.fontWeight;
  color?: string;
  lineHeight?: keyof typeof TYPOGRAPHY.lineHeight;
  letterSpacing?: keyof typeof TYPOGRAPHY.letterSpacing;
  textAlign?: TextStyle['textAlign'];
}): TextStyle => {
  const {
    size = 'base',
    weight = 'normal',
    color,
    lineHeight,
    letterSpacing = 'normal',
    textAlign,
  } = params;

  return {
    fontSize: TYPOGRAPHY.fontSize[size],
    fontWeight: TYPOGRAPHY.fontWeight[weight],
    lineHeight: lineHeight ? TYPOGRAPHY.lineHeight[lineHeight] : TYPOGRAPHY.lineHeight[size],
    letterSpacing: TYPOGRAPHY.letterSpacing[letterSpacing],
    ...(color && { color }),
    ...(textAlign && { textAlign }),
  };
};

// Common text styles
export const getTextStyles = (theme: Theme) => ({
  // Headings
  h1: createTextStyle({
    size: '4xl',
    weight: 'bold',
    color: theme.text.primary,
  }),
  h2: createTextStyle({
    size: '3xl',
    weight: 'bold',
    color: theme.text.primary,
  }),
  h3: createTextStyle({
    size: '2xl',
    weight: 'semibold',
    color: theme.text.primary,
  }),
  h4: createTextStyle({
    size: 'xl',
    weight: 'semibold',
    color: theme.text.primary,
  }),
  h5: createTextStyle({
    size: 'lg',
    weight: 'medium',
    color: theme.text.primary,
  }),
  h6: createTextStyle({
    size: 'base',
    weight: 'medium',
    color: theme.text.primary,
  }),

  // Body text
  body: createTextStyle({
    size: 'base',
    weight: 'normal',
    color: theme.text.primary,
  }),
  bodySecondary: createTextStyle({
    size: 'base',
    weight: 'normal',
    color: theme.text.secondary,
  }),
  caption: createTextStyle({
    size: 'sm',
    weight: 'normal',
    color: theme.text.secondary,
  }),
  captionSecondary: createTextStyle({
    size: 'sm',
    weight: 'normal',
    color: theme.text.tertiary,
  }),

  // Interactive text
  link: createTextStyle({
    size: 'base',
    weight: 'medium',
    color: theme.text.link,
  }),
  button: createTextStyle({
    size: 'base',
    weight: 'semibold',
    color: theme.text.inverse,
  }),

  // Status text
  error: createTextStyle({
    size: 'sm',
    weight: 'normal',
    color: theme.error,
  }),
  success: createTextStyle({
    size: 'sm',
    weight: 'normal',
    color: theme.success,
  }),
  warning: createTextStyle({
    size: 'sm',
    weight: 'normal',
    color: theme.warning,
  }),
});

// Layout helpers
export const createLayoutStyle = (params: {
  padding?: keyof typeof SPACING | number;
  paddingHorizontal?: keyof typeof SPACING | number;
  paddingVertical?: keyof typeof SPACING | number;
  margin?: keyof typeof SPACING | number;
  marginHorizontal?: keyof typeof SPACING | number;
  marginVertical?: keyof typeof SPACING | number;
  borderRadius?: keyof typeof BORDER_RADIUS | number;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
}): ViewStyle => {
  const {
    padding,
    paddingHorizontal,
    paddingVertical,
    margin,
    marginHorizontal,
    marginVertical,
    borderRadius,
    backgroundColor,
    borderColor,
    borderWidth,
  } = params;

  return {
    ...(padding !== undefined && {
      padding: typeof padding === 'number' ? padding : SPACING[padding],
    }),
    ...(paddingHorizontal !== undefined && {
      paddingHorizontal: typeof paddingHorizontal === 'number' ? paddingHorizontal : SPACING[paddingHorizontal],
    }),
    ...(paddingVertical !== undefined && {
      paddingVertical: typeof paddingVertical === 'number' ? paddingVertical : SPACING[paddingVertical],
    }),
    ...(margin !== undefined && {
      margin: typeof margin === 'number' ? margin : SPACING[margin],
    }),
    ...(marginHorizontal !== undefined && {
      marginHorizontal: typeof marginHorizontal === 'number' ? marginHorizontal : SPACING[marginHorizontal],
    }),
    ...(marginVertical !== undefined && {
      marginVertical: typeof marginVertical === 'number' ? marginVertical : SPACING[marginVertical],
    }),
    ...(borderRadius !== undefined && {
      borderRadius: typeof borderRadius === 'number' ? borderRadius : BORDER_RADIUS[borderRadius],
    }),
    ...(backgroundColor && { backgroundColor }),
    ...(borderColor && { borderColor }),
    ...(borderWidth !== undefined && { borderWidth }),
  };
};

// Common layout styles
export const getLayoutStyles = (theme: Theme) => ({
  container: createLayoutStyle({
    backgroundColor: theme.background.primary,
  }),
  card: {
    ...createLayoutStyle({
      backgroundColor: theme.surface.primary,
      borderRadius: 'lg',
      padding: 4,
    }),
    ...SHADOWS.base,
    shadowColor: '#000',
  },
  surface: createLayoutStyle({
    backgroundColor: theme.surface.primary,
  }),
  separator: {
    height: 1,
    backgroundColor: theme.border.primary,
    marginVertical: SPACING[2],
  },
});

// Button style helpers
export const getButtonStyles = (theme: Theme) => ({
  primary: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  primaryHover: {
    backgroundColor: theme.primaryHover,
    borderColor: theme.primaryHover,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderColor: theme.border.primary,
    borderWidth: 1,
  },
  secondaryHover: {
    backgroundColor: theme.surface.secondary,
    borderColor: theme.border.secondary,
  },
  danger: {
    backgroundColor: theme.error,
    borderColor: theme.error,
  },
  dangerHover: {
    backgroundColor: theme.errorHover,
    borderColor: theme.errorHover,
  },
  success: {
    backgroundColor: theme.success,
    borderColor: theme.success,
  },
  disabled: {
    backgroundColor: theme.surface.disabled,
    borderColor: theme.border.primary,
  },
});

// Input style helpers
export const getInputStyles = (theme: Theme) => ({
  base: {
    backgroundColor: theme.surface.primary,
    borderColor: theme.border.primary,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[3],
    color: theme.text.primary,
    fontSize: TYPOGRAPHY.fontSize.base,
  },
  focused: {
    borderColor: theme.border.focus,
    borderWidth: 2,
  },
  error: {
    borderColor: theme.border.error,
  },
  disabled: {
    backgroundColor: theme.surface.disabled,
    color: theme.text.disabled,
  },
});

// Utility to check if current theme is dark
export const isDarkTheme = (theme: Theme): boolean => {
  // Simple check based on background color brightness
  return theme.background.primary !== '#FFFFFF';
};

// Safe area compatible styles
export const getSafeAreaStyles = (theme: Theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background.primary,
  },
  header: {
    backgroundColor: theme.surface.elevated,
    borderBottomWidth: 1,
    borderBottomColor: theme.border.primary,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
  },
  footer: {
    backgroundColor: theme.surface.elevated,
    borderTopWidth: 1,
    borderTopColor: theme.border.primary,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
  },
});

// Animation helpers
export const createThemedAnimation = (theme: Theme) => ({
  fadeIn: {
    opacity: 0,
    transform: [{ scale: 0.95 }],
  },
  fadeInActive: {
    opacity: 1,
    transform: [{ scale: 1 }],
  },
  slideUp: {
    transform: [{ translateY: 50 }],
    opacity: 0,
  },
  slideUpActive: {
    transform: [{ translateY: 0 }],
    opacity: 1,
  },
});

// Accessibility helpers
export const getAccessibilityColors = (theme: Theme) => ({
  focus: theme.border.focus,
  focusBackground: theme.surface.secondary,
  highContrast: theme.text.primary,
  lowContrast: theme.text.tertiary,
});
