import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getCurrentRoleConfig } from '../constants/appRole';

interface PermissionState {
  foreground: 'granted' | 'denied' | 'undetermined';
  background: 'granted' | 'denied' | 'undetermined';
  hasAskedBefore: boolean;
  shouldShowRationale: boolean;
}

interface PermissionManagerProps {
  onPermissionGranted: () => void;
  onPermissionDenied: () => void;
}

export default function PermissionManager({ 
  onPermissionGranted, 
  onPermissionDenied 
}: PermissionManagerProps) {
  const [permissionState, setPermissionState] = useState<PermissionState>({
    foreground: 'undetermined',
    background: 'undetermined',
    hasAskedBefore: false,
    shouldShowRationale: false,
  });
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'initial' | 'rationale' | 'settings'>('initial');

  const roleConfig = getCurrentRoleConfig();

  useEffect(() => {
    checkInitialPermissions();
  }, []);

  /**
   * Check current permission status
   */
  const checkInitialPermissions = async () => {
    try {
      const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
      const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();

      const newState: PermissionState = {
        foreground: foregroundStatus,
        background: backgroundStatus,
        hasAskedBefore: foregroundStatus !== 'undetermined',
        shouldShowRationale: false,
      };

      setPermissionState(newState);

      // Handle permission states
      if (foregroundStatus === 'granted') {
        onPermissionGranted();
      } else if (foregroundStatus === 'denied' && !newState.hasAskedBefore) {
        // First time - show explanation modal
        setModalType('initial');
        setShowModal(true);
      } else if (foregroundStatus === 'denied') {
        // Previously denied - show rationale or settings
        setModalType('rationale');
        setShowModal(true);
      }

    } catch (error) {
      console.error('[PermissionManager] Failed to check permissions:', error);
      onPermissionDenied();
    }
  };

  /**
   * Request foreground location permission
   */
  const requestForegroundPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      setPermissionState(prev => ({
        ...prev,
        foreground: status,
        hasAskedBefore: true,
      }));

      if (status === 'granted') {
        setShowModal(false);
        onPermissionGranted();
      } else {
        // Permission denied - show settings modal
        setModalType('settings');
      }

    } catch (error) {
      console.error('[PermissionManager] Failed to request permission:', error);
      onPermissionDenied();
    }
  };

  /**
   * Open device settings
   */
  const openSettings = () => {
    setShowModal(false);
    Alert.alert(
      'Location Settings',
      'Please enable location permissions in your device settings to use this app.',
      [
        { text: 'Cancel', style: 'cancel', onPress: onPermissionDenied },
        { 
          text: 'Open Settings', 
          onPress: () => {
            // Note: Expo doesn't have direct settings opening
            // This would need platform-specific implementation
            onPermissionDenied();
          }
        },
      ]
    );
  };

  /**
   * Render permission explanation modal
   */
  const renderModal = () => {
    const getModalContent = () => {
      switch (modalType) {
        case 'initial':
          return {
            title: 'Location Permission Required',
            message: `${roleConfig.appName} needs access to your location to enable safety tracking and coordination between ${roleConfig.counterpartRole}s and ${roleConfig.description.toLowerCase()}s.`,
            primaryButton: 'Allow Location',
            primaryAction: requestForegroundPermission,
            secondaryButton: 'Not Now',
            secondaryAction: () => {
              setShowModal(false);
              onPermissionDenied();
            },
          };

        case 'rationale':
          return {
            title: 'Location Access Needed',
            message: `This app requires precise location access to:\n\n• Help your ${roleConfig.counterpartRole} find you during emergencies\n• Enable real-time safety coordination\n• Provide accurate location sharing\n\nYour location is only shared with your assigned ${roleConfig.counterpartRole}.`,
            primaryButton: 'Grant Permission',
            primaryAction: requestForegroundPermission,
            secondaryButton: 'Open Settings',
            secondaryAction: openSettings,
          };

        case 'settings':
          return {
            title: 'Enable in Settings',
            message: `Location permission was denied. To use this app, please:\n\n1. Open device Settings\n2. Find ${roleConfig.appName}\n3. Enable Location permissions\n4. Return to the app`,
            primaryButton: 'Open Settings',
            primaryAction: openSettings,
            secondaryButton: 'Cancel',
            secondaryAction: () => {
              setShowModal(false);
              onPermissionDenied();
            },
          };

        default:
          return null;
      }
    };

    const content = getModalContent();
    if (!content) return null;

    return (
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIcon}>
              <Ionicons 
                name="location" 
                size={48} 
                color={roleConfig.primaryColor} 
              />
            </View>

            <Text style={styles.modalTitle}>{content.title}</Text>
            <Text style={styles.modalMessage}>{content.message}</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton, { backgroundColor: roleConfig.primaryColor }]}
                onPress={content.primaryAction}
              >
                <Text style={styles.primaryButtonText}>{content.primaryButton}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={content.secondaryAction}
              >
                <Text style={styles.secondaryButtonText}>{content.secondaryButton}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  /**
   * Render permission status chip for granted state
   */
  const renderPermissionChip = () => {
    if (permissionState.foreground !== 'granted') return null;

    return (
      <View style={styles.permissionChip}>
        <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
        <Text style={styles.permissionText}>Location Enabled</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderPermissionChip()}
      {renderModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  permissionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ECFDF5',
    borderColor: '#16A34A',
    borderWidth: 1,
    borderRadius: 16,
    marginTop: 60,
  },
  permissionText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: {
    width: '100%',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    // backgroundColor set dynamically
  },
  secondaryButton: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
    borderWidth: 1,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
});
