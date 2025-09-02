import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useMap } from '../../context/MapContext';
import { useLocation } from '../../context/LocationContext';

const MapScreen: React.FC = () => {
  const { user } = useAuth();
  const { userLocations, loading, refreshLocations } = useMap();
  const { currentLocation, isTracking, isBackgroundTracking, permissions } = useLocation();

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

  const openInMaps = (latitude: number, longitude: number, name: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Alert.alert(
      'Open in Maps',
      `Open ${name}'s location in Google Maps?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open', onPress: () => {
          // This would open in browser in Expo Go
          console.log('Opening maps URL:', url);
        }}
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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

      {/* Current Location */}
      {currentLocation && (
        <View style={styles.currentLocationCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="location" size={20} color="#4285F4" />
            <Text style={styles.cardTitle}>Your Location</Text>
          </View>
          <Text style={styles.coordinates}>
            {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
          </Text>
          <Text style={styles.timestamp}>
            Last updated: {new Date().toLocaleTimeString()}
          </Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.refreshButton} onPress={refreshLocations}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.buttonText}>Refresh Locations</Text>
        </TouchableOpacity>
      </View>

      {/* Auto-tracking Info */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={styles.infoTitle}>Automatic Location Tracking</Text>
        </View>
        <Text style={styles.infoText}>
          Location tracking starts automatically when you log in. Your location is shared with other volunteers for coordination purposes.
        </Text>
        {!permissions?.background && (
          <Text style={styles.warningText}>
            ⚠️ Background location permission not granted. Location will only be tracked when app is open.
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
            <Ionicons name="location-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No active locations found</Text>
            <Text style={styles.emptySubtext}>Users will appear here when they start location tracking</Text>
          </View>
        ) : (
          userLocations.map((location) => (
            <TouchableOpacity
              key={location.location_id}
              style={styles.locationCard}
              onPress={() => openInMaps(location.latitude, location.longitude, location.user_name || 'User')}
            >
              <View style={styles.locationHeader}>
                <View style={styles.userInfo}>
                  <View style={[styles.roleIndicator, { backgroundColor: getRoleColor(location.user_role) }]} />
                  <View>
                    <Text style={styles.userName}>{location.user_name || 'Unknown User'}</Text>
                    <Text style={styles.userRole}>{location.user_role}</Text>
                  </View>
                </View>
                <View style={styles.statusInfo}>
                  <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(location.assignment_info) }]} />
                  <Text style={styles.statusText}>
                    {location.assignment_info?.status || 'available'}
                  </Text>
                </View>
              </View>

              <View style={styles.locationDetails}>
                <View style={styles.coordinatesRow}>
                  <Ionicons name="location-outline" size={16} color="#6B7280" />
                  <Text style={styles.coordinatesText}>
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </Text>
                </View>

                {currentLocation && (
                  <View style={styles.distanceRow}>
                    <Ionicons name="navigate-outline" size={16} color="#6B7280" />
                    <Text style={styles.distanceText}>
                      {formatDistance(
                        currentLocation.latitude,
                        currentLocation.longitude,
                        location.latitude,
                        location.longitude
                      )} away
                    </Text>
                  </View>
                )}

                <View style={styles.timeRow}>
                  <Ionicons name="time-outline" size={16} color="#6B7280" />
                  <Text style={styles.timeText}>
                    {new Date(location.updated_at).toLocaleTimeString()}
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Ionicons name="map-outline" size={16} color="#3B82F6" />
                <Text style={styles.mapText}>Tap to view in maps</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Legend</Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#DC2626' }]} />
            <Text style={styles.legendText}>Admin</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#16A34A' }]} />
            <Text style={styles.legendText}>Volunteer</Text>
          </View>
        </View>
        <View style={styles.legendRow}>
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
    </SafeAreaView>
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
  locationsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  userRole: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#374151',
    textTransform: 'capitalize',
  },
  locationDetails: {
    marginBottom: 12,
  },
  coordinatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#374151',
    fontFamily: 'monospace',
    marginLeft: 8,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 12,
    color: '#374151',
    marginLeft: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  mapText: {
    fontSize: 12,
    color: '#3B82F6',
    marginLeft: 6,
  },
  legend: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
