import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, TextInputProps, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

interface SimpleInputProps extends Omit<TextInputProps, 'onSubmitEditing' | 'returnKeyType' | 'blurOnSubmit'> {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  containerStyle?: any;
}

const SimpleInput: React.FC<SimpleInputProps> = ({
  label,
  error,
  leftIcon,
  containerStyle,
  secureTextEntry,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const showPasswordToggle = secureTextEntry;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}
      
      <View style={[
        styles.inputContainer,
        error ? styles.inputError : isFocused ? styles.inputFocused : styles.inputDefault
      ]}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={isFocused ? COLORS.primary : COLORS.textSecondary}
            style={styles.leftIcon}
          />
        )}
        
        <TextInput
          style={styles.textInput}
          onFocus={() => {
            console.log(`[SimpleInput] Focus: ${label || 'Unnamed field'}`);
            setIsFocused(true);
          }}
          onBlur={() => {
            console.log(`[SimpleInput] Blur: ${label || 'Unnamed field'}`);
            setIsFocused(false);
          }}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          blurOnSubmit={true}
          returnKeyType="done"
          autoFocus={false}
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
          importantForAutofill="no"
          selectTextOnFocus={false}
          {...props}
          onChangeText={(text) => {
            console.log(`[SimpleInput] Text Change: ${label || 'Unnamed field'} - ${text}`);
            props.onChangeText?.(text);
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
      
      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: '#ffffff',
    minHeight: 48,
  },
  inputDefault: {
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: '#ffffff',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  leftIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
});

export default SimpleInput;
