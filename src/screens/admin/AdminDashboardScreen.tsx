import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, RefreshControl } from 'react-native';
import { supabase } from '../../services/supabase';
import VolunteerManagementScreen from './VolunteerManagementScreen';
import PilgrimManagementScreen from './PilgrimManagementScreen';
import RequestManagement from './RequestManagement';
import TaskAssignment from './TaskAssignment';

type TabType = 'overview' | 'volunteers' | 'pilgrims' | 'requests' | 'assignments';

const AdminDashboardScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'volunteers':
        return <VolunteerManagementScreen />;
      case 'pilgrims':
        return <PilgrimManagementScreen />;
      case 'requests':
        return <RequestManagement />;
      case 'assignments':
        return <TaskAssignment />;
      default:
        return <OverviewScreen setActiveTab={setActiveTab} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
      </View>

      <View style={styles.navigation}>
        <TouchableOpacity
          onPress={() => setActiveTab('overview')}
          style={[styles.navButton, activeTab === 'overview' && styles.activeNavButton]}
        >
          <Text style={[styles.navButtonText, activeTab === 'overview' && styles.activeNavButtonText]}>
            📊 Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setActiveTab('volunteers')}
          style={[styles.navButton, activeTab === 'volunteers' && styles.activeNavButton]}
        >
          <Text style={[styles.navButtonText, activeTab === 'volunteers' && styles.activeNavButtonText]}>
            👥 Volunteers
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setActiveTab('pilgrims')}
          style={[styles.navButton, activeTab === 'pilgrims' && styles.activeNavButton]}
        >
          <Text style={[styles.navButtonText, activeTab === 'pilgrims' && styles.activeNavButtonText]}>
            🙏 Pilgrims
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setActiveTab('requests')}
          style={[styles.navButton, activeTab === 'requests' && styles.activeNavButton]}
        >
          <Text style={[styles.navButtonText, activeTab === 'requests' && styles.activeNavButtonText]}>
            📋 Requests
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setActiveTab('assignments')}
          style={[styles.navButton, activeTab === 'assignments' && styles.activeNavButton]}
        >
          <Text style={[styles.navButtonText, activeTab === 'assignments' && styles.activeNavButtonText]}>
            📝 Assignments
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

// Overview Screen Component
const OverviewScreen: React.FC<{ setActiveTab: (tab: TabType) => void }> = ({ setActiveTab }) => {
  const [stats, setStats] = useState({
    totalVolunteers: 0,
    activeVolunteers: 0,
    onDutyVolunteers: 0,
    totalPilgrims: 0,
    activePilgrims: 0,
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    totalAssignments: 0,
    activeAssignments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch volunteer stats
      const { data: volunteers, error: volunteerError } = await supabase
        .from('profiles')
        .select('volunteer_status, is_active')
        .eq('role', 'volunteer');

      if (volunteerError) throw volunteerError;

      // Fetch pilgrim stats
      const { data: pilgrims, error: pilgrimError } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('role', 'pilgrim');

      if (pilgrimError) throw pilgrimError;

      // Fetch request stats
      const { data: requests, error: requestError } = await supabase
        .from('assistance_requests')
        .select('status');

      if (requestError) throw requestError;

      // Fetch assignment stats
      const { data: assignments, error: assignmentError } = await supabase
        .from('assignments')
        .select('status');

      if (assignmentError) throw assignmentError;

      // Calculate stats
      const volunteerStats = {
        totalVolunteers: volunteers?.length || 0,
        activeVolunteers: volunteers?.filter(v => v.volunteer_status === 'active').length || 0,
        onDutyVolunteers: volunteers?.filter(v => v.is_active === true).length || 0,
      };

      const pilgrimStats = {
        totalPilgrims: pilgrims?.length || 0,
        activePilgrims: pilgrims?.filter(p => p.is_active).length || 0,
      };

      const requestStats = {
        totalRequests: requests?.length || 0,
        pendingRequests: requests?.filter(r => r.status === 'pending').length || 0,
        completedRequests: requests?.filter(r => r.status === 'completed').length || 0,
      };

      const assignmentStats = {
        totalAssignments: assignments?.length || 0,
        activeAssignments: assignments?.filter(a => ['assigned', 'accepted', 'in_progress'].includes(a.status)).length || 0,
      };

      setStats({
        ...volunteerStats,
        ...pilgrimStats,
        ...requestStats,
        ...assignmentStats,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.overviewContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.overviewTitle}>Dashboard Overview</Text>
        <Text style={styles.overviewSubtitle}>Real-time platform statistics</Text>
      </View>
      
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {/* Summary Cards Row */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#3b82f6' }]}>
            <Text style={styles.summaryNumber}>{stats.totalVolunteers}</Text>
            <Text style={styles.summaryLabel}>Volunteers</Text>
            <Text style={styles.summarySubtext}>{stats.activeVolunteers} active</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#f59e0b' }]}>
            <Text style={styles.summaryNumber}>{stats.totalPilgrims}</Text>
            <Text style={styles.summaryLabel}>Pilgrims</Text>
            <Text style={styles.summarySubtext}>{stats.activePilgrims} active</Text>
          </View>
        </View>

        {/* Activity Cards Row */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#8b5cf6' }]}>
            <Text style={styles.summaryNumber}>{stats.totalRequests}</Text>
            <Text style={styles.summaryLabel}>Requests</Text>
            <Text style={styles.summarySubtext}>{stats.pendingRequests} pending</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#10b981' }]}>
            <Text style={styles.summaryNumber}>{stats.totalAssignments}</Text>
            <Text style={styles.summaryLabel}>Assignments</Text>
            <Text style={styles.summarySubtext}>{stats.activeAssignments} active</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setActiveTab('volunteers')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#3b82f6' }]}>
              <Text style={styles.actionEmoji}>👥</Text>
            </View>
            <Text style={styles.actionLabel}>Volunteers</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setActiveTab('pilgrims')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#f59e0b' }]}>
              <Text style={styles.actionEmoji}>🙏</Text>
            </View>
            <Text style={styles.actionLabel}>Pilgrims</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setActiveTab('requests')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#8b5cf6' }]}>
              <Text style={styles.actionEmoji}>📋</Text>
            </View>
            <Text style={styles.actionLabel}>Requests</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setActiveTab('assignments')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#10b981' }]}>
              <Text style={styles.actionEmoji}>📝</Text>
            </View>
            <Text style={styles.actionLabel}>Assignments</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  navigation: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  activeNavButton: {
    backgroundColor: '#3b82f6',
  },
  navButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  activeNavButtonText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  overviewContainer: {
    flex: 1,
    padding: 20,
  },
  overviewTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  overviewSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  quickActionCard: {
    width: '47%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  quickActionDesc: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  statsCategory: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  // New styles for redesigned layout
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  statsGrid: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  summarySubtext: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.8,
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionEmoji: {
    fontSize: 20,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
});

export default AdminDashboardScreen;
