import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, RefreshControl, Alert, StyleSheet, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRequest } from '../../context/RequestContext';
import { assignmentService } from '../../services/assignmentService';
import { AssistanceRequest } from '../../types';

const RequestManagement: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { requests, getRequests, deleteRequest } = useRequest();
  
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'assigned' | 'completed'>('all');
  const [selectedRequest, setSelectedRequest] = useState<AssistanceRequest | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    await getRequests();
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
    // Mock volunteer assignment - in real app, show volunteer selection modal
    const mockVolunteerId = '1'; // This would come from volunteer selection
    
    try {
      const { error } = await assignmentService.createAssignment(requestId, mockVolunteerId);
      if (error) {
        Alert.alert('Error', 'Failed to assign volunteer. Please try again.');
      } else {
        Alert.alert('Success', 'Volunteer assigned successfully!');
        await loadRequests();
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  const handleMenuPress = (request: AssistanceRequest) => {
    setSelectedRequest(request);
    setShowMenu(true);
  };

  const handleMenuAction = (action: string) => {
    setShowMenu(false);
    
    if (!selectedRequest) return;

    switch (action) {
      case 'edit':
        Alert.alert('Edit Request', 'Edit functionality would be implemented here');
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
                  const result = await deleteRequest(selectedRequest.id);
                  if (result.error) {
                    Alert.alert('Error', 'Failed to delete request. Please try again.');
                  } else {
                    Alert.alert('Success', 'Request deleted successfully');
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
        Alert.alert('Change Status', 'Status change functionality would be implemented here');
        break;
      case 'priority':
        Alert.alert('Change Priority', 'Priority change functionality would be implemented here');
        break;
    }
    
    setSelectedRequest(null);
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

  const renderRequestItem = ({ item }: { item: AssistanceRequest }) => (
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
    paddingVertical: 16,
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
});

export default RequestManagement;
