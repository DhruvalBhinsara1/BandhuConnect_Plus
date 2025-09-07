/**
 * Role-Aware Theme Context for BandhuConnect+
 * Manages light/dark theme state AND user role-specific theming
 * Following BandhuConnect+ Design & Theme Guidelines
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Theme, 
  ThemeMode,
  UserRole,
  THEMES, 
  DEFAULT_THEME_MODE,
  DEFAULT_USER_ROLE,
  getTheme,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  ANIMATION,
  STATUS_COLORS,
} from './roleTokens';

interface ThemeContextType {
  // Current theme
  theme: Theme;
  themeMode: ThemeMode;
  userRole: UserRole;
  
  // Theme switching
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  
  // Role switching
  setUserRole: (role: UserRole) => void;
  
  // System theme following
  followSystemTheme: boolean;
  setFollowSystemTheme: (follow: boolean) => void;
  systemTheme: ColorSchemeName;
  
  // Design tokens (always available)
  typography: typeof TYPOGRAPHY;
  spacing: typeof SPACING;
  borderRadius: typeof BORDER_RADIUS;
  shadows: typeof SHADOWS;
  animation: typeof ANIMATION;
  statusColors: typeof STATUS_COLORS.light | typeof STATUS_COLORS.dark;
  
  // Helper functions
  getStatusColor: (status: 'completed' | 'pending' | 'failed' | 'info') => string;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Storage keys
const THEME_STORAGE_KEY = '@bandhuconnect_theme_mode';
const USER_ROLE_STORAGE_KEY = '@bandhuconnect_user_role';
const FOLLOW_SYSTEM_STORAGE_KEY = '@bandhuconnect_follow_system_theme';

interface ThemeProviderProps {
  children: ReactNode;
  initialUserRole?: UserRole; // Can be passed from auth/user context
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  initialUserRole 
}) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(DEFAULT_THEME_MODE);
  const [userRole, setUserRoleState] = useState<UserRole>(initialUserRole || DEFAULT_USER_ROLE);
  const [followSystemTheme, setFollowSystemThemeState] = useState(false);
  const [systemTheme, setSystemTheme] = useState<ColorSchemeName>(Appearance.getColorScheme());
  const [isInitialized, setIsInitialized] = useState(false);

  // Get current theme based on role and mode
  const currentTheme = getTheme(userRole, themeMode);
  const isDarkMode = themeMode === 'dark';
  const statusColors = STATUS_COLORS[themeMode];

  // Initialize theme from storage
  useEffect(() => {
    initializeTheme();
  }, []);

  // Update theme when initialUserRole changes (from auth context)
  useEffect(() => {
    if (initialUserRole && initialUserRole !== userRole) {
      setUserRole(initialUserRole);
    }
  }, [initialUserRole]);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme);
      
      // Auto-switch if following system theme
      if (followSystemTheme && colorScheme && isInitialized) {
        const newMode: ThemeMode = colorScheme === 'dark' ? 'dark' : 'light';
        setThemeModeState(newMode);
      }
    });

    return () => subscription.remove();
  }, [followSystemTheme, isInitialized]);

  const initializeTheme = async () => {
    try {
      // Load user role from storage
      const savedRole = await AsyncStorage.getItem(USER_ROLE_STORAGE_KEY);
      if (savedRole && ['pilgrim', 'volunteer', 'admin'].includes(savedRole)) {
        setUserRoleState(savedRole as UserRole);
      }

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
          setThemeModeState(DEFAULT_THEME_MODE);
        }
      }

      setIsInitialized(true);
    } catch (error) {
      console.warn('Failed to initialize theme from storage:', error);
      setIsInitialized(true);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      
      // Don't save to storage if following system theme
      if (!followSystemTheme) {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      }
    } catch (error) {
      console.warn('Failed to save theme mode:', error);
    }
  };

  const toggleTheme = () => {
    const newMode: ThemeMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };

  const setUserRole = async (role: UserRole) => {
    try {
      setUserRoleState(role);
      await AsyncStorage.setItem(USER_ROLE_STORAGE_KEY, role);
    } catch (error) {
      console.warn('Failed to save user role:', error);
    }
  };

  const setFollowSystemTheme = async (follow: boolean) => {
    try {
      setFollowSystemThemeState(follow);
      await AsyncStorage.setItem(FOLLOW_SYSTEM_STORAGE_KEY, follow.toString());

      if (follow) {
        // Immediately switch to system theme
        const currentSystemTheme = Appearance.getColorScheme();
        const mode: ThemeMode = currentSystemTheme === 'dark' ? 'dark' : 'light';
        setThemeModeState(mode);
        
        // Clear manual theme preference
        await AsyncStorage.removeItem(THEME_STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Failed to save follow system theme preference:', error);
    }
  };

  const getStatusColor = (status: 'completed' | 'pending' | 'failed' | 'info'): string => {
    return statusColors[status];
  };

  const contextValue: ThemeContextType = {
    // Current theme
    theme: currentTheme,
    themeMode,
    userRole,
    
    // Theme switching
    setThemeMode,
    toggleTheme,
    
    // Role switching
    setUserRole,
    
    // System theme following
    followSystemTheme,
    setFollowSystemTheme,
    systemTheme,
    
    // Design tokens
    typography: TYPOGRAPHY,
    spacing: SPACING,
    borderRadius: BORDER_RADIUS,
    shadows: SHADOWS,
    animation: ANIMATION,
    statusColors,
    
    // Helper functions
    getStatusColor,
    isDarkMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Convenience hooks for specific aspects
export const useThemeMode = () => {
  const { themeMode, setThemeMode, toggleTheme } = useTheme();
  return { themeMode, setThemeMode, toggleTheme };
};

export const useUserRole = () => {
  const { userRole, setUserRole } = useTheme();
  return { userRole, setUserRole };
};

export const useThemeColors = () => {
  const { theme, getStatusColor, statusColors, isDarkMode } = useTheme();
  return { theme, getStatusColor, statusColors, isDarkMode };
};

export default ThemeContext;
