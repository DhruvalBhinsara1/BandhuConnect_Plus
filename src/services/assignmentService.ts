import { supabase } from './supabase';
import { Assignment, AssignmentStatus } from '../types';

export class AssignmentService {
  async createAssignment(requestId: string, volunteerId: string) {
    console.log('📝 Creating assignment:', { requestId, volunteerId });
    
    // Check if volunteer has too many active assignments (limit to 3) - simplified to avoid RLS recursion
    const { data: existingAssignments, error: checkError } = await supabase
      .from('assignments')
      .select('id, status')
      .eq('volunteer_id', volunteerId)
      .in('status', ['pending', 'accepted', 'in_progress']);

    if (checkError) {
      console.error('❌ Error checking existing assignments:', checkError);
      return { data: null, error: checkError };
    }

    if (existingAssignments && existingAssignments.length >= 3) {
      console.log('📋 Volunteer has reached assignment limit:', existingAssignments.length);
      return { 
        data: null, 
        error: { message: `Volunteer already has ${existingAssignments.length} active assignments. Maximum allowed is 3.` }
      };
    }

    // Log existing assignments for transparency
    if (existingAssignments && existingAssignments.length > 0) {
      console.log(`📋 Volunteer has ${existingAssignments.length} existing assignments, adding one more`);
    }

    const { data, error } = await supabase
      .from('assignments')
      .insert({
        request_id: requestId,
        volunteer_id: volunteerId,
        status: 'pending'
      })
      .select()
      .single();

    console.log('📝 Assignment creation result:', { data, error });

    if (error) {
      console.error('❌ Assignment creation error:', error);
      return { data: null, error };
    }

    // Update request status to assigned
    const { error: updateError } = await supabase
      .from('assistance_requests')
      .update({ status: 'assigned', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (updateError) {
      console.error('❌ Request status update error:', updateError);
      // Rollback assignment if request update fails
      await supabase.from('assignments').delete().eq('id', data.id);
      return { data: null, error: updateError };
    }

    // Update volunteer status based on active assignments
    await this.updateVolunteerStatusBasedOnAssignments(volunteerId);

    console.log('✅ Assignment created successfully');
    return { data, error: null };
  }

  async getAssignments(filters?: {
    volunteerId?: string;
    requestId?: string;
    status?: AssignmentStatus;
  }) {
    try {
      let query = supabase
        .from('assignments')
        .select(`
          *,
          request:assistance_requests(
            id,
            title,
            description,
            type,
            priority,
            status,
            address,
            created_at,
            user:profiles!assistance_requests_user_id_fkey(
              id,
              name,
              phone
            )
          ),
          volunteer:profiles!assignments_volunteer_id_fkey(
            id,
            name,
            phone
          )
        `)
        .order('assigned_at', { ascending: false });

      if (filters?.volunteerId) {
        query = query.eq('volunteer_id', filters.volunteerId);
      }

      if (filters?.requestId) {
        query = query.eq('request_id', filters.requestId);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      console.log('🔍 AssignmentService.getAssignments: Executing query with filters:', filters);
      const { data, error } = await query;
      console.log('📊 AssignmentService.getAssignments: Query result:', { data, error, count: data?.length });

      if (error) {
        console.error('❌ AssignmentService.getAssignments: Query error:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('❌ AssignmentService.getAssignments: Exception:', error);
      return { data: null, error };
    }
  }

  async updateAssignmentStatus(id: string, status: AssignmentStatus, completionLocation?: any) {
    try {
      console.log('📝 Updating assignment status:', { id, status });
      
      const updateData: any = {
        status,
      };

      // Add timestamp based on status
      switch (status) {
        case 'accepted':
          updateData.accepted_at = new Date().toISOString();
          break;
        case 'in_progress':
          // For pending tasks going directly to in_progress, set both accepted_at and started_at
          updateData.accepted_at = updateData.accepted_at || new Date().toISOString();
          updateData.started_at = new Date().toISOString();
          break;
        case 'completed':
          updateData.completed_at = new Date().toISOString();
          // Add completion location if available
          if (completionLocation) {
            updateData.completion_latitude = completionLocation.latitude;
            updateData.completion_longitude = completionLocation.longitude;
            updateData.completion_address = completionLocation.address;
          }
          break;
      }

      const { data, error } = await supabase
        .from('assignments')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      console.log('📝 Assignment update result:', { data, error });

      if (error) throw error;

      // Update request status based on assignment status
      if (data.request_id) {
        let requestStatus = 'assigned';
        switch (status) {
          case 'accepted':
            requestStatus = 'assigned';
            break;
          case 'in_progress':
            requestStatus = 'in_progress';
            break;
          case 'completed':
            requestStatus = 'completed';
            break;
        }

        await supabase
          .from('assistance_requests')
          .update({ status: requestStatus })
          .eq('id', data.request_id);
      }

      // Update volunteer status based on remaining active assignments
      if (data.volunteer_id) {
        await this.updateVolunteerStatusBasedOnAssignments(data.volunteer_id);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async updateVolunteerStatusBasedOnAssignments(volunteerId: string) {
    try {
      console.log('🔄 Updating volunteer status based on active assignments:', volunteerId);
      
      // Get count of active assignments for this volunteer
      const { data: activeAssignments, error: countError } = await supabase
        .from('assignments')
        .select('id, status')
        .eq('volunteer_id', volunteerId)
        .in('status', ['pending', 'accepted', 'in_progress']);

      if (countError) {
        console.error('❌ Error counting active assignments:', countError);
        return;
      }

      const activeCount = activeAssignments?.length || 0;
      console.log('📊 Active assignments count:', activeCount);

      // Determine new volunteer status
      let newStatus = 'available';
      if (activeCount > 0) {
        // Check if any assignment is in progress (on duty)
        const hasInProgress = activeAssignments?.some(a => a.status === 'in_progress');
        newStatus = hasInProgress ? 'on_duty' : 'busy';
      }

      console.log('🔄 Setting volunteer status to:', newStatus);

      // Update volunteer status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          volunteer_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', volunteerId);

      if (updateError) {
        console.error('❌ Error updating volunteer status:', updateError);
      } else {
        console.log('✅ Volunteer status updated successfully');
      }
    } catch (error) {
      console.error('❌ Error in updateVolunteerStatusBasedOnAssignments:', error);
    }
  }

  async getVolunteerActiveAssignments(volunteerId: string) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('volunteer_id', volunteerId)
        .in('status', ['assigned', 'accepted', 'in_progress'])
        .order('assigned_at', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  subscribeToAssignments(volunteerId: string, callback: (payload: any) => void) {
    return supabase
      .channel('assignments')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'assignments',
          filter: `volunteer_id=eq.${volunteerId}`
        },
        callback
      )
      .subscribe();
  }
}

export const assignmentService = new AssignmentService();
