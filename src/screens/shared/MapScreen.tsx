import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
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
import { MarkerCallout } from '../../components/MarkerCallout';
import { DebugDrawer } from '../../components/DebugDrawer';
import type { UserLocationData } from '../../services/mapService';
import { locationService } from '../../services/locationService';
import { APP_CONFIG, getUserRole, shouldShowMarker } from '../../constants/appConfig';

const { width, height } = Dimensions.get('window');

const MapScreen: React.FC = () => {
  const { user } = useAuth();
  const { userLocations, loading, refreshLocations } = useMap();
  const { currentLocation, isTracking, isBackgroundTracking, permissions, getCurrentLocation } = useLocation();
  const [locations, setLocations] = useState<UserLocationData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<UserLocationData | null>(null);
  const [showLocationNotice, setShowLocationNotice] = useState(true);
  const noticeOpacity = useState(new Animated.Value(1))[0];
  const [region, setRegion] = useState<Region>({
    latitude: 19.0760,
    longitude: 72.8777,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [mapType, setMapType] = useState<MapType>('standard');
  const [showBuildingView, setShowBuildingView] = useState(true);
  const mapRef = React.useRef<MapView>(null);
  const [realtimeLocations, setRealtimeLocations] = useState<UserLocationData[]>([]);
  const [showDebugDrawer, setShowDebugDrawer] = useState(false);
  const [debugTapCount, setDebugTapCount] = useState(0);

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
        latitudeDelta: 0.001,
        longitudeDelta: 0.001,
      }, 1000);
    } else {
      console.log('Show Me: No current location available');
      Alert.alert(
        'Location Unavailable',
        'Your location is not available. Please enable location services and try again.',
        [{ text: 'OK' }]
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
          latitudeDelta: 0.01, // ~1km view
          longitudeDelta: 0.01,
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
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        mapRef.current.animateToRegion({
          latitude: firstLocation.latitude,
          longitude: firstLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
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
  
  const activeUserLocations = filteredLocations;

  const getCurrentLocationAndCenter = async () => {
    try {
      console.log('MapScreen: Getting current location and centering map...');
      await getCurrentLocation(); // Use LocationContext method
      
      // The currentLocation will be updated by LocationContext
      // We'll center the map in the useEffect that watches currentLocation
    } catch (error) {
      console.error('MapScreen: Could not get current location:', error);
      Alert.alert(
        'Location Error',
        'Please check your GPS settings and location permissions.',
        [{ text: 'OK' }]
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
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      
      // Also animate the map to the new region
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
    }
  }, [currentLocation]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDebugTap} style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Location Tracking</Text>
          <Text style={styles.versionText}>v{APP_CONFIG.VERSION}</Text>
        </TouchableOpacity>
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
                  <Ionicons name="star" size={16} color="#fff" />
                </View>
              ) : user?.role === 'volunteer' ? (
                <View style={[styles.userMarker, styles.volunteerMarker]}>
                  <Ionicons name="shield" size={16} color="#fff" />
                </View>
              ) : (
                <View style={[styles.userMarker, styles.pilgrimMarker]}>
                  <Ionicons name="person" size={16} color="#fff" />
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
                    size={16} 
                    color={isStale ? '#999' : '#fff'} 
                  />
                </View>
                <MarkerCallout location={location} isStale={isStale} minutesAgo={minutesAgo} />
              </Marker>
            );
          })}
        </MapView>

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

        <View style={styles.mapControls}>
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
            <TouchableOpacity
              style={[styles.mapButton, showBuildingView && styles.activeMapButton]}
              onPress={() => setShowBuildingView(!showBuildingView)}
            >
              <Text style={[styles.mapButtonText, showBuildingView && styles.activeButtonText]}>Buildings</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.navigationControls}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={handleShowMe}
            >
              <Ionicons name="locate" size={20} color="#2563EB" />
              <Text style={styles.navButtonText}>Show Me</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={handleFitInFrame}
            >
 
              <Text style={styles.navButtonText}>Fit in Frame</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {user?.role === 'pilgrim' ? (
            <>
              <View style={styles.legendItem}>
                <View style={[styles.legendMarker, styles.pilgrimMarker]}>
                  <Ionicons name="person" size={12} color="#fff" />
                </View>
                <Text style={styles.legendText}>Pilgrim (You)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendMarker, styles.volunteerMarker]}>
                  <Ionicons name="shield" size={12} color="#fff" />
                </View>
                <Text style={styles.legendText}>Assigned Volunteer</Text>
              </View>
            </>
          ) : user?.role === 'volunteer' ? (
            <>
              <View style={styles.legendItem}>
                <View style={[styles.legendMarker, styles.volunteerMarker]}>
                  <Ionicons name="shield" size={12} color="#fff" />
                </View>
                <Text style={styles.legendText}>Volunteer (You)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendMarker, styles.pilgrimMarker]}>
                  <Ionicons name="person" size={12} color="#fff" />
                </View>
                <Text style={styles.legendText}>Assigned Pilgrims</Text>
              </View>
            </>
          ) : user?.role === 'admin' ? (
            <>
              <View style={styles.legendItem}>
                <View style={[styles.legendMarker, styles.adminMarker]}>
                  <Ionicons name="star" size={12} color="#fff" />
                </View>
                <Text style={styles.legendText}>Admin (You)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendMarker, styles.volunteerMarker]}>
                  <Ionicons name="shield" size={12} color="#fff" />
                </View>
                <Text style={styles.legendText}>All Volunteers</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendMarker, styles.pilgrimMarker]}>
                  <Ionicons name="person" size={12} color="#fff" />
                </View>
                <Text style={styles.legendText}>All Pilgrims</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.legendItem}>
                <View style={[styles.legendMarker, styles.volunteerMarker]}>
                  <Ionicons name="shield" size={12} color="#fff" />
                </View>
                <Text style={styles.legendText}>Volunteers</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendMarker, styles.pilgrimMarker]}>
                  <Ionicons name="person" size={12} color="#fff" />
                </View>
                <Text style={styles.legendText}>Pilgrims</Text>
              </View>
            </>
          )}
        </View>

        {/* Notification for users without location data */}
        {placeholderUsers.length > 0 && (
          <View style={styles.noLocationBanner}>
            <Ionicons name="information-circle" size={16} color="#F59E0B" />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitleContainer: {
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  versionText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statsText: {
    fontSize: 14,
    color: '#4B5563',
  },
  trackingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#4B5563',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapControls: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'column',
    gap: 16,
  },
  mapTypeControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  mapButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  activeMapButton: {
    backgroundColor: '#2563EB',
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  activeButtonText: {
    color: '#fff',
  },
  noLocationBanner: {
    position: 'absolute',
    top: 140,
    left: 16,
    right: 16,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noLocationText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
  warningOverlay: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  warningText: {
    color: '#92400E',
    fontSize: 14,
    textAlign: 'center',
  },
  locationNotice: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: '#0891B2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationNoticeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
    bottom: 100,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#fff',
  },
  legendText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  navigationControls: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 6,
  },
  navButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2563EB',
  },
});

export default MapScreen;
