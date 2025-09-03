import { supabase } from './supabase';
import { APP_ROLE, getCurrentRoleConfig, getCounterpartRole } from '../constants/appRole';

export interface UserLocationData {
  userId: string;
  name: string;
  role: 'pilgrim' | 'volunteer' | 'admin';
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  bearing: number | null;
  lastUpdated: string;
  minutesAgo: number;
  isStale: boolean;
}

export interface AssignmentData {
  assignmentId: string;
  counterpartId: string;
  counterpartName: string;
  counterpartRole: 'pilgrim' | 'volunteer' | 'admin';
  isActive: boolean;
}

class SecureMapService {
  private realtimeSubscription: any = null;
  private locationUpdateCallback: ((locations: UserLocationData[]) => void) | null = null;

  /**
   * Get current user's assignment information
   */
  async getMyAssignment(): Promise<AssignmentData | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('[SecureMapService] No authenticated user');
        return null;
      }

      // Use the secure database function
      const { data, error } = await supabase.rpc('get_my_assignment');

      if (error) {
        console.error('[SecureMapService] Failed to get assignment:', error);
        return null;
      }

      if (!data || data.length === 0) {
        console.log('[SecureMapService] No active assignment found');
        return null;
      }

      const assignment = data[0];
      return {
        assignmentId: assignment.assignment_id,
        counterpartId: assignment.counterpart_id,
        counterpartName: assignment.counterpart_name,
        counterpartRole: assignment.counterpart_role,
        isActive: assignment.is_active
      };

    } catch (error) {
      console.error('[SecureMapService] Error getting assignment:', error);
      return null;
    }
  }

  /**
   * Get own location from device (not database)
   */
  async getOwnLocation(): Promise<UserLocationData | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get user profile for name
      const { data: profile } = await supabase
        .from('users')
        .select('name, role')
        .eq('id', user.id)
        .single();

      if (!profile) return null;

      // Import location service here to avoid circular dependency
      const { secureLocationService } = await import('./secureLocationService');
      const currentLocation = await secureLocationService.getCurrentLocation();

      if (!currentLocation) return null;

      return {
        userId: user.id,
        name: profile.name,
        role: profile.role,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracy: currentLocation.accuracy,
        speed: currentLocation.speed,
        bearing: currentLocation.bearing,
        lastUpdated: new Date().toISOString(),
        minutesAgo: 0,
        isStale: false
      };

    } catch (error) {
      console.error('[SecureMapService] Error getting own location:', error);
      return null;
    }
  }

  /**
   * Get counterpart's location from database
   */
  async getCounterpartLocation(): Promise<UserLocationData | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('[SecureMapService] No authenticated user');
        return null;
      }

      // Use the secure database function
      const { data, error } = await supabase.rpc('get_counterpart_location');

      if (error) {
        console.error('[SecureMapService] Failed to get counterpart location:', error);
        return null;
      }

      if (!data || data.length === 0) {
        console.log('[SecureMapService] No counterpart location found');
        return null;
      }

      const location = data[0];

      // Get counterpart user info
      const { data: counterpartProfile } = await supabase
        .from('users')
        .select('name, role')
        .eq('id', location.user_id)
        .single();

      if (!counterpartProfile) {
        console.error('[SecureMapService] Counterpart profile not found');
        return null;
      }

      const minutesAgo = location.minutes_ago || 0;
      const isStale = minutesAgo > 2; // Mark as stale if older than 2 minutes

      return {
        userId: location.user_id,
        name: counterpartProfile.name,
        role: counterpartProfile.role,
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude),
        accuracy: location.accuracy ? parseFloat(location.accuracy) : null,
        speed: location.speed ? parseFloat(location.speed) : null,
        bearing: location.bearing ? parseFloat(location.bearing) : null,
        lastUpdated: location.last_updated,
        minutesAgo,
        isStale
      };

    } catch (error) {
      console.error('[SecureMapService] Error getting counterpart location:', error);
      return null;
    }
  }

  /**
   * Get all relevant locations (self + counterpart)
   */
  async getAllRelevantLocations(): Promise<UserLocationData[]> {
    try {
      const locations: UserLocationData[] = [];

      // Get own location (from device)
      const ownLocation = await this.getOwnLocation();
      if (ownLocation) {
        locations.push(ownLocation);
      }

      // Get counterpart location (from database)
      const counterpartLocation = await this.getCounterpartLocation();
      if (counterpartLocation) {
        locations.push(counterpartLocation);
      }

      console.log('[SecureMapService] Retrieved locations:', locations.length);
      return locations;

    } catch (error) {
      console.error('[SecureMapService] Error getting all locations:', error);
      return [];
    }
  }

  /**
   * Subscribe to real-time location updates for counterpart
   */
  subscribeToLocationUpdates(callback: (locations: UserLocationData[]) => void): void {
    try {
      this.locationUpdateCallback = callback;

      // Subscribe to changes in locations table
      this.realtimeSubscription = supabase
        .channel('location-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'locations'
          },
          async (payload) => {
            console.log('[SecureMapService] Real-time location update:', payload);
            
            // Refresh all locations when any location changes
            const updatedLocations = await this.getAllRelevantLocations();
            callback(updatedLocations);
          }
        )
        .subscribe();

      console.log('[SecureMapService] Subscribed to real-time location updates');

    } catch (error) {
      console.error('[SecureMapService] Failed to subscribe to location updates:', error);
    }
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribeFromLocationUpdates(): void {
    if (this.realtimeSubscription) {
      supabase.removeChannel(this.realtimeSubscription);
      this.realtimeSubscription = null;
      this.locationUpdateCallback = null;
      console.log('[SecureMapService] Unsubscribed from location updates');
    }
  }

  /**
   * Calculate map bounds for given locations
   */
  calculateMapBounds(locations: UserLocationData[]): {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null {
    if (locations.length === 0) return null;

    if (locations.length === 1) {
      // Single location - center on it with reasonable zoom
      return {
        latitude: locations[0].latitude,
        longitude: locations[0].longitude,
        latitudeDelta: 0.01, // ~1km
        longitudeDelta: 0.01
      };
    }

    // Multiple locations - calculate bounds
    const latitudes = locations.map(loc => loc.latitude);
    const longitudes = locations.map(loc => loc.longitude);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Add padding (20% extra space)
    const latDelta = Math.max((maxLat - minLat) * 1.2, 0.005); // Minimum 500m
    const lngDelta = Math.max((maxLng - minLng) * 1.2, 0.005);

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta
    };
  }

  /**
   * Get map center for own location
   */
  async getOwnLocationCenter(): Promise<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null> {
    const ownLocation = await this.getOwnLocation();
    if (!ownLocation) return null;

    return {
      latitude: ownLocation.latitude,
      longitude: ownLocation.longitude,
      latitudeDelta: 0.005, // ~500m zoom
      longitudeDelta: 0.005
    };
  }

  /**
   * Check if user has an active assignment
   */
  async hasActiveAssignment(): Promise<boolean> {
    const assignment = await this.getMyAssignment();
    return assignment !== null && assignment.isActive;
  }

  /**
   * Get assignment status for UI display
   */
  async getAssignmentStatus(): Promise<{
    hasAssignment: boolean;
    counterpartName?: string;
    counterpartRole?: string;
    isActive: boolean;
  }> {
    const assignment = await this.getMyAssignment();
    
    if (!assignment) {
      return {
        hasAssignment: false,
        isActive: false
      };
    }

    return {
      hasAssignment: true,
      counterpartName: assignment.counterpartName,
      counterpartRole: assignment.counterpartRole,
      isActive: assignment.isActive
    };
  }

  /**
   * Refresh all location data
   */
  async refreshLocations(): Promise<UserLocationData[]> {
    console.log('[SecureMapService] Refreshing all location data...');
    return await this.getAllRelevantLocations();
  }
}

// Export singleton instance
export const secureMapService = new SecureMapService();
