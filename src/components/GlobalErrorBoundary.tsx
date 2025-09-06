/**
 * Global Error Boundary for BandhuConnect+ React Native
 * Catches unhandled JavaScript errors and provides graceful fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { toAppError, getTechnicalDetails, AppError } from '../lib/errors';

// Design tokens from Amogh guidelines
const DESIGN_TOKENS = {
  colors: {
    background: '#FFFFFF',
    surface: '#F9FAFB',
    error: '#EF4444',
    errorBackground: '#FEE2E2',
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      error: '#991B1B'
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
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '700' as const
    },
    h2: {
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
    },
    code: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: 'monospace'
    }
  }
};

interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
  showDetails: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: AppError, retry: () => void) => ReactNode;
  onError?: (error: AppError) => void;
}

export class GlobalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const appError = toAppError(error, 'ErrorBoundary');
    
    return {
      hasError: true,
      error: appError,
      showDetails: false
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = toAppError(error, 'ErrorBoundary');
    
    // Log error for debugging
    console.error('🚨 [ErrorBoundary] Caught error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      correlationId: appError.correlationId
    });

    // Report to external service (Sentry, etc.)
    this.reportError(appError, errorInfo);

    // Call onError callback
    this.props.onError?.(appError);
  }

  private reportError = (error: AppError, errorInfo?: ErrorInfo) => {
    // In a real app, this would send to Sentry, Crashlytics, etc.
    console.log('📊 [ErrorBoundary] Reporting error:', {
      correlationId: error.correlationId,
      code: error.code,
      message: error.message,
      componentStack: errorInfo?.componentStack
    });
  };

  private handleRetry = () => {
    // Clear error state to re-render children
    this.setState({
      hasError: false,
      error: null,
      showDetails: false
    });
  };

  private handleReload = () => {
    // In React Native, we can't reload like a web page
    // Instead, we show an alert asking user to restart
    Alert.alert(
      'Restart Required',
      'To fully recover from this error, please close and restart the app.',
      [
        { text: 'OK', style: 'default' }
      ]
    );
  };

  private handleReportBug = () => {
    const { error } = this.state;
    if (!error) return;

    const bugReport = `
Error Report:
- Correlation ID: ${error.correlationId}
- Error Code: ${error.code}
- Message: ${error.message}
- Time: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:
[Your description here]
    `.trim();

    const subject = `BandhuConnect+ Error Report - ${error.correlationId}`;
    const mailto = `mailto:dhruvalbhinsara460@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bugReport)}`;
    
    Linking.openURL(mailto).catch(() => {
      Alert.alert(
        'Unable to Open Email',
        `Please email us at dhruvalbhinsara460@gmail.com with this error ID: ${error.correlationId}`,
        [{ text: 'OK' }]
      );
    });
  };

  private toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default error UI
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            {/* Error Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.iconBackground}>
                <Ionicons 
                  name="warning-outline" 
                  size={48} 
                  color={DESIGN_TOKENS.colors.error}
                />
              </View>
            </View>

            {/* Error Message */}
            <View style={styles.messageContainer}>
              <Text style={styles.title}>Something went wrong</Text>
              <Text style={styles.subtitle}>
                We encountered an unexpected error. Don't worry, your data is safe.
              </Text>
              
              {this.state.error.correlationId && (
                <View style={styles.correlationContainer}>
                  <Text style={styles.correlationLabel}>Error ID:</Text>
                  <Text style={styles.correlationId}>
                    {this.state.error.correlationId}
                  </Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]}
                onPress={this.handleRetry}
                accessibilityRole="button"
                accessibilityLabel="Try again"
              >
                <Ionicons 
                  name="refresh" 
                  size={20} 
                  color={DESIGN_TOKENS.colors.background}
                  style={styles.buttonIcon}
                />
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]}
                onPress={this.handleReload}
                accessibilityRole="button"
                accessibilityLabel="Restart app"
              >
                <Ionicons 
                  name="reload" 
                  size={20} 
                  color={DESIGN_TOKENS.colors.error}
                  style={styles.buttonIcon}
                />
                <Text style={styles.secondaryButtonText}>Restart App</Text>
              </TouchableOpacity>
            </View>

            {/* Technical Details Toggle */}
            <TouchableOpacity 
              style={styles.detailsToggle}
              onPress={this.toggleDetails}
              accessibilityRole="button"
              accessibilityLabel={this.state.showDetails ? "Hide technical details" : "Show technical details"}
            >
              <Text style={styles.detailsToggleText}>
                {this.state.showDetails ? 'Hide' : 'Show'} Technical Details
              </Text>
              <Ionicons 
                name={this.state.showDetails ? "chevron-up" : "chevron-down"} 
                size={16} 
                color={DESIGN_TOKENS.colors.text.secondary}
              />
            </TouchableOpacity>

            {/* Technical Details */}
            {this.state.showDetails && (
              <View style={styles.technicalDetails}>
                <Text style={styles.technicalTitle}>Technical Information</Text>
                <ScrollView style={styles.technicalScroll} horizontal>
                  <Text style={styles.technicalText}>
                    {getTechnicalDetails(this.state.error)}
                  </Text>
                </ScrollView>
                
                <TouchableOpacity 
                  style={[styles.button, styles.tertiaryButton]}
                  onPress={this.handleReportBug}
                  accessibilityRole="button"
                  accessibilityLabel="Report this bug"
                >
                  <Ionicons 
                    name="bug" 
                    size={16} 
                    color={DESIGN_TOKENS.colors.text.secondary}
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.tertiaryButtonText}>Report Bug</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_TOKENS.colors.background,
  },
  content: {
    flex: 1,
    padding: DESIGN_TOKENS.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: DESIGN_TOKENS.spacing.xl,
  },
  iconBackground: {
    width: 96,
    height: 96,
    borderRadius: DESIGN_TOKENS.borderRadius.xl,
    backgroundColor: DESIGN_TOKENS.colors.errorBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: DESIGN_TOKENS.spacing.xl,
  },
  title: {
    ...DESIGN_TOKENS.typography.h1,
    color: DESIGN_TOKENS.colors.text.primary,
    textAlign: 'center',
    marginBottom: DESIGN_TOKENS.spacing.sm,
  },
  subtitle: {
    ...DESIGN_TOKENS.typography.body,
    color: DESIGN_TOKENS.colors.text.secondary,
    textAlign: 'center',
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  correlationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN_TOKENS.colors.surface,
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    borderRadius: DESIGN_TOKENS.borderRadius.md,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
  },
  correlationLabel: {
    ...DESIGN_TOKENS.typography.caption,
    color: DESIGN_TOKENS.colors.text.secondary,
    marginRight: DESIGN_TOKENS.spacing.sm,
  },
  correlationId: {
    ...DESIGN_TOKENS.typography.code,
    color: DESIGN_TOKENS.colors.text.primary,
    fontWeight: '600',
  },
  actionsContainer: {
    width: '100%',
    gap: DESIGN_TOKENS.spacing.md,
    marginBottom: DESIGN_TOKENS.spacing.xl,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DESIGN_TOKENS.spacing.md,
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    borderRadius: DESIGN_TOKENS.borderRadius.md,
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: DESIGN_TOKENS.colors.error,
  },
  secondaryButton: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.error,
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
  },
  buttonIcon: {
    marginRight: DESIGN_TOKENS.spacing.sm,
  },
  primaryButtonText: {
    ...DESIGN_TOKENS.typography.body,
    color: DESIGN_TOKENS.colors.background,
    fontWeight: '600',
  },
  secondaryButtonText: {
    ...DESIGN_TOKENS.typography.body,
    color: DESIGN_TOKENS.colors.error,
    fontWeight: '600',
  },
  tertiaryButtonText: {
    ...DESIGN_TOKENS.typography.caption,
    color: DESIGN_TOKENS.colors.text.secondary,
    fontWeight: '500',
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  detailsToggleText: {
    ...DESIGN_TOKENS.typography.caption,
    color: DESIGN_TOKENS.colors.text.secondary,
    marginRight: DESIGN_TOKENS.spacing.xs,
  },
  technicalDetails: {
    width: '100%',
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderRadius: DESIGN_TOKENS.borderRadius.md,
    padding: DESIGN_TOKENS.spacing.md,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
  },
  technicalTitle: {
    ...DESIGN_TOKENS.typography.h2,
    color: DESIGN_TOKENS.colors.text.primary,
    marginBottom: DESIGN_TOKENS.spacing.sm,
    fontSize: 16,
  },
  technicalScroll: {
    maxHeight: 150,
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  technicalText: {
    ...DESIGN_TOKENS.typography.code,
    color: DESIGN_TOKENS.colors.text.secondary,
  },
});

// Export convenience wrapper for app root
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: (error: AppError, retry: () => void) => ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <GlobalErrorBoundary fallback={fallback}>
      <Component {...props} />
    </GlobalErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};
