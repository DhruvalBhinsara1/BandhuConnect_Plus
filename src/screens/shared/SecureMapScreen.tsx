import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { secureMapService, UserLocationData } from '../../services/secureMapService';
import { secureLocationService } from '../../services/secureLocationService';
import { APP_ROLE, getCurrentRoleConfig } from '../../constants/appRole';
import { supabase } from '../../services/supabase';

interface TrackingState {
  isActive: boolean;
  hasPermissions: boolean;
  hasAssignment: boolean;
  assigned: boolean;
  counterpartName?: string;
  showCompletedStatus?: boolean;
}

export default function SecureMapScreen() {
  const mapRef = useRef<MapView>(null);
  const [locations, setLocations] = useState<UserLocationData[]>([]);
  const [trackingState, setTrackingState] = useState<TrackingState>({
    isActive: false,
    hasPermissions: false,
    hasAssignment: false,
    assigned: false,
    showCompletedStatus: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [userRole, setUserRole] = useState<string>('');
  const [currentAssignment, setCurrentAssignment] = useState<any>(null);
  const [counterpartLocation, setCounterpartLocation] = useState<any>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const roleConfig = getCurrentRoleConfig();

  useEffect(() => {
    initializeMap();
    initializeAssignmentTracking();
    
    // Handle app state changes for reconnection
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        console.log('[SecureMapScreen] App became active - refreshing subscriptions');
        // Re-initialize subscriptions when app becomes active
        setTimeout(() => {
          initializeAssignmentTracking();
          refreshLocations();
        }, 1000);
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
      secureMapService.cleanup();
      secureLocationService.stopTracking();
    };
  }, []);

  // State-driven subscription management
  useEffect(() => {
    if (currentAssignment?.assigned && currentAssignment?.isActive) {
      console.log(`[SecureMapScreen] Subscribing to counterpart ${currentAssignment.counterpartId} location`);
      // Subscribe to counterpart location when assigned and active
      secureMapService.subscribeToCounterpartLocation(
        currentAssignment.counterpartId,
        (location) => {
          console.log('[SecureMapScreen] Counterpart location update:', location);
          setCounterpartLocation(location);
          // Refresh all locations to update map
          refreshLocations();
        }
      );
    } else {
      console.log('[SecureMapScreen] Unsubscribing from counterpart location - not assigned or not active');
      // Unsubscribe and clear counterpart data when not assigned or not active
      secureMapService.unsubscribeFromCounterpartLocation();
      setCounterpartLocation(null);
      // Clear locations to show only own location
      refreshLocations();
    }

    return () => {
      secureMapService.unsubscribeFromCounterpartLocation();
    };
  }, [currentAssignment?.assigned, currentAssignment?.isActive, currentAssignment?.counterpartId]);

  const initializeAssignmentTracking = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile) return;
      setUserRole(profile.role);

      // Initial assignment fetch
      await refreshAssignmentStatus();

      // Subscribe to assignment changes with state-driven callback
      secureMapService.subscribeToAssignmentChanges((assignment) => {
        setCurrentAssignment(assignment);
        updateTrackingStateFromAssignment(assignment);
      });

      console.log(`[SecureMapScreen] Initialized assignment tracking for ${profile.role}`);
    } catch (error) {
      console.error('[SecureMapScreen] Failed to initialize assignment tracking:', error);
      // Show empty state on error
      setTrackingState(prev => ({ ...prev, hasAssignment: false, assigned: false }));
    }
  };

  const updateTrackingStateFromAssignment = (assignment: any) => {
    if (assignment?.assigned) {
      setTrackingState(prev => ({
        ...prev,
        hasAssignment: true,
        assigned: true,
        counterpartName: assignment.counterpartName,
        showCompletedStatus: false
      }));
    } else {
      setTrackingState(prev => ({
        ...prev,
        hasAssignment: false,
        assigned: false,
        counterpartName: undefined,
        showCompletedStatus: false
      }));
    }
  };

  const refreshAssignmentStatus = async () => {
    try {
      const assignment = await secureMapService.getMyAssignment();
      setCurrentAssignment(assignment);
      updateTrackingStateFromAssignment(assignment);
    } catch (error) {
      console.error('[SecureMapScreen] Failed to refresh assignment status:', error);
      setCurrentAssignment(null);
      updateTrackingStateFromAssignment(null);
    }
  };

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
          assigned: false,
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
        assigned: assignmentStatus.assigned,
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
      Alert.alert(
        'Initialization Error', 
        'Unable to initialize location tracking. Please check your permissions and try again.',
        [{ text: 'OK', style: 'default' }]
      );
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
   * Center map on user's own location with improved error handling
   */
  const centerOnSelf = async () => {
    try {
      const ownLocationCenter = await secureMapService.getOwnLocationCenter();
      
      if (!ownLocationCenter) {
        Alert.alert(
          'Location Unavailable', 
          'Your current location is not available. Please ensure location services are enabled and try again.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      mapRef.current?.animateToRegion(ownLocationCenter, 1000);
    } catch (error) {
      console.error('[SecureMapScreen] Failed to center on self:', error);
      Alert.alert(
        'Location Error', 
        'Unable to access your location. Please check your location permissions and try again.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  /**
   * Fit all markers in frame with improved error handling
   */
  const fitAllMarkers = () => {
    if (locations.length === 0) {
      Alert.alert(
        'No Locations Available', 
        'There are no location markers to display on the map.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    try {
      const bounds = secureMapService.calculateMapBounds(locations);
      if (bounds) {
        mapRef.current?.animateToRegion(bounds, 1000);
      } else {
        Alert.alert(
          'Map Error', 
          'Unable to calculate map bounds. Please try refreshing the locations.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('[SecureMapScreen] Failed to fit markers:', error);
      Alert.alert(
        'Map Error', 
        'Unable to adjust map view. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
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
   * Render tracking status chip - only show when assigned=true
   */
  const renderTrackingStatus = () => {
    const counterpartRole = roleConfig.counterpartRole;
    const isTracking = trackingState.isActive;
    const hasCounterpartLocation = counterpartLocation !== null;

    return (
      <Animated.View 
        style={[styles.trackingBanner, { opacity: fadeAnim }]}
      >
        <View style={styles.trackingContent}>
          <View style={styles.trackingInfo}>
            <Ionicons 
              name={hasCounterpartLocation ? "location" : "location-outline"} 
              size={20} 
              color={hasCounterpartLocation ? "#10B981" : "#6B7280"} 
            />
            <Text style={styles.trackingText}>
              {hasCounterpartLocation 
                ? `Tracking ${trackingState.counterpartName || counterpartRole}` 
                : `Connected to ${trackingState.counterpartName || counterpartRole}`
              }
            </Text>
          </View>
          <View style={[styles.statusIndicator, { 
            backgroundColor: hasCounterpartLocation ? '#10B981' : '#6B7280' 
          }]} />
        </View>
      </Animated.View>
    );
  };

  /**
   * Render map legend
   */
  const renderMapLegend = () => {
    if (locations.length === 0) return null;

    return (
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Map Legend</Text>
        {locations.map((location) => {
          const isOwn = location.role === APP_ROLE;
          const markerStyle = getMarkerStyle(location.role, location.isStale);
          
          return (
            <View key={location.userId} style={styles.legendItem}>
              <View style={[styles.legendMarker, { backgroundColor: markerStyle.color }]} />
              <Text style={styles.legendText}>
                {isOwn ? 'You' : `${location.name} (${location.role})`}
              </Text>
            </View>
          );
        })}
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
        {trackingState.hasAssignment && trackingState.assigned && renderTrackingStatus()}
      </View>

      {/* Map legend */}
      {renderMapLegend()}

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
          <Text style={styles.noAssignmentTitle}>
            {userRole === 'pilgrim' ? 'No active requests' : 'No Active Assignment'}
          </Text>
          <Text style={styles.noAssignmentText}>
            {userRole === 'pilgrim' 
              ? "There aren't any requests assigned right now. New requests will appear here."
              : `You are not currently assigned to a ${roleConfig.counterpartRole}. Contact an admin to get assigned.`
            }
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
  completedChip: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
    borderWidth: 1,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  legendContainer: {
    position: 'absolute',
    top: 120,
    left: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
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
  },
  trackingBanner: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trackingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  trackingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    lineHeight: 20,
  },
});
