/**
 * Error Handling Utility Service
 * Provides user-friendly error messages and consistent error handling
 */

export interface UserFriendlyError {
  title: string;
  message: string;
  action?: string;
  severity: 'error' | 'warning' | 'info';
}

export class ErrorHandlingService {
  
  /**
   * Convert authentication errors to user-friendly messages
   */
  static handleAuthError(error: any): UserFriendlyError {
    if (!error) return this.getGenericError();

    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code?.toLowerCase() || '';

    // Authentication specific errors
    if (errorMessage.includes('invalid login credentials') || 
        errorMessage.includes('invalid email or password')) {
      return {
        title: 'Sign In Failed',
        message: 'The email or password you entered is incorrect. Please double-check and try again.',
        action: 'Check your credentials',
        severity: 'error'
      };
    }

    if (errorMessage.includes('email not confirmed') || 
        errorCode.includes('email_not_confirmed')) {
      return {
        title: 'Email Not Verified',
        message: 'Please check your email and click the verification link before signing in.',
        action: 'Check your email inbox',
        severity: 'warning'
      };
    }

    if (errorMessage.includes('too many requests') || 
        errorCode.includes('too_many_requests')) {
      return {
        title: 'Too Many Attempts',
        message: 'Too many login attempts. Please wait 5 minutes and try again.',
        action: 'Wait and try again',
        severity: 'warning'
      };
    }

    if (errorMessage.includes('weak password') || 
        errorCode.includes('weak_password')) {
      return {
        title: 'Password Too Weak',
        message: 'Please choose a stronger password with at least 8 characters, including letters and numbers.',
        action: 'Choose a stronger password',
        severity: 'error'
      };
    }

    if (errorMessage.includes('user already registered') || 
        errorCode.includes('user_already_exists')) {
      return {
        title: 'Account Already Exists',
        message: 'An account with this email already exists. Please sign in instead.',
        action: 'Try signing in',
        severity: 'info'
      };
    }

    if (errorMessage.includes('signup disabled') || 
        errorCode.includes('signup_disabled')) {
      return {
        title: 'Registration Unavailable',
        message: 'New account registration is temporarily disabled. Please contact support.',
        action: 'Contact support',
        severity: 'warning'
      };
    }

    // Network and connectivity errors
    if (errorMessage.includes('network') || 
        errorMessage.includes('fetch') ||
        errorMessage.includes('connection')) {
      return {
        title: 'Connection Problem',
        message: 'Please check your internet connection and try again.',
        action: 'Check connection',
        severity: 'warning'
      };
    }

    return this.getGenericError();
  }

  /**
   * Handle form validation errors
   */
  static handleValidationError(field: string, value: string): string | null {
    if (!value?.trim()) {
      switch (field) {
        case 'email': return 'Email address is required';
        case 'password': return 'Password is required';
        case 'name': return 'Full name is required';
        case 'phone': return 'Phone number is required';
        default: return `${field} is required`;
      }
    }

    switch (field) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Please enter a valid email address';
        }
        break;
      
      case 'password':
        if (value.length < 6) {
          return 'Password must be at least 6 characters';
        }
        break;
      
      case 'phone':
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(value)) {
          return 'Please enter a valid phone number';
        }
        break;
      
      case 'name':
        if (value.length < 2) {
          return 'Name must be at least 2 characters';
        }
        break;
    }

    return null;
  }

  /**
   * Handle database and server errors
   */
  static handleDatabaseError(error: any): UserFriendlyError {
    if (!error) return this.getGenericError();

    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || '';

    // Duplicate key violations
    if (errorCode === '23505') {
      if (errorMessage.includes('phone')) {
        return {
          title: 'Phone Number In Use',
          message: 'This phone number is already registered. Please use a different number or sign in to your existing account.',
          action: 'Use different phone',
          severity: 'error'
        };
      }
      if (errorMessage.includes('email')) {
        return {
          title: 'Email Already Registered',
          message: 'This email is already registered. Please sign in or use a different email.',
          action: 'Try signing in',
          severity: 'error'
        };
      }
      return {
        title: 'Duplicate Information',
        message: 'Some of your information is already in use. Please check and try again.',
        action: 'Check your information',
        severity: 'error'
      };
    }

    // Permission denied
    if (errorCode === '42501' || errorMessage.includes('permission denied')) {
      return {
        title: 'Access Denied',
        message: 'You do not have permission to perform this action.',
        action: 'Contact support',
        severity: 'error'
      };
    }

    // Connection timeout
    if (errorMessage.includes('timeout') || errorMessage.includes('connection')) {
      return {
        title: 'Server Timeout',
        message: 'The server is taking too long to respond. Please try again.',
        action: 'Try again',
        severity: 'warning'
      };
    }

    return this.getGenericError();
  }

  /**
   * Handle location and map errors
   */
  static handleLocationError(error: any): UserFriendlyError {
    if (!error) return this.getGenericError();

    const errorMessage = error.message?.toLowerCase() || '';

    if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
      return {
        title: 'Location Permission Needed',
        message: 'Please enable location access in your device settings to use map features.',
        action: 'Enable location',
        severity: 'warning'
      };
    }

    if (errorMessage.includes('unavailable') || errorMessage.includes('timeout')) {
      return {
        title: 'Location Unavailable',
        message: 'Unable to get your current location. Please ensure GPS is enabled and try again.',
        action: 'Check GPS settings',
        severity: 'warning'
      };
    }

    return {
      title: 'Location Error',
      message: 'There was a problem with location services. Please try again.',
      action: 'Try again',
      severity: 'warning'
    };
  }

  /**
   * Generic error fallback
   */
  private static getGenericError(): UserFriendlyError {
    return {
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred. Please try again, and contact support if the problem persists.',
      action: 'Try again',
      severity: 'error'
    };
  }

  /**
   * Get error color based on severity
   */
  static getErrorColor(severity: 'error' | 'warning' | 'info'): string {
    switch (severity) {
      case 'error': return '#DC2626'; // Red
      case 'warning': return '#F59E0B'; // Orange
      case 'info': return '#3B82F6'; // Blue
      default: return '#DC2626';
    }
  }

  /**
   * Get error icon based on severity
   */
  static getErrorIcon(severity: 'error' | 'warning' | 'info'): string {
    switch (severity) {
      case 'error': return 'alert-circle';
      case 'warning': return 'warning';
      case 'info': return 'information-circle';
      default: return 'alert-circle';
    }
  }
}
