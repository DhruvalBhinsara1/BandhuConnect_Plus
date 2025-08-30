import { supabase } from './supabase';
import { Assignment, AssignmentStatus } from '../types';

export class AssignmentService {
  async createAssignment(requestId: string, volunteerId: string) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .insert({
          request_id: requestId,
          volunteer_id: volunteerId,
          status: 'assigned',
          assigned_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update request status to assigned
      await supabase
        .from('assistance_requests')
        .update({ status: 'assigned' })
        .eq('id', requestId);

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
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
          request:assistance_requests(*),
          volunteer:profiles!assignments_volunteer_id_fkey(*)
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

      const { data, error } = await query;

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async updateAssignmentStatus(id: string, status: AssignmentStatus) {
    try {
      const updateData: any = {
        status,
      };

      // Add timestamp based on status
      switch (status) {
        case 'accepted':
          updateData.accepted_at = new Date().toISOString();
          break;
        case 'on_duty':
          updateData.started_at = new Date().toISOString();
          break;
        case 'completed':
          updateData.completed_at = new Date().toISOString();
          break;
      }

      const { data, error } = await supabase
        .from('assignments')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          request:assistance_requests(*)
        `)
        .single();

      if (error) throw error;

      // Update request status based on assignment status
      if (data.request) {
        let requestStatus = 'assigned';
        switch (status) {
          case 'accepted':
            requestStatus = 'assigned';
            break;
          case 'on_duty':
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

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async getVolunteerActiveAssignments(volunteerId: string) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          request:assistance_requests(*)
        `)
        .eq('volunteer_id', volunteerId)
        .in('status', ['assigned', 'accepted', 'on_duty'])
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
