import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mapService } from '../services/mapService';
import { LocationDetails } from '../types';

interface LocationPreviewProps {
  latitude: number;
  longitude: number;
}

export const LocationPreview: React.FC<LocationPreviewProps> = ({ latitude, longitude }) => {
  const [locationDetails, setLocationDetails] = useState<LocationDetails | null>(null);
  const [staticMapUrl, setStaticMapUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocationDetails = async () => {
      try {
        const details = await mapService.getLocationDetails(latitude, longitude);
        setLocationDetails(details);

        // Generate static map URL
        const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=18&size=600x300&scale=2&markers=color:red%7C${latitude},${longitude}&maptype=roadmap&style=feature:poi|visibility:on&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`;
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#4285F4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {staticMapUrl ? (
        <View style={styles.mapPreviewContainer}>
          <Image 
            source={{ uri: staticMapUrl }}
            style={styles.mapImage}
            resizeMode="cover"
          />
        </View>
      ) : null}
      
      <View style={styles.detailsContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="location" size={20} color="#4285F4" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.name}>
            {locationDetails?.landmark || locationDetails?.name || 'Unknown Location'}
          </Text>
          {locationDetails?.locality ? (
            <Text style={styles.locality}>{locationDetails.locality}</Text>
          ) : (
            <Text style={styles.coordinates}>
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: '#e8f0fe',
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
    color: '#1f2937',
    marginBottom: 2,
  },
  locality: {
    fontSize: 12,
    color: '#4b5563',
  },
  coordinates: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
});
