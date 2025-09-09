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
      console.log('🔍 Scored volunteers:', scoredVolunteers.map(v => ({ 
        name: v.volunteer.name, 
        score: v.score.toFixed(3),
        skillMatch: v.skillMatch.toFixed(3),
        distance: v.distance,
        availability: v.availabilityScore.toFixed(3)
      })));
      
      // Sort by best match (highest score)
      scoredVolunteers.sort((a, b) => b.score - a.score);
      
      const bestMatch = scoredVolunteers[0];
      console.log(`🎯 Best match: ${bestMatch.volunteer.name} with score ${(bestMatch.score * 100).toFixed(1)}%`);
      
      // Only auto-assign if the match score is above threshold
      const MIN_MATCH_SCORE = 0.25; // Further lowered threshold for better assignment success rate
      if (bestMatch.score < MIN_MATCH_SCORE) {
        console.log(`❌ Best match score ${(bestMatch.score * 100).toFixed(1)}% below threshold (${(MIN_MATCH_SCORE * 100)}%)`);
        // Try to find any alternative by further lowering standards temporarily
        if (scoredVolunteers.length > 0) {
          const emergencyMatch = scoredVolunteers[0];
          if (emergencyMatch.score >= 0.15 && request.priority === 'high') {
            console.log(`🚨 Emergency assignment for high priority request with score ${(emergencyMatch.score * 100).toFixed(1)}%`);
            const assignment = await this.createAssignment(request, emergencyMatch.volunteer);
            if (assignment) {
              await this.updateRequestStatus(requestId, 'assigned');
              await this.updateVolunteerStatus(emergencyMatch.volunteer.id, 'busy');
              await this.notifyVolunteer(emergencyMatch.volunteer, request, assignment.id);
              
              return {
                success: true,
                assignedVolunteer: emergencyMatch.volunteer,
                assignmentId: assignment.id,
                message: `Emergency assignment to ${emergencyMatch.volunteer.name} (${(emergencyMatch.score * 100).toFixed(1)}% match)`,
                matchScore: emergencyMatch.score
              };
            }
          }
        }
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
          max_distance_meters: 15000, // Increased from 10km to 15km radius
          required_skills: [], // Removed strict skill requirements for broader search
          limit_count: 20 // Increased from 10 to get more candidates
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
            max_distance_meters: 25000, // Further expand to 25km radius
            required_skills: [], // Remove skill requirements
            limit_count: 30
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
          .in('volunteer_status', ['available', 'busy', 'offline']) // Include more statuses
          .limit(30); // Increased limit

        if (fallbackError) {
          console.error('❌ Fallback volunteer query failed:', fallbackError);
          return [];
        }

        console.log('✅ Found volunteers via fallback query:', volunteers?.length || 0);
        
        // Calculate distance manually for fallback volunteers (assign reasonable defaults)
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
          distance_meters: 8000 // Default reasonable distance for fallback
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
    // Skill matching score (35% weight) - reduced to allow for more flexibility
    const skillMatch = this.calculateSkillMatch(request.type, volunteer.skills || []);
    
    // Distance score (25% weight) - reduced emphasis on distance
    const distanceScore = this.calculateDistanceScore(volunteer.distance_meters || 0);
    
    // Availability score (30% weight) - increased to prioritize available volunteers
    const availabilityScore = this.calculateAvailabilityScore(volunteer.volunteer_status, volunteer.rating || 0);
    
    // Priority urgency bonus (10% weight)
    const urgencyBonus = this.calculateUrgencyBonus(request.priority);

    // Check current workload and adjust availability accordingly
    const workloadPenalty = await this.calculateWorkloadPenalty(volunteer.volunteer_id || volunteer.id);

    // Weighted final score with more balanced approach
    const finalScore = (
      skillMatch * 0.35 +
      distanceScore * 0.25 +
      (availabilityScore - workloadPenalty) * 0.30 +
      urgencyBonus * 0.10
    );

    return {
      volunteer: {
        id: volunteer.volunteer_id || volunteer.id,
        user_id: volunteer.volunteer_id || volunteer.id,
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
      score: Math.max(Math.min(finalScore, 1.0), 0.0), // Cap between 0 and 1
      distance: volunteer.distance_meters || 0,
      skillMatch,
      availabilityScore
    };
  }

  /**
   * Calculate workload penalty based on current assignments
   */
  private async calculateWorkloadPenalty(volunteerId: string): Promise<number> {
    try {
      const { data: assignments, error } = await supabase
        .from('assignments')
        .select('id')
        .eq('volunteer_id', volunteerId)
        .in('status', ['pending', 'accepted', 'in_progress']);

      if (error) {
        console.log('⚠️ Could not check workload for volunteer:', volunteerId);
        return 0; // No penalty if we can't check
      }

      const activeCount = assignments?.length || 0;
      
      // Penalty increases with workload
      if (activeCount === 0) return 0;     // No penalty
      if (activeCount === 1) return 0.1;   // Small penalty  
      if (activeCount === 2) return 0.2;   // Medium penalty
      if (activeCount >= 3) return 0.4;    // High penalty
      
      return 0;
    } catch (error) {
      console.log('⚠️ Error checking workload:', error);
      return 0; // No penalty on error
    }
  }

  /**
   * Calculate skill matching score
   */
  private calculateSkillMatch(requestType: string, volunteerSkills: string[]): number {
    const requiredSkills = this.getRequiredSkills(requestType);
    
    if (!requiredSkills || requiredSkills.length === 0) {
      return 0.8; // Higher base score for general requests
    }

    if (!volunteerSkills || volunteerSkills.length === 0) {
      return 0.5; // Increased score for volunteers with no listed skills (give them a chance)
    }

    // Calculate overlap with more flexible matching
    const matchingSkills = requiredSkills.filter(skill => 
      volunteerSkills.some(vSkill => 
        vSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(vSkill.toLowerCase()) ||
        this.areSkillsRelated(skill, vSkill) // Add related skill matching
      )
    );

    const matchRatio = matchingSkills.length / requiredSkills.length;
    
    // Bonus for having more relevant skills
    const skillBonus = volunteerSkills.filter(skill => 
      skill.toLowerCase().includes(requestType.toLowerCase())
    ).length * 0.1;

    // Ensure minimum score for general helpfulness
    const minScore = 0.4;
    const calculatedScore = Math.min(matchRatio + skillBonus, 1.0);
    
    return Math.max(calculatedScore, minScore);
  }

  /**
   * Check if two skills are related (helper method for better matching)
   */
  private areSkillsRelated(skill1: string, skill2: string): boolean {
    const relatedSkills: Record<string, string[]> = {
      'medical': ['health', 'nurse', 'doctor', 'paramedic', 'first_aid'],
      'emergency': ['crisis', 'urgent', 'rescue', 'safety'],
      'guidance': ['help', 'assist', 'support', 'direct', 'guide'],
      'communication': ['language', 'speak', 'translate', 'talk'],
      'crowd_management': ['security', 'control', 'organize', 'manage'],
      'cleaning': ['sanitation', 'hygiene', 'maintenance', 'tidy']
    };

    const s1 = skill1.toLowerCase();
    const s2 = skill2.toLowerCase();

    for (const [key, related] of Object.entries(relatedSkills)) {
      if ((s1.includes(key) || related.some(r => s1.includes(r))) &&
          (s2.includes(key) || related.some(r => s2.includes(r)))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate distance-based score (closer = higher score)
   */
  private calculateDistanceScore(distanceMeters: number): number {
    if (distanceMeters <= 500) return 1.0;       // Within 0.5km - excellent
    if (distanceMeters <= 1000) return 0.9;      // Within 1km - very good
    if (distanceMeters <= 2000) return 0.8;      // Within 2km - good
    if (distanceMeters <= 5000) return 0.7;      // Within 5km - acceptable
    if (distanceMeters <= 10000) return 0.6;     // Within 10km - fair
    if (distanceMeters <= 15000) return 0.4;     // Within 15km - acceptable for urgent cases
    return 0.3; // Beyond 15km but still possible
  }

  /**
   * Calculate availability and rating score
   */
  private calculateAvailabilityScore(status: string, rating: number): number {
    let baseScore = 0;
    
    // Status-based scoring with more lenient approach
    switch (status) {
      case 'available':
        baseScore = 1.0;
        break;
      case 'busy':
        baseScore = 0.6; // Increased from 0.3 - busy volunteers can still help if needed
        break;
      case 'offline':
        baseScore = 0.3; // Increased from 0.1 - they might come online
        break;
      default:
        baseScore = 0.7; // More optimistic default
    }

    // Rating bonus (0-5 scale) with more generous scaling
    const ratingBonus = (rating || 3) / 5 * 0.3; // Default to 3 if no rating, increased bonus
    
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
