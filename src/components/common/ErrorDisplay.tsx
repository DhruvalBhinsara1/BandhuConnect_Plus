import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ErrorHandlingService, UserFriendlyError } from '../../services/errorHandlingService';

interface ErrorDisplayProps {
  error: UserFriendlyError | null;
  onDismiss?: () => void;
  onAction?: () => void;
  style?: any;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  onDismiss, 
  onAction,
  style 
}) => {
  console.log('[ErrorDisplay] Rendering with error:', error);
  
  if (!error) {
    console.log('[ErrorDisplay] No error to display');
    return null;
  }

  console.log('[ErrorDisplay] Displaying error:', {
    title: error.title,
    message: error.message,
    severity: error.severity
  });

  const errorColor = ErrorHandlingService.getErrorColor(error.severity);
  const errorIcon = ErrorHandlingService.getErrorIcon(error.severity);

  return (
    <View style={[styles.container, { borderLeftColor: errorColor }, style]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons 
            name={errorIcon as any} 
            size={20} 
            color={errorColor} 
            style={styles.icon} 
          />
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: errorColor }]}>
              {error.title}
            </Text>
            <Text style={styles.message}>
              {error.message}
            </Text>
          </View>
          {onDismiss && (
            <TouchableOpacity 
              onPress={onDismiss}
              style={styles.dismissButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={18} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
        
        {error.action && onAction && (
          <TouchableOpacity 
            onPress={onAction}
            style={[styles.actionButton, { backgroundColor: `${errorColor}10` }]}
          >
            <Text style={[styles.actionText, { color: errorColor }]}>
              {error.action}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

interface InlineErrorProps {
  error: string | null;
  style?: any;
}

export const InlineError: React.FC<InlineErrorProps> = ({ error, style }) => {
  if (!error) return null;

  return (
    <View style={[styles.inlineContainer, style]}>
      <Ionicons name="alert-circle" size={14} color="#DC2626" style={styles.inlineIcon} />
      <Text style={styles.inlineText}>{error}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderLeftWidth: 4,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  content: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: 8,
    marginTop: 1,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  dismissButton: {
    padding: 2,
  },
  actionButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  inlineIcon: {
    marginRight: 4,
  },
  inlineText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
  },
});
