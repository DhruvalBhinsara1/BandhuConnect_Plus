import { supabase } from './supabase';
import { LocationData } from '../types';

interface AssignmentInfo {
  request_id: string;
  request_title: string;
  assignment_id: string;
  assignment_status: string;
  pilgrim_name?: string;
  volunteer_name?: string;
}

export interface UserLocationData {
  location_id: string;
  user_id: string;
  user_name: string;
  user_role: 'admin' | 'volunteer' | 'pilgrim';
  latitude: number;
  longitude: number;
  accuracy?: number;
  last_updated: string;
  assignment_info: AssignmentInfo[];
}

type MapBounds = {
  southwest: { latitude: number; longitude: number };
  northeast: { latitude: number; longitude: number };
} | null;

type Coordinates = {
  latitude: number;
  longitude: number;
} | null;

class MapService {
  // Update user's current location in database
  async updateUserLocation(location: LocationData): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await supabase.rpc('update_user_location', {
        p_latitude: location.latitude,
        p_longitude: location.longitude,
        p_accuracy: location.accuracy || null,
        p_heading: location.heading || null,
        p_speed: location.speed || null,
        p_altitude: location.altitude || null,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating user location:', error);
      return { data: null, error };
    }
  }

  // Deactivate user location when going offline
  async deactivateUserLocation(): Promise<{ error: any }> {
    try {
      const { error } = await supabase.rpc('deactivate_user_location');
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error deactivating user location:', error);
      return { error };
    }
  }

  // Get locations for current user's assignments (volunteer/pilgrim view)
  async getAssignmentLocations(): Promise<{ data: UserLocationData[] | null; error: any }> {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const user = userData.user;
      
      if (!user) {
        return { data: [], error: null };
      }

      // For volunteers: Get assigned pilgrims' locations
      if (user.user_metadata.role === 'volunteer') {
        const { data, error } = await supabase
          .rpc('get_volunteer_assigned_locations', {
            p_volunteer_id: user.id
          });
        if (error) throw error;
        return { data, error: null };
      }
      
      // For pilgrims: Get assigned volunteer's location
      else if (user.user_metadata.role === 'pilgrim') {
        const { data, error } = await supabase
          .rpc('get_pilgrim_assigned_locations', {
            p_pilgrim_id: user.id
          });
        if (error) throw error;
        return { data, error: null };
      }

      return { data: [], error: null };
    } catch (error) {
      console.error('Error getting assignment locations:', error);
      return { data: null, error };
    }
  }

  // Subscribe to location updates
  subscribeToLocationUpdates(callback: (payload: any) => void) {
    return supabase
      .channel('user_locations')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_locations',
        },
        callback
      )
      .subscribe();
  }

  // Calculate distance between two points
  calculateDistance(point1: LocationData, point2: LocationData): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    const lat1 = this.toRadians(point1.latitude);
    const lat2 = this.toRadians(point2.latitude);

    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  // Convert degrees to radians
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Get center for map view
  getCenter(locations: UserLocationData[]): Coordinates {
    if (locations.length === 0) return null;

    const sum = locations.reduce(
      (acc, loc) => ({
        latitude: acc.latitude + loc.latitude,
        longitude: acc.longitude + loc.longitude,
      }),
      { latitude: 0, longitude: 0 }
    );

    return {
      latitude: sum.latitude / locations.length,
      longitude: sum.longitude / locations.length,
    };
  }

  // Get bounds for fitting all markers in view
  getBounds(locations: UserLocationData[]): MapBounds {
    if (locations.length === 0) return null;

    let minLat = locations[0].latitude;
    let maxLat = locations[0].latitude;
    let minLng = locations[0].longitude;
    let maxLng = locations[0].longitude;

    locations.forEach(location => {
      minLat = Math.min(minLat, location.latitude);
      maxLat = Math.max(maxLat, location.latitude);
      minLng = Math.min(minLng, location.longitude);
      maxLng = Math.max(maxLng, location.longitude);
    });

    return {
      southwest: { latitude: minLat, longitude: minLng },
      northeast: { latitude: maxLat, longitude: maxLng },
    };
  }
}

export const mapService = new MapService();
