import { AppError, toAppError } from '../lib/errors';

export enum LocationErrorType {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  LOCATION_UNAVAILABLE = 'LOCATION_UNAVAILABLE',
  GPS_UNAVAILABLE = 'GPS_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN'
}

export interface LocationError {
  type: LocationErrorType;
  message: string;
  originalError?: any;
}

export interface ToastHandler {
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
}

export class LocationErrorHandler {
  static parseError(error: any): LocationError {
    if (!error) {
      return {
        type: LocationErrorType.UNKNOWN,
        message: 'Unknown location error',
      };
    }

    const errorMessage = error.message || error.toString();

    if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
      return {
        type: LocationErrorType.PERMISSION_DENIED,
        message: 'Location permission denied',
        originalError: error,
      };
    }

    if (errorMessage.includes('kCLErrorDomain error 0') || 
        errorMessage.includes('Cannot obtain current location') ||
        errorMessage.includes('GPS') ||
        errorMessage.includes('signal')) {
      return {
        type: LocationErrorType.GPS_UNAVAILABLE,
        message: 'GPS signal unavailable',
        originalError: error,
      };
    }

    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      return {
        type: LocationErrorType.TIMEOUT,
        message: 'Location request timed out',
        originalError: error,
      };
    }

    if (errorMessage.includes('unavailable') || errorMessage.includes('not available')) {
      return {
        type: LocationErrorType.LOCATION_UNAVAILABLE,
        message: 'Location services unavailable',
        originalError: error,
      };
    }

    if (errorMessage.includes('network')) {
      return {
        type: LocationErrorType.NETWORK_ERROR,
        message: 'Network error while getting location',
        originalError: error
      };
    }

    return {
      type: LocationErrorType.UNKNOWN,
      message: errorMessage,
      originalError: error
    };
  }

  static getUserFriendlyMessage(error: LocationError): string {
    switch (error.type) {
      case LocationErrorType.PERMISSION_DENIED:
        return 'Location permission denied';
      case LocationErrorType.GPS_UNAVAILABLE:
        return 'GPS signal unavailable';
      case LocationErrorType.TIMEOUT:
        return 'Location request timed out';
      case LocationErrorType.LOCATION_UNAVAILABLE:
        return 'Location services unavailable';
      case LocationErrorType.NETWORK_ERROR:
        return 'Network error while getting location';
      default:
        return error.message;
    }
  }

  static showUserFriendlyError(
    error: LocationError, 
    toast: ToastHandler,
    onRetry?: () => void
  ) {
    // Don't show notifications for Expo Go limitations or GPS unavailability
    if (error.message.includes('Expo Go') || 
        error.message.includes('NSLocation') ||
        error.type === LocationErrorType.GPS_UNAVAILABLE) {
      console.log('Silently handling location error:', error.message);
      return;
    }

    const message = this.getUserFriendlyMessage(error);
    
    if (error.type === LocationErrorType.PERMISSION_DENIED) {
      toast.showError('Location Permission Required', message);
    } else {
      toast.showWarning('Location Error', message);
    }

    // If retry is provided, show info about retry
    if (onRetry) {
      setTimeout(() => {
        toast.showWarning('Retry Available', 'Tap the location button to try again');
      }, 2000);
    }
  }

  static logError(error: LocationError, context: string) {
    console.error(`[LocationError] ${context}:`, {
      type: error.type,
      message: error.message,
      originalError: error.originalError
    });
  }
}
