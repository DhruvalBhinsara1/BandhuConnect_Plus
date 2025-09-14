import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, RefreshControl, Alert, StyleSheet, Modal, TextInput } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRequest } from '../../context/RequestContext';
import { volunteerService } from '../../services/volunteerService';
import { supabase } from '../../services/supabase';
import { Logger } from '../../utils/logger';
import { User, Assignment } from '../../types';
import EnhancedRequestCard from '../../components/admin/EnhancedRequestCard';
import TaskAssignment from './TaskAssignment';
import { LocationFormatter } from '../../utils/locationFormatter';
import { PROFESSIONAL_DESIGN } from '../../design/professionalDesignSystem';

type RouteParams = {
  initialTab?: 'volunteers' | 'requests';
  autoAssignMode?: boolean;
};

const VolunteerManagement: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { user } = useAuth();
  const { assignments, getAssignments } = useRequest();
  
  const [refreshing, setRefreshing] = useState(false);
  const [volunteers, setVolunteers] = useState<User[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'available' | 'busy'>('all');
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'volunteers' | 'requests'>(
    route.params?.initialTab || 'volunteers'
  );
  const [autoAssignMode, setAutoAssignMode] = useState(route.params?.autoAssignMode || false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    skills: '',
  });
  // Removed: eventManagerVisible and related event manager UI

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
        .select(`
          *,
          user:profiles!assistance_requests_user_id_fkey(
            id,
            name,
            email,
            phone
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading requests:', error);
        return;
      }
      
      console.log('📥 Loaded requests with user data:', data);
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
      mode: 'assign_task'
    });
  };

  const handleViewTasks = (volunteer: User) => {
    // Navigate to TaskAssignment screen with volunteer pre-selected for viewing tasks
    navigation.navigate('TaskAssignment', { 
      selectedVolunteer: volunteer,
      mode: 'view_tasks'
    });
  };

  const handleVolunteerOptions = (volunteer: User) => {
    Alert.alert(
      volunteer.name,
      'Choose an action',
      [
        { text: 'Edit Profile', onPress: () => handleEditProfile(volunteer) },
        { text: 'View Tasks', onPress: () => handleViewTasks(volunteer) },
        { text: 'Assign Task', onPress: () => handleAssignTask(volunteer) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleEditProfile = (volunteer: User) => {
    setSelectedVolunteer(volunteer);
    setEditForm({
      name: volunteer.name || '',
      email: volunteer.email || '',
      phone: volunteer.phone || '',
      skills: Array.isArray(volunteer.skills) ? volunteer.skills.join(', ') : (volunteer.skills || ''),
    });
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!selectedVolunteer) return;

    try {
      const skillsArray = editForm.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);

      const updateData = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        skills: skillsArray,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', selectedVolunteer.id);

      if (error) {
        Alert.alert('Error', 'Failed to update volunteer profile');
        return;
      }

      Alert.alert('Success', 'Volunteer profile updated successfully');
      setEditModalVisible(false);
      loadVolunteers(); // Refresh the list
    } catch (error) {
      Alert.alert('Error', 'Failed to update volunteer profile');
    }
  };

  const handleCancelEdit = () => {
    setEditModalVisible(false);
    setSelectedVolunteer(null);
  };

  const getVolunteerAssignments = (volunteerId: string): Assignment[] => {
    return assignments.filter(assignment => assignment.volunteer_id === volunteerId);
  };

  const getFilteredVolunteers = () => {
    switch (filter) {
      case 'active':
        return volunteers.filter(v => v.is_active);
      case 'available':
        return volunteers.filter(v => v.volunteer_status === 'available');
      case 'busy':
        return volunteers.filter(v => v.volunteer_status === 'busy' || v.volunteer_status === 'on_duty');
      default:
        return volunteers;
    }
  };

  const handleBatchAutoAssign = async () => {
    if (requests.length === 0) {
      Alert.alert('No Requests', 'There are no pending requests to assign.');
      return;
    }

    const availableVolunteers = volunteers.filter(v => 
      v.is_active && v.volunteer_status === 'available'
    );

    if (availableVolunteers.length === 0) {
      Alert.alert('No Available Volunteers', 'There are no available volunteers for assignment.');
      return;
    }

    Alert.alert(
      'Auto-Assign All Requests',
      `This will attempt to automatically assign ${requests.length} pending requests to ${availableVolunteers.length} available volunteers. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Assign', onPress: performBatchAutoAssign }
      ]
    );
  };

  const performBatchAutoAssign = async () => {
    setAutoAssigning(true);
    Logger.autoAssignment.start(requests.length);

    let assigned = 0;
    let failed = 0;

    try {
      for (const request of requests) {
        try {
          Logger.autoAssignment.requestProcessing(request, assigned + failed, requests.length);
          
          const { data: result, error } = await supabase.rpc('auto_assign_volunteer', {
            p_request_id: request.id,
            p_max_distance: 15000, // Increased to 15km radius for better coverage
            p_min_score: 0.25 // Further lowered threshold to match our enhanced algorithm
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
      available: PROFESSIONAL_DESIGN.COLORS.success,
      on_duty: PROFESSIONAL_DESIGN.COLORS.info,
      busy: PROFESSIONAL_DESIGN.COLORS.warning,
      offline: PROFESSIONAL_DESIGN.COLORS.textTertiary,
    };
    return statusColors[status as keyof typeof statusColors] || PROFESSIONAL_DESIGN.COLORS.textTertiary;
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
        {/* Header with name and options */}
        <View style={styles.volunteerHeader}>
          <View style={styles.volunteerInfo}>
            <Text style={styles.volunteerName}>
              {item.name}
            </Text>
            
            <Text style={styles.volunteerContact}>{item.email}</Text>
            {item.phone && (
              <Text style={styles.volunteerContact}>{item.phone}</Text>
            )}

            {/* Status and task info in a row */}
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: item.is_active ? '#dcfce7' : '#fee2e2' }
              ]}>
                <Text style={[
                  styles.statusText, 
                  { color: item.is_active ? '#166534' : '#dc2626' }
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
              <Ionicons name="briefcase-outline" size={16} color={'#6b7280'} />
              <Text style={styles.tasksText}>
                {activeAssignments.length} active task{activeAssignments.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => handleVolunteerOptions(item)} style={styles.optionsButton}>
            <Ionicons name="ellipsis-vertical" size={20} color={'#6b7280'} />
          </TouchableOpacity>
        </View>

        {/* Skills section */}
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

        {/* Action buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={() => handleViewTasks(item)}
          >
            <Ionicons name="eye-outline" size={16} color={PROFESSIONAL_DESIGN.COLORS.sky} />
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
              Assign
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const filteredVolunteers = getFilteredVolunteers();

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={activeTab === 'volunteers' ? filteredVolunteers : requests}
        renderItem={activeTab === 'volunteers' ? renderVolunteerItem : renderRequestItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <View>
            {/* Compact Header */}
            <View style={styles.header}>
              <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>Volunteer Management</Text>
                <View style={styles.headerActions}>
                  <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
                    <Ionicons name="refresh-outline" size={20} color={PROFESSIONAL_DESIGN.COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Compact Statistics Section */}
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

              {/* Compact Tab System */}
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

            {/* Compact Action Panel - Only show for requests tab */}
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
          </View>
        }
        contentContainerStyle={styles.flatListContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons 
                name={activeTab === 'volunteers' ? "people-outline" : "clipboard-outline"} 
                size={64} 
                color={PROFESSIONAL_DESIGN.COLORS.textTertiary} 
              />
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === 'volunteers' ? 'No volunteers found' : 'No pending requests'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'volunteers' 
                ? (filter === 'active' 
                    ? 'No active volunteers at the moment'
                    : filter === 'available'
                    ? 'No available volunteers'
                    : filter === 'busy'
                    ? 'No busy volunteers'
                    : 'No volunteers registered yet'
                  )
                : 'All requests have been assigned or completed'
              }
            </Text>
          </View>
        }
      />

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

  {/* TaskAssignment removed: should only be navigated to, not rendered here */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.background,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.md,
  },
  
  flatListContent: {
    paddingBottom: PROFESSIONAL_DESIGN.SPACING.lg,
  },
  
  // Professional Header Design
  header: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.lg,
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.md,
    paddingTop: PROFESSIONAL_DESIGN.SPACING.xl,
    marginHorizontal: -PROFESSIONAL_DESIGN.SPACING.md,
    marginBottom: PROFESSIONAL_DESIGN.SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: PROFESSIONAL_DESIGN.COLORS.border,
  },
  
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: PROFESSIONAL_DESIGN.SPACING.md,
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

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: PROFESSIONAL_DESIGN.SPACING.sm,
  },

  eventManagerButton: {
    padding: PROFESSIONAL_DESIGN.SPACING.md,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.md,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.primary + '20',
    borderWidth: 1,
    borderColor: PROFESSIONAL_DESIGN.COLORS.primary,
  },
  
  // Enhanced Statistics Section
  statsSection: {
    marginTop: PROFESSIONAL_DESIGN.SPACING.sm,
    marginBottom: PROFESSIONAL_DESIGN.SPACING.md,
  },
  
  statsTitle: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.body,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    marginBottom: PROFESSIONAL_DESIGN.SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 12,
  },
  
  statsRow: {
    flexDirection: 'row',
    gap: PROFESSIONAL_DESIGN.SPACING.sm,
  },
  
  statCard: {
    flex: 1,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.md,
    padding: PROFESSIONAL_DESIGN.SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PROFESSIONAL_DESIGN.COLORS.border,
  },
  
  statValue: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.h4,
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  
  statLabel: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.caption,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
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
    marginTop: PROFESSIONAL_DESIGN.SPACING.md,
  },
  
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.background,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.md,
    padding: 4,
    borderWidth: 1,
    borderColor: PROFESSIONAL_DESIGN.COLORS.border,
  },
  
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.sm,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.md,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.sm,
    gap: PROFESSIONAL_DESIGN.SPACING.xs,
  },
  
  activeTab: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
  },
  
  tabText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.bodySmall,
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
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 4,
    minWidth: 16,
    alignItems: 'center',
  },
  
  tabBadgeText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.caption,
    color: PROFESSIONAL_DESIGN.COLORS.textInverse,
    fontWeight: '600' as const,
    fontSize: 10,
  },
  
  // Professional Action Panel
  actionPanel: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.lg,
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.md,
    marginHorizontal: -PROFESSIONAL_DESIGN.SPACING.md,
    marginBottom: PROFESSIONAL_DESIGN.SPACING.sm,
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
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.body,
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
    marginBottom: 2,
    fontWeight: '600' as const,
  },
  
  actionSubtitle: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.bodySmall,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
  },
  
  actionButton: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.accent,
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.sm,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.md,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: PROFESSIONAL_DESIGN.SPACING.xs,
  },
  
  actionButtonText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.bodySmall,
    color: PROFESSIONAL_DESIGN.COLORS.textInverse,
    fontWeight: '600' as const,
  },
  
  actionButtonDisabled: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.textTertiary,
  },
  
  // Professional Volunteer Cards
  volunteerCard: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  
  volunteerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  
  volunteerInfo: {
    flex: 1,
  },

  optionsButton: {
    padding: 8,
    marginLeft: 8,
  },
  
  volunteerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
    lineHeight: 22,
  },
  
  volunteerContact: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 3,
    lineHeight: 18,
  },
  
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    gap: 8,
  },
  
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  skillsSection: {
    marginTop: 12,
    marginBottom: 16,
  },
  
  skillsLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
    fontWeight: '500',
  },
  
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  
  skillChip: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  
  skillText: {
    fontSize: 11,
    color: '#1e40af',
    fontWeight: '600',
  },
  
  tasksInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  
  tasksText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  
  // Professional Action Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  
  primaryButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  
  secondaryButton: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  secondaryButtonText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  
  disabledButtonText: {
    color: '#ffffff',
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
  
  cancelButtonText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.button,
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
});

export default VolunteerManagement;
