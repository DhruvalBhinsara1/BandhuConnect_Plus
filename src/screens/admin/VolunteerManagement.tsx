import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, RefreshControl, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRequest } from '../../context/RequestContext';
import { volunteerService } from '../../services/volunteerService';
import { supabase } from '../../services/supabase';
import { Logger } from '../../utils/logger';
import { User, Assignment } from '../../types';

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

  useEffect(() => {
    loadVolunteers();
    loadRequests();
  }, []);

  const loadVolunteers = async () => {
    try {
      console.log('Loading volunteers...');
      const { data, error } = await volunteerService.getVolunteers();
      console.log('Load volunteers result:', { data: data?.length, error });
      
      if (data && !error && data.length > 0) {
        console.log('Setting volunteers from database:');
        data.forEach((volunteer, index) => {
          console.log(`Volunteer ${index + 1}:`, {
            id: volunteer.id,
            name: volunteer.name,
            volunteer_status: volunteer.volunteer_status,
            is_active: volunteer.is_active
          });
        });
        setVolunteers(data);
      } else {
        console.log('❌ No volunteers found in database!');
        console.log('Please run final-setup.sql script first to create demo volunteers');
        console.log('Error details:', error);
        setVolunteers([]);
        Alert.alert(
          'No Volunteers Found', 
          'Please run the final-setup.sql script first to create demo volunteers in the database.',
          [{ text: 'OK' }]
        );
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
    Alert.alert(
      `${volunteer.name} Profile`,
      `Email: ${volunteer.email}\nPhone: ${volunteer.phone}\nSkills: ${volunteer.skills?.join(', ') || 'None'}\nStatus: ${getStatusText(volunteer)}`,
      [{ text: 'OK' }]
    );
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
    const getRequestTypeColor = (type: string) => {
      const colors = {
        general: '#6b7280',
        guidance: '#3b82f6',
        lost_person: '#ef4444',
        medical: '#dc2626',
        sanitation: '#059669'
      };
      return colors[type as keyof typeof colors] || '#6b7280';
    };

    const formatTimeAgo = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    };

    return (
      <View style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={[styles.requestTypeBadge, { backgroundColor: getRequestTypeColor(item.request_type || item.type || 'general') + '20' }]}>
            <Text style={[styles.requestTypeText, { color: getRequestTypeColor(item.request_type || item.type) }]}>
              {(item.request_type || item.type || 'general').replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.requestTime}>{formatTimeAgo(item.created_at)}</Text>
        </View>
        
        <Text style={styles.requestDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.requestFooter}>
          <View style={styles.requestLocation}>
            <Ionicons name="location-outline" size={14} color="#6b7280" />
            <Text style={styles.requestLocationText}>
              {item.location || 'Location not specified'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.assignButton}
            onPress={() => handleManualAssign(item)}
          >
            <Text style={styles.assignButtonText}>Assign</Text>
          </TouchableOpacity>
        </View>
      </View>
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
      ['assigned', 'accepted', 'on_duty'].includes(a.status)
    );

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardContent}>
            <View style={styles.nameRow}>
              <Text style={styles.volunteerName}>
                {item.name}
              </Text>
              <View style={[styles.statusBadge, { 
                backgroundColor: item.is_active ? '#10b981' + '20' : '#ef4444' + '20' 
              }]}>
                <Text style={[styles.statusText, { 
                  color: item.is_active ? '#10b981' : '#ef4444' 
                }]}>
                  {item.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            
            <Text style={styles.contactInfo}>{item.email}</Text>
            <Text style={styles.contactInfo}>{item.phone}</Text>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.volunteer_status || 'offline') + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.volunteer_status || 'offline') }]}>{getStatusText(item)}</Text>
              </View>
            </View>

            {item.skills && item.skills.length > 0 && (
              <View style={styles.skillsContainer}>
                <Text style={styles.skillsLabel}>Skills:</Text>
                <View style={styles.skillsList}>
                  {item.skills.slice(0, 3).map((skill) => (
                    <View key={skill} style={styles.skillBadge}>
                      <Text style={styles.skillText}>{skill}</Text>
                    </View>
                  ))}
                  {item.skills.length > 3 && (
                    <Text style={styles.moreSkillsText}>+{item.skills.length - 3} more</Text>
                  )}
                </View>
              </View>
            )}

            <View style={styles.tasksRow}>
              <Ionicons name="briefcase" size={14} color="#6b7280" />
              <Text style={styles.tasksText}>
                {activeAssignments.length} active task{activeAssignments.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => handleVolunteerOptions(item)}>
            <Ionicons name="ellipsis-vertical" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.button, styles.outlineButton]} onPress={() => handleViewTasks(item)}>
            <Text style={styles.outlineButtonText}>View Tasks</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.button, 
              (!item.is_active || item.volunteer_status === 'busy' || item.volunteer_status === 'on_duty') ? styles.disabledButton : styles.primaryButton
            ]} 
            disabled={!item.is_active || item.volunteer_status === 'busy' || item.volunteer_status === 'on_duty'}
            onPress={() => handleAssignTask(item)}
          >
            <Text style={[
              (!item.is_active || item.volunteer_status === 'busy' || item.volunteer_status === 'on_duty') ? styles.disabledButtonText : styles.primaryButtonText
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Volunteer Management</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Ionicons name="refresh" size={24} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'available', label: 'Available' },
            { key: 'busy', label: 'Busy' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setFilter(tab.key as any)}
              style={[styles.filterTab, filter === tab.key && styles.activeFilterTab]}
            >
              <Text style={[styles.filterTabText, filter === tab.key && styles.activeFilterTabText]}>
                {tab.label} ({
                  tab.key === 'all' ? volunteers.length :
                  tab.key === 'active' ? volunteers.filter(v => v.is_active).length :
                  tab.key === 'available' ? volunteers.filter(v => v.is_active && v.volunteer_status === 'available').length :
                  volunteers.filter(v => v.is_active && (v.volunteer_status === 'on_duty' || v.volunteer_status === 'busy')).length
                })
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Selector */}
        <View style={styles.tabSelector}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'volunteers' && styles.activeTab]}
            onPress={() => setActiveTab('volunteers')}
          >
            <Text style={[styles.tabText, activeTab === 'volunteers' && styles.activeTabText]}>Volunteers</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
            onPress={() => setActiveTab('requests')}
          >
            <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>Pending Requests</Text>
          </TouchableOpacity>
        </View>

        {/* Auto-Assignment Section - Only show on requests tab */}
        {activeTab === 'requests' && (
          <View style={styles.autoAssignSection}>
            <TouchableOpacity 
              style={[styles.autoAssignButton, autoAssigning && styles.autoAssignButtonDisabled]}
              onPress={handleBatchAutoAssign}
              disabled={autoAssigning}
            >
              <Ionicons 
                name={autoAssigning ? "hourglass" : "flash"} 
                size={16} 
                color={autoAssigning ? "#9ca3af" : "white"} 
              />
              <Text style={[styles.autoAssignButtonText, autoAssigning && styles.autoAssignButtonTextDisabled]}>
                {autoAssigning ? 'Auto-Assigning...' : 'Auto-Assign All (Batch)'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Content based on active tab */}
      {activeTab === 'volunteers' ? (
        <FlatList
          data={filteredVolunteers}
          renderItem={renderVolunteerItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#6b7280" />
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
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="clipboard-outline" size={64} color="#6b7280" />
              <Text style={styles.emptyTitle}>No pending requests</Text>
              <Text style={styles.emptySubtitle}>
                All requests have been assigned or completed
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
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
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
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
  activeTabText: {
    color: '#3b82f6',
    fontWeight: '600',
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
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
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
  volunteerName: {
    fontWeight: 'bold',
    color: '#111827',
    fontSize: 18,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
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
  skillText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '500',
  },
  moreSkillsText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  tasksRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tasksText: {
    color: '#9ca3af',
    fontSize: 14,
    marginLeft: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  outlineButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#d1d5db',
  },
  disabledButtonText: {
    color: '#9ca3af',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    color: '#9ca3af',
    fontSize: 18,
    marginTop: 16,
  },
  emptySubtitle: {
    color: '#d1d5db',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default VolunteerManagement;
