import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, Platform } from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { mapService } from '../services/mapService';
import { LocationDetails } from '../types';
import { useTheme } from '../theme';

interface LocationPreviewProps {
  latitude: number;
  longitude: number;
}

export const LocationPreview: React.FC<LocationPreviewProps> = ({ latitude, longitude }) => {
  const { theme } = useTheme();
  const [locationDetails, setLocationDetails] = useState<LocationDetails | null>(null);
  const [staticMapUrl, setStaticMapUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const windowWidth = Dimensions.get('window').width;

  // Get map URL from OpenStreetMap
  const getMapUrl = (lat: number, lon: number, width: number, height: number) => {
    // Calculate roughly 100m radius in degrees (approximately 0.001 degrees)
    const radius = 0.00001;
    // Using OpenStreetMap with fixed zoom and disabled controls
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lon-radius},${lat-radius},${lon+radius},${lat+radius}&layer=mapnik&marker=${lat},${lon}&show_controls=false&zoom=18`;
  };

  useEffect(() => {
    const fetchLocationDetails = async () => {
      try {
        const details = await mapService.getLocationDetails(latitude, longitude);
        setLocationDetails(details);

        const mapWidth = Math.floor(windowWidth * 0.95);
        const mapHeight = 150;
        const mapUrl = getMapUrl(latitude, longitude, mapWidth, mapHeight);
        setStaticMapUrl(mapUrl);
      } catch (error) {
        console.error('Error fetching location details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocationDetails();
  }, [latitude, longitude]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.surface }]}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={[styles.mapPreviewContainer, { width: windowWidth * 0.95, height: 150 }]}>
        {staticMapUrl ? (
          <>
            <WebView
              source={{ uri: staticMapUrl }}
              style={styles.webView}
              scrollEnabled={false}
              zoomEnabled={false}
              showsZoomControls={false}
              androidZoomControls={false}
              androidLayerType="hardware"
              onError={() => {
                console.error('Error loading map preview');
              }}
            />
            <View style={styles.markerContainer}>
              <Ionicons name="location" size={24} color="#E94235" />
            </View>
          </>
        ) : (
          <View style={[styles.mapPreviewContainer, { alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Map preview unavailable</Text>
          </View>
        )}
      </View>
      <View style={[styles.detailsContainer, { backgroundColor: theme.surface }]}>
        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
          <Ionicons name="location" size={20} color={theme.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.name, { color: theme.textPrimary }]}>
            {locationDetails?.landmark || locationDetails?.name || 'Unknown Location'}
          </Text>
          {locationDetails?.locality ? (
            <Text style={[styles.locality, { color: theme.textSecondary }]}>{locationDetails.locality}</Text>
          ) : (
            <Text style={[styles.coordinates, { color: theme.textSecondary }]}>
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  webView: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  webViewContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  mapPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  } as const,
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0000000F',
  },
  markerContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -12 },
      { translateY: -24 }
    ],
    zIndex: 1,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPreviewContainer: {
    width: '100%',
    height: 150,
    backgroundColor: '#f1f5f9',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  locality: {
    fontSize: 12,
  },
  coordinates: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
