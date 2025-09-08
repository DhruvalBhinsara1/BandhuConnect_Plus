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
      const MIN_MATCH_SCORE = 0.4; // Lowered threshold for better assignment success rate
      if (bestMatch.score < MIN_MATCH_SCORE) {
        console.log(`❌ Best match score ${(bestMatch.score * 100).toFixed(1)}% below threshold (${(MIN_MATCH_SCORE * 100)}%)`);
        return { 
          success: false, 
          message: `Best match score (${(bestMatch.score * 100).toFixed(1)}%) below threshold (${(MIN_MATCH_SCORE * 100)}%). Manual assignment recommended.` 
        };
      }
      
      console.log(`✅ Auto-assigning to ${bestMatch.volunteer.name} with score ${(bestMatch.score * 100).toFixed(1)}%`);

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
    try {
      console.log('🔍 Finding volunteers for request location:', request.location);
      
      // Try to extract coordinates from request location using multiple methods
      let latitude: number, longitude: number;
      
      // Method 1: Try the RPC function if it exists
      try {
        const { data: locationData, error: rpcError } = await supabase.rpc('get_coordinates_from_geography', {
          geo_point: request.location
        });

        if (!rpcError && locationData && locationData.length > 0) {
          latitude = locationData[0].latitude;
          longitude = locationData[0].longitude;
          console.log('✅ Extracted coordinates via RPC:', { latitude, longitude });
        } else {
          throw new Error('RPC method failed');
        }
      } catch (rpcError) {
        console.log('⚠️ RPC coordinate extraction failed, trying direct query...');
        
        // Method 2: Use request location directly if it has coordinates
        if (request.location && typeof request.location === 'object') {
          const locationObj = request.location as any;
          if (locationObj.coordinates && Array.isArray(locationObj.coordinates)) {
            longitude = locationObj.coordinates[0];
            latitude = locationObj.coordinates[1];
            console.log('✅ Extracted coordinates from location object:', { latitude, longitude });
          } else if (locationObj.latitude && locationObj.longitude) {
            latitude = locationObj.latitude;
            longitude = locationObj.longitude;
            console.log('✅ Extracted coordinates from location properties:', { latitude, longitude });
          } else {
            console.error('❌ Could not extract coordinates from request location object');
            return [];
          }
        } else {
          console.error('❌ Request location is not a valid object');
          return [];
        }
        console.log('✅ Extracted coordinates via direct query:', { latitude, longitude });
      }

      // Try to use the find_nearest_volunteers function
      try {
        const { data: volunteers, error } = await supabase.rpc('find_nearest_volunteers', {
          target_lat: latitude,
          target_lng: longitude,
          max_distance_meters: 10000, // 10km radius
          required_skills: this.getRequiredSkills(request.type),
          limit_count: 10
        });

        if (error) {
          throw new Error(`RPC find_nearest_volunteers failed: ${error.message}`);
        }

        console.log('✅ Found volunteers via RPC:', volunteers?.length || 0);
        
        // If no volunteers found with current criteria, try expanded search
        if (!volunteers || volunteers.length === 0) {
          console.log('🔍 No volunteers found with current criteria, expanding search...');
          
          const { data: expandedVolunteers, error: expandedError } = await supabase.rpc('find_nearest_volunteers', {
            target_lat: latitude,
            target_lng: longitude,
            max_distance_meters: 20000, // Expand to 20km radius
            required_skills: [], // Remove skill requirements
            limit_count: 15
          });
          
          if (!expandedError && expandedVolunteers && expandedVolunteers.length > 0) {
            console.log('✅ Found volunteers with expanded search:', expandedVolunteers.length);
            return expandedVolunteers;
          }
        }
        
        return volunteers || [];
      } catch (rpcError) {
        console.log('⚠️ RPC volunteer search failed, using fallback query...');
        
        // Fallback: Simple query for volunteers without distance calculation
        const { data: volunteers, error: fallbackError } = await supabase
          .from('profiles')
          .select(`
            id,
            name,
            phone,
            skills,
            volunteer_status,
            rating
          `)
          .eq('role', 'volunteer')
          .eq('is_active', true)
          .in('volunteer_status', ['available', 'busy'])
          .limit(20);

        if (fallbackError) {
          console.error('❌ Fallback volunteer query failed:', fallbackError);
          return [];
        }

        console.log('✅ Found volunteers via fallback query:', volunteers?.length || 0);
        
        // Calculate distance manually for fallback volunteers
        return (volunteers || []).map(v => ({
          id: v.id,
          user_id: v.id,
          name: v.name,
          email: '',
          phone: v.phone,
          role: 'volunteer',
          skills: v.skills,
          volunteer_status: v.volunteer_status,
          rating: v.rating,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          volunteer_id: v.id,
          distance_meters: 5000 // Default distance for fallback
        })) as User[];
      }
    } catch (error) {
      console.error('❌ Error in findMatchingVolunteers:', error);
      return [];
    }
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
   * Create assignment record with comprehensive error handling
   */
  private async createAssignment(request: AssistanceRequest, volunteer: User): Promise<Assignment | null> {
    try {
      console.log('🔄 Creating assignment via multiple methods...');
      
      // Method 1: Try the SECURITY DEFINER function
      try {
        const { data: assignmentId, error: rpcError } = await supabase
          .rpc('create_assignment_safe', {
            p_request_id: request.id,
            p_volunteer_id: volunteer.id,
            p_status: 'pending'
          });

        if (!rpcError && assignmentId) {
          console.log('✅ Assignment created via RPC:', assignmentId);
          
          // Fetch the created assignment details
          const { data: assignment, error: fetchError } = await supabase
            .from('assignments')
            .select('*')
            .eq('id', assignmentId)
            .single();

          if (!fetchError && assignment) {
            return assignment as Assignment;
          }
          
          // Return basic assignment if fetch fails
          return {
            id: assignmentId,
            request_id: request.id,
            volunteer_id: volunteer.id,
            status: 'pending',
            assigned_at: new Date().toISOString()
          } as Assignment;
        }
        
        console.log('⚠️ RPC method failed, trying direct insert...', rpcError?.message);
      } catch (rpcError) {
        console.log('⚠️ RPC method threw error, trying direct insert...', rpcError);
      }

      // Method 2: Direct insert with better error handling
      try {
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

        if (!error && data) {
          console.log('✅ Assignment created via direct insert:', data.id);
          return data as Assignment;
        }
        
        console.log('⚠️ Direct insert failed, trying assignment service...', error?.message);
      } catch (insertError) {
        console.log('⚠️ Direct insert threw error, trying assignment service...', insertError);
      }

      // Method 3: Use the assignment service as final fallback
      try {
        const { assignmentService } = await import('./assignmentService');
        const result = await assignmentService.createAssignment(request.id, volunteer.id);
        
        if (!result.error && result.data) {
          console.log('✅ Assignment created via assignment service:', result.data.id);
          return result.data as Assignment;
        }
        
        console.log('❌ Assignment service also failed:', result.error?.message);
      } catch (serviceError) {
        console.log('❌ Assignment service threw error:', serviceError);
      }

      console.error('❌ All assignment creation methods failed');
      return null;
    } catch (error) {
      console.error('❌ Unexpected error in createAssignment:', error);
      return null;
    }
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
