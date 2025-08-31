import { supabase } from './supabase';
import { AssistanceRequest, RequestType, Priority, LocationData } from '../types';

export class RequestService {
  async createRequest(requestData: {
    type: RequestType;
    title: string;
    description: string;
    location: LocationData;
    priority: Priority;
    photo_url?: string;
  }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('assistance_requests')
        .insert({
          user_id: user.id,
          type: requestData.type,
          title: requestData.title,
          description: requestData.description,
          location: `POINT(${requestData.location.longitude} ${requestData.location.latitude})`,
          priority: requestData.priority,
          photo_url: requestData.photo_url,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async getRequests(filters?: {
    status?: string;
    type?: RequestType;
    userId?: string;
  }) {
    try {
      let query = supabase
        .from('assistance_requests')
        .select(`
          *,
          user:profiles!assistance_requests_user_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async getRequestById(id: string) {
    try {
      const { data, error } = await supabase
        .from('assistance_requests')
        .select(`
          *,
          user:profiles!assistance_requests_user_id_fkey(*),
          assignments(
            *,
            volunteer:profiles!assignments_volunteer_id_fkey(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async updateRequestStatus(id: string, status: string) {
    try {
      const { data, error } = await supabase
        .from('assistance_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async cancelRequest(id: string) {
    try {
      console.log('Cancelling request (updating status to cancelled):', id);
      
      const { data, error } = await supabase
        .from('assistance_requests')
        .update({ 
          status: 'cancelled', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log('Request cancelled successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Cancel request service error:', error);
      return { data: null, error };
    }
  }

  async deleteRequest(id: string) {
    try {
      console.log('Attempting to delete request from database:', id);
      
      // Use RPC function to bypass RLS policies
      const { data, error } = await supabase
        .rpc('delete_assistance_request', {
          request_id: id
        });

      console.log('RPC Delete result:', { data, error });

      if (error) {
        console.log('RPC delete failed, trying direct delete...');
        
        // Fallback to direct delete method
        // First check if request exists
        const { data: existingRequest, error: checkError } = await supabase
          .from('assistance_requests')
          .select('id, title, status')
          .eq('id', id)
          .single();
          
        console.log('Request exists check:', { existingRequest, checkError });
        
        if (checkError || !existingRequest) {
          console.error('Request not found in database:', id);
          return { error: { message: `Request ${id} not found in database` } };
        }

        // Delete related assignments first (foreign key constraint)
        console.log('Deleting related assignments for request:', id);
        const { error: assignmentDeleteError } = await supabase
          .from('assignments')
          .delete()
          .eq('request_id', id);
          
        console.log('Assignment delete result:', { assignmentDeleteError });

        // Now delete the request
        const { error: directError } = await supabase
          .from('assistance_requests')
          .delete()
          .eq('id', id);

        console.log('Direct delete result:', { error: directError });

        if (directError) {
          console.error('Both RPC and direct delete failed:', directError);
          throw directError;
        }
      }

      // Verify deletion was successful
      const { data: verifyDeleted, error: verifyError } = await supabase
        .from('assistance_requests')
        .select('id')
        .eq('id', id)
        .maybeSingle();
        
      console.log('Verification check:', { verifyDeleted, verifyError });
      console.log('Verification - request still exists:', verifyDeleted ? 'YES' : 'NO');

      return { error: null };
    } catch (error) {
      console.error('Delete request service error:', error);
      return { error };
    }
  }

  subscribeToRequests(callback: (payload: any) => void) {
    return supabase
      .channel('assistance_requests')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'assistance_requests' },
        callback
      )
      .subscribe();
  }
}

export const requestService = new RequestService();
