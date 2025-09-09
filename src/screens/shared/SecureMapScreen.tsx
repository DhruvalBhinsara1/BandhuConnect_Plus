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
import MapView, { Marker, Circle, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { secureMapService, UserLocationData } from '../../services/secureMapService';
import { secureLocationService } from '../../services/secureLocationService';
import { APP_ROLE, getCurrentRoleConfig } from '../../constants/appRole';
import { supabase } from '../../services/supabase';
import { AuthDebugger } from '../../components/AuthDebugger';
import { useTheme } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useRequest } from '../../context/RequestContext';

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
  const { theme } = useTheme();
  const { user } = useAuth();
  const { requests, assignments, getAssignments } = useRequest();
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

  // Distance calculation function (same as minimap)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  // Format distance function
  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)} m`;
    }
    return `${(distance / 1000).toFixed(1)} km`;
  };

  // Get current user location from locations array
  const currentUserLocation = locations.find(loc => loc.userId === currentUserId);
  
  // Get counterpart location - different logic for volunteers vs pilgrims
  const getCounterpartLocation = () => {
    const userRole = user?.role || APP_ROLE;
    
    if (userRole === 'volunteer') {
      // For volunteers: Find their assignment and get the pilgrim's location
      const myAssignments = requests
        .map(request => assignments.find(a => a.request_id === request.id && a.volunteer_id === user?.id))
        .filter(Boolean);
      
      if (myAssignments.length > 0 && myAssignments[0]) {
        const assignedRequest = requests.find(r => r.id === myAssignments[0]?.request_id);
        if (assignedRequest) {
          // Find the pilgrim's location in the locations array
          return locations.find(loc => loc.userId === assignedRequest.user_id);
        }
      }
      return null;
    } else {
      // For pilgrims: Find their assigned requests and get the volunteer's location
      const myRequests = requests.filter(r => r.user_id === user?.id);
      const activeRequests = myRequests.filter(r => 
        ['assigned', 'in_progress'].includes(r.status)
      );
      
      if (activeRequests.length > 0) {
        const activeRequest = activeRequests[0];
        // Find the assignment for this request to get the volunteer ID
        const assignment = assignments.find(a => a.request_id === activeRequest.id);
        if (assignment?.volunteer_id) {
          // Find the volunteer's location in the locations array
          const volunteerLocation = locations.find(loc => loc.userId === assignment.volunteer_id);
          
          console.log('[SecureMapScreen] PILGRIM COUNTERPART LOCATION:', {
            activeRequest: { id: activeRequest.id, status: activeRequest.status, title: activeRequest.title },
            assignment: assignment ? { id: assignment.id, volunteer_id: assignment.volunteer_id, status: assignment.status } : null,
            volunteerLocation: volunteerLocation ? { name: volunteerLocation.name, userId: volunteerLocation.userId } : null,
            totalLocations: locations.length
          });
          
          return volunteerLocation;
        }
      }
      
      // Fallback to the original logic
      const fallbackLocation = currentAssignment?.counterpartId 
        ? locations.find(loc => loc.userId === currentAssignment.counterpartId)
        : null;
        
      console.log('[SecureMapScreen] PILGRIM FALLBACK LOCATION:', {
        currentAssignment: currentAssignment ? { counterpartId: currentAssignment.counterpartId, assigned: currentAssignment.assigned } : null,
        fallbackLocation: fallbackLocation ? { name: fallbackLocation.name, userId: fallbackLocation.userId } : null
      });
      
      return fallbackLocation;
    }
  };
  
  const counterpartLocationFromArray = getCounterpartLocation();
  
  // Use counterpart location from array if available, otherwise fall back to counterpartLocation state
  const effectiveCounterpartLocation = counterpartLocationFromArray || counterpartLocation;
  
  // Calculate distance to counterpart
  const calculatedDistance = effectiveCounterpartLocation && currentUserLocation 
    ? calculateDistance(
        currentUserLocation.latitude,
        currentUserLocation.longitude,
        effectiveCounterpartLocation.latitude,
        effectiveCounterpartLocation.longitude
      )
    : 0;

  // Debug distance calculation
  if (effectiveCounterpartLocation && currentUserLocation) {
    console.log('[SecureMapScreen] Distance calculation:', {
      userLocation: {
        lat: currentUserLocation.latitude,
        lng: currentUserLocation.longitude,
        name: currentUserLocation.name
      },
      counterpartLocation: {
        lat: effectiveCounterpartLocation.latitude,
        lng: effectiveCounterpartLocation.longitude,
        name: effectiveCounterpartLocation.name || 'Unknown'
      },
      calculatedDistance,
      formattedDistance: calculatedDistance > 0 ? formatDistance(calculatedDistance) : 'N/A'
    });
  }

  const estimatedArrival = calculatedDistance > 0 
    ? `${Math.round((calculatedDistance / 1000) / 5 * 60)} min` 
    : null;

  const roleConfig = getCurrentRoleConfig();

  useEffect(() => {
    initializeMap();
    initializeAssignmentTracking();
    fetchCurrentUserId();
    
    // Fetch latest assignments from request context
    if (user?.id) {
      // For volunteers, get assignments filtered by volunteer_id
      if ((user?.role || APP_ROLE) === 'volunteer') {
        getAssignments?.({ volunteerId: user.id });
        console.log('[SecureMapScreen] Fetching assignments for volunteer:', user.id);
      } else {
        getAssignments?.();
        console.log('[SecureMapScreen] Fetching all assignments for role:', user?.role || APP_ROLE);
      }
    } else {
      getAssignments?.();
      console.log('[SecureMapScreen] Fetching assignments without user ID');
    }
    
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
    const { data: { user } } = await supabase.auth.getUser();
    
    // Validate assignment completeness using direct assignment data
    const isCompleteAssignment = assignment && 
      assignment.isActive && 
      assignment.assigned && 
      assignment.counterpartId && 
      assignment.assignmentId;
    
    console.log('[SecureMapScreen] Assignment validation:', {
      hasAssignment: !!assignment,
      isActive: assignment?.isActive,
      assigned: assignment?.assigned,
      isCompleteAssignment,
      counterpartId: assignment?.counterpartId,
      assignmentId: assignment?.assignmentId,
      counterpartName: assignment?.counterpartName,
      userId: user?.id
    });
    
    // Use direct assignment data instead of complex service logic
    if (isCompleteAssignment) {
      console.log('[SecureMapScreen] ✅ Valid assignment found, showing distance card');
      setTrackingState(prev => ({
        ...prev,
        hasAssignment: true,
        assigned: true,
        counterpartName: assignment.counterpartName,
        showCompletedStatus: false
      }));
    } else {
      console.log('[SecureMapScreen] ❌ No valid assignment, hiding distance card');
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
        const ownLocation = updatedLocations.find(loc => loc.role === (user?.role || APP_ROLE));
        if (ownLocation) {
          mapRef.current.animateToRegion({
            latitude: ownLocation.latitude,
            longitude: ownLocation.longitude,
            latitudeDelta: 0.001, // ~100m view for better user focus
            longitudeDelta: 0.001, // ~100m view for better user focus
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
    const userRole = user?.role || APP_ROLE;
    
    if (userRole === 'pilgrim') {
      // For pilgrims, go to the requests/create request screen
      navigation.navigate('Requests' as never);
    } else if (userRole === 'volunteer') {
      // For volunteers, go to tasks screen
      navigation.navigate('Tasks' as never);
    } else if (userRole === 'admin') {
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
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Initializing location tracking...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Pilgrim App Style Header */}
      <View style={styles.pilgrimHeader}>
        <View style={styles.headerLeft}>
          <Ionicons 
            name={user?.role === 'volunteer' ? 'shield-checkmark' : 'location'} 
            size={22} 
            color="#ffffff" 
            style={{ marginRight: 10 }} 
          />
          <Text style={styles.pilgrimHeaderTitle}>
            {user?.role === 'volunteer' ? 'Volunteer Map' : 'Live Map'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.usersBadge, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
            <Text style={styles.usersText}>{locations.length} online</Text>
          </View>
          <View style={[styles.statusPill, { 
            backgroundColor: trackingState.isActive ? '#10b981' : '#ef4444',
          }]}>
            <Text style={styles.statusText}>
              {user?.role === 'volunteer' 
                ? (trackingState.isActive ? 'ON DUTY' : 'OFF DUTY')
                : (trackingState.isActive ? 'LIVE' : 'OFFLINE')
              }
            </Text>
          </View>
        </View>
      </View>

      {/* Request Status Input Bar */}
      <View style={[styles.requestInputBar, { backgroundColor: theme.surface }]}>
        <TouchableOpacity 
          style={[styles.requestInputField, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}
          onPress={handleRequestTap}
          activeOpacity={0.7}
        >
          <Ionicons name="search-outline" size={16} color={theme.primary} />
          <Text style={[
            styles.requestInputText,
            { color: theme.textPrimary },
            (!trackingState.hasAssignment || !trackingState.assigned) && { color: theme.textSecondary }
          ]}>
            {(() => {
              // Use dynamic role from user context instead of hardcoded APP_ROLE
              const userRole = user?.role || APP_ROLE;
              
              if (userRole === 'volunteer') {
                // For volunteers, check assignments assigned to them
                const myAssignments = requests
                  .map(request => assignments.find(a => a.request_id === request.id && a.volunteer_id === user?.id))
                  .filter(Boolean);
                
                if (myAssignments.length > 0) {
                  const assignment = myAssignments[0];
                  // Get the pilgrim's name from the request
                  const assignedRequest = requests.find(r => r.id === assignment?.request_id);
                  const pilgrimName = assignedRequest?.user?.name || effectiveCounterpartLocation?.name || 'Unknown pilgrim';
                  
                  if (assignment?.status === 'pending') return 'Assignment received, go to the destination.';
                  if (assignment?.status === 'accepted') return `You are helping ${pilgrimName}`;
                  if (assignment?.status === 'in_progress') return `Helping ${pilgrimName} - in progress`;
                  if (assignment?.status === 'completed') return 'Assignment completed';
                }
                
                // Fallback: Check if we have assignment data from context
                if (currentAssignment?.assigned && effectiveCounterpartLocation) {
                  return `You are helping ${effectiveCounterpartLocation.name || 'pilgrim'}`;
                }
                
                return 'No active assignments';
              } else {
                // For pilgrims, check requests created by them
                const myRequests = requests.filter(r => r.user_id === user?.id);
                const activeRequests = myRequests.filter(r => 
                  ['pending', 'assigned', 'in_progress'].includes(r.status)
                );
                
                if (activeRequests.length > 0) {
                  const status = activeRequests[0].status;
                  if (status === 'pending') return 'Request submitted, waiting for volunteer';
                  if (status === 'assigned') return 'Volunteer assigned, help is coming';
                  if (status === 'in_progress') return 'Help is in progress';
                }
                
                return 'Tap to create new request';
              }
            })()}
          </Text>
          {(() => {
            const userRole = user?.role || APP_ROLE;
            
            if (userRole === 'volunteer') {
              // Volunteers don't create requests, so no plus icon
              return null;
            } else {
              // For pilgrims, only show plus icon if no active requests
              const myRequests = requests.filter(r => r.user_id === user?.id);
              const activeRequests = myRequests.filter(r => 
                ['pending', 'assigned', 'in_progress'].includes(r.status)
              );
              return activeRequests.length === 0 && (
                <Ionicons name="add-circle-outline" size={16} color={theme.success} />
              );
            }
          })()}
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
          latitudeDelta: 0.005, // ~500m view for wider coverage
          longitudeDelta: 0.005, // ~500m view for wider coverage
        }}
      >
        {renderMarkers()}
        
        {/* Polyline between user and volunteer */}
        {(() => {
          const hasCounterpart = !!(effectiveCounterpartLocation && currentUserLocation);
          const userRole = user?.role || APP_ROLE;
          
          // Debug logging for volunteer assignments
          if (userRole === 'volunteer') {
            console.log('[SecureMapScreen] COMPLETE VOLUNTEER DEBUG:', {
              userId: user?.id,
              userRole: userRole,
              requestsCount: requests.length,
              assignmentsCount: assignments.length,
              requests: requests.map(r => ({ 
                id: r.id, 
                user_id: r.user_id, 
                status: r.status,
                title: r.title
              })),
              assignments: assignments.map(a => ({
                id: a.id,
                volunteer_id: a.volunteer_id,
                request_id: a.request_id,
                status: a.status,
                assigned: a.assigned,
                isUserAssignment: a.volunteer_id === user?.id
              })),
              hasCounterpart,
              effectiveCounterpartLocation: effectiveCounterpartLocation ? {
                name: effectiveCounterpartLocation.name,
                latitude: effectiveCounterpartLocation.latitude,
                longitude: effectiveCounterpartLocation.longitude
              } : null,
              currentUserLocation: currentUserLocation ? {
                latitude: currentUserLocation.latitude,
                longitude: currentUserLocation.longitude
              } : null
            });
          }
          
          // Different logic for volunteers vs pilgrims
          let finalShow = false;
          
          if (userRole === 'volunteer') {
            // For volunteers: Use the EXACT same logic as the working status text
            const myAssignments = requests
              .map(request => assignments.find(a => a.request_id === request.id && a.volunteer_id === user?.id))
              .filter(Boolean);
            // Show polyline only if assignment is active (not completed/cancelled) and counterpart is available
            const volunteerHasActiveAssignment = myAssignments.length > 0 &&
              myAssignments.some(a => ['pending', 'accepted', 'in_progress'].includes(a?.status));
            finalShow = volunteerHasActiveAssignment && hasCounterpart;
            console.log('[SecureMapScreen] VOLUNTEER POLYLINE CHECK:', {
              myAssignments: myAssignments.map(a => ({ id: a?.id, status: a?.status })),
              volunteerHasActiveAssignment,
              hasCounterpart,
              finalShow
            });
          } else {
            // For pilgrims: Check if they have requests with assigned status
            const myRequests = requests.filter(r => r.user_id === user?.id);
            const activeRequests = myRequests.filter(r => 
              ['assigned', 'in_progress'].includes(r.status)
            );
            finalShow = activeRequests.length > 0 && hasCounterpart;
            
            console.log('[SecureMapScreen] PILGRIM POLYLINE CHECK:', {
              myRequests: myRequests.map(r => ({ id: r.id, status: r.status, title: r.title })),
              activeRequests: activeRequests.map(r => ({ id: r.id, status: r.status, title: r.title })),
              hasCounterpart,
              finalShow
            });
          }
          
          return finalShow ? (
            <Polyline
              coordinates={[
                {
                  latitude: currentUserLocation.latitude,
                  longitude: currentUserLocation.longitude,
                },
                {
                  latitude: effectiveCounterpartLocation.latitude,
                  longitude: effectiveCounterpartLocation.longitude,
                },
              ]}
              strokeColor="#10b981"
              strokeWidth={3}
              lineDashPattern={[10, 5]}
            />
          ) : null;
        })()}
      </MapView>

      {/* Distance & ETA Display - show when tracking counterpart */}
      {(() => {
        const hasCounterpart = !!(effectiveCounterpartLocation && currentUserLocation);
        const userRole = user?.role || APP_ROLE;
        
        // Different logic for volunteers vs pilgrims
        let finalShow = false;
        
        if (userRole === 'volunteer') {
          // For volunteers: Use the EXACT same logic as the working status text
          const myAssignments = requests
            .map(request => assignments.find(a => a.request_id === request.id && a.volunteer_id === user?.id))
            .filter(Boolean);
          // Show ETA only if assignment is active (not completed/cancelled) and counterpart is available
          const volunteerHasActiveAssignment = myAssignments.length > 0 &&
            myAssignments.some(a => ['pending', 'accepted', 'in_progress'].includes(a?.status));
          finalShow = volunteerHasActiveAssignment && hasCounterpart && calculatedDistance > 0;
        } else {
          // For pilgrims: Check if they have requests with assigned status
          const myRequests = requests.filter(r => r.user_id === user?.id);
          const activeRequests = myRequests.filter(r => 
            ['assigned', 'in_progress'].includes(r.status)
          );
          finalShow = activeRequests.length > 0 && hasCounterpart && calculatedDistance > 0;
          
          console.log('[SecureMapScreen] PILGRIM ETA CHECK:', {
            myRequests: myRequests.map(r => ({ id: r.id, status: r.status, title: r.title })),
            activeRequests: activeRequests.map(r => ({ id: r.id, status: r.status, title: r.title })),
            hasCounterpart,
            calculatedDistance,
            finalShow
          });
        }
        
        console.log('[SecureMapScreen] Distance card visibility check:', {
          assigned: trackingState.assigned,
          hasCounterpartLocation: !!effectiveCounterpartLocation,
          hasCurrentUserLocation: !!currentUserLocation,
          calculatedDistance,
          userRole,
          finalShow,
          assignmentData: currentAssignment,
          trackingState: trackingState,
          counterpartFromArray: !!counterpartLocationFromArray,
          counterpartFromState: !!counterpartLocation,
          locationsCount: locations.length,
          assignmentsCount: assignments.length
        });
        
        return finalShow ? (
          <View style={styles.distanceCard}>
            <View style={styles.distanceHeader}>
              <Ionicons name="navigate" size={20} color="#10b981" />
              <Text style={styles.distanceTitle}>
                {(user?.role || APP_ROLE) === 'pilgrim' 
                  ? 'Help is on the way' 
                  : (user?.role || APP_ROLE) === 'volunteer' 
                    ? `Heading to help ${effectiveCounterpartLocation?.name || 'pilgrim'}`
                    : 'Tracking in progress'
                }
              </Text>
            </View>
            <View style={styles.distanceContent}>
              <View style={styles.distanceItem}>
                <Text style={styles.distanceValue}>{formatDistance(calculatedDistance)}</Text>
                <Text style={styles.distanceLabel}>
                  {(user?.role || APP_ROLE) === 'pilgrim' ? 'away' : 'to destination'}
                </Text>
              </View>
              {estimatedArrival && (
                <View style={styles.etaContainer}>
                  <Text style={styles.etaValue}>{estimatedArrival}</Text>
                  <Text style={styles.etaLabel}>
                    {(user?.role || APP_ROLE) === 'pilgrim' 
                      ? 'mins' 
                      : (user?.role || APP_ROLE) === 'volunteer' 
                        ? 'min ETA'
                        : 'minutes'
                    }
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : null;
      })()}

      {/* Enhanced Legend - only show when there are multiple users */}
      {locations.length > 1 && (
        <View style={[styles.enhancedLegend, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
          {locations.slice(0, 2).map((location) => { // Show max 2 users
            const markerStyle = getMarkerStyle(location.role, location.isStale);
            const isCurrentUser = location.userId === currentUserId;
            const displayName = isCurrentUser 
              ? 'You' 
              : (location.name || 'Unknown User');
            
            return (
              <View key={location.userId} style={styles.enhancedLegendItem}>
                <View style={[styles.enhancedLegendDot, { backgroundColor: markerStyle.color }]} />
                <Text style={[styles.enhancedLegendText, { color: theme.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
                  {displayName}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Compact Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={[styles.myLocationButton, { backgroundColor: theme.error }]}
          onPress={centerOnSelf}
        >
          <Ionicons name="locate" size={20} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={locations.length > 0 ? [styles.expandButton, { backgroundColor: theme.success }] : [styles.controlButton, { backgroundColor: theme.surface }]}
          onPress={fitAllMarkers}
          disabled={locations.length === 0}
        >
          <Ionicons name="scan" size={18} color={locations.length > 0 ? "white" : theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: theme.primary }]}
          onPress={refreshLocations}
        >
          <Ionicons name="refresh" size={18} color="white" />
        </TouchableOpacity>
      </View>

      {/* Compact Location Status - only show when not assigned to a volunteer */}
      {locations.length > 0 && !trackingState.assigned && (
        <View style={[styles.subtleBottomSheet, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
          <View style={styles.locationRow}>
            <View style={styles.locationIcon}>
              <Ionicons name="people" size={16} color={theme.primary} />
            </View>
            <Text style={[styles.locationLabel, { color: theme.textPrimary }]}>
              {locations.length} user{locations.length > 1 ? 's' : ''} online
            </Text>
          </View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 44, // Status bar height
    left: 16,
    right: 16,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 0,
    flexShrink: 1, // Allow title to shrink on smaller screens
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
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
  legendContainer: {
    position: 'absolute',
    top: 130, // Better positioning after header improvements
    left: '4%', // Responsive positioning
    right: '20%', // Better proportional spacing
    backgroundColor: 'white',
    borderRadius: 16, // More rounded for modern look
    padding: 16, // Better padding
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 1,
  },
  legendTitle: {
    fontSize: 15, // Better size for readability
    fontWeight: '700', // Bolder for better hierarchy
    color: '#374151',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8, // Better spacing
  },
  legendText: {
    fontSize: 13, // Better readability
    color: '#6B7280',
    marginLeft: 10,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  legendMarker: {
    width: 14, // Slightly larger markers
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  map: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 130, // Better positioning
    right: '4%', // Responsive positioning
    zIndex: 1,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12, // More rounded
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48, // Better touch target
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoPanel: {
    position: 'absolute',
    bottom: 20, // Better positioning
    left: '4%', // Responsive positioning
    right: '25%', // Better proportional spacing
    backgroundColor: 'white',
    borderRadius: 16, // More rounded
    padding: 16, // Better padding
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  locationDetails: {
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 1,
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
    paddingHorizontal: '5%', // Responsive horizontal padding
    paddingVertical: 12,
    paddingTop: 48, // Account for status bar on most devices
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
    minHeight: 80, // Ensure minimum height on smaller screens
  },
  // Pilgrim App Style Header
  pilgrimHeader: {
    backgroundColor: '#16a34a',
    paddingHorizontal: '4%', // Responsive padding
    paddingVertical: 14,
    paddingTop: 50, // Better status bar accounting
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 10,
    minHeight: 88, // Better minimum height for readability
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    maxWidth: '65%', // Prevent overflow on small screens
  },
  pilgrimHeaderTitle: {
    color: '#ffffff',
    fontSize: 18, // Larger, more readable
    fontWeight: '700', // Bolder for better visibility
    letterSpacing: 0.3, // Better character spacing
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10, // Better spacing
    flexShrink: 0,
    maxWidth: '35%', // Better proportion for small screens
  },
  usersBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    minWidth: 60, // Better minimum width for readability
  },
  usersText: {
    fontSize: 12, // Slightly larger for better readability
    fontWeight: '600', // Bolder for better visibility
    textAlign: 'center',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    minWidth: 75, // Better minimum width for status text
  },
  statusText: {
    fontSize: 11, // Better size for status text
    fontWeight: '700', // Bold for better visibility
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  
  // Request Input Bar Styles
  requestInputBar: {
    paddingHorizontal: '4%', // Better responsive padding
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: '#E2E8F0',
    zIndex: 9,
    backgroundColor: '#ffffff',
    // Add subtle gradient effect with shadow
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  requestInputField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12, // More rounded for modern look
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    minHeight: 50, // Better touch target size
    // Add subtle interaction feedback with color accent
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  requestInputText: {
    flex: 1,
    fontSize: 15, // Better readability
    fontWeight: '500', // Slightly bolder
    letterSpacing: 0.2,
    minHeight: 22, // Better consistent height
  },
  placeholderText: {
    fontStyle: 'italic',
    opacity: 0.7, // Better placeholder visibility
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

  // Enhanced Legend with better styling
  enhancedLegend: {
    position: 'absolute',
    top: '20%', // Responsive positioning
    left: 16,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 6,
    borderWidth: 1,
    minWidth: 120, // Ensure enough space for full names
    maxWidth: '45%', // Allow more space for longer names
  },
  enhancedLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 24, // Larger height for better touch and visibility
    paddingVertical: 2,
  },
  enhancedLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
    flexShrink: 0, // Don't shrink the dot
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  enhancedLegendText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1, // Take remaining space
    letterSpacing: 0.2,
  },

  // Distance & ETA Card - Delivery tracking style
  distanceCard: {
    position: 'absolute',
    bottom: '4%', // Lowered from 8% to 4% for more space from bottom
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    zIndex: 8,
  },
  distanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  distanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
    flex: 1,
  },
  distanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  distanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginRight: 4,
  },
  distanceLabel: {
    fontSize: 14,
    color: '#64748b',
    marginRight: 16,
  },
  etaContainer: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  etaValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  etaLabel: {
    fontSize: 10,
    color: '#ffffff',
    opacity: 0.9,
  },

  // Subtle Bottom Sheet
  subtleBottomSheet: {
    position: 'absolute',
    bottom: '2%', // Lower positioning
    left: '4%',
    right: '4%', // Full width minus margins
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 7,
    borderWidth: 1,
    maxHeight: '12%', // Even smaller
    minHeight: 60,
  },
  moreLocationsText: {
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 6,
    textAlign: 'center',
    flexShrink: 1, // Allow text to shrink on small screens
  },
});
