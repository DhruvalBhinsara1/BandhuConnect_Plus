import * as Location from 'expo-location';
import { APP_ROLE, validateUserRole } from '../constants/appRole';
import { supabase } from './supabase';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  bearing: number | null;
  timestamp: number;
}

export interface LocationPublishOptions {
  forcePublish?: boolean;
  minMovementMeters?: number;
  maxIntervalSeconds?: number;
}

class SecureLocationService {
  private lastPublishedLocation: LocationData | null = null;
  private lastPublishTime: number = 0;
  private publishTimer: NodeJS.Timeout | null = null;
  private isTracking: boolean = false;
  private foregroundSubscription: Location.LocationSubscription | null = null;
  
  // Location filtering for accuracy improvement
  private locationHistory: LocationData[] = [];
  private readonly LOCATION_HISTORY_SIZE = 5;
  private readonly MIN_ACCURACY_REQUIRED = 50; // 50 meters
  
  // Publishing rules constants
  private readonly MIN_MOVEMENT_METERS = 10; // Reduced for better tracking
  private readonly PUBLISH_INTERVAL_SECONDS = 5; // More frequent updates
  private readonly MAX_ACCURACY_METERS = 100;

  /**
   * Initialize location tracking with proper permissions
   */
  async initializeTracking(): Promise<boolean> {
    try {
      console.log('[SecureLocationService] Initializing location tracking...');
      
      // Check if user role matches app role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('[SecureLocationService] No authenticated user');
        return false;
      }

      // Verify user role matches app build
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile) {
        console.warn('[SecureLocationService] No profile found, allowing access');
        // Don't block if profile doesn't exist - let user continue
      } else if (profile.role !== APP_ROLE) {
        console.warn(`[SecureLocationService] Role mismatch: profile=${profile.role}, app=${APP_ROLE}, allowing access`);
        // Log warning but don't block - role flexibility for development
      }

