import { supabase } from './supabase';
import { LocationData } from '../types';
import Constants from 'expo-constants';

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
  isPlaceholder?: boolean; // Flag for users without location data
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
      console.log('🔄 MapService.updateUserLocation: Starting location update', {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: new Date().toISOString()
      });
      
      // Check if user is authenticated before attempting location update
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ MapService.updateUserLocation: Session error:', sessionError);
        return { data: null, error: sessionError };
      }
      
      if (!session?.session?.user) {
        console.log('⚠️ MapService.updateUserLocation: User not authenticated, skipping location update');
        return { data: null, error: null }; // Silently skip if not authenticated
      }

      console.log('✅ MapService.updateUserLocation: User authenticated, calling RPC function');
      const { data, error } = await supabase.rpc('update_user_location', {
        p_latitude: location.latitude,
        p_longitude: location.longitude,
        p_accuracy: location.accuracy || null,
        p_altitude: location.altitude || null,
        p_heading: location.heading || null,
        p_speed: location.speed || null
      });

      if (error) {
        console.error('❌ MapService.updateUserLocation: RPC error:', error);
        throw error;
      }
      
      console.log('✅ MapService.updateUserLocation: Location updated successfully', data);
      return { data, error: null };
    } catch (error) {
      console.error('❌ MapService.updateUserLocation: Unexpected error:', error);
      return { data: null, error };
    }
  }

  async getAssignmentLocations(): Promise<{ data: UserLocationData[] | null; error: any }> {
    try {
      console.log('🔍 MapService.getAssignmentLocations: Starting location fetch');
      
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('❌ MapService.getAssignmentLocations: Session error:', sessionError);
        throw sessionError;
      }

      if (!session?.session?.user) {
        console.log('⚠️ MapService.getAssignmentLocations: No user session found');
        return { data: [], error: null };
      }

      const user = session.session.user;
      
      // Use hardcoded app role from config instead of database lookup to avoid role mismatch issues
      const userRole = Constants.expoConfig?.extra?.appRole || 'pilgrim';
      console.log('🎯 MapService.getAssignmentLocations: Using hardcoded app role:', userRole, 'for user:', user.id);

      let data;
      let error;
      let fallbackData = [];

      if (userRole === 'volunteer') {
        // Volunteers see pilgrim locations (people they can help)
        console.log('🟢 MapService.getAssignmentLocations: VOLUNTEER - Calling get_pilgrim_locations_for_volunteer');
        ({ data, error } = await supabase.rpc('get_pilgrim_locations_for_volunteer', {
          p_volunteer_id: user.id
        }));
        console.log('📊 MapService.getAssignmentLocations: VOLUNTEER RPC result:', { 
          dataCount: data?.length || 0, 
          error: error,
          data: data 
        });
        
        // If function doesn't exist, fall back to basic query
        if (error && (error.message?.includes('function') || error.code === '42883')) {
          console.log('⚠️ MapService.getAssignmentLocations: VOLUNTEER - Function not found, using fallback query');
          ({ data, error } = await this.getFallbackAssignmentLocations(user.id, userRole));
        }
        
      } else if (userRole === 'pilgrim') {
        // Pilgrims see volunteer locations (people who can help them)
        console.log('🔴 MapService.getAssignmentLocations: PILGRIM - Calling get_volunteer_locations_for_pilgrim');
        ({ data, error } = await supabase.rpc('get_volunteer_locations_for_pilgrim', {
          p_pilgrim_id: user.id
        }));
        console.log('📊 MapService.getAssignmentLocations: PILGRIM RPC result:', { 
          dataCount: data?.length || 0, 
          error: error,
          data: data 
        });
        
        // If function doesn't exist, fall back to basic query
        if (error && (error.message?.includes('function') || error.code === '42883')) {
          console.log('⚠️ MapService.getAssignmentLocations: PILGRIM - Function not found, using fallback query');
          ({ data, error } = await this.getFallbackAssignmentLocations(user.id, userRole));
        }
        
      } else if (userRole === 'admin') {
        // Admins see all locations
        console.log('🔵 MapService.getAssignmentLocations: ADMIN - Calling get_all_active_locations');
        ({ data, error } = await supabase.rpc('get_all_active_locations'));
        console.log('📊 MapService.getAssignmentLocations: ADMIN RPC result:', { 
          dataCount: data?.length || 0, 
          error: error,
          data: data 
        });
        
        // If function doesn't exist, fall back to basic query
        if (error && (error.message?.includes('function') || error.code === '42883')) {
          console.log('⚠️ MapService.getAssignmentLocations: ADMIN - Function not found, using fallback query');
          ({ data, error } = await this.getFallbackAllLocations());
        }
      } else {
        console.error('❌ MapService.getAssignmentLocations: Invalid role:', userRole);
        return { data: [], error: 'No valid user role found' };
      }

      if (error) {
        console.error('❌ MapService.getAssignmentLocations: Final error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          fullError: error
        });
        return { data: [], error };
      }
      
      // Process location data and mark placeholders
      const locationData = data || [];
      console.log('🔧 MapService.getAssignmentLocations: Processing location data:', locationData);
      
      const processedData = locationData.map(location => {
        const processed = {
          ...location,
          isPlaceholder: location.assignment_info?.is_placeholder || (location.latitude === 0 && location.longitude === 0)
        };
        console.log('📍 MapService.getAssignmentLocations: Processed location:', {
          user_name: processed.user_name,
          user_role: processed.user_role,
          latitude: processed.latitude,
          longitude: processed.longitude,
          isPlaceholder: processed.isPlaceholder
        });
        return processed;
      });
      
      console.log('✅ MapService.getAssignmentLocations: Returning', processedData.length, 'locations');
      return { data: processedData, error: null };
    } catch (error) {
      console.error('❌ MapService.getAssignmentLocations: Unexpected error:', {
        message: error.message,
        stack: error.stack,
        fullError: error
      });
      return { data: [], error };
    }
  }

  // Fallback method when database functions don't exist
  private async getFallbackAssignmentLocations(userId: string, role: string): Promise<{ data: UserLocationData[] | null; error: any }> {
    try {
      console.log('🔄 MapService.getFallbackAssignmentLocations: Using fallback query for role:', role, 'userId:', userId);
      
      if (role === 'volunteer') {
        // Get assigned pilgrims' locations
        const { data, error } = await supabase
          .from('user_locations')
          .select(`
            id,
            user_id,
            latitude,
            longitude,
            accuracy,
            last_updated,
            profiles!inner(name, role)
          `)
          .eq('is_active', true)
          .eq('profiles.role', 'pilgrim');
          
        if (error) throw error;
        
        return {
          data: data?.map(loc => ({
            location_id: loc.id,
            user_id: loc.user_id,
            user_name: (loc.profiles as any)?.name || 'Unknown',
            user_role: 'pilgrim' as const,
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy: loc.accuracy,
            last_updated: loc.last_updated,
            assignment_info: []
          })) || [],
          error: null
        };
        
      } else if (role === 'pilgrim') {
        // Get assigned volunteers' locations
        const { data, error } = await supabase
          .from('user_locations')
          .select(`
            id,
            user_id,
            latitude,
            longitude,
            accuracy,
            last_updated,
            profiles!inner(name, role)
          `)
          .eq('is_active', true)
          .eq('profiles.role', 'volunteer');
          
        if (error) throw error;
        
        return {
          data: data?.map(loc => ({
            location_id: loc.id,
            user_id: loc.user_id,
            user_name: (loc.profiles as any)?.name || 'Unknown',
            user_role: 'volunteer' as const,
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy: loc.accuracy,
            last_updated: loc.last_updated,
            assignment_info: []
          })) || [],
          error: null
        };
      }
      
      return { data: [], error: null };
    } catch (error) {
      console.error('❌ MapService.getFallbackAssignmentLocations: Fallback query error:', error);
      return { data: [], error };
    }
  }

  // Fallback method for admin to get all locations
  private async getFallbackAllLocations(): Promise<{ data: UserLocationData[] | null; error: any }> {
    try {
      console.log('🔄 MapService.getFallbackAllLocations: Using fallback all locations query');
      
      const { data, error } = await supabase
        .from('user_locations')
        .select(`
          id,
          user_id,
          latitude,
          longitude,
          accuracy,
          last_updated,
          profiles!inner(name, role)
        `)
        .eq('is_active', true);
        
      if (error) throw error;
      
      return {
        data: data?.map(loc => ({
          location_id: loc.id,
          user_id: loc.user_id,
          user_name: (loc.profiles as any)?.name || 'Unknown',
          user_role: (loc.profiles as any)?.role as 'admin' | 'volunteer' | 'pilgrim',
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy,
          last_updated: loc.last_updated,
          assignment_info: []
        })) || [],
        error: null
      };
    } catch (error) {
      console.error('❌ MapService.getFallbackAllLocations: Fallback all locations query error:', error);
      return { data: [], error };
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
      
      // Filter out placeholder users for center calculation
      const realLocations = data?.filter(loc => !loc.isPlaceholder && loc.latitude !== 0 && loc.longitude !== 0) || [];
      
      if (realLocations.length === 0) {
        // Default to India's center if no real locations available
        return { latitude: 20.5937, longitude: 78.9629, error: null };
      }

      // Calculate the center point of real locations only
      const totalLat = realLocations.reduce((sum, loc) => sum + loc.latitude, 0);
      const totalLong = realLocations.reduce((sum, loc) => sum + loc.longitude, 0);
      const count = realLocations.length;

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

      // Filter out placeholder users for bounds calculation
      const realLocations = data?.filter(loc => !loc.isPlaceholder && loc.latitude !== 0 && loc.longitude !== 0) || [];

      if (realLocations.length === 0) {
        // Default bounds covering most of India
        return {
          bounds: {
            northeast: { latitude: 35.5, longitude: 97.5 },  // Roughly covers northern and eastern extremes
            southwest: { latitude: 6.5, longitude: 68.5 }   // Roughly covers southern and western extremes
          },
          error: null
        };
      }

      // Find min and max coordinates from real locations only
      const lats = realLocations.map(loc => loc.latitude);
      const longs = realLocations.map(loc => loc.longitude);

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
