import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

interface MiniMapProps {
  latitude?: number;
  longitude?: number;
  userName?: string;
  style?: any;
}

const { width } = Dimensions.get('window');

const MiniMap: React.FC<MiniMapProps> = ({ 
  latitude, 
  longitude, 
  userName,
  style 
}) => {
  const [mapError, setMapError] = useState(false);
  
  // Default to a central location if no coordinates provided
  const defaultLat = 19.0760; // Mumbai coordinates as fallback
  const defaultLon = 72.8777;
  
  const lat = latitude || defaultLat;
  const lon = longitude || defaultLon;

  if (mapError) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={32} color="#f59e0b" />
          <Text style={styles.errorText}>
            Map could not be loaded
          </Text>
          <Text style={styles.coordinates}>
            Coordinates: {lat.toFixed(4)}, {lon.toFixed(4)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {latitude && longitude ? (
        <>
          <Text style={styles.mapTitle}>Last Known Location</Text>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: lat,
              longitude: lon,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
          >
            <Marker
              coordinate={{ latitude: lat, longitude: lon }}
              title={userName || "User Location"}
            >
              <View style={styles.markerContainer}>
                <Ionicons name="person" size={16} color="#ffffff" />
              </View>
            </Marker>
          </MapView>
          <Text style={styles.coordinates}>
            {lat.toFixed(4)}, {lon.toFixed(4)}
          </Text>
        </>
      ) : (
        <View style={styles.noLocationContainer}>
          <Ionicons name="location-outline" size={32} color="#9ca3af" />
          <Text style={styles.noLocationText}>
            Location not available for this user
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  mapTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    padding: 12,
    paddingBottom: 8,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  map: {
    height: 150,
    width: '100%',
  },
  markerContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  coordinates: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    padding: 8,
    backgroundColor: '#f9fafb',
    fontFamily: 'monospace',
  },
  noLocationContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  noLocationText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  errorContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fef3cd',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
});

export default MiniMap;
