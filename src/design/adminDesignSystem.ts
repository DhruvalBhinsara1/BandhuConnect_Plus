/**
 * Professional Admin Design System
 * Implements Material Design 3 principles with accessibility and consistency
 */

import { Platform } from 'react-native';

// Typography Scale following Material Design 3
export const TYPOGRAPHY = {
  displayLarge: {
    fontSize: 57,
    lineHeight: 64,
    fontWeight: '400' as const,
    letterSpacing: -0.25,
  },
  displayMedium: {
    fontSize: 45,
    lineHeight: 52,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  displaySmall: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  headlineLarge: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  headlineMedium: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  headlineSmall: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  titleLarge: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  titleMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500' as const,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
  },
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
    letterSpacing: 0.15,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
  },
};

// Professional Color Palette
export const COLORS = {
  // Primary - Admin Blue
  primary: '#2563eb',
  onPrimary: '#ffffff',
  primaryContainer: '#dbeafe',
  onPrimaryContainer: '#1e3a8a',

  // Secondary
  secondary: '#64748b',
  onSecondary: '#ffffff',
  secondaryContainer: '#f1f5f9',
  onSecondaryContainer: '#334155',

  // Tertiary
  tertiary: '#7c3aed',
  onTertiary: '#ffffff',
  tertiaryContainer: '#f3e8ff',
  onTertiaryContainer: '#581c87',

  // Error
  error: '#dc2626',
  onError: '#ffffff',
  errorContainer: '#fef2f2',
  onErrorContainer: '#7f1d1d',

  // Warning
  warning: '#f59e0b',
  onWarning: '#ffffff',
  warningContainer: '#fef3c7',
  onWarningContainer: '#92400e',

  // Success
  success: '#10b981',
  onSuccess: '#ffffff',
  successContainer: '#ecfdf5',
  onSuccessContainer: '#064e3b',

  // Info
  info: '#0ea5e9',
  onInfo: '#ffffff',
  infoContainer: '#f0f9ff',
  onInfoContainer: '#0c4a6e',

  // Neutral/Surface
  surface: '#ffffff',
  onSurface: '#111827',
  surfaceVariant: '#f8fafc',
  onSurfaceVariant: '#6b7280',

  // Background
  background: '#f9fafb',
  onBackground: '#111827',

  // Outline
  outline: '#e5e7eb',
  outlineVariant: '#f3f4f6',

  // Inverse
  inverseSurface: '#374151',
  inverseOnSurface: '#ffffff',
  inversePrimary: '#93c5fd',

  // Shadow
  shadow: '#000000',
  scrim: 'rgba(0, 0, 0, 0.32)',

  // Status-specific colors
  status: {
    pending: '#f59e0b',
    assigned: '#3b82f6',
    inProgress: '#8b5cf6',
    completed: '#10b981',
    cancelled: '#6b7280',
  },

  // Request type colors
  requestType: {
    medical: '#dc2626',
    emergency: '#ea580c',
    lost_person: '#2563eb',
    sanitation: '#16a34a',
    crowd_management: '#9333ea',
    guidance: '#0d9488',
    general: '#6b7280',
  },

  // Priority colors
  priority: {
    high: '#dc2626',
    medium: '#f59e0b',
    low: '#10b981',
  },
};

// Spacing Scale (8pt grid system)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border Radius Scale
export const RADIUS = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  round: 999,
};

// Elevation/Shadow System
export const ELEVATION = {
  level0: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  level1: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  level2: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  level3: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  level4: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 6,
  },
  level5: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Component Specifications
export const COMPONENTS = {
  // Button specifications
  button: {
    primary: {
      backgroundColor: COLORS.primary,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      minHeight: 48, // Accessibility requirement
      ...ELEVATION.level1,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: COLORS.outline,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.md - 1, // Account for border
      paddingHorizontal: SPACING.lg - 1,
      minHeight: 48,
    },
    tertiary: {
      backgroundColor: 'transparent',
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      minHeight: 48,
    },
  },

  // Card specifications
  card: {
    elevated: {
      backgroundColor: COLORS.surface,
      borderRadius: RADIUS.xl,
      padding: SPACING.lg,
      ...ELEVATION.level2,
    },
    outlined: {
      backgroundColor: COLORS.surface,
      borderRadius: RADIUS.xl,
      padding: SPACING.lg,
      borderWidth: 1,
      borderColor: COLORS.outline,
    },
    filled: {
      backgroundColor: COLORS.surfaceVariant,
      borderRadius: RADIUS.xl,
      padding: SPACING.lg,
    },
  },

  // Input specifications
  input: {
    outlined: {
      borderWidth: 1,
      borderColor: COLORS.outline,
      borderRadius: RADIUS.md,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.md,
      fontSize: 16,
      backgroundColor: COLORS.surface,
      minHeight: 48,
    },
    filled: {
      backgroundColor: COLORS.surfaceVariant,
      borderRadius: RADIUS.md,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.md,
      fontSize: 16,
      minHeight: 48,
    },
  },

  // Badge specifications
  badge: {
    filled: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: 4,
      borderRadius: RADIUS.sm,
      alignSelf: 'flex-start',
    },
    outlined: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: 4,
      borderRadius: RADIUS.sm,
      borderWidth: 1,
      alignSelf: 'flex-start',
    },
  },

  // List item specifications
  listItem: {
    height: 72, // Material Design standard
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
};

// Icon mappings (Material Icons equivalents)
export const ICONS = {
  // Navigation
  back: 'arrow-back',
  close: 'close',
  menu: 'menu',
  more: 'more-vert',

  // Actions
  add: 'add',
  edit: 'edit',
  delete: 'delete',
  save: 'save',
  search: 'search',
  refresh: 'refresh',
  settings: 'settings',

  // Status
  check: 'check',
  warning: 'warning',
  error: 'error',
  info: 'info',

  // People
  person: 'person',
  group: 'group',
  admin: 'admin-panel-settings',

  // Location
  location: 'location-on',
  map: 'map',
  directions: 'directions',

  // Communication
  phone: 'phone',
  email: 'email',
  message: 'message',

  // Time
  schedule: 'schedule',
  history: 'history',

  // Assignment
  assignment: 'assignment',
  task: 'task',
  done: 'done',

  // Auto-assignment
  autoAssign: 'auto-awesome',
  intelligence: 'psychology',
  analytics: 'analytics',

  // Request types (replacing emojis)
  medical: 'local-hospital',
  emergency: 'emergency',
  lostPerson: 'person-search',
  sanitation: 'cleaning-services',
  crowdManagement: 'groups',
  guidance: 'support-agent',
  general: 'help',
};

// Animation specifications
export const ANIMATIONS = {
  timing: {
    short: 150,
    medium: 300,
    long: 500,
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// Accessibility specifications
export const ACCESSIBILITY = {
  minimumTouchTarget: 44, // iOS HIG and Material Design requirement
  largeTextScale: 1.3,
  fontWeightMapping: {
    light: Platform.OS === 'ios' ? '300' : '300',
    regular: Platform.OS === 'ios' ? '400' : '400',
    medium: Platform.OS === 'ios' ? '500' : '500',
    semibold: Platform.OS === 'ios' ? '600' : '600',
    bold: Platform.OS === 'ios' ? '700' : '700',
  },
};
