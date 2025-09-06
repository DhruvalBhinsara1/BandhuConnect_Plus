import { supabase } from './supabase';
import { ACTIVE_ASSIGNMENT_STATUSES } from './assignmentService';

/**
 * Automatic Assignment Repair Service
 * Handles assignment visibility issues without manual intervention
 */

export interface AssignmentRepairResult {
  success: boolean;
  message: string;
  repaired?: boolean;
  assignmentId?: string;
}

interface VolunteerProfile {
  id: string;
  name: string;
  workload?: number;
  rating?: number;
  lastActive?: string;
}

/**
 * Repair configuration options
 */
interface RepairConfig {
  maxVolunteersToCheck?: number;
  preferredSelectionStrategy?: 'workload' | 'random' | 'alphabetical';
  enableWorkloadBalancing?: boolean;
  maxRetryAttempts?: number;
}

const DEFAULT_REPAIR_CONFIG: RepairConfig = {
  maxVolunteersToCheck: 10,
  preferredSelectionStrategy: 'workload',
  enableWorkloadBalancing: true,
  maxRetryAttempts: 3
};

/**
 * Intelligent volunteer selection algorithm
 * Prioritizes based on workload, availability, and performance
 */
const selectOptimalVolunteer = async (
  volunteers: VolunteerProfile[], 
  userId: string, 
  config: RepairConfig = DEFAULT_REPAIR_CONFIG
): Promise<VolunteerProfile> => {
  // If no volunteers available, throw error
  if (!volunteers || volunteers.length === 0) {
    throw new Error('No volunteers available for assignment');
  }

  // Single volunteer - return immediately
  if (volunteers.length === 1) {
    return volunteers[0];
  }

  // Apply selection strategy
  switch (config.preferredSelectionStrategy) {
    case 'workload':
      return await selectByWorkload(volunteers, userId);
    case 'random':
      return volunteers[Math.floor(Math.random() * volunteers.length)];
    case 'alphabetical':
      return volunteers.sort((a, b) => a.name.localeCompare(b.name))[0];
    default:
      return await selectByWorkload(volunteers, userId);
  }
};

/**
 * Select volunteer based on current workload (most fair distribution)
 */
const selectByWorkload = async (volunteers: VolunteerProfile[], userId: string): Promise<VolunteerProfile> => {
  // Get current workload for each volunteer
  const volunteersWithWorkload = await Promise.all(
    volunteers.map(async (volunteer) => {
      const { data: activeAssignments } = await supabase
        .from('assignments')
        .select('id')
        .eq('volunteer_id', volunteer.id)
        .in('status', ACTIVE_ASSIGNMENT_STATUSES);

      return {
        ...volunteer,
        workload: activeAssignments?.length || 0
      };
    })
  );

  // Sort by workload (ascending) then by name for consistency
  volunteersWithWorkload.sort((a, b) => {
    if (a.workload !== b.workload) {
      return a.workload - b.workload; // Lower workload first
    }
    return a.name.localeCompare(b.name); // Alphabetical for tie-breaking
  });

  console.log(`🎯 Volunteer selection for user ${userId}:`);
  volunteersWithWorkload.forEach(v => 
    console.log(`   - ${v.name}: ${v.workload} active assignments`)
  );

  return volunteersWithWorkload[0];
};

/**
 * Automatically repairs missing assignments by linking assistance requests to assignments
 */
