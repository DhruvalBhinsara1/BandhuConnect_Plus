import { supabase } from './supabase';
import { Assignment, AssignmentStatus } from '../types';
import { repairAssignments } from './assignmentRepairService';

// Centralized assignment detection logic
export const ACTIVE_ASSIGNMENT_STATUSES = ['pending', 'accepted', 'in_progress'] as const;

export const hasActiveAssignment = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('id, status')
      .or(`volunteer_id.eq.${userId},pilgrim_id.eq.${userId}`)
      .in('status', ACTIVE_ASSIGNMENT_STATUSES)
      .limit(1);
      
    if (error) {
      console.error('❌ hasActiveAssignment: Error checking assignments:', error);
      return false;
    }
    
    const hasAssignment = data && data.length > 0;
    
    // If no assignment found, try automatic repair
    if (!hasAssignment) {
      console.log(`🔧 No active assignment found for ${userId}, attempting repair...`);
      const repairResult = await repairAssignments(userId);
      
      if (repairResult.success && repairResult.repaired) {
        console.log(`✅ Assignment repaired for ${userId}:`, repairResult.message);
        return true;
      }
    }
    
    console.log(`🔍 hasActiveAssignment for ${userId}:`, hasAssignment);
    return hasAssignment;
  } catch (error) {
    console.error('❌ hasActiveAssignment: Unexpected error:', error);
    return false;
  }
};

export const getActiveAssignments = async (userId: string): Promise<Assignment[]> => {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .or(`volunteer_id.eq.${userId},pilgrim_id.eq.${userId}`)
      .in('status', ACTIVE_ASSIGNMENT_STATUSES)
      .order('assigned_at', { ascending: false });
      
    if (error) {
      console.error('❌ getActiveAssignments: Error:', error);
      return [];
    }
    
    console.log(`📋 getActiveAssignments for ${userId}:`, data?.length || 0, 'assignments');
    return data || [];
  } catch (error) {
    console.error('❌ getActiveAssignments: Unexpected error:', error);
    return [];
  }
};

export class AssignmentService {
  async createAssignment(requestId: string, volunteerId: string) {
    console.log('📝 Creating assignment:', { requestId, volunteerId });
    
    // Check if volunteer has too many active assignments (limit to 3) - simplified to avoid RLS recursion
    const { data: existingAssignments, error: checkError } = await supabase
      .from('assignments')
      .select('id, status')
      .eq('volunteer_id', volunteerId)
      .in('status', ACTIVE_ASSIGNMENT_STATUSES);

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

    // Update volunteer status based on active assignments (non-blocking)
    this.updateVolunteerStatusBasedOnAssignments(volunteerId).catch(error => {
      console.warn('⚠️ Non-critical: Failed to update volunteer status after assignment creation:', error);
    });

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
          updateData.is_active = false; // Set inactive to prevent unique constraint violations
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

      // Update volunteer status based on remaining active assignments (non-blocking)
      if (data.volunteer_id) {
        this.updateVolunteerStatusBasedOnAssignments(data.volunteer_id).catch(error => {
          console.warn('⚠️ Non-critical: Failed to update volunteer status after assignment completion:', error);
        });
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
        .in('status', ACTIVE_ASSIGNMENT_STATUSES);

      if (countError) {
        console.error('❌ Error counting active assignments:', countError);
        return;
      }

      const activeCount = activeAssignments?.length || 0;
      console.log('📊 Active assignments count:', activeCount);

      // Determine new volunteer status
      let newStatus = 'available';
      if (activeCount > 0) {
        // Set to busy if volunteer has any active assignments
        newStatus = 'busy';
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
        // Don't throw error - this is a non-critical operation
      } else {
        console.log('✅ Volunteer status updated successfully');
      }
    } catch (error) {
      console.error('❌ Error in updateVolunteerStatusBasedOnAssignments:', error);
      // Gracefully handle error without throwing - volunteer status update is not critical
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
