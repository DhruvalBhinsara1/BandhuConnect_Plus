import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, RefreshControl, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRequest } from '../../context/RequestContext';
import { volunteerService } from '../../services/volunteerService';
import { User, Assignment } from '../../types';

const VolunteerManagement: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { assignments, getAssignments } = useRequest();
  
  const [refreshing, setRefreshing] = useState(false);
  const [volunteers, setVolunteers] = useState<User[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'available' | 'busy'>('all');

  useEffect(() => {
    loadVolunteers();
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadVolunteers();
    setRefreshing(false);
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

  const handleToggleStatus = (volunteer: User) => {
    console.log('Toggle status clicked for volunteer:', {
      id: volunteer.id,
      name: volunteer.name,
      current_status: volunteer.is_active,
      volunteer_status: volunteer.volunteer_status
    });
    
    Alert.alert(
      'Update Status',
      `Change ${volunteer.name}'s status?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Toggle Active',
          onPress: async () => {
            try {
              const newStatus = !volunteer.is_active;
              console.log('About to update volunteer:', volunteer.id, 'to status:', newStatus);
              
              const result = await volunteerService.updateVolunteerStatus(volunteer.id, newStatus);
              
              if (result.error) {
                console.error('Update failed with error:', result.error);
                Alert.alert('Error', 'Failed to update volunteer status. Please try again.');
              } else {
                console.log('Update successful, reloading volunteers...');
                // Reload volunteers from database to get latest data
                await loadVolunteers();
                Alert.alert('Success', `Volunteer status updated to ${newStatus ? 'Active' : 'Inactive'}`);
              }
            } catch (error) {
              console.error('Unexpected error during update:', error);
              Alert.alert('Error', 'An unexpected error occurred.');
            }
          }
        }
      ]
    );
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
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.volunteer_status || 'offline') }]}>
                <Text style={styles.statusText}>{getStatusText(item)}</Text>
              </View>
            </View>

            {item.skills && item.skills.length > 0 && (
              <View style={styles.skillsContainer}>
                {item.skills.slice(0, 3).map((skill) => (
                  <View key={skill} style={styles.skillBadge}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
                {item.skills.length > 3 && (
                  <Text style={styles.moreSkillsText}>+{item.skills.length - 3} more</Text>
                )}
              </View>
            )}

            <View style={styles.tasksRow}>
              <Ionicons name="briefcase" size={14} color="#6b7280" />
              <Text style={styles.tasksText}>
                {activeAssignments.length} active task{activeAssignments.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => handleToggleStatus(item)}>
            <Ionicons name="ellipsis-vertical" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.button, styles.outlineButton]} onPress={() => {/* Navigate to volunteer tasks */}}>
            <Text style={styles.outlineButtonText}>View Tasks</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.button, 
              (!item.is_active || item.volunteer_status === 'on_duty') ? styles.disabledButton : styles.primaryButton
            ]} 
            disabled={!item.is_active || item.volunteer_status === 'on_duty'}
            onPress={() => {/* Navigate to task assignment */}}
          >
            <Text style={[
              (!item.is_active || item.volunteer_status === 'on_duty') ? styles.disabledButtonText : styles.primaryButtonText
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
      </View>

      {/* Volunteer List */}
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  skillBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 4,
    marginBottom: 4,
  },
  skillText: {
    color: '#1e40af',
    fontSize: 12,
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
