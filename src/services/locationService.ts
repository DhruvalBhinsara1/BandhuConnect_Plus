import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { LocationData } from '../types';

const LOCATION_TASK_NAME = 'background-location-task';

// Background task handler function - defined separately to avoid circular dependency
const handleBackgroundLocationUpdate = async ({ data, error }: any) => {
  if (error) {
    console.error('🔴 Background location task error:', error);
    return;
  }
  if (data) {
    const { locations } = data as any;
    const location = locations[0];
    if (location) {
      try {
        console.log('📍 Background location update received:', {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: new Date(location.timestamp).toISOString()
        });
        
        const locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || null,
          speed: location.coords.speed || null,
          bearing: location.coords.heading || null,
          timestamp: location.timestamp,
        };
        
        // Location updates are handled by secureLocationService automatically
        // when it's initialized and tracking
        console.log('✅ Background location received - handled by secure service');
      } catch (error) {
        console.error('❌ Failed to process background location:', error);
      }
    }
  }
};

// Define the background task with proper error handling
try {
  TaskManager.defineTask(LOCATION_TASK_NAME, handleBackgroundLocationUpdate);
} catch (error) {
  console.error('❌ Failed to define background location task:', error);
}

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
      console.log('📍 Requesting location permissions...');
      
      // Step 1: Request foreground permissions first
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      const foregroundGranted = foregroundStatus === 'granted';
      
      console.log('📍 Foreground permission status:', foregroundStatus);
      
      if (!foregroundGranted) {
        console.log('❌ Foreground location permission denied');
        return { 
          foreground: false, 
          background: false,
          error: 'Location permission not granted. Please enable location access in device settings.'
        };
      }

      // Step 2: Request background permissions
      console.log('🔄 Requesting background location permissions...');
      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      const backgroundGranted = backgroundStatus.status === 'granted';
      
      console.log('📍 Background permission status:', backgroundStatus.status);
      
      // Additional iOS-specific checks
      const Platform = require('react-native').Platform;
      if (Platform.OS === 'ios' && backgroundGranted) {
        const currentPermissions = await Location.getForegroundPermissionsAsync();
        const hasAlwaysPermission = (currentPermissions as any).ios?.scope === 'always';
        console.log('🍎 iOS Always permission:', hasAlwaysPermission);
      }
      
      if (!backgroundGranted) {
        console.log('⚠️ Background location permission denied - app will work with foreground only');
      }

      const result = { 
        foreground: foregroundGranted,
        background: backgroundGranted
      };
      
      console.log('✅ Permission request completed:', result);
      return result;
    } catch (error) {
      console.log('❌ Location permission request failed:', error instanceof Error ? error.message : error);
      
      // Handle Expo Go limitation gracefully
      if (error instanceof Error && error.message.includes('NSLocation')) {
        console.log('⚠️ Location permissions not available in Expo Go - use development build for full functionality');
        return { 
          foreground: false, 
          background: false,
          error: 'Location not available in Expo Go. Use development build for location features.'
        };
      }
      
      // Handle Android permission issues
      if (error instanceof Error && error.message.includes('BACKGROUND_LOCATION')) {
        console.log('⚠️ Android background location permission issue - may need manual settings adjustment');
        return { 
          foreground: true, // Assume foreground works
          background: false,
          error: 'Background location requires manual permission in Android settings'
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
      // Location updates are now handled by secureLocationService
      console.log('Location update delegated to secureLocationService');
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
      console.log('🔄 Starting background location updates...');
      
      // Check background permissions
      const { granted } = await Location.getBackgroundPermissionsAsync();
      if (!granted) {
        console.log('❌ Background location permission not granted');
        return { success: false, error: 'Background location permission not granted' };
      }
      
      console.log('✅ Background location permission granted');

      // Check if task is already registered and stop it
      const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
      console.log('📋 Background task registered status:', isRegistered);
      
      if (isRegistered) {
        console.log('🛑 Stopping existing background location task...');
        try {
          await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        } catch (stopError) {
          console.warn('⚠️ Error stopping existing task (continuing anyway):', stopError);
        }
      }

      // Ensure task is properly defined before starting
      if (!TaskManager.isTaskDefined(LOCATION_TASK_NAME)) {
        console.log('⚠️ Background task not defined, redefining...');
        try {
          TaskManager.defineTask(LOCATION_TASK_NAME, handleBackgroundLocationUpdate);
        } catch (defineError) {
          console.error('❌ Failed to define background task:', defineError);
          return { 
            success: false, 
            error: 'Failed to define background location task. This may be due to app configuration issues.'
          };
        }
      }

      console.log('🚀 Starting background location updates with config...');
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000, // 10 seconds for background (matching foreground strategy)
        distanceInterval: 25, // 25 meters for background (matching foreground strategy)
        deferredUpdatesInterval: 10000, // iOS: defer updates for 10 seconds
        showsBackgroundLocationIndicator: true, // iOS: show location indicator
        foregroundService: {
          notificationTitle: 'BandhuConnect+ Location Tracking',
          notificationBody: 'Tracking your location for volunteer coordination',
          notificationColor: '#3b82f6',
        },
      });

      console.log('✅ Background location tracking started with 10s/25m strategy');
      return { success: true };
    } catch (error) {
      console.error('❌ Error starting background location updates:', error);
      
      // Provide specific error handling for common issues
      let userFriendlyError = 'Unable to start location tracking';
      if (error instanceof Error) {
        if (error.message.includes('TaskManager')) {
          userFriendlyError = 'Location tracking configuration error. Please restart the app.';
        } else if (error.message.includes('permission')) {
          userFriendlyError = 'Location permissions are required for tracking. Please enable in device settings.';
        } else if (error.message.includes('not found')) {
          userFriendlyError = 'Location services not available. Please ensure GPS is enabled.';
        }
      }
      
      return { 
        success: false, 
        error: userFriendlyError
      };
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
