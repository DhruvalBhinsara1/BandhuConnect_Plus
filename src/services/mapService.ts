import { supabase } from './supabase';
import { LocationData } from '../types';

export interface UserLocationData {
  location_id: string;
  user_id: string;
  user_name: string;
  user_role: 'admin' | 'volunteer' | 'pilgrim';
  latitude: number;
  longitude: number;
  accuracy?: number;
  last_updated: string;
  assignment_info: Array<{
    request_id: string;
    request_title: string;
    assignment_id: string;
    assignment_status: string;
    pilgrim_name?: string;
    volunteer_name?: string;
  }>;
}

export class MapService {
  // Update user's current location in database
  async updateUserLocation(location: LocationData) {
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
  async deactivateUserLocation() {
    try {
      const { error } = await supabase.rpc('deactivate_user_location');
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error deactivating user location:', error);
      return { error };
    }
  }

  // Get all active locations (admin view)
  async getAllActiveLocations(): Promise<{ data: UserLocationData[] | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_all_active_locations');
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error getting all active locations:', error);
      return { data: null, error };
    }
  }

  // Get locations for current user's assignments (volunteer/pilgrim view)
  async getAssignmentLocations(): Promise<{ data: UserLocationData[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('user_locations')
        .select(`
          id,
          user_id,
          latitude,
          longitude,
          accuracy,
          last_updated,
          profiles!user_locations_user_id_fkey(name, role)
        `)
        .eq('is_active', true)
        .gte('last_updated', new Date(Date.now() - 10 * 60 * 1000).toISOString()); // Last 10 minutes

      if (error) throw error;

      // Transform data to match UserLocationData interface
      const transformedData: UserLocationData[] = (data || []).map((item: any) => ({
        location_id: item.id,
        user_id: item.user_id,
        user_name: item.profiles?.name || 'Unknown',
        user_role: item.profiles?.role || 'pilgrim',
        latitude: item.latitude,
        longitude: item.longitude,
        accuracy: item.accuracy,
        last_updated: item.last_updated,
        assignment_info: []
      }));

      return { data: transformedData, error: null };
    } catch (error) {
      console.error('Error getting assignment locations:', error);
      return { data: null, error };
    }
  }

  // Subscribe to location updates
  subscribeToLocationUpdates(callback: (payload: any) => void) {
    return supabase
      .channel('user_locations')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'user_locations' },
        callback
      )
      .subscribe();
  }

  // Calculate distance between two points
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

  // Get bounds for fitting all markers in view
  getBounds(locations: UserLocationData[]) {
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

  // Get center point of multiple locations
  getCenter(locations: UserLocationData[]) {
    if (locations.length === 0) return null;

    const totalLat = locations.reduce((sum, loc) => sum + loc.latitude, 0);
    const totalLng = locations.reduce((sum, loc) => sum + loc.longitude, 0);

    return {
      latitude: totalLat / locations.length,
      longitude: totalLng / locations.length,
    };
  }
}

export const mapService = new MapService();
