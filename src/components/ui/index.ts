/**
 * UI Components Index for BandhuConnect+
 * Centralized exports for enhanced error handling, UX components, and theme-aware components
 */

// Core Error Handling
export { EnhancedErrorBoundary, ErrorBoundaryWrapper } from './EnhancedErrorBoundary';

// Confirmation and Action Components
export { ConfirmationDialog, useConfirmationDialog } from './ConfirmationDialog';
export type { ConfirmationDialogProps, ConfirmationAction, ConfirmationVariant } from './ConfirmationDialog';

export { ActionSheet, useActionSheet } from './ActionSheet';
export type { ActionSheetProps, ActionSheetAction } from './ActionSheet';

// Toast System (re-export existing)
export { ToastProvider, useToast, useErrorToast } from './Toast';
export type { ToastType, ToastConfig } from './Toast';

// Theme-Aware Components
export { 
  Button, 
  PrimaryButton, 
  SecondaryButton, 
  DangerButton, 
  OutlineButton 
} from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { 
  Input, 
  EmailInput, 
  PasswordInput, 
  SearchInput, 
  PhoneInput 
} from './Input';
export type { InputProps, InputVariant, InputSize } from './Input';
