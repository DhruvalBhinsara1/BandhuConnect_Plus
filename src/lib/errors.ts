/**
 * Central Error Model for BandhuConnect+ React Native App
 * Provides unified error handling patterns across the application
 */

export interface AppError {
  code?: string;
  message: string;
  cause?: unknown;
  status?: number;
  fieldErrors?: Record<string, string>;
  retryable?: boolean;
  correlationId?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  userFriendly?: boolean;
}

export enum ErrorCode {
  // Authentication
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  AUTH_PERMISSION_DENIED = 'AUTH_PERMISSION_DENIED',
  
  // Location
  LOCATION_PERMISSION_DENIED = 'LOCATION_PERMISSION_DENIED',
  LOCATION_UNAVAILABLE = 'LOCATION_UNAVAILABLE',
  LOCATION_TIMEOUT = 'LOCATION_TIMEOUT',
  
  // Network
  NETWORK_ERROR = 'NETWORK_ERROR',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_OFFLINE = 'NETWORK_OFFLINE',
  
  // Database
  DATABASE_CONSTRAINT_VIOLATION = 'DATABASE_CONSTRAINT_VIOLATION',
  DATABASE_RLS_VIOLATION = 'DATABASE_RLS_VIOLATION',
  DATABASE_QUERY_ERROR = 'DATABASE_QUERY_ERROR',
  
  // Assignment
  ASSIGNMENT_NOT_FOUND = 'ASSIGNMENT_NOT_FOUND',
  ASSIGNMENT_ALREADY_COMPLETED = 'ASSIGNMENT_ALREADY_COMPLETED',
  ASSIGNMENT_PERMISSION_DENIED = 'ASSIGNMENT_PERMISSION_DENIED',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  FORM_VALIDATION_ERROR = 'FORM_VALIDATION_ERROR',
  
  // General
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  SERVER_ERROR = 'SERVER_ERROR'
}

/**
 * Convert any error into standardized AppError format
 */
export function toAppError(error: unknown, context?: string): AppError {
  const correlationId = generateCorrelationId();
  
  // Already an AppError
  if (isAppError(error)) {
    return { ...error, correlationId };
  }

  // Standard Error object
  if (error instanceof Error) {
    // Supabase errors
    if (error.message?.includes('Invalid login credentials')) {
      return {
        code: ErrorCode.AUTH_INVALID_CREDENTIALS,
        message: 'Invalid email or password. Please check your credentials.',
        cause: error,
        status: 401,
        retryable: false,
        correlationId,
        severity: 'medium',
        userFriendly: true
      };
    }

    if (error.message?.includes('permission') || error.message?.includes('denied')) {
      return {
        code: ErrorCode.LOCATION_PERMISSION_DENIED,
        message: 'Location permission is required for this feature.',
        cause: error,
        retryable: true,
        correlationId,
        severity: 'medium',
        userFriendly: true
      };
    }

    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return {
        code: ErrorCode.NETWORK_ERROR,
        message: 'Network connection issue. Please check your internet connection.',
        cause: error,
        retryable: true,
        correlationId,
        severity: 'medium',
        userFriendly: true
      };
    }

    // Generic error
    return {
      code: ErrorCode.UNKNOWN_ERROR,
      message: error.message || 'An unexpected error occurred',
      cause: error,
      retryable: false,
      correlationId,
      severity: 'medium',
      userFriendly: false
    };
  }

  // HTTP-like error (Supabase format)
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as any;
    
    if (errorObj.error && errorObj.status) {
      return {
        code: mapHttpStatusToCode(errorObj.status),
        message: errorObj.error.message || errorObj.message || 'Server error occurred',
        cause: error,
        status: errorObj.status,
        retryable: errorObj.status >= 500,
        correlationId,
        severity: errorObj.status >= 500 ? 'high' : 'medium',
        userFriendly: true
      };
    }

    // Validation errors (Zod-like)
    if (errorObj.issues || errorObj.fieldErrors) {
      const fieldErrors: Record<string, string> = {};
      
      if (errorObj.issues) {
        errorObj.issues.forEach((issue: any) => {
          const field = issue.path?.join('.') || 'unknown';
          fieldErrors[field] = issue.message;
        });
      } else if (errorObj.fieldErrors) {
        Object.assign(fieldErrors, errorObj.fieldErrors);
      }

      return {
        code: ErrorCode.FORM_VALIDATION_ERROR,
        message: 'Please check the form for errors',
        fieldErrors,
        cause: error,
        retryable: false,
        correlationId,
        severity: 'low',
        userFriendly: true
      };
    }
  }

  // String error
  if (typeof error === 'string') {
    return {
      code: ErrorCode.UNKNOWN_ERROR,
      message: error,
      retryable: false,
      correlationId,
      severity: 'medium',
      userFriendly: true
    };
  }

  // Fallback
  return {
    code: ErrorCode.UNKNOWN_ERROR,
    message: 'An unexpected error occurred',
    cause: error,
    retryable: false,
    correlationId,
    severity: 'medium',
    userFriendly: false
  };
}

/**
 * Check if error is retryable
 */
export function isRetryable(error: AppError): boolean {
  return error.retryable === true;
}

/**
 * Get user-friendly message for display
 */
export function getUserFriendlyMessage(error: AppError): string {
  if (error.userFriendly && error.message) {
    return error.message;
  }

  // Fallback messages based on code
  switch (error.code) {
    case ErrorCode.AUTH_INVALID_CREDENTIALS:
      return 'Invalid email or password. Please try again.';
    case ErrorCode.LOCATION_PERMISSION_DENIED:
      return 'Location permission is required. Please enable it in settings.';
    case ErrorCode.NETWORK_ERROR:
      return 'Connection issue. Please check your internet.';
    case ErrorCode.DATABASE_QUERY_ERROR:
      return 'Unable to load data. Please try again.';
    case ErrorCode.ASSIGNMENT_NOT_FOUND:
      return 'Assignment not found or no longer available.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

/**
 * Get technical details for logging/debugging
 */
export function getTechnicalDetails(error: AppError): string {
  return JSON.stringify({
    code: error.code,
    message: error.message,
    status: error.status,
    correlationId: error.correlationId,
    severity: error.severity,
    cause: error.cause instanceof Error ? error.cause.message : error.cause
  }, null, 2);
}

// Helper functions
function isAppError(error: unknown): error is AppError {
  return typeof error === 'object' && 
         error !== null && 
         typeof (error as AppError).message === 'string';
}

function mapHttpStatusToCode(status: number): ErrorCode {
  switch (status) {
    case 401:
      return ErrorCode.AUTH_INVALID_CREDENTIALS;
    case 403:
      return ErrorCode.AUTH_PERMISSION_DENIED;
    case 404:
      return ErrorCode.ASSIGNMENT_NOT_FOUND;
    case 422:
      return ErrorCode.VALIDATION_ERROR;
    case 429:
      return ErrorCode.NETWORK_ERROR;
    case 500:
    case 502:
    case 503:
    case 504:
      return ErrorCode.SERVER_ERROR;
    default:
      return ErrorCode.UNKNOWN_ERROR;
  }
}

function generateCorrelationId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Export types for validation errors
export interface ValidationFieldError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationFieldError[];
}

/**
 * Create a validation error from field errors
 */
export function createValidationError(
  fieldErrors: Record<string, string>,
  message = 'Please correct the highlighted fields'
): AppError {
  return {
    code: ErrorCode.FORM_VALIDATION_ERROR,
    message,
    fieldErrors,
    retryable: false,
    correlationId: generateCorrelationId(),
    severity: 'low',
    userFriendly: true
  };
}
