import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#FF6B35',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  text: '#2C3E50',
  textSecondary: '#7F8C8D',
  border: '#E1E8ED',
  borderFocus: '#FF6B35',
  error: '#E74C3C',
  success: '#27AE60',
};

interface ControlledInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  leftIcon?: string;
  error?: string;
  editable?: boolean;
}

export interface ControlledInputRef {
  focus: () => void;
  blur: () => void;
  isFocused: () => boolean;
}

const ControlledInput = forwardRef<ControlledInputRef, ControlledInputProps>(
  ({ label, placeholder, value, onChangeText, secureTextEntry = false, leftIcon, error, editable = true }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const inputRef = useRef<TextInput>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        console.log(`[ControlledInput] Manual focus: ${label || 'Unnamed field'}`);
        inputRef.current?.focus();
      },
      blur: () => {
        console.log(`[ControlledInput] Manual blur: ${label || 'Unnamed field'}`);
        inputRef.current?.blur();
      },
      isFocused: () => isFocused,
    }));

    const handleFocus = () => {
      console.log(`[ControlledInput] Focus event: ${label || 'Unnamed field'}`);
      setIsFocused(true);
    };

    const handleBlur = () => {
      console.log(`[ControlledInput] Blur event: ${label || 'Unnamed field'}`);
      setIsFocused(false);
    };

    const togglePasswordVisibility = () => {
      setIsPasswordVisible(!isPasswordVisible);
    };

    const showPasswordToggle = secureTextEntry;

    const containerStyle = [
      styles.container,
      isFocused && styles.containerFocused,
      error && styles.containerError,
    ];

    return (
      <View style={styles.wrapper}>
        {label && <Text style={styles.label}>{label}</Text>}
        
        <View style={containerStyle}>
          {leftIcon && (
            <Ionicons
              name={leftIcon as any}
              size={20}
              color={isFocused ? COLORS.primary : COLORS.textSecondary}
              style={styles.leftIcon}
            />
          )}
          
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder={placeholder}
            value={value}
            onChangeText={(text) => {
              console.log(`[ControlledInput] Text change: ${label || 'Unnamed field'} - ${text}`);
              onChangeText(text);
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            secureTextEntry={secureTextEntry && !isPasswordVisible}
            editable={editable}
            // Completely disable all automatic focus management
            blurOnSubmit={true}
            returnKeyType="done"
            autoFocus={false}
            autoCorrect={false}
            autoComplete="off"
            textContentType="none"
            importantForAutofill="no"
            selectTextOnFocus={false}
            // Prevent any keyboard navigation
            onSubmitEditing={() => {
              console.log(`[ControlledInput] Submit blocked: ${label || 'Unnamed field'}`);
              inputRef.current?.blur();
            }}
          />
          
          {showPasswordToggle && (
            <TouchableOpacity onPress={togglePasswordVisibility}>
              <Ionicons
                name={isPasswordVisible ? 'eye-off' : 'eye'}
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
        
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 50,
  },
  containerFocused: {
    borderColor: COLORS.borderFocus,
    backgroundColor: COLORS.background,
  },
  containerError: {
    borderColor: COLORS.error,
  },
  leftIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    padding: 0,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    marginTop: 4,
  },
});

ControlledInput.displayName = 'ControlledInput';

export default ControlledInput;
