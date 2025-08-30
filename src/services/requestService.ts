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

  async deleteRequest(id: string) {
    try {
      const { error } = await supabase
        .from('assistance_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { error: null };
    } catch (error) {
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
