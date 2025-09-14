import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';

interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string;
  age?: number;
  skills?: string[];
  volunteer_status: 'active' | 'inactive';
  duty_status: 'on_duty' | 'off_duty';
  is_active: boolean;
  created_at: string;
  assignments?: Assignment[];
}

interface Assignment {
  id: string;
  status: string;
  created_at: string;
  assistance_requests?: {
    id: string;
    title: string;
    type: string;
    status: string;
    priority: string;
    created_at: string;
  };
}

const VolunteerManagementScreen: React.FC = () => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [volunteerAssignments, setVolunteerAssignments] = useState<Assignment[]>([]);
  
  // Enhanced filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dutyStatusFilter, setDutyStatusFilter] = useState<string>('all');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const fetchVolunteers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          assignments(
            id,
            status,
            assistance_requests!inner(
              id,
              title,
              type,
              status,
              priority,
              created_at
            )
          )
        `)
        .eq('role', 'volunteer')
        .order('name');
      
      if (error) throw error;
      setVolunteers(data || []);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
      Alert.alert('Error', 'Failed to load volunteers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchVolunteers();
  };

  const viewVolunteerProfile = async (volunteer: Volunteer) => {
    setSelectedVolunteer(volunteer);
    
    // Fetch detailed assignments for this volunteer
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          assistance_requests(
            id,
            title,
            type,
            status,
            priority,
            created_at,
            user:profiles!assistance_requests_user_id_fkey(name, email)
          )
        `)
        .eq('volunteer_id', volunteer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVolunteerAssignments(data || []);
    } catch (error) {
      console.error('Error fetching volunteer assignments:', error);
    }
  };

  const updateVolunteerStatus = async (volunteerId: string, statusType: string, newStatus: string) => {
    try {
      const updateData: any = {};
      updateData[statusType] = newStatus;
      
      // If volunteer becomes inactive, automatically set them off duty
      if (statusType === 'volunteer_status' && newStatus === 'inactive') {
        updateData.duty_status = 'off_duty';
      }
      
      // Remove hard-coded volunteer_status assignment - let assignment service handle this automatically
      // if (statusType === 'duty_status' && newStatus === 'on_duty') {
      //   updateData.volunteer_status = 'active';
      // }
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', volunteerId);

      if (error) throw error;
      
      // Refresh the volunteers list
      await fetchVolunteers();
      Alert.alert('Success', 'Status updated successfully');
    } catch (error) {
      console.error('Error updating volunteer status:', error);
      Alert.alert('Error', 'Failed to update volunteer status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'assigned': return '#3b82f6';
      case 'accepted': return '#8b5cf6';
      case 'in_progress': return '#06b6d4';
      case 'completed': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#65a30d';
      default: return '#6b7280';
    }
  };

  const filteredVolunteers = useMemo(() => {
    let filtered = volunteers.filter(volunteer => {
      // Text search
      const matchesSearch = !searchTerm || 
        volunteer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        volunteer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        volunteer.phone?.includes(searchTerm) ||
        volunteer.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || volunteer.volunteer_status === statusFilter;
      
      // Duty status filter
      const matchesDutyStatus = dutyStatusFilter === 'all' || volunteer.duty_status === dutyStatusFilter;
      
      // Skills filter
      const matchesSkill = skillFilter === 'all' || 
        volunteer.skills?.some(skill => skill.toLowerCase().includes(skillFilter.toLowerCase()));
      
      return matchesSearch && matchesStatus && matchesDutyStatus && matchesSkill;
    });
    
    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'date_joined':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'status':
          aValue = a.volunteer_status;
          bValue = b.volunteer_status;
          break;
        case 'assignments':
          aValue = a.assignments?.length || 0;
          bValue = b.assignments?.length || 0;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [volunteers, searchTerm, statusFilter, dutyStatusFilter, skillFilter, sortBy, sortOrder]);

  if (selectedVolunteer) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.profileContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedVolunteer(null)}
          >
            <Text style={styles.backButtonText}>← Back to Volunteers</Text>
          </TouchableOpacity>

          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <Text style={styles.profileName}>{selectedVolunteer.name}</Text>
              <View style={styles.statusBadges}>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: selectedVolunteer.volunteer_status === 'active' ? '#10b981' : '#ef4444' }
                ]}>
                  <Text style={styles.badgeText}>
                    {selectedVolunteer.volunteer_status === 'active' ? 'Active' : 'Inactive'}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: selectedVolunteer.duty_status === 'on_duty' ? '#3b82f6' : '#6b7280' }
                ]}>
                  <Text style={styles.badgeText}>
                    {selectedVolunteer.duty_status === 'on_duty' ? 'On Duty' : 'Off Duty'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.profileDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{selectedVolunteer.email}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone:</Text>
                <Text style={styles.detailValue}>{selectedVolunteer.phone}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Age:</Text>
                <Text style={styles.detailValue}>{selectedVolunteer.age || 'Not provided'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Skills:</Text>
                <Text style={styles.detailValue}>{selectedVolunteer.skills?.join(', ') || 'No skills listed'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Joined:</Text>
                <Text style={styles.detailValue}>{new Date(selectedVolunteer.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Assignments:</Text>
                <Text style={styles.detailValue}>{volunteerAssignments.length}</Text>
              </View>
            </View>
          </View>

          <View style={styles.assignmentsSection}>
            <Text style={styles.sectionTitle}>Assignment History</Text>
            {volunteerAssignments.length === 0 ? (
              <Text style={styles.noAssignments}>No assignments found</Text>
            ) : (
              volunteerAssignments.map((assignment) => (
                <View key={assignment.id} style={styles.assignmentCard}>
                  <View style={styles.assignmentHeader}>
                    <Text style={styles.assignmentTitle}>
                      {assignment.assistance_requests?.title || 'Untitled Request'}
                    </Text>
                    <View style={styles.assignmentBadges}>
                      <View style={[
                        styles.badge,
                        { backgroundColor: getStatusColor(assignment.status) }
                      ]}>
                        <Text style={styles.badgeText}>{assignment.status}</Text>
                      </View>
                      {assignment.assistance_requests?.priority && (
                        <View style={[
                          styles.badge,
                          { backgroundColor: getPriorityColor(assignment.assistance_requests.priority) }
                        ]}>
                          <Text style={styles.badgeText}>{assignment.assistance_requests.priority}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.assignmentDetails}>
                    <Text style={styles.assignmentDetail}>
                      <Text style={styles.detailLabel}>Type:</Text> {assignment.assistance_requests?.type || 'Unknown'}
                    </Text>
                    <Text style={styles.assignmentDetail}>
                      <Text style={styles.detailLabel}>Assigned:</Text> {new Date(assignment.assistance_requests?.created_at || assignment.created_at).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Volunteer Management</Text>
        <TouchableOpacity onPress={fetchVolunteers} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search volunteers by name, email, phone, or skills..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        placeholderTextColor="#9CA3AF"
      />

      {/* Filter Controls */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterToggleText}>
            {showFilters ? 'Hide Filters' : 'Show Filters'} ({filteredVolunteers.length} results)
          </Text>
        </TouchableOpacity>

        {showFilters && (
          <View style={styles.filterOptions}>
            {/* Status Filter */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Status:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
                {['all', 'active', 'inactive'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterChip,
                      statusFilter === status && styles.filterChipActive
                    ]}
                    onPress={() => setStatusFilter(status)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      statusFilter === status && styles.filterChipTextActive
                    ]}>
                      {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Duty Status Filter */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Duty:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
                {['all', 'on_duty', 'off_duty'].map((dutyStatus) => (
                  <TouchableOpacity
                    key={dutyStatus}
                    style={[
                      styles.filterChip,
                      dutyStatusFilter === dutyStatus && styles.filterChipActive
                    ]}
                    onPress={() => setDutyStatusFilter(dutyStatus)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      dutyStatusFilter === dutyStatus && styles.filterChipTextActive
                    ]}>
                      {dutyStatus === 'all' ? 'All' : dutyStatus === 'on_duty' ? 'On Duty' : 'Off Duty'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Sort Options */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Sort by:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
                {[
                  { key: 'name', label: 'Name' },
                  { key: 'date_joined', label: 'Date Joined' },
                  { key: 'status', label: 'Status' },
                  { key: 'assignments', label: 'Assignments' }
                ].map((sortOption) => (
                  <TouchableOpacity
                    key={sortOption.key}
                    style={[
                      styles.filterChip,
                      sortBy === sortOption.key && styles.filterChipActive
                    ]}
                    onPress={() => setSortBy(sortOption.key)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      sortBy === sortOption.key && styles.filterChipTextActive
                    ]}>
                      {sortOption.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.sortOrderButton}
                onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                <Text style={styles.sortOrderText}>
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{volunteers.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {volunteers.filter(v => v.volunteer_status === 'active').length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {volunteers.filter(v => v.duty_status === 'on_duty').length}
          </Text>
          <Text style={styles.statLabel}>On Duty</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.volunteersList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <Text style={styles.loading}>Loading volunteers...</Text>
        ) : filteredVolunteers.length === 0 ? (
          <Text style={styles.noVolunteers}>
            {searchTerm ? 'No volunteers match your search' : 'No volunteers found'}
          </Text>
        ) : (
          filteredVolunteers.map((volunteer) => (
            <View key={volunteer.id} style={styles.volunteerCard}>
              <View style={styles.volunteerInfo}>
                <View style={styles.volunteerHeader}>
                  <Text style={styles.volunteerName}>{volunteer.name}</Text>
                  <View style={styles.statusBadges}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: volunteer.volunteer_status === 'active' ? '#10b981' : '#ef4444' }
                    ]}>
                      <Text style={styles.badgeText}>
                        {volunteer.volunteer_status === 'active' ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: volunteer.duty_status === 'on_duty' ? '#3b82f6' : '#6b7280' }
                    ]}>
                      <Text style={styles.badgeText}>
                        {volunteer.duty_status === 'on_duty' ? 'On Duty' : 'Off Duty'}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.volunteerDetails}>
                  <Text style={styles.volunteerDetail}>📧 {volunteer.email || 'No email'}</Text>
                  <Text style={styles.volunteerDetail}>📱 {volunteer.phone || 'No phone'}</Text>
                  <Text style={styles.volunteerDetail}>
                    📅 Joined: {new Date(volunteer.created_at).toLocaleDateString()}
                  </Text>
                  <Text style={styles.volunteerDetail}>
                    📋 Assignments: {volunteer.assignments?.length || 0}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => viewVolunteerProfile(volunteer)}
              >
                <Text style={styles.viewButtonText}>View Profile</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loading: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 40,
  },
  noVolunteers: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 40,
  },
  volunteerCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  refreshButton: {
    padding: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
  },
  searchInput: {
    margin: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  volunteersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  volunteerInfo: {
    marginBottom: 12,
  },
  volunteerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  volunteerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  statusBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  volunteerDetails: {
    gap: 4,
  },
  volunteerDetail: {
    fontSize: 14,
    color: '#6b7280',
  },
  viewButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  viewButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  profileContainer: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    marginBottom: 20,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  profileDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#6b7280',
    flex: 2,
    textAlign: 'right',
  },
  assignmentsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  noAssignments: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    marginTop: 20,
  },
  assignmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  assignmentBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  assignmentDetails: {
    gap: 4,
  },
  assignmentDetail: {
    fontSize: 14,
    color: '#6b7280',
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterToggle: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  filterToggleText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  filterOptions: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterRow: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterChipText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  sortOrderButton: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  sortOrderText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
});

export default VolunteerManagementScreen;
