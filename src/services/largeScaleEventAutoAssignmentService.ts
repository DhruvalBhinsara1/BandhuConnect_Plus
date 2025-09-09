import { supabase } from '../../lib/Supabase';
import { Logger } from './logger';
import { User, AssistanceRequest } from '../types';

export interface EnhancedVolunteerMatch {
  volunteer: User;
  score: number;
  distance: number;
  skillMatch: number;
  availabilityScore: number;
  currentAssignments: number;
  priorityTier: string;
  assignmentTier: 'OPTIMAL' | 'GOOD' | 'ACCEPTABLE' | 'EMERGENCY_FALLBACK' | 'LAST_RESORT';
}

export interface EventModeConfig {
  isEventMode: boolean;
  maxRadius: number;
  minThreshold: number;
  allowOfflineVolunteers: boolean;
  maxAssignmentsPerVolunteer: number;
  emergencyActivationEnabled: boolean;
}

export interface EventStats {
  totalVolunteers: number;
  availableVolunteers: number;
  busyVolunteers: number;
  offlineVolunteers: number;
  coveragePercentage: number;
  capacityStatus: 'GOOD' | 'MODERATE' | 'LOW' | 'CRITICAL';
  recommendations: {
    expandSearchRadius: boolean;
    activateOfflineVolunteers: boolean;
    increaseAssignmentLimits: boolean;
    emergencyRecruitment: boolean;
  };
}

class LargeScaleEventAutoAssignmentService {
  private eventModeConfig: EventModeConfig = {
    isEventMode: false,
    maxRadius: 50000, // 50km for large events
    minThreshold: 0.10, // Very low threshold for events
    allowOfflineVolunteers: true,
    maxAssignmentsPerVolunteer: 5,
    emergencyActivationEnabled: true,
  };

