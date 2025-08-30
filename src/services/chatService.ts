import { supabase } from './supabase';
import { Message, MessageType } from '../types';

export class ChatService {
  async sendMessage(content: string, channelId: string, receiverId?: string, messageType: MessageType = 'text') {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          channel_id: channelId,
          content,
          message_type: messageType,
        })
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*)
        `)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async getMessages(channelId: string, limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*)
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { data: data?.reverse() || [], error: null };
    } catch (error) {
      return { data: [], error };
    }
  }

  async getDirectMessages(userId1: string, userId2: string, limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*)
        `)
        .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { data: data?.reverse() || [], error: null };
    } catch (error) {
      return { data: [], error };
    }
  }

  subscribeToChannel(channelId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`messages:${channelId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `channel_id=eq.${channelId}`
        },
        callback
      )
      .subscribe();
  }

  subscribeToDirectMessages(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`direct_messages:${userId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }
}

export const chatService = new ChatService();
