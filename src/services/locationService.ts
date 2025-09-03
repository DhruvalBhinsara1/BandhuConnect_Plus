import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { LocationData } from '../types';
import { mapService } from './mapService';

const LOCATION_TASK_NAME = 'background-location-task';

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }
  if (data) {
    const { locations } = data as any;
    const location = locations[0];
    if (location) {
      try {
        const locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || undefined,
          timestamp: location.timestamp,
        };
        await locationService.updateLocation(locationData);
      } catch (error) {
        console.error('Failed to update location in background:', error);
      }
    }
  }
});

class LocationService {
  private static instance: LocationService;
  
  private constructor() {}
  
  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async requestPermissions() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const foregroundGranted = status === 'granted';
      
      if (!foregroundGranted) {
        console.log('Foreground location permission denied');
        return { 
          foreground: false, 
          background: false,
          error: 'Location permission not granted'
        };
      }

      // For iOS, check if we have "Always" permission (equivalent to background)
      // For Android, request explicit background permission
      const Platform = require('react-native').Platform;
      let backgroundGranted = false;
      
      if (Platform.OS === 'ios') {
        // On iOS, check if we have "Always" permission
        const currentPermissions = await Location.getForegroundPermissionsAsync();
        backgroundGranted = currentPermissions.status === 'granted' && 
                           (currentPermissions as any).ios?.scope === 'always';
        
        if (!backgroundGranted) {
          // Request "Always" permission on iOS
          const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
          backgroundGranted = backgroundStatus.status === 'granted';
        }
      } else {
        // On Android, request background permission explicitly
        const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
        backgroundGranted = backgroundStatus.status === 'granted';
      }
      
      if (!backgroundGranted) {
        console.log('Background location permission denied');
      }

      return { 
        foreground: foregroundGranted,
        background: backgroundGranted
      };
    } catch (error) {
      // Silent error handling - no console.error that might trigger alerts
      console.log('Location permission request failed:', error instanceof Error ? error.message : error);
      
      // Handle Expo Go limitation gracefully
      if (error instanceof Error && error.message.includes('NSLocation')) {
        console.log('Location permissions not available in Expo Go - use development build for full functionality');
        return { 
          foreground: false, 
          background: false,
          error: 'Location not available in Expo Go. Use development build for location features.'
        };
      }
      
      return { 
        foreground: false, 
        background: false,
        error: error instanceof Error ? error.message : 'Unknown permission error'
      };
    }
  }

  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      console.log('LocationService: Getting current location...');
      
      // Check permissions first
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('LocationService: Foreground permission not granted:', status);
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        altitude: location.coords.altitude || undefined,
        heading: location.coords.heading || undefined,
        speed: location.coords.speed || undefined,
        timestamp: location.timestamp,
      };

      console.log('LocationService: Got location:', locationData);
      return locationData;
    } catch (error) {
      console.log('LocationService: Error getting location:', error instanceof Error ? error.message : error);
      
      // Handle specific iOS location errors gracefully
      if (error instanceof Error) {
        if (error.message.includes('kCLErrorDomain error 0') || 
            error.message.includes('Cannot obtain current location')) {
          console.log('Location services unavailable - GPS may be disabled or no signal');
          return null;
        }
        if (error.message.includes('NSLocation') || 
            error.message.includes('Info.plist')) {
          console.log('Location permission configuration issue - check app.config.js');
          return null;
        }
      }
      
      return null;
    }
  }

  async updateLocation(location: LocationData) {
    try {
      await mapService.updateUserLocation(location);
    } catch (error) {
      console.error('Failed to update location:', error);
      throw error;
    }
  }

  private lastPublishedLocation: LocationData | null = null;
  private lastPublishTime: number = 0;

  async watchPosition(callback: (location: LocationData) => void) {
    try {
      // Check permissions before starting watch
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission not granted for watchPosition');
        return null;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // 5 seconds for responsive UI updates
          distanceInterval: 10, // 10 meters for UI responsiveness
        },
        async (location) => {
          const locationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            altitude: location.coords.altitude,
            heading: location.coords.heading,
            speed: location.coords.speed,
            timestamp: location.timestamp,
          };
          
          // Always update UI immediately for self marker
          callback(locationData);
          
          // Publish to database based on 10s/25m strategy
          const shouldPublish = this.shouldPublishLocation(locationData);
          if (shouldPublish) {
            try {
              await this.updateLocation(locationData);
              this.lastPublishedLocation = locationData;
              this.lastPublishTime = Date.now();
              console.log('Location published to database:', locationData);
            } catch (error) {
              console.error('Failed to update location:', error);
            }
          }
        }
      );

      return {
        remove: () => {
          if (subscription) {
            subscription.remove();
          }
        }
      };
    } catch (error) {
      console.error('Error watching position:', error);
      return null;
    }
  }

  private shouldPublishLocation(newLocation: LocationData): boolean {
    const now = Date.now();
    
    // Always publish on first location or app resume
    if (!this.lastPublishedLocation || (now - this.lastPublishTime) > 60000) {
      return true;
    }
    
    // Publish every 10 seconds minimum
    if ((now - this.lastPublishTime) >= 10000) {
      return true;
    }
    
    // Publish if moved more than 25 meters
    if (this.lastPublishedLocation) {
      const distance = this.calculateDistance(this.lastPublishedLocation, newLocation) * 1000; // Convert to meters
      if (distance >= 25) {
        return true;
      }
    }
    
    return false;
  }

  async startBackgroundLocationUpdates() {
    try {
      const { granted } = await Location.getBackgroundPermissionsAsync();
      if (!granted) {
        console.log('Background location permission not granted');
        return false;
      }

      const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
      if (isRegistered) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }

      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000, // 10 seconds for background (matching foreground strategy)
        distanceInterval: 25, // 25 meters for background (matching foreground strategy)
        foregroundService: {
          notificationTitle: 'BandhuConnect+ Location Tracking',
          notificationBody: 'Tracking your location for volunteer coordination',
        },
      });

      console.log('Background location tracking started with 10s/25m strategy');
      return true;
    } catch (error) {
      console.error('Error starting background location updates:', error);
      return false;
    }
  }

  // Method to force publish location (for app resume, tracking start)
  async forcePublishLocation() {
    try {
      const location = await this.getCurrentLocation();
      if (location) {
        await this.updateLocation(location);
        this.lastPublishedLocation = location;
        this.lastPublishTime = Date.now();
        console.log('Force published location on app resume/tracking start');
        return location;
      }
    } catch (error) {
      console.error('Failed to force publish location:', error);
    }
    return null;
  }

  async stopBackgroundLocationUpdates() {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
      if (isRegistered) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        console.log('Background location tracking stopped');
      }
    } catch (error) {
      console.error('Error stopping background location updates:', error);
    }
  }

  async isBackgroundLocationActive() {
    try {
      return await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    } catch (error) {
      console.error('Error checking background location status:', error);
      return false;
    }
  }

  calculateDistance(point1: LocationData, point2: LocationData): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.latitude)) * 
      Math.cos(this.toRadians(point2.latitude)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async reverseGeocode(latitude: number, longitude: number) {
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (result.length > 0) {
        const address = result[0];
        return {
          street: address.street,
          city: address.city,
          region: address.region,
          country: address.country,
          postalCode: address.postalCode,
          formattedAddress: `${address.street}, ${address.city}, ${address.region}`,
        };
      }
      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }
}

export const locationService = LocationService.getInstance();
export { LOCATION_TASK_NAME };
