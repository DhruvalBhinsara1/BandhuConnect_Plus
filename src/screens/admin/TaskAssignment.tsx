import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal, TextInput, ActivityIndicator, StyleSheet, SafeAreaView, RefreshControl } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { AssistanceRequest, User, Assignment } from '../../types';
import { autoAssignmentService } from '../../services/autoAssignmentService';
import { Logger } from '../../utils/logger';
import AutoAssignModal from './AutoAssignModal';

const TaskAssignment: React.FC = ({ route }: any) => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'assign' | 'create'>('assign');
  const [requests, setRequests] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState<any>(null);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [showCustomTaskModal, setShowCustomTaskModal] = useState(false);
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false);
  const [customTask, setCustomTask] = useState({
    type: 'general',
    title: '',
    description: '',
    priority: 'medium',
    location: null as { latitude: number; longitude: number } | null,
    locationText: '',
    scheduledTime: null as Date | null,
    scheduledTimeText: '',
  });

  // Handle navigation params for volunteer-specific auto-assignment
  const routeParams = route?.params;
  const preSelectedVolunteer = routeParams?.selectedVolunteer;
  const assignmentMode = routeParams?.mode;

  useEffect(() => {
    loadData();
    
    // If coming from volunteer management with auto-assign mode
    if (preSelectedVolunteer && assignmentMode === 'auto_assign_to_volunteer') {
      setSelectedVolunteer(preSelectedVolunteer);
      setShowAutoAssignModal(true);
    }
  }, [preSelectedVolunteer, assignmentMode]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load pending requests
      const { data: requestsData } = await supabase
        .from('assistance_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (requestsData) setRequests(requestsData);

      // Load available volunteers
      const { data: volunteersData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'volunteer')
        .eq('is_active', true)
        .in('volunteer_status', ['available', 'busy']);
      
      if (volunteersData) setVolunteers(volunteersData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRequest = (request: any) => {
    setSelectedRequest(request);
    setShowVolunteerModal(true);
  };

  const assignToVolunteer = async (volunteer: any) => {
    if (!selectedRequest) return;

    try {
      setLoading(true);
      const result = await assignmentService.createAssignment(selectedRequest.id, volunteer.id);
      
      if (result.error) {
        Alert.alert('Error', 'Failed to assign task');
        return;
      }

      Alert.alert('Success', `Task assigned to ${volunteer.name}`);
      setShowVolunteerModal(false);
      setSelectedRequest(null);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to assign task');
    } finally {
      setLoading(false);
    }
  };

  const autoAssignRequest = async (request: any) => {
    try {
      setLoading(true);
      
      console.log('🤖 Starting auto-assignment for request:', {
        id: request.id,
        title: request.title,
        type: request.type,
        priority: request.priority
      });
      
      const result = await autoAssignmentService.autoAssignRequest(request.id);
      
      console.log('🤖 Auto-assignment result:', result);
      
      if (result.success) {
        Alert.alert(
          'Auto-Assignment Successful', 
          `${result.message}\nMatch Score: ${(result.matchScore! * 100).toFixed(1)}%`
        );
        loadData();
      } else {
        console.error('❌ Auto-assignment failed:', result.message);
        Alert.alert('Auto-Assignment Failed', result.message);
      }
    } catch (error) {
      console.error('❌ Auto-assignment system error:', error);
      Alert.alert('Error', `Auto-assignment failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const batchAutoAssign = async () => {
    try {
      setLoading(true);
      Logger.autoAssignment.start(requests.length);
      
      const { data, error } = await supabase.rpc('batch_auto_assign_requests', {
        p_max_assignments: 10,
        p_min_match_score: 0.6
      });

      Logger.database.result('batch_auto_assign_requests', { data, error });

      if (error) {
        Logger.autoAssignment.error(error, 'batch assignment');
        Alert.alert('Error', `Batch auto-assignment failed: ${error.message}`);
        return;
      }

      const results = data || [];
      const successful = results.filter((r: any) => r.success).length;
      
      Logger.autoAssignment.batchComplete(successful, results.length, results);

      // Check for duplicate request types that might cause React key issues
      const requestTypes = requests.map(r => r.type);
      const duplicateTypes = requestTypes.filter((type, index) => requestTypes.indexOf(type) !== index);
      if (duplicateTypes.length > 0) {
        Logger.react.duplicateKey('TaskAssignment', 'request types', duplicateTypes);
      }

      Alert.alert(
        'Batch Assignment Complete', 
        `Successfully assigned ${successful} out of ${results.length} requests`
      );
      
      loadData();
    } catch (error) {
      Logger.autoAssignment.error(error, 'batch assignment');
      Alert.alert('Error', 'Failed to perform batch auto-assignment');
    } finally {
      setLoading(false);
    }
  };

  const parseLocationFromText = (locationText: string) => {
    // Simple text-based location parsing - in future will integrate with maps
    const coords = locationText.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
    if (coords) {
      return {
        latitude: parseFloat(coords[1]),
        longitude: parseFloat(coords[2])
      };
    }
    // Default to center coordinates if no valid coords found
    return { latitude: 23.0225, longitude: 72.5714 }; // Ahmedabad coordinates
  };

  const parseTimeFromText = (timeText: string) => {
    // Simple time parsing - in future will have proper date/time picker
    const now = new Date();
    const timeMatch = timeText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const ampm = timeMatch[3]?.toUpperCase();
      
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      
      const scheduledDate = new Date(now);
      scheduledDate.setHours(hours, minutes, 0, 0);
      
      // If time is in the past, schedule for tomorrow
      if (scheduledDate < now) {
        scheduledDate.setDate(scheduledDate.getDate() + 1);
      }
      
      return scheduledDate;
    }
    // Default to 1 hour from now
    return new Date(now.getTime() + 60 * 60 * 1000);
  };

  const createAndAssignCustomTask = async () => {
    if (!customTask.title || !selectedVolunteer || !customTask.locationText) {
      Alert.alert('Error', 'Please fill all required fields including location');
      return;
    }

    try {
      setLoading(true);
      
      console.log('📝 Creating custom task:', {
        ...customTask,
        volunteer: selectedVolunteer.name
      });
      
      // Parse location and time from text inputs
      const parsedLocation = parseLocationFromText(customTask.locationText);
      const parsedTime = customTask.scheduledTimeText ? 
        parseTimeFromText(customTask.scheduledTimeText) : 
        new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      
      const requestResult = await requestService.createRequest({
        type: customTask.type as any,
        title: customTask.title,
        description: customTask.description,
        priority: customTask.priority as any,
        location: parsedLocation,
      });

      console.log('📝 Request creation result:', requestResult);

      if (requestResult.error || !requestResult.data) {
        console.error('❌ Failed to create request:', requestResult.error);
        Alert.alert('Error', `Failed to create custom task: ${requestResult.error?.message || 'Unknown error'}`);
        return;
      }

      const assignResult = await assignmentService.createAssignment(requestResult.data.id, selectedVolunteer.id);
      
      console.log('📝 Assignment result:', assignResult);
      
      if (assignResult.error) {
        console.error('❌ Failed to assign task:', assignResult.error);
        Alert.alert('Error', `Task created but failed to assign: ${assignResult.error?.message || 'Unknown error'}`);
        return;
      }

      console.log('✅ Custom task created and assigned successfully');
      Alert.alert('Success', `Custom task created and assigned to ${selectedVolunteer.name}`);
      setShowCustomTaskModal(false);
      setSelectedVolunteer(null);
      setCustomTask({ 
        type: 'general', 
        title: '', 
        description: '', 
        priority: 'medium',
        location: null,
        locationText: '',
        scheduledTime: null,
        scheduledTimeText: ''
      });
      loadData();
    } catch (error) {
      console.error('❌ Custom task creation system error:', error);
      Alert.alert('Error', `Failed to create and assign task: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      high: '#ef4444',
      medium: '#f59e0b',
      low: '#10b981',
      pending: '#6b7280',
      assigned: '#3b82f6',
      in_progress: '#8b5cf6',
      completed: '#10b981',
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  const getVolunteerStatusColor = (status: string) => {
    const colors = {
      available: '#10b981',
      busy: '#f59e0b',
      offline: '#6b7280',
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  const renderAssignTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.headerSection}>
        <Text style={styles.sectionTitle}>Pending Requests</Text>
        <Text style={styles.sectionSubtitle}>Select a request to assign to a volunteer</Text>
        
        <TouchableOpacity 
          style={styles.batchAutoButton}
          onPress={batchAutoAssign}
          disabled={loading || requests.length === 0}
        >
          <Text style={styles.batchAutoButtonText}>🤖 Auto-Assign All (Batch)</Text>
        </TouchableOpacity>
      </View>
      
      {requests.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No pending requests</Text>
        </View>
      ) : (
        requests.map((request, index) => (
          <View key={`${request.id}-${index}`} style={styles.requestCard}>
            <TouchableOpacity
              style={styles.requestContent}
              onPress={() => handleAssignRequest(request)}
            >
              <View style={styles.requestHeader}>
                <Text style={styles.requestTitle}>{request.title}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: getStatusColor(request.priority) + '20' }]}>
                  <Text style={[styles.priorityText, { color: getStatusColor(request.priority) }]}>
                    {request.priority}
                  </Text>
                </View>
              </View>
              <Text style={styles.requestDescription}>{request.description}</Text>
              <View style={styles.requestMeta}>
                <View style={styles.requestType}>
                  <Text style={styles.metaIcon}>🏥</Text>
                  <Text style={styles.metaText}>{request.type}</Text>
                </View>
                <Text style={styles.metaText}>
                  {new Date(request.created_at).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
            
            <View style={styles.assignmentActions}>
              <TouchableOpacity 
                style={styles.manualAssignButton}
                onPress={() => handleAssignRequest(request)}
              >
                <Text style={styles.manualAssignButtonText}>👤 Manual Assign</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.autoAssignButton}
                onPress={() => autoAssignRequest(request)}
                disabled={loading}
              >
                <Text style={styles.autoAssignButtonText}>🤖 Auto Assign</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderCreateTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Create Custom Task</Text>
      <Text style={styles.sectionSubtitle}>Create a custom task and assign it to a volunteer</Text>
      
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => setShowCustomTaskModal(true)}
      >
        <Text style={styles.createButtonText}>➕ Create New Task</Text>
      </TouchableOpacity>

      {volunteers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>➕</Text>
          <Text style={styles.emptyText}>Create your first custom task</Text>
        </View>
      ) : (
        volunteers.map((volunteer, index) => (
          <TouchableOpacity
            key={`${volunteer.id}-${index}`}
            style={[
              styles.volunteerOption,
              selectedVolunteer?.id === volunteer.id && styles.selectedVolunteerOption
            ]}
            onPress={() => setSelectedVolunteer(volunteer)}
          >
            <View style={styles.volunteerInfo}>
              <Text style={styles.volunteerName}>{volunteer.name}</Text>
              <Text style={styles.volunteerPhone}>{volunteer.phone}</Text>
              <View style={styles.volunteerMeta}>
                <View style={[styles.statusBadge, { backgroundColor: getVolunteerStatusColor(volunteer.volunteer_status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getVolunteerStatusColor(volunteer.volunteer_status) }]}>
                    {volunteer.volunteer_status}
                  </Text>
                </View>
                {volunteer.skills && (
                  <Text style={styles.skillsText}>
                    Skills: {volunteer.skills.join(', ')}
                  </Text>
                )}
              </View>
            </View>
            <Text style={styles.selectionIcon}>
              {selectedVolunteer?.id === volunteer.id ? "✅" : "⚪"}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Assignment</Text>
        <View />
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'assign' && styles.activeTab]}
          onPress={() => setActiveTab('assign')}
        >
          <Text style={[styles.tabText, activeTab === 'assign' && styles.activeTabText]}>
            Assign Existing
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'create' && styles.activeTab]}
          onPress={() => setActiveTab('create')}
        >
          <Text style={[styles.tabText, activeTab === 'create' && styles.activeTabText]}>
            Create Custom
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
      >
        {activeTab === 'assign' ? renderAssignTab() : renderCreateTab()}
      </ScrollView>

      {/* Volunteer Selection Modal */}
      <Modal visible={showVolunteerModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Volunteer</Text>
            <Text style={styles.modalSubtitle}>Choose a volunteer for: {selectedRequest?.title}</Text>
            
            <ScrollView style={styles.volunteerList}>
              {volunteers.map((volunteer, index) => (
                <TouchableOpacity
                  key={`volunteer-${volunteer.id}-${index}`}
                  style={styles.volunteerOption}
                  onPress={() => assignToVolunteer(volunteer)}
                >
                  <View style={styles.volunteerInfo}>
                    <Text style={styles.volunteerName}>{volunteer.name}</Text>
                    <Text style={styles.volunteerPhone}>{volunteer.phone}</Text>
                    <View style={styles.volunteerMeta}>
                      <View style={[styles.statusBadge, { backgroundColor: getVolunteerStatusColor(volunteer.volunteer_status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getVolunteerStatusColor(volunteer.volunteer_status) }]}>
                          {volunteer.volunteer_status}
                        </Text>
                      </View>
                      {volunteer.skills && (
                        <Text style={styles.skillsText}>
                          Skills: {volunteer.skills.join(', ')}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowVolunteerModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Custom Task Creation Modal */}
      <Modal visible={showCustomTaskModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Custom Task</Text>
            
            <Text style={styles.inputLabel}>Task Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={customTask.type}
                onValueChange={(value) => setCustomTask({...customTask, type: value})}
              >
                <Picker.Item label="General" value="general" />
                <Picker.Item label="Guidance" value="guidance" />
                <Picker.Item label="Lost Person" value="lost_person" />
                <Picker.Item label="Medical" value="medical" />
                <Picker.Item label="Sanitation" value="sanitation" />
              </Picker>
            </View>

            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.textInput}
              value={customTask.title}
              onChangeText={(text) => setCustomTask({...customTask, title: text})}
              placeholder="Enter task title"
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={customTask.description}
              onChangeText={(text) => setCustomTask({...customTask, description: text})}
              placeholder="Enter task description"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.inputLabel}>Priority</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={customTask.priority}
                onValueChange={(value) => setCustomTask({...customTask, priority: value})}
              >
                <Picker.Item label="Low" value="low" />
                <Picker.Item label="Medium" value="medium" />
                <Picker.Item label="High" value="high" />
              </Picker>
            </View>

            <Text style={styles.inputLabel}>Location *</Text>
            <TextInput
              style={styles.textInput}
              value={customTask.locationText}
              onChangeText={(text) => setCustomTask({...customTask, locationText: text})}
              placeholder="Enter location (e.g., 'Main Temple' or '23.0225,72.5714')"
            />
            <Text style={styles.helperText}>
              Enter location name or coordinates (lat,lng). Future versions will include map picker.
            </Text>

            <Text style={styles.inputLabel}>Scheduled Time (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={customTask.scheduledTimeText}
              onChangeText={(text) => setCustomTask({...customTask, scheduledTimeText: text})}
              placeholder="Enter time (e.g., '2:30 PM' or '14:30')"
            />
            <Text style={styles.helperText}>
              Leave empty for immediate scheduling. Future versions will include date/time picker.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowCustomTaskModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.createTaskButton}
                onPress={createAndAssignCustomTask}
                disabled={!customTask.title || !selectedVolunteer}
              >
                <Text style={styles.createTaskButtonText}>Create & Assign</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Auto-Assign Modal for Volunteer-Specific Assignment */}
      <AutoAssignModal
        visible={showAutoAssignModal}
        onClose={() => {
          setShowAutoAssignModal(false);
          setSelectedVolunteer(null);
        }}
        selectedVolunteer={selectedVolunteer}
        onAssignmentComplete={loadData}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    fontSize: 16,
    color: '#3b82f6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 24,
  },
  headerSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  batchAutoButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  batchAutoButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 16,
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestContent: {
    flex: 1,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  requestDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  requestMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  assignmentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  manualAssignButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 0.48,
  },
  manualAssignButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  autoAssignButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 0.48,
  },
  autoAssignButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  volunteerOption: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedVolunteerOption: {
    borderColor: '#3b82f6',
    backgroundColor: '#f0f9ff',
  },
  volunteerInfo: {
    flex: 1,
  },
  volunteerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  volunteerPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  volunteerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  skillsText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  selectionIcon: {
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  volunteerList: {
    maxHeight: 300,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.45,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  createTaskButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.45,
  },
  createTaskButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 8,
    fontStyle: 'italic',
  },
});

export default TaskAssignment;
