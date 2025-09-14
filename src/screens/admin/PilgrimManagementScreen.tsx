import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';

interface Pilgrim {
  id: string;
  name: string;
  email: string;
  phone: string;
  age?: number;
  is_active: boolean;
  created_at: string;
  assistance_requests?: AssistanceRequest[];
}

interface AssistanceRequest {
  id: string;
  type: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  created_at: string;
  assignments?: Assignment[];
}

interface Assignment {
  id: string;
  status: string;
  volunteer?: {
    name: string;
    email: string;
  };
}

const PilgrimManagementScreen: React.FC = () => {
  const [pilgrims, setPilgrims] = useState<Pilgrim[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPilgrim, setSelectedPilgrim] = useState<Pilgrim | null>(null);
  const [pilgrimRequests, setPilgrimRequests] = useState<AssistanceRequest[]>([]);
  
  // Enhanced filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [requestCountFilter, setRequestCountFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchPilgrims();
  }, []);

  const fetchPilgrims = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          assistance_requests(
            id,
            type,
            title,
            status,
            priority,
            created_at
          )
        `)
        .eq('role', 'pilgrim')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPilgrims(data || []);
    } catch (error) {
      console.error('Error fetching pilgrims:', error);
      Alert.alert('Error', 'Failed to load pilgrims');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPilgrims();
  };

  const viewPilgrimProfile = async (pilgrim: Pilgrim) => {
    setSelectedPilgrim(pilgrim);
    
    // Fetch detailed requests for this pilgrim
    try {
      const { data, error } = await supabase
        .from('assistance_requests')
        .select(`
          *,
          assignments(
            id,
            status,
            volunteer:profiles!assignments_volunteer_id_fkey(name, email)
          )
        `)
        .eq('user_id', pilgrim.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPilgrimRequests(data || []);
    } catch (error) {
      console.error('Error fetching pilgrim requests:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'assigned': return '#3b82f6';
      case 'in_progress': return '#8b5cf6';
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

  const filteredPilgrims = useMemo(() => {
    let filtered = pilgrims.filter(pilgrim => {
      // Text search
      const matchesSearch = !searchTerm || 
        pilgrim.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pilgrim.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pilgrim.phone?.includes(searchTerm);
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && pilgrim.is_active) || 
        (statusFilter === 'inactive' && !pilgrim.is_active);
      
      // Request count filter
      const requestCount = pilgrim.assistance_requests?.length || 0;
      let matchesRequestCount = true;
      if (requestCountFilter === 'none') {
        matchesRequestCount = requestCount === 0;
      } else if (requestCountFilter === 'few') {
        matchesRequestCount = requestCount > 0 && requestCount <= 5;
      } else if (requestCountFilter === 'many') {
        matchesRequestCount = requestCount > 5;
      }
      
      return matchesSearch && matchesStatus && matchesRequestCount;
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
        case 'requests':
          aValue = a.assistance_requests?.length || 0;
          bValue = b.assistance_requests?.length || 0;
          break;
        case 'status':
          aValue = a.is_active ? 1 : 0;
          bValue = b.is_active ? 1 : 0;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [pilgrims, searchTerm, statusFilter, requestCountFilter, sortBy, sortOrder]);

  if (selectedPilgrim) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.profileContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedPilgrim(null)}
          >
            <Text style={styles.backButtonText}>← Back to Pilgrims</Text>
          </TouchableOpacity>

          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <Text style={styles.profileName}>{selectedPilgrim.name}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: selectedPilgrim.is_active ? '#10b981' : '#ef4444' }
              ]}>
                <Text style={styles.badgeText}>
                  {selectedPilgrim.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            
            <View style={styles.profileDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{selectedPilgrim.email || 'Not provided'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone:</Text>
                <Text style={styles.detailValue}>{selectedPilgrim.phone || 'Not provided'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Age:</Text>
                <Text style={styles.detailValue}>{selectedPilgrim.age || 'Not provided'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Joined:</Text>
                <Text style={styles.detailValue}>{new Date(selectedPilgrim.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Requests:</Text>
                <Text style={styles.detailValue}>{pilgrimRequests.length}</Text>
              </View>
            </View>
          </View>

          <View style={styles.requestsSection}>
            <Text style={styles.sectionTitle}>Request History</Text>
            {pilgrimRequests.length === 0 ? (
              <Text style={styles.noRequests}>No requests found</Text>
            ) : (
              pilgrimRequests.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <Text style={styles.requestTitle}>{request.title}</Text>
                    <View style={styles.requestBadges}>
                      <View style={[
                        styles.badge,
                        { backgroundColor: getStatusColor(request.status) }
                      ]}>
                        <Text style={styles.badgeText}>{request.status}</Text>
                      </View>
                      <View style={[
                        styles.badge,
                        { backgroundColor: getPriorityColor(request.priority) }
                      ]}>
                        <Text style={styles.badgeText}>{request.priority}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.requestDetails}>
                    <Text style={styles.requestDetail}>
                      <Text style={styles.detailLabel}>Type:</Text> {request.type}
                    </Text>
                    <Text style={styles.requestDetail}>
                      <Text style={styles.detailLabel}>Created:</Text> {new Date(request.created_at).toLocaleString()}
                    </Text>
                    {request.assignments && request.assignments.length > 0 && (
                      <Text style={styles.requestDetail}>
                        <Text style={styles.detailLabel}>Assigned to:</Text> {request.assignments[0].volunteer?.name} 
                        ({request.assignments[0].volunteer?.email})
                      </Text>
                    )}
                  </View>
                  
                  {request.description && (
                    <View style={styles.requestDescription}>
                      <Text style={styles.detailLabel}>Description:</Text>
                      <Text style={styles.descriptionText}>{request.description}</Text>
                    </View>
                  )}
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
        <Text style={styles.title}>Pilgrim Management</Text>
        <TouchableOpacity onPress={fetchPilgrims} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search pilgrims by name, email, or phone..."
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
            {showFilters ? 'Hide Filters' : 'Show Filters'} ({filteredPilgrims.length} results)
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

            {/* Request Count Filter */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Requests:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
                {[
                  { key: 'all', label: 'All' },
                  { key: 'none', label: 'None' },
                  { key: 'few', label: '1-5' },
                  { key: 'many', label: '6+' }
                ].map((filter) => (
                  <TouchableOpacity
                    key={filter.key}
                    style={[
                      styles.filterChip,
                      requestCountFilter === filter.key && styles.filterChipActive
                    ]}
                    onPress={() => setRequestCountFilter(filter.key)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      requestCountFilter === filter.key && styles.filterChipTextActive
                    ]}>
                      {filter.label}
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
                  { key: 'requests', label: 'Requests' },
                  { key: 'status', label: 'Status' }
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
          <Text style={styles.statNumber}>{pilgrims.length}</Text>
          <Text style={styles.statLabel}>Total Pilgrims</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {pilgrims.filter(p => p.is_active).length}
          </Text>
          <Text style={styles.statLabel}>Active Pilgrims</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {pilgrims.reduce((sum, p) => sum + (p.assistance_requests?.length || 0), 0)}
          </Text>
          <Text style={styles.statLabel}>Total Requests</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.pilgrimsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <Text style={styles.loading}>Loading pilgrims...</Text>
        ) : filteredPilgrims.length === 0 ? (
          <Text style={styles.noPilgrims}>
            {searchTerm ? 'No pilgrims match your search' : 'No pilgrims found'}
          </Text>
        ) : (
          filteredPilgrims.map((pilgrim) => (
            <View key={pilgrim.id} style={styles.pilgrimCard}>
              <View style={styles.pilgrimInfo}>
                <View style={styles.pilgrimHeader}>
                  <Text style={styles.pilgrimName}>{pilgrim.name}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: pilgrim.is_active ? '#10b981' : '#ef4444' }
                  ]}>
                    <Text style={styles.badgeText}>
                      {pilgrim.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.pilgrimDetails}>
                  <Text style={styles.pilgrimDetail}>📧 {pilgrim.email || 'No email'}</Text>
                  <Text style={styles.pilgrimDetail}>📱 {pilgrim.phone || 'No phone'}</Text>
                  <Text style={styles.pilgrimDetail}>
                    📅 Joined: {new Date(pilgrim.created_at).toLocaleDateString()}
                  </Text>
                  <Text style={styles.pilgrimDetail}>
                    📋 Requests: {pilgrim.assistance_requests?.length || 0}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => viewPilgrimProfile(pilgrim)}
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
    backgroundColor: '#f59e0b',
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
    color: '#f59e0b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  pilgrimsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loading: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    marginTop: 40,
  },
  noPilgrims: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    marginTop: 40,
  },
  pilgrimCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pilgrimInfo: {
    marginBottom: 12,
  },
  pilgrimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pilgrimName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
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
  pilgrimDetails: {
    gap: 4,
  },
  pilgrimDetail: {
    fontSize: 14,
    color: '#6b7280',
  },
  viewButton: {
    backgroundColor: '#f59e0b',
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
    color: '#f59e0b',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
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
  requestsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  noRequests: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    marginTop: 20,
  },
  requestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  requestBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  requestDetails: {
    gap: 4,
    marginBottom: 8,
  },
  requestDetail: {
    fontSize: 14,
    color: '#6b7280',
  },
  requestDescription: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
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
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
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

export default PilgrimManagementScreen;
