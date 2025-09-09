import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, RefreshControl, Alert } from 'react-native';
import PROFESSIONAL_DESIGN from '../../design/professionalDesignSystem';
import { largeScaleEventAutoAssignmentService } from '../../services/largeScaleEventAutoAssignmentService';
import { StyleSheet } from 'react-native';

// Fallback inline types if not found
type EventStats = {
  totalVolunteers: number;
  availableVolunteers: number;
  busyVolunteers: number;
  offlineVolunteers: number;
  coveragePercentage: number;
  capacityStatus: string;
  recommendations: {
    expandSearchRadius: boolean;
    activateOfflineVolunteers: boolean;
    increaseAssignmentLimits: boolean;
    emergencyRecruitment: boolean;
  };
};
type EventConfiguration = {
  eventName: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  isActive: boolean;
  emergencyMode: boolean;
  maxAssignmentsPerVolunteer: number;
  minMatchThreshold: number;
};
type LargeScaleEventManagerProps = { isVisible: boolean; onClose: () => void };

const LargeScaleEventManager: React.FC<LargeScaleEventManagerProps> = ({ isVisible, onClose }) => {
  const [eventStats, setEventStats] = useState<EventStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [eventConfig, setEventConfig] = useState<EventConfiguration>({
    eventName: 'Mahakumbh 2025',
    centerLat: 25.4358,
    centerLng: 81.8463,
    radiusKm: 50,
    isActive: false,
    emergencyMode: false,
    maxAssignmentsPerVolunteer: 5,
    minMatchThreshold: 0.10,
  });

  useEffect(() => {
    if (isVisible) {
      loadEventData();
      const interval = setInterval(loadEventData, 30000);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const loadEventData = async () => {
    try {
      const stats = await largeScaleEventAutoAssignmentService.getEventVolunteerStats({
        eventAreaLat: eventConfig.centerLat,
        eventAreaLng: eventConfig.centerLng,
        radiusKm: eventConfig.radiusKm,
      });
      setEventStats(stats);
      const metrics = await largeScaleEventAutoAssignmentService.getPerformanceMetrics();
      setPerformanceMetrics(metrics);
    } catch (error) {
      console.error('Error loading event data:', error);
      const fallbackStats: EventStats = {
        totalVolunteers: 0,
        availableVolunteers: 0,
        busyVolunteers: 0,
        offlineVolunteers: 0,
        coveragePercentage: 0,
        capacityStatus: 'CRITICAL',
        recommendations: {
          expandSearchRadius: true,
          activateOfflineVolunteers: true,
          increaseAssignmentLimits: true,
          emergencyRecruitment: true,
        },
      };
      setEventStats(fallbackStats);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEventData();
    setRefreshing(false);
  };

  const activateEmergencyVolunteers = async () => {
    Alert.alert(
      'Emergency Volunteer Activation',
      `This will activate all offline volunteers within ${eventConfig.radiusKm}km and notify them of the emergency. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await largeScaleEventAutoAssignmentService.activateEmergencyVolunteers({
                eventAreaLat: eventConfig.centerLat,
                eventAreaLng: eventConfig.centerLng,
                radiusKm: eventConfig.radiusKm,
                activationMessage: `Emergency volunteer activation for ${eventConfig.eventName}. Immediate assistance needed.`,
              });
              Alert.alert(
                'Emergency Activation Complete',
                `Activated: ${result.activatedVolunteers} volunteers\nNotified: ${result.notifiedVolunteers} volunteers\nExpanded capacity: ${result.expandedCapacity} volunteers`,
                [{ text: 'OK', onPress: loadEventData }]
              );
            } catch (error) {
              console.error('Emergency activation failed:', error);
              Alert.alert('Error', 'Emergency activation failed');
            }
          },
        },
      ]
    );
  };

  const performBulkAutoAssignment = async () => {
    try {
      Alert.alert(
        'Bulk Auto-Assignment',
        'This will attempt to assign all pending high-priority requests using enhanced algorithms. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start Assignment',
            onPress: async () => {
              const result = await largeScaleEventAutoAssignmentService.batchAutoAssignEnhanced({
                maxAssignments: 100,
                priorityFilter: 'high',
                eventMode: true,
              });
              Alert.alert(
                'Bulk Assignment Complete',
                `Processed: ${result.processed} requests\nSuccessful: ${result.successful}\nFailed: ${result.failed}\nSuccess Rate: ${result.processed > 0 ? ((result.successful / result.processed) * 100).toFixed(1) : 0}%`,
                [{ text: 'OK', onPress: loadEventData }]
              );
            },
          },
        ]
      );
    } catch (error) {
      console.error('Bulk assignment failed:', error);
      Alert.alert('Error', 'Bulk assignment failed');
    }
  };

  const adjustThresholds = async () => {
    try {
      await largeScaleEventAutoAssignmentService.adjustThresholdsBasedOnAvailability(
        eventConfig.centerLat,
        eventConfig.centerLng
      );
      await loadEventData();
      Alert.alert('Success', 'Assignment thresholds adjusted based on current volunteer availability');
    } catch (error) {
      console.error('Threshold adjustment failed:', error);
      Alert.alert('Error', 'Failed to adjust thresholds');
    }
  };

  const getCapacityStatusColor = (status: string) => {
    switch (status) {
      case 'GOOD': return PROFESSIONAL_DESIGN.COLORS.success;
      case 'MODERATE': return PROFESSIONAL_DESIGN.COLORS.warning;
      case 'LOW': return PROFESSIONAL_DESIGN.COLORS.error;
      case 'CRITICAL': return '#FF0000';
      default: return PROFESSIONAL_DESIGN.COLORS.textSecondary;
    }
  };

  const renderVolunteerStats = () => {
    if (!eventStats) return null;
    return (
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Volunteer Distribution</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{eventStats.totalVolunteers}</Text>
            <Text style={styles.statLabel}>Total Volunteers</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: PROFESSIONAL_DESIGN.COLORS.success }]}>
              {eventStats.availableVolunteers}
            </Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: PROFESSIONAL_DESIGN.COLORS.warning }]}>
              {eventStats.busyVolunteers}
            </Text>
            <Text style={styles.statLabel}>Busy</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: PROFESSIONAL_DESIGN.COLORS.textSecondary }]}>
              {eventStats.offlineVolunteers}
            </Text>
            <Text style={styles.statLabel}>Offline</Text>
          </View>
        </View>
        <View style={styles.capacityContainer}>
          <Text style={styles.capacityLabel}>Capacity Status</Text>
          <View style={styles.capacityBar}>
            <View style={[styles.capacityFill, { width: `${eventStats.coveragePercentage}%`, backgroundColor: getCapacityStatusColor(eventStats.capacityStatus) }]} />
          </View>
          <Text style={[styles.capacityText, { color: getCapacityStatusColor(eventStats.capacityStatus) }]}>
            {eventStats.capacityStatus} ({eventStats.coveragePercentage.toFixed(1)}% coverage)
          </Text>
        </View>
      </View>
    );
  };

  const renderPerformanceMetrics = () => {
    if (!performanceMetrics) return null;
    return (
      <View style={styles.metricsContainer}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{performanceMetrics.assignmentSuccessRate.toFixed(1)}%</Text>
            <Text style={styles.metricLabel}>Success Rate</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{performanceMetrics.averageResponseTime.toFixed(1)}m</Text>
            <Text style={styles.metricLabel}>Avg Response</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{performanceMetrics.volunteerUtilization}%</Text>
            <Text style={styles.metricLabel}>Utilization</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: performanceMetrics.systemLoad === 'NORMAL' ? PROFESSIONAL_DESIGN.COLORS.success : PROFESSIONAL_DESIGN.COLORS.warning }]}>
              {performanceMetrics.systemLoad}
            </Text>
            <Text style={styles.metricLabel}>System Load</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderRecommendations = () => {
    if (!eventStats?.recommendations) return null;
    const recommendations = [];
    if (eventStats.recommendations.expandSearchRadius) recommendations.push('Expand search radius for better coverage');
    if (eventStats.recommendations.activateOfflineVolunteers) recommendations.push('Consider activating offline volunteers');
    if (eventStats.recommendations.increaseAssignmentLimits) recommendations.push('Increase assignment limits per volunteer');
    if (eventStats.recommendations.emergencyRecruitment) recommendations.push('Emergency volunteer recruitment needed');
    if (recommendations.length === 0) {
      return (
        <View style={styles.recommendationsContainer}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          <Text style={[styles.recommendationText, { color: PROFESSIONAL_DESIGN.COLORS.success }]}>✅ System operating optimally</Text>
        </View>
      );
    }
    return (
      <View style={styles.recommendationsContainer}>
        <Text style={styles.sectionTitle}>Recommendations</Text>
        {recommendations.map((rec, index) => (
          <Text key={index} style={styles.recommendationText}>⚠️ {rec}</Text>
        ))}
      </View>
    );
  };

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={{ color: PROFESSIONAL_DESIGN.COLORS.textPrimary }}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Large-Scale Event Manager</Text>
        </View>
        <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}> 
          {renderVolunteerStats()}
          {renderPerformanceMetrics()}
          {renderRecommendations()}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={performBulkAutoAssignment}>
              <Text style={styles.actionButtonText}>⚡ Bulk Auto-Assignment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.emergencyButton]} onPress={activateEmergencyVolunteers}>
              <Text style={styles.actionButtonText}>🚨 Emergency Activation</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={adjustThresholds}>
              <Text style={styles.actionButtonText}>📊 Adjust Thresholds</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: PROFESSIONAL_DESIGN.COLORS.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
    marginBottom: 15,
  },
  statsContainer: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: PROFESSIONAL_DESIGN.COLORS.border,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.background,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: PROFESSIONAL_DESIGN.COLORS.primary,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    textAlign: 'center',
  },
  capacityContainer: {
    marginTop: 20,
  },
  capacityLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: PROFESSIONAL_DESIGN.COLORS.textPrimary,
    marginBottom: 10,
  },
  capacityBar: {
    height: 8,
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  capacityFill: {
    height: '100%',
    borderRadius: 4,
  },
  capacityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  metricsContainer: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: PROFESSIONAL_DESIGN.COLORS.border,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.background,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: PROFESSIONAL_DESIGN.COLORS.primary,
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 12,
    color: PROFESSIONAL_DESIGN.COLORS.textSecondary,
    textAlign: 'center',
  },
  recommendationsContainer: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: PROFESSIONAL_DESIGN.COLORS.border,
  },
  recommendationText: {
    fontSize: 14,
    color: PROFESSIONAL_DESIGN.COLORS.warning,
    marginBottom: 8,
    lineHeight: 20,
  },
  actionsContainer: {
    marginTop: 10,
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.primary,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  emergencyButton: {
    backgroundColor: PROFESSIONAL_DESIGN.COLORS.error,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PROFESSIONAL_DESIGN.COLORS.textInverse,
    marginLeft: 10,
  },
});

export default LargeScaleEventManager;
