import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, RefreshControl, Alert, StyleSheet, Modal, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRequest } from '../../context/RequestContext';
import { volunteerService } from '../../services/volunteerService';
import { supabase } from '../../services/supabase';
import { Logger } from '../../utils/logger';
import { User, Assignment } from '../../types';
import EnhancedRequestCard from '../../components/admin/EnhancedRequestCard';
import { LocationFormatter } from '../../utils/locationFormatter';
import { PROFESSIONAL_DESIGN, PROFESSIONAL_STYLES } from '../../design/professionalDesignSystem';

const VolunteerManagement: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { assignments, getAssignments } = useRequest();
  
  const [refreshing, setRefreshing] = useState(false);
  const [volunteers, setVolunteers] = useState<User[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'available' | 'busy'>('all');
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'volunteers' | 'requests'>('volunteers');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    skills: '',
  });

  useEffect(() => {
    loadVolunteers();
    loadRequests();
  }, []);

  const loadVolunteers = async () => {
    try {
      console.log('🔄 Loading volunteers from database...');
      const { data, error } = await volunteerService.getVolunteers();
      console.log('📥 Load volunteers result:', { 
        dataCount: data?.length, 
        error: error?.message || null,
        timestamp: new Date().toISOString()
      });
      
      if (data && !error && data.length > 0) {
        console.log('📋 Setting volunteers from database:');
        data.forEach((volunteer, index) => {
          console.log(`👤 Volunteer ${index + 1}:`, {
            id: volunteer.id,
            name: volunteer.name,
            email: volunteer.email,
            phone: volunteer.phone,
            skills: volunteer.skills,
            is_active: volunteer.is_active,
            volunteer_status: volunteer.volunteer_status
          });
        });
        setVolunteers(data);
        console.log('✅ Volunteers state updated successfully');
      } else {
        console.log('⚠️ No volunteers found or error occurred:', error);
        setVolunteers([]);
      }
    } catch (error) {
      console.error('Error loading volunteers:', error);
    }
    await getAssignments();
  };

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('assistance_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading requests:', error);
        return;
      }
      
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadVolunteers(), loadRequests(), getAssignments()]);
    setRefreshing(false);
  };

  const handleAssignTask = (volunteer: User) => {
    // Navigate to TaskAssignment screen with volunteer pre-selected for auto-assignment
    navigation.navigate('TaskAssignment', { 
      selectedVolunteer: volunteer,
      mode: 'auto_assign_to_volunteer'
    });
  };

  const getFilteredVolunteers = () => {
    if (filter === 'all') return volunteers;
    if (filter === 'active') return volunteers.filter(v => v.is_active);
    if (filter === 'available') return volunteers.filter(v => v.is_active && v.volunteer_status === 'available');
    if (filter === 'busy') return volunteers.filter(v => v.is_active && (v.volunteer_status === 'on_duty' || v.volunteer_status === 'busy'));
    return volunteers;
  };

  const getVolunteerAssignments = (volunteerId: string) => {
    return assignments.filter(a => a.volunteer_id === volunteerId);
  };

  const handleVolunteerOptions = (volunteer: User) => {
    Alert.alert(
      `${volunteer.name} Options`,
      'Choose an action:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `${volunteer.is_active ? 'Deactivate' : 'Activate'}`,
          onPress: async () => {
            try {
              const newStatus = !volunteer.is_active;
              const result = await volunteerService.updateVolunteerStatus(volunteer.id, newStatus);
              
              if (result.error) {
                Alert.alert('Error', 'Failed to update volunteer status. Please try again.');
              } else {
                await loadVolunteers();
                Alert.alert('Success', `Volunteer ${newStatus ? 'activated' : 'deactivated'} successfully`);
              }
            } catch (error) {
              Alert.alert('Error', 'An unexpected error occurred.');
            }
          }
        },
        {
          text: 'View Profile',
          onPress: () => handleViewProfile(volunteer)
        },
        {
          text: 'Contact Info',
          onPress: () => handleContactInfo(volunteer)
        }
      ]
    );
  };

  const handleViewProfile = (volunteer: User) => {
    setSelectedVolunteer(volunteer);
    setEditForm({
      name: volunteer.name || '',
      email: volunteer.email || '',
      phone: volunteer.phone || '',
      skills: volunteer.skills?.join(', ') || '',
    });
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!selectedVolunteer) {
      console.log('❌ Save Profile: No selected volunteer');
      return;
    }

    console.log('🔄 Starting profile update for:', {
      volunteerId: selectedVolunteer.id,
      volunteerName: selectedVolunteer.name,
      formData: editForm
    });

    try {
      const skillsArray = editForm.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);

      console.log('📝 Processed skills array:', skillsArray);

      const profileData = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        skills: skillsArray,
      };

      console.log('📤 Sending update via volunteerService:', {
        volunteerId: selectedVolunteer.id,
        profileData
      });

      const { data, error } = await volunteerService.updateProfile(selectedVolunteer.id, profileData);

      if (error) {
        console.log('❌ Profile update failed:', error);
        Alert.alert('Error', `Failed to update volunteer profile: ${error.message}`);
        return;
      }

      if (!data) {
        console.log('⚠️ Update completed but no data returned');
        Alert.alert('Warning', 'Update may not have been applied. Please check the volunteer profile.');
        return;
      }

      console.log('✅ Profile updated successfully:', data);
      Alert.alert('Success', 'Volunteer profile updated successfully');
      setEditModalVisible(false);
      
      console.log('🔄 Refreshing volunteer list...');
      await loadVolunteers(); // Refresh the list
      console.log('✅ Volunteer list refreshed');
    } catch (error) {
      console.log('❌ Unexpected error during profile update:', error);
      Alert.alert('Error', `Failed to update volunteer profile: ${error.message || 'Unknown error'}`);
    }
  };

  const handleCancelEdit = () => {
    setEditModalVisible(false);
    setSelectedVolunteer(null);
  };

  const handleContactInfo = (volunteer: User) => {
    Alert.alert(
      `Contact ${volunteer.name}`,
      `Email: ${volunteer.email}\nPhone: ${volunteer.phone}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Copy Email', onPress: () => Alert.alert('Copied', 'Email copied to clipboard') },
        { text: 'Copy Phone', onPress: () => Alert.alert('Copied', 'Phone copied to clipboard') }
      ]
    );
  };

  const handleViewTasks = (volunteer: User) => {
    const volunteerAssignments = getVolunteerAssignments(volunteer.id);
    const activeAssignments = volunteerAssignments.filter(a => 
      ['assigned', 'accepted', 'on_duty'].includes(a.status)
    );
    
    if (activeAssignments.length === 0) {
      Alert.alert('No Active Tasks', `${volunteer.name} has no active tasks at the moment.`);
      return;
    }
    
    const tasksList = activeAssignments.map((assignment, index) => 
      `${index + 1}. ${assignment.request?.description || 'Task'} (${assignment.status})`
    ).join('\n');
    
    Alert.alert(
      `${volunteer.name}'s Active Tasks`,
      tasksList,
      [{ text: 'OK' }]
    );
  };

  const handleBatchAutoAssign = async () => {
    if (autoAssigning) return;
    
    setAutoAssigning(true);
    Logger.autoAssignment.start(0);
    
    try {
      // Get pending requests first
      const { data: requests, error: requestError } = await supabase
        .from('assistance_requests')
        .select('*')
        .eq('status', 'pending');
        
      if (requestError || !requests) {
        throw new Error('Failed to fetch pending requests');
      }
      
      if (requests.length === 0) {
        Alert.alert('No Pending Requests', 'There are no pending requests to assign.');
        return;
      }
      
      Logger.autoAssignment.start(requests.length);
      
      let assigned = 0;
      let failed = 0;
      
      for (let i = 0; i < requests.length; i++) {
        const request = requests[i];
        Logger.autoAssignment.requestProcessing(request, i + 1, requests.length);
        
        try {
          const { data: result, error } = await supabase.rpc('auto_assign_request_enhanced', {
            p_request_id: request.id,
            p_min_match_score: 0.3
          });
          
          if (error) {
            Logger.autoAssignment.matchResult(false, undefined, undefined, error.message);
            failed++;
          } else if (result && result.volunteer_id) {
            Logger.autoAssignment.matchResult(true, result.volunteer_name, result.match_score);
            assigned++;
          } else {
            Logger.autoAssignment.matchResult(false, undefined, undefined, 'No suitable volunteer found');
            failed++;
          }
        } catch (assignError) {
          Logger.autoAssignment.matchResult(false, undefined, undefined, 'Assignment error');
          failed++;
        }
      }
      
      Logger.autoAssignment.batchComplete(assigned, failed, []);
      Alert.alert(
        'Auto-Assignment Complete',
        `Successfully assigned ${assigned} out of ${requests.length} pending requests.${failed > 0 ? `\n\n${failed} requests could not be assigned (no suitable volunteers found).` : ''}`,
        [{ text: 'OK', onPress: () => { loadVolunteers(); loadRequests(); } }]
      );
    } catch (error) {
      Logger.autoAssignment.matchResult(false, undefined, undefined, 'Batch assignment error');
      Alert.alert('Error', 'Failed to perform auto-assignment. Please try again.');
    } finally {
      setAutoAssigning(false);
      // Refresh requests after auto-assignment
      await loadRequests();
    }
  };

  const renderRequestItem = ({ item }: { item: any }) => {
    return (
      <EnhancedRequestCard
        item={item}
        onAssign={handleManualAssign}
        onViewDetails={(request) => {
          // Navigate to detailed view
          navigation.navigate('TaskAssignment', { 
            selectedRequest: request,
            mode: 'view_details'
          });
        }}
        showImage={true}
        showLocation={true}
        compactMode={false}
      />
    );
  };

  const handleManualAssign = (request: any) => {
    // Navigate to task assignment with pre-selected request
    navigation.navigate('TaskAssignment', { 
      selectedRequest: request,
      mode: 'manual_assign'
    });
  };

  const getStatusColor = (status: string) => {
    const statusColors = {
      available: '#10b981',
      on_duty: '#8b5cf6',
      busy: '#f59e0b',
      offline: '#6b7280',
    };
    return statusColors[status as keyof typeof statusColors] || '#6b7280';
  };

  const getStatusText = (volunteer: User) => {
    if (!volunteer.is_active) return 'Offline';
    return volunteer.volunteer_status === 'on_duty' ? 'On Duty' : 
           volunteer.volunteer_status === 'available' ? 'Available' : 
           volunteer.volunteer_status === 'busy' ? 'Busy' : 'Offline';
  };

  const renderVolunteerItem = ({ item }: { item: User }) => {
    const volunteerAssignments = getVolunteerAssignments(item.id);
    const activeAssignments = volunteerAssignments.filter(a => 
      ['pending', 'accepted', 'in_progress'].includes(a.status)
    );

    return (
      <View style={styles.volunteerCard}>
        <View style={styles.volunteerHeader}>
          <View style={styles.volunteerInfo}>
            <Text style={styles.volunteerName}>
              {item.name}
            </Text>
            
            <Text style={styles.volunteerContact}>{item.email}</Text>
            {item.phone && (
              <Text style={styles.volunteerContact}>{item.phone}</Text>
            )}
            
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: item.is_active ? PROFESSIONAL_DESIGN.COLORS.success + '20' : PROFESSIONAL_DESIGN.COLORS.error + '20' }
              ]}>
                <Text style={[
                  styles.statusText, 
                  { color: item.is_active ? PROFESSIONAL_DESIGN.COLORS.success : PROFESSIONAL_DESIGN.COLORS.error }
                ]}>
                  {item.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
              
              <View style={[
                styles.statusBadge, 
                { backgroundColor: getStatusColor(item.volunteer_status || 'offline') + '20' }
              ]}>
                <Text style={[
                  styles.statusText, 
                  { color: getStatusColor(item.volunteer_status || 'offline') }
                ]}>
                  {getStatusText(item)}
                </Text>
              </View>
            </View>

            <View style={styles.tasksInfo}>
              <Ionicons name="briefcase-outline" size={16} color={PROFESSIONAL_DESIGN.COLORS.textSecondary} />
              <Text style={styles.tasksText}>
                {activeAssignments.length} active task{activeAssignments.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => handleVolunteerOptions(item)}>
            <Ionicons name="ellipsis-vertical" size={20} color={PROFESSIONAL_DESIGN.COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {item.skills && item.skills.length > 0 && (
          <View style={styles.skillsSection}>
            <Text style={styles.skillsLabel}>Skills</Text>
            <View style={styles.skillsContainer}>
              {item.skills.slice(0, 4).map((skill) => (
                <View key={skill} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
              {item.skills.length > 4 && (
                <View style={styles.skillChip}>
                  <Text style={styles.skillText}>+{item.skills.length - 4} more</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={() => handleViewTasks(item)}
          >
            <Ionicons name="eye-outline" size={16} color={PROFESSIONAL_DESIGN.COLORS.textPrimary} />
            <Text style={styles.secondaryButtonText}>View Tasks</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.primaryButton,
              (!item.is_active || item.volunteer_status === 'busy' || item.volunteer_status === 'on_duty') && styles.disabledButton
            ]} 
            disabled={!item.is_active || item.volunteer_status === 'busy' || item.volunteer_status === 'on_duty'}
            onPress={() => handleAssignTask(item)}
          >
            <Ionicons 
              name="person-add-outline" 
              size={16} 
              color="white" 
            />
            <Text style={[
              styles.primaryButtonText,
              (!item.is_active || item.volunteer_status === 'busy' || item.volunteer_status === 'on_duty') && styles.disabledButtonText
            ]}>
              Assign Task
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const filteredVolunteers = getFilteredVolunteers();

  return (
    <SafeAreaView style={styles.container}>
      {/* Professional Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Volunteer Management</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Ionicons name="refresh-outline" size={20} color={PROFESSIONAL_DESIGN.COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Professional Statistics Section */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Overview</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{volunteers.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statCard, styles.availableStatCard]}>
              <Text style={[styles.statValue, styles.availableStatValue]}>
                {volunteers.filter(v => v.volunteer_status === 'available').length}
              </Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
            <View style={[styles.statCard, styles.busyStatCard]}>
              <Text style={[styles.statValue, styles.busyStatValue]}>
                {volunteers.filter(v => v.volunteer_status === 'busy' || v.volunteer_status === 'on_duty').length}
              </Text>
              <Text style={styles.statLabel}>Busy</Text>
            </View>
          </View>
        </View>

        {/* Professional Tab System */}
        <View style={styles.tabSystem}>
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'volunteers' && styles.activeTab]}
              onPress={() => setActiveTab('volunteers')}
            >
              <Ionicons 
                name="people-outline" 
                size={16} 
                color={activeTab === 'volunteers' ? PROFESSIONAL_DESIGN.COLORS.accent : PROFESSIONAL_DESIGN.COLORS.textSecondary} 
              />
              <Text style={[styles.tabText, activeTab === 'volunteers' && styles.activeTabText]}>
                Volunteers
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
              onPress={() => setActiveTab('requests')}
            >
              <Ionicons 
                name="list-outline" 
                size={16} 
                color={activeTab === 'requests' ? PROFESSIONAL_DESIGN.COLORS.accent : PROFESSIONAL_DESIGN.COLORS.textSecondary} 
              />
              <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
                Pending Requests
              </Text>
              {requests.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{requests.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Professional Action Panel - Only show for requests tab */}
      {activeTab === 'requests' && requests.length > 0 && (
        <View style={styles.actionPanel}>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>
              {requests.length} Pending Request{requests.length !== 1 ? 's' : ''}
            </Text>
            <Text style={styles.actionSubtitle}>
              {volunteers.filter(v => v.volunteer_status === 'available').length} volunteers available for assignment
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.actionButton,
              autoAssigning && styles.actionButtonDisabled
            ]}
            onPress={handleBatchAutoAssign}
            disabled={autoAssigning}
          >
            {autoAssigning ? (
              <>
                <Ionicons name="hourglass-outline" size={16} color={PROFESSIONAL_DESIGN.COLORS.textSecondary} />
                <Text style={styles.actionButtonText}>Processing...</Text>
              </>
            ) : (
              <>
                <Ionicons name="flash-outline" size={16} color="white" />
                <Text style={styles.actionButtonText}>Auto-Assign All</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Professional Content Area */}
      <View style={styles.contentArea}>
        {activeTab === 'volunteers' ? (
          <FlatList
            data={filteredVolunteers}
            renderItem={renderVolunteerItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="people-outline" size={64} color={PROFESSIONAL_DESIGN.COLORS.textTertiary} />
                </View>
                <Text style={styles.emptyTitle}>No volunteers found</Text>
                <Text style={styles.emptySubtitle}>
                  {filter === 'active' 
                    ? 'No active volunteers at the moment'
                    : filter === 'available'
                    ? 'No available volunteers'
                    : filter === 'busy'
                    ? 'No busy volunteers'
                    : 'No volunteers registered yet'
                  }
                </Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={requests}
            renderItem={renderRequestItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="clipboard-outline" size={64} color={PROFESSIONAL_DESIGN.COLORS.textTertiary} />
                </View>
                <Text style={styles.emptyTitle}>No pending requests</Text>
                <Text style={styles.emptySubtitle}>
                  All requests have been assigned or completed
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Professional Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelEdit}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCancelEdit} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Name</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.name}
                onChangeText={(text) => setEditForm({...editForm, name: text})}
                placeholder="Enter volunteer name"
                placeholderTextColor={PROFESSIONAL_DESIGN.COLORS.textTertiary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.email}
                onChangeText={(text) => setEditForm({...editForm, email: text})}
                placeholder="Enter email address"
                placeholderTextColor={PROFESSIONAL_DESIGN.COLORS.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Phone</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.phone}
                onChangeText={(text) => setEditForm({...editForm, phone: text})}
                placeholder="Enter phone number"
                placeholderTextColor={PROFESSIONAL_DESIGN.COLORS.textTertiary}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Skills</Text>
              <TextInput
                style={[styles.formInput, styles.multilineInput]}
                value={editForm.skills}
                onChangeText={(text) => setEditForm({...editForm, skills: text})}
                placeholder="Enter skills separated by commas (e.g., guidance, medical, sanitation)"
                placeholderTextColor={PROFESSIONAL_DESIGN.COLORS.textTertiary}
                multiline
                numberOfLines={3}
              />
              <Text style={styles.formHint}>Separate multiple skills with commas</Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default VolunteerManagement;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.background,
  },
  
  // Professional Header Design
  header: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.xl,
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.xxl,
    paddingTop: PROFESSIONAL_DESIGN.SPACING.xxxl,
    borderBottomWidth: 1,
    borderBottomColor: PROFESSIONAL_DESIGN.COLORS.border,
    ...PROFESSIONAL_DESIGN.SHADOWS.sm,
  },
  
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: PROFESSIONAL_DESIGN.SPACING.lg,
  },
  
  headerTitle: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.h2,
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
    fontWeight: '700' as const,
  },
  
  refreshButton: {
    padding: PROFESSIONAL_DESIGN.SPACING.md,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.md,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.background,
    borderWidth: 1,
    borderColor: PROFESSIONAL_DESIGN.COLORS.border,
  },
  
  // Enhanced Statistics Section
  statsSection: {
    marginTop: PROFESSIONAL_DESIGN.SPACING.lg,
    marginBottom: PROFESSIONAL_DESIGN.SPACING.xl,
  },
  
  statsTitle: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.h6,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    marginBottom: PROFESSIONAL_DESIGN.SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  statsRow: {
    flexDirection: 'row',
    gap: PROFESSIONAL_DESIGN.SPACING.md,
  },
  
  statCard: {
    flex: 1,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.lg,
    padding: PROFESSIONAL_DESIGN.SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PROFESSIONAL_DESIGN.COLORS.border,
    ...PROFESSIONAL_DESIGN.SHADOWS.sm,
  },
  
  statValue: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.h3,
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  
  statLabel: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.caption,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  // Specialized stat variants
  availableStatCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  
  availableStatValue: {
    color: PROFESSIONAL_DESIGN.COLORS.success,
  },
  
  busyStatCard: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
  },
  
  busyStatValue: {
    color: PROFESSIONAL_DESIGN.COLORS.warning,
  },
  
  // Professional Tab System
  tabSystem: {
    marginTop: PROFESSIONAL_DESIGN.SPACING.xl,
  },
  
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.background,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.lg,
    padding: 6,
    borderWidth: 1,
    borderColor: PROFESSIONAL_DESIGN.COLORS.border,
  },
  
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.md + 2,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.lg,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.md,
    gap: PROFESSIONAL_DESIGN.SPACING.sm,
  },
  
  activeTab: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    ...PROFESSIONAL_DESIGN.SHADOWS.sm,
  },
  
  tabText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.button,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    fontWeight: '500' as const,
  },
  
  activeTabText: {
    color: PROFESSIONAL_DESIGN.COLORS.accent,
    fontWeight: '600' as const,
  },
  
  tabBadge: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.error,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
    minWidth: 20,
    alignItems: 'center',
  },
  
  tabBadgeText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.caption,
    color: PROFESSIONAL_DESIGN.COLORS.textInverse,
    fontWeight: '600' as const,
  },
  
  // Professional Action Panel
  actionPanel: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.xl,
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: PROFESSIONAL_DESIGN.COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  actionInfo: {
    flex: 1,
  },
  
  actionTitle: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.h5,
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
    marginBottom: 4,
  },
  
  actionSubtitle: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.body,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
  },
  
  actionButton: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.accent,
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.md,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.lg,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: PROFESSIONAL_DESIGN.SPACING.sm,
    ...PROFESSIONAL_DESIGN.SHADOWS.sm,
  },
  
  actionButtonText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.button,
    color: PROFESSIONAL_DESIGN.COLORS.textInverse,
  },
  
  actionButtonDisabled: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.textTertiary,
    ...PROFESSIONAL_DESIGN.SHADOWS.sm,
  },
  
  // Professional Content Area
  contentArea: {
    flex: 1,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.lg,
    paddingTop: PROFESSIONAL_DESIGN.SPACING.lg,
  },
  
  // Professional Volunteer Cards
  volunteerCard: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.lg,
    padding: PROFESSIONAL_DESIGN.SPACING.xl,
    marginBottom: PROFESSIONAL_DESIGN.SPACING.lg,
    borderWidth: 1,
    borderColor: PROFESSIONAL_DESIGN.COLORS.border,
    ...PROFESSIONAL_DESIGN.SHADOWS.sm,
  },
  
  volunteerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: PROFESSIONAL_DESIGN.SPACING.lg,
  },
  
  volunteerInfo: {
    flex: 1,
  },
  
  volunteerName: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.h5,
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
    marginBottom: PROFESSIONAL_DESIGN.SPACING.sm,
  },
  
  volunteerContact: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.body,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    marginBottom: 4,
  },
  
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: PROFESSIONAL_DESIGN.SPACING.sm,
    gap: PROFESSIONAL_DESIGN.SPACING.sm,
  },
  
  statusBadge: {
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.md,
    paddingVertical: 6,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  statusText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.caption,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  skillsSection: {
    marginTop: PROFESSIONAL_DESIGN.SPACING.lg,
    marginBottom: PROFESSIONAL_DESIGN.SPACING.lg,
  },
  
  skillsLabel: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.h6,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    marginBottom: PROFESSIONAL_DESIGN.SPACING.sm,
  },
  
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: PROFESSIONAL_DESIGN.SPACING.sm,
  },
  
  skillChip: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.background,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.md,
    paddingVertical: 6,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.sm,
    borderWidth: 1,
    borderColor: PROFESSIONAL_DESIGN.COLORS.border,
  },
  
  skillText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.caption,
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
    fontWeight: '500' as const,
  },
  
  tasksInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: PROFESSIONAL_DESIGN.SPACING.sm,
    marginTop: PROFESSIONAL_DESIGN.SPACING.md,
  },
  
  tasksText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.body,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
  },
  
  // Professional Action Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: PROFESSIONAL_DESIGN.SPACING.md,
    marginTop: PROFESSIONAL_DESIGN.SPACING.lg,
    paddingTop: PROFESSIONAL_DESIGN.SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: PROFESSIONAL_DESIGN.COLORS.border,
  },
  
  primaryButton: {
    flex: 1,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.accent,
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.md,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.lg,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: PROFESSIONAL_DESIGN.SPACING.sm,
  },
  
  secondaryButton: {
    flex: 1,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.md,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.lg,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.md,
    borderWidth: 1,
    borderColor: PROFESSIONAL_DESIGN.COLORS.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: PROFESSIONAL_DESIGN.SPACING.sm,
  },
  
  primaryButtonText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.button,
    color: PROFESSIONAL_DESIGN.COLORS.textInverse,
  },
  
  secondaryButtonText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.button,
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
  },
  
  disabledButton: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.textTertiary,
  },
  
  disabledButtonText: {
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
  },
  
  // Professional Empty States
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.huge,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.xl,
  },
  
  emptyIcon: {
    marginBottom: PROFESSIONAL_DESIGN.SPACING.xl,
    opacity: 0.4,
  },
  
  emptyTitle: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.h4,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    marginBottom: PROFESSIONAL_DESIGN.SPACING.md,
    textAlign: 'center',
  },
  
  emptySubtitle: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.body,
    color: PROFESSIONAL_DESIGN.COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Professional Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.background,
  },
  
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.xl,
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.lg,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: PROFESSIONAL_DESIGN.COLORS.border,
  },
  
  modalTitle: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.h4,
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
  },
  
  modalButton: {
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.sm,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.md,
  },
  
  cancelButton: {
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.sm,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.md,
  },
  
  saveButton: {
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.sm,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.md,
  },
  
  saveButtonText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.button,
    color: PROFESSIONAL_DESIGN.COLORS.accent,
  },
  
  modalButtonText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.button,
    color: PROFESSIONAL_DESIGN.COLORS.accent,
  },
  
  cancelButtonText: {
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
  },
  
  modalContent: {
    flex: 1,
    padding: PROFESSIONAL_DESIGN.SPACING.xl,
  },
  
  formGroup: {
    marginBottom: PROFESSIONAL_DESIGN.SPACING.xl,
  },
  
  formLabel: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.h6,
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
    marginBottom: PROFESSIONAL_DESIGN.SPACING.sm,
  },
  
  formInput: {
    borderWidth: 1,
    borderColor: PROFESSIONAL_DESIGN.COLORS.borderDark,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.md,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.lg,
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.md,
    fontSize: 16,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
  },
  
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  
  formHint: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.bodySmall,
    color: PROFESSIONAL_DESIGN.COLORS.textTertiary,
    marginTop: PROFESSIONAL_DESIGN.SPACING.sm,
  },

  // Legacy styles for compatibility - will be phased out
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardContent: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactInfo: {
    color: '#6b7280',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    color: '#9ca3af',
    fontSize: 14,
    marginRight: 8,
  },
  skillsContainer: {
    marginBottom: 8,
  },
  skillsLabel: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 4,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  moreSkillsText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  tasksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  cardSubtitle: {
    color: '#9ca3af',
    fontSize: 14,
    marginLeft: 4,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
  },
  outlineButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  volunteerName: {
    fontWeight: 'bold',
    color: '#111827',
    fontSize: 18,
    marginRight: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statChip: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  availableChip: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  busyChip: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  availableValue: {
    color: '#16a34a',
  },
  busyValue: {
    color: '#d97706',
  },
  statType: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  availableType: {
    color: '#16a34a',
  },
  busyType: {
    color: '#d97706',
  },
  enhancedTabSelector: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 4,
    marginTop: 20,
  },
  enhancedTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  activeEnhancedTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  enhancedTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeEnhancedTabText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  requestCountBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
    minWidth: 20,
    alignItems: 'center',
  },
  requestCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  filterTabs: {
    flexDirection: 'row',
    marginTop: 16,
  },
  filterTab: {
    marginRight: 16,
    paddingBottom: 8,
  },
  activeFilterTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  filterTabText: {
    fontWeight: '500',
    color: '#6b7280',
  },
  activeFilterTabText: {
    color: '#2563eb',
  },
  autoAssignSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  autoAssignButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  autoAssignButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  autoAssignButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  autoAssignButtonTextDisabled: {
    color: '#9ca3af',
  },
  tabSelector: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontWeight: '500',
    color: '#6b7280',
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  requestTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requestTime: {
    color: '#9ca3af',
    fontSize: 12,
  },
  requestDescription: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requestLocationText: {
    color: '#6b7280',
    fontSize: 12,
    marginLeft: 4,
  },
  assignButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  assignButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  requestsOverview: {
    flex: 1,
  },
  requestsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  availableVolunteers: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  streamlinedAutoAssignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  streamlinedAutoAssignButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  streamlinedAutoAssignButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  streamlinedAutoAssignButtonTextDisabled: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
