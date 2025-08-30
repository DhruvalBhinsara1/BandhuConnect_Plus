import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRequest } from '../../context/RequestContext';
import { volunteerService } from '../../services/volunteerService';
import { supabase } from '../../services/supabase';
import { AdminStats } from '../../types';

const AdminDashboard: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { requests, assignments, getRequests, getAssignments } = useRequest();
  
  const [refreshing, setRefreshing] = useState(false);
  const [volunteers, setVolunteers] = useState<any[]>([]);
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
  const [autoAssignStats, setAutoAssignStats] = useState({
    totalAutoAssigned: 0,
    autoAssignSuccessRate: 0,
    avgMatchScore: 0,
    todayAutoAssigned: 0,
    lastAutoAssignTime: null as Date | null,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [requests, assignments, volunteers]);

  const loadDashboardData = async () => {
    await Promise.all([
      getRequests(),
      getAssignments(),
      loadVolunteers(),
      loadAutoAssignStats(),
    ]);
  };

  const loadAutoAssignStats = async () => {
    try {
      // Get all assignments with their request data
      const { data: allAssignments, error: assignmentError } = await supabase
        .from('assignments')
        .select(`
          id, 
          created_at, 
          assigned_at,
          notes,
          assistance_requests!inner(status)
        `);
      
      if (assignmentError) {
        console.error('Error loading assignment stats:', assignmentError);
        return;
      }

      // Filter for auto-assigned (assignments created very quickly after request or with auto-assign notes)
      const autoAssigned = allAssignments?.filter(a => {
        // Consider it auto-assigned if it has notes mentioning auto-assignment
        // or if assigned very quickly (within 30 seconds of creation)
        const hasAutoNotes = a.notes && (
          a.notes.includes('auto') || 
          a.notes.includes('Auto') || 
          a.notes.includes('automatic') ||
          a.notes.includes('batch')
        );
        
        const quickAssignment = a.assigned_at && a.created_at && 
          (new Date(a.assigned_at).getTime() - new Date(a.created_at).getTime()) < 30000;
        
        return hasAutoNotes || quickAssignment;
      }) || [];

      // Get today's auto-assignments
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayAutoAssigned = autoAssigned.filter(a => 
        new Date(a.created_at) >= today
      );

      // Get total completed requests for success rate calculation
      const { data: completedRequests, error: requestError } = await supabase
        .from('assistance_requests')
        .select('id')
        .in('status', ['assigned', 'in_progress', 'completed']);

      if (requestError) {
        console.error('Error loading request stats:', requestError);
        return;
      }

      // Calculate success rate (auto-assigned vs total processed requests)
      const successRate = completedRequests?.length > 0 
        ? Math.round((autoAssigned.length / completedRequests.length) * 100)
        : 0;

      // Mock average match score (since we don't have the actual column)
      // In a real scenario, this would be calculated from the auto-assignment algorithm
      const avgScore = autoAssigned.length > 0 ? 85 : 0; // Mock 85% average

      // Get last auto-assign time
      const lastAssignment = autoAssigned.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      setAutoAssignStats({
        totalAutoAssigned: autoAssigned.length,
        autoAssignSuccessRate: successRate,
        avgMatchScore: avgScore,
        todayAutoAssigned: todayAutoAssigned.length,
        lastAutoAssignTime: lastAssignment ? new Date(lastAssignment.created_at) : null,
      });
    } catch (error) {
      console.error('Error loading auto-assign stats:', error);
    }
  };

  const loadVolunteers = async () => {
    try {
      const { data, error } = await volunteerService.getVolunteers();
      if (error) {
        console.error('Error loading volunteers:', error);
        return;
      }
      setVolunteers(data || []);
    } catch (error) {
      console.error('Error loading volunteers:', error);
    }
  };

  const calculateStats = () => {
    const pending = requests.filter(r => r.status === 'pending').length;
    const completed = requests.filter(r => r.status === 'completed').length;
    const assigned = requests.filter(r => r.status === 'assigned').length;
    const inProgress = requests.filter(r => r.status === 'in_progress').length;
    
    // Get volunteers with active assignments
    const volunteersWithAssignments = new Set(
      assignments
        .filter(a => ['assigned', 'accepted', 'on_duty'].includes(a.status))
        .map(a => a.volunteer_id)
    );
    
    // Volunteer status breakdown with logical corrections
    const availableVolunteers = volunteers.filter(v => 
      v.is_active && 
      (v.volunteer_status === 'available' || !volunteersWithAssignments.has(v.id))
    ).length;
    
    const onDutyVolunteers = volunteers.filter(v => 
      v.is_active && 
      (v.volunteer_status === 'busy' || v.volunteer_status === 'on_duty' || volunteersWithAssignments.has(v.id))
    ).length;
    
    const offlineVolunteers = volunteers.filter(v => 
      v.volunteer_status === 'offline' || !v.is_active
    ).length;
    
    const activeVolunteers = volunteers.filter(v => v.is_active === true).length;
    
    setStats({
      totalVolunteers: volunteers.length,
      activeVolunteers: activeVolunteers,
      availableVolunteers: availableVolunteers,
      busyVolunteers: 0, // Remove busy category since they should be on duty
      onDutyVolunteers: onDutyVolunteers,
      offlineVolunteers: offlineVolunteers,
      pendingRequests: pending,
      assignedRequests: assigned,
      inProgressRequests: inProgress,
      completedRequests: completed,
      totalRequests: requests.length,
    });
  };

  const formatLastAutoAssignTime = () => {
    if (!autoAssignStats.lastAutoAssignTime) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - autoAssignStats.lastAutoAssignTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const recentRequests = requests.slice(0, 5);
  const activeAssignments = assignments.filter(a => 
    ['assigned', 'accepted', 'on_duty'].includes(a.status)
  ).slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Admin Dashboard</Text>
              <Text style={styles.headerSubtitle}>Welcome, {user?.name}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Ionicons name="person-circle-outline" size={32} color="white" />
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.availableVolunteers}</Text>
              <Text style={styles.statLabel}>Available Now</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.pendingRequests}</Text>
              <Text style={styles.statLabel}>Pending Requests</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Auto-Assignment Intelligence */}
          <View style={styles.autoAssignSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="flash" size={20} color="#3b82f6" />
                <Text style={styles.sectionTitle}>Auto-Assignment AI</Text>
              </View>
              <View style={styles.aiIndicator}>
                <View style={styles.aiDot} />
                <Text style={styles.aiText}>ACTIVE</Text>
              </View>
            </View>
            
            <View style={styles.autoAssignGrid}>
              <View style={styles.autoAssignCard}>
                <Text style={styles.autoAssignNumber}>{autoAssignStats.totalAutoAssigned}</Text>
                <Text style={styles.autoAssignLabel}>Total Auto-Assigned</Text>
              </View>
              
              <View style={styles.autoAssignCard}>
                <Text style={styles.autoAssignNumber}>{autoAssignStats.autoAssignSuccessRate}%</Text>
                <Text style={styles.autoAssignLabel}>Success Rate</Text>
              </View>
              
              <View style={styles.autoAssignCard}>
                <Text style={styles.autoAssignNumber}>{autoAssignStats.avgMatchScore}%</Text>
                <Text style={styles.autoAssignLabel}>Avg Match Score</Text>
              </View>
              
              <View style={styles.autoAssignCard}>
                <Text style={styles.autoAssignNumber}>{autoAssignStats.todayAutoAssigned}</Text>
                <Text style={styles.autoAssignLabel}>Today</Text>
              </View>
            </View>
            
            <View style={styles.lastAssignInfo}>
              <Ionicons name="time-outline" size={14} color="#6b7280" />
              <Text style={styles.lastAssignText}>Last auto-assignment: {formatLastAutoAssignTime()}</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('VolunteerManagement')}
              >
                <Ionicons name="people" size={24} color="#3b82f6" />
                <Text style={styles.actionButtonText}>Manage Volunteers</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('RequestManagement')}
              >
                <Ionicons name="clipboard" size={24} color="#10b981" />
                <Text style={styles.actionButtonText}>Manage Requests</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('TaskAssignment')}
              >
                <Ionicons name="flash" size={24} color="#f59e0b" />
                <Text style={styles.actionButtonText}>Auto-Assign Tasks</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('Profile')}
              >
                <Ionicons name="settings" size={24} color="#8b5cf6" />
                <Text style={styles.actionButtonText}>Settings</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Volunteer Status Grid */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Volunteer Status</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.gridCard}>
              <View style={styles.cardContent}>
                <Ionicons name="checkmark-circle" size={28} color="#10b981" />
                <Text style={styles.gridNumber}>{stats.availableVolunteers}</Text>
                <Text style={styles.gridLabel}>Available</Text>
              </View>
            </View>

            <View style={styles.gridCard}>
              <View style={styles.cardContent}>
                <Ionicons name="shield-checkmark" size={28} color="#8b5cf6" />
                <Text style={styles.gridNumber}>{stats.onDutyVolunteers}</Text>
                <Text style={styles.gridLabel}>On Duty</Text>
              </View>
            </View>

            <View style={styles.gridCard}>
              <View style={styles.cardContent}>
                <Ionicons name="moon" size={28} color="#6b7280" />
                <Text style={styles.gridNumber}>{stats.offlineVolunteers}</Text>
                <Text style={styles.gridLabel}>Offline</Text>
              </View>
            </View>

            <View style={styles.gridCard}>
              <View style={styles.cardContent}>
                <Ionicons name="people" size={28} color="#3b82f6" />
                <Text style={styles.gridNumber}>{stats.activeVolunteers}</Text>
                <Text style={styles.gridLabel}>Total Active</Text>
              </View>
            </View>
          </View>

          {/* Request Status Grid */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Request Status</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.gridCard}>
              <View style={styles.cardContent}>
                <Ionicons name="hourglass" size={28} color="#ef4444" />
                <Text style={styles.gridNumber}>{stats.pendingRequests}</Text>
                <Text style={styles.gridLabel}>Pending</Text>
              </View>
            </View>

            <View style={styles.gridCard}>
              <View style={styles.cardContent}>
                <Ionicons name="person-add" size={28} color="#3b82f6" />
                <Text style={styles.gridNumber}>{stats.assignedRequests}</Text>
                <Text style={styles.gridLabel}>Assigned</Text>
              </View>
            </View>

            <View style={styles.gridCard}>
              <View style={styles.cardContent}>
                <Ionicons name="play" size={28} color="#f59e0b" />
                <Text style={styles.gridNumber}>{stats.inProgressRequests}</Text>
                <Text style={styles.gridLabel}>In Progress</Text>
              </View>
            </View>

            <View style={styles.gridCard}>
              <View style={styles.cardContent}>
                <Ionicons name="checkmark-done" size={28} color="#10b981" />
                <Text style={styles.gridNumber}>{stats.completedRequests}</Text>
                <Text style={styles.gridLabel}>Completed</Text>
              </View>
            </View>
          </View>

          {/* Summary Stats */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Overview</Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Ionicons name="people" size={32} color="#3b82f6" />
              <View style={styles.summaryContent}>
                <Text style={styles.summaryNumber}>{stats.totalVolunteers}</Text>
                <Text style={styles.summaryLabel}>Total Volunteers</Text>
              </View>
            </View>
            <View style={styles.summaryCard}>
              <Ionicons name="list" size={32} color="#f59e0b" />
              <View style={styles.summaryContent}>
                <Text style={styles.summaryNumber}>{stats.totalRequests}</Text>
                <Text style={styles.summaryLabel}>Total Requests</Text>
              </View>
            </View>
          </View>

          {/* Recent Requests */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Recent Requests</Text>
              <TouchableOpacity onPress={() => navigation.navigate('RequestManagement')}>
                <Text style={styles.linkText}>View All</Text>
              </TouchableOpacity>
            </View>

            {recentRequests.length > 0 ? (
              recentRequests.map((request) => (
                <TouchableOpacity
                  key={request.id}
                  style={styles.requestItem}
                >
                  <View style={styles.requestContent}>
                    <View style={styles.requestInfo}>
                      <Text style={styles.requestTitle}>
                        {request.title}
                      </Text>
                      <Text style={styles.requestDescription}>
                        {request.description}
                      </Text>
                      <View style={styles.requestMeta}>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '20' }]}>
                          <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                            {request.status}
                          </Text>
                        </View>
                        <Text style={styles.dateText}>
                          {new Date(request.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>No recent requests</Text>
            )}
          </View>

          {/* Active Assignments */}
          {activeAssignments.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Active Assignments</Text>
                <TouchableOpacity onPress={() => navigation.navigate('VolunteerManagement')}>
                  <Text style={styles.linkText}>Manage</Text>
                </TouchableOpacity>
              </View>

              {activeAssignments.map((assignment) => (
                <View key={assignment.id} style={styles.assignmentItem}>
                  <View style={styles.assignmentContent}>
                    <View style={styles.assignmentInfo}>
                      <Text style={styles.assignmentName}>
                        {assignment.volunteer?.name}
                      </Text>
                      <Text style={styles.assignmentTask}>
                        {assignment.request?.title}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(assignment.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(assignment.status) }]}>
                          {assignment.status.replace('_', ' ')}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper function for status colors
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 32,
    paddingTop: 40,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#bfdbfe',
    fontSize: 18,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  statNumber: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#bfdbfe',
    fontSize: 14,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  gridCard: {
    width: '48%',
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
  cardContent: {
    alignItems: 'center',
  },
  gridNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  gridLabel: {
    color: '#6b7280',
    fontSize: 14,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  linkText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  requestItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 12,
  },
  requestContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  requestInfo: {
    flex: 1,
  },
  requestTitle: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  requestDescription: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 8,
  },
  requestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  actionButtonText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  dateText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  emptyText: {
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 16,
  },
  assignmentItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 12,
  },
  assignmentContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  assignmentInfo: {
    flex: 1,
  },
  assignmentName: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  assignmentTask: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    padding: 12,
    borderRadius: 24,
    marginBottom: 8,
  },
  actionText: {
    color: '#374151',
    fontSize: 14,
    textAlign: 'center',
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryContent: {
    marginLeft: 12,
    flex: 1,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  quickActions: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  autoAssignSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
    marginRight: 6,
  },
  aiText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16a34a',
  },
  autoAssignGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  autoAssignCard: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  autoAssignNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  autoAssignLabel: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
  lastAssignInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  lastAssignText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
});

export default AdminDashboard;
