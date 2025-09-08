/**
 * Professional Admin Design System
 * Removes emojis and implements a clean, business-like interface
 */

import { StyleSheet } from 'react-native';

export const PROFESSIONAL_DESIGN = {
  // Professional Color Palette
  COLORS: {
    // Primary Brand Colors
    primary: '#3b82f6',        // Professional Blue (Original Admin Blue)
    primaryLight: '#60a5fa',   // Light Blue
    primaryDark: '#1d4ed8',    // Dark Blue
    
    // Accent Colors
    accent: '#1e40af',         // Deep Blue
    accentLight: '#3b82f6',    // Professional Blue
    accentDark: '#1e3a8a',     // Navy Blue
    
    // Status Colors
    success: '#16a34a',        // Vibrant Green
    warning: '#ea580c',        // Professional Orange
    error: '#dc2626',          // Professional Red
    info: '#0284c7',           // Sky Blue
    
    // Background Colors
    background: '#f8fafc',     // Light Gray Background
    surface: '#ffffff',        // White Surface
    surfaceElevated: '#ffffff', // Elevated Surface
    
    // Text Colors
    textPrimary: '#111827',    // Dark Text
    textSecondary: '#6b7280',  // Medium Gray Text
    textTertiary: '#9ca3af',   // Light Gray Text
    textInverse: '#ffffff',    // White Text
    
    // Border Colors
    border: '#e5e7eb',         // Light Border
    borderDark: '#d1d5db',     // Medium Border
    
    // Request Type Colors (Professional Variants)
    medical: '#dc2626',
    emergency: '#ef4444',
    guidance: '#1e40af',       // Deep Blue
    sanitation: '#16a34a',     // Vibrant Green
    crowd_management: '#7c3aed',
    lost_person: '#0891b2',    // Cyan Blue
    general: '#3b82f6',        // Professional Blue (changed from teal)
    
    // Additional Green & Blue Variants (Updated for better blues)
    emerald: '#059669',        // Emerald Green
    teal: '#0891b2',          // Cyan Blue (less teal-ish)
    cyan: '#0284c7',          // Sky Blue
    sky: '#3b82f6',           // Professional Blue
    blue: '#2563eb',          // Pure Blue
    indigo: '#4f46e5',        // Indigo
    mint: '#10b981',          // Mint Green
    forest: '#166534',        // Forest Green
  },
  
  // Professional Typography Scale
  TYPOGRAPHY: {
    // Headings
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 32,
      letterSpacing: -0.25,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    h4: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    h5: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 22,
    },
    h6: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 20,
    },
    
    // Body Text
    bodyLarge: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    body: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    bodySmall: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
    
    // UI Elements
    caption: {
      fontSize: 11,
      fontWeight: '500' as const,
      lineHeight: 14,
      letterSpacing: 0.5,
    },
    button: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 20,
    },
    label: {
      fontSize: 12,
      fontWeight: '600' as const,
      lineHeight: 16,
      letterSpacing: 0.5,
    },
  },
  
  // Professional Spacing System
  SPACING: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 48,
  },
  
  // Professional Border Radius
  RADIUS: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    full: 999,
  },
  
  // Professional Shadows
  SHADOWS: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};

// Professional component styles
export const PROFESSIONAL_STYLES = StyleSheet.create({
  // Container Styles
  container: {
    flex: 1,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.background,
  },
  
  surfaceContainer: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.md,
    padding: PROFESSIONAL_DESIGN.SPACING.lg,
    ...PROFESSIONAL_DESIGN.SHADOWS.md,
  },
  
  // Header Styles
  header: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.xl,
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: PROFESSIONAL_DESIGN.COLORS.border,
  },
  
  headerTitle: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.h2,
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
  },
  
  // Card Styles
  card: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.lg,
    padding: PROFESSIONAL_DESIGN.SPACING.xl,
    marginBottom: PROFESSIONAL_DESIGN.SPACING.md,
    borderWidth: 1,
    borderColor: PROFESSIONAL_DESIGN.COLORS.border,
    ...PROFESSIONAL_DESIGN.SHADOWS.sm,
  },
  
  cardElevated: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.lg,
    padding: PROFESSIONAL_DESIGN.SPACING.xl,
    marginBottom: PROFESSIONAL_DESIGN.SPACING.lg,
    ...PROFESSIONAL_DESIGN.SHADOWS.md,
  },
  
  // Button Styles
  primaryButton: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.accent,
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.md,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.lg,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: PROFESSIONAL_DESIGN.SPACING.sm,
  },
  
  secondaryButton: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.md,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.lg,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.md,
    borderWidth: 1,
    borderColor: PROFESSIONAL_DESIGN.COLORS.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: PROFESSIONAL_DESIGN.SPACING.sm,
  },
  
  primaryButtonText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.button,
    color: PROFESSIONAL_DESIGN.COLORS.textInverse,
  },
  
  secondaryButtonText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.button,
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
  },
  
  // Badge Styles
  statusBadge: {
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.sm,
    paddingVertical: 4,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.md,
    padding: 4,
    gap: 4,
  },
  
  tab: {
    flex: 1,
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.md,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.lg,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: PROFESSIONAL_DESIGN.SPACING.sm,
  },
  
  activeTab: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.accent,
    ...PROFESSIONAL_DESIGN.SHADOWS.sm,
  },
  
  tabText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.button,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
  },
  
  activeTabText: {
    color: PROFESSIONAL_DESIGN.COLORS.textInverse,
  },
});

export default PROFESSIONAL_DESIGN;
