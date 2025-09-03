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
import { useMap } from '../../context/MapContext';
import { useLocation } from '../../context/LocationContext';
import { MarkerCallout } from '../../components/MarkerCallout';
import { LocationPreview } from '../../components/LocationPreview';
import type { UserLocationData } from '../../services/mapService';
import { locationService } from '../../services/locationService';

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

  const getTrackingStatusText = () => {
    if (!permissions?.foreground) return 'Location permission required';
    if (isBackgroundTracking) return 'Background tracking active';
    if (isTracking) return 'Foreground tracking active';
    return 'Location tracking inactive';
  };

  const getTrackingStatusColor = () => {
    if (!permissions?.foreground) return '#DC2626';
    if (isBackgroundTracking) return '#16A34A';
    if (isTracking) return '#F59E0B';
    return '#6B7280';
  };

  useEffect(() => {
    if (!permissions?.background) {
      setShowLocationNotice(true);
      // Fade out after 3 seconds
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
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setShowLocationNotice(false);
    }
  }, [permissions?.background]);

  useEffect(() => {
    refreshLocations();
    getCurrentLocationAndCenter();
  }, []);

  const getCurrentLocationAndCenter = async () => {
    try {
      const location = await getCurrentLocation();
      if (location) {
        // Calculate zoom level based on accuracy
        const delta = location.accuracy 
          ? Math.max(0.0005, location.accuracy / 100000)
          : 0.0005;

        // Update region with proper error handling
        if (Number.isFinite(location.latitude) && Number.isFinite(location.longitude)) {
          setRegion({
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: delta,
            longitudeDelta: delta,
          });
          
          // Update location in database
          await locationService.updateLocation({
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            timestamp: Date.now()
          });
        } else {
          throw new Error('Invalid coordinates received');
        }
      }
    } catch (error) {
      console.error('Could not get current location:', error);
      Alert.alert(
        'Location Error',
        'Please check your GPS settings and location permissions.',
        [{ text: 'OK' }]
      );
    }
  };

  useEffect(() => {
    if (currentLocation && region.latitude === 19.0760) {
      setRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.0005,
        longitudeDelta: 0.0005,
      });
    }
  }, [currentLocation]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Location Tracking</Text>
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
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          region={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
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
            >
              <View style={styles.currentLocationMarker}>
                <View style={styles.currentLocationDot} />
                <View style={styles.currentLocationRing} />
              </View>
            </Marker>
          )}

          {userLocations.map((location) => (
            <Marker
              key={location.location_id}
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              flat={true}
              onPress={() => setSelectedLocation(location)}
            >
              <MarkerCallout location={location} />
            </Marker>
          ))}
        </MapView>

        {showLocationNotice && (
          <Animated.View style={[styles.locationNotice, { opacity: noticeOpacity }]}>
            <Text style={styles.locationNoticeText}>
              Please enable background location for better tracking
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
        </View>

        {!permissions?.background && (
          <View style={styles.warningOverlay}>
            <Text style={styles.warningText}>
              Enable background location for better tracking
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
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
  warningOverlay: {
    position: 'absolute',
    bottom: 88,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
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
  warningText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
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
});

export default MapScreen;
