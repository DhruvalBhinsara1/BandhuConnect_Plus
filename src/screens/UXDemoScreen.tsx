/**
 * Enhanced UX Components Demo Screen
 * Showcases the new confirmation dialogs and action sheets
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useConfirmationDialog,
  useActionSheet,
  useToast,
} from '../components/ui';

const DESIGN_TOKENS = {
  colors: {
    background: '#FFFFFF',
    surface: '#F9FAFB',
    primary: '#3B82F6',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      inverse: '#FFFFFF'
    },
    border: '#E5E7EB'
  },
  spacing: {
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    md: 8,
    lg: 12,
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
  }
};

export const UXDemoScreen = () => {
  const { confirm, ConfirmationDialog } = useConfirmationDialog();
  const { show: showActionSheet, ActionSheet } = useActionSheet();
  const toast = useToast();

  const handleBasicConfirmation = async () => {
    const result = await confirm(
      'Basic Confirmation',
      'This is a basic confirmation dialog with default styling.',
      {
        confirmLabel: 'Yes, Continue',
        cancelLabel: 'Cancel'
      }
    );
    
    if (result) {
      toast.showSuccess('Confirmed!', 'You chose to continue.');
    }
  };

  const handleDangerConfirmation = async () => {
    const result = await confirm(
      'Delete Account',
      'This action cannot be undone. Your account and all associated data will be permanently deleted.',
      {
        confirmLabel: 'Delete Forever',
        cancelLabel: 'Keep Account',
        variant: 'danger',
        icon: 'trash'
      }
    );
    
    if (result) {
      toast.showError('Account Deleted', 'Your account has been permanently deleted.');
    }
  };

  const handleWarningConfirmation = async () => {
    const result = await confirm(
      'Sign Out All Devices',
      'This will sign you out from all devices including this one. You will need to sign in again.',
      {
        confirmLabel: 'Sign Out All',
        cancelLabel: 'Cancel',
        variant: 'warning',
        icon: 'log-out'
      }
    );
    
    if (result) {
      toast.showWarning('Signed Out', 'You have been signed out from all devices.');
    }
  };

  const handleSuccessConfirmation = async () => {
    const result = await confirm(
      'Backup Complete',
      'Your data has been successfully backed up to the cloud. Would you like to view the backup details?',
      {
        confirmLabel: 'View Details',
        cancelLabel: 'Done',
        variant: 'success',
        icon: 'checkmark-circle'
      }
    );
    
    if (result) {
      toast.showInfo('Details', 'Backup details would open here.');
    }
  };

  const handleBasicActionSheet = () => {
    showActionSheet({
      title: 'Choose an Action',
      subtitle: 'Select one of the options below',
      actions: [
        {
          label: 'Share',
          icon: 'share',
          onPress: () => toast.showInfo('Shared', 'Content shared successfully'),
        },
        {
          label: 'Edit',
          icon: 'create',
          variant: 'primary',
          onPress: () => toast.showInfo('Edit', 'Opening editor...'),
        },
        {
          label: 'Download',
          icon: 'download',
          onPress: () => toast.showSuccess('Downloaded', 'File downloaded to device'),
        },
        {
          label: 'Delete',
          icon: 'trash',
          variant: 'danger',
          onPress: () => toast.showError('Deleted', 'Item moved to trash'),
        },
      ],
    });
  };

  const handleProfileActionSheet = () => {
    showActionSheet({
      title: 'Profile Options',
      actions: [
        {
          label: 'View Profile',
          icon: 'person',
          subtitle: 'See your profile information',
          onPress: () => toast.showInfo('Profile', 'Opening profile view...'),
        },
        {
          label: 'Edit Profile',
          icon: 'create',
          subtitle: 'Update your personal information',
          variant: 'primary',
          onPress: () => toast.showInfo('Edit', 'Opening profile editor...'),
        },
        {
          label: 'Privacy Settings',
          icon: 'lock-closed',
          subtitle: 'Manage your privacy preferences',
          onPress: () => toast.showInfo('Privacy', 'Opening privacy settings...'),
        },
        {
          label: 'Export Data',
          icon: 'download',
          subtitle: 'Download a copy of your data',
          onPress: () => toast.showSuccess('Export', 'Data export started...'),
        },
        {
          label: 'Deactivate Account',
          icon: 'ban',
          subtitle: 'Temporarily disable your account',
          variant: 'warning',
          onPress: () => toast.showWarning('Deactivated', 'Account temporarily deactivated'),
        },
        {
          label: 'Delete Account',
          icon: 'trash',
          subtitle: 'Permanently delete your account',
          variant: 'danger',
          onPress: () => toast.showError('Deleted', 'Account deletion process started'),
        },
      ],
    });
  };

  const renderDemoSection = (
    title: string,
    description: string,
    children: React.ReactNode
  ) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDescription}>{description}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const renderButton = (
    label: string,
    onPress: () => void,
    variant: 'primary' | 'secondary' | 'danger' | 'warning' | 'success' = 'primary',
    icon?: string
  ) => {
    const buttonStyle = [
      styles.demoButton,
      variant === 'primary' && styles.primaryButton,
      variant === 'secondary' && styles.secondaryButton,
      variant === 'danger' && styles.dangerButton,
      variant === 'warning' && styles.warningButton,
      variant === 'success' && styles.successButton,
    ];

    const textStyle = [
      styles.buttonText,
      variant === 'secondary' && styles.secondaryButtonText,
    ];

    return (
      <TouchableOpacity style={buttonStyle} onPress={onPress}>
        {icon && (
          <Ionicons
            name={icon as any}
            size={20}
            color={variant === 'secondary' ? DESIGN_TOKENS.colors.text.primary : DESIGN_TOKENS.colors.text.inverse}
            style={styles.buttonIcon}
          />
        )}
        <Text style={textStyle}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Enhanced UX Components</Text>
          <Text style={styles.subtitle}>
            Professional confirmation dialogs and action sheets for better user experience
          </Text>
        </View>

        {renderDemoSection(
          'Confirmation Dialogs',
          'Replace Alert.alert with accessible, design-system compliant confirmation dialogs',
          <View style={styles.buttonGrid}>
            {renderButton('Basic Confirmation', handleBasicConfirmation, 'primary', 'help-circle')}
            {renderButton('Warning Action', handleWarningConfirmation, 'warning', 'warning')}
            {renderButton('Danger Action', handleDangerConfirmation, 'danger', 'trash')}
            {renderButton('Success Action', handleSuccessConfirmation, 'success', 'checkmark-circle')}
          </View>
        )}

        {renderDemoSection(
          'Action Sheets',
          'Context-aware bottom sheets for multiple action options',
          <View style={styles.buttonGrid}>
            {renderButton('Basic Actions', handleBasicActionSheet, 'primary', 'list')}
            {renderButton('Profile Actions', handleProfileActionSheet, 'secondary', 'person')}
          </View>
        )}

        {renderDemoSection(
          'Toast Notifications',
          'Non-intrusive feedback messages that complement the dialogs',
          <View style={styles.buttonGrid}>
            {renderButton('Success Toast', () => toast.showSuccess('Success!', 'Operation completed successfully'), 'success', 'checkmark')}
            {renderButton('Error Toast', () => toast.showError('Error!', 'Something went wrong'), 'danger', 'close-circle')}
            {renderButton('Warning Toast', () => toast.showWarning('Warning!', 'Please check your input'), 'warning', 'warning')}
            {renderButton('Info Toast', () => toast.showInfo('Info', 'Here is some useful information'), 'primary', 'information-circle')}
          </View>
        )}
      </ScrollView>

      <ConfirmationDialog />
      <ActionSheet />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_TOKENS.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: DESIGN_TOKENS.spacing.xl,
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_TOKENS.colors.border,
  },
  title: {
    ...DESIGN_TOKENS.typography.h1,
    color: DESIGN_TOKENS.colors.text.primary,
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  subtitle: {
    ...DESIGN_TOKENS.typography.body,
    color: DESIGN_TOKENS.colors.text.secondary,
    lineHeight: 24,
  },
  section: {
    padding: DESIGN_TOKENS.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_TOKENS.colors.border,
  },
  sectionTitle: {
    ...DESIGN_TOKENS.typography.h2,
    color: DESIGN_TOKENS.colors.text.primary,
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  sectionDescription: {
    ...DESIGN_TOKENS.typography.body,
    color: DESIGN_TOKENS.colors.text.secondary,
    marginBottom: DESIGN_TOKENS.spacing.lg,
    lineHeight: 24,
  },
  sectionContent: {
    gap: DESIGN_TOKENS.spacing.md,
  },
  buttonGrid: {
    gap: DESIGN_TOKENS.spacing.md,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DESIGN_TOKENS.spacing.md,
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    borderRadius: DESIGN_TOKENS.borderRadius.lg,
    minHeight: 48,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: DESIGN_TOKENS.colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
  },
  dangerButton: {
    backgroundColor: DESIGN_TOKENS.colors.danger,
  },
  warningButton: {
    backgroundColor: DESIGN_TOKENS.colors.warning,
  },
  successButton: {
    backgroundColor: DESIGN_TOKENS.colors.success,
  },
  buttonText: {
    ...DESIGN_TOKENS.typography.body,
    fontWeight: '600',
    color: DESIGN_TOKENS.colors.text.inverse,
  },
  secondaryButtonText: {
    color: DESIGN_TOKENS.colors.text.primary,
  },
  buttonIcon: {
    marginRight: 4,
  },
});
