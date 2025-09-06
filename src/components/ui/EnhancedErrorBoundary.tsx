/**
 * Enhanced Error Boundary for BandhuConnect+
 * Production-ready error boundary with recovery actions and reporting
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Design tokens
const DESIGN_TOKENS = {
  colors: {
    background: '#FFFFFF',
    surface: '#F9FAFB',
    danger: '#EF4444',
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
    }
  }
};

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  isReporting: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableReporting?: boolean;
}

interface ErrorReport {
  errorId: string;
  timestamp: string;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  componentStack: string;
  appInfo: {
    version: string;
    buildNumber: string;
    platform: string;
    osVersion: string;
  };
  userAgent?: string;
}

export class EnhancedErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isReporting: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error details
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    
    // Call custom error handler
    this.props.onError?.(error, errorInfo);
    
    // Auto-report if enabled
    if (this.props.enableReporting) {
      this.reportError(error, errorInfo);
    }
    
    // Store error for crash analytics
    this.storeErrorLocally(error, errorInfo);
  }

  private async storeErrorLocally(error: Error, errorInfo: ErrorInfo) {
    try {
      const errorReport: ErrorReport = await this.createErrorReport(error, errorInfo);
      const existingErrors = await AsyncStorage.getItem('app_errors');
      const errors = existingErrors ? JSON.parse(existingErrors) : [];
      
      // Keep only last 10 errors
      errors.push(errorReport);
      if (errors.length > 10) {
        errors.shift();
      }
      
      await AsyncStorage.setItem('app_errors', JSON.stringify(errors));
    } catch (storageError) {
      console.error('Failed to store error locally:', storageError);
    }
  }

  private async createErrorReport(error: Error, errorInfo: ErrorInfo): Promise<ErrorReport> {
    const appVersion = Constants.expoConfig?.version || '1.0.0';
    const buildNumber = Constants.expoConfig?.runtimeVersion?.toString() || 'dev';
    
    return {
      errorId: this.state.errorId!,
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      componentStack: errorInfo.componentStack,
      appInfo: {
        version: appVersion,
        buildNumber: buildNumber,
        platform: Platform.OS,
        osVersion: Platform.Version.toString(),
      },
    };
  }

  private async reportError(error: Error, errorInfo: ErrorInfo) {
    if (this.state.isReporting) return;
    
    this.setState({ isReporting: true });
    
    try {
      const errorReport = await this.createErrorReport(error, errorInfo);
      
      // Here you would send to your error reporting service
      // For example: Sentry, Bugsnag, or custom endpoint
      console.log('Error report prepared:', errorReport);
      
      // TODO: Replace with actual error reporting service
      // await fetch('https://your-error-endpoint.com/report', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport),
      // });
      
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    } finally {
      this.setState({ isReporting: false });
    }
  }

  private retry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isReporting: false,
    });
  };

  private async shareErrorDetails() {
    if (!this.state.error || !this.state.errorInfo) return;
    
    try {
      const errorReport = await this.createErrorReport(this.state.error, this.state.errorInfo);
      const shareContent = `BandhuConnect+ Error Report

Error ID: ${errorReport.errorId}
Time: ${new Date(errorReport.timestamp).toLocaleString()}

Error: ${errorReport.error.name}
Message: ${errorReport.error.message}

App Version: ${errorReport.appInfo.version}
Platform: ${errorReport.appInfo.platform} ${errorReport.appInfo.osVersion}

Please send this to the development team for investigation.`;

      await Share.share({
        message: shareContent,
        title: 'BandhuConnect+ Error Report',
      });
    } catch (shareError) {
      console.error('Failed to share error details:', shareError);
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.retry);
      }

      // Default error UI
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            {/* Error Icon */}
            <View style={styles.iconContainer}>
              <Ionicons
                name="warning"
                size={64}
                color={DESIGN_TOKENS.colors.danger}
              />
            </View>

            {/* Error Message */}
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.message}>
              We encountered an unexpected error. Don't worry, your data is safe. 
              You can try the actions below to continue using the app.
            </Text>

            {/* Error ID */}
            {this.state.errorId && (
              <View style={styles.errorIdContainer}>
                <Text style={styles.errorIdLabel}>Error ID:</Text>
                <Text style={styles.errorId}>{this.state.errorId}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={this.retry}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Try again"
              >
                <Ionicons name="refresh" size={20} color={DESIGN_TOKENS.colors.text.inverse} />
                <Text style={[styles.actionText, styles.primaryButtonText]}>
                  Try Again
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => this.shareErrorDetails()}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Report issue"
              >
                <Ionicons name="share" size={20} color={DESIGN_TOKENS.colors.text.primary} />
                <Text style={[styles.actionText, styles.secondaryButtonText]}>
                  Report Issue
                </Text>
              </TouchableOpacity>
            </View>

            {/* Development Info (only in dev mode) */}
            {__DEV__ && this.state.error && (
              <View style={styles.devInfoContainer}>
                <Text style={styles.devInfoTitle}>Development Info:</Text>
                <Text style={styles.devInfoText}>
                  {this.state.error.name}: {this.state.error.message}
                </Text>
                {this.state.error.stack && (
                  <ScrollView style={styles.stackTrace} horizontal>
                    <Text style={styles.stackTraceText}>
                      {this.state.error.stack}
                    </Text>
                  </ScrollView>
                )}
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
  title: {
    ...DESIGN_TOKENS.typography.h1,
    color: DESIGN_TOKENS.colors.text.primary,
    textAlign: 'center',
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  message: {
    ...DESIGN_TOKENS.typography.body,
    color: DESIGN_TOKENS.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: DESIGN_TOKENS.spacing.xl,
  },
  errorIdContainer: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    borderRadius: DESIGN_TOKENS.borderRadius.md,
    marginBottom: DESIGN_TOKENS.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorIdLabel: {
    ...DESIGN_TOKENS.typography.caption,
    color: DESIGN_TOKENS.colors.text.secondary,
    marginRight: DESIGN_TOKENS.spacing.sm,
  },
  errorId: {
    ...DESIGN_TOKENS.typography.caption,
    color: DESIGN_TOKENS.colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  actionsContainer: {
    width: '100%',
    gap: DESIGN_TOKENS.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DESIGN_TOKENS.spacing.md,
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    borderRadius: DESIGN_TOKENS.borderRadius.lg,
    minHeight: 48,
    gap: DESIGN_TOKENS.spacing.sm,
  },
  primaryButton: {
    backgroundColor: DESIGN_TOKENS.colors.danger,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
  },
  actionText: {
    ...DESIGN_TOKENS.typography.body,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: DESIGN_TOKENS.colors.text.inverse,
  },
  secondaryButtonText: {
    color: DESIGN_TOKENS.colors.text.primary,
  },
  devInfoContainer: {
    width: '100%',
    marginTop: DESIGN_TOKENS.spacing.xxl,
    padding: DESIGN_TOKENS.spacing.md,
    backgroundColor: '#FEF2F2',
    borderRadius: DESIGN_TOKENS.borderRadius.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  devInfoTitle: {
    ...DESIGN_TOKENS.typography.caption,
    fontWeight: '600',
    color: DESIGN_TOKENS.colors.danger,
    marginBottom: DESIGN_TOKENS.spacing.sm,
  },
  devInfoText: {
    ...DESIGN_TOKENS.typography.caption,
    color: DESIGN_TOKENS.colors.danger,
    marginBottom: DESIGN_TOKENS.spacing.sm,
  },
  stackTrace: {
    maxHeight: 100,
  },
  stackTraceText: {
    ...DESIGN_TOKENS.typography.caption,
    color: DESIGN_TOKENS.colors.danger,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
  },
});

// Convenience wrapper component
interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  customFallback?: (error: Error, retry: () => void) => ReactNode;
}

export const ErrorBoundaryWrapper: React.FC<ErrorBoundaryWrapperProps> = ({
  children,
  customFallback,
}) => {
  return (
    <EnhancedErrorBoundary
      fallback={customFallback}
      enableReporting={!__DEV__} // Only report in production
      onError={(error, errorInfo) => {
        // Custom error logging
        console.error('App Error:', error);
        console.error('Error Info:', errorInfo);
      }}
    >
      {children}
    </EnhancedErrorBoundary>
  );
};
