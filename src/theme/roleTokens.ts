/**
 * Role-Specific Design Tokens for BandhuConnect+
 * Following the BandhuConnect+ Design & Theme Guidelines
 * 
 * Three roles: Pilgrim, Volunteer, Admin
 * Each with unique theme identity within unified design system
 */

export type ThemeMode = 'light' | 'dark';
export type UserRole = 'pilgrim' | 'volunteer' | 'admin';

// Typography (shared across all roles)
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

// Spacing scale (8px base) - shared
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

// Border radius - shared
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

// Shadows - shared
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

// Animation - shared
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

// =============================================================================
// SHARED FOUNDATION COLORS (Updated for new role-specific themes)
// =============================================================================

const FOUNDATION_LIGHT = {
  // Background colors (role-neutral base)
  background: '#FAFAFA', // Very light gray as specified in guidelines
  surface: '#FFFFFF', // Pure white for cards and elevated elements
  
  // Text colors (accessible across all themes)
  textPrimary: '#1C1C1E', // Strong contrast, readability
  textSecondary: '#4F4F4F', // Subdued, for descriptions
  textTertiary: '#6B7280', // Even more subdued
  textInverse: '#FFFFFF',
  
  // Shared disabled/muted
  disabled: '#BDBDBD', // De-emphasis, disabled states
  
  // Shared error (soft enough not to shock)
  error: '#DC2626',
  errorHover: '#B91C1C',
  errorLight: '#FEE2E2',
  
  // Border and divider colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  divider: '#E0E0E0', // Subtle dividers
  
  // Interactive states
  hover: '#F9FAFB',
  pressed: '#F3F4F6',
  focus: '#2563EB',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.1)',
};

const FOUNDATION_DARK = {
  // Background colors (role-neutral dark base)
  background: '#121212', // Comfortable charcoal as specified
  surface: '#1E1E1E', // Elevated elements
  
  // Text colors
  textPrimary: '#E0E0E0', // Light gray, easy on eyes
  textSecondary: '#BDBDBD',
  textTertiary: '#828282',
  textInverse: '#121212',
  
  // Shared disabled/muted
  disabled: '#828282',
  
  // Shared error (brighter for dark background visibility)
  error: '#FF6B6B',
  errorHover: '#F87171',
  errorLight: '#7F1D1D',
  
  // Border and divider colors
  border: '#333333',
  borderLight: '#404040',
  divider: '#333333',
  
  // Interactive states
  hover: '#2A2A2A',
  pressed: '#404040',
  focus: '#3B82F6',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.8)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

// =============================================================================
// ROLE-SPECIFIC PALETTES
// Based on Figma Color Combinations & BandhuConnect+ Design Guidelines
// =============================================================================

// 🌸 PILGRIM APP (Theme: Refined Warm & Spiritual)
// New harmonious palette: Cream, Peach, Coral, Gold, Sage - Calm & High-quality
const PILGRIM_PALETTE = {
  light: {
    primary: '#F89E90', // Warm Coral → headers, primary UI bars, branding
    primaryHover: '#F6857A',
    primaryActive: '#F46C64',
    primaryDisabled: '#FBC4BD',
    
    secondary: '#FFD279', // Gold → main actions, buttons, icons, CTA
    secondaryHover: '#FFCB5F',
    secondaryActive: '#FFC445',
    
    accent: '#67A990', // Sage Green → secondary actions, alternative highlights
    accentHover: '#5A9582',
    accentActive: '#4D8174',
    
    // Status indicators optimized for spiritual/travel theme
    success: '#9DC08B', // Olive Green → active, completed states
    successHover: '#8FB47C',
    successLight: '#E8F3E1',
    
    warning: '#FA7A6A', // Soft Red → attention, alerts, warnings
    warningHover: '#F9665B',
    warningLight: '#FEE6E3',
    
    info: '#67A990', // Sage Green for info states
    infoHover: '#5A9582',
    infoLight: '#E1F0EA',
  },
  dark: {
    primary: '#8C71AE', // Deep Lavender → headers, primary UI bars in dark
    primaryHover: '#9B82BC',
    primaryActive: '#AA93CA',
    primaryDisabled: '#4A3A56',
    
    secondary: '#FFD279', // Gold → maintains warmth and visibility in dark
    secondaryHover: '#FFCB5F',
    secondaryActive: '#FFC445',
    
    accent: '#67A990', // Sage Green → consistent across modes
    accentHover: '#5A9582',
    accentActive: '#4D8174',
    
    success: '#9DC08B', // Olive Green → consistent success indicator
    successHover: '#8FB47C',
    successLight: '#3A4A35',
    
    warning: '#FA7A6A', // Soft Red → consistent warning indicator
    warningHover: '#F9665B',
    warningLight: '#4A2826',
    
    info: '#67A990', // Sage Green → consistent info indicator
    infoHover: '#5A9582',
    infoLight: '#2A3A32',
  }
};

