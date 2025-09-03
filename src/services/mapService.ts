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

interface LocationDetails {
  name: string;
  address: string;
  locality: string;
  landmark?: string;
  placeId?: string;
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
  locationDetails?: LocationDetails;
  assignment_info: AssignmentInfo[];
}

export interface MapBounds {
  northeast: { latitude: number; longitude: number };
  southwest: { latitude: number; longitude: number };
}

interface MapServiceInterface {
  updateUserLocation(location: LocationData): Promise<{ data: any; error: any }>;
  getAssignmentLocations(): Promise<{ data: UserLocationData[] | null; error: any }>;
  getUserLocation(userId: string): Promise<{ data: UserLocationData | null; error: any }>;
  getVisibleLocations(): Promise<{ data: UserLocationData[] | null; error: any }>;
  subscribeToLocationUpdates(callback: (locations: UserLocationData[]) => void): () => void;
  deactivateUserLocation(): Promise<{ error: any }>;
  getCenter(): Promise<{ latitude: number; longitude: number; error: any }>;
  getBounds(): Promise<{ bounds: MapBounds; error: any }>;
}

class MapService implements MapServiceInterface {
  private locationSubscription: any = null;

  async updateUserLocation(location: LocationData): Promise<{ data: any; error: any }> {
    try {
      // Check if user is authenticated before attempting location update
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.session?.user) {
        console.log('User not authenticated, skipping location update');
        return { data: null, error: null }; // Silently skip if not authenticated
      }

      const { data, error } = await supabase.rpc('update_user_location', {
        p_latitude: location.latitude,
        p_longitude: location.longitude,
        p_accuracy: location.accuracy || null,
        p_altitude: location.altitude || null,
        p_heading: location.heading || null,
        p_speed: location.speed || null
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating user location:', error);
      return { data: null, error };
    }
  }

  async getAssignmentLocations(): Promise<{ data: UserLocationData[] | null; error: any }> {
    try {
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (!session?.session?.user) {
        return { data: [], error: null };
      }

      const user = session.session.user;
      const role = user.user_metadata.role;

      let data;
      let error;

      if (role === 'volunteer') {
        // Volunteers see pilgrim locations (people they can help)
        ({ data, error } = await supabase.rpc('get_pilgrim_locations_for_volunteer', {
          p_volunteer_id: user.id
        }));
      } else if (role === 'pilgrim') {
        // Pilgrims see volunteer locations (people who can help them)
        ({ data, error } = await supabase.rpc('get_volunteer_locations_for_pilgrim', {
          p_pilgrim_id: user.id
        }));
      } else if (role === 'admin') {
        // Admins see all locations
        ({ data, error } = await supabase.rpc('get_all_active_locations'));
      }

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error getting assignment locations:', error);
      return { data: null, error };
    }
  }

  async getUserLocation(userId: string): Promise<{ data: UserLocationData | null; error: any }> {
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
          users!inner(name, role)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      const userLocation: UserLocationData = {
        location_id: data.id,
        user_id: data.user_id,
        user_name: data.users[0]?.name || 'Unknown User',
        user_role: data.users[0]?.role || 'pilgrim',
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        last_updated: data.last_updated,
        assignment_info: []
      };

      return { data: userLocation, error: null };
    } catch (error) {
      console.error('Error getting user location:', error);
      return { data: null, error };
    }
  }

  async getVisibleLocations(): Promise<{ data: UserLocationData[] | null; error: any }> {
    return this.getAssignmentLocations();
  }

  subscribeToLocationUpdates(callback: (locations: UserLocationData[]) => void): () => void {
    if (this.locationSubscription) {
      this.locationSubscription.unsubscribe();
    }

    this.locationSubscription = supabase
      .channel('realtime-location-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_locations',
          filter: 'is_active=eq.true'
        },
        async (payload) => {
          console.log('Real-time location change detected:', payload);
          
          // Get fresh assignment locations after any change
          const { data, error } = await this.getAssignmentLocations();
          if (!error && data) {
            console.log('Broadcasting updated locations:', data.length);
            callback(data);
          }
        }
      )
      .subscribe((status) => {
        console.log('Location subscription status:', status);
      });

    return () => {
      if (this.locationSubscription) {
        this.locationSubscription.unsubscribe();
        this.locationSubscription = null;
      }
    };
  }

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

  async getCenter(): Promise<{ latitude: number; longitude: number; error: any }> {
    try {
      const { data, error } = await this.getAssignmentLocations();
      if (error) throw error;
      
      if (!data || data.length === 0) {
        // Default to India's center if no locations available
        return { latitude: 20.5937, longitude: 78.9629, error: null };
      }

      // Calculate the center point of all locations
      const totalLat = data.reduce((sum, loc) => sum + loc.latitude, 0);
      const totalLong = data.reduce((sum, loc) => sum + loc.longitude, 0);
      const count = data.length;

      return {
        latitude: totalLat / count,
        longitude: totalLong / count,
        error: null
      };
    } catch (error) {
      console.error('Error getting map center:', error);
      // Default to India's center on error
      return { latitude: 20.5937, longitude: 78.9629, error };
    }
  }

  async getLocationDetails(latitude: number, longitude: number): Promise<LocationDetails | null> {
    try {
      // Use OpenStreetMap's Nominatim service (free, no API key needed)
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'BandhuConnect+ App' // Required by Nominatim's usage policy
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch location details');
      }

      const data = await response.json();
      
      // Extract relevant information from Nominatim response
      const locationDetails: LocationDetails = {
        name: data.display_name || 'Unknown Location',
        address: data.display_name || '',
        locality: data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || '',
        landmark: data.address?.amenity || data.address?.building || '',
        placeId: data.place_id?.toString() || ''
      };

      return locationDetails;
    } catch (error) {
      console.error('Error getting location details:', error);
      // Return a basic location object instead of null
      return {
        name: 'Unknown Location',
        address: `${latitude}, ${longitude}`,
        locality: '',
        landmark: '',
        placeId: ''
      };
    }
  }

  async getBounds(): Promise<{ bounds: MapBounds; error: any }> {
    try {
      const { data, error } = await this.getAssignmentLocations();
      if (error) throw error;

      if (!data || data.length === 0) {
        // Default bounds covering most of India
        return {
          bounds: {
            northeast: { latitude: 35.5, longitude: 97.5 },  // Roughly covers northern and eastern extremes
            southwest: { latitude: 6.5, longitude: 68.5 }   // Roughly covers southern and western extremes
          },
          error: null
        };
      }

      // Find min and max coordinates
      const lats = data.map(loc => loc.latitude);
      const longs = data.map(loc => loc.longitude);

      const maxLat = Math.max(...lats);
      const minLat = Math.min(...lats);
      const maxLong = Math.max(...longs);
      const minLong = Math.min(...longs);

      // Add padding to bounds (about 10% of the range)
      const latPadding = (maxLat - minLat) * 0.1;
      const longPadding = (maxLong - minLong) * 0.1;

      return {
        bounds: {
          northeast: {
            latitude: maxLat + latPadding,
            longitude: maxLong + longPadding
          },
          southwest: {
            latitude: minLat - latPadding,
            longitude: minLong - longPadding
          }
        },
        error: null
      };
    } catch (error) {
      console.error('Error getting map bounds:', error);
      // Default bounds on error
      return {
        bounds: {
          northeast: { latitude: 35.5, longitude: 97.5 },
          southwest: { latitude: 6.5, longitude: 68.5 }
        },
        error
      };
    }
  }
}

// Create and export singleton instance
export const mapService = new MapService();
