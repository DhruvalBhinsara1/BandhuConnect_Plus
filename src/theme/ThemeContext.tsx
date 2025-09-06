/**
 * Theme Context for BandhuConnect+
 * Manages light/dark theme state and provides theme tokens
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Theme, 
  ThemeMode, 
  THEMES, 
  DEFAULT_THEME,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  ANIMATION,
} from './tokens';

interface ThemeContextType {
  // Current theme
  theme: Theme;
  themeMode: ThemeMode;
  
  // Theme switching
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  
  // Design tokens (always available)
  typography: typeof TYPOGRAPHY;
  spacing: typeof SPACING;
  borderRadius: typeof BORDER_RADIUS;
  shadows: typeof SHADOWS;
  animation: typeof ANIMATION;
  
  // Theme state
  isLight: boolean;
  isDark: boolean;
  
  // System theme detection
  systemTheme: ColorSchemeName;
  followSystemTheme: boolean;
  setFollowSystemTheme: (follow: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@bandhuconnect_theme_mode';
const FOLLOW_SYSTEM_STORAGE_KEY = '@bandhuconnect_follow_system_theme';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(DEFAULT_THEME);
  const [followSystemTheme, setFollowSystemThemeState] = useState(false);
  const [systemTheme, setSystemTheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  // Initialize theme from storage
  useEffect(() => {
    initializeTheme();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme);
      
      // Auto-switch if following system theme
      if (followSystemTheme && colorScheme) {
        const newMode: ThemeMode = colorScheme === 'dark' ? 'dark' : 'light';
        setThemeModeState(newMode);
      }
    });

    return () => subscription.remove();
  }, [followSystemTheme]);

  const initializeTheme = async () => {
    try {
      // Check if user wants to follow system theme
      const followSystemValue = await AsyncStorage.getItem(FOLLOW_SYSTEM_STORAGE_KEY);
      const shouldFollowSystem = followSystemValue === 'true';
      setFollowSystemThemeState(shouldFollowSystem);

      if (shouldFollowSystem) {
        // Use system theme
        const currentSystemTheme = Appearance.getColorScheme();
        const mode: ThemeMode = currentSystemTheme === 'dark' ? 'dark' : 'light';
        setThemeModeState(mode);
      } else {
        // Use saved theme preference
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
          setThemeModeState(savedTheme);
        } else {
          // Default to light theme
          setThemeModeState(DEFAULT_THEME);
        }
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
      setThemeModeState(DEFAULT_THEME);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      
      // When manually setting theme, disable follow system
      if (followSystemTheme) {
        setFollowSystemThemeState(false);
        await AsyncStorage.setItem(FOLLOW_SYSTEM_STORAGE_KEY, 'false');
      }
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newMode: ThemeMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };

  const setFollowSystemTheme = async (follow: boolean) => {
    try {
      setFollowSystemThemeState(follow);
      await AsyncStorage.setItem(FOLLOW_SYSTEM_STORAGE_KEY, follow.toString());
      
      if (follow) {
        // Switch to current system theme
        const currentSystemTheme = Appearance.getColorScheme();
        const mode: ThemeMode = currentSystemTheme === 'dark' ? 'dark' : 'light';
        setThemeModeState(mode);
        await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      }
    } catch (error) {
      console.error('Failed to save follow system theme preference:', error);
    }
  };

  const currentTheme = THEMES[themeMode];

  const contextValue: ThemeContextType = {
    theme: currentTheme,
    themeMode,
    setThemeMode,
    toggleTheme,
    typography: TYPOGRAPHY,
    spacing: SPACING,
    borderRadius: BORDER_RADIUS,
    shadows: SHADOWS,
    animation: ANIMATION,
    isLight: themeMode === 'light',
    isDark: themeMode === 'dark',
    systemTheme,
    followSystemTheme,
    setFollowSystemTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook for using theme
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Convenience hooks
export const useThemeMode = () => {
  const { themeMode, setThemeMode, toggleTheme } = useTheme();
  return { themeMode, setThemeMode, toggleTheme };
};

export const useThemeColors = () => {
  const { theme } = useTheme();
  return theme;
};

export const useDesignTokens = () => {
  const { typography, spacing, borderRadius, shadows, animation } = useTheme();
  return { typography, spacing, borderRadius, shadows, animation };
};
