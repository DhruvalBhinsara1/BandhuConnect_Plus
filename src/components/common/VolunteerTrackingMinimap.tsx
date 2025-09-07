import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface Location {
  latitude: number;
  longitude: number;
  isStale?: boolean;
  minutesAgo?: number;
}

interface VolunteerTrackingMinimapProps {
  currentLocation: Location | null;
  volunteerLocation: Location | null;
  calculatedDistance: number;
  estimatedArrival: string | null;
  formatDistance: (distance: number) => string;
  variant?: 'dashboard' | 'request'; 
  role?: 'pilgrim' | 'volunteer'; // Add role prop
}

const VolunteerTrackingMinimap: React.FC<VolunteerTrackingMinimapProps> = ({
  currentLocation,
  volunteerLocation,
  calculatedDistance,
  estimatedArrival,
  formatDistance,
  variant = 'request',
  role = 'pilgrim' // Default to pilgrim for backward compatibility
}) => {
  const navigation = useNavigation<any>();

  // Calculate optimal zoom level based on distance presets
  const mapRegion = currentLocation && volunteerLocation ? (() => {
    const latDiff = Math.abs(currentLocation.latitude - volunteerLocation.latitude);
    const lngDiff = Math.abs(currentLocation.longitude - volunteerLocation.longitude);
    
    // Calculate center point
    const centerLat = (currentLocation.latitude + volunteerLocation.latitude) / 2;
    const centerLng = (currentLocation.longitude + volunteerLocation.longitude) / 2;
    
    // Calculate approximate distance in meters for preset selection
    const approximateDistance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111000; // rough conversion to meters
    
    // Distance-based zoom presets
    let zoomLevel;
    if (approximateDistance <= 50) {
      // Very close (0-50m) - tight zoom
      zoomLevel = 0.0008;
    } else if (approximateDistance <= 100) {
      // Close (50-100m) - close zoom  
      zoomLevel = 0.0012;
    } else if (approximateDistance <= 200) {
      // Near (100-200m) - medium-close zoom
      zoomLevel = 0.0018;
    } else if (approximateDistance <= 500) {
      // Medium (200-500m) - medium zoom
      zoomLevel = 0.0025;
    } else if (approximateDistance <= 1000) {
      // Far (500m-1km) - wider zoom
      zoomLevel = 0.004;
    } else {
      // Very far (1km+) - wide zoom
      zoomLevel = 0.006;
    }
    
    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: zoomLevel,
      longitudeDelta: zoomLevel,
    };
  })() : currentLocation ? {
    // Single location view - close street-level detail
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude,
    latitudeDelta: 0.002,
    longitudeDelta: 0.002,
  } : null;

  return (
    <View style={{ marginBottom: 16 }}>
      {/* Clean Header like the dashboard */}
      <View style={{ 
        backgroundColor: role === 'volunteer' ? '#16a34a' : '#16a34a',
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
      }}>
        <Text style={{ 
          color: '#ffffff', 
          fontWeight: '600', 
          fontSize: 14,
        }}>
          🗺️ {role === 'volunteer' ? 'Pilgrim Tracking' : 'Volunteer Tracking'}
        </Text>
        <Text style={{ 
          color: '#ffffff', 
          fontSize: 12,
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
        }}>
          {volunteerLocation?.isStale ? `${volunteerLocation.minutesAgo}m ago` : 'LIVE'}
        </Text>
      </View>
      
      {/* Map Container */}
      <View style={{ 
        height: 200,
        backgroundColor: '#f8fafc',
        overflow: 'hidden',
      }}>
        {/* Map View */}
        {currentLocation && mapRegion && (
          <MapView
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1 }}
            region={mapRegion}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            mapType="standard"
          >
            {/* Route Line (only if other person's location exists) */}
            {volunteerLocation && (
              <Polyline
                coordinates={[
                  {
                    latitude: volunteerLocation.latitude,
                    longitude: volunteerLocation.longitude,
                  },
                  {
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                  }
                ]}
                strokeColor={role === 'volunteer' ? "#16a34a" : "#3b82f6"}
                strokeWidth={3}
                lineDashPattern={[10, 5]}
              />
            )}
            
            {/* Current User Marker */}
            <Marker
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
              title="You"
              description="Your current location"
              pinColor={role === 'volunteer' ? "#3b82f6" : "#ef4444"}
            />
            
            {/* Other Person Marker (only if their location exists) */}
            {volunteerLocation && (
              <Marker
                coordinate={{
                  latitude: volunteerLocation.latitude,
                  longitude: volunteerLocation.longitude,
                }}
                title={role === 'volunteer' ? 'Pilgrim' : 'Volunteer'}
                description={role === 'volunteer' ? 'Pilgrim location' : 'Volunteer location'}
                pinColor={role === 'volunteer' ? "#ef4444" : "#16a34a"}
              />
            )}
          </MapView>
        )}
        
        {/* Loading State */}
        {!currentLocation && (
          <View style={{ 
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#e2e8f0',
          }}>
            <Ionicons name="location-outline" size={32} color="#64748b" />
            <Text style={{ 
              color: '#64748b', 
              fontSize: 14, 
              marginTop: 8,
              textAlign: 'center',
            }}>
              Loading map...
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Info Panel - Positioned below the map */}
      <View style={{ 
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
      }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons name="navigate" size={16} color="#f59e0b" />
            <Text style={{ 
              fontSize: 14,
              fontWeight: '600',
              color: '#1e293b',
              marginLeft: 6,
            }}>
              {formatDistance(calculatedDistance)}
            </Text>
          </View>
          {estimatedArrival && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="time" size={12} color="#059669" />
              <Text style={{ 
                fontSize: 12,
                color: '#059669',
                fontWeight: '500',
                marginLeft: 4,
              }}>
                ~{estimatedArrival}
              </Text>
            </View>
          )}
          {volunteerLocation?.isStale && (
            <Text style={{ 
              fontSize: 10,
              color: '#f59e0b',
              fontStyle: 'italic',
              marginTop: 2,
            }}>
              Last seen {volunteerLocation.minutesAgo}m ago
            </Text>
          )}
        </View>
        
        <TouchableOpacity 
          onPress={() => navigation.navigate('Map')}
          style={{
            backgroundColor: role === 'volunteer' ? '#16a34a' : '#3b82f6',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
          }}
        >
          <Text style={{ 
            color: '#ffffff', 
            fontWeight: '600', 
            fontSize: 12,
          }}>
            View Map
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default VolunteerTrackingMinimap;
