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
  assigned: boolean;
}

class SecureMapService {
  private realtimeSubscription: any = null;
  private assignmentSubscription: any = null;
  private counterpartLocationSubscription: any = null;
  private locationUpdateCallback: ((locations: UserLocationData[]) => void) | null = null;
  private assignmentUpdateCallback: ((assignment: AssignmentData | null) => void) | null = null;
  private counterpartLocationCallback: ((location: UserLocationData | null) => void) | null = null;

  /**
   * Get current user's assignment information with error handling
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
        throw new Error(`Assignment fetch failed: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.log('[SecureMapService] No assignment found');
        return null;
      }

      const assignment = data[0];
      
      // Validate assignment data structure
      if (!assignment.assignment_id || !assignment.counterpart_id) {
        console.error('[SecureMapService] Invalid assignment data structure:', assignment);
        throw new Error('Invalid assignment data structure');
      }

      return {
        assignmentId: assignment.assignment_id,
        counterpartId: assignment.counterpart_id,
        counterpartName: assignment.counterpart_name,
        counterpartRole: assignment.counterpart_role,
        isActive: assignment.is_active,
        assigned: assignment.assigned || false
      };

    } catch (error) {
      console.error('[SecureMapService] Error getting assignment:', error);
      return null;
    }
  }

  /**
   * Subscribe to assignment changes with state-driven logic
   */
  subscribeToAssignmentChanges(callback: (assignment: AssignmentData | null) => void): void {
    this.assignmentUpdateCallback = callback;
    
    this.assignmentSubscription = supabase
      .channel('assignment-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments'
        },
        async () => {
          try {
            const assignment = await this.getMyAssignment();
            this.assignmentUpdateCallback?.(assignment);
          } catch (error) {
            console.error('[SecureMapService] Assignment update failed:', error);
            this.assignmentUpdateCallback?.(null);
          }
        }
      )
      .subscribe((status) => {
        console.log('[SecureMapService] Assignment subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[SecureMapService] Successfully subscribed to assignment updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[SecureMapService] Assignment subscription failed');
          // Attempt reconnection after delay
          setTimeout(() => this.subscribeToAssignmentChanges(callback), 5000);
        }
      });
  }

  /**
   * Subscribe to counterpart location updates when assigned
   */
  subscribeToCounterpartLocation(
    counterpartId: string,
    callback: (location: UserLocationData | null) => void
  ): void {
    this.counterpartLocationCallback = callback;
    
    this.counterpartLocationSubscription = supabase
      .channel(`location-${counterpartId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_locations',
          filter: `user_id=eq.${counterpartId}`
        },
        async (payload) => {
          try {
            const newData = payload.new as any;
            if (newData && newData.is_active) {
              // Get full counterpart location with proper data
              const counterpartLocation = await this.getCounterpartLocation();
              this.counterpartLocationCallback?.(counterpartLocation);
            } else {
              this.counterpartLocationCallback?.(null);
            }
          } catch (error) {
            console.error('[SecureMapService] Counterpart location update failed:', error);
            this.counterpartLocationCallback?.(null);
          }
        }
      )
      .subscribe((status) => {
        console.log('[SecureMapService] Counterpart location subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log(`[SecureMapService] Successfully subscribed to counterpart ${counterpartId} location`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[SecureMapService] Counterpart ${counterpartId} location subscription failed`);
          // Attempt reconnection after delay
          setTimeout(() => this.subscribeToCounterpartLocation(counterpartId, callback), 5000);
        }
      });
  }

  /**
   * Unsubscribe from assignment changes
   */
  unsubscribeFromAssignmentChanges(): void {
    if (this.assignmentSubscription) {
      this.assignmentSubscription.unsubscribe();
      this.assignmentSubscription = null;
    }
    this.assignmentUpdateCallback = null;
  }

  /**
   * Unsubscribe from counterpart location updates
   */
  unsubscribeFromCounterpartLocation(): void {
    if (this.counterpartLocationSubscription) {
      this.counterpartLocationSubscription.unsubscribe();
      this.counterpartLocationSubscription = null;
    }
    this.counterpartLocationCallback = null;
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
        .from('profiles')
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
   * Get counterpart's location from database (only if assignment is active and assigned)
   */
  async getCounterpartLocation(): Promise<UserLocationData | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('[SecureMapService] No authenticated user');
        return null;
      }

      // First check if there's an active assignment with assigned=true
      const assignment = await this.getMyAssignment();
      if (!assignment || !assignment.isActive || !assignment.assigned) {
        console.log('[SecureMapService] No active assignment or not assigned - not fetching counterpart location');
        return null;
      }

      // Use the secure database function
      const { data, error } = await supabase.rpc('get_counterpart_location');

      if (error) {
        console.log('[SecureMapService] Failed to get counterpart location (gracefully handled):', error.message);
        return null;
      }

      if (!data || data.length === 0) {
        console.log('[SecureMapService] No counterpart location found');
        return null;
      }

      const location = data[0];

      // Get counterpart user info
      const { data: counterpartProfile } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', location.user_id)
        .single();

      if (!counterpartProfile) {
        console.log('[SecureMapService] Counterpart profile not found (gracefully handled)');
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
   * Get all relevant locations (self + counterpart only if assignment is active and assigned)
   */
  async getAllRelevantLocations(): Promise<UserLocationData[]> {
    try {
      const locations: UserLocationData[] = [];

      // Always get own location
      const ownLocation = await this.getOwnLocation();
      if (ownLocation) {
        locations.push(ownLocation);
      }

      // Only get counterpart location if there's an active assignment with assigned=true
      const assignment = await this.getMyAssignment();
      if (assignment && assignment.isActive && assignment.assigned) {
        // Check if assignment status is not completed
        const { data: assignmentDetails } = await supabase
          .from('assignments')
          .select('status')
          .eq('id', assignment.assignmentId)
          .single();

        if (assignmentDetails && assignmentDetails.status !== 'completed') {
          const counterpartLocation = await this.getCounterpartLocation();
          if (counterpartLocation) {
            locations.push(counterpartLocation);
          }
        } else {
          console.log('[SecureMapService] Assignment completed - showing only own location');
        }
      } else {
        console.log('[SecureMapService] No active assignment or not assigned - showing only own location');
      }

      console.log('[SecureMapService] Retrieved locations:', locations.length, '(own + counterpart if assigned)');
      return locations;

    } catch (error) {
      console.error('[SecureMapService] Error getting all locations:', error);
      // Always return own location even if there's an error
      const ownLocation = await this.getOwnLocation();
      return ownLocation ? [ownLocation] : [];
    }
  }

  /**
   * Subscribe to real-time location updates for counterpart
   */
  subscribeToLocationUpdates(callback: (locations: UserLocationData[]) => void): void {
    try {
      this.locationUpdateCallback = callback;

      // Subscribe to changes in user_locations table (correct table name)
      this.realtimeSubscription = supabase
        .channel('location-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_locations'
          },
          async (payload) => {
            console.log('[SecureMapService] Real-time location update:', payload);
            
            // Refresh all locations when any location changes
            const updatedLocations = await this.getAllRelevantLocations();
            callback(updatedLocations);
          }
        )
        .subscribe((status) => {
          console.log('[SecureMapService] Location subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('[SecureMapService] Successfully subscribed to location updates');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[SecureMapService] Location subscription failed');
            // Attempt reconnection after delay
            setTimeout(() => this.subscribeToLocationUpdates(callback), 5000);
          }
        });

    } catch (error) {
      console.error('[SecureMapService] Failed to subscribe to location updates:', error);
    }
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribeFromLocationUpdates(): void {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
      this.realtimeSubscription = null;
    }
    this.locationUpdateCallback = null;
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup(): void {
    this.unsubscribeFromLocationUpdates();
    this.unsubscribeFromAssignmentChanges();
    this.unsubscribeFromCounterpartLocation();
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
   * Get map center for own location with 200m zoom radius
   */
  async getOwnLocationCenter(): Promise<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null> {
    const ownLocation = await this.getOwnLocation();
    if (!ownLocation) return null;

    // Calculate delta for 200m radius (400m total diameter)
    // 1 degree latitude ≈ 111,000 meters
    // For 400m total view: 400/111000 ≈ 0.0036
    const radiusDelta = 0.0036;

    return {
      latitude: ownLocation.latitude,
      longitude: ownLocation.longitude,
      latitudeDelta: radiusDelta,
      longitudeDelta: radiusDelta
    };
  }

  /**
   * Check if user has an active assignment with assigned=true
   */
  async hasActiveAssignment(): Promise<boolean> {
    const assignment = await this.getMyAssignment();
    return assignment !== null && assignment.isActive && assignment.assigned;
  }

  /**
   * Get assignment status for UI display
   */
  async getAssignmentStatus(): Promise<{
    hasAssignment: boolean;
    counterpartName?: string;
    counterpartRole?: string;
    isActive: boolean;
    assigned: boolean;
    statusMessage: string;
  }> {
    try {
      const assignment = await this.getMyAssignment();
      
      if (!assignment) {
        return {
          hasAssignment: false,
          isActive: false,
          assigned: false,
          statusMessage: 'No active assignments'
        };
      }

      if (!assignment.isActive) {
        return {
          hasAssignment: true,
          counterpartName: assignment.counterpartName,
          counterpartRole: assignment.counterpartRole,
          isActive: false,
          assigned: assignment.assigned,
          statusMessage: `Task with ${assignment.counterpartName} completed. You are no longer tracking.`
        };
      }

      if (!assignment.assigned) {
        return {
          hasAssignment: true,
          counterpartName: assignment.counterpartName,
          counterpartRole: assignment.counterpartRole,
          isActive: true,
          assigned: false,
          statusMessage: `Assignment exists but not assigned to ${assignment.counterpartName}`
        };
      }

      return {
        hasAssignment: true,
        counterpartName: assignment.counterpartName,
        counterpartRole: assignment.counterpartRole,
        isActive: true,
        assigned: true,
        statusMessage: `Tracking ${assignment.counterpartName}`
      };
    } catch (error) {
      console.error('[SecureMapService] Error getting assignment status:', error);
      return {
        hasAssignment: false,
        isActive: false,
        assigned: false,
        statusMessage: 'Unable to fetch assignment status'
      };
    }
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
