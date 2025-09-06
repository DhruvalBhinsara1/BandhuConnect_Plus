/**
 * Action Sheet Component for BandhuConnect+
 * Professional bottom sheet for context-aware actions
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
  StatusBar,
  AccessibilityInfo,
  BackHandler,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Design tokens matching Amogh guidelines
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
      muted: '#9CA3AF',
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
    xl: 16,
    xxl: 24
  },
  typography: {
    h2: {
      fontSize: 18,
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

export interface ActionSheetAction {
  label: string;
  onPress: () => void;
  icon?: string;
  variant?: 'default' | 'primary' | 'danger' | 'warning';
  disabled?: boolean;
  subtitle?: string;
}

export interface ActionSheetProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  actions: ActionSheetAction[];
  onDismiss: () => void;
  cancelLabel?: string;
  maxHeight?: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const ActionSheet: React.FC<ActionSheetProps> = ({
  visible,
  title,
  subtitle,
  actions,
  onDismiss,
  cancelLabel = 'Cancel',
  maxHeight = screenHeight * 0.7
}) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      // Announce to screen readers
      const announcement = title 
        ? `Action sheet opened: ${title}. ${subtitle || ''}`
        : 'Action options available';
      AccessibilityInfo.announceForAccessibility(announcement);

      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Hide animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible) {
        onDismiss();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [visible, onDismiss]);

  const getActionStyles = (action: ActionSheetAction) => {
    switch (action.variant) {
      case 'primary':
        return {
          textColor: DESIGN_TOKENS.colors.primary,
          iconColor: DESIGN_TOKENS.colors.primary,
        };
      case 'danger':
        return {
          textColor: DESIGN_TOKENS.colors.danger,
          iconColor: DESIGN_TOKENS.colors.danger,
        };
      case 'warning':
        return {
          textColor: DESIGN_TOKENS.colors.warning,
          iconColor: DESIGN_TOKENS.colors.warning,
        };
      default:
        return {
          textColor: DESIGN_TOKENS.colors.text.primary,
          iconColor: DESIGN_TOKENS.colors.text.secondary,
        };
    }
  };

  const contentHeight = Math.min(
    // Header height + actions + cancel + padding
    (title || subtitle ? 80 : 20) + 
    (actions.length * 60) + 
    70 + // Cancel button
    insets.bottom + 
    DESIGN_TOKENS.spacing.lg * 2,
    maxHeight
  );

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity
          style={styles.dismissArea}
          activeOpacity={1}
          onPress={onDismiss}
          accessible={false}
        />
        
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.lg,
              transform: [{ translateY: slideAnim }],
              maxHeight: contentHeight,
            },
          ]}
          accessible={true}
          accessibilityRole="menu"
          accessibilityLabel={title ? `Actions for ${title}` : 'Available actions'}
        >
          {/* Drag Handle */}
          <View style={styles.dragHandle} />
          
          {/* Header */}
          {(title || subtitle) && (
            <View style={styles.header}>
              {title && (
                <Text style={styles.title} accessibilityRole="header">
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text style={styles.subtitle}>
                  {subtitle}
                </Text>
              )}
            </View>
          )}

          {/* Actions */}
          <ScrollView
            style={styles.actionsContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {actions.map((action, index) => {
              const actionStyles = getActionStyles(action);
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.actionItem,
                    action.disabled && styles.actionItemDisabled,
                    index === actions.length - 1 && styles.lastActionItem
                  ]}
                  onPress={action.onPress}
                  disabled={action.disabled}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                  accessibilityHint={action.subtitle}
                  accessibilityState={{ disabled: action.disabled }}
                >
                  <View style={styles.actionContent}>
                    {action.icon && (
                      <Ionicons
                        name={action.icon as any}
                        size={20}
                        color={action.disabled ? DESIGN_TOKENS.colors.text.muted : actionStyles.iconColor}
                        style={styles.actionIcon}
                      />
                    )}
                    
                    <View style={styles.actionTextContainer}>
                      <Text style={[
                        styles.actionLabel,
                        { color: action.disabled ? DESIGN_TOKENS.colors.text.muted : actionStyles.textColor }
                      ]}>
                        {action.label}
                      </Text>
                      
                      {action.subtitle && (
                        <Text style={[
                          styles.actionSubtitle,
                          { color: action.disabled ? DESIGN_TOKENS.colors.text.muted : DESIGN_TOKENS.colors.text.secondary }
                        ]}>
                          {action.subtitle}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Cancel Button */}
          <View style={styles.cancelContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onDismiss}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
            >
              <Text style={styles.cancelText}>
                {cancelLabel}
              </Text>
            </TouchableOpacity>
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
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: DESIGN_TOKENS.colors.background,
    borderTopLeftRadius: DESIGN_TOKENS.borderRadius.xxl,
    borderTopRightRadius: DESIGN_TOKENS.borderRadius.xxl,
    paddingTop: DESIGN_TOKENS.spacing.md,
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: DESIGN_TOKENS.colors.text.muted,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: DESIGN_TOKENS.spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingBottom: DESIGN_TOKENS.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_TOKENS.colors.border,
    marginBottom: DESIGN_TOKENS.spacing.sm,
  },
  title: {
    ...DESIGN_TOKENS.typography.h2,
    color: DESIGN_TOKENS.colors.text.primary,
    textAlign: 'center',
    marginBottom: DESIGN_TOKENS.spacing.xs,
  },
  subtitle: {
    ...DESIGN_TOKENS.typography.caption,
    color: DESIGN_TOKENS.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionsContainer: {
    maxHeight: screenHeight * 0.4,
  },
  actionItem: {
    paddingVertical: DESIGN_TOKENS.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_TOKENS.colors.border,
    minHeight: 60,
    justifyContent: 'center',
  },
  lastActionItem: {
    borderBottomWidth: 0,
  },
  actionItemDisabled: {
    opacity: 0.5,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    marginRight: DESIGN_TOKENS.spacing.md,
    width: 20,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionLabel: {
    ...DESIGN_TOKENS.typography.body,
    fontWeight: '500',
  },
  actionSubtitle: {
    ...DESIGN_TOKENS.typography.caption,
    marginTop: DESIGN_TOKENS.spacing.xs,
  },
  cancelContainer: {
    paddingTop: DESIGN_TOKENS.spacing.lg,
    marginTop: DESIGN_TOKENS.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: DESIGN_TOKENS.colors.border,
  },
  cancelButton: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    paddingVertical: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.borderRadius.md,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  cancelText: {
    ...DESIGN_TOKENS.typography.body,
    color: DESIGN_TOKENS.colors.text.secondary,
    fontWeight: '600',
  },
});

// Convenience hook for using action sheets
export function useActionSheet() {
  const [sheet, setSheet] = React.useState<{
    visible: boolean;
    props: Omit<ActionSheetProps, 'visible' | 'onDismiss'>;
  }>({
    visible: false,
    props: {
      actions: [],
    },
  });

  const show = React.useCallback((props: Omit<ActionSheetProps, 'visible' | 'onDismiss'>) => {
    setSheet({ visible: true, props });
  }, []);

  const hide = React.useCallback(() => {
    setSheet(prev => ({ ...prev, visible: false }));
  }, []);

  const ActionSheetComponent = React.useCallback(() => (
    <ActionSheet
      visible={sheet.visible}
      {...sheet.props}
      onDismiss={hide}
    />
  ), [sheet, hide]);

  return {
    show,
    hide,
    ActionSheet: ActionSheetComponent,
  };
}
