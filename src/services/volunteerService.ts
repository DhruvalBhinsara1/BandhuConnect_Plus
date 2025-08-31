import { supabase } from './supabase';
import { User } from '../types';

export class VolunteerService {
  async updateVolunteerStatus(volunteerId: string, isActive: boolean) {
    try {
      console.log('Updating volunteer status:', { volunteerId, isActive });
      
      // First check if volunteer exists and get all volunteers to debug
      const { data: allVolunteers } = await supabase
        .from('profiles')
        .select('id, name, volunteer_status, is_active')
        .eq('role', 'volunteer');
        
      console.log('All volunteers in database:', allVolunteers);
      console.log('Looking for volunteer ID:', volunteerId);
      
      const { data: existingVolunteer, error: checkError } = await supabase
        .from('profiles')
        .select('id, name, volunteer_status, is_active')
        .eq('id', volunteerId)
        .single();
        
      console.log('Existing volunteer check:', { existingVolunteer, checkError });
      
      if (checkError || !existingVolunteer) {
        console.error('Volunteer not found:', volunteerId);
        console.error('Available volunteer IDs:', allVolunteers?.map(v => v.id));
        return { data: null, error: { message: `Volunteer ${volunteerId} not found in database` } };
      }
      
      // Use RPC function to bypass RLS if direct update fails
      const { data, error } = await supabase
        .rpc('update_volunteer_status', {
          volunteer_id: volunteerId,
          new_is_active: isActive,
          new_volunteer_status: isActive ? 'available' : 'offline'
        });

      console.log('RPC Update result:', { data, error });

      if (error) {
        console.log('RPC failed, trying direct update...');
        // Fallback to direct update
        const { data: directData, error: directError } = await supabase
          .from('profiles')
          .update({ 
            is_active: isActive,
            volunteer_status: isActive ? 'available' : 'offline',
            updated_at: new Date().toISOString()
          })
          .eq('id', volunteerId)
          .select();

        console.log('Direct update result:', { data: directData, error: directError });
        
        if (directError) {
          console.error('Both RPC and direct update failed:', directError);
          throw directError;
        }
        
        return { data: directData, error: null };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Service error:', error);
      return { data: null, error };
    }
  }

  async updateProfile(volunteerId: string, profileData: {
    name?: string;
    email?: string;
    phone?: string;
    skills?: string[];
  }) {
    try {
      console.log('🔄 Updating volunteer profile:', { volunteerId, profileData });
      
      // First verify the volunteer exists
      const { data: existingVolunteer, error: checkError } = await supabase
        .from('profiles')
        .select('id, name, email, phone, skills')
        .eq('id', volunteerId)
        .eq('role', 'volunteer')
        .single();
        
      console.log('📋 Existing volunteer check:', { existingVolunteer, checkError });
      
      if (checkError || !existingVolunteer) {
        console.error('❌ Volunteer not found:', volunteerId);
        return { data: null, error: { message: `Volunteer ${volunteerId} not found` } };
      }
      
      // Update the profile with proper authentication context
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('id', volunteerId)
        .eq('role', 'volunteer')
        .select();

      console.log('📥 Profile update result:', { data, error });

      if (error) {
        console.error('❌ Profile update failed:', error);
        return { data: null, error };
      }

      if (!data || data.length === 0) {
        console.log('⚠️ No rows updated - this may indicate RLS policy restrictions');
        return { data: null, error: { message: 'Profile update failed - no rows affected' } };
      }

      console.log('✅ Profile updated successfully:', data[0]);
      return { data: data[0], error: null };
    } catch (error) {
      console.error('❌ Service error during profile update:', error);
      return { data: null, error };
    }
  }

  async getVolunteers(filters?: { is_active?: boolean; status?: string }) {
    try {
      console.log('Fetching volunteers from database...');
      
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'volunteer')
        .order('created_at', { ascending: false });

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters?.status) {
        query = query.eq('volunteer_status', filters.status);
      }

      const { data, error } = await query;
      
      console.log('Volunteers fetch result:', { data: data?.length, error });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching volunteers:', error);
      return { data: null, error };
    }
  }
}

export const volunteerService = new VolunteerService();
