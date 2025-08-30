import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { assignmentService } from '../../services/assignmentService';
import { requestService } from '../../services/requestService';
import { volunteerService } from '../../services/volunteerService';
import { autoAssignmentService } from '../../services/autoAssignmentService';
import { supabase } from '../../services/supabase';
import { AssistanceRequest, User } from '../../types';

const TaskAssignment: React.FC = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'assign' | 'create'>('assign');
  const [requests, setRequests] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState<any>(null);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [showCustomTaskModal, setShowCustomTaskModal] = useState(false);
  const [customTask, setCustomTask] = useState({
    type: 'general',
    title: '',
    description: '',
    priority: 'medium',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [requestsResult, volunteersResult] = await Promise.all([
        requestService.getRequests(),
        volunteerService.getVolunteers()
      ]);

      if (requestsResult.data) {
        setRequests(requestsResult.data.filter((req: any) => req.status === 'pending'));
      }
      if (volunteersResult.data) {
        setVolunteers(volunteersResult.data);
      }
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
      
      const result = await autoAssignmentService.autoAssignRequest(request.id);
      
      if (result.success) {
        Alert.alert(
          'Auto-Assignment Successful', 
          `${result.message}\nMatch Score: ${(result.matchScore! * 100).toFixed(1)}%`
        );
        loadData();
      } else {
        Alert.alert('Auto-Assignment Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Auto-assignment failed due to system error');
    } finally {
      setLoading(false);
    }
  };

  const batchAutoAssign = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('batch_auto_assign_requests', {
        p_max_assignments: 5,
        p_min_match_score: 0.6
      });
      
      if (error) {
        Alert.alert('Error', 'Batch auto-assignment failed');
        return;
      }
      
      const successful = data?.filter((result: any) => result.success).length || 0;
      const total = data?.length || 0;
      
      Alert.alert(
        'Batch Auto-Assignment Complete',
        `Successfully assigned ${successful} out of ${total} requests`
      );
      
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Batch auto-assignment failed');
    } finally {
      setLoading(false);
    }
  };

  const createAndAssignCustomTask = async () => {
    if (!customTask.title || !selectedVolunteer) {
      Alert.alert('Error', 'Please fill all required fields and select a volunteer');
      return;
    }

    try {
      setLoading(true);
      
      const requestResult = await requestService.createRequest({
        type: customTask.type,
        title: customTask.title,
        description: customTask.description,
        priority: customTask.priority,
        location: { latitude: 0, longitude: 0 },
      });

      if (requestResult.error || !requestResult.data) {
        Alert.alert('Error', 'Failed to create custom task');
        return;
      }

      const assignResult = await assignmentService.createAssignment(requestResult.data.id, selectedVolunteer.id);
      
      if (assignResult.error) {
        Alert.alert('Error', 'Task created but failed to assign');
        return;
      }

      Alert.alert('Success', `Custom task created and assigned to ${selectedVolunteer.name}`);
      setShowCustomTaskModal(false);
      setSelectedVolunteer(null);
      setCustomTask({ type: 'general', title: '', description: '', priority: 'medium' });
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to create and assign task');
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
        requests.map((request) => (
          <View key={request.id} style={styles.requestCard}>
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
        volunteers.map((volunteer) => (
          <TouchableOpacity
            key={volunteer.id}
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
              {volunteers.map((volunteer) => (
                <TouchableOpacity
                  key={volunteer.id}
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
                <Picker.Item label="Medical" value="medical" />
                <Picker.Item label="Transportation" value="transportation" />
                <Picker.Item label="Food" value="food" />
                <Picker.Item label="Accommodation" value="accommodation" />
                <Picker.Item label="Guidance" value="guidance" />
                <Picker.Item label="Emergency" value="emergency" />
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
});

export default TaskAssignment;
