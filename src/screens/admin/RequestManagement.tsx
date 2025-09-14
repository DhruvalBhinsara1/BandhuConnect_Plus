import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRequest } from '../../context/RequestContext';
import { useNavigation } from '@react-navigation/native';
import { PROFESSIONAL_DESIGN } from '../../design/professionalDesignSystem';
import { supabase } from '../../services/supabase';
import { User } from '../../types';
import { Logger } from '../../utils/logger';

interface FilterState {
  status: 'all' | 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'all' | 'low' | 'medium' | 'high';
}

const RequestManagement: React.FC = () => {
  const navigation = useNavigation<any>();
  const { requests, assignments, getRequests, getAssignments } = useRequest();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterState>({ status: 'all', priority: 'all' });
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed' | 'archived'>('active');
  const [volunteers, setVolunteers] = useState<User[]>([]);
  const [autoAssigning, setAutoAssigning] = useState(false);
  
  // Enhanced filter states
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([getRequests(), getAssignments(), loadVolunteers()]);
    } catch (error) {
      console.error('Error loading request data:', error);
    }
  };

  const loadVolunteers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'volunteer')
        .order('name');

      if (error) {
        console.error('Error loading volunteers:', error);
        return;
      }

      setVolunteers(data || []);
    } catch (error) {
      console.error('Error loading volunteers:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return PROFESSIONAL_DESIGN.COLORS.warning;
      case 'assigned':
        return PROFESSIONAL_DESIGN.COLORS.sky;         // Sky blue
      case 'in_progress':
        return PROFESSIONAL_DESIGN.COLORS.primary;     // Teal
      case 'completed':
        return PROFESSIONAL_DESIGN.COLORS.mint;        // Mint green
      case 'cancelled':
        return PROFESSIONAL_DESIGN.COLORS.error;
      default:
        return PROFESSIONAL_DESIGN.COLORS.textSecondary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return PROFESSIONAL_DESIGN.COLORS.error;
      case 'medium':
        return PROFESSIONAL_DESIGN.COLORS.warning;
      case 'low':
        return PROFESSIONAL_DESIGN.COLORS.success;
      default:
        return PROFESSIONAL_DESIGN.COLORS.textSecondary;
    }
  };

  const handleBatchAutoAssign = async () => {
    const pendingRequests = requests?.filter(r => r.status === 'pending') || [];
    
    if (pendingRequests.length === 0) {
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
      `This will attempt to automatically assign ${pendingRequests.length} pending requests to ${availableVolunteers.length} available volunteers. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Assign', onPress: performBatchAutoAssign }
      ]
    );
  };

  const performBatchAutoAssign = async () => {
    setAutoAssigning(true);
    const pendingRequests = requests?.filter(r => r.status === 'pending') || [];
    Logger.autoAssignment.start(pendingRequests.length);

    let assigned = 0;
    let failed = 0;

    try {
      for (const request of pendingRequests) {
        try {
          Logger.autoAssignment.requestProcessing(request, assigned + failed, pendingRequests.length);
          
          const { data: result, error } = await supabase.rpc('auto_assign_volunteer', {
            p_request_id: request.id,
            p_max_distance: 5000, // 5km radius
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
        `Successfully assigned ${assigned} out of ${pendingRequests.length} pending requests.${failed > 0 ? `\n\n${failed} requests could not be assigned (no suitable volunteers found).` : ''}`,
        [{ text: 'OK', onPress: () => { loadData(); } }]
      );
    } catch (error) {
      Logger.autoAssignment.matchResult(false, undefined, undefined, 'Batch assignment error');
      Alert.alert('Error', 'Failed to perform auto-assignment. Please try again.');
    } finally {
      setAutoAssigning(false);
    }
  };

  const filteredRequests = useMemo(() => {
    let filtered = requests || [];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (request) =>
          request.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (filter.status !== 'all') {
      filtered = filtered.filter((request) => request.status === filter.status);
    }

    // Filter by priority
    if (filter.priority !== 'all') {
      filtered = filtered.filter((request) => request.priority === filter.priority);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((request) => request.type === typeFilter);
    }

    // Filter by tab selection
    switch (selectedTab) {
      case 'active':
        filtered = filtered.filter((request) => 
          ['pending', 'assigned', 'in_progress'].includes(request.status)
        );
        break;
      case 'completed':
        filtered = filtered.filter((request) => request.status === 'completed');
        break;
      case 'archived':
        filtered = filtered.filter((request) => request.status === 'cancelled');
        break;
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'priority':
          const priorityOrder = { 'emergency': 4, 'high': 3, 'medium': 2, 'low': 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case 'status':
          const statusOrder = { 'pending': 1, 'assigned': 2, 'in_progress': 3, 'completed': 4, 'cancelled': 5 };
          aValue = statusOrder[a.status as keyof typeof statusOrder] || 0;
          bValue = statusOrder[b.status as keyof typeof statusOrder] || 0;
          break;
        case 'title':
          aValue = a.title?.toLowerCase() || '';
          bValue = b.title?.toLowerCase() || '';
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [requests, searchQuery, filter, typeFilter, selectedTab, sortBy, sortOrder]);

  const renderFilterButton = (label: string, value: string, currentValue: string, onPress: () => void) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        value === currentValue && styles.activeFilterButton,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterButtonText,
          value === currentValue && styles.activeFilterButtonText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderRequest = (request: any) => {
    const assignment = assignments?.find((a) => a.request_id === request.id);
    
    return (
      <TouchableOpacity
        key={request.id}
        style={styles.requestCard}
        onPress={() => {
          // Navigate to request details
          navigation.navigate('TaskAssignment', { requestId: request.id });
        }}
      >
        <View style={styles.requestHeader}>
          <View style={styles.requestTitleRow}>
            <Text style={styles.requestTitle} numberOfLines={1}>
              {request.title || 'Assistance Request'}
            </Text>
            <View style={styles.priorityBadge}>
              <Text style={[styles.priorityText, { color: getPriorityColor(request.priority) }]}>
                {request.priority?.toUpperCase() || 'MEDIUM'}
              </Text>
            </View>
          </View>
          
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '20' }]}>
              <Ionicons 
                name={getStatusIcon(request.status)} 
                size={12} 
                color={getStatusColor(request.status)} 
              />
              <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                {request.status?.toUpperCase() || 'PENDING'}
              </Text>
            </View>
            <Text style={styles.requestTime}>
              {new Date(request.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <Text style={styles.requestDescription} numberOfLines={2}>
          {request.description || 'No description provided'}
        </Text>

        <View style={styles.requestDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={16} color={PROFESSIONAL_DESIGN.COLORS.textSecondary} />
            <Text style={styles.detailText}>
              {request.location && request.location.latitude && request.location.longitude ? 
                `${request.location.latitude.toFixed(4)}, ${request.location.longitude.toFixed(4)}` : 
                'Location not specified'
              }
            </Text>
          </View>
          
          {assignment && assignment.volunteer && (
            <View style={styles.detailItem}>
              <Ionicons name="person-outline" size={16} color={PROFESSIONAL_DESIGN.COLORS.primary} />
              <Text style={styles.detailText}>
                Assigned to {assignment.volunteer.name}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.requestActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="eye-outline" size={16} color={PROFESSIONAL_DESIGN.COLORS.primary} />
            <Text style={styles.actionButtonText}>View Details</Text>
          </TouchableOpacity>
          
          {request.status === 'pending' && (
            <TouchableOpacity style={[styles.actionButton, styles.primaryAction]}>
              <Ionicons name="person-add-outline" size={16} color="white" />
              <Text style={[styles.actionButtonText, { color: 'white' }]}>Assign</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'time-outline';
      case 'assigned':
        return 'person-outline';
      case 'in_progress':
        return 'play-outline';
      case 'completed':
        return 'checkmark-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Request Management</Text>
        <Text style={styles.headerSubtitle}>Manage pilgrim assistance requests</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'active', label: 'Active Requests', count: requests?.filter(r => ['pending', 'assigned', 'in_progress'].includes(r.status)).length || 0 },
          { key: 'completed', label: 'Completed', count: requests?.filter(r => r.status === 'completed').length || 0 },
          { key: 'archived', label: 'Archived', count: requests?.filter(r => r.status === 'cancelled').length || 0 },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, selectedTab === tab.key && styles.activeTabButton]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <Text style={[styles.tabButtonText, selectedTab === tab.key && styles.activeTabButtonText]}>
              {tab.label}
            </Text>
            <View style={[styles.tabBadge, selectedTab === tab.key && styles.activeTabBadge]}>
              <Text style={[styles.tabBadgeText, selectedTab === tab.key && styles.activeTabBadgeText]}>
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={PROFESSIONAL_DESIGN.COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search requests..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={PROFESSIONAL_DESIGN.COLORS.textSecondary}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={PROFESSIONAL_DESIGN.COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Status:</Text>
          {renderFilterButton('All', 'all', filter.status, () => setFilter({ ...filter, status: 'all' }))}
          {renderFilterButton('Pending', 'pending', filter.status, () => setFilter({ ...filter, status: 'pending' }))}
          {renderFilterButton('Assigned', 'assigned', filter.status, () => setFilter({ ...filter, status: 'assigned' }))}
          {renderFilterButton('In Progress', 'in_progress', filter.status, () => setFilter({ ...filter, status: 'in_progress' }))}
          
          <Text style={[styles.filterLabel, { marginLeft: 16 }]}>Priority:</Text>
          {renderFilterButton('All', 'all', filter.priority, () => setFilter({ ...filter, priority: 'all' }))}
          {renderFilterButton('High', 'high', filter.priority, () => setFilter({ ...filter, priority: 'high' }))}
          {renderFilterButton('Medium', 'medium', filter.priority, () => setFilter({ ...filter, priority: 'medium' }))}
          {renderFilterButton('Low', 'low', filter.priority, () => setFilter({ ...filter, priority: 'low' }))}
        </ScrollView>

        {/* Advanced Filters Toggle */}
        <TouchableOpacity
          style={styles.advancedFiltersToggle}
          onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          <Text style={styles.advancedFiltersToggleText}>
            {showAdvancedFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
          </Text>
          <Ionicons 
            name={showAdvancedFilters ? 'chevron-up' : 'chevron-down'} 
            size={16} 
            color={PROFESSIONAL_DESIGN.COLORS.textSecondary} 
          />
        </TouchableOpacity>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <View style={styles.advancedFiltersContainer}>
            {/* Type Filter */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Type:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                {['all', 'medical', 'transportation', 'food', 'accommodation', 'general'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterChip,
                      typeFilter === type && styles.activeFilterChip
                    ]}
                    onPress={() => setTypeFilter(type)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      typeFilter === type && styles.activeFilterChipText
                    ]}>
                      {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Sort Options */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Sort by:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                {[
                  { key: 'created_at', label: 'Date Created' },
                  { key: 'priority', label: 'Priority' },
                  { key: 'status', label: 'Status' },
                  { key: 'title', label: 'Title' }
                ].map((sortOption) => (
                  <TouchableOpacity
                    key={sortOption.key}
                    style={[
                      styles.filterChip,
                      sortBy === sortOption.key && styles.activeFilterChip
                    ]}
                    onPress={() => setSortBy(sortOption.key)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      sortBy === sortOption.key && styles.activeFilterChipText
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

      {/* Auto-Assign Section */}
      {filteredRequests.filter(r => r.status === 'pending').length > 0 && volunteers.filter(v => v.is_active && v.volunteer_status === 'available').length > 0 && (
        <View style={styles.autoAssignSection}>
          <View style={styles.autoAssignHeader}>
            <View>
              <Text style={styles.autoAssignTitle}>
                {filteredRequests.filter(r => r.status === 'pending').length} Pending Requests
              </Text>
              <Text style={styles.autoAssignSubtitle}>
                {volunteers.filter(v => v.is_active && v.volunteer_status === 'available').length} volunteers available for assignment
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.autoAssignButton, autoAssigning && styles.autoAssignButtonDisabled]}
              onPress={handleBatchAutoAssign}
              disabled={autoAssigning}
            >
              <Ionicons 
                name={autoAssigning ? "time-outline" : "flash"} 
                size={20} 
                color="white" 
                style={{ marginRight: 8 }} 
              />
              <Text style={styles.autoAssignButtonText}>
                {autoAssigning ? 'Assigning...' : 'Auto-Assign All'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Request List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {filteredRequests.length > 0 ? (
          filteredRequests.map(renderRequest)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="clipboard-outline" size={64} color={PROFESSIONAL_DESIGN.COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No requests found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || filter.status !== 'all' || filter.priority !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No requests available in this category'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.background,
  },
  header: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.lg,
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: PROFESSIONAL_DESIGN.COLORS.border,
    ...PROFESSIONAL_DESIGN.SHADOWS.sm,
  },
  headerTitle: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.h2,
    fontWeight: 'bold',
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
  },
  headerSubtitle: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.body,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.lg,
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.sm,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.sm,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.md,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.md,
    marginHorizontal: 2,
  },
  activeTabButton: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.primary,
  },
  tabButtonText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.caption,
    fontWeight: '600',
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    marginRight: 6,
  },
  activeTabButtonText: {
    color: 'white',
  },
  tabBadge: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  activeTabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabBadgeText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: 'bold',
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
  },
  activeTabBadgeText: {
    color: 'white',
  },
  searchSection: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.lg,
    paddingBottom: PROFESSIONAL_DESIGN.SPACING.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.background,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.lg,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.md,
    marginBottom: PROFESSIONAL_DESIGN.SPACING.sm,
    borderWidth: 1,
    borderColor: PROFESSIONAL_DESIGN.COLORS.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.sm,
    marginLeft: PROFESSIONAL_DESIGN.SPACING.sm,
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.body,
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterLabel: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.caption,
    fontWeight: '600',
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    alignSelf: 'center',
    marginRight: 8,
  },
  filterButton: {
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.sm,
    paddingVertical: 6,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.sm,
    marginRight: 6,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.background,
    borderWidth: 1,
    borderColor: PROFESSIONAL_DESIGN.COLORS.border,
  },
  activeFilterButton: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.primary,
    borderColor: PROFESSIONAL_DESIGN.COLORS.primary,
  },
  filterButtonText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.caption,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
  },
  activeFilterButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.lg,
  },
  requestCard: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.lg,
    padding: PROFESSIONAL_DESIGN.SPACING.lg,
    marginVertical: PROFESSIONAL_DESIGN.SPACING.sm,
    borderWidth: 1,
    borderColor: PROFESSIONAL_DESIGN.COLORS.border,
    ...PROFESSIONAL_DESIGN.SHADOWS.sm,
  },
  requestHeader: {
    marginBottom: PROFESSIONAL_DESIGN.SPACING.sm,
  },
  requestTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requestTitle: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.h4,
    fontWeight: 'bold',
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.background,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.sm,
  },
  priorityText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.sm,
  },
  statusText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.caption,
    fontWeight: '600',
    marginLeft: 4,
  },
  requestTime: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.caption,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
  },
  requestDescription: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.body,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: PROFESSIONAL_DESIGN.SPACING.sm,
  },
  requestDetails: {
    marginBottom: PROFESSIONAL_DESIGN.SPACING.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.caption,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    marginLeft: 6,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: PROFESSIONAL_DESIGN.SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: PROFESSIONAL_DESIGN.COLORS.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.md,
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.sm,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.md,
    marginLeft: PROFESSIONAL_DESIGN.SPACING.sm,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.background,
    borderWidth: 1,
    borderColor: PROFESSIONAL_DESIGN.COLORS.border,
  },
  primaryAction: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.primary,
    borderColor: PROFESSIONAL_DESIGN.COLORS.primary,
  },
  actionButtonText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.caption,
    fontWeight: '600',
    color: PROFESSIONAL_DESIGN.COLORS.primary,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.xxl * 2,
  },
  emptyTitle: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.h3,
    fontWeight: 'bold',
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    marginTop: PROFESSIONAL_DESIGN.SPACING.lg,
  },
  emptySubtitle: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.body,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    textAlign: 'center',
    marginTop: PROFESSIONAL_DESIGN.SPACING.sm,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.xl,
  },
  autoAssignSection: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    marginHorizontal: PROFESSIONAL_DESIGN.SPACING.lg,
    marginVertical: PROFESSIONAL_DESIGN.SPACING.md,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.lg,
    padding: PROFESSIONAL_DESIGN.SPACING.lg,
    borderWidth: 1,
    borderColor: PROFESSIONAL_DESIGN.COLORS.mint,
    ...PROFESSIONAL_DESIGN.SHADOWS.sm,
  },
  autoAssignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  autoAssignTitle: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.h3,
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
    fontWeight: '600',
  },
  autoAssignSubtitle: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.caption,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    marginTop: 4,
  },
  autoAssignButton: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.lg,
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.md,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.md,
    ...PROFESSIONAL_DESIGN.SHADOWS.sm,
  },
  autoAssignButtonDisabled: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    opacity: 0.6,
  },
  autoAssignButtonText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.button,
    color: 'white',
    fontWeight: '600',
  },
  advancedFiltersToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.sm,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.md,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.sm,
    marginTop: PROFESSIONAL_DESIGN.SPACING.sm,
  },
  advancedFiltersToggleText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.body,
    color: PROFESSIONAL_DESIGN.COLORS.primary,
    fontWeight: '600',
    marginRight: PROFESSIONAL_DESIGN.SPACING.xs,
  },
  advancedFiltersContainer: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.md,
    padding: PROFESSIONAL_DESIGN.SPACING.md,
    marginTop: PROFESSIONAL_DESIGN.SPACING.sm,
    ...PROFESSIONAL_DESIGN.SHADOWS.sm,
  },
  filterRow: {
    marginBottom: PROFESSIONAL_DESIGN.SPACING.md,
  },
  chipContainer: {
    flexDirection: 'row',
    marginTop: PROFESSIONAL_DESIGN.SPACING.xs,
  },
  filterChip: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.background,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.md,
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.xs,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.lg,
    marginRight: PROFESSIONAL_DESIGN.SPACING.sm,
    borderWidth: 1,
    borderColor: PROFESSIONAL_DESIGN.COLORS.border,
  },
  activeFilterChip: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.primary,
    borderColor: PROFESSIONAL_DESIGN.COLORS.primary,
  },
  filterChipText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.caption,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: 'white',
  },
  sortOrderButton: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.background,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.sm,
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.xs,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.sm,
    marginLeft: PROFESSIONAL_DESIGN.SPACING.sm,
  },
  sortOrderText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.caption,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    fontWeight: '600',
  },
});

export default RequestManagement;
