/**
 * Toast Notification System for BandhuConnect+ React Native
 * Provides non-intrusive user feedback replacing Alert.alert calls
 */

import React, { createContext, useContext, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  AccessibilityInfo
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Design tokens from Amogh guidelines
const DESIGN_TOKENS = {
  colors: {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    background: {
      success: '#D1FAE5',
      error: '#FEE2E2',
      warning: '#FEF3C7',
      info: '#DBEAFE'
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280'
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },
  borderRadius: {
    sm: 6,
    md: 8,
    lg: 12
  },
  typography: {
    caption: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400' as const
    },
    body: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400' as const
    },
    subtitle: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '600' as const
    }
  }
};

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss?: () => void;
  pauseOnPress?: boolean;
}

interface ToastContextType {
  showToast: (config: Omit<ToastConfig, 'id'>) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastItemProps {
  config: ToastConfig;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ config, onDismiss }) => {
  const [isPaused, setIsPaused] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { type, title, message, duration = 4000, action, pauseOnPress = true } = config;

  // Animation and auto-dismiss logic
  React.useEffect(() => {
    // Announce to screen readers
    AccessibilityInfo.announceForAccessibility(`${type}: ${title}${message ? `. ${message}` : ''}`);

    // Slide in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss timer
    const startTimer = () => {
      timeoutRef.current = setTimeout(() => {
        handleDismiss();
      }, duration);
    };

    if (!isPaused) {
      startTimer();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPaused, duration]);

  const handleDismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(config.id);
      config.onDismiss?.();
    });
  }, [config.id, onDismiss]);

  const handlePress = () => {
    if (pauseOnPress) {
      setIsPaused(prev => !prev);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  };

  const getIcon = (): string => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      default:
        return 'information-circle';
    }
  };

  const getColors = () => {
    return {
      icon: DESIGN_TOKENS.colors[type],
      background: DESIGN_TOKENS.colors.background[type],
      border: DESIGN_TOKENS.colors[type]
    };
  };

  const colors = getColors();

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          backgroundColor: colors.background,
          borderLeftColor: colors.border,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.toastContent}
        onPress={handlePress}
        accessible={true}
        accessibilityRole="alert"
        accessibilityLabel={`${type} notification: ${title}${message ? `. ${message}` : ''}`}
        accessibilityHint={pauseOnPress ? "Tap to pause auto-dismiss" : undefined}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={getIcon() as any}
            size={24}
            color={colors.icon}
            accessibilityElementsHidden={true}
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: DESIGN_TOKENS.colors.text.primary }]}>
            {title}
          </Text>
          {message && (
            <Text style={[styles.message, { color: DESIGN_TOKENS.colors.text.secondary }]}>
              {message}
            </Text>
          )}
        </View>

        {action && (
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: colors.icon }]}
            onPress={action.onPress}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <Text style={[styles.actionText, { color: colors.icon }]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
        >
          <Ionicons
            name="close"
            size={20}
            color={DESIGN_TOKENS.colors.text.secondary}
            accessibilityElementsHidden={true}
          />
        </TouchableOpacity>
      </TouchableOpacity>

      {isPaused && (
        <View style={styles.pausedIndicator}>
          <Text style={styles.pausedText}>Paused</Text>
        </View>
      )}
    </Animated.View>
  );
};

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children, 
  maxToasts = 3 
}) => {
  const [toasts, setToasts] = useState<ToastConfig[]>([]);

  const showToast = useCallback((config: Omit<ToastConfig, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastConfig = { ...config, id };

    setToasts(prev => {
      const updated = [...prev, newToast];
      // Limit number of toasts
      if (updated.length > maxToasts) {
        return updated.slice(-maxToasts);
      }
      return updated;
    });
  }, [maxToasts]);

  const showSuccess = useCallback((title: string, message?: string) => {
    showToast({ type: 'success', title, message });
  }, [showToast]);

  const showError = useCallback((title: string, message?: string) => {
    showToast({ type: 'error', title, message });
  }, [showToast]);

  const showWarning = useCallback((title: string, message?: string) => {
    showToast({ type: 'warning', title, message });
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string) => {
    showToast({ type: 'info', title, message });
  }, [showToast]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismissToast,
    dismissAll,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <SafeAreaView style={styles.toastOverlay} pointerEvents="box-none">
        <View 
          style={styles.toastList} 
          accessible={false}
          importantForAccessibility="no-hide-descendants"
        >
          {toasts.map(toast => (
            <ToastItem
              key={toast.id}
              config={toast}
              onDismiss={dismissToast}
            />
          ))}
        </View>
      </SafeAreaView>
    </ToastContext.Provider>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  toastOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  toastList: {
    position: 'absolute',
    top: DESIGN_TOKENS.spacing.xl,
    left: DESIGN_TOKENS.spacing.md,
    right: DESIGN_TOKENS.spacing.md,
  },
  toastContainer: {
    marginBottom: DESIGN_TOKENS.spacing.sm,
    borderLeftWidth: 4,
    borderRadius: DESIGN_TOKENS.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: DESIGN_TOKENS.spacing.md,
    minHeight: 60,
  },
  iconContainer: {
    marginRight: DESIGN_TOKENS.spacing.sm,
    paddingTop: 2,
  },
  textContainer: {
    flex: 1,
    marginRight: DESIGN_TOKENS.spacing.sm,
  },
  title: {
    ...DESIGN_TOKENS.typography.subtitle,
    marginBottom: 2,
  },
  message: {
    ...DESIGN_TOKENS.typography.body,
  },
  actionButton: {
    paddingHorizontal: DESIGN_TOKENS.spacing.sm,
    paddingVertical: DESIGN_TOKENS.spacing.xs,
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.borderRadius.sm,
    marginRight: DESIGN_TOKENS.spacing.sm,
    alignSelf: 'flex-start',
  },
  actionText: {
    ...DESIGN_TOKENS.typography.body,
    fontWeight: '600',
  },
  dismissButton: {
    padding: DESIGN_TOKENS.spacing.xs,
    alignSelf: 'flex-start',
  },
  pausedIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: DESIGN_TOKENS.colors.text.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: DESIGN_TOKENS.borderRadius.sm,
  },
  pausedText: {
    ...DESIGN_TOKENS.typography.caption,
    color: 'white',
  },
});

// Convenience hook for common error scenarios
export function useErrorToast() {
  const toast = useToast();

  const showNetworkError = useCallback((retryFn?: () => void) => {
    toast.showToast({
      type: 'error',
      title: 'Connection Issue',
      message: 'Please check your internet connection.',
      ...(retryFn && {
        action: {
          label: 'Retry',
          onPress: retryFn
        }
      })
    });
  }, [toast]);

  const showLocationError = useCallback(() => {
    toast.showWarning(
      'Location Required',
      'Please enable location permissions in your device settings.'
    );
  }, [toast]);

  const showValidationError = useCallback((message: string) => {
    toast.showError('Form Error', message);
  }, [toast]);

  return {
    showNetworkError,
    showLocationError,
    showValidationError,
  };
}
