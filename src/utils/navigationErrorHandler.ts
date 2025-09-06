/**
 * Navigation Error Handler
 * Gracefully handles navigation-related errors
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export interface NavigationError extends Error {
  action?: string;
  route?: string;
}

export const handleNavigationError = (error: NavigationError, fallbackAction?: () => void): void => {
  console.warn('Navigation Error:', {
    message: error.message,
    action: error.action,
    route: error.route,
    stack: error.stack
  });

  // Instead of showing popup alerts, log the error and attempt fallback
  if (fallbackAction) {
    try {
      fallbackAction();
    } catch (fallbackError) {
      console.error('Fallback action also failed:', fallbackError);
    }
  }
};

export const safeNavigate = (navigation: any, route: string, params?: any): boolean => {
  try {
    navigation.navigate(route, params);
    return true;
  } catch (error) {
    handleNavigationError(error as NavigationError, () => {
      console.log(`Failed to navigate to ${route}, staying on current screen`);
    });
    return false;
  }
};