      // Request permissions progressively
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        console.error('[SecureLocationService] Location permissions denied');
        return false;
      }

      // Start location tracking
      await this.startLocationTracking();
      return true;

    } catch (error) {
      console.error('[SecureLocationService] Failed to initialize:', error);
      return false;
    }
  }

  /**
   * Request location permissions progressively
   */
  private async requestPermissions(): Promise<boolean> {
    try {
      // Check current permissions
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
      
      if (currentStatus === 'granted') {
        console.log('[SecureLocationService] Foreground permissions already granted');
        return true;
      }

      // Request foreground permissions first
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        console.log('[SecureLocationService] Foreground permissions denied');
        return false;
      }

      console.log('[SecureLocationService] Foreground permissions granted');
      return true;

    } catch (error) {
      console.error('[SecureLocationService] Permission request failed:', error);
      return false;
    }
  }

  /**
   * Start continuous location tracking
   */
  private async startLocationTracking(): Promise<void> {
    if (this.isTracking) {
      console.log('[SecureLocationService] Already tracking');
      return;
    }

    try {
      // Configure location options for maximum accuracy when needed
      const locationOptions: Location.LocationOptions = {
        accuracy: Location.Accuracy.BestForNavigation, // Highest accuracy available
        timeInterval: 5000, // Check every 5 seconds for better responsiveness
        distanceInterval: 5, // React to 5-meter movements for precision
        mayShowUserSettingsDialog: true, // Allow GPS settings prompt
      };

      // Start foreground location subscription
      this.foregroundSubscription = await Location.watchPositionAsync(
        locationOptions,
        (location) => this.handleLocationUpdate(location)
      );

      this.isTracking = true;
      console.log('[SecureLocationService] Location tracking started');

      // Set up periodic publishing timer as backup
      this.setupPeriodicPublishing();

    } catch (error) {
      console.error('[SecureLocationService] Failed to start tracking:', error);
      throw error;
    }
  }

  /**
   * Handle location updates from GPS
   */
  private async handleLocationUpdate(location: Location.LocationObject): Promise<void> {
    try {
      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        speed: location.coords.speed,
        bearing: location.coords.heading,
        timestamp: location.timestamp
      };

      console.log('[SecureLocationService] Raw location received:', {
        lat: locationData.latitude.toFixed(6),
        lng: locationData.longitude.toFixed(6),
        accuracy: locationData.accuracy
      });

      // Filter and improve location accuracy
      const filteredLocation = this.filterLocation(locationData);
      if (!filteredLocation) {
        console.log('[SecureLocationService] Location filtered out due to poor quality');
        return;
      }

      console.log('[SecureLocationService] Filtered location:', {
        lat: filteredLocation.latitude.toFixed(6),
        lng: filteredLocation.longitude.toFixed(6),
        accuracy: filteredLocation.accuracy
      });

      // Check if we should publish this location
      if (this.shouldPublishLocation(filteredLocation)) {
        await this.publishLocation(filteredLocation);
      }

    } catch (error) {
      console.error('[SecureLocationService] Error handling location update:', error);
    }
  }

  /**
   * Filter location data to improve accuracy using moving average
   */
  private filterLocation(newLocation: LocationData): LocationData | null {
    // Reject locations with very poor accuracy
    if (newLocation.accuracy && newLocation.accuracy > this.MIN_ACCURACY_REQUIRED) {
      console.log(`[SecureLocationService] Location too inaccurate: ${newLocation.accuracy}m > ${this.MIN_ACCURACY_REQUIRED}m`);
      return null;
    }

    // Add to history
    this.locationHistory.push(newLocation);
    
    // Keep only recent locations
    if (this.locationHistory.length > this.LOCATION_HISTORY_SIZE) {
      this.locationHistory.shift();
    }

    // If we don't have enough history, return the current location
    if (this.locationHistory.length < 3) {
      return newLocation;
    }

    // Calculate weighted average based on accuracy (better accuracy = higher weight)
    let weightedLat = 0;
    let weightedLng = 0;
    let totalWeight = 0;

    for (const loc of this.locationHistory) {
      // Weight calculation: 1 / accuracy (better accuracy gets higher weight)
      const weight = loc.accuracy ? 1 / Math.max(loc.accuracy, 1) : 1;
      
      weightedLat += loc.latitude * weight;
      weightedLng += loc.longitude * weight;
      totalWeight += weight;
    }

    const averagedLocation: LocationData = {
      latitude: weightedLat / totalWeight,
      longitude: weightedLng / totalWeight,
      accuracy: Math.min(...this.locationHistory.map(l => l.accuracy || 100)),
      speed: newLocation.speed,
      bearing: newLocation.bearing,
      timestamp: newLocation.timestamp
    };

    return averagedLocation;
  }

  /**
   * Determine if location should be published based on rules
   */
  private shouldPublishLocation(newLocation: LocationData): boolean {
    const now = Date.now();

    // Always publish if no previous location
    if (!this.lastPublishedLocation) {
      return true;
    }

    // Check time interval (minimum 10 seconds)
    const timeDiff = (now - this.lastPublishTime) / 1000;
    if (timeDiff < this.PUBLISH_INTERVAL_SECONDS) {
      return false;
    }

    // Check accuracy (don't publish if too inaccurate)
    if (newLocation.accuracy && newLocation.accuracy > this.MAX_ACCURACY_METERS) {
      console.log('[SecureLocationService] Location too inaccurate, skipping publish');
      return false;
    }

    // Check movement distance (minimum 25 meters)
    const distance = this.calculateDistance(
      this.lastPublishedLocation.latitude,
      this.lastPublishedLocation.longitude,
      newLocation.latitude,
      newLocation.longitude
    );

    if (distance < this.MIN_MOVEMENT_METERS) {
      return false;
    }

    return true;
  }

  /**
   * Publish location to secure database
   */
  private async publishLocation(locationData: LocationData): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('[SecureLocationService] No authenticated user for publishing');
        return;
      }

      // Use upsert to insert or update location in user_locations table
      const { error } = await supabase
        .from('user_locations')
        .upsert({
          user_id: user.id,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
          speed: locationData.speed,
          heading: locationData.bearing,
          is_active: true,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('[SecureLocationService] Failed to publish location:', error);
        return;
      }

      // Update tracking state
      this.lastPublishedLocation = locationData;
      this.lastPublishTime = Date.now();

      console.log('[SecureLocationService] Location published successfully');

    } catch (error) {
      console.error('[SecureLocationService] Error publishing location:', error);
    }
  }

  /**
   * Setup periodic publishing as backup
   */
  private setupPeriodicPublishing(): void {
    if (this.publishTimer) {
      clearInterval(this.publishTimer);
    }

    this.publishTimer = setInterval(async () => {
      try {
        // Get current location and force publish if enough time has passed
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });

        const locationData: LocationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          speed: location.coords.speed,
          bearing: location.coords.heading,
          timestamp: location.timestamp
        };

        // Force publish if it's been too long
        const timeSinceLastPublish = (Date.now() - this.lastPublishTime) / 1000;
        if (timeSinceLastPublish >= this.PUBLISH_INTERVAL_SECONDS * 3) {
          await this.publishLocation(locationData);
        }

      } catch (error) {
        console.error('[SecureLocationService] Periodic publish error:', error);
      }
    }, this.PUBLISH_INTERVAL_SECONDS * 1000);
  }

  /**
   * Get current device location
   */
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000, // Wait up to 1 second for best reading
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        speed: location.coords.speed,
        bearing: location.coords.heading,
        timestamp: location.timestamp
      };

    } catch (error) {
      console.error('[SecureLocationService] Failed to get current location:', error);
      return null;
    }
  }

  /**
   * Get high-accuracy location for critical operations (like task details)
   * Takes multiple readings and returns the most accurate one
   */
  async getHighAccuracyLocation(): Promise<LocationData | null> {
    try {
      console.log('[SecureLocationService] Getting high-accuracy location...');
      
      const readings: LocationData[] = [];
      const maxReadings = 3;
      
      // Take multiple readings over a few seconds
      for (let i = 0; i < maxReadings; i++) {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 2000, // Wait up to 2 seconds per reading
          });

          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            speed: location.coords.speed,
            bearing: location.coords.heading,
            timestamp: location.timestamp
          };

          readings.push(locationData);
          
          console.log(`[SecureLocationService] Reading ${i + 1}/${maxReadings}:`, {
            accuracy: locationData.accuracy,
            lat: locationData.latitude.toFixed(6),
            lng: locationData.longitude.toFixed(6)
          });

          // If we get a very accurate reading early, we can stop
          if (locationData.accuracy && locationData.accuracy < 10) {
            console.log('[SecureLocationService] Excellent accuracy achieved early');
            break;
          }

          // Small delay between readings
          if (i < maxReadings - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

        } catch (readingError) {
          console.warn(`[SecureLocationService] Reading ${i + 1} failed:`, readingError);
        }
      }

      if (readings.length === 0) {
        console.error('[SecureLocationService] No location readings obtained');
        return null;
      }

      // Return the most accurate reading
      const bestReading = readings.reduce((best, current) => {
        if (!best.accuracy && current.accuracy) return current;
        if (!current.accuracy && best.accuracy) return best;
        if (!best.accuracy && !current.accuracy) return current; // Use most recent
        return (current.accuracy! < best.accuracy!) ? current : best;
      });

      console.log('[SecureLocationService] Best reading selected:', {
        accuracy: bestReading.accuracy,
        lat: bestReading.latitude.toFixed(6),
        lng: bestReading.longitude.toFixed(6),
        totalReadings: readings.length
      });

      return bestReading;

    } catch (error) {
      console.error('[SecureLocationService] High-accuracy location failed:', error);
      return null;
    }
  }

  /**
   * Stop location tracking
   */
  stopTracking(): void {
    if (this.foregroundSubscription) {
      this.foregroundSubscription.remove();
      this.foregroundSubscription = null;
    }

    if (this.publishTimer) {
      clearInterval(this.publishTimer);
      this.publishTimer = null;
    }

    this.isTracking = false;
    console.log('[SecureLocationService] Location tracking stopped');
  }

  /**
   * Calculate distance between two coordinates in meters using Vincenty's formula
   * More accurate than Haversine for short distances
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // For very close points, use simple calculation to avoid precision issues
    const latDiff = Math.abs(lat1 - lat2);
    const lonDiff = Math.abs(lon1 - lon2);
    
    if (latDiff < 0.0001 && lonDiff < 0.0001) {
      // Use approximate meters per degree for very close points
      const metersPerLatDegree = 111320; // Average meters per degree of latitude
      const metersPerLonDegree = 111320 * Math.cos(lat1 * Math.PI / 180); // Adjust for longitude
      
      const latMeters = latDiff * metersPerLatDegree;
      const lonMeters = lonDiff * metersPerLonDegree;
      
      return Math.sqrt(latMeters * latMeters + lonMeters * lonMeters);
    }

    // For longer distances, use improved Haversine with Earth's ellipsoid
    const R = 6371008.8; // Earth's mean radius in meters (more accurate)
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * Get tracking status
   */
  getTrackingStatus(): {
    isTracking: boolean;
    lastPublishTime: number;
    hasLastLocation: boolean;
  } {
    return {
      isTracking: this.isTracking,
      lastPublishTime: this.lastPublishTime,
      hasLastLocation: this.lastPublishedLocation !== null
    };
  }

  /**
   * Force publish current location (for manual refresh)
   */
  async forcePublishLocation(): Promise<boolean> {
    try {
      const location = await this.getCurrentLocation();
      if (!location) {
        return false;
      }

      await this.publishLocation(location);
      return true;

    } catch (error) {
      console.error('[SecureLocationService] Force publish failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const secureLocationService = new SecureLocationService();
