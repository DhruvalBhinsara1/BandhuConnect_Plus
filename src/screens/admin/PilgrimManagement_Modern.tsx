import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { Logger } from '../../utils/logger';
import { User } from '../../types';
import { PROFESSIONAL_DESIGN } from '../../design/professionalDesignSystem';

type FilterType = 'all' | 'active' | 'inactive';
type TabType = 'pilgrims' | 'requests';

const PilgrimManagement: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  
  const [refreshing, setRefreshing] = useState(false);
  const [pilgrims, setPilgrims] = useState<User[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [requests, setRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('pilgrims');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPilgrims();
    loadRequests();
  }, []);

  const loadPilgrims = async () => {
    try {
      console.log('Loading pilgrims...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'pilgrim')
        .order('created_at', { ascending: false });
      
      if (data && !error) {
        console.log('Setting pilgrims from database:', data.length);
        setPilgrims(data);
      } else {
        console.log('❌ No pilgrims found in database!');
        console.log('Error details:', error);
        setPilgrims([]);
      }
    } catch (error) {
      console.error('Error loading pilgrims:', error);
      Logger.error('Failed to load pilgrims', error as Error);
      setPilgrims([]);
    }
  };

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('assistance_requests')
        .select(`
          *,
          pilgrim:profiles!assistance_requests_user_id_fkey(*)
        `)
        .order('created_at', { ascending: false });
        
      if (data) {
        setRequests(data);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      Logger.error('Failed to load pilgrim requests', error as Error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadPilgrims(), loadRequests()]);
    setRefreshing(false);
  };

  const getFilteredPilgrims = () => {
    let filtered = pilgrims;

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(pilgrim => 
        filter === 'active' ? pilgrim.is_active : !pilgrim.is_active
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(pilgrim =>
        pilgrim.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pilgrim.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pilgrim.phone?.includes(searchQuery)
      );
    }

    return filtered;
  };

  const getFilteredRequests = () => {
    let filtered = requests;

    if (searchQuery) {
      filtered = filtered.filter(request =>
        request.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.pilgrim?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return PROFESSIONAL_DESIGN.COLORS.warning;
      case 'assigned':
        return PROFESSIONAL_DESIGN.COLORS.info;
      case 'in_progress':
        return PROFESSIONAL_DESIGN.COLORS.primary;
      case 'completed':
        return PROFESSIONAL_DESIGN.COLORS.success;
      case 'cancelled':
        return PROFESSIONAL_DESIGN.COLORS.error;
      default:
        return PROFESSIONAL_DESIGN.COLORS.textSecondary;
    }
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

  const handlePilgrimAction = (pilgrim: User, action: 'activate' | 'deactivate' | 'view') => {
    switch (action) {
      case 'activate':
        Alert.alert(
          'Activate Pilgrim',
          `Are you sure you want to activate ${pilgrim.name}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Activate', onPress: () => updatePilgrimStatus(pilgrim.id, true) },
          ]
        );
        break;
      case 'deactivate':
        Alert.alert(
          'Deactivate Pilgrim',
          `Are you sure you want to deactivate ${pilgrim.name}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Deactivate', style: 'destructive', onPress: () => updatePilgrimStatus(pilgrim.id, false) },
          ]
        );
        break;
      case 'view':
        // Navigate to pilgrim details
        break;
    }
  };

  const updatePilgrimStatus = async (pilgrimId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', pilgrimId);

      if (error) throw error;

      await loadPilgrims();
      Alert.alert(
        'Success',
        `Pilgrim ${isActive ? 'activated' : 'deactivated'} successfully`
      );
    } catch (error) {
      console.error('Error updating pilgrim status:', error);
      Alert.alert('Error', 'Failed to update pilgrim status');
    }
  };

  const renderFilterButton = (filterType: FilterType, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && styles.activeFilterButton,
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === filterType && styles.activeFilterButtonText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderPilgrimItem = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.itemCard} onPress={() => handlePilgrimAction(item, 'view')}>
      <View style={styles.itemHeader}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={24} color={PROFESSIONAL_DESIGN.COLORS.primary} />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name || 'Unknown Pilgrim'}</Text>
          <Text style={styles.itemEmail}>{item.email}</Text>
          {item.phone && (
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={14} color={PROFESSIONAL_DESIGN.COLORS.textSecondary} />
              <Text style={styles.itemPhone}>{item.phone}</Text>
            </View>
          )}
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: item.is_active ? PROFESSIONAL_DESIGN.COLORS.success : PROFESSIONAL_DESIGN.COLORS.error }]} />
          <Text style={[styles.statusText, { color: item.is_active ? PROFESSIONAL_DESIGN.COLORS.success : PROFESSIONAL_DESIGN.COLORS.error }]}>
            {item.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.itemDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={14} color={PROFESSIONAL_DESIGN.COLORS.textSecondary} />
          <Text style={styles.detailText}>
            Joined {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handlePilgrimAction(item, 'view')}
        >
          <Ionicons name="eye-outline" size={16} color={PROFESSIONAL_DESIGN.COLORS.primary} />
          <Text style={styles.actionButtonText}>View Details</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.actionButton,
            item.is_active ? styles.deactivateButton : styles.activateButton,
          ]}
          onPress={() => handlePilgrimAction(item, item.is_active ? 'deactivate' : 'activate')}
        >
          <Ionicons 
            name={item.is_active ? 'pause-outline' : 'play-outline'} 
            size={16} 
            color="white" 
          />
          <Text style={[styles.actionButtonText, { color: 'white' }]}>
            {item.is_active ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderRequestItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.requestIconContainer}>
          <Ionicons name="help-circle" size={24} color={PROFESSIONAL_DESIGN.COLORS.warning} />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.title || 'Assistance Request'}</Text>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={14} color={PROFESSIONAL_DESIGN.COLORS.textSecondary} />
            <Text style={styles.itemPhone}>{item.pilgrim?.name || 'Unknown Pilgrim'}</Text>
          </View>
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
        <View style={[styles.requestStatusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Ionicons 
            name={getStatusIcon(item.status)} 
            size={12} 
            color={getStatusColor(item.status)} 
          />
          <Text style={[styles.requestStatusText, { color: getStatusColor(item.status) }]}>
            {item.status?.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.itemDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={14} color={PROFESSIONAL_DESIGN.COLORS.textSecondary} />
          <Text style={styles.detailText}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        {item.location && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={14} color={PROFESSIONAL_DESIGN.COLORS.textSecondary} />
            <Text style={styles.detailText}>
              {item.location.latitude ? 
                `${item.location.latitude.toFixed(4)}, ${item.location.longitude.toFixed(4)}` : 
                'Location available'
              }
            </Text>
          </View>
        )}
      </View>

      <View style={styles.itemActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="eye-outline" size={16} color={PROFESSIONAL_DESIGN.COLORS.primary} />
          <Text style={styles.actionButtonText}>View Request</Text>
        </TouchableOpacity>
        
        {item.status === 'pending' && (
          <TouchableOpacity style={[styles.actionButton, styles.assignButton]}>
            <Ionicons name="person-add-outline" size={16} color="white" />
            <Text style={[styles.actionButtonText, { color: 'white' }]}>Assign</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pilgrim Management</Text>
        <Text style={styles.headerSubtitle}>Manage pilgrim accounts and assistance requests</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'pilgrims', label: 'Pilgrims', count: pilgrims.length },
          { key: 'requests', label: 'Requests', count: requests.length },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, activeTab === tab.key && styles.activeTabButton]}
            onPress={() => setActiveTab(tab.key as TabType)}
          >
            <Text style={[styles.tabButtonText, activeTab === tab.key && styles.activeTabButtonText]}>
              {tab.label}
            </Text>
            <View style={[styles.tabBadge, activeTab === tab.key && styles.activeTabBadge]}>
              <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.activeTabBadgeText]}>
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
            placeholder={`Search ${activeTab}...`}
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

        {activeTab === 'pilgrims' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
            {renderFilterButton('all', 'All')}
            {renderFilterButton('active', 'Active')}
            {renderFilterButton('inactive', 'Inactive')}
          </ScrollView>
        )}
      </View>

      {/* Content */}
      <FlatList
        data={activeTab === 'pilgrims' ? getFilteredPilgrims() : getFilteredRequests()}
        renderItem={activeTab === 'pilgrims' ? renderPilgrimItem : renderRequestItem}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons 
              name={activeTab === 'pilgrims' ? 'people-outline' : 'help-circle-outline'} 
              size={64} 
              color={PROFESSIONAL_DESIGN.COLORS.textSecondary} 
            />
            <Text style={styles.emptyTitle}>No {activeTab} found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || filter !== 'all'
                ? 'Try adjusting your search or filters'
                : `No ${activeTab} available at the moment`
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
  filterButton: {
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.md,
    paddingVertical: 6,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.sm,
    marginRight: 8,
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
  listContent: {
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.lg,
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.sm,
  },
  itemCard: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.lg,
    padding: PROFESSIONAL_DESIGN.SPACING.lg,
    marginVertical: PROFESSIONAL_DESIGN.SPACING.sm,
    borderWidth: 1,
    borderColor: PROFESSIONAL_DESIGN.COLORS.border,
    ...PROFESSIONAL_DESIGN.SHADOWS.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: PROFESSIONAL_DESIGN.SPACING.sm,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: PROFESSIONAL_DESIGN.SPACING.md,
  },
  requestIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: PROFESSIONAL_DESIGN.SPACING.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.h4,
    fontWeight: 'bold',
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
    marginBottom: 4,
  },
  itemEmail: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.body,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    marginBottom: 4,
  },
  itemPhone: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.caption,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    marginLeft: 4,
  },
  itemDescription: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.body,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  statusText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  requestStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.sm,
  },
  requestStatusText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.caption,
    fontWeight: '600',
    marginLeft: 4,
  },
  itemDetails: {
    marginBottom: PROFESSIONAL_DESIGN.SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    ...PROFESSIONAL_DESIGN.TYPOGRAPHY.caption,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    marginLeft: 6,
  },
  itemActions: {
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
  activateButton: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.success,
    borderColor: PROFESSIONAL_DESIGN.COLORS.success,
  },
  deactivateButton: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.error,
    borderColor: PROFESSIONAL_DESIGN.COLORS.error,
  },
  assignButton: {
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
});

export default PilgrimManagement;
