import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, Alert, Image, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRequest } from '../../context/RequestContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { COLORS, STATUS_COLORS } from '../../constants';
import { Assignment } from '../../types';
import { NotificationService } from '../../services/notificationService';

// Styles definition moved before component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  notFoundContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    color: '#6b7280',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cardMargin: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailColumn: {
    flex: 1,
    marginRight: 16,
  },
  detailLabel: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 4,
  },
  detailTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  detailValue: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 20,
  },
  detailValueCapitalized: {
    color: '#374151',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityText: {
    marginLeft: 4,
    color: '#374151',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  attachedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  timelineContainer: {
    paddingLeft: 6,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    color: '#111827',
    fontWeight: '500',
  },
  timelineDate: {
    color: '#6b7280',
    fontSize: 14,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationInfo: {
    marginBottom: 12,
  },
  locationText: {
    color: '#374151',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  distanceText: {
    color: '#6b7280',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  actionContainer: {
    marginBottom: 32,
  },
  pendingContainer: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 8,
  },
  pendingText: {
    color: '#92400e',
    fontWeight: '500',
    textAlign: 'center',
  },
  completionLocationContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0ea5e9',
  },
  completionLocationTitle: {
    color: '#0c4a6e',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
  },
  completionLocationText: {
    color: '#0369a1',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  completionAddressText: {
    color: '#0369a1',
    fontSize: 13,
    marginTop: 4,
    fontStyle: 'italic',
  },
  completedContainer: {
    backgroundColor: '#dcfce7',
    padding: 16,
    borderRadius: 8,
  },
  completedContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedText: {
    color: '#166534',
    fontWeight: '600',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
});

const TaskDetails: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { assignments, acceptAssignment, startTask, completeTask } = useRequest();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(false);

  const assignmentId = route.params?.assignmentId;

  useEffect(() => {
    if (assignmentId) {
      const foundAssignment = assignments.find(a => a.id === assignmentId);
      setAssignment(foundAssignment || null);
    }
  }, [assignmentId, assignments]);

  const handleAcceptTask = async () => {
    if (!assignment) return;

    setLoading(true);
    try {
      const { error } = await acceptAssignment(assignment.id);
      if (error) {
        Alert.alert('Error', 'Failed to accept task. Please try again.');
      } else {
        Alert.alert('Success', 'Task accepted successfully!');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = async () => {
    if (!assignment) return;

    setLoading(true);
    try {
      const { error } = await startTask(assignment.id);
      if (error) {
        Alert.alert('Error', 'Failed to start task. Please try again.');
      } else {
        Alert.alert('Success', 'Task started! You are now on duty.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!assignment) return;

    Alert.alert(
      'Complete Task',
      'Are you sure you want to mark this task as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await completeTask(assignment.id);
              if (error) {
                Alert.alert('Error', 'Failed to complete task. Please try again.');
              } else {
                // Send completion notification
                await NotificationService.sendTaskCompletionNotification(
                  assignment.request?.title || 'Task'
                );
                Alert.alert('Success', 'Task completed successfully!');
                navigation.goBack();
              }
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleStartTaskDirectly = async () => {
    if (!assignment) return;

    setLoading(true);
    try {
      const { error } = await startTask(assignment.id);
      if (error) {
        Alert.alert('Error', 'Failed to start task. Please try again.');
      } else {
        Alert.alert('Success', 'Task started! You are now on duty.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getActionButton = () => {
    if (!assignment) return null;

    const status = assignment.status;
    
    switch (status) {
      case 'pending':
        // Tasks are already assigned, mark as done directly
        return (
          <Button
            title="Mark Task Done"
            onPress={handleCompleteTask}
            loading={loading}
          />
        );
      case 'accepted':
        return (
          <Button
            title="Start Task"
            onPress={handleStartTask}
            loading={loading}
          />
        );
      case 'in_progress':
        return (
          <Button
            title="Mark Task Complete"
            onPress={handleCompleteTask}
            loading={loading}
          />
        );
      case 'completed':
        return (
          <View style={styles.completedContainer}>
            <View style={styles.completedContent}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              <Text style={styles.completedText}>Task Completed</Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  if (!assignment) {
    return (
      <SafeAreaView style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Task not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Button
            title="←"
            onPress={() => navigation.goBack()}
            variant="outline"
            size="small"
            style={styles.backButton}
          />
          <Text style={styles.headerTitle}>Task Details</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Status Card */}
        <Card style={styles.cardMargin}>
          <View style={styles.statusContainer}>
            <View>
              <Text style={styles.statusTitle}>
                Current Status
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: STATUS_COLORS[assignment.status] + '20' }
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: STATUS_COLORS[assignment.status] }
                  ]}
                >
                  {assignment.status.replace('_', ' ')}
                </Text>
              </View>
            </View>
            <Ionicons 
              name="information-circle" 
              size={32} 
              color={STATUS_COLORS[assignment.status]} 
            />
          </View>
        </Card>

        {/* Request Details */}
        <Card style={styles.cardMargin}>
          <Text style={styles.sectionTitle}>Request Details</Text>
          
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Title</Text>
            <Text style={styles.detailTitle}>
              {assignment.request?.title}
            </Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.detailValue}>
              {assignment.request?.description}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailColumn}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValueCapitalized}>
                {assignment.request?.type?.replace('_', ' ')}
              </Text>
            </View>
            <View style={styles.detailColumn}>
              <Text style={styles.detailLabel}>Priority</Text>
              <View style={styles.priorityContainer}>
                <Ionicons 
                  name="flag" 
                  size={16} 
                  color={assignment.request?.priority === 'high' ? COLORS.error : COLORS.warning} 
                />
                <Text style={styles.priorityText}>
                  {assignment.request?.priority}
                </Text>
              </View>
            </View>
          </View>

          {assignment.request?.photo_url && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Attached Photo</Text>
              <Image
                source={{ uri: assignment.request.photo_url }}
                style={styles.attachedImage}
                resizeMode="cover"
              />
            </View>
          )}
        </Card>

        {/* Timeline */}
        <Card style={styles.cardMargin}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          
          <View style={styles.timelineContainer}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: COLORS.primary }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Task Assigned</Text>
                <Text style={styles.timelineDate}>
                  {new Date(assignment.assigned_at).toLocaleString()}
                </Text>
              </View>
            </View>

            {assignment.accepted_at && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: COLORS.success }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Task Accepted</Text>
                  <Text style={styles.timelineDate}>
                    {new Date(assignment.accepted_at).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}

            {assignment.started_at && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: '#8b5cf6' }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Task Started</Text>
                  <Text style={styles.timelineDate}>
                    {new Date(assignment.started_at).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}

            {assignment.completed_at && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: '#16a34a' }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Task Completed</Text>
                  <Text style={styles.timelineDate}>
                    {new Date(assignment.completed_at).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </Card>

        {/* Request Details */}
        <Card style={styles.cardMargin}>
          <Text style={styles.sectionTitle}>Request Details</Text>
          
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Title</Text>
            <Text style={styles.detailTitle}>{assignment.request?.title}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.detailValue}>{assignment.request?.description}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailColumn}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValueCapitalized}>{assignment.request?.type}</Text>
            </View>
            <View style={styles.detailColumn}>
              <Text style={styles.detailLabel}>Priority</Text>
              <View style={styles.priorityContainer}>
                <Ionicons 
                  name="flag" 
                  size={16} 
                  color={assignment.request?.priority === 'high' ? COLORS.error : COLORS.warning} 
                />
                <Text style={styles.priorityText}>
                  {assignment.request?.priority}
                </Text>
              </View>
            </View>
          </View>

        {assignment.request?.photo_url && (
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Attached Photo</Text>
            <Image
              source={{ uri: assignment.request.photo_url }}
              style={styles.attachedImage}
              resizeMode="cover"
            />
          </View>
        )}
      </Card>

      {/* Timeline */}
      <Card style={styles.cardMargin}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        
        <View style={styles.timelineContainer}>
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: COLORS.primary }]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Task Assigned</Text>
              <Text style={styles.timelineDate}>
                {new Date(assignment.assigned_at).toLocaleString()}
              </Text>
            </View>
          </View>

          {assignment.accepted_at && (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: COLORS.success }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Task Accepted</Text>
                <Text style={styles.timelineDate}>
                  {new Date(assignment.accepted_at).toLocaleString()}
                </Text>
              </View>
            </View>
          )}

          {assignment.started_at && (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: '#8b5cf6' }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Task Started</Text>
                <Text style={styles.timelineDate}>
                  {new Date(assignment.started_at).toLocaleString()}
                </Text>
              </View>
            </View>
          )}

          {assignment.completed_at && (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: '#16a34a' }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Task Completed</Text>
                <Text style={styles.timelineDate}>
                  {new Date(assignment.completed_at).toLocaleString()}
                </Text>
              </View>
            </View>
          )}
        </View>
      </Card>

      {/* Location */}
      <Card style={styles.cardMargin}>
        <View style={styles.locationHeader}>
          <Ionicons name="location-outline" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Pilgrim Location</Text>
          {assignment.request?.location?.latitude && assignment.request?.location?.longitude && (
            <Button
              title="View on Map"
              onPress={() => navigation.navigate('Map', {
                initialLocation: {
                  latitude: assignment.request.location.latitude,
                  longitude: assignment.request.location.longitude
                }
              })}
              variant="outline"
              size="small"
            />
          )}
        </View>
        <View style={styles.locationInfo}>
          {assignment.request?.location?.latitude && assignment.request?.location?.longitude ? (
            <>
              <Text style={styles.locationText}>
                📍 Lat: {assignment.request.location.latitude.toFixed(6)}
              </Text>
              <Text style={styles.locationText}>
                📍 Lng: {assignment.request.location.longitude.toFixed(6)}
              </Text>
            </>
          ) : (
            <Text style={styles.locationText}>
              ⚠️ Pilgrim location not available
            </Text>
          )}
          <Text style={styles.distanceText}>
            Estimated distance: {assignment.request?.location?.latitude ? '0.5 km' : 'Unknown'}
          </Text>
        </View>
          
        {assignment.status === 'completed' && (assignment as any).completion_latitude && (
          <View style={styles.completionLocationContainer}>
            <Text style={styles.completionLocationTitle}>Task Completed At:</Text>
            <Text style={styles.completionLocationText}>
              Lat: {(assignment as any).completion_latitude?.toFixed(6) || 'N/A'}, Lng: {(assignment as any).completion_longitude?.toFixed(6) || 'N/A'}
            </Text>
            {(assignment as any).completion_address && (
              <Text style={styles.completionAddressText}>
                {(assignment as any).completion_address}
              </Text>
            )}
          </View>
        )}
      </Card>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        {getActionButton()}
      </View>
    </ScrollView>
  </SafeAreaView>
);
};

export default TaskDetails;
