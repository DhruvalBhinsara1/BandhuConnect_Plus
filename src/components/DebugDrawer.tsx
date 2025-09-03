import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { useMap } from '../context/MapContext';
import { APP_CONFIG, getUserRole } from '../constants/appConfig';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

interface DebugDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export const DebugDrawer: React.FC<DebugDrawerProps> = ({ visible, onClose }) => {
  const { currentLocation, permissions, isTracking, isBackgroundTracking } = useLocation();
  const { user } = useAuth();
  const { userLocations } = useMap();
  const [gpsEnabled, setGpsEnabled] = useState<boolean | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    const checkGPS = async () => {
      try {
        const enabled = await Location.hasServicesEnabledAsync();
        setGpsEnabled(enabled);
      } catch (error) {
        setGpsEnabled(false);
        setLastError(error instanceof Error ? error.message : 'Unknown GPS error');
      }
    };

    if (visible) {
      checkGPS();
    }
  }, [visible]);

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString();
  };

  const getPermissionStatus = () => {
    if (!permissions) return 'Not checked';
    
    const status = [];
    if (permissions.foreground) status.push('Foreground ✓');
    if (permissions.background) status.push('Background ✓');
    if (permissions.dontAskAgain) status.push('Don\'t ask again');
    if (permissions.highestAvailable) status.push('Highest available ✓');
    
    return status.length > 0 ? status.join(', ') : 'No permissions';
  };

  const getCounterpartData = () => {
    const userRole = getUserRole();
    const counterpartRole = userRole === 'pilgrim' ? 'volunteer' : 'pilgrim';
    
    const counterparts = userLocations.filter(loc => 
      loc.user_role === counterpartRole && 
      !loc.isPlaceholder
    );
    
    return counterparts;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Debug Information</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* App Configuration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Configuration</Text>
            <Text style={styles.debugText}>Role: {APP_CONFIG.ROLE}</Text>
            <Text style={styles.debugText}>App Name: {APP_CONFIG.APP_NAME}</Text>
            <Text style={styles.debugText}>Version: {APP_CONFIG.VERSION}</Text>
            <Text style={styles.debugText}>Build Type: {APP_CONFIG.BUILD_TYPE}</Text>
            <Text style={styles.debugText}>Platform: {Platform.OS}</Text>
          </View>

          {/* User Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Information</Text>
            <Text style={styles.debugText}>User ID: {user?.id || 'Not logged in'}</Text>
            <Text style={styles.debugText}>Email: {user?.email || 'N/A'}</Text>
            <Text style={styles.debugText}>Database Role: {user?.role || 'N/A'}</Text>
            <Text style={styles.debugText}>Hardcoded Role: {getUserRole()}</Text>
          </View>

          {/* Permission States */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Permission States</Text>
            <Text style={styles.debugText}>Status: {getPermissionStatus()}</Text>
            <Text style={styles.debugText}>GPS Enabled: {gpsEnabled === null ? 'Checking...' : gpsEnabled ? 'Yes' : 'No'}</Text>
            {permissions?.error && (
              <Text style={styles.errorText}>Error: {permissions.error}</Text>
            )}
          </View>

          {/* Location Tracking */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location Tracking</Text>
            <Text style={styles.debugText}>Foreground Tracking: {isTracking ? 'Active' : 'Inactive'}</Text>
            <Text style={styles.debugText}>Background Tracking: {isBackgroundTracking ? 'Active' : 'Inactive'}</Text>
            <Text style={styles.debugText}>Current Location: {currentLocation ? 'Available' : 'None'}</Text>
            {currentLocation && (
              <>
                <Text style={styles.debugText}>Lat: {currentLocation.latitude.toFixed(6)}</Text>
                <Text style={styles.debugText}>Lng: {currentLocation.longitude.toFixed(6)}</Text>
                <Text style={styles.debugText}>Accuracy: {currentLocation.accuracy?.toFixed(1)}m</Text>
                <Text style={styles.debugText}>Last Update: {formatTimestamp(currentLocation.timestamp)}</Text>
              </>
            )}
          </View>

          {/* Publishing Strategy */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Publishing Strategy</Text>
            <Text style={styles.debugText}>Interval: {APP_CONFIG.LOCATION_PUBLISH_INTERVAL / 1000}s</Text>
            <Text style={styles.debugText}>Distance: {APP_CONFIG.LOCATION_PUBLISH_DISTANCE}m</Text>
            <Text style={styles.debugText}>Stale Threshold: {APP_CONFIG.STALE_LOCATION_THRESHOLD / 60000} min</Text>
          </View>

          {/* Counterpart Data */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Counterpart Data</Text>
            {getCounterpartData().map((counterpart, index) => {
              const isStale = (Date.now() - new Date(counterpart.last_updated).getTime()) > APP_CONFIG.STALE_LOCATION_THRESHOLD;
              const minutesAgo = Math.floor((Date.now() - new Date(counterpart.last_updated).getTime()) / 60000);
              
              return (
                <View key={counterpart.user_id} style={styles.counterpartItem}>
                  <Text style={styles.debugText}>
                    {counterpart.user_role}: {counterpart.user_name}
                  </Text>
                  <Text style={styles.debugText}>
                    Status: {isStale ? `Stale (${minutesAgo}m ago)` : 'Fresh'}
                  </Text>
                  <Text style={styles.debugText}>
                    Location: {counterpart.latitude.toFixed(6)}, {counterpart.longitude.toFixed(6)}
                  </Text>
                </View>
              );
            })}
            {getCounterpartData().length === 0 && (
              <Text style={styles.debugText}>No counterpart data available</Text>
            )}
          </View>

          {/* All User Locations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All User Locations ({userLocations.length})</Text>
            <Text style={styles.debugText}>Real: {userLocations.filter(l => !l.isPlaceholder).length}</Text>
            <Text style={styles.debugText}>Placeholder: {userLocations.filter(l => l.isPlaceholder).length}</Text>
            <Text style={styles.debugText}>Pilgrims: {userLocations.filter(l => l.user_role === 'pilgrim').length}</Text>
            <Text style={styles.debugText}>Volunteers: {userLocations.filter(l => l.user_role === 'volunteer').length}</Text>
            <Text style={styles.debugText}>Admins: {userLocations.filter(l => l.user_role === 'admin').length}</Text>
          </View>

          {/* Last Error */}
          {lastError && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Last Error</Text>
              <Text style={styles.errorText}>{lastError}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
    paddingBottom: 8,
  },
  debugText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  errorText: {
    fontSize: 14,
    color: '#dc3545',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  counterpartItem: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
});
