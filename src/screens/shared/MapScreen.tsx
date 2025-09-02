import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAuth } from '../../context/AuthContext';
import { useMap } from '../../context/MapContext';
import { useLocation } from '../../context/LocationContext';

const { width, height } = Dimensions.get('window');

const MapScreen: React.FC = () => {
  const { user } = useAuth();
  const { userLocations, loading, refreshLocations } = useMap();
  const { currentLocation, isTracking, isBackgroundTracking, permissions, getCurrentLocation } = useLocation();
  const [mapRegion, setMapRegion] = useState({
    latitude: 23.1667, // Ujjain Mahakumbh coordinates (23°10'N)
    longitude: 75.7667, // 75°46'E
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const getTrackingStatusText = () => {
    if (!permissions?.foreground) {
      return 'Location permission required';
    }
    if (isBackgroundTracking) {
      return 'Background tracking active';
    }
    if (isTracking) {
      return 'Foreground tracking active';
    }
    return 'Location tracking inactive';
  };

  const getTrackingStatusColor = () => {
    if (!permissions?.foreground) {
      return '#DC2626'; // Red
    }
    if (isBackgroundTracking) {
      return '#16A34A'; // Green
    }
    if (isTracking) {
      return '#F59E0B'; // Yellow
    }
    return '#6B7280'; // Gray
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#DC2626'; // Red
      case 'volunteer': return '#16A34A'; // Green
      case 'pilgrim': return '#2563EB'; // Blue
      default: return '#6B7280'; // Gray
    }
  };

  const getStatusColor = (assignmentInfo?: any) => {
    if (assignmentInfo?.status === 'assigned') return '#FF6B35'; // Orange
    return '#10B981'; // Green for available
  };

  const formatDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  useEffect(() => {
    refreshLocations();
    // Get current location and center map
    getCurrentLocationAndCenter();
  }, []);

  const getCurrentLocationAndCenter = async () => {
    try {
      const location = await getCurrentLocation();
      if (location) {
        setMapRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      console.log('Could not get current location for map centering:', error);
    }
  };

  // Update map region when current location changes (only first time)
  useEffect(() => {
    if (currentLocation && mapRegion.latitude === 23.1667) {
      setMapRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [currentLocation]);

  const onMarkerPress = (location: any) => {
    Alert.alert(
      location.user_name || 'User Location',
      `Role: ${location.user_role}\nStatus: ${location.assignment_info?.status || 'available'}\nLast updated: ${new Date(location.updated_at).toLocaleTimeString()}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
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

      {/* OpenStreetMap - Full Screen */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={mapRegion}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
          mapType="standard"
          loadingEnabled={false}
          pitchEnabled={true}
          rotateEnabled={true}
          scrollEnabled={true}
          zoomEnabled={true}
        >
          {/* Current User Location Marker */}
          {currentLocation && (
            <Marker
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
              title="Your Location"
              description={`Last updated: ${new Date().toLocaleTimeString()}`}
              pinColor="blue"
            />
          )}

          {/* Other Users Markers */}
          {userLocations.map((location) => (
            <Marker
              key={location.location_id}
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title={location.user_name || 'Unknown User'}
              description={`${location.user_role} - ${location.assignment_info?.status || 'available'}`}
              pinColor={getRoleColor(location.user_role)}
              onPress={() => onMarkerPress(location)}
            />
          ))}
        </MapView>

        {/* Map Controls Overlay */}
        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.refreshMapButton} onPress={refreshLocations}>
            <Ionicons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
          
          {currentLocation && (
            <TouchableOpacity 
              style={styles.centerMapButton} 
              onPress={() => setMapRegion({
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              })}
            >
              <Ionicons name="locate" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Info Overlay */}
        {!permissions?.background && (
          <View style={styles.warningOverlay}>
            <Text style={styles.warningOverlayText}>
              ⚠️ Background location permission not granted
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Legend */}
      <View style={styles.bottomLegend}>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#DC2626' }]} />
            <Text style={styles.legendText}>Admin</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#16A34A' }]} />
            <Text style={styles.legendText}>Volunteer</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#2563EB' }]} />
            <Text style={styles.legendText}>Pilgrim</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FF6B35' }]} />
            <Text style={styles.legendText}>Assigned</Text>
          </View>
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
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerStats: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  trackingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
  },
  statsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  currentLocationCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  coordinates: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'monospace',
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  controls: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: '#6B7280',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  infoCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  warningText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 8,
    fontStyle: 'italic',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  mapControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'column',
    gap: 8,
  },
  refreshMapButton: {
    backgroundColor: '#6B7280',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  centerMapButton: {
    backgroundColor: '#3B82F6',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomLegend: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  warningOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    padding: 8,
    borderRadius: 8,
  },
  warningOverlayText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#374151',
  },
});

export default MapScreen;
