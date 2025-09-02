import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useMap } from '../../context/MapContext';
import { useLocation } from '../../context/LocationContext';
import { UserLocationData } from '../../services/mapService';

const MapScreen: React.FC = () => {
  const { user } = useAuth();
  const { userLocations, loading, refreshLocations, isTracking, startLocationTracking, stopLocationTracking } = useMap();
  const { currentLocation, permissions } = useLocation();

  const handleStartTracking = async () => {
    if (!permissions?.foreground) {
      Alert.alert(
        'Location Permission Required',
        'Please enable location permissions to use the map tracking feature.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await startLocationTracking();
      Alert.alert('Success', 'Location tracking started successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to start location tracking. Please try again.');
    }
  };

  const handleStopTracking = async () => {
    try {
      await stopLocationTracking();
      Alert.alert('Success', 'Location tracking stopped.');
    } catch (error) {
      Alert.alert('Error', 'Failed to stop location tracking.');
    }
  };

  const getMarkerColor = (location: UserLocationData) => {
    if (location.role === 'admin') return '#FF0000'; // Red
    if (location.role === 'volunteer') {
      return location.assignment_info ? '#00FF00' : '#0000FF'; // Green if assigned, Blue if available
    }
    if (location.role === 'pilgrim') {
      return location.assignment_info ? '#FFA500' : '#808080'; // Orange if has volunteer, Gray if waiting
    }
    return '#808080';
  };

  const getStatusText = (location: UserLocationData) => {
    if (location.role === 'admin') return 'Admin';
    if (location.role === 'volunteer') {
      return location.assignment_info ? `Helping: ${location.assignment_info}` : 'Available';
    }
    if (location.role === 'pilgrim') {
      return location.assignment_info ? `Volunteer: ${location.assignment_info}` : 'Waiting for help';
    }
    return 'Unknown';
  };

  const formatDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Location Tracking</Text>
        <View style={styles.headerControls}>
          <TouchableOpacity
            style={[styles.controlButton, styles.refreshButton]}
            onPress={refreshLocations}
            disabled={loading}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.controlButton,
              isTracking ? styles.stopButton : styles.startButton
            ]}
            onPress={isTracking ? handleStopTracking : handleStartTracking}
          >
            <Ionicons 
              name={isTracking ? "stop" : "play"} 
              size={20} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {userLocations.length} active users • {isTracking ? 'Live Tracking' : 'Tracking Stopped'}
        </Text>
        {currentLocation && (
          <Text style={styles.locationText}>
            Your location: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
          </Text>
        )}
      </View>

      {/* User Locations List */}
      <ScrollView
        style={styles.locationsList}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshLocations} />
        }
      >
        {userLocations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No active users found</Text>
            <Text style={styles.emptySubtext}>
              Start tracking to share your location or wait for others to come online
            </Text>
          </View>
        ) : (
          userLocations.map((location) => (
            <View key={location.user_id} style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <View style={styles.userInfo}>
                  <View 
                    style={[
                      styles.statusDot, 
                      { backgroundColor: getMarkerColor(location) }
                    ]} 
                  />
                  <Text style={styles.userName}>{location.name}</Text>
                  <Text style={styles.userRole}>({location.role})</Text>
                </View>
                {currentLocation && (
                  <Text style={styles.distance}>
                    {formatDistance(
                      currentLocation.latitude,
                      currentLocation.longitude,
                      location.latitude,
                      location.longitude
                    )}
                  </Text>
                )}
              </View>
              
              <Text style={styles.statusInfo}>{getStatusText(location)}</Text>
              
              <View style={styles.locationDetails}>
                <Text style={styles.coordinates}>
                  📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </Text>
                <Text style={styles.timestamp}>
                  🕒 {new Date(location.last_updated).toLocaleTimeString()}
                </Text>
                {location.accuracy && (
                  <Text style={styles.accuracy}>
                    🎯 ±{Math.round(location.accuracy)}m accuracy
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Legend:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF0000' }]} />
            <Text style={styles.legendText}>Admin</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#00FF00' }]} />
            <Text style={styles.legendText}>Volunteer (Assigned)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#0000FF' }]} />
            <Text style={styles.legendText}>Volunteer (Available)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FFA500' }]} />
            <Text style={styles.legendText}>Pilgrim (Has Help)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#808080' }]} />
            <Text style={styles.legendText}>Pilgrim (Waiting)</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerControls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    padding: 12,
    borderRadius: 8,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
  },
  startButton: {
    backgroundColor: '#34C759',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  statusBar: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  locationsList: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 6,
  },
  userRole: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  distance: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  statusInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  locationDetails: {
    gap: 4,
  },
  coordinates: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  accuracy: {
    fontSize: 12,
    color: '#666',
  },
  legend: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});

export default MapScreen;