// 🌿 VOLUNTEER APP (Theme: Green Juice - Vibrancy & Approachability)
// Using Figma #5: Green Juice palette with Kelly Green, Emerald, Yellow accent
const VOLUNTEER_PALETTE = {
  light: {
    primary: '#49BE86', // Kelly Green → energy, help, acceptance
    primaryHover: '#3DA874',
    primaryActive: '#319262',
    primaryDisabled: '#B8E4D1',
    
    secondary: '#FAD05A', // Yellow accent → urgency, availability, energy
    secondaryHover: '#E6BC47',
    secondaryActive: '#D1A834',
    
    accent: '#075F63', // Emerald → navigation, consistency, depth
    accentHover: '#064D50',
    accentActive: '#053A3D',
    
    // Status indicators optimized for green theme
    success: '#49BE86', // Use primary green for success
    successHover: '#3DA874',
    successLight: '#E8F5F0',
    
    warning: '#FAD05A', // Use secondary yellow for warnings
    warningHover: '#E6BC47',
    warningLight: '#FEF7DC',
    
    info: '#075F63', // Use emerald for info
    infoHover: '#064D50',
    infoLight: '#E0F4F4',
  },
  dark: {
    primary: '#66D9A6', // Mint/aqua for dark mode accents
    primaryHover: '#52C792',
    primaryActive: '#3FB57E',
    primaryDisabled: '#1A3A2A',
    
    secondary: '#FFE066', // Gold for active states
    secondaryHover: '#E6CC52',
    secondaryActive: '#CCB83E',
    
    accent: '#4DD0E1', // Cyan accent for contrast
    accentHover: '#26C6DA',
    accentActive: '#00BCD4',
    
    success: '#66D9A6',
    successHover: '#52C792',
    successLight: '#0D2A1A',
    
    warning: '#FFE066',
    warningHover: '#E6CC52',
    warningLight: '#3A3300',
    
    info: '#4DD0E1',
    infoHover: '#26C6DA',
    infoLight: '#0A2A33',
  }
};

