import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { secureMapService, UserLocationData } from '../../services/secureMapService';
import { secureLocationService } from '../../services/secureLocationService';
import { APP_ROLE, getCurrentRoleConfig } from '../../constants/appRole';

interface TrackingState {
  isActive: boolean;
  hasPermissions: boolean;
  hasAssignment: boolean;
  counterpartName?: string;
}

export default function SecureMapScreen() {
  const mapRef = useRef<MapView>(null);
  const [locations, setLocations] = useState<UserLocationData[]>([]);
  const [trackingState, setTrackingState] = useState<TrackingState>({
    isActive: false,
    hasPermissions: false,
    hasAssignment: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const roleConfig = getCurrentRoleConfig();

  useEffect(() => {
    initializeMap();
    return () => {
      secureMapService.unsubscribeFromLocationUpdates();
      secureLocationService.stopTracking();
    };
  }, []);

  /**
   * Initialize map with location tracking and assignment check
   */
  const initializeMap = async () => {
    try {
      setIsLoading(true);

      // Check assignment status
      const assignmentStatus = await secureMapService.getAssignmentStatus();
      
      if (!assignmentStatus.hasAssignment) {
        setTrackingState(prev => ({
          ...prev,
          hasAssignment: false,
        }));
        setIsLoading(false);
        return;
      }

      // Initialize location tracking
      const trackingInitialized = await secureLocationService.initializeTracking();
      
      setTrackingState({
        isActive: trackingInitialized,
        hasPermissions: trackingInitialized,
        hasAssignment: assignmentStatus.hasAssignment,
        counterpartName: assignmentStatus.counterpartName,
      });

      if (trackingInitialized) {
        // Load initial locations
        await refreshLocations();

        // Subscribe to real-time updates
        secureMapService.subscribeToLocationUpdates((updatedLocations) => {
          setLocations(updatedLocations);
          setLastRefresh(new Date());
        });
      }

    } catch (error) {
      console.error('[SecureMapScreen] Initialization failed:', error);
      Alert.alert('Error', 'Failed to initialize location tracking');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh all location data
   */
  const refreshLocations = async () => {
    try {
      const updatedLocations = await secureMapService.refreshLocations();
      setLocations(updatedLocations);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('[SecureMapScreen] Failed to refresh locations:', error);
    }
  };

  /**
   * Center map on user's own location
   */
  const centerOnSelf = async () => {
    try {
      const ownLocationCenter = await secureMapService.getOwnLocationCenter();
      
      if (!ownLocationCenter) {
        Alert.alert('Location Unavailable', 'Your current location is not available');
        return;
      }

      mapRef.current?.animateToRegion(ownLocationCenter, 1000);
    } catch (error) {
      console.error('[SecureMapScreen] Failed to center on self:', error);
      Alert.alert('Error', 'Failed to get your location');
    }
  };

  /**
   * Fit all markers in frame
   */
  const fitAllMarkers = () => {
    if (locations.length === 0) {
      Alert.alert('No Locations', 'No location data available to display');
      return;
    }

    const bounds = secureMapService.calculateMapBounds(locations);
    if (bounds) {
      mapRef.current?.animateToRegion(bounds, 1000);
    }
  };

  /**
   * Get marker color and icon for user role
   */
  const getMarkerStyle = (role: string, isStale: boolean) => {
    const config = role === 'pilgrim' 
      ? { color: '#DC2626', icon: '🔴' }
      : { color: '#16A34A', icon: '🟢' };
    
    return {
      ...config,
      opacity: isStale ? 0.7 : 1.0
    };
  };

  /**
   * Format last seen time
   */
  const formatLastSeen = (minutesAgo: number): string => {
    if (minutesAgo < 1) return 'Just now';
    if (minutesAgo === 1) return '1 minute ago';
    if (minutesAgo < 60) return `${minutesAgo} minutes ago`;
    const hours = Math.floor(minutesAgo / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  /**
   * Render tracking status chip
   */
  const renderTrackingStatus = () => {
    if (!trackingState.hasAssignment) {
      return (
        <View style={[styles.statusChip, styles.noAssignmentChip]}>
          <Ionicons name="alert-circle" size={16} color="#F59E0B" />
          <Text style={styles.statusText}>No Assignment</Text>
        </View>
      );
    }

    if (!trackingState.hasPermissions) {
      return (
        <View style={[styles.statusChip, styles.errorChip]}>
          <Ionicons name="location-outline" size={16} color="#DC2626" />
          <Text style={styles.statusText}>Location Disabled</Text>
        </View>
      );
    }

    return (
      <View style={[styles.statusChip, styles.activeChip]}>
        <Ionicons name="radio" size={16} color="#16A34A" />
        <Text style={styles.statusText}>
          Tracking {trackingState.counterpartName}
        </Text>
      </View>
    );
  };

  /**
   * Render markers on map
   */
  const renderMarkers = () => {
    return locations.map((location) => {
      const markerStyle = getMarkerStyle(location.role, location.isStale);
      const isOwnLocation = location.role === APP_ROLE;

      return (
        <React.Fragment key={location.userId}>
          {/* Main marker */}
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={location.name}
            description={
              isOwnLocation 
                ? 'Your location'
                : location.isStale 
                  ? `Last seen ${formatLastSeen(location.minutesAgo)}`
                  : 'Live location'
            }
            pinColor={markerStyle.color}
            opacity={markerStyle.opacity}
          />

          {/* Accuracy circle for own location */}
          {isOwnLocation && location.accuracy && (
            <Circle
              center={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              radius={location.accuracy}
              fillColor={`${markerStyle.color}20`}
              strokeColor={markerStyle.color}
              strokeWidth={1}
            />
          )}
        </React.Fragment>
      );
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={roleConfig.primaryColor} />
        <Text style={styles.loadingText}>Initializing location tracking...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Status chip */}
      <View style={styles.statusContainer}>
        {renderTrackingStatus()}
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={false} // We handle our own markers
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        initialRegion={{
          latitude: 37.7749, // Default to San Francisco
          longitude: -122.4194,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {renderMarkers()}
      </MapView>

      {/* Control buttons */}
      <View style={styles.controlsContainer}>
        {/* Show Me button */}
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: roleConfig.primaryColor }]}
          onPress={centerOnSelf}
        >
          <Ionicons name="locate" size={24} color="white" />
        </TouchableOpacity>

        {/* Fit in Frame button */}
        <TouchableOpacity
          style={[styles.controlButton, styles.secondaryButton]}
          onPress={fitAllMarkers}
          disabled={locations.length === 0}
        >
          <Ionicons name="scan" size={24} color={locations.length > 0 ? "#374151" : "#9CA3AF"} />
        </TouchableOpacity>

        {/* Refresh button */}
        <TouchableOpacity
          style={[styles.controlButton, styles.secondaryButton]}
          onPress={refreshLocations}
        >
          <Ionicons name="refresh" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Location info panel */}
      {locations.length > 0 && (
        <View style={styles.infoPanel}>
          <Text style={styles.infoPanelTitle}>Location Status</Text>
          {locations.map((location) => (
            <View key={location.userId} style={styles.locationInfo}>
              <Text style={styles.locationRole}>
                {location.role === APP_ROLE ? 'You' : location.name}
              </Text>
              <Text style={styles.locationStatus}>
                {location.role === APP_ROLE 
                  ? 'Live tracking'
                  : location.isStale 
                    ? formatLastSeen(location.minutesAgo)
                    : 'Live location'
                }
              </Text>
            </View>
          ))}
          <Text style={styles.lastRefresh}>
            Last updated: {lastRefresh.toLocaleTimeString()}
          </Text>
        </View>
      )}

      {/* No assignment message */}
      {!trackingState.hasAssignment && (
        <View style={styles.noAssignmentContainer}>
          <Ionicons name="people-outline" size={48} color="#9CA3AF" />
          <Text style={styles.noAssignmentTitle}>No Active Assignment</Text>
          <Text style={styles.noAssignmentText}>
            You are not currently assigned to a {roleConfig.counterpartRole}.
            Contact an admin to get assigned.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  statusContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeChip: {
    backgroundColor: '#ECFDF5',
    borderColor: '#16A34A',
    borderWidth: 1,
  },
  errorChip: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
    borderWidth: 1,
  },
  noAssignmentChip: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
    borderWidth: 1,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  map: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 120,
    right: 16,
    zIndex: 1,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: 'white',
  },
  infoPanel: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 80,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1,
  },
  infoPanelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationRole: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  locationStatus: {
    fontSize: 12,
    color: '#6B7280',
  },
  lastRefresh: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  noAssignmentContainer: {
    position: 'absolute',
    top: '50%',
    left: 32,
    right: 32,
    transform: [{ translateY: -100 }],
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  noAssignmentTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  noAssignmentText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
