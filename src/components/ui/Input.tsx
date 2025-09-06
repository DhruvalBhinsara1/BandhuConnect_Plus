/**
 * Enhanced Input Component for BandhuConnect+
 * Theme-aware input with comprehensive validation and state support
 */

import React, { useState, forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  TextInputProps,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, getInputStyles, SPACING, BORDER_RADIUS } from '../../theme';

export type InputVariant = 'default' | 'filled' | 'outline';
export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  // Content
  label?: string;
  placeholder?: string;
  helperText?: string;
  errorMessage?: string;
  
  // Icons
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  
  // Appearance
  variant?: InputVariant;
  size?: InputSize;
  
  // States
  error?: boolean;
  disabled?: boolean;
  required?: boolean;
  
  // Styling
  style?: ViewStyle;
  inputStyle?: TextStyle;
  
  // Accessibility
  testID?: string;
}

export const Input = forwardRef<TextInput, InputProps>(({
  label,
  placeholder,
  helperText,
  errorMessage,
  leftIcon,
  rightIcon,
  onRightIconPress,
  variant = 'default',
  size = 'md',
  error = false,
  disabled = false,
  required = false,
  style,
  inputStyle,
  testID,
  ...textInputProps
}, ref) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const inputStyles = getInputStyles(theme);

  const hasError = error || !!errorMessage;
  const showError = hasError && errorMessage;
  const showHelper = !showError && helperText;

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          container: { minHeight: 36 },
          input: { 
            fontSize: 14,
            paddingHorizontal: SPACING[2.5],
            paddingVertical: SPACING[2],
          },
          icon: 16,
        };
      case 'lg':
        return {
          container: { minHeight: 56 },
          input: { 
            fontSize: 18,
            paddingHorizontal: SPACING[4],
            paddingVertical: SPACING[4],
          },
          icon: 24,
        };
      default:
        return {
          container: { minHeight: 44 },
          input: { 
            fontSize: 16,
            paddingHorizontal: SPACING[3],
            paddingVertical: SPACING[3],
          },
          icon: 20,
        };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: theme.surface.secondary,
          borderWidth: 0,
          borderBottomWidth: 2,
          borderBottomColor: isFocused ? theme.border.focus : theme.border.primary,
          borderRadius: BORDER_RADIUS.md,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: isFocused ? theme.border.focus : theme.border.primary,
          borderRadius: BORDER_RADIUS.md,
        };
      default:
        return {
          backgroundColor: theme.surface.primary,
          borderWidth: 1,
          borderColor: isFocused ? theme.border.focus : theme.border.primary,
          borderRadius: BORDER_RADIUS.md,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  const containerStyle = [
    styles.container,
    sizeStyles.container,
    variantStyles,
    hasError && { borderColor: theme.border.error },
    disabled && { 
      backgroundColor: theme.surface.disabled,
      borderColor: theme.border.primary,
    },
    style,
  ];

  const textInputStyle = [
    styles.input,
    sizeStyles.input,
    {
      color: disabled ? theme.text.disabled : theme.text.primary,
    },
    leftIcon && { paddingLeft: sizeStyles.icon + SPACING[3] + SPACING[2] },
    rightIcon && { paddingRight: sizeStyles.icon + SPACING[3] + SPACING[2] },
    inputStyle,
  ];

  return (
    <View style={styles.wrapper}>
      {/* Label */}
      {label && (
        <Text style={[
          styles.label,
          { color: theme.text.secondary },
          hasError && { color: theme.error },
        ]}>
          {label}
          {required && <Text style={{ color: theme.error }}> *</Text>}
        </Text>
      )}

      {/* Input Container */}
      <View style={containerStyle}>
        {/* Left Icon */}
        {leftIcon && (
          <Ionicons
            name={leftIcon as any}
            size={sizeStyles.icon}
            color={disabled ? theme.icon.tertiary : theme.icon.primary}
            style={[styles.leftIcon, { left: SPACING[3] }]}
          />
        )}

        {/* Text Input */}
        <TextInput
          ref={ref}
          style={textInputStyle}
          placeholder={placeholder}
          placeholderTextColor={theme.text.tertiary}
          editable={!disabled}
          onFocus={(e) => {
            setIsFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            textInputProps.onBlur?.(e);
          }}
          testID={testID}
          accessibilityLabel={label}
          accessibilityHint={helperText || errorMessage}
          accessibilityState={{ disabled }}
          {...textInputProps}
        />

        {/* Right Icon */}
        {rightIcon && (
          <TouchableOpacity
            style={[styles.rightIcon, { right: SPACING[3] }]}
            onPress={onRightIconPress}
            disabled={!onRightIconPress || disabled}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={rightIcon as any}
              size={sizeStyles.icon}
              color={disabled ? theme.icon.tertiary : theme.icon.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Helper Text or Error */}
      {(showHelper || showError) && (
        <Text style={[
          styles.helperText,
          showError ? { color: theme.error } : { color: theme.text.tertiary },
        ]}>
          {showError ? errorMessage : helperText}
        </Text>
      )}
    </View>
  );
});

const styles = {
  wrapper: {
    width: '100%' as any,
  },
  container: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    position: 'relative' as const,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  input: {
    flex: 1,
    fontWeight: '400' as const,
    includeFontPadding: false,
    textAlignVertical: 'center' as const,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: SPACING[1.5],
    lineHeight: 20,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: SPACING[1],
  },
  leftIcon: {
    position: 'absolute' as const,
    zIndex: 1,
  },
  rightIcon: {
    position: 'absolute' as const,
    zIndex: 1,
  },
};

Input.displayName = 'Input';

// Convenience components for common input types
export const EmailInput: React.FC<Omit<InputProps, 'keyboardType' | 'autoCapitalize' | 'autoComplete'>> = (props) => (
  <Input
    {...props}
    keyboardType="email-address"
    autoCapitalize="none"
    autoComplete="email"
    leftIcon="mail"
  />
);

export const PasswordInput: React.FC<Omit<InputProps, 'secureTextEntry'>> = (props) => {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <Input
      {...props}
      secureTextEntry={!showPassword}
      leftIcon="lock-closed"
      rightIcon={showPassword ? "eye-off" : "eye"}
      onRightIconPress={() => setShowPassword(!showPassword)}
    />
  );
};

export const SearchInput: React.FC<Omit<InputProps, 'leftIcon'>> = (props) => (
  <Input
    {...props}
    leftIcon="search"
    placeholder="Search..."
  />
);

export const PhoneInput: React.FC<Omit<InputProps, 'keyboardType' | 'leftIcon'>> = (props) => (
  <Input
    {...props}
    keyboardType="phone-pad"
    leftIcon="call"
  />
);
