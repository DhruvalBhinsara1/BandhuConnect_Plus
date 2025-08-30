import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { requestService } from '../../services/requestService';
import { volunteerService } from '../../services/volunteerService';
import { assignmentService } from '../../services/assignmentService';
import { RequestType, Priority } from '../../types';

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

  // Custom task form
  const [customTask, setCustomTask] = useState({
    title: '',
    description: '',
    type: 'general' as RequestType,
    priority: 'medium' as Priority,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [requestsResult, volunteersResult] = await Promise.all([
        requestService.getRequests({ status: 'pending' }),
        volunteerService.getVolunteers({ is_active: true })
      ]);

      if (requestsResult.data) setRequests(requestsResult.data);
      if (volunteersResult.data) setVolunteers(volunteersResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRequest = (request: any) => {
    setSelectedRequest(request);
    setShowVolunteerModal(true);
  };

  const handleCreateCustomTask = () => {
    setShowCustomTaskModal(true);
  };

  const confirmAssignment = async (volunteer: any) => {
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
      loadData(); // Refresh data
    } catch (error) {
      Alert.alert('Error', 'Failed to assign task');
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
      
      // Create custom request
      const requestResult = await requestService.createRequest({
        type: customTask.type,
        title: customTask.title,
        description: customTask.description,
        priority: customTask.priority,
        location: { latitude: 0, longitude: 0 }, // Default location for custom tasks
      });

      if (requestResult.error || !requestResult.data) {
        Alert.alert('Error', 'Failed to create custom task');
        return;
      }

      // Assign to volunteer
      const assignResult = await assignmentService.createAssignment(requestResult.data.id, selectedVolunteer.id);
      
      if (assignResult.error) {
        Alert.alert('Error', 'Task created but failed to assign');
        return;
      }

      Alert.alert('Success', `Custom task created and assigned to ${selectedVolunteer.name}`);
      setShowCustomTaskModal(false);
      setSelectedVolunteer(null);
      setCustomTask({ title: '', description: '', type: 'general', priority: 'medium' });
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to create and assign task');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: '#ef4444',
      assigned: '#3b82f6',
      in_progress: '#f59e0b',
      completed: '#10b981',
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  const getVolunteerStatusColor = (status: string) => {
    const colors = {
      available: '#10b981',
      busy: '#f59e0b',
      on_duty: '#8b5cf6',
      offline: '#6b7280',
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  const renderAssignTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Pending Requests</Text>
      <Text style={styles.sectionSubtitle}>Select a request to assign to a volunteer</Text>
      
      {requests.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="clipboard-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyText}>No pending requests</Text>
        </View>
      ) : (
        requests.map((request) => (
          <TouchableOpacity
            key={request.id}
            style={styles.requestCard}
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
                <Ionicons name="medical" size={16} color="#6b7280" />
                <Text style={styles.metaText}>{request.type}</Text>
              </View>
              <Text style={styles.metaText}>
                {new Date(request.created_at).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.assignButton}>
              <Text style={styles.assignButtonText}>Assign to Volunteer</Text>
              <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderCreateTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Create Custom Task</Text>
      <Text style={styles.sectionSubtitle}>Create a custom task and assign it to a volunteer</Text>
      
      <TouchableOpacity
        style={styles.createTaskButton}
        onPress={handleCreateCustomTask}
      >
        <Ionicons name="add-circle" size={24} color="#3b82f6" />
        <Text style={styles.createTaskButtonText}>Create New Task</Text>
      </TouchableOpacity>

      <View style={styles.availableVolunteers}>
        <Text style={styles.subsectionTitle}>Available Volunteers</Text>
        {volunteers.filter(v => v.volunteer_status === 'available').map((volunteer) => (
          <View key={volunteer.id} style={styles.volunteerCard}>
            <View style={styles.volunteerInfo}>
              <Text style={styles.volunteerName}>{volunteer.name}</Text>
              <Text style={styles.volunteerSkills}>
                Skills: {volunteer.skills?.join(', ') || 'General'}
              </Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: getVolunteerStatusColor(volunteer.volunteer_status) }]} />
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Assignment</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'assign' && styles.activeTab]}
          onPress={() => setActiveTab('assign')}
        >
          <Text style={[styles.tabText, activeTab === 'assign' && styles.activeTabText]}>
            Assign Requests
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'create' && styles.activeTab]}
          onPress={() => setActiveTab('create')}
        >
          <Text style={[styles.tabText, activeTab === 'create' && styles.activeTabText]}>
            Create Task
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'assign' ? renderAssignTab() : renderCreateTab()}
      </ScrollView>

      {/* Volunteer Selection Modal */}
      <Modal
        visible={showVolunteerModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowVolunteerModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Volunteer</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {volunteers.filter(v => v.is_active).map((volunteer) => (
              <TouchableOpacity
                key={volunteer.id}
                style={styles.volunteerOption}
                onPress={() => confirmAssignment(volunteer)}
              >
                <View style={styles.volunteerDetails}>
                  <Text style={styles.volunteerName}>{volunteer.name}</Text>
                  <Text style={styles.volunteerSkills}>
                    Skills: {volunteer.skills?.join(', ') || 'General'}
                  </Text>
                  <View style={styles.volunteerStatus}>
                    <View style={[styles.statusDot, { backgroundColor: getVolunteerStatusColor(volunteer.volunteer_status) }]} />
                    <Text style={styles.statusText}>{volunteer.volunteer_status}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Custom Task Creation Modal */}
      <Modal
        visible={showCustomTaskModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCustomTaskModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Custom Task</Text>
            <TouchableOpacity onPress={createAndAssignCustomTask}>
              <Text style={styles.saveButton}>Create</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Task Title *</Text>
              <TextInput
                style={styles.input}
                value={customTask.title}
                onChangeText={(text) => setCustomTask({ ...customTask, title: text })}
                placeholder="Enter task title"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={customTask.description}
                onChangeText={(text) => setCustomTask({ ...customTask, description: text })}
                placeholder="Enter task description"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.optionGroup}>
                {['general', 'medical', 'tech', 'crowd_management', 'sanitation'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.option, customTask.type === type && styles.selectedOption]}
                    onPress={() => setCustomTask({ ...customTask, type: type as RequestType })}
                  >
                    <Text style={[styles.optionText, customTask.type === type && styles.selectedOptionText]}>
                      {type.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.optionGroup}>
                {['low', 'medium', 'high'].map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[styles.option, customTask.priority === priority && styles.selectedOption]}
                    onPress={() => setCustomTask({ ...customTask, priority: priority as Priority })}
                  >
                    <Text style={[styles.optionText, customTask.priority === priority && styles.selectedOptionText]}>
                      {priority}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Assign to Volunteer *</Text>
              {selectedVolunteer ? (
                <View style={styles.selectedVolunteerCard}>
                  <Text style={styles.selectedVolunteerName}>{selectedVolunteer.name}</Text>
                  <TouchableOpacity onPress={() => setSelectedVolunteer(null)}>
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.selectVolunteerPrompt}>Select a volunteer below:</Text>
              )}
              
              {volunteers.filter(v => v.is_active).map((volunteer) => (
                <TouchableOpacity
                  key={volunteer.id}
                  style={[
                    styles.volunteerSelectOption,
                    selectedVolunteer?.id === volunteer.id && styles.selectedVolunteerOption
                  ]}
                  onPress={() => setSelectedVolunteer(volunteer)}
                >
                  <View style={styles.volunteerDetails}>
                    <Text style={styles.volunteerName}>{volunteer.name}</Text>
                    <Text style={styles.volunteerSkills}>
                      Skills: {volunteer.skills?.join(', ') || 'General'}
                    </Text>
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: getVolunteerStatusColor(volunteer.volunteer_status) }]} />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
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
    marginBottom: 12,
  },
  requestType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  assignButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  createTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  createTaskButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  availableVolunteers: {
    marginTop: 24,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  volunteerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  volunteerInfo: {
    flex: 1,
  },
  volunteerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  volunteerSkills: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  cancelButton: {
    fontSize: 16,
    color: '#6b7280',
  },
  saveButton: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  volunteerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  volunteerDetails: {
    flex: 1,
  },
  volunteerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  optionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  selectedOption: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  optionText: {
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  selectedOptionText: {
    color: 'white',
  },
  selectedVolunteerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  selectedVolunteerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
  },
  selectVolunteerPrompt: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  volunteerSelectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedVolunteerOption: {
    borderColor: '#3b82f6',
    backgroundColor: '#f0f9ff',
  },
});

export default TaskAssignment;
