/**
 * Assignment Tracking Service
 * Properly tracks how assignments were made for accurate success rate calculation
 */

import { supabase } from './supabase';

export type AssignmentMethod = 'pending' | 'auto' | 'manual' | 'self_assigned';

export class AssignmentTrackingService {
  /**
   * Mark a request as auto-assigned
   */
  static async markAsAutoAssigned(requestId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('assistance_requests')
        .update({ assignment_method: 'auto' })
        .eq('id', requestId);

      if (error) {
        console.error('❌ Failed to mark request as auto-assigned:', error);
      } else {
        console.log(`✅ Request ${requestId} marked as auto-assigned`);
      }
    } catch (error) {
      console.error('❌ Error marking auto-assignment:', error);
    }
  }

  /**
   * Mark a request as manually assigned
   */
  static async markAsManuallyAssigned(requestId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('assistance_requests')
        .update({ assignment_method: 'manual' })
        .eq('id', requestId);

      if (error) {
        console.error('❌ Failed to mark request as manually assigned:', error);
      } else {
        console.log(`✅ Request ${requestId} marked as manually assigned`);
      }
    } catch (error) {
      console.error('❌ Error marking manual assignment:', error);
    }
  }

  /**
   * Mark a request as self-assigned by volunteer
   */
  static async markAsSelfAssigned(requestId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('assistance_requests')
        .update({ assignment_method: 'self_assigned' })
        .eq('id', requestId);

      if (error) {
        console.error('❌ Failed to mark request as self-assigned:', error);
      } else {
        console.log(`✅ Request ${requestId} marked as self-assigned`);
      }
    } catch (error) {
      console.error('❌ Error marking self assignment:', error);
    }
  }

  /**
   * Get accurate auto-assignment success rate
   */
  static async getAutoAssignmentSuccessRate(): Promise<{
    successRate: number;
    totalAutoAttempts: number;
    successfulAutoAssignments: number;
    failedAutoAssignments: number;
  }> {
    try {
      // Get all auto-assignment attempts
      const { data: autoRequests, error } = await supabase
        .from('assistance_requests')
        .select('id, status')
        .eq('assignment_method', 'auto');

      if (error) {
        console.error('❌ Error fetching auto-assignment data:', error);
        return { successRate: 0, totalAutoAttempts: 0, successfulAutoAssignments: 0, failedAutoAssignments: 0 };
      }

      const totalAutoAttempts = autoRequests?.length || 0;
      const successfulAutoAssignments = autoRequests?.filter(r => 
        ['assigned', 'in_progress', 'completed'].includes(r.status)
      ).length || 0;
      const failedAutoAssignments = totalAutoAttempts - successfulAutoAssignments;

      const successRate = totalAutoAttempts > 0 
        ? Math.round((successfulAutoAssignments / totalAutoAttempts) * 100)
        : 0;

      return {
        successRate,
        totalAutoAttempts,
        successfulAutoAssignments,
        failedAutoAssignments
      };
    } catch (error) {
      console.error('❌ Error calculating success rate:', error);
      return { successRate: 0, totalAutoAttempts: 0, successfulAutoAssignments: 0, failedAutoAssignments: 0 };
    }
  }

  /**
   * Get assignment statistics breakdown
   */
  static async getAssignmentMethodBreakdown(): Promise<{
    auto: number;
    manual: number;
    selfAssigned: number;
    pending: number;
  }> {
    try {
      const { data: requests, error } = await supabase
        .from('assistance_requests')
        .select('assignment_method');

      if (error) {
        console.error('❌ Error fetching assignment breakdown:', error);
        return { auto: 0, manual: 0, selfAssigned: 0, pending: 0 };
      }

      const breakdown = {
        auto: 0,
        manual: 0,
        selfAssigned: 0,
        pending: 0
      };

      requests?.forEach(request => {
        switch (request.assignment_method) {
          case 'auto':
            breakdown.auto++;
            break;
          case 'manual':
            breakdown.manual++;
            break;
          case 'self_assigned':
            breakdown.selfAssigned++;
            break;
          case 'pending':
          default:
            breakdown.pending++;
            break;
        }
      });

      return breakdown;
    } catch (error) {
      console.error('❌ Error calculating assignment breakdown:', error);
      return { auto: 0, manual: 0, selfAssigned: 0, pending: 0 };
    }
  }
}

export default AssignmentTrackingService;
