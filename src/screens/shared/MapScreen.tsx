import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Dimensions, 
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE, Region, MapType } from 'react-native-maps';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { useMap } from '../../context/MapContext';
import { useRequest } from '../../context/RequestContext';
import { useToast } from '../../components/ui/Toast';
import { MarkerCallout } from '../../components/MarkerCallout';
import { DebugDrawer } from '../../components/DebugDrawer';
import { TrackingStatus } from '../../components/TrackingStatus';
import type { UserLocationData } from '../../services/mapService';
import { locationService } from '../../services/locationService';
import { APP_CONFIG, getUserRole, shouldShowMarker } from '../../constants/appConfig';

const { width, height } = Dimensions.get('window');

const MapScreen: React.FC = () => {
  const { user } = useAuth();
  const { userLocations, loading, refreshLocations } = useMap();
  const { currentLocation, isTracking, isBackgroundTracking, permissions, getCurrentLocation } = useLocation();
  const { requests } = useRequest();
  const toast = useToast();
  const [locations, setLocations] = useState<UserLocationData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<UserLocationData | null>(null);
  const [showLocationNotice, setShowLocationNotice] = useState(true);
  const noticeOpacity = useState(new Animated.Value(1))[0];
  const [region, setRegion] = useState<Region>({
    latitude: 19.0760,
    longitude: 72.8777,
    latitudeDelta: 0.001, // ~100m view instead of 0.002
    longitudeDelta: 0.001, // ~100m view instead of 0.002
  });
  const [mapType, setMapType] = useState<MapType>('standard');
  const [showBuildingView, setShowBuildingView] = useState(true);
  const mapRef = React.useRef<MapView>(null);
  const [realtimeLocations, setRealtimeLocations] = useState<UserLocationData[]>([]);
  const [showDebugDrawer, setShowDebugDrawer] = useState(false);
  const [debugTapCount, setDebugTapCount] = useState(0);

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

  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)} m`;
    }
    return `${(distance / 1000).toFixed(1)} km`;
  };

  // Find assigned counterpart location based on active requests
  const getCounterpartLocation = () => {
    if (!currentLocation || !user) return null;
    
    console.log('MapScreen: Finding counterpart location...');
    console.log('User role:', user.role);
    console.log('User ID:', user.id);
    console.log('Requests:', requests);
    console.log('Locations:', locations);
    
    // Find user's active assigned request
    const userRequests = requests.filter(r => r.user_id === user.id);
    const assignedRequest = userRequests.find(r => 
      r.status === 'assigned' || r.status === 'in_progress'
    );
    
    console.log('User requests:', userRequests);
    console.log('Assigned request:', assignedRequest);
    
    if (!assignedRequest || !assignedRequest.volunteer_id) {
      console.log('No assigned request found');
      return null;
    }
    
    // Find the volunteer's location
    const volunteerLocation = locations.find(loc => 
      loc.user_id === assignedRequest.volunteer_id
    );
    
    console.log('Volunteer location found:', volunteerLocation);
    
    return volunteerLocation || null;
  };

  const counterpartLocation = getCounterpartLocation();
  
  // Calculate distance to counterpart
  const calculatedDistance = counterpartLocation && currentLocation 
    ? calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        counterpartLocation.latitude,
        counterpartLocation.longitude
      )
    : 0;

  const estimatedArrival = calculatedDistance > 0 
    ? `${Math.round((calculatedDistance / 1000) / 5 * 60)} min` 
    : null;

  // Debug logging
  console.log('MapScreen Distance Debug:', {
    hasCounterpart: !!counterpartLocation,
    hasCurrentLocation: !!currentLocation,
    calculatedDistance,
    estimatedArrival,
    shouldShowCard: !!(counterpartLocation && calculatedDistance > 0)
  });

  const getTrackingStatusText = () => {
    if (!permissions?.foreground) return 'Location permission required';
    if (isBackgroundTracking) return 'Background tracking active';
    if (isTracking) return 'Foreground tracking active';
    return 'Location tracking inactive';
  };

  const handleDebugTap = () => {
    if (!APP_CONFIG.SHOW_DEBUG_DRAWER) return;
    
    const newCount = debugTapCount + 1;
    setDebugTapCount(newCount);
    
    if (newCount >= 5) {
      setShowDebugDrawer(true);
      setDebugTapCount(0);
    }
    
    // Reset counter after 3 seconds
    setTimeout(() => setDebugTapCount(0), 3000);
  };

  const getTrackingStatusColor = () => {
    if (!permissions?.foreground) return '#DC2626';
    if (isBackgroundTracking) return '#16A34A';
    if (isTracking) return '#F59E0B';
    return '#6B7280';
  };

  const handleShowMe = () => {
    if (currentLocation && mapRef.current) {
      console.log('Show Me: Centering on current location:', currentLocation);
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.0005,
        longitudeDelta: 0.0005,
      }, 1000);
    } else {
      console.log('Show Me: No current location available');
      toast.showWarning(
        'Location Unavailable',
        'Your location is not available. Please enable location services and try again.'
      );
    }
  };

  const handleFitInFrame = () => {
    if (!currentLocation || !mapRef.current) return;

    const coordinates: Array<{ latitude: number; longitude: number }> = [
      {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      }
    ];

    // Add assigned counterparts based on role (using deduplicated locations)
    if (user?.role === 'pilgrim') {
      // Add assigned volunteer
      activeUserLocations.forEach((location: UserLocationData) => {
        if (location.user_role === 'volunteer') {
          coordinates.push({
            latitude: location.latitude,
            longitude: location.longitude,
          });
        }
      });
    } else if (user?.role === 'volunteer') {
      // Add assigned pilgrims
      activeUserLocations.forEach((location: UserLocationData) => {
        if (location.user_role === 'pilgrim') {
          coordinates.push({
            latitude: location.latitude,
            longitude: location.longitude,
          });
        }
      });
    } else if (user?.role === 'admin') {
      // Add all users
      activeUserLocations.forEach((location: UserLocationData) => {
        coordinates.push({
          latitude: location.latitude,
          longitude: location.longitude,
        });
      });
    }

    if (coordinates.length > 1) {
      // Calculate distance between points to determine appropriate zoom
      const distances = coordinates.map(coord1 => 
        coordinates.map(coord2 => {
          const R = 6371; // Earth's radius in km
          const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
          const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                   Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) * 
                   Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return R * c; // Distance in km
        })
      ).flat();
      
      const maxDistance = Math.max(...distances);
      
      // If all points are very close (within 1km), use a smaller zoom
      if (maxDistance < 1) {
        const centerLat = coordinates.reduce((sum, coord) => sum + coord.latitude, 0) / coordinates.length;
        const centerLon = coordinates.reduce((sum, coord) => sum + coord.longitude, 0) / coordinates.length;
        
        mapRef.current.animateToRegion({
          latitude: centerLat,
          longitude: centerLon,
          latitudeDelta: 0.002, // ~200m view
          longitudeDelta: 0.002,
        }, 1000);
      } else {
        // Use fitToCoordinates for distant points
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 150, left: 50 },
          animated: true,
        });
      }
    } else {
      // If no counterparts, just center on user
      handleShowMe();
    }
  };

  useEffect(() => {
    // Only show notice if we don't have the highest available permission and user hasn't chosen "don't ask again"
    const shouldShowNotice = permissions && 
      !permissions.highestAvailable && 
      !permissions.dontAskAgain && 
      permissions.foreground; // Only show if we at least have foreground
    
    if (shouldShowNotice) {
      setShowLocationNotice(true);
      // Fade out after 5 seconds
      const timer = setTimeout(() => {
        Animated.timing(noticeOpacity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => {
          setShowLocationNotice(false);
          // Reset opacity for next time
          noticeOpacity.setValue(1);
        });
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      setShowLocationNotice(false);
    }
  }, [permissions]);

  useEffect(() => {
    console.log('MapScreen: Initial load - refreshing locations and getting current location');
    refreshLocations();
    getCurrentLocationAndCenter();
  }, []);

  useEffect(() => {
    setLocations(userLocations);
    console.log('Map markers updated with', userLocations.length, 'locations:', userLocations);
    console.log('Current location state:', currentLocation);
    console.log('User role:', user?.role);
    
    // If we have user locations but no current location yet, center on the first location
    if (userLocations.length > 0 && !currentLocation && mapRef.current) {
      const firstLocation = userLocations[0];
      if (firstLocation && !firstLocation.isPlaceholder) {
        console.log('MapScreen: Centering on first user location:', firstLocation);
        setRegion({
          latitude: firstLocation.latitude,
          longitude: firstLocation.longitude,
          latitudeDelta: 0.001, // ~100m view
          longitudeDelta: 0.001, // ~100m view
        });
        mapRef.current.animateToRegion({
          latitude: firstLocation.latitude,
          longitude: firstLocation.longitude,
          latitudeDelta: 0.001, // ~100m view
          longitudeDelta: 0.001, // ~100m view
        }, 1000);
      }
    }
  }, [userLocations, currentLocation, user]);

  // Separate placeholder entries from real locations
  const realLocations = userLocations.filter(location => !location.isPlaceholder);
  const placeholderUsers = userLocations.filter(location => location.isPlaceholder);
  
  // Deduplicate locations by user_id to prevent duplicate markers
  const uniqueLocationMap = new Map<string, UserLocationData>();
  realLocations.forEach(location => {
    const existing = uniqueLocationMap.get(location.user_id);
    if (!existing || new Date(location.last_updated) > new Date(existing.last_updated)) {
      uniqueLocationMap.set(location.user_id, location);
    }
  });
  
  // Filter locations based on hardcoded role to show only relevant counterparts
  const userRole = getUserRole();
  const filteredLocations = Array.from(uniqueLocationMap.values()).filter(location => 
    shouldShowMarker(location.user_role, userRole) && location.user_id !== user?.id
  );
  
  // Always show own location if available from currentLocation
  const activeUserLocations = filteredLocations;

  const getCurrentLocationAndCenter = async () => {
    try {
      console.log('MapScreen: Getting current location and centering map...');
      await getCurrentLocation(); // Use LocationContext method
      
      // The currentLocation will be updated by LocationContext
      // We'll center the map in the useEffect that watches currentLocation
    } catch (error) {
      console.error('MapScreen: Could not get current location:', error);
      toast.showError(
        'Location Error',
        'Please check your GPS settings and location permissions.'
      );
    }
  };

  useEffect(() => {
    if (currentLocation) {
      console.log('MapScreen: Current location updated, centering map:', currentLocation);
      // Always center when we get a new location, not just on initial load
      setRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.001, // ~100m view
        longitudeDelta: 0.001, // ~100m view
      });
      
      // Also animate the map to the new region
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.001, // ~100m view
          longitudeDelta: 0.001, // ~100m view
        }, 1000);
      }
    }
  }, [currentLocation]);

  return (
    <View style={styles.container}>
      {/* Material-style App Bar Header */}
      <View style={styles.appBar}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleDebugTap} style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Live Map</Text>
            <Text style={styles.headerSubtitle}>Your Location</Text>
          </TouchableOpacity>
          
          {/* Request Status Pill */}
          <View style={styles.requestStatusPill}>
            <Ionicons name="notifications-outline" size={16} color="#6B7280" />
            <Text style={styles.requestStatusText}>No requests</Text>
          </View>
        </View>
        
        {/* Stats and Status Row */}
        <View style={styles.headerStats}>
          <Text style={styles.statsText}>{userLocations.length} users online</Text>
          <View style={styles.trackingStatus}>
            <View style={[styles.statusDot, { backgroundColor: getTrackingStatusColor() }]} />
            <Text style={styles.statusText}>{getTrackingStatusText()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          region={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          showsScale={true}
          mapType={mapType}
          loadingEnabled={true}
          pitchEnabled={true}
          rotateEnabled={true}
          scrollEnabled={true}
          zoomEnabled={true}
          minZoomLevel={15}
          maxZoomLevel={20}
          showsBuildings={showBuildingView}
          showsIndoors={true}
          showsIndoorLevelPicker={true}
          showsPointsOfInterest={true}
          userLocationAnnotationTitle="You are here"
          userLocationCalloutEnabled={true}
          userLocationPriority="balanced"
          userLocationUpdateInterval={5000}
          loadingBackgroundColor="#ffffff"
          loadingIndicatorColor="#000000"
        >
          {currentLocation && (
            <Marker
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
              flat={true}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
              tracksInfoWindowChanges={false}
            >
              {user?.role === 'admin' ? (
                <View style={[styles.userMarker, styles.adminMarker]}>
                  <Ionicons name="star" size={20} color="#fff" />
                </View>
              ) : user?.role === 'volunteer' ? (
                <View style={[styles.userMarker, styles.volunteerMarker]}>
                  <Ionicons name="shield" size={20} color="#fff" />
                </View>
              ) : (
                <View style={[styles.userMarker, styles.pilgrimMarker]}>
                  <Ionicons name="person" size={20} color="#fff" />
                </View>
              )}
            </Marker>
          )}

          {activeUserLocations.map((location) => {
            // Check if location is stale (older than 2 minutes) as per requirements
            const isStale = (Date.now() - new Date(location.last_updated).getTime()) > 2 * 60 * 1000;
            const minutesAgo = Math.floor((Date.now() - new Date(location.last_updated).getTime()) / (60 * 1000));
            
            return (
              <Marker
                key={`marker-${location.user_id}-${location.last_updated}`}
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                flat={true}
                onPress={() => setSelectedLocation(location)}
                opacity={isStale ? 0.5 : 1.0}
                title={isStale ? `Last seen ${minutesAgo} min ago` : location.user_name}
              >
                <View style={[
                  styles.userMarker,
                  location.user_role === 'admin' ? styles.adminMarker :
                  location.user_role === 'volunteer' ? styles.volunteerMarker : styles.pilgrimMarker,
                  isStale && { opacity: 0.5 }
                ]}>
                  <Ionicons 
                    name={
                      location.user_role === 'admin' ? 'star' :
                      location.user_role === 'volunteer' ? 'shield' : 'person'
                    } 
                    size={20} 
                    color={isStale ? '#999' : '#fff'} 
                  />
                </View>
                <MarkerCallout location={location} isStale={isStale} minutesAgo={minutesAgo} />
              </Marker>
            );
          })}
        </MapView>

        {/* Distance & ETA Display - show when tracking counterpart */}
        {counterpartLocation && calculatedDistance > 0 && (
          <View style={styles.distanceCard}>
            <View style={styles.distanceHeader}>
              <Ionicons name="navigate" size={16} color="#f59e0b" />
              <Text style={styles.distanceTitle}>Distance & ETA</Text>
            </View>
            <View style={styles.distanceContent}>
              <View style={styles.distanceItem}>
                <Text style={styles.distanceValue}>{formatDistance(calculatedDistance)}</Text>
                <Text style={styles.distanceLabel}>Away</Text>
              </View>
              {estimatedArrival && (
                <View style={styles.distanceItem}>
                  <Ionicons name="time" size={14} color="#059669" />
                  <Text style={styles.etaValue}>~{estimatedArrival}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {showLocationNotice && (
          <Animated.View style={[styles.locationNotice, { opacity: noticeOpacity }]}>
            <Text style={styles.locationNoticeText}>
              {Platform.OS === 'ios' 
                ? 'Please set location to "Always Allow" for better tracking'
                : 'Please enable background location for better tracking'
              }
            </Text>
          </Animated.View>
        )}

        {/* Right Side Control Stack */}
        <View style={styles.rightControlStack}>
          {/* Map Type Controls */}
          <View style={styles.mapTypeControls}>
            <TouchableOpacity
              style={[styles.mapButton, mapType === 'standard' && styles.activeMapButton]}
              onPress={() => setMapType('standard')}
            >
              <Text style={[styles.mapButtonText, mapType === 'standard' && styles.activeButtonText]}>Map</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mapButton, mapType === 'satellite' && styles.activeMapButton]}
              onPress={() => setMapType('satellite')}
            >
              <Text style={[styles.mapButtonText, mapType === 'satellite' && styles.activeButtonText]}>Satellite</Text>
            </TouchableOpacity>
          </View>

          {/* Primary Location Button */}
          <TouchableOpacity
            style={styles.primaryLocationButton}
            onPress={handleShowMe}
          >
            <Ionicons name="locate" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Secondary Action Buttons */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleFitInFrame}
          >
            <Ionicons name="scan" size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {user?.role === 'pilgrim' ? (
            <>
              <View style={styles.legendItem}>
                <View style={[styles.legendMarker, styles.pilgrimMarker]}>
                  <Ionicons name="person" size={14} color="#fff" />
                </View>
                <Text style={styles.legendText}>Pilgrim (You)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendMarker, styles.volunteerMarker]}>
                  <Ionicons name="shield" size={14} color="#fff" />
                </View>
                <Text style={styles.legendText}>Assigned Volunteer</Text>
              </View>
            </>
          ) : user?.role === 'volunteer' ? (
            <>
              <View style={styles.legendItem}>
                <View style={[styles.legendMarker, styles.volunteerMarker]}>
                  <Ionicons name="shield" size={14} color="#fff" />
                </View>
                <Text style={styles.legendText}>Volunteer (You)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendMarker, styles.pilgrimMarker]}>
                  <Ionicons name="person" size={14} color="#fff" />
                </View>
                <Text style={styles.legendText}>Assigned Pilgrims</Text>
              </View>
            </>
          ) : user?.role === 'admin' ? (
            <>
              <View style={styles.legendItem}>
                <View style={[styles.legendMarker, styles.adminMarker]}>
                  <Ionicons name="star" size={14} color="#fff" />
                </View>
                <Text style={styles.legendText}>Admin (You)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendMarker, styles.volunteerMarker]}>
                  <Ionicons name="shield" size={14} color="#fff" />
                </View>
                <Text style={styles.legendText}>All Volunteers</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendMarker, styles.pilgrimMarker]}>
                  <Ionicons name="person" size={14} color="#fff" />
                </View>
                <Text style={styles.legendText}>All Pilgrims</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.legendItem}>
                <View style={[styles.legendMarker, styles.volunteerMarker]}>
                  <Ionicons name="shield" size={14} color="#fff" />
                </View>
                <Text style={styles.legendText}>Volunteers</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendMarker, styles.pilgrimMarker]}>
                  <Ionicons name="person" size={14} color="#fff" />
                </View>
                <Text style={styles.legendText}>Pilgrims</Text>
              </View>
            </>
          )}
        </View>

        {/* Notification for users without location data */}
        {placeholderUsers.length > 0 && (
          <View style={styles.noLocationBanner}>
            <Ionicons name="information-circle" size={20} color="#F59E0B" />
            <Text style={styles.noLocationText}>
              {APP_CONFIG.ROLE === 'pilgrim' 
                ? `Your volunteer's location is not available`
                : APP_CONFIG.ROLE === 'volunteer'
                ? `${placeholderUsers.length} ${placeholderUsers.length === 1 ? 'pilgrim' : 'pilgrims'} ${placeholderUsers.length === 1 ? 'is' : 'are'} not sharing location`
                : `${placeholderUsers.length} ${placeholderUsers.length === 1 ? 'user' : 'users'} not sharing location`
              }
            </Text>
          </View>
        )}

        {!permissions?.background && (
          <View style={styles.warningOverlay}>
            <Text style={styles.warningText}>
              {Platform.OS === 'ios' 
                ? 'Set location to "Always Allow" for better tracking'
                : 'Enable background location for better tracking'
              }
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Sheet for Location Status */}
      <View style={styles.bottomSheetContainer}>
        <TouchableOpacity 
          style={styles.bottomSheetHandle}
          onPress={() => {/* Could add expand/collapse functionality */}}
        >
          <View style={styles.handleBar} />
        </TouchableOpacity>
        
        <View style={styles.bottomSheetContent}>
          <Text style={styles.bottomSheetTitle}>Location Status</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusIcon}>
              <Ionicons 
                name="person" 
                size={20} 
                color="#FFFFFF" 
              />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>You</Text>
              <Text style={styles.statusValue}>
                {isTracking ? 'Live tracking' : 'Location off'}
              </Text>
            </View>
          </View>
          {currentLocation && (
            <Text style={styles.lastUpdateText}>
              Last updated: {new Date().toLocaleTimeString()}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  // Material-style App Bar
  appBar: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 24,
    paddingBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 1000,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#BFDBFE',
    marginTop: 2,
    fontWeight: '500',
  },
  requestStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  requestStatusText: {
    fontSize: 12,
    color: '#E5E7EB',
    marginLeft: 6,
    fontWeight: '500',
  },
  versionText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsText: {
    fontSize: 14,
    color: '#E5E7EB',
    fontWeight: '500',
  },
  trackingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#E5E7EB',
    fontWeight: '500',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  // Right Side Control Stack
  rightControlStack: {
    position: 'absolute',
    top: 20,
    right: 16,
    alignItems: 'center',
    gap: 12,
  },
  mapControls: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'column',
    gap: 16,
  },
  mapTypeControls: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 8,
  },
  mapButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  activeMapButton: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  activeButtonText: {
    color: '#FFFFFF',
  },
  // Primary Red Location Button
  primaryLocationButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Secondary Action Buttons
  secondaryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  noLocationBanner: {
    position: 'absolute',
    top: 160,
    left: 20,
    right: 20,
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  noLocationText: {
    fontSize: 16,
    color: '#92400E',
    marginLeft: 12,
    flex: 1,
    fontWeight: '500',
    lineHeight: 22,
  },
  warningOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  warningText: {
    color: '#92400E',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
  },
  locationNotice: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#0891B2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  locationNoticeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
  currentLocationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563EB',
    borderWidth: 2,
    borderColor: '#fff',
  },
  currentLocationRing: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2563EB',
    opacity: 0.3,
  },
  userMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  volunteerMarker: {
    backgroundColor: '#16A34A',
  },
  pilgrimMarker: {
    backgroundColor: '#DC2626',
  },
  adminMarker: {
    backgroundColor: '#2563EB',
  },
  legend: {
    position: 'absolute',
    bottom: 160, // Moved up to avoid bottom sheet
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.1)',
    maxWidth: 180,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  legendText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    flex: 1,
  },
  navigationControls: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    gap: 8,
    minHeight: 44, // Minimum touch target size
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  trackingStatusBanner: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  // Bottom Sheet Styles
  bottomSheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16, // Account for safe area
  },
  bottomSheetHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  bottomSheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  statusValue: {
    fontSize: 16,
    color: '#16A34A',
    fontWeight: '500',
  },
  lastUpdateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '400',
  },
  // Distance & ETA Card
  distanceCard: {
    position: 'absolute',
    top: 120,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 120,
    zIndex: 7,
  },
  distanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  distanceTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 6,
  },
  distanceContent: {
    gap: 6,
  },
  distanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  distanceLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  etaValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#059669',
  },
});

export default MapScreen;
