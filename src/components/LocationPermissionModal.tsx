import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LocationPermissionModalProps {
  visible: boolean;
  onClose: () => void;
  onRequestPermission: () => Promise<void>;
  canRequestAgain: boolean;
}

export const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  visible,
  onClose,
  onRequestPermission,
  canRequestAgain
}) => {
  const handleOpenSettings = () => {
    Alert.alert(
      'Location Permission Required',
      'Please enable location permissions in your device settings to continue using location features.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Ionicons name="location" size={48} color="#FF6B6B" />
            <Text style={styles.title}>Location Access Needed</Text>
          </View>
          
          <Text style={styles.description}>
            BandhuConnect+ requires location access to:
          </Text>

          <View style={styles.features}>
            <View style={styles.feature}>
              <Ionicons name="people" size={20} color="#4ECDC4" />
              <Text style={styles.featureText}>Connect you with nearby volunteers</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="medical" size={20} color="#4ECDC4" />
              <Text style={styles.featureText}>Provide emergency assistance</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="navigate" size={20} color="#4ECDC4" />
              <Text style={styles.featureText}>Show your location on the map</Text>
            </View>
          </View>

          <View style={styles.buttons}>
            {canRequestAgain ? (
              <TouchableOpacity style={styles.primaryButton} onPress={onRequestPermission}>
                <Text style={styles.primaryButtonText}>Allow Location Access</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.settingsButton} onPress={handleOpenSettings}>
                <Text style={styles.settingsButtonText}>Open Settings</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Not Now</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.privacy}>
            Your location is only used for volunteer coordination and emergency services.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
    width: '90%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  features: {
    marginBottom: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  featureText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#444',
    flex: 1,
  },
  buttons: {
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  settingsButton: {
    backgroundColor: '#FF9500',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  privacy: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
