import { supabase } from './supabase';
import { AssistanceRequest, User, Assignment } from '../types';

export interface VolunteerMatch {
  volunteer: User;
  score: number;
  distance: number;
  skillMatch: number;
  availabilityScore: number;
}

export interface AutoAssignmentResult {
  success: boolean;
  assignedVolunteer?: User;
  assignmentId?: string;
  message: string;
  matchScore?: number;
}

class AutoAssignmentService {
  /**
   * Automatically assign a request to the best matching volunteer
   */
  async autoAssignRequest(requestId: string): Promise<AutoAssignmentResult> {
    try {
      console.log('🔍 Auto-assignment service: Starting for request ID:', requestId);
      
      // Get request details
      const { data: request, error: requestError } = await supabase
        .from('assistance_requests')
        .select('*')
        .eq('id', requestId)
        .eq('status', 'pending')
        .single();

      console.log('🔍 Request query result:', { request, requestError });

      if (requestError || !request) {
        console.error('❌ Request not found or error:', requestError);
        return {
          success: false,
          message: 'Request not found or not pending'
        };
      }

      // Find matching volunteers
      console.log('🔍 Finding matching volunteers for request:', request.type);
      const volunteers = await this.findMatchingVolunteers(request);
      console.log('🔍 Found volunteers:', volunteers.length);
      
      if (volunteers.length === 0) {
        console.log('❌ No volunteers found');
        return { success: false, message: 'No available volunteers found' };
      }

      // Calculate match scores for each volunteer
      console.log('🔍 Scoring volunteers...');
      const scoredVolunteers = await this.scoreVolunteers(request, volunteers);
      console.log('🔍 Scored volunteers:', scoredVolunteers.map(v => ({ name: v.volunteer.name, score: v.score })));
      
      // Sort by best match (highest score)
      scoredVolunteers.sort((a, b) => b.score - a.score);
      
      const bestMatch = scoredVolunteers[0];
      
      // Only auto-assign if the match score is above threshold
      if (bestMatch.score < 0.6) {
        return { 
          success: false, 
          message: `Best match score (${(bestMatch.score * 100).toFixed(1)}%) below threshold. Manual assignment recommended.` 
        };
      }

      // Create the assignment
      const assignment = await this.createAssignment(request, bestMatch.volunteer);
      
      if (assignment) {
        // Update request status
        await this.updateRequestStatus(requestId, 'assigned');
        
        // Update volunteer status to busy
        await this.updateVolunteerStatus(bestMatch.volunteer.id, 'busy');
        
        // Send notification to volunteer
        await this.notifyVolunteer(bestMatch.volunteer, request, assignment.id);
        
        return {
          success: true,
          assignedVolunteer: bestMatch.volunteer,
          assignmentId: assignment.id,
          message: `Successfully assigned to ${bestMatch.volunteer.name}`,
          matchScore: bestMatch.score
        };
      }
      
      return { success: false, message: 'Failed to create assignment' };
      
    } catch (error) {
      console.error('Auto assignment error:', error);
      return { success: false, message: 'Auto assignment failed due to system error' };
    }
  }

  /**
   * Get request details with location
   */
  private async getRequestDetails(requestId: string): Promise<AssistanceRequest | null> {
    const { data, error } = await supabase
      .from('assistance_requests')
      .select(`
        *,
        user:profiles(name, phone)
      `)
      .eq('id', requestId)
      .eq('status', 'pending')
      .single();

    if (error || !data) {
      console.error('Error fetching request:', error);
      return null;
    }

    return data as AssistanceRequest;
  }

  /**
   * Find volunteers that could potentially handle the request
   */
  private async findMatchingVolunteers(request: AssistanceRequest): Promise<User[]> {
    // Extract coordinates from request location
    const { data: locationData } = await supabase.rpc('get_coordinates_from_geography', {
      geo_point: request.location
    });

    if (!locationData || locationData.length === 0) {
      console.error('Could not extract coordinates from request location');
      return [];
    }

    const { latitude, longitude } = locationData[0];

    // Use the existing find_nearest_volunteers function
    const { data: volunteers, error } = await supabase.rpc('find_nearest_volunteers', {
      target_lat: latitude,
      target_lng: longitude,
      max_distance_meters: 10000, // 10km radius
      required_skills: this.getRequiredSkills(request.type),
      limit_count: 10
    });

    if (error) {
      console.error('Error finding volunteers:', error);
      return [];
    }

    return volunteers || [];
  }

  /**
   * Calculate match scores for volunteers based on multiple factors
   */
  private async scoreVolunteers(request: AssistanceRequest, volunteers: User[]): Promise<VolunteerMatch[]> {
    const scoredVolunteers: VolunteerMatch[] = [];

    for (const volunteer of volunteers) {
      const score = await this.calculateMatchScore(request, volunteer);
      scoredVolunteers.push(score);
    }

    return scoredVolunteers;
  }