// 🔷 ADMIN APP (Theme: Blue Eclipse - Professional & Authoritative)
// Using Figma #3: Blue Eclipse palette with Navy, Cyan, Light Gray
const ADMIN_PALETTE = {
  light: {
    primary: '#1E2621', // Navy → authority, control, professionalism
    primaryHover: '#0F1310',
    primaryActive: '#000A08',
    primaryDisabled: '#8F9291',
    
    secondary: '#B4F2F1', // Cyan → highlights, active states, clarity
    secondaryHover: '#9EE6E5',
    secondaryActive: '#88DAD9',
    
    accent: '#5A8A8F', // Blue-gray → navigation, secondary actions
    accentHover: '#4A7A7F',
    accentActive: '#3A6A6F',
    
    // Status indicators with professional theme
    success: '#4CAF50', // Standard green for clarity
    successHover: '#388E3C',
    successLight: '#E8F5E9',
    
    warning: '#FF9800', // Standard orange for warnings
    warningHover: '#F57C00',
    warningLight: '#FFF3E0',
    
    info: '#5A8A8F', // Use accent blue-gray for info
    infoHover: '#4A7A7F',
    infoLight: '#E8F2F3',
  },
  dark: {
    primary: '#5A8A8F', // Lighter blue-cyan for dark mode
    primaryHover: '#6A9A9F',
    primaryActive: '#7AAAAF',
    primaryDisabled: '#1A2A2A',
    
    secondary: '#C4FFFF', // Muted aqua/silver for highlights
    secondaryHover: '#B4F2F1',
    secondaryActive: '#A4E5E4',
    
    accent: '#82C4C9', // Brighter cyan for contrast
    accentHover: '#72B4B9',
    accentActive: '#62A4A9',
    
    success: '#66BB6A',
    successHover: '#81C784',
    successLight: '#1B5E20',
    
    warning: '#FFB74D',
    warningHover: '#FFA726',
    warningLight: '#E65100',
    
    info: '#82C4C9',
    infoHover: '#72B4B9',
    infoLight: '#0A2A2A',
  }
};

// =============================================================================
// THEME INTERFACE & CREATION
// =============================================================================

export interface Theme {
  // Background colors (shared)
  background: string;
  surface: string;
  
  // Role-specific brand colors
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
  
  // Text colors (shared)
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
  
  // Border and divider colors (shared)
  border: string;
  borderLight: string;
  divider: string;
  
  // Interactive states (shared)
  hover: string;
  pressed: string;
  focus: string;
  disabled: string;
  
  // Overlay colors (shared)
  overlay: string;
  overlayLight: string;
}

