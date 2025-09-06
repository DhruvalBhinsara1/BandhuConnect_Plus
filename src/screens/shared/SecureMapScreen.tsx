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
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker, Circle } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { secureMapService, UserLocationData } from '../../services/secureMapService';
import { secureLocationService } from '../../services/secureLocationService';
import { APP_ROLE, getCurrentRoleConfig } from '../../constants/appRole';
import { supabase } from '../../services/supabase';
import { AuthDebugger } from '../../components/AuthDebugger';

interface TrackingState {
  isActive: boolean;
  hasPermissions: boolean;
  hasAssignment: boolean;
  assigned: boolean;
  counterpartName?: string;
  showCompletedStatus?: boolean;
}

export default function SecureMapScreen() {
  const navigation = useNavigation();
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentAssignment, setCurrentAssignment] = useState<any>(null);
  const [counterpartLocation, setCounterpartLocation] = useState<any>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const roleConfig = getCurrentRoleConfig();

  useEffect(() => {
    initializeMap();
    initializeAssignmentTracking();
    fetchCurrentUserId();
    
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
    const hasValidAssignment = currentAssignment?.assigned && 
      currentAssignment?.isActive && 
      currentAssignment?.counterpartId && 
      currentAssignment?.assignmentId;
    
    if (hasValidAssignment) {
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
      console.log('[SecureMapScreen] Unsubscribing from counterpart location - incomplete assignment data:', {
        assigned: currentAssignment?.assigned,
        isActive: currentAssignment?.isActive,
        counterpartId: currentAssignment?.counterpartId,
        assignmentId: currentAssignment?.assignmentId
      });
      // Unsubscribe and clear counterpart data when not assigned or not active
      secureMapService.unsubscribeFromCounterpartLocation();
      setCounterpartLocation(null);
      // Clear locations to show only own location
      refreshLocations();
    }

    return () => {
      secureMapService.unsubscribeFromCounterpartLocation();
    };
  }, [currentAssignment?.assigned, currentAssignment?.isActive, currentAssignment?.counterpartId, currentAssignment?.assignmentId]);

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

  const updateTrackingStateFromAssignment = async (assignment: any) => {
    // Use centralized assignment detection logic
    const { hasActiveAssignment } = await import('../../services/assignmentService');
    const { data: { user } } = await supabase.auth.getUser();
    
    let hasValidAssignment = false;
    
    if (user?.id) {
      // Check if user has any active assignment using centralized logic
      hasValidAssignment = await hasActiveAssignment(user.id);
    }
    
    // Validate assignment completeness
    const isCompleteAssignment = assignment && 
      assignment.isActive && 
      assignment.assigned && 
      assignment.counterpartId && 
      assignment.assignmentId;
    
    console.log('[SecureMapScreen] Assignment validation:', {
      hasAssignment: !!assignment,
      isActive: assignment?.isActive,
      assigned: assignment?.assigned,
      hasValidAssignment,
      isCompleteAssignment,
      counterpartId: assignment?.counterpartId,
      assignmentId: assignment?.assignmentId,
      userId: user?.id
    });
    
    if (hasValidAssignment && isCompleteAssignment) {
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

  const fetchCurrentUserId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        console.log('[SecureMapScreen] Current user ID:', user.id);
      }
    } catch (error) {
      console.error('[SecureMapScreen] Failed to get current user ID:', error);
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

      // Always initialize location tracking first (for own location)
      const trackingInitialized = await secureLocationService.initializeTracking();
      
      // Check assignment status
      const assignmentStatus = await secureMapService.getAssignmentStatus();
      
      setTrackingState({
        isActive: trackingInitialized,
        hasPermissions: trackingInitialized,
        hasAssignment: assignmentStatus.hasAssignment,
        assigned: assignmentStatus.assigned,
        counterpartName: assignmentStatus.counterpartName,
      });

      if (trackingInitialized) {
        // Load initial locations (always includes own location)
        await refreshLocations();

        // Subscribe to real-time updates
        secureMapService.subscribeToLocationUpdates((updatedLocations) => {
          setLocations(updatedLocations);
          setLastRefresh(new Date());
        });
      }

    } catch (error) {
      console.error('[SecureMapScreen] Initialization failed:', error);
      // Silently handle initialization errors to prevent UI disruption
      // The app will continue to function with limited features
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
      
      // Auto-center on user's location if this is the first load and we have locations
      if (updatedLocations.length > 0 && mapRef.current) {
        const ownLocation = updatedLocations.find(loc => loc.role === APP_ROLE);
        if (ownLocation) {
          mapRef.current.animateToRegion({
            latitude: ownLocation.latitude,
            longitude: ownLocation.longitude,
            latitudeDelta: 0.008, // Match the initial zoom level
            longitudeDelta: 0.008, // Match the initial zoom level
          }, 1000);
        }
      }
    } catch (error) {
      console.error('[SecureMapScreen] Failed to refresh locations:', error);
    }
  };

  /**
   * Handle request input tap - navigate to requests tab
   */
  const handleRequestTap = () => {
    // Navigate to the requests tab based on user role
    if (APP_ROLE === 'pilgrim') {
      // For pilgrims, go to the requests/create request screen
      navigation.navigate('Requests' as never);
    } else if (APP_ROLE === 'volunteer') {
      // For volunteers, go to tasks screen
      navigation.navigate('Tasks' as never);
    } else if (APP_ROLE === 'admin') {
      // For admins, go to requests management
      navigation.navigate('Requests' as never);
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
          // Check if this location belongs to the current authenticated user
          const isOwn = location.userId === currentUserId;
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
      const isOwnLocation = location.userId === currentUserId;

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
      {/* Clean Compact Header */}
      <View style={styles.cleanHeader}>
        <Text style={styles.headerTitle}>Live Map</Text>
        <View style={styles.headerRight}>
          <View style={styles.usersBadge}>
            <Text style={styles.usersText}>{locations.length} online</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, { 
              backgroundColor: trackingState.isActive ? '#10B981' : '#EF4444' 
            }]} />
            <Text style={styles.statusText}>
              {trackingState.isActive ? 'Active' : 'Off'}
            </Text>
          </View>
        </View>
      </View>

      {/* Request Status Input Bar */}
      <View style={styles.requestInputBar}>
        <TouchableOpacity 
          style={styles.requestInputField}
          onPress={handleRequestTap}
          activeOpacity={0.7}
        >
          <Ionicons name="search-outline" size={16} color="#3B82F6" />
          <Text style={[
            styles.requestInputText,
            (!trackingState.hasAssignment || !trackingState.assigned) && styles.placeholderText
          ]}>
            {trackingState.hasAssignment && trackingState.assigned 
              ? 'Active request in progress' 
              : 'Tap to create new request'
            }
          </Text>
          {!trackingState.hasAssignment && (
            <Ionicons name="add-circle-outline" size={16} color="#10B981" />
          )}
        </TouchableOpacity>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={false} // We handle our own markers
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        initialRegion={{
          latitude: 22.2924, // Default to Vadodara, Gujarat (closer to user's location)
          longitude: 73.3627,
          latitudeDelta: 0.008, // More zoomed in for better neighborhood view
          longitudeDelta: 0.008, // More zoomed in for better neighborhood view
        }}
      >
        {renderMarkers()}
      </MapView>

      {/* Subtle Legend - only show when there are multiple users */}
      {locations.length > 1 && (
        <View style={styles.subtleLegend}>
          {locations.slice(0, 2).map((location) => { // Show max 2 users
            const markerStyle = getMarkerStyle(location.role, location.isStale);
            return (
              <View key={location.userId} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: markerStyle.color }]} />
                <Text style={styles.legendText} numberOfLines={1}>
                  {location.role === APP_ROLE ? 'You' : location.name?.split(' ')[0] || 'User'}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Compact Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={centerOnSelf}
        >
          <Ionicons name="locate" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={locations.length > 0 ? styles.expandButton : styles.controlButton}
          onPress={fitAllMarkers}
          disabled={locations.length === 0}
        >
          <Ionicons name="scan" size={18} color={locations.length > 0 ? "#FFFFFF" : "#9CA3AF"} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refreshLocations}
        >
          <Ionicons name="refresh" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Subtle Location Status */}
      {locations.length > 0 && (
        <View style={styles.subtleBottomSheet}>
          <Text style={styles.bottomSheetTitle}>Location Status</Text>
          {locations.slice(0, 2).map((location) => ( // Show max 2 for cleaner UI
            <View key={location.userId} style={styles.locationDetails}>
              <View style={styles.locationRow}>
                <View style={styles.locationIcon}>
                  <Ionicons 
                    name={location.role === APP_ROLE ? "person" : "location"} 
                    size={14} 
                    color={location.role === APP_ROLE ? roleConfig.primaryColor : roleConfig.counterpartColor} 
                  />
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>
                    {location.role === APP_ROLE ? 'You' : location.name}
                  </Text>
                  <Text style={styles.locationValue}>
                    {location.role === APP_ROLE 
                      ? 'Live tracking'
                      : location.isStale 
                        ? formatLastSeen(location.minutesAgo)
                        : 'Live location'
                    }
                  </Text>
                </View>
              </View>
            </View>
          ))}
          {locations.length > 2 && (
            <Text style={styles.moreLocationsText}>+{locations.length - 2} more users</Text>
          )}
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
  header: {
    position: 'absolute',
    top: 44, // Status bar height
    left: 16,
    right: 16,
    backgroundColor: '#1F2937', // Dark gray background for better contrast
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF', // White text on blue background
    marginBottom: 0,
    flexShrink: 1, // Allow title to shrink on smaller screens
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#34D399', // Brighter green
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  legendCard: {
    position: 'absolute',
    top: 140,
    left: 16,
    right: 80,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 5,
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
    marginLeft: 6,
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
  },
  legendContainer: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 80,
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
  legendMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
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
  primaryButton: {
    backgroundColor: '#2563EB',
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
    zIndex: 2,
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
    bottom: 100, // Move to bottom instead of center
    left: 16,
    right: 16,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20, // Reduced padding for smaller footprint
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 3, // Ensure it's above map but below controls
  },
  noAssignmentTitle: {
    fontSize: 18, // Slightly smaller
    fontWeight: '600',
    color: '#374151',
    marginTop: 12, // Reduced margin
    marginBottom: 6, // Reduced margin
  },
  noAssignmentText: {
    fontSize: 13, // Slightly smaller
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
  // New styles for improved layout
  floatingControls: {
    position: 'absolute',
    bottom: 120,
    right: 16,
    zIndex: 6,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 88, // Leave space for control buttons
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 7,
    maxHeight: 200, // Prevent it from taking too much space
  },
  bottomSheetHeader: {
    marginBottom: 16,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  locationDetails: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  locationValue: {
    fontSize: 12,
    color: '#6B7280',
  },
  lastUpdateText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noAssignmentToast: {
    position: 'absolute',
    top: 110, // Just below the new compact header
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 3,
    minWidth: 100,
    maxWidth: 120,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastIcon: {
    marginRight: 3,
  },
  toastText: {
    fontSize: 10,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
  // Material Design styles
  appBar: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  requestStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  trackingStatusChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  rightControlStack: {
    position: 'absolute',
    top: 120, // Below the compact header
    right: 16,
    zIndex: 8,
  },
  primaryLocationButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  controlSecondaryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestStatusText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    marginLeft: 6,
  },
  statsText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  headerStatsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  // Clean Header Styles
  cleanHeader: {
    backgroundColor: '#2563EB', // Blue background for better branding
    paddingHorizontal: '5%', // Responsive horizontal padding
    paddingVertical: 12,
    paddingTop: 48, // Account for status bar on most devices
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1D4ED8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
    minHeight: 80, // Ensure minimum height on smaller screens
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0, // Prevent shrinking on smaller screens
    maxWidth: '60%', // Limit width on small screens
  },
  usersBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 50, // Ensure minimum readable width
  },
  usersText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 50, // Ensure minimum readable width
  },
  
  // Request Input Bar Styles
  requestInputBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: '5%', // Responsive padding
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: '#E2E8F0',
    zIndex: 9,
    // Add subtle gradient effect with shadow
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  requestInputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    minHeight: 44, // Ensure good touch target on all devices
    // Add subtle interaction feedback with color accent
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  requestInputText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
    minHeight: 20, // Ensure consistent height
  },
  placeholderText: {
    color: '#9CA3AF', // Lighter color for placeholder-like appearance
    fontStyle: 'italic',
  },

  // Compact Map Controls
  mapControls: {
    position: 'absolute',
    top: '25%', // Responsive positioning using percentage
    right: 16,
    gap: 8,
    zIndex: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 40, // Ensure minimum touch target
    minHeight: 40, // Ensure minimum touch target
  },
  // New specific button styles for different actions
  myLocationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6', // Blue for location
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 40,
    minHeight: 40,
  },
  expandButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981', // Green for expand/fullscreen
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 40,
    minHeight: 40,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F59E0B', // Orange for refresh
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 40,
    minHeight: 40,
  },

  // Subtle Legend
  subtleLegend: {
    position: 'absolute',
    top: '20%', // Responsive positioning
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 6,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    zIndex: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    maxWidth: '30%', // Responsive width
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  legendText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    flexShrink: 1, // Allow text to shrink on very small screens
  },

  // Subtle Bottom Sheet
  subtleBottomSheet: {
    position: 'absolute',
    bottom: '3%', // Responsive bottom positioning
    left: '4%', // Responsive left margin
    right: '18%', // Leave space for controls (responsive)
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 7,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    maxHeight: '20%', // Responsive max height
    minHeight: 60, // Ensure minimum usable height
  },
  moreLocationsText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 6,
    textAlign: 'center',
    flexShrink: 1, // Allow text to shrink on small screens
  },
});
