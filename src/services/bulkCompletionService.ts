import { supabase } from './supabase';
import { Logger } from '../utils/logger';
import { realTimeStatusService } from './realTimeStatusService';

export interface BulkCompletionResult {
  success: boolean;
  updatedCount: number;
  updatedRequestIds: string[];
  message: string;
  error?: string;
}

export interface CompletionStats {
  totalRequests: number;
  pendingRequests: number;
  assignedRequests: number;
  inProgressRequests: number;
  completedRequests: number;
  cancelledRequests: number;
  completionPercentage: number;
}

class BulkCompletionService {
  /**
   * Mark all assistance requests as completed
   */
  async markAllRequestsCompleted(): Promise<BulkCompletionResult> {
    try {
      Logger.info('🔄 Starting bulk completion of all requests...');

      const { data, error } = await supabase
        .rpc('mark_all_requests_completed');

      if (error) {
        Logger.error('❌ Bulk completion failed:', error);
        return {
          success: false,
          updatedCount: 0,
          updatedRequestIds: [],
          message: 'Failed to mark requests as completed',
          error: error.message
        };
      }

      const result = data?.[0];
      const updatedCount = result?.updated_count || 0;
      const updatedIds = result?.updated_request_ids || [];

      Logger.info(`✅ Successfully completed ${updatedCount} requests`);

      // Trigger real-time data refresh across all apps
      if (updatedCount > 0) {
        await realTimeStatusService.triggerDataRefresh();
      }

      return {
        success: true,
        updatedCount,
        updatedRequestIds: updatedIds,
        message: updatedCount > 0 
          ? `Successfully marked ${updatedCount} requests as completed`
          : 'No pending requests found to complete'
      };
    } catch (error) {
      Logger.error('❌ Bulk completion service error:', error);
      return {
        success: false,
        updatedCount: 0,
        updatedRequestIds: [],
        message: 'System error during bulk completion',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Mark requests as completed by type
   */
  async markRequestsCompletedByType(requestType: string): Promise<BulkCompletionResult> {
    try {
      Logger.info(`🔄 Marking ${requestType} requests as completed...`);

      const { data, error } = await supabase
        .rpc('mark_requests_completed_by_type', {
          p_request_type: requestType
        });

      if (error) {
        Logger.error('❌ Type-based completion failed:', error);
        return {
          success: false,
          updatedCount: 0,
          updatedRequestIds: [],
          message: `Failed to complete ${requestType} requests`,
          error: error.message
        };
      }

      const result = data?.[0];
      const updatedCount = result?.updated_count || 0;
      const updatedIds = result?.updated_request_ids || [];

      Logger.info(`✅ Completed ${updatedCount} ${requestType} requests`);

      return {
        success: true,
        updatedCount,
        updatedRequestIds: updatedIds,
        message: updatedCount > 0 
          ? `Successfully completed ${updatedCount} ${requestType} requests`
          : `No pending ${requestType} requests found`
      };
    } catch (error) {
      Logger.error('❌ Type-based completion error:', error);
      return {
        success: false,
        updatedCount: 0,
        updatedRequestIds: [],
        message: `System error completing ${requestType} requests`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Mark requests as completed by priority
   */
  async markRequestsCompletedByPriority(priority: string): Promise<BulkCompletionResult> {
    try {
      Logger.info(`🔄 Marking ${priority} priority requests as completed...`);

      const { data, error } = await supabase
        .rpc('mark_requests_completed_by_priority', {
          p_priority: priority
        });

      if (error) {
        Logger.error('❌ Priority-based completion failed:', error);
        return {
          success: false,
          updatedCount: 0,
          updatedRequestIds: [],
          message: `Failed to complete ${priority} priority requests`,
          error: error.message
        };
      }

      const result = data?.[0];
      const updatedCount = result?.updated_count || 0;
      const updatedIds = result?.updated_request_ids || [];

      Logger.info(`✅ Completed ${updatedCount} ${priority} priority requests`);

      return {
        success: true,
        updatedCount,
        updatedRequestIds: updatedIds,
        message: updatedCount > 0 
          ? `Successfully completed ${updatedCount} ${priority} priority requests`
          : `No pending ${priority} priority requests found`
      };
    } catch (error) {
      Logger.error('❌ Priority-based completion error:', error);
      return {
        success: false,
        updatedCount: 0,
        updatedRequestIds: [],
        message: `System error completing ${priority} priority requests`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get completion statistics
   */
  async getCompletionStats(): Promise<CompletionStats | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_completion_stats');

      if (error) {
        Logger.error('❌ Failed to get completion stats:', error);
        return null;
      }

      const stats = data?.[0];
      if (!stats) {
        return null;
      }

      return {
        totalRequests: stats.total_requests || 0,
        pendingRequests: stats.pending_requests || 0,
        assignedRequests: stats.assigned_requests || 0,
        inProgressRequests: stats.in_progress_requests || 0,
        completedRequests: stats.completed_requests || 0,
        cancelledRequests: stats.cancelled_requests || 0,
        completionPercentage: parseFloat(stats.completion_percentage) || 0
      };
    } catch (error) {
      Logger.error('❌ Error getting completion stats:', error);
      return null;
    }
  }

  /**
   * Check if user has admin permissions for bulk operations
   */
  async hasAdminPermissions(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || !profile) return false;

      return profile.role === 'admin';
    } catch (error) {
      Logger.error('❌ Error checking admin permissions:', error);
      return false;
    }
  }
}

export const bulkCompletionService = new BulkCompletionService();