  /**
   * Calculate comprehensive match score for a volunteer
   */
  private async calculateMatchScore(request: AssistanceRequest, volunteer: any): Promise<VolunteerMatch> {
    // Skill matching score (40% weight)
    const skillMatch = this.calculateSkillMatch(request.type, volunteer.skills || []);
    
    // Distance score (30% weight) - closer is better
    const distanceScore = this.calculateDistanceScore(volunteer.distance_meters || 0);
    
    // Availability score (20% weight)
    const availabilityScore = this.calculateAvailabilityScore(volunteer.volunteer_status, volunteer.rating || 0);
    
    // Priority urgency bonus (10% weight)
    const urgencyBonus = this.calculateUrgencyBonus(request.priority);

    // Weighted final score
    const finalScore = (
      skillMatch * 0.4 +
      distanceScore * 0.3 +
      availabilityScore * 0.2 +
      urgencyBonus * 0.1
    );

    return {
      volunteer: {
        id: volunteer.volunteer_id,
        user_id: volunteer.volunteer_id,
        name: volunteer.name,
        email: '',
        phone: volunteer.phone,
        role: 'volunteer',
        skills: volunteer.skills,
        volunteer_status: volunteer.volunteer_status,
        rating: volunteer.rating,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as User,
      score: Math.min(finalScore, 1.0), // Cap at 1.0
      distance: volunteer.distance_meters || 0,
      skillMatch,
      availabilityScore
    };
  }

  /**
   * Calculate skill matching score
   */
  private calculateSkillMatch(requestType: string, volunteerSkills: string[]): number {
    const requiredSkills = this.getRequiredSkills(requestType);
    
    if (!requiredSkills || requiredSkills.length === 0) {
      return 0.7; // Base score for general requests
    }

    if (!volunteerSkills || volunteerSkills.length === 0) {
      return 0.3; // Low score for volunteers with no listed skills
    }

    // Calculate overlap
    const matchingSkills = requiredSkills.filter(skill => 
      volunteerSkills.some(vSkill => 
        vSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(vSkill.toLowerCase())
      )
    );

    const matchRatio = matchingSkills.length / requiredSkills.length;
    
    // Bonus for having more relevant skills
    const skillBonus = volunteerSkills.filter(skill => 
      skill.toLowerCase().includes(requestType.toLowerCase())
    ).length * 0.1;

    return Math.min(matchRatio + skillBonus, 1.0);
  }

  /**
   * Calculate distance-based score (closer = higher score)
   */
  private calculateDistanceScore(distanceMeters: number): number {
    if (distanceMeters <= 1000) return 1.0;      // Within 1km
    if (distanceMeters <= 3000) return 0.8;      // Within 3km
    if (distanceMeters <= 5000) return 0.6;      // Within 5km
    if (distanceMeters <= 10000) return 0.4;     // Within 10km
    return 0.2; // Beyond 10km
  }

  /**
   * Calculate availability and rating score
   */
  private calculateAvailabilityScore(status: string, rating: number): number {
    let baseScore = 0;
    
    // Status-based scoring
    switch (status) {
      case 'available':
        baseScore = 1.0;
        break;
      case 'busy':
        baseScore = 0.3; // Can still be assigned if urgent
        break;
      case 'offline':
        baseScore = 0.1;
        break;
      default:
        baseScore = 0.5;
    }

    // Rating bonus (0-5 scale)
    const ratingBonus = (rating || 0) / 5 * 0.2;
    
    return Math.min(baseScore + ratingBonus, 1.0);
  }

  /**
   * Calculate urgency bonus for high priority requests
   */
  private calculateUrgencyBonus(priority: string): number {
    switch (priority) {
      case 'high':
        return 1.0;
      case 'medium':
        return 0.7;
      case 'low':
        return 0.4;
      default:
        return 0.5;
    }
  }

  /**
   * Get required skills based on request type
   */
  private getRequiredSkills(requestType: string): string[] {
    const skillMap: Record<string, string[]> = {
      medical: ['medical', 'first_aid', 'healthcare', 'emergency'],
      emergency: ['emergency', 'medical', 'first_aid', 'crisis_management'],
      lost_person: ['search_rescue', 'crowd_management', 'communication', 'local_knowledge'],
      sanitation: ['cleaning', 'sanitation', 'maintenance', 'hygiene'],
      crowd_management: ['crowd_management', 'security', 'communication', 'organization'],
      guidance: ['local_knowledge', 'tour_guide', 'navigation', 'language'],
      general: ['general', 'assistance', 'support']
    };

    return skillMap[requestType] || skillMap.general;
  }

  /**
   * Create assignment record
   */
  private async createAssignment(request: AssistanceRequest, volunteer: User): Promise<Assignment | null> {
    const { data, error } = await supabase
      .from('assignments')
      .insert({
        request_id: request.id,
        volunteer_id: volunteer.id,
        status: 'pending',
        assigned_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating assignment:', error);
      return null;
    }

    return data as Assignment;
  }

  /**
   * Update request status
   */
  private async updateRequestStatus(requestId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('assistance_requests')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) {
      console.error('Error updating request status:', error);
    }
  }

  /**
   * Update volunteer status
   */
  private async updateVolunteerStatus(volunteerId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        volunteer_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', volunteerId);

    if (error) {
      console.error('Error updating volunteer status:', error);
    }
  }

  /**
   * Send notification to assigned volunteer
   */
  private async notifyVolunteer(volunteer: User, request: AssistanceRequest, assignmentId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: volunteer.id,
        title: 'New Task Assignment',
        body: `You have been assigned to: ${request.title}`,
        type: 'assignment',
        data: {
          request_id: request.id,
          assignment_id: assignmentId,
          priority: request.priority
        }
      });

    if (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Get assignment statistics for monitoring
   */
  async getAssignmentStats(): Promise<{
    totalAutoAssignments: number;
    successRate: number;
    averageMatchScore: number;
  }> {
    // This would track auto-assignment metrics
    // Implementation depends on whether you want to store assignment metadata
    return {
      totalAutoAssignments: 0,
      successRate: 0,
      averageMatchScore: 0
    };
  }
}

export const autoAssignmentService = new AutoAssignmentService();