export const repairMissingAssignments = async (
  userId: string, 
  config: RepairConfig = DEFAULT_REPAIR_CONFIG
): Promise<AssignmentRepairResult> => {
  try {
    console.log(`🔧 Starting assignment repair for user: ${userId}`);

    // 1. First, clean up any broken assignments for this user
    await repairDuplicateAssignments(userId, config);

    // 2. Check if user has any active assignments after cleanup
    const { data: existingAssignments, error: assignmentError } = await supabase
      .from('assignments')
      .select('id, status, pilgrim_id, volunteer_id')
      .or(`volunteer_id.eq.${userId},pilgrim_id.eq.${userId}`)
      .in('status', ACTIVE_ASSIGNMENT_STATUSES);

    if (assignmentError) {
      console.error('❌ Error checking existing assignments:', assignmentError);
      return { success: false, message: 'Failed to check existing assignments' };
    }

    if (existingAssignments && existingAssignments.length > 0) {
      console.log('✅ User already has active assignments after cleanup');
      return { 
        success: true, 
        message: 'User already has active assignments',
        assignmentId: existingAssignments[0].id 
      };
    }

    // 2. Look for assigned assistance requests without corresponding assignments
    const { data: orphanedRequests, error: requestError } = await supabase
      .from('assistance_requests')
      .select('id, user_id, title, created_at')
      .eq('user_id', userId)
      .eq('status', 'assigned');

    if (requestError) {
      console.error('❌ Error checking assistance requests:', requestError);
      return { success: false, message: 'Failed to check assistance requests' };
    }

    if (!orphanedRequests || orphanedRequests.length === 0) {
      console.log('ℹ️ No orphaned assistance requests found');
      return { success: true, message: 'No repair needed - no orphaned requests' };
    }

    // 3. Find available volunteers using configurable selection
    const { data: availableVolunteers, error: volunteerError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('role', 'volunteer')
      .order('name')
      .limit(config.maxVolunteersToCheck || 10);

    if (volunteerError || !availableVolunteers || availableVolunteers.length === 0) {
      console.error('❌ No available volunteers found:', volunteerError);
      return { success: false, message: 'No available volunteers for assignment' };
    }

    // 4. Before creating new assignment, check ALL assignments for this pilgrim
    const { data: allAssignments, error: allAssignmentsError } = await supabase
      .from('assignments')
      .select('id, status, created_at')
      .eq('pilgrim_id', userId);

    console.log(`🔍 ALL assignments for pilgrim ${userId}:`, allAssignments);

    // Now check specifically for constraint-violating assignments
    const { data: finalCheck, error: finalCheckError } = await supabase
      .from('assignments')
      .select('id, status, created_at')
      .eq('pilgrim_id', userId)
      .in('status', ACTIVE_ASSIGNMENT_STATUSES);

    console.log(`🔍 Final check found ${finalCheck?.length || 0} active assignments:`, finalCheck);

    if (finalCheckError) {
      console.error('❌ Error in final assignment check:', finalCheckError);
      return { success: false, message: 'Failed final assignment check' };
    }

    // Generalized constraint handling using smart upsert strategy
    const requestToLink = orphanedRequests[0];
    
    // Use intelligent volunteer selection algorithm
    const volunteerToAssign = await selectOptimalVolunteer(availableVolunteers, userId);
    
    console.log(`🔄 Using generalized upsert strategy for any constraint scenario...`);
    console.log(`📋 Linking request "${requestToLink.title}" to volunteer "${volunteerToAssign.name}"`);
    
    // Strategy 1: Try direct insert first (works for users with no existing assignments)
    const { data: newAssignment, error: insertError } = await supabase
      .from('assignments')
      .insert({
        request_id: requestToLink.id,
        volunteer_id: volunteerToAssign.id,
        pilgrim_id: userId,
        status: 'pending',
        assigned: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (!insertError) {
      console.log('✅ Successfully created new assignment:', newAssignment.id);
      return {
        success: true,
        message: 'Assignment successfully created',
        repaired: true,
        assignmentId: newAssignment.id
      };
    }

    // Strategy 2: If insert fails due to constraint, update existing assignment
    console.log('❌ Insert failed due to constraint, updating existing assignment:', insertError.message);
    
    if (allAssignments && allAssignments.length > 0) {
      const existingAssignment = allAssignments[0];
      console.log(`🔄 Updating existing assignment ${existingAssignment.id}...`);
      
      const { data: updatedAssignment, error: updateError } = await supabase
        .from('assignments')
        .update({
          request_id: requestToLink.id,
          volunteer_id: volunteerToAssign.id,
          status: 'pending',
          assigned: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAssignment.id)
        .select()
        .single();
        
      if (updateError) {
        console.error('❌ Error updating existing assignment:', updateError);
        return { success: false, message: 'Failed to update existing assignment' };
      }

      console.log('✅ Successfully updated existing assignment:', updatedAssignment.id);
      return {
        success: true,
        message: 'Assignment successfully repaired by updating existing record',
        repaired: true,
        assignmentId: updatedAssignment.id
      };
    }
    
    // Strategy 3: Last resort - return failure
    return { 
      success: false, 
      message: 'Could not create or update assignment - no existing records to update' 
    };

  } catch (error) {
    console.error('❌ Unexpected error in assignment repair:', error);
    return { success: false, message: 'Unexpected error during repair' };
  }
};

/**
 * Repairs duplicate assignments by completing older ones
 */
export const repairDuplicateAssignments = async (
  userId: string, 
  config: RepairConfig = DEFAULT_REPAIR_CONFIG
): Promise<AssignmentRepairResult> => {
  try {
    console.log(`🔧 Checking for duplicate assignments for user: ${userId}`);

    // Find all active assignments for this user as pilgrim (where constraint applies)
    const { data: pilgrimAssignments, error: pilgrimError } = await supabase
      .from('assignments')
      .select('id, created_at, status, volunteer_id, pilgrim_id')
      .eq('pilgrim_id', userId)
      .in('status', ACTIVE_ASSIGNMENT_STATUSES)
      .order('created_at', { ascending: true });

    console.log(`🔍 Found ${pilgrimAssignments?.length || 0} active pilgrim assignments for ${userId}:`, pilgrimAssignments);

    if (pilgrimError) {
      console.error('❌ Error checking pilgrim assignments:', pilgrimError);
      return { success: false, message: 'Failed to check pilgrim assignments' };
    }

    // Find all active assignments for this user as volunteer
    const { data: volunteerAssignments, error: volunteerError } = await supabase
      .from('assignments')
      .select('id, created_at, status, volunteer_id, pilgrim_id')
      .eq('volunteer_id', userId)
      .in('status', ACTIVE_ASSIGNMENT_STATUSES)
      .order('created_at', { ascending: true });

    if (volunteerError) {
      console.error('❌ Error checking volunteer assignments:', volunteerError);
      return { success: false, message: 'Failed to check volunteer assignments' };
    }

    let totalCompleted = 0;
    let keepAssignmentId = null;

    // Handle pilgrim assignments (where unique constraint applies)
    if (pilgrimAssignments && pilgrimAssignments.length > 1) {
      const assignmentsToComplete = pilgrimAssignments.slice(0, -1);
      const keepAssignment = pilgrimAssignments[pilgrimAssignments.length - 1];
      keepAssignmentId = keepAssignment.id;

      for (const assignment of assignmentsToComplete) {
        const { error: updateError } = await supabase
          .from('assignments')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', assignment.id);

        if (updateError) {
          console.error(`❌ Error completing duplicate pilgrim assignment ${assignment.id}:`, updateError);
        } else {
          console.log(`✅ Completed duplicate pilgrim assignment: ${assignment.id}`);
          totalCompleted++;
        }
      }
    } else if (pilgrimAssignments && pilgrimAssignments.length === 1) {
      keepAssignmentId = pilgrimAssignments[0].id;
    }

    // Handle volunteer assignments
    if (volunteerAssignments && volunteerAssignments.length > 1) {
      const assignmentsToComplete = volunteerAssignments.slice(0, -1);
      const keepAssignment = volunteerAssignments[volunteerAssignments.length - 1];
      if (!keepAssignmentId) keepAssignmentId = keepAssignment.id;

      for (const assignment of assignmentsToComplete) {
        const { error: updateError } = await supabase
          .from('assignments')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', assignment.id);

        if (updateError) {
          console.error(`❌ Error completing duplicate volunteer assignment ${assignment.id}:`, updateError);
        } else {
          console.log(`✅ Completed duplicate volunteer assignment: ${assignment.id}`);
          totalCompleted++;
        }
      }
    } else if (volunteerAssignments && volunteerAssignments.length === 1 && !keepAssignmentId) {
      keepAssignmentId = volunteerAssignments[0].id;
    }

    return {
      success: true,
      message: totalCompleted > 0 ? `Repaired ${totalCompleted} duplicate assignments` : 'No duplicate assignments found',
      repaired: totalCompleted > 0,
      assignmentId: keepAssignmentId
    };

  } catch (error) {
    console.error('❌ Unexpected error in duplicate repair:', error);
    return { success: false, message: 'Unexpected error during duplicate repair' };
  }
};

/**
 * Comprehensive assignment repair - runs all repair functions
 */
export const repairAssignments = async (
  userId: string, 
  config: RepairConfig = DEFAULT_REPAIR_CONFIG
): Promise<AssignmentRepairResult> => {
  console.log(`🔧 Starting comprehensive assignment repair for: ${userId}`);
  console.log(`⚙️ Using repair config:`, config);

  // First, handle duplicates
  const duplicateResult = await repairDuplicateAssignments(userId, config);
  if (!duplicateResult.success) {
    return duplicateResult;
  }

  // Then, handle missing assignments
  const missingResult = await repairMissingAssignments(userId, config);
  
  return {
    success: missingResult.success,
    message: `Duplicate repair: ${duplicateResult.message}. Missing repair: ${missingResult.message}`,
    repaired: duplicateResult.repaired || missingResult.repaired,
    assignmentId: missingResult.assignmentId || duplicateResult.assignmentId
  };
};

/**
 * Convenience function for quick repairs with default settings
 */
export const quickRepair = async (userId: string): Promise<AssignmentRepairResult> => {
  return repairAssignments(userId);
};

/**
 * Advanced repair with custom configuration
 */
export const advancedRepair = async (
  userId: string,
  customConfig: Partial<RepairConfig>
): Promise<AssignmentRepairResult> => {
  const config = { ...DEFAULT_REPAIR_CONFIG, ...customConfig };
  return repairAssignments(userId, config);
};

/**
 * Export repair configuration for external customization
 */
export { RepairConfig, DEFAULT_REPAIR_CONFIG };
