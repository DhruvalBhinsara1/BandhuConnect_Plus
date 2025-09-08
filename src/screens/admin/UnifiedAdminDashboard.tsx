import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRequest } from '../../context/RequestContext';
import { volunteerService } from '../../services/volunteerService';
import { supabase } from '../../services/supabase';
import { AdminStats } from '../../types';
import { PROFESSIONAL_DESIGN } from '../../design/professionalDesignSystem';
import { UnifiedManagementTab } from '../../components/admin/UnifiedManagementTab';

interface StatCard {
  id: string;
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const UnifiedAdminDashboard: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { requests, assignments, getRequests, getAssignments } = useRequest();
  
  const [refreshing, setRefreshing] = useState(false);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [pilgrims, setPilgrims] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<'overview' | 'management'>('overview');
  const [stats, setStats] = useState<AdminStats>({
    totalVolunteers: 0,
    activeVolunteers: 0,
    availableVolunteers: 0,
    busyVolunteers: 0,
    onDutyVolunteers: 0,
    offlineVolunteers: 0,
    pendingRequests: 0,
    assignedRequests: 0,
    inProgressRequests: 0,
    completedRequests: 0,
    totalRequests: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [requests, assignments, volunteers]);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        getRequests(),
        getAssignments(),
        loadVolunteers(),
        loadPilgrims(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const loadVolunteers = async () => {
    try {
      const { data, error } = await volunteerService.getVolunteers();
      if (error) throw error;
      setVolunteers(data || []);
    } catch (error) {
      console.error('Error loading volunteers:', error);
    }
  };

  const loadPilgrims = async () => {
    try {
      const { data, error } = await supabase
        .from('pilgrims')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPilgrims(data || []);
    } catch (error) {
      console.error('Error loading pilgrims:', error);
    }
  };

  const calculateStats = () => {
    const newStats: AdminStats = {
      totalVolunteers: volunteers.length,
      activeVolunteers: volunteers.filter(v => v.status === 'available' || v.status === 'busy').length,
      availableVolunteers: volunteers.filter(v => v.status === 'available').length,
      busyVolunteers: volunteers.filter(v => v.status === 'busy').length,
      onDutyVolunteers: volunteers.filter(v => v.status === 'on-duty').length,
      offlineVolunteers: volunteers.filter(v => v.status === 'offline').length,
      pendingRequests: requests.filter(r => r.status === 'pending').length,
      assignedRequests: requests.filter(r => r.status === 'assigned').length,
      inProgressRequests: requests.filter(r => r.status === 'in_progress').length,
      completedRequests: requests.filter(r => r.status === 'completed').length,
      totalRequests: requests.length,
    };
    setStats(newStats);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getStatCards = (): StatCard[] => [
    {
      id: 'volunteers',
      title: 'Active Volunteers',
      value: stats.activeVolunteers,
      icon: 'people',
      color: PROFESSIONAL_DESIGN.COLORS.success,
      trend: { value: 12, isPositive: true },
    },
    {
      id: 'requests',
      title: 'Pending Requests',
      value: stats.pendingRequests,
      icon: 'help-circle',
      color: PROFESSIONAL_DESIGN.COLORS.warning,
      trend: { value: 5, isPositive: false },
    },
    {
      id: 'assignments',
      title: 'Active Assignments',
      value: stats.inProgressRequests,
      icon: 'flash',
      color: PROFESSIONAL_DESIGN.COLORS.info,
      trend: { value: 8, isPositive: true },
    },
    {
      id: 'completion',
      title: 'Completion Rate',
      value: `${Math.round((stats.completedRequests / Math.max(stats.totalRequests, 1)) * 100)}%`,
      icon: 'checkmark-circle',
      color: PROFESSIONAL_DESIGN.COLORS.primary,
      trend: { value: 3, isPositive: true },
    },
  ];

  const handleManagementItemPress = (type: string, item: any) => {
    switch (type) {
      case 'volunteer':
        navigation.navigate('VolunteerProfile', { volunteerId: item.id });
        break;
      case 'request':
        navigation.navigate('TaskAssignment', { requestId: item.id });
        break;
      case 'pilgrim':
        navigation.navigate('PilgrimProfile', { pilgrimId: item.id });
        break;
      default:
        Alert.alert('Info', 'Feature coming soon');
    }
  };

  const handleManagementAction = (type: string, action: string, item?: any) => {
    switch (action) {
      case 'add':
        if (type === 'volunteers') {
          navigation.navigate('AddVolunteer');
        } else if (type === 'pilgrims') {
          navigation.navigate('AddPilgrim');
        }
        break;
      case 'auto-assign':
        handleAutoAssign();
        break;
      case 'bulk':
        Alert.alert('Bulk Actions', 'Select multiple items to perform bulk operations');
        break;
      case 'export':
        Alert.alert('Export', `Exporting ${type} data...`);
        break;
      case 'filter':
        Alert.alert('Filter', 'Advanced filtering options');
        break;
      case 'groups':
        navigation.navigate('GroupManagement');
        break;
      default:
        Alert.alert('Info', 'Feature coming soon');
    }
  };

  const handleAutoAssign = async () => {
    try {
      Alert.alert(
        'Auto-Assignment',
        'Starting automatic assignment of pending requests...',
        [{ text: 'OK' }]
      );
      // Auto-assignment logic would go here
    } catch (error) {
      Alert.alert('Error', 'Failed to auto-assign requests');
    }
  };

  const renderViewToggle = () => (
    <View style={styles.viewToggleContainer}>
      <TouchableOpacity
        style={[
          styles.viewToggleButton,
          activeView === 'overview' && styles.activeViewToggleButton,
        ]}
        onPress={() => setActiveView('overview')}
        activeOpacity={0.7}
      >
        <Ionicons
          name="stats-chart"
          size={18}
          color={
            activeView === 'overview'
              ? PROFESSIONAL_DESIGN.COLORS.primary
              : PROFESSIONAL_DESIGN.COLORS.textSecondary
          }
        />
        <Text
          style={[
            styles.viewToggleText,
            activeView === 'overview' && styles.activeViewToggleText,
          ]}
        >
          Overview
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.viewToggleButton,
          activeView === 'management' && styles.activeViewToggleButton,
        ]}
        onPress={() => setActiveView('management')}
        activeOpacity={0.7}
      >
        <Ionicons
          name="settings"
          size={18}
          color={
            activeView === 'management'
              ? PROFESSIONAL_DESIGN.COLORS.primary
              : PROFESSIONAL_DESIGN.COLORS.textSecondary
          }
        />
        <Text
          style={[
            styles.viewToggleText,
            activeView === 'management' && styles.activeViewToggleText,
          ]}
        >
          Management
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStatCard = (card: StatCard) => (
    <TouchableOpacity
      key={card.id}
      style={styles.statCard}
      activeOpacity={0.7}
    >
      <View style={styles.statCardHeader}>
        <View style={[styles.statCardIcon, { backgroundColor: card.color }]}>
          <Ionicons
            name={card.icon}
            size={24}
            color={PROFESSIONAL_DESIGN.COLORS.surface}
          />
        </View>
        {card.trend && (
          <View style={styles.trendContainer}>
            <Ionicons
              name={card.trend.isPositive ? 'trending-up' : 'trending-down'}
              size={16}
              color={
                card.trend.isPositive
                  ? PROFESSIONAL_DESIGN.COLORS.success
                  : PROFESSIONAL_DESIGN.COLORS.error
              }
            />
            <Text
              style={[
                styles.trendText,
                {
                  color: card.trend.isPositive
                    ? PROFESSIONAL_DESIGN.COLORS.success
                    : PROFESSIONAL_DESIGN.COLORS.error,
                },
              ]}
            >
              {card.trend.value}%
            </Text>
          </View>
        )}
      </View>
      
      <Text style={styles.statCardValue}>{card.value}</Text>
      <Text style={styles.statCardTitle}>{card.title}</Text>
    </TouchableOpacity>
  );

  const renderOverviewContent = () => (
    <View style={styles.overviewContainer}>
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {getStatCards().map(renderStatCard)}
      </View>

      {/* Quick Insights */}
      <View style={styles.insightsContainer}>
        <Text style={styles.sectionTitle}>Quick Insights</Text>
        
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Ionicons
              name="time"
              size={20}
              color={PROFESSIONAL_DESIGN.COLORS.info}
            />
            <Text style={styles.insightTitle}>Response Time</Text>
          </View>
          <Text style={styles.insightValue}>2.3 minutes</Text>
          <Text style={styles.insightSubtitle}>Average response time today</Text>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Ionicons
              name="location"
              size={20}
              color={PROFESSIONAL_DESIGN.COLORS.success}
            />
            <Text style={styles.insightTitle}>Coverage</Text>
          </View>
          <Text style={styles.insightValue}>94%</Text>
          <Text style={styles.insightSubtitle}>Area coverage by volunteers</Text>
        </View>
      </View>
    </View>
  );

  const renderManagementContent = () => (
    <UnifiedManagementTab
      volunteerData={volunteers}
      requestData={requests}
      pilgrimData={pilgrims}
      loading={refreshing}
      onItemPress={handleManagementItemPress}
      onActionPress={handleManagementAction}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              Welcome back, {user?.email?.split('@')[0] || 'Admin'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons
              name="person-circle"
              size={32}
              color={PROFESSIONAL_DESIGN.COLORS.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* View Toggle */}
      {renderViewToggle()}

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeView === 'overview' ? renderOverviewContent() : renderManagementContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');
const cardWidth = (width - PROFESSIONAL_DESIGN.SPACING.md * 3) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.background,
  },
  header: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.md,
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: PROFESSIONAL_DESIGN.COLORS.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: PROFESSIONAL_DESIGN.TYPOGRAPHY.h2.fontSize,
    fontWeight: PROFESSIONAL_DESIGN.TYPOGRAPHY.h2.fontWeight,
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: PROFESSIONAL_DESIGN.TYPOGRAPHY.body.fontSize,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    marginTop: PROFESSIONAL_DESIGN.SPACING.xs,
  },
  profileButton: {
    padding: PROFESSIONAL_DESIGN.SPACING.xs,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    margin: PROFESSIONAL_DESIGN.SPACING.md,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.md,
    padding: PROFESSIONAL_DESIGN.SPACING.xs,
    ...PROFESSIONAL_DESIGN.SHADOWS.sm,
  },
  viewToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: PROFESSIONAL_DESIGN.SPACING.sm,
    paddingHorizontal: PROFESSIONAL_DESIGN.SPACING.md,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.sm,
    gap: PROFESSIONAL_DESIGN.SPACING.xs,
  },
  activeViewToggleButton: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.primary,
  },
  viewToggleText: {
    fontSize: PROFESSIONAL_DESIGN.TYPOGRAPHY.button.fontSize,
    fontWeight: PROFESSIONAL_DESIGN.TYPOGRAPHY.button.fontWeight,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
  },
  activeViewToggleText: {
    color: PROFESSIONAL_DESIGN.COLORS.surface,
  },
  content: {
    flex: 1,
  },
  overviewContainer: {
    flex: 1,
    padding: PROFESSIONAL_DESIGN.SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: PROFESSIONAL_DESIGN.SPACING.md,
    marginBottom: PROFESSIONAL_DESIGN.SPACING.lg,
  },
  statCard: {
    width: cardWidth,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.md,
    padding: PROFESSIONAL_DESIGN.SPACING.md,
    ...PROFESSIONAL_DESIGN.SHADOWS.sm,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: PROFESSIONAL_DESIGN.SPACING.sm,
  },
  statCardIcon: {
    width: 40,
    height: 40,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: PROFESSIONAL_DESIGN.SPACING.xs,
  },
  trendText: {
    fontSize: PROFESSIONAL_DESIGN.TYPOGRAPHY.caption.fontSize,
    fontWeight: PROFESSIONAL_DESIGN.TYPOGRAPHY.button.fontWeight,
  },
  statCardValue: {
    fontSize: PROFESSIONAL_DESIGN.TYPOGRAPHY.h2.fontSize,
    fontWeight: PROFESSIONAL_DESIGN.TYPOGRAPHY.h2.fontWeight,
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
    marginBottom: PROFESSIONAL_DESIGN.SPACING.xs,
  },
  statCardTitle: {
    fontSize: PROFESSIONAL_DESIGN.TYPOGRAPHY.caption.fontSize,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: PROFESSIONAL_DESIGN.TYPOGRAPHY.h3.fontSize,
    fontWeight: PROFESSIONAL_DESIGN.TYPOGRAPHY.h3.fontWeight,
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
    marginBottom: PROFESSIONAL_DESIGN.SPACING.md,
  },
  insightsContainer: {
    marginTop: PROFESSIONAL_DESIGN.SPACING.lg,
  },
  insightCard: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    borderRadius: PROFESSIONAL_DESIGN.RADIUS.md,
    padding: PROFESSIONAL_DESIGN.SPACING.md,
    marginBottom: PROFESSIONAL_DESIGN.SPACING.md,
    ...PROFESSIONAL_DESIGN.SHADOWS.sm,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: PROFESSIONAL_DESIGN.SPACING.sm,
    marginBottom: PROFESSIONAL_DESIGN.SPACING.sm,
  },
  insightTitle: {
    fontSize: PROFESSIONAL_DESIGN.TYPOGRAPHY.button.fontSize,
    fontWeight: PROFESSIONAL_DESIGN.TYPOGRAPHY.button.fontWeight,
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
  },
  insightValue: {
    fontSize: PROFESSIONAL_DESIGN.TYPOGRAPHY.h3.fontSize,
    fontWeight: PROFESSIONAL_DESIGN.TYPOGRAPHY.h3.fontWeight,
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
    marginBottom: PROFESSIONAL_DESIGN.SPACING.xs,
  },
  insightSubtitle: {
    fontSize: PROFESSIONAL_DESIGN.TYPOGRAPHY.caption.fontSize,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
  },
});

export default UnifiedAdminDashboard;
