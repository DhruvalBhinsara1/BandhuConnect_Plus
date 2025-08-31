import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl, Modal, StyleSheet, TextInput, SafeAreaView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';

const RequestManagement: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'assigned' | 'completed'>('all');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('assistance_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading requests:', error);
      } else {
        setRequests(data || []);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const getFilteredRequests = () => {
    switch (filter) {
      case 'pending':
        return requests.filter(r => r.status === 'pending');
      case 'assigned':
        return requests.filter(r => r.status === 'assigned');
      case 'completed':
        return requests.filter(r => r.status === 'completed');
      default:
        return requests;
    }
  };

  const handleAssignVolunteer = async (requestId: string) => {
    Alert.alert('Assign Volunteer', 'Volunteer assignment functionality would be implemented here');
  };

  const handleMenuPress = (request: any) => {
    setSelectedRequest(request);
    setShowMenu(true);
  };

  const handleMenuAction = (action: string) => {
    setShowMenu(false);
    
    if (!selectedRequest) return;

    switch (action) {
      case 'edit':
        setEditTitle(selectedRequest.title);
        setEditDescription(selectedRequest.description);
        setShowEditModal(true);
        break;
      case 'delete':
        Alert.alert(
          'Delete Request',
          'Are you sure you want to delete this request?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Delete', 
              style: 'destructive',
              onPress: async () => {
                try {
                  const { error } = await supabase
                    .from('assistance_requests')
                    .delete()
                    .eq('id', selectedRequest.id);
                  
                  if (error) {
                    Alert.alert('Error', 'Failed to delete request. Please try again.');
                  } else {
                    Alert.alert('Success', 'Request deleted successfully');
                    await loadRequests();
                  }
                } catch (error) {
                  Alert.alert('Error', 'An unexpected error occurred.');
                }
              }
            }
          ]
        );
        break;
      case 'status':
        setShowStatusModal(true);
        break;
      case 'priority':
        setShowPriorityModal(true);
        break;
    }
  };

  const handleEditRequest = async () => {
    try {
      const { error } = await supabase
        .from('assistance_requests')
        .update({
          title: editTitle,
          description: editDescription
        })
        .eq('id', selectedRequest.id);

      if (error) {
        Alert.alert('Error', 'Failed to update request. Please try again.');
      } else {
        Alert.alert('Success', 'Request updated successfully');
        setShowEditModal(false);
        await loadRequests();
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedRequest) {
      Alert.alert('Error', 'No request selected');
      return;
    }

    try {
      const { error } = await supabase
        .from('assistance_requests')
        .update({ status: newStatus })
        .eq('id', selectedRequest.id);

      if (error) {
        console.error('Status update error:', error);
        Alert.alert('Error', `Failed to update status: ${error.message}`);
      } else {
        Alert.alert('Success', 'Status updated successfully');
        setShowStatusModal(false);
        setSelectedRequest(null);
        await loadRequests();
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', `An unexpected error occurred: ${error.message || error}`);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!selectedRequest) {
      Alert.alert('Error', 'No request selected');
      return;
    }

    try {
      console.log('Updating priority for request:', selectedRequest.id, 'to:', newPriority);
      const { error } = await supabase
        .from('assistance_requests')
        .update({ priority: newPriority })
        .eq('id', selectedRequest.id);

      if (error) {
        console.error('Priority update error:', error);
        Alert.alert('Error', `Failed to update priority: ${error.message}`);
      } else {
        Alert.alert('Success', 'Priority updated successfully');
        setShowPriorityModal(false);
        setSelectedRequest(null);
        await loadRequests();
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', `An unexpected error occurred: ${error.message || error}`);
    }
  };

  const getPriorityColor = (priority: string) => {
    const priorityColors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      urgent: '#dc2626'
    };
    return priorityColors[priority as keyof typeof priorityColors] || '#6b7280';
  };

  const getStatusColor = (status: string) => {
    const statusColors = {
      pending: '#f59e0b',
      assigned: '#3b82f6',
      accepted: '#10b981',
      on_duty: '#8b5cf6',
      completed: '#10b981',
      cancelled: '#ef4444',
    };
    return statusColors[status as keyof typeof statusColors] || '#6b7280';
  };

  const renderRequestItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Text style={styles.requestTitle}>
              {item.title}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status}
              </Text>
            </View>
          </View>
          
          <Text style={styles.description}>{item.description}</Text>
          
          <View style={styles.metaRow}>
            <Ionicons name="person" size={14} color="#6b7280" />
            <Text style={styles.metaText}>
              {item.user?.name || 'Unknown User'}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="flag" size={14} color={getPriorityColor(item.priority)} />
            <Text style={[styles.metaText, { textTransform: 'capitalize' }]}>
              {item.priority} Priority
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="pricetag" size={14} color="#6b7280" />
            <Text style={[styles.metaText, { textTransform: 'capitalize' }]}>
              {item.type.replace('_', ' ')}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="time" size={14} color="#6b7280" />
            <Text style={styles.metaText}>
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => handleMenuPress(item)}>
          <Ionicons name="ellipsis-vertical" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        {item.status === 'pending' ? (
          <>
            <TouchableOpacity style={[styles.button, styles.outlineButton]} onPress={() => {/* Navigate to request details */}}>
              <Text style={styles.outlineButtonText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={() => handleAssignVolunteer(item.id)}>
              <Text style={styles.primaryButtonText}>Assign Volunteer</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={[styles.button, styles.outlineButton]} onPress={() => {/* Navigate to request details */}}>
              <Text style={styles.outlineButtonText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={() => {/* Navigate to progress tracking */}}>
              <Text style={styles.primaryButtonText}>Track Progress</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  const filteredRequests = getFilteredRequests();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Request Management</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Ionicons name="refresh" size={24} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'assigned', label: 'Assigned' },
            { key: 'completed', label: 'Completed' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setFilter(tab.key as any)}
              style={[styles.filterTab, filter === tab.key && styles.activeFilterTab]}
            >
              <Text style={[styles.filterTabText, filter === tab.key && styles.activeFilterTabText]}>
                {tab.label} ({
                  tab.key === 'all' ? requests.length :
                  tab.key === 'pending' ? requests.filter(r => r.status === 'pending').length :
                  tab.key === 'assigned' ? requests.filter(r => r.status === 'assigned').length :
                  requests.filter(r => r.status === 'completed').length
                })
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Request List */}
      <FlatList
        data={filteredRequests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#6b7280" />
            <Text style={styles.emptyTitle}>No requests found</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'pending' 
                ? 'No pending requests at the moment'
                : filter === 'assigned'
                ? 'No assigned requests'
                : filter === 'completed'
                ? 'No completed requests yet'
                : 'No requests have been submitted yet'
              }
            </Text>
          </View>
        }
      />

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuAction('edit')}
            >
              <Ionicons name="create-outline" size={20} color="#374151" />
              <Text style={styles.menuText}>Edit Request</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuAction('status')}
            >
              <Ionicons name="swap-horizontal-outline" size={20} color="#374151" />
              <Text style={styles.menuText}>Change Status</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuAction('priority')}
            >
              <Ionicons name="flag-outline" size={20} color="#374151" />
              <Text style={styles.menuText}>Change Priority</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.menuItem, styles.deleteMenuItem]}
              onPress={() => handleMenuAction('delete')}
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
              <Text style={[styles.menuText, styles.deleteMenuText]}>Delete Request</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Request Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContainer}>
            <Text style={styles.modalTitle}>Edit Request</Text>
            
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.textInput}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Enter request title"
            />
            
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Enter request description"
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleEditRequest}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Status Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.optionModalContainer}>
            <Text style={styles.modalTitle}>Change Status</Text>
            
            {['pending', 'assigned', 'accepted', 'in_progress', 'completed', 'cancelled'].map((status) => (
              <TouchableOpacity
                key={status}
                style={styles.optionItem}
                onPress={() => handleStatusChange(status)}
              >
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(status) }]} />
                <Text style={styles.optionText}>{status.replace('_', ' ').toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              style={styles.cancelOnlyButton}
              onPress={() => setShowStatusModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Change Priority Modal */}
      <Modal
        visible={showPriorityModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPriorityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.optionModalContainer}>
            <Text style={styles.modalTitle}>Change Priority</Text>
            
            {['low', 'medium', 'high'].map((priority) => (
              <TouchableOpacity
                key={priority}
                style={styles.optionItem}
                onPress={() => handlePriorityChange(priority)}
              >
                <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(priority) }]} />
                <Text style={styles.optionText}>{priority.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              style={styles.cancelOnlyButton}
              onPress={() => setShowPriorityModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
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
  listContainer: {
    padding: 16,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestTitle: {
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
    textTransform: 'capitalize',
  },
  description: {
    color: '#6b7280',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  deleteMenuItem: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginTop: 4,
  },
  menuText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
  },
  deleteMenuText: {
    color: '#ef4444',
  },
  // New modal styles
  editModalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    maxHeight: '80%',
  },
  optionModalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    minWidth: 250,
    maxWidth: 300,
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9fafb',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  cancelOnlyButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    alignSelf: 'center',
  },
});

export default RequestManagement;