  /**
   * Enable large-scale event mode with adaptive parameters
   */
  enableEventMode(config?: Partial<EventModeConfig>): void {
    this.eventModeConfig = {
      ...this.eventModeConfig,
      isEventMode: true,
      ...config,
    };
    
    Logger.info('Large-scale event mode enabled', {
      config: this.eventModeConfig,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Disable event mode and return to normal operation
   */
  disableEventMode(): void {
    this.eventModeConfig.isEventMode = false;
    Logger.info('Event mode disabled, returning to normal operations');
  }

  /**
   * Enhanced auto-assignment using database functions optimized for large events
   */
  async autoAssignRequestEnhanced(requestId: string): Promise<{
    success: boolean;
    assignmentId?: string;
    volunteerId?: string;
    volunteerName?: string;
    matchScore?: number;
    distance?: number;
    message: string;
    assignmentTier?: string;
  }> {
    try {
      console.log('🚀 Enhanced auto-assignment starting for request:', requestId);
      Logger.autoAssignment.requestStart(requestId, 'enhanced', 'auto');

      const { data: result, error } = await supabase.rpc('auto_assign_volunteer_enhanced', {
        p_request_id: requestId,
        p_max_distance: this.eventModeConfig.isEventMode 
          ? this.eventModeConfig.maxRadius 
          : 15000,
        p_min_score: this.eventModeConfig.isEventMode 
          ? this.eventModeConfig.minThreshold 
          : 0.25,
        p_event_mode: this.eventModeConfig.isEventMode,
      });

      if (error) {
        console.error('❌ Enhanced auto-assignment failed:', error);
        Logger.autoAssignment.matchResult(false, undefined, undefined, error.message);
        return {
          success: false,
          message: `Assignment failed: ${error.message}`,
        };
      }

      if (result && result.length > 0) {
        const assignment = result[0];
        if (assignment.success) {
          console.log('✅ Enhanced assignment successful:', {
            volunteer: assignment.volunteer_name,
            score: assignment.match_score,
            tier: assignment.assignment_tier,
          });

          Logger.autoAssignment.matchResult(
            true,
            assignment.volunteer_name,
            assignment.match_score,
            `Enhanced assignment (${assignment.assignment_tier} tier)`
          );

          // Send notification to volunteer
          await this.sendVolunteerNotification(assignment.volunteer_id, requestId, assignment.assignment_tier);

          return {
            success: true,
            assignmentId: assignment.assignment_id,
            volunteerId: assignment.volunteer_id,
            volunteerName: assignment.volunteer_name,
            matchScore: assignment.match_score,
            distance: assignment.distance_km,
            message: assignment.message,
            assignmentTier: assignment.assignment_tier,
          };
        }
      }

      return {
        success: false,
        message: result?.[0]?.message || 'No suitable volunteers found',
      };

    } catch (error) {
      console.error('❌ Enhanced auto-assignment error:', error);
      Logger.autoAssignment.matchResult(false, undefined, undefined, 'System error during enhanced assignment');
      return {
        success: false,
        message: 'Enhanced auto-assignment failed due to system error',
      };
    }
  }

  /**
   * Batch assignment optimized for high-volume scenarios
   */
  async batchAutoAssignEnhanced(options: {
    maxAssignments?: number;
    priorityFilter?: 'high' | 'medium' | 'low' | 'all';
    eventMode?: boolean;
  } = {}): Promise<{
    processed: number;
    successful: number;
    failed: number;
    assignments: Array<{
      requestId: string;
      success: boolean;
      volunteerName?: string;
      matchScore?: number;
      assignmentTier?: string;
      message: string;
    }>;
  }> {
    const {
      maxAssignments = this.eventModeConfig.isEventMode ? 100 : 50,
      priorityFilter = 'all',
      eventMode = this.eventModeConfig.isEventMode,
    } = options;

    console.log('🚀 Enhanced batch assignment starting', {
      maxAssignments,
      priorityFilter,
      eventMode,
    });

    Logger.autoAssignment.batchStart(maxAssignments);

    try {
      const { data: results, error } = await supabase.rpc('batch_auto_assign_enhanced', {
        p_max_assignments: maxAssignments,
        p_event_mode: eventMode,
        p_priority_filter: priorityFilter,
      });

      if (error) {
        console.error('❌ Batch assignment failed:', error);
        return {
          processed: 0,
          successful: 0,
          failed: 1,
          assignments: [{
            requestId: '',
            success: false,
            message: `Batch assignment failed: ${error.message}`,
          }],
        };
      }

      const assignments = results || [];
      const successful = assignments.filter((a: any) => a.success).length;
      const failed = assignments.length - successful;

      console.log('✅ Batch assignment completed', {
        processed: assignments.length,
        successful,
        failed,
        successRate: assignments.length > 0 ? (successful / assignments.length * 100).toFixed(1) + '%' : '0%',
      });

      Logger.autoAssignment.batchComplete(successful, failed, []);

      return {
        processed: assignments.length,
        successful,
        failed,
        assignments: assignments.map((a: any) => ({
          requestId: a.request_id,
          success: a.success,
          volunteerName: a.volunteer_name,
          matchScore: a.match_score,
          assignmentTier: a.assignment_tier,
          message: a.message,
        })),
      };

    } catch (error) {
      console.error('❌ Batch assignment error:', error);
      return {
        processed: 0,
        successful: 0,
        failed: 1,
        assignments: [{
          requestId: '',
          success: false,
          message: 'Batch assignment failed due to system error',
        }],
      };
    }
  }

  /**
   * Emergency volunteer activation for crisis situations
   */
  async activateEmergencyVolunteers(options: {
    eventAreaLat: number;
    eventAreaLng: number;
    radiusKm?: number;
    activationMessage?: string;
  }): Promise<{
    success: boolean;
    activatedVolunteers: number;
    notifiedVolunteers: number;
    expandedCapacity: number;
    message: string;
  }> {
    const {
      eventAreaLat,
      eventAreaLng,
      radiusKm = 100,
      activationMessage = 'Emergency volunteer activation for large-scale event. Your immediate assistance is requested.',
    } = options;

    console.log('🚨 Emergency volunteer activation initiated', {
      location: { lat: eventAreaLat, lng: eventAreaLng },
      radius: radiusKm,
    });

    try {
      const { data: result, error } = await supabase.rpc('emergency_volunteer_activation', {
        p_event_area_lat: eventAreaLat,
        p_event_area_lng: eventAreaLng,
        p_radius_km: radiusKm,
        p_activation_message: activationMessage,
      });

      if (error) {
        console.error('❌ Emergency activation failed:', error);
        return {
          success: false,
          activatedVolunteers: 0,
          notifiedVolunteers: 0,
          expandedCapacity: 0,
          message: `Emergency activation failed: ${error.message}`,
        };
      }

      if (result && result.length > 0) {
        const activation = result[0];
        console.log('✅ Emergency activation completed:', activation);

        return {
          success: true,
          activatedVolunteers: activation.activated_volunteers,
          notifiedVolunteers: activation.notified_volunteers,
          expandedCapacity: activation.expanded_capacity,
          message: activation.message,
        };
      }

      return {
        success: false,
        activatedVolunteers: 0,
        notifiedVolunteers: 0,
        expandedCapacity: 0,
        message: 'Emergency activation completed but no results returned',
      };

    } catch (error) {
      console.error('❌ Emergency activation error:', error);
      return {
        success: false,
        activatedVolunteers: 0,
        notifiedVolunteers: 0,
        expandedCapacity: 0,
        message: 'Emergency activation failed due to system error',
      };
    }
  }

  /**
   * Get real-time event statistics and volunteer utilization
   */
  async getEventVolunteerStats(options: {
    eventAreaLat: number;
    eventAreaLng: number;
    radiusKm?: number;
  }): Promise<EventStats | null> {
    const { eventAreaLat, eventAreaLng, radiusKm = 50 } = options;

    try {
      const { data: result, error } = await supabase.rpc('get_event_volunteer_stats', {
        p_event_area_lat: eventAreaLat,
        p_event_area_lng: eventAreaLng,
        p_radius_km: radiusKm,
      });

      if (error) {
        console.error('❌ Failed to get event stats:', error);
        return null;
      }

      if (result) {
        const stats = typeof result === 'string' ? JSON.parse(result) : result;
        
        return {
          totalVolunteers: stats.volunteer_distribution.total_volunteers,
          availableVolunteers: stats.volunteer_distribution.available,
          busyVolunteers: stats.volunteer_distribution.busy,
          offlineVolunteers: stats.volunteer_distribution.offline,
          coveragePercentage: stats.utilization_metrics.coverage_percentage,
          capacityStatus: stats.utilization_metrics.capacity_status,
          recommendations: stats.recommendations,
        };
      }

      return null;

    } catch (error) {
      console.error('❌ Error getting event stats:', error);
      return null;
    }
  }

  /**
   * Adaptive threshold adjustment based on volunteer availability
   */
  async adjustThresholdsBasedOnAvailability(eventAreaLat: number, eventAreaLng: number): Promise<void> {
    const stats = await this.getEventVolunteerStats({ eventAreaLat, eventAreaLng });
    
    if (!stats) return;

    // Adjust thresholds based on capacity
    if (stats.capacityStatus === 'CRITICAL') {
      this.eventModeConfig.minThreshold = 0.05; // Very low threshold
      this.eventModeConfig.maxRadius = 100000; // 100km radius
      this.eventModeConfig.maxAssignmentsPerVolunteer = 7;
    } else if (stats.capacityStatus === 'LOW') {
      this.eventModeConfig.minThreshold = 0.10;
      this.eventModeConfig.maxRadius = 75000; // 75km radius
      this.eventModeConfig.maxAssignmentsPerVolunteer = 5;
    } else if (stats.capacityStatus === 'MODERATE') {
      this.eventModeConfig.minThreshold = 0.15;
      this.eventModeConfig.maxRadius = 50000; // 50km radius
      this.eventModeConfig.maxAssignmentsPerVolunteer = 4;
    } else {
      this.eventModeConfig.minThreshold = 0.20;
      this.eventModeConfig.maxRadius = 25000; // 25km radius
      this.eventModeConfig.maxAssignmentsPerVolunteer = 3;
    }

    console.log('📊 Thresholds adjusted based on availability:', {
      capacityStatus: stats.capacityStatus,
      coveragePercentage: stats.coveragePercentage,
      newThreshold: this.eventModeConfig.minThreshold,
      newRadius: this.eventModeConfig.maxRadius / 1000 + 'km',
      maxAssignments: this.eventModeConfig.maxAssignmentsPerVolunteer,
    });
  }

  /**
   * Smart assignment strategy selector based on current conditions
   */
  async getOptimalAssignmentStrategy(requestId: string): Promise<'enhanced' | 'emergency' | 'fallback'> {
    try {
      // Get request details
      const { data: request } = await supabase
        .from('assistance_requests')
        .select('priority, type, location')
        .eq('id', requestId)
        .single();

      if (!request) return 'fallback';

      // For high priority requests, use emergency strategy
      if (request.priority === 'high') {
        return 'emergency';
      }

      // If in event mode, use enhanced strategy
      if (this.eventModeConfig.isEventMode) {
        return 'enhanced';
      }

      // Default to enhanced for better results
      return 'enhanced';

    } catch (error) {
      console.error('❌ Error determining assignment strategy:', error);
      return 'fallback';
    }
  }

  /**
   * Send enhanced notifications to volunteers with context
   */
  private async sendVolunteerNotification(volunteerId: string, requestId: string, tier: string): Promise<void> {
    try {
      const urgencyLevel = tier === 'EMERGENCY_FALLBACK' ? 'urgent' : 'normal';
      const message = tier === 'EMERGENCY_FALLBACK' 
        ? 'Emergency assignment - Your immediate assistance is needed!'
        : `New assistance request assigned to you (${tier.toLowerCase()} match)`;

      await supabase.from('notifications').insert({
        user_id: volunteerId,
        title: urgencyLevel === 'urgent' ? '🚨 Emergency Assignment' : '📋 New Assignment',
        message,
        type: urgencyLevel,
        metadata: {
          request_id: requestId,
          assignment_tier: tier,
          assigned_at: new Date().toISOString(),
        },
      });

    } catch (error) {
      console.error('❌ Failed to send volunteer notification:', error);
    }
  }

  /**
   * Get current event mode configuration
   */
  getEventModeConfig(): EventModeConfig {
    return { ...this.eventModeConfig };
  }

  /**
   * Performance monitoring for large-scale events
   */
  async getPerformanceMetrics(): Promise<{
    assignmentSuccessRate: number;
    averageResponseTime: number;
    volunteerUtilization: number;
    systemLoad: string;
  }> {
    try {
      // Get assignment success rate from last 100 requests
      const { data: recentAssignments } = await supabase
        .from('assistance_requests')
        .select('status, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      const assigned = recentAssignments?.filter(r => r.status !== 'pending').length || 0;
      const total = recentAssignments?.length || 1;
      const successRate = (assigned / total) * 100;

      // Get average response time
      const { data: responseData } = await supabase
        .from('assignments')
        .select('assigned_at, request_id')
        .not('assigned_at', 'is', null)
        .order('assigned_at', { ascending: false })
        .limit(50);

      const avgResponseTime = responseData?.length || 0;

      return {
        assignmentSuccessRate: successRate,
        averageResponseTime: avgResponseTime > 0 ? 2.5 : 0, // Simplified for demo
        volunteerUtilization: 75, // Simplified for demo
        systemLoad: successRate > 70 ? 'NORMAL' : successRate > 40 ? 'MODERATE' : 'HIGH',
      };

    } catch (error) {
      console.error('❌ Error getting performance metrics:', error);
      return {
        assignmentSuccessRate: 0,
        averageResponseTime: 0,
        volunteerUtilization: 0,
        systemLoad: 'ERROR',
      };
    }
  }
}

export const largeScaleEventAutoAssignmentService = new LargeScaleEventAutoAssignmentService();
