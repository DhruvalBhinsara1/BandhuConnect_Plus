import { supabase } from './supabase';
import { Logger } from '../utils/logger';

export interface StatusChangeEvent {
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: any;
  old: any;
}

export interface StatusSubscription {
  id: string;
  callback: (event: StatusChangeEvent) => void;
  unsubscribe: () => void;
}

class RealTimeStatusService {
  private subscriptions: Map<string, StatusSubscription> = new Map();
  private isOnline: boolean = true;
  private pendingUpdates: any[] = [];

  /**
   * Subscribe to real-time assistance request status changes
   */
  subscribeToRequestStatusChanges(callback: (event: StatusChangeEvent) => void): StatusSubscription {
    const subscriptionId = `requests_${Date.now()}_${Math.random()}`;
    
    Logger.info('🔄 Setting up real-time subscription for assistance requests...');

    const subscription = supabase
      .channel('assistance_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assistance_requests'
        },
        (payload) => {
          Logger.info('📡 Real-time assistance request change:', payload);
          
          const event: StatusChangeEvent = {
            table: 'assistance_requests',
            eventType: payload.eventType as any,
            new: payload.new,
            old: payload.old
          };
          
          callback(event);
        }
      )
      .subscribe((status) => {
        Logger.info(`📡 Assistance requests subscription status: ${status}`);
      });

    const statusSubscription: StatusSubscription = {
      id: subscriptionId,
      callback,
      unsubscribe: () => {
        Logger.info('🔌 Unsubscribing from assistance requests changes');
        supabase.removeChannel(subscription);
        this.subscriptions.delete(subscriptionId);
      }
    };

    this.subscriptions.set(subscriptionId, statusSubscription);
    return statusSubscription;
  }

  /**
   * Subscribe to real-time assignment status changes
   */
  subscribeToAssignmentStatusChanges(callback: (event: StatusChangeEvent) => void): StatusSubscription {
    const subscriptionId = `assignments_${Date.now()}_${Math.random()}`;
    
    Logger.info('🔄 Setting up real-time subscription for assignments...');

    const subscription = supabase
      .channel('assignments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments'
        },
        (payload) => {
          Logger.info('📡 Real-time assignment change:', payload);
          
          const event: StatusChangeEvent = {
            table: 'assignments',
            eventType: payload.eventType as any,
            new: payload.new,
            old: payload.old
          };
          
          callback(event);
        }
      )
      .subscribe((status) => {
        Logger.info(`📡 Assignments subscription status: ${status}`);
      });

    const statusSubscription: StatusSubscription = {
      id: subscriptionId,
      callback,
      unsubscribe: () => {
        Logger.info('🔌 Unsubscribing from assignment changes');
        supabase.removeChannel(subscription);
        this.subscriptions.delete(subscriptionId);
      }
    };

    this.subscriptions.set(subscriptionId, statusSubscription);
    return statusSubscription;
  }

  /**
   * Subscribe to all status changes (requests + assignments)
   */
  subscribeToAllStatusChanges(callback: (event: StatusChangeEvent) => void): StatusSubscription[] {
    return [
      this.subscribeToRequestStatusChanges(callback),
      this.subscribeToAssignmentStatusChanges(callback)
    ];
  }

  /**
   * Handle network connectivity changes
   */
  setOnlineStatus(isOnline: boolean) {
    const wasOffline = !this.isOnline;
    this.isOnline = isOnline;

    Logger.info(`🌐 Network status changed: ${isOnline ? 'online' : 'offline'}`);

    if (isOnline && wasOffline) {
      this.syncPendingUpdates();
    }
  }

  /**
   * Queue updates when offline
   */
  queueOfflineUpdate(update: any) {
    if (!this.isOnline) {
      Logger.info('📱 Queuing update for offline sync:', update);
      this.pendingUpdates.push({
        ...update,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Sync pending updates when coming back online
   */
  private async syncPendingUpdates() {
    if (this.pendingUpdates.length === 0) return;

    Logger.info(`🔄 Syncing ${this.pendingUpdates.length} pending updates...`);

    const updates = [...this.pendingUpdates];
    this.pendingUpdates = [];

    for (const update of updates) {
      try {
        // Process each pending update
        await this.processPendingUpdate(update);
        Logger.info('✅ Synced pending update:', update.id);
      } catch (error) {
        Logger.error('❌ Failed to sync pending update:', error);
        // Re-queue failed updates
        this.pendingUpdates.push(update);
      }
    }
  }

  /**
   * Process a single pending update
   */
  private async processPendingUpdate(update: any) {
    switch (update.type) {
      case 'request_status':
        await supabase
          .from('assistance_requests')
          .update({ status: update.status, updated_at: new Date().toISOString() })
          .eq('id', update.id);
        break;
      
      case 'assignment_status':
        await supabase
          .from('assignments')
          .update({ status: update.status, updated_at: new Date().toISOString() })
          .eq('id', update.id);
        break;
      
      default:
        Logger.warn('⚠️ Unknown pending update type:', update.type);
    }
  }

  /**
   * Broadcast status change to all connected clients
   */
  async broadcastStatusChange(table: string, id: string, status: string, metadata?: any) {
    try {
      const channel = supabase.channel(`status_broadcast_${table}`);
      
      await channel.send({
        type: 'broadcast',
        event: 'status_change',
        payload: {
          table,
          id,
          status,
          metadata,
          timestamp: Date.now()
        }
      });

      Logger.info(`📡 Broadcasted status change: ${table}/${id} -> ${status}`);
    } catch (error) {
      Logger.error('❌ Failed to broadcast status change:', error);
    }
  }

  /**
   * Get current network status
   */
  getNetworkStatus(): { isOnline: boolean; pendingUpdates: number } {
    return {
      isOnline: this.isOnline,
      pendingUpdates: this.pendingUpdates.length
    };
  }

  /**
   * Clean up all subscriptions
   */
  cleanup() {
    Logger.info('🧹 Cleaning up real-time status subscriptions...');
    
    for (const subscription of this.subscriptions.values()) {
      subscription.unsubscribe();
    }
    
    this.subscriptions.clear();
    this.pendingUpdates = [];
  }

  /**
   * Force refresh all data after bulk operations
   */
  async triggerDataRefresh() {
    try {
      // Broadcast refresh signal to all connected clients
      const channel = supabase.channel('data_refresh');
      
      await channel.send({
        type: 'broadcast',
        event: 'force_refresh',
        payload: {
          timestamp: Date.now(),
          reason: 'bulk_operation'
        }
      });

      Logger.info('📡 Triggered data refresh across all apps');
    } catch (error) {
      Logger.error('❌ Failed to trigger data refresh:', error);
    }
  }
}

export const realTimeStatusService = new RealTimeStatusService();
