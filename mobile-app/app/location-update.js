import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function LocationUpdateScreen() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [volunteer, setVolunteer] = useState(null);

  useEffect(() => {
    getCurrentLocation();
    fetchVolunteerData();
  }, []);

  const fetchVolunteerData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setVolunteer(profile);
    } catch (error) {
      console.error('Error fetching volunteer data:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      // Simplified location - no GPS dependency
      setLocation({
        latitude: 28.6139, // Delhi coordinates as default
        longitude: 77.2090,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setLoading(false);
    }
  };

  const updateLocationInDatabase = async () => {
    if (!location || !volunteer) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          lat: location.latitude,
          lng: location.longitude,
          updated_at: new Date().toISOString()
        })
        .eq('id', volunteer.id);

      if (error) throw error;

      Alert.alert(
        'Location Updated', 
        'Your location has been updated successfully!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error updating location:', error);
      Alert.alert('Error', 'Failed to update location in database');
    } finally {
      setUpdating(false);
    }
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Update Location</Text>
        <Text style={styles.subtitle}>Tap on the map to set your location</Text>
      </View>

      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapPlaceholderText}>🗺️ Location Input</Text>
        <Text style={styles.mapSubtext}>Enter your coordinates manually</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Latitude:</Text>
          <TextInput
            style={styles.input}
            value={location?.latitude?.toString() || ''}
            onChangeText={(text) => setLocation({...location, latitude: parseFloat(text) || 0})}
            placeholder="28.6139"
            placeholderTextColor="#666"
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Longitude:</Text>
          <TextInput
            style={styles.input}
            value={location?.longitude?.toString() || ''}
            onChangeText={(text) => setLocation({...location, longitude: parseFloat(text) || 0})}
            placeholder="77.2090"
            placeholderTextColor="#666"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.controls}>
        <View style={styles.coordinatesContainer}>
          <Text style={styles.coordinatesText}>
            📍 Lat: {location?.latitude?.toFixed(6) || 'Not set'}
          </Text>
          <Text style={styles.coordinatesText}>
            📍 Lng: {location?.longitude?.toFixed(6) || 'Not set'}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={getCurrentLocation}
            disabled={loading}
          >
            <Text style={styles.buttonText}>🔄 Refresh Location</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.updateButton, { opacity: updating ? 0.5 : 1 }]} 
            onPress={updateLocationInDatabase}
            disabled={updating || !location}
          >
            <Text style={styles.buttonText}>
              {updating ? '⏳ Updating...' : '✅ Update Location'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>❌ Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#1E1E1E',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#B3B3B3',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  mapPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  mapSubtext: {
    color: '#B3B3B3',
    fontSize: 14,
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  controls: {
    backgroundColor: '#1E1E1E',
    padding: 20,
  },
  coordinatesContainer: {
    backgroundColor: '#2C2C2E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  coordinatesText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    gap: 10,
  },
  refreshButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  updateButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#666',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
