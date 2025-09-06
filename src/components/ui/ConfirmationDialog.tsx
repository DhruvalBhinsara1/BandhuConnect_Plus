/**
 * Confirmation Dialog Component for BandhuConnect+
 * Replaces Alert.alert confirmation dialogs with accessible, design-system compliant modals
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
  AccessibilityInfo,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Design tokens from Amogh guidelines
const DESIGN_TOKENS = {
  colors: {
    background: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
    surface: '#F9FAFB',
    primary: '#3B82F6',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      inverse: '#FFFFFF'
    },
    border: '#E5E7EB'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  borderRadius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16
  },
  typography: {
    h1: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '600' as const
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const
    },
    caption: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400' as const
    }
  }
};

export type ConfirmationVariant = 'default' | 'danger' | 'warning' | 'success';

export interface ConfirmationAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  icon?: string;
  variant?: ConfirmationVariant;
  actions: ConfirmationAction[];
  onDismiss?: () => void;
  dismissible?: boolean;
  maxWidth?: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  visible,
  title,
  message,
  icon,
  variant = 'default',
  actions,
  onDismiss,
  dismissible = true,
  maxWidth = screenWidth * 0.9
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      // Announce to screen readers
      AccessibilityInfo.announceForAccessibility(`Confirmation dialog: ${title}. ${message || ''}`);

      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Hide animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible && dismissible && onDismiss) {
        onDismiss();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [visible, dismissible, onDismiss]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconColor: DESIGN_TOKENS.colors.danger,
          iconBackground: '#FEE2E2',
        };
      case 'warning':
        return {
          iconColor: DESIGN_TOKENS.colors.warning,
          iconBackground: '#FEF3C7',
        };
      case 'success':
        return {
          iconColor: DESIGN_TOKENS.colors.success,
          iconBackground: '#D1FAE5',
        };
      default:
        return {
          iconColor: DESIGN_TOKENS.colors.primary,
          iconBackground: '#DBEAFE',
        };
    }
  };

  const getDefaultIcon = () => {
    switch (variant) {
      case 'danger':
        return 'warning';
      case 'warning':
        return 'alert-triangle';
      case 'success':
        return 'checkmark-circle';
      default:
        return 'help-circle';
    }
  };

  const getActionButtonStyle = (action: ConfirmationAction) => {
    switch (action.variant) {
      case 'primary':
        return {
          backgroundColor: DESIGN_TOKENS.colors.primary,
          borderColor: DESIGN_TOKENS.colors.primary,
        };
      case 'danger':
        return {
          backgroundColor: DESIGN_TOKENS.colors.danger,
          borderColor: DESIGN_TOKENS.colors.danger,
        };
      case 'secondary':
      default:
        return {
          backgroundColor: 'transparent',
          borderColor: DESIGN_TOKENS.colors.border,
        };
    }
  };

  const getActionTextStyle = (action: ConfirmationAction) => {
    switch (action.variant) {
      case 'primary':
      case 'danger':
        return { color: DESIGN_TOKENS.colors.text.inverse };
      case 'secondary':
      default:
        return { color: DESIGN_TOKENS.colors.text.primary };
    }
  };

  const variantStyles = getVariantStyles();

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={dismissible ? onDismiss : undefined}
      statusBarTranslucent
    >
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        {dismissible && (
          <TouchableOpacity
            style={styles.dismissArea}
            activeOpacity={1}
            onPress={onDismiss}
            accessible={false}
          />
        )}
        
        <Animated.View
          style={[
            styles.dialog,
            {
              maxWidth,
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLabel={`${title}. ${message || ''}`}
        >
          {/* Header with Icon */}
          <View style={styles.header}>
            <View style={[
              styles.iconContainer,
              { backgroundColor: variantStyles.iconBackground }
            ]}>
              <Ionicons
                name={(icon || getDefaultIcon()) as any}
                size={24}
                color={variantStyles.iconColor}
                accessibilityElementsHidden={true}
              />
            </View>
            
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
          </View>

          {/* Message */}
          {message && (
            <View style={styles.messageContainer}>
              <Text style={styles.message}>
                {message}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.actionButton,
                  getActionButtonStyle(action),
                  action.disabled && styles.actionButtonDisabled,
                  { flex: actions.length <= 2 ? 1 : 0 }
                ]}
                onPress={action.onPress}
                disabled={action.disabled}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                accessibilityState={{ disabled: action.disabled }}
              >
                <Text style={[
                  styles.actionText,
                  getActionTextStyle(action),
                  action.disabled && styles.actionTextDisabled
                ]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: DESIGN_TOKENS.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DESIGN_TOKENS.spacing.lg,
  },
  dismissArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dialog: {
    backgroundColor: DESIGN_TOKENS.colors.background,
    borderRadius: DESIGN_TOKENS.borderRadius.xl,
    padding: DESIGN_TOKENS.spacing.xl,
    width: '100%',
    maxHeight: screenHeight * 0.8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: DESIGN_TOKENS.spacing.lg,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  title: {
    ...DESIGN_TOKENS.typography.h1,
    color: DESIGN_TOKENS.colors.text.primary,
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: DESIGN_TOKENS.spacing.xl,
  },
  message: {
    ...DESIGN_TOKENS.typography.body,
    color: DESIGN_TOKENS.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: DESIGN_TOKENS.spacing.md,
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingVertical: DESIGN_TOKENS.spacing.md,
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    borderRadius: DESIGN_TOKENS.borderRadius.md,
    borderWidth: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionText: {
    ...DESIGN_TOKENS.typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionTextDisabled: {
    opacity: 0.5,
  },
});

// Convenience hook for using confirmation dialogs
export function useConfirmationDialog() {
  const [dialog, setDialog] = React.useState<{
    visible: boolean;
    props: Omit<ConfirmationDialogProps, 'visible'>;
  }>({
    visible: false,
    props: {
      title: '',
      actions: [],
    },
  });

  const show = React.useCallback((props: Omit<ConfirmationDialogProps, 'visible'>) => {
    setDialog({ visible: true, props });
  }, []);

  const hide = React.useCallback(() => {
    setDialog(prev => ({ ...prev, visible: false }));
  }, []);

  const confirm = React.useCallback((
    title: string,
    message?: string,
    options: {
      confirmLabel?: string;
      cancelLabel?: string;
      variant?: ConfirmationVariant;
      icon?: string;
    } = {}
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      show({
        title,
        message,
        variant: options.variant,
        icon: options.icon,
        actions: [
          {
            label: options.cancelLabel || 'Cancel',
            variant: 'secondary',
            onPress: () => {
              hide();
              resolve(false);
            },
          },
          {
            label: options.confirmLabel || 'Confirm',
            variant: options.variant === 'danger' ? 'danger' : 'primary',
            onPress: () => {
              hide();
              resolve(true);
            },
          },
        ],
        onDismiss: () => {
          hide();
          resolve(false);
        },
      });
    });
  }, [show, hide]);

  const ConfirmationDialogComponent = React.useCallback(() => (
    <ConfirmationDialog
      visible={dialog.visible}
      {...dialog.props}
      onDismiss={() => {
        dialog.props.onDismiss?.();
        hide();
      }}
    />
  ), [dialog, hide]);

  return {
    show,
    hide,
    confirm,
    ConfirmationDialog: ConfirmationDialogComponent,
  };
}