// Helper function to create theme for specific role and mode
export const createTheme = (role: UserRole, mode: ThemeMode): Theme => {
  const foundation = mode === 'light' ? FOUNDATION_LIGHT : FOUNDATION_DARK;
  let palette;
  let roleSpecificColors = {
    background: foundation.background,
    surface: foundation.surface,
    surfaceVariant: foundation.surface,
    // Default text colors from foundation
    textPrimary: foundation.textPrimary,
    textSecondary: foundation.textSecondary,
    textTertiary: foundation.textTertiary,
    textInverse: foundation.textInverse,
  };
  
  switch (role) {
    case 'pilgrim':
      palette = PILGRIM_PALETTE[mode];
      // Pilgrim: Cream (light) / Soft Indigo (dark) with Light Peach/Muted Plum surfaces
      roleSpecificColors = mode === 'light' ? {
        background: '#FFF5EC', // Cream background
        surface: '#FEE4D6', // Light Peach for cards/sections
        surfaceVariant: '#FEE4D6', // Tab bar BG - Light Peach
        // Pilgrim-specific text colors
        textPrimary: '#23201E', // Charcoal text for light mode
        textSecondary: '#4A453F', // Slightly lighter charcoal
        textTertiary: '#6B645E', // Even lighter charcoal
        textInverse: '#FFF7F1', // Cream White for inverse
      } : {
        background: '#3A2946', // Soft Indigo background
        surface: '#574261', // Muted Plum for cards/sections
        surfaceVariant: '#574261', // Tab bar BG - Muted Plum
        // Pilgrim dark mode text colors
        textPrimary: '#FFF7F1', // Cream White text for dark mode
        textSecondary: '#E8DDD4', // Slightly darker cream
        textTertiary: '#D1C3B7', // Even darker cream
        textInverse: '#23201E', // Charcoal for inverse
      };
      break;
    case 'volunteer':
      palette = VOLUNTEER_PALETTE[mode];
      // Volunteer: Soft mint (light) / Deep emerald (dark) as per Green Juice guidelines
      roleSpecificColors = mode === 'light' ? {
        background: '#F8FDF9', // Soft mint background
        surface: '#FFFFFF', // Pure white for cards
        surfaceVariant: '#F0FAF3', // Light mint surface
        textPrimary: foundation.textPrimary,
        textSecondary: foundation.textSecondary,
        textTertiary: foundation.textTertiary,
        textInverse: foundation.textInverse,
      } : {
        background: '#0A2A1A', // Deep emerald background
        surface: '#1A3A2A', // Forest green surface
        surfaceVariant: '#2A4A3A', // Elevated green surface
        textPrimary: foundation.textPrimary,
        textSecondary: foundation.textSecondary,
        textTertiary: foundation.textTertiary,
        textInverse: foundation.textInverse,
      };
      break;
    case 'admin':
      palette = ADMIN_PALETTE[mode];
      // Admin: Very light gray (light) / Deep navy/charcoal (dark) as per Blue Eclipse guidelines
      roleSpecificColors = mode === 'light' ? {
        background: '#FAFAFA', // Very light gray background
        surface: '#FFFFFF', // Pure white for cards
        surfaceVariant: '#F5F5F5', // Light gray surface
        textPrimary: foundation.textPrimary,
        textSecondary: foundation.textSecondary,
        textTertiary: foundation.textTertiary,
        textInverse: foundation.textInverse,
      } : {
        background: '#0F1A1A', // Deep navy/charcoal background
        surface: '#1A2A2A', // Elevated navy surface
        surfaceVariant: '#2A3A3A', // Higher elevation navy
        textPrimary: foundation.textPrimary,
        textSecondary: foundation.textSecondary,
        textTertiary: foundation.textTertiary,
        textInverse: foundation.textInverse,
      };
      break;
    default:
      palette = PILGRIM_PALETTE[mode]; // Default to pilgrim
      roleSpecificColors = mode === 'light' ? {
        background: '#FFF5EC', // Cream
        surface: '#FEE4D6', // Light Peach
        surfaceVariant: '#FEE4D6', // Light Peach
        textPrimary: '#23201E', // Charcoal
        textSecondary: '#4A453F',
        textTertiary: '#6B645E',
        textInverse: '#FFF7F1',
      } : {
        background: '#3A2946', // Soft Indigo
        surface: '#574261', // Muted Plum
        surfaceVariant: '#574261', // Muted Plum
        textPrimary: '#FFF7F1', // Cream White
        textSecondary: '#E8DDD4',
        textTertiary: '#D1C3B7',
        textInverse: '#23201E',
      };
  }
  
  return {
    ...foundation,
    ...palette,
    // Override with role-specific background, surface, and text colors
    ...roleSpecificColors,
  };
};

// Pre-created themes for all combinations
export const THEMES = {
  pilgrim: {
    light: createTheme('pilgrim', 'light'),
    dark: createTheme('pilgrim', 'dark'),
  },
  volunteer: {
    light: createTheme('volunteer', 'light'),
    dark: createTheme('volunteer', 'dark'),
  },
  admin: {
    light: createTheme('admin', 'light'),
    dark: createTheme('admin', 'dark'),
  },
};

// Default settings
export const DEFAULT_THEME_MODE: ThemeMode = 'light'; // Light theme = default for accessibility
export const DEFAULT_USER_ROLE: UserRole = 'pilgrim';

// Helper function to get theme by role and mode
export const getTheme = (role: UserRole, mode: ThemeMode): Theme => THEMES[role][mode];

// Status indicator colors (standardized across all roles)
export const STATUS_COLORS = {
  light: {
    completed: '#27AE60', // Success/Completed: Green
    pending: '#F2C94C', // Pending/Waiting: Yellow  
    failed: '#EB5757', // Error/Failed: Red
    info: '#2F80ED', // Info: Blue
  },
  dark: {
    completed: '#10B981',
    pending: '#F59E0B', 
    failed: '#FF6B6B',
    info: '#3B82F6',
  }
};
