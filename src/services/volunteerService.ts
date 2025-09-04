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
        .select(`
          id,
          name,
          email,
          phone,
          role,
          skills,
          volunteer_status,
          is_active,
          rating,
          total_ratings,
          created_at,
          updated_at
        `)
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

  async getVolunteerById(volunteerId: string) {
    try {
      console.log('Fetching volunteer by ID:', volunteerId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          phone,
          role,
          skills,
          volunteer_status,
          is_active,
          rating,
          total_ratings,
          created_at,
          updated_at
        `)
        .eq('id', volunteerId)
        .eq('role', 'volunteer')
        .single();
      
      console.log('Volunteer by ID result:', { data, error });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching volunteer by ID:', error);
      return { data: null, error };
    }
  }

  async getVolunteerStats(volunteerId: string) {
    try {
      console.log('🔍 Fetching volunteer statistics:', volunteerId);
      
      // First try using the RPC function to bypass RLS
      const { data: rpcStats, error: rpcError } = await supabase
        .rpc('get_volunteer_stats', {
          p_volunteer_id: volunteerId
        });

      if (rpcStats && !rpcError) {
        console.log('✅ Got stats via RPC function:', rpcStats);
        const stats = {
          totalTasks: Number(rpcStats[0]?.total_assignments || 0),
          completedTasks: Number(rpcStats[0]?.completed_assignments || 0),
          activeAssignments: Number(rpcStats[0]?.active_assignments || 0),
          hoursWorked: Number(rpcStats[0]?.hours_worked || 0),
        };
        return { data: stats, error: null };
      }

      console.log('⚠️ RPC function failed, falling back to direct query:', rpcError);
      
      // Fallback: Get assignment statistics directly
      const { data: assignments, error: assignmentError } = await supabase
        .from('assignments')
        .select(`
          id,
          status,
          assigned_at,
          accepted_at,
          started_at,
          completed_at,
          request:assistance_requests(
            id,
            title,
            description,
            priority,
            type
          )
        `)
        .eq('volunteer_id', volunteerId);

      if (assignmentError) throw assignmentError;

      // Calculate statistics with correct active assignment logic
      const totalTasks = assignments?.length || 0;
      const completedTasks = assignments?.filter(a => a.status === 'completed').length || 0;
      const activeAssignments = assignments?.filter(a => 
        ['pending', 'accepted', 'in_progress'].includes(a.status)
      ).length || 0;
      
      // Calculate actual hours worked based on duty time (started_at to completed_at)
      let hoursWorked = 0;
      if (assignments) {
        hoursWorked = assignments.reduce((total, assignment) => {
          // Only count hours for completed tasks that have both started_at and completed_at
          if (assignment.status === 'completed' && assignment.started_at && assignment.completed_at) {
            const startTime = new Date(assignment.started_at).getTime();
            const endTime = new Date(assignment.completed_at).getTime();
            const hoursOnDuty = (endTime - startTime) / (1000 * 60 * 60); // Convert ms to hours
            return total + Math.max(0, hoursOnDuty); // Ensure non-negative hours
          }
          return total;
        }, 0);
      }
      
      // Round to 2 decimal places for better testing visibility
      hoursWorked = Math.round(hoursWorked * 100) / 100;

      const stats = {
        totalTasks,
        completedTasks,
        activeAssignments,
        hoursWorked,
        assignments: assignments || []
      };
      
      console.log('📊 Volunteer stats result (fallback):', stats);
      return { data: stats, error: null };
    } catch (error) {
      console.error('❌ Error fetching volunteer stats:', error);
      return { data: null, error };
    }
  }

  async refreshVolunteerStatus(volunteerId: string) {
    try {
      console.log('🔄 Refreshing volunteer status:', volunteerId);
      
      const { data, error } = await supabase
        .rpc('update_volunteer_status_based_on_assignments', {
          p_volunteer_id: volunteerId
        });

      if (error) {
        console.error('❌ Error refreshing volunteer status:', error);
        return { data: null, error };
      }

      console.log('✅ Volunteer status refreshed successfully');
      return { data: true, error: null };
    } catch (error) {
      console.error('❌ Error in refreshVolunteerStatus:', error);
      return { data: null, error };
    }
  }

  async refreshAllVolunteerStatuses() {
    try {
      console.log('🔄 Refreshing all volunteer statuses...');
      
      const { data, error } = await supabase
        .rpc('refresh_all_volunteer_statuses');

      if (error) {
        console.error('❌ Error refreshing all volunteer statuses:', error);
        return { data: null, error };
      }

      console.log('✅ All volunteer statuses refreshed:', data);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Error in refreshAllVolunteerStatuses:', error);
      return { data: null, error };
    }
  }

  async getAvailableVolunteers() {
    try {
      console.log('Fetching available volunteers...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          skills,
          volunteer_status,
          rating,
          is_active
        `)
        .eq('role', 'volunteer')
        .eq('volunteer_status', 'available')
        .eq('is_active', true)
        .order('rating', { ascending: false });
      
      console.log('Available volunteers result:', { data: data?.length, error });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching available volunteers:', error);
      return { data: null, error };
    }
  }
}

export const volunteerService = new VolunteerService();
