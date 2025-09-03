import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LocationPermissionRequestProps {
  onRequestPermission: () => Promise<void>;
  permissionDenied?: boolean;
}

export const LocationPermissionRequest: React.FC<LocationPermissionRequestProps> = ({
  onRequestPermission,
  permissionDenied = false
}) => {
  const handleOpenSettings = () => {
    Alert.alert(
      'Location Permission Required',
      'Please enable location permissions in your device settings to use this feature.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="location-outline" size={64} color="#666" />
      </View>
      
      <Text style={styles.title}>Location Access Required</Text>
      
      <Text style={styles.description}>
        BandhuConnect+ needs location access to coordinate volunteer assistance and track your position for emergency services.
      </Text>

      <View style={styles.features}>
        <View style={styles.feature}>
          <Ionicons name="people-outline" size={20} color="#007AFF" />
          <Text style={styles.featureText}>Coordinate with nearby volunteers</Text>
        </View>
        <View style={styles.feature}>
          <Ionicons name="medical-outline" size={20} color="#007AFF" />
          <Text style={styles.featureText}>Emergency assistance tracking</Text>
        </View>
        <View style={styles.feature}>
          <Ionicons name="map-outline" size={20} color="#007AFF" />
          <Text style={styles.featureText}>Real-time location updates</Text>
        </View>
      </View>

      {!permissionDenied ? (
        <TouchableOpacity style={styles.primaryButton} onPress={onRequestPermission}>
          <Text style={styles.primaryButtonText}>Enable Location Access</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.settingsButton} onPress={handleOpenSettings}>
          <Text style={styles.settingsButtonText}>Open Settings</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.note}>
        Your location data is only used for volunteer coordination and is not shared with third parties.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
    lineHeight: 22,
  },
  features: {
    marginBottom: 32,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
  },
});
