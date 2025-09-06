/**
 * Enhanced Button Component for BandhuConnect+
 * Theme-aware button with comprehensive variant support
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, getButtonStyles, SPACING, BORDER_RADIUS } from '../../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps {
  // Content
  title: string;
  subtitle?: string;
  icon?: string;
  iconPosition?: 'left' | 'right';
  
  // Behavior
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  
  // Appearance
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  
  // Styling
  style?: ViewStyle;
  textStyle?: TextStyle;
  
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  subtitle,
  icon,
  iconPosition = 'left',
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const { theme, spacing, borderRadius } = useTheme();
  const buttonStyles = getButtonStyles(theme);
  
  // Create styles without using createThemedStyles to avoid type issues
  const styles = getStyles(theme);

  const isDisabled = disabled || loading;

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          container: styles.containerSm,
          text: styles.textSm,
          icon: 16,
        };
      case 'lg':
        return {
          container: styles.containerLg,
          text: styles.textLg,
          icon: 24,
        };
      case 'xl':
        return {
          container: styles.containerXl,
          text: styles.textXl,
          icon: 28,
        };
      default:
        return {
          container: styles.containerMd,
          text: styles.textMd,
          icon: 20,
        };
    }
  };

  const getVariantStyles = () => {
    if (isDisabled) {
      return {
        container: buttonStyles.disabled,
        text: { color: theme.text.disabled },
      };
    }

    switch (variant) {
      case 'secondary':
        return {
          container: buttonStyles.secondary,
          text: { color: theme.text.primary },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderColor: theme.primary,
            borderWidth: 1,
          },
          text: { color: theme.primary },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          text: { color: theme.primary },
        };
      case 'danger':
        return {
          container: buttonStyles.danger,
          text: { color: theme.text.inverse },
        };
      case 'success':
        return {
          container: buttonStyles.success,
          text: { color: theme.text.inverse },
        };
      case 'warning':
        return {
          container: {
            backgroundColor: theme.warning,
            borderColor: theme.warning,
          },
          text: { color: theme.text.inverse },
        };
      default: // primary
        return {
          container: buttonStyles.primary,
          text: { color: theme.text.inverse },
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  const renderIcon = () => {
    if (!icon && !loading) return null;

    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={variantStyles.text.color}
          style={styles.loadingIcon}
        />
      );
    }

    return (
      <Ionicons
        name={icon as any}
        size={sizeStyles.icon}
        color={variantStyles.text.color}
        style={iconPosition === 'left' ? styles.iconLeft : styles.iconRight}
      />
    );
  };

  const renderContent = () => {
    return (
      <View style={styles.content}>
        {iconPosition === 'left' && renderIcon()}
        
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.baseText,
              sizeStyles.text,
              variantStyles.text,
              textStyle,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                { color: variantStyles.text.color },
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
        
        {iconPosition === 'right' && renderIcon()}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        sizeStyles.container,
        variantStyles.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={isDisabled ? 1 : 0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled }}
      testID={testID}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const getStyles = (theme: any) => ({
  base: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  
  // Size variants
  containerSm: {
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    minHeight: 36,
  },
  containerMd: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    minHeight: 44,
  },
  containerLg: {
    paddingHorizontal: SPACING[6],
    paddingVertical: SPACING[4],
    minHeight: 52,
  },
  containerXl: {
    paddingHorizontal: SPACING[8],
    paddingVertical: SPACING[5],
    minHeight: 60,
  },
  
  // Text styles
  baseText: {
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  textSm: {
    fontSize: 14,
    lineHeight: 18,
  },
  textMd: {
    fontSize: 16,
    lineHeight: 20,
  },
  textLg: {
    fontSize: 18,
    lineHeight: 22,
  },
  textXl: {
    fontSize: 20,
    lineHeight: 24,
  },
  
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.8,
    marginTop: 2,
  },
  
  // Layout
  content: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  textContainer: {
    alignItems: 'center' as const,
  },
  iconLeft: {
    marginRight: SPACING[2],
  },
  iconRight: {
    marginLeft: SPACING[2],
  },
  loadingIcon: {
    marginRight: SPACING[2],
  },
  
  // States
  fullWidth: {
    width: '100%' as any,
  },
  disabled: {
    opacity: 0.6,
  },
});

// Convenience components for common variants
export const PrimaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="primary" />
);

export const SecondaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="secondary" />
);

export const DangerButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="danger" />
);

export const OutlineButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="outline" />
);
