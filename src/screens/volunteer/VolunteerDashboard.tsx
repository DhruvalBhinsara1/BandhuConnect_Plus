import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRequest } from '../../context/RequestContext';
import { useLocation } from '../../context/LocationContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LocationMinimap from '../../components/LocationMinimap';
import { assignmentService } from '../../services/assignmentService';
import { volunteerService } from '../../services/volunteerService';
import { COLORS, STATUS_COLORS } from '../../constants';
import { VolunteerStats } from '../../types';

const VolunteerDashboard: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { assignments, getAssignments } = useRequest();
  const { currentLocation, startTracking, stopTracking, isTracking } = useLocation();
  
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<VolunteerStats>({
    totalTasks: 0,
    completedTasks: 0,
    activeAssignments: 0,
    hoursWorked: 0,
  });
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [hasActiveAssignment, setHasActiveAssignment] = useState(false);
  const [realtimeHours, setRealtimeHours] = useState(0);

  // Helper function to format hours display intelligently
  const formatHoursDisplay = (hours: number): string => {
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes}m`;
    }
    return `${hours.toFixed(2)}h`;
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  useEffect(() => {
    console.log('📋 Assignments changed:', assignments.length, assignments.map(a => ({ id: a.id, status: a.status, assigned: a.assigned })));
    
    // Always calculate stats, even if assignments is empty
    calculateStats();
    
    // Check if volunteer has active assignments
    const hasActive = assignments.some(a => 
      ['pending', 'accepted', 'in_progress'].includes(a.status)
    );
    setHasActiveAssignment(hasActive);
    console.log('🔄 Has active assignment:', hasActive);
  }, [assignments, user]);

  // Real-time hours tracking for active in_progress tasks
  useEffect(() => {
    const activeInProgressTasks = assignments.filter(a => a.status === 'in_progress' && a.started_at);
    
    if (activeInProgressTasks.length === 0) {
      setRealtimeHours(0);
      return;
    }

    const updateRealtimeHours = () => {
      const currentTime = new Date().getTime();
      const totalActiveHours = activeInProgressTasks.reduce((total, task) => {
        if (task.started_at) {
          const startTime = new Date(task.started_at).getTime();
          const hoursOnDuty = (currentTime - startTime) / (1000 * 60 * 60);
          return total + Math.max(0, hoursOnDuty);
        }
        return total;
      }, 0);
      setRealtimeHours(Math.round(totalActiveHours * 100) / 100);
    };

    // Update immediately
    updateRealtimeHours();

    // Update every 30 seconds for real-time tracking
    const interval = setInterval(updateRealtimeHours, 30000);

    return () => clearInterval(interval);
  }, [assignments]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    console.log('🔄 Loading dashboard data...');
    // Load assignments and volunteer stats from database
    await getAssignments({ volunteerId: user.id });
    console.log('📋 Assignments loaded, will trigger stats calculation via useEffect');
  };

  const calculateStats = async () => {
    if (!user) return;
    
    // Import centralized assignment detection
    const { ACTIVE_ASSIGNMENT_STATUSES } = await import('../../services/assignmentService');
    
    // First try to get stats from volunteer service (pre-calculated)
    const { data: volunteerStats, error } = await volunteerService.getVolunteerStats(user.id);
    if (volunteerStats && !error) {
      console.log('✅ Using pre-calculated stats from service:', volunteerStats);
      setStats({
        totalTasks: volunteerStats.totalTasks,
        completedTasks: volunteerStats.completedTasks,
        activeAssignments: volunteerStats.activeAssignments,
        hoursWorked: volunteerStats.hoursWorked,
      });
      return;
    }
    
    console.log('⚠️ Service stats failed, falling back to local calculation:', error);
    
    // Fallback: Calculate from local assignments data
    const completed = assignments.filter(a => a.status === 'completed');
    const active = assignments.filter(a => ACTIVE_ASSIGNMENT_STATUSES.includes(a.status as any)).length;
    
    // Calculate actual hours worked based on start and end times
    let totalHoursWorked = 0;
    completed.forEach(assignment => {
      // Try started_at first (if available), then fall back to assigned_at/accepted_at
      const startTime = assignment.started_at || assignment.accepted_at || assignment.assigned_at;
      
      if (startTime && assignment.completed_at) {
        const start = new Date(startTime);
        const end = new Date(assignment.completed_at);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        // Only add positive hours (prevent negative values from invalid timestamps)
        if (hours > 0 && hours < 24) { // Reasonable upper limit to prevent data errors
          totalHoursWorked += hours;
        }
      }
    });
    
    console.log('📊 Dashboard stats calculation (fallback):', {
      totalAssignments: assignments.length,
      completedCount: completed.length,
      active,
      totalHoursWorked,
      sampleAssignment: completed[0] ? {
        id: completed[0].id,
        status: completed[0].status,
        started_at: completed[0].started_at,
        accepted_at: completed[0].accepted_at,
        assigned_at: completed[0].assigned_at,
        completed_at: completed[0].completed_at
      } : null,
      assignmentStatuses: assignments.map(a => ({ 
        id: a.id, 
        status: a.status,
        assigned: a.assigned,
        started_at: a.started_at,
        completed_at: a.completed_at
      }))
    });
    
    setStats({
      totalTasks: assignments.length,
      completedTasks: completed.length,
      activeAssignments: active,
      hoursWorked: totalHoursWorked,
    });
    
    console.log('✅ Dashboard stats set to (fallback):', {
      totalTasks: assignments.length,
      completedTasks: completed.length,
      activeAssignments: active,
      hoursWorked: totalHoursWorked,
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    console.log('🔄 Manual refresh triggered');
    await loadDashboardData();
    setRefreshing(false);
  };

  const toggleDutyStatus = async () => {
    if (isTracking) {
      stopTracking();
    } else {
      await startTracking();
    }
  };

  const activeAssignments = assignments.filter(a => 
    ['pending', 'accepted', 'in_progress'].includes(a.status)
  );

  const recentAssignments = assignments.slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.nameText}>{user?.name}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Ionicons name="person-circle-outline" size={32} color="white" />
            </TouchableOpacity>
          </View>

          {/* Duty Status Toggle */}
          <Card style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
            <View style={styles.dutyStatusRow}>
              <View>
                <Text style={styles.dutyStatusTitle}>
                  {hasActiveAssignment ? 'On Duty' : isTracking ? 'Checked In' : 'Checked Out'}
                </Text>
                <Text style={styles.dutyStatusSubtitle}>
                  {hasActiveAssignment
                    ? 'Assignment active'
                    : isTracking
                      ? 'Available for assignments'
                      : 'Check in to receive assignments'
                  }
                </Text>
              </View>
              <Button
                title={isTracking ? 'Check Out' : 'Check In'}
                onPress={toggleDutyStatus}
                variant={isTracking ? 'danger' : 'secondary'}
                size="small"
              />
            </View>
          </Card>
        </View>

        <View style={styles.content}>
          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <Card style={styles.statCard}>
              <View style={styles.statCardContent}>
                <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
                <Text style={styles.statNumber}>
                  {stats.completedTasks}
                </Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statCardContent}>
                <Ionicons name="time" size={32} color={COLORS.warning} />
                <Text style={styles.statNumber}>
                  {stats.activeAssignments}
                </Text>
                <Text style={styles.statLabel}>Active Tasks</Text>
              </View>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statCardContent}>
                <Ionicons name="list" size={32} color={COLORS.primary} />
                <Text style={styles.statNumber}>
                  {stats.totalTasks}
                </Text>
                <Text style={styles.statLabel}>Total Tasks</Text>
              </View>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statCardContent}>
                <Ionicons name="timer" size={32} color={COLORS.secondary} />
                <Text style={styles.statNumber}>
                  {formatHoursDisplay(stats.hoursWorked + realtimeHours)}
                </Text>
                <Text style={styles.statLabel}>Hours Worked</Text>
              </View>
            </Card>
          </View>

          {/* Active Assignments */}
          {activeAssignments.length > 0 && (
            <Card style={styles.activeTasksCard}>
              <View style={styles.activeTasksHeader}>
                <Text style={styles.activeTasksTitle}>Active Tasks</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              {activeAssignments.slice(0, 2).map((assignment, index) => (
                <TouchableOpacity
                  key={assignment.id}
                  onPress={() => navigation.navigate('TaskDetails', { assignmentId: assignment.id })}
                  style={[styles.assignmentItem, index < activeAssignments.slice(0, 2).length - 1 && styles.assignmentItemBorder]}
                >
                  <View style={styles.assignmentRow}>
                    <View style={styles.assignmentContent}>
                      <Text style={styles.assignmentTitle}>
                        {assignment.request?.title}
                      </Text>
                      <Text style={styles.assignmentDescription}>
                        {assignment.request?.description}
                      </Text>
                      <View style={styles.assignmentMeta}>
                        <View
                          style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[assignment.status] + '20' }]}
                        >
                          <Text
                            style={[styles.statusText, { color: STATUS_COLORS[assignment.status] }]}
                          >
                            {assignment.status.replace('_', ' ')}
                          </Text>
                        </View>
                        <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.locationText}>
                          {assignment.request?.location ? '0.5 km away' : 'Location pending'}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                  </View>
                </TouchableOpacity>
              ))}
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            
            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Tasks')}
                style={styles.quickActionItem}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#dbeafe' }]}>
                  <Ionicons name="list" size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.quickActionText}>View Tasks</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('Map')}
                style={styles.quickActionItem}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#dcfce7' }]}>
                  <Ionicons name="map" size={24} color={COLORS.secondary} />
                </View>
                <Text style={styles.quickActionText}>Map View</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  // TODO: Implement chat functionality
                  Alert.alert('Coming Soon', 'Chat feature will be available in a future update.');
                }}
                style={styles.quickActionItem}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#f3e8ff' }]}>
                  <Ionicons name="chatbubbles" size={24} color="#8b5cf6" />
                </View>
                <Text style={styles.quickActionText}>Chat</Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Location Minimap */}
          <LocationMinimap />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
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
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  nameText: {
    color: '#dbeafe',
    fontSize: 18,
  },
  dutyStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dutyStatusTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  dutyStatusSubtitle: {
    color: '#dbeafe',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    marginBottom: 16,
  },
  statCardContent: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    color: '#6b7280',
  },
  activeTasksCard: {
    marginBottom: 24,
  },
  activeTasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activeTasksTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  viewAllText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  assignmentItem: {
    paddingVertical: 12,
  },
  assignmentItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  assignmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  assignmentContent: {
    flex: 1,
  },
  assignmentTitle: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  assignmentDescription: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 8,
  },
  assignmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  locationText: {
    color: '#6b7280',
    fontSize: 12,
    marginLeft: 4,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    padding: 12,
    borderRadius: 24,
    marginBottom: 8,
  },
  quickActionText: {
    color: '#374151',
    fontSize: 14,
    textAlign: 'center',
  },
  locationCard: {
    marginTop: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTimestamp: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 4,
  },
});

export default VolunteerDashboard;
