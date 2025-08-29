import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function RequestsScreen() {
  const [requests, setRequests] = useState([]);
  const [volunteer, setVolunteer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchVolunteerAndRequests();
  }, []);

  const fetchVolunteerAndRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get volunteer profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setVolunteer(profile);

      // Get assigned requests
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          *,
          requests (
            id,
            type,
            status,
            description,
            location,
            created_at,
            user_id,
            profiles:user_id (name, phone)
          )
        `)
        .eq('volunteer_id', user.id)
        .order('assigned_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;
      setRequests(assignments || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchVolunteerAndRequests();
  };

  const updateRequestStatus = async (assignmentId, requestId, newStatus) => {
    try {
      // Update assignment status
      const { error: assignmentError } = await supabase
        .from('assignments')
        .update({ status: newStatus })
        .eq('id', assignmentId);

      if (assignmentError) throw assignmentError;

      // Update request status
      const { error: requestError } = await supabase
        .from('requests')
        .update({ 
          status: newStatus,
          resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null
        })
        .eq('id', requestId);

      if (requestError) throw requestError;

      Alert.alert('Success', `Request marked as ${newStatus}`);
      fetchVolunteerAndRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      Alert.alert('Error', 'Failed to update request status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'in_progress': return '#007BFF';
      case 'resolved': return '#4CAF50';
      case 'cancelled': return '#f44336';
      default: return '#666';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'medical': return '🏥';
      case 'safety': return '🛡️';
      case 'lost_child': return '👶';
      case 'directions': return '🗺️';
      case 'sanitation': return '🧹';
      case 'general': return '❓';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Requests</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {requests.filter(r => r.status === 'in_progress').length} Active
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>📋</Text>
            <Text style={styles.emptyTitle}>No Requests Assigned</Text>
            <Text style={styles.emptySubtitle}>
              You'll see assistance requests here when they're assigned to you
            </Text>
          </View>
        ) : (
          requests.map((assignment) => {
            const request = assignment.requests;
            if (!request) return null;

            return (
              <View key={assignment.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View style={styles.requestTypeContainer}>
                    <Text style={styles.typeIcon}>{getTypeIcon(request.type)}</Text>
                    <Text style={styles.requestType}>
                      {request.type.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(assignment.status) }]}>
                    <Text style={styles.statusText}>{assignment.status.replace('_', ' ')}</Text>
                  </View>
                </View>

                <View style={styles.requestBody}>
                  <Text style={styles.requestDescription}>
                    {request.description || 'No description provided'}
                  </Text>
                  
                  {request.location && (
                    <View style={styles.locationContainer}>
                      <Text style={styles.locationText}>📍 {request.location}</Text>
                    </View>
                  )}

                  {request.profiles && (
                    <View style={styles.requesterContainer}>
                      <Text style={styles.requesterLabel}>Requested by:</Text>
                      <Text style={styles.requesterName}>{request.profiles.name || 'Anonymous'}</Text>
                      {request.profiles.phone && (
                        <Text style={styles.requesterPhone}>📞 {request.profiles.phone}</Text>
                      )}
                    </View>
                  )}

                  <Text style={styles.timeText}>
                    Assigned: {new Date(assignment.assigned_at).toLocaleString()}
                  </Text>
                </View>

                {assignment.status !== 'resolved' && assignment.status !== 'cancelled' && (
                  <View style={styles.actionButtons}>
                    {assignment.status === 'pending' && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={() => updateRequestStatus(assignment.id, request.id, 'in_progress')}
                      >
                        <Text style={styles.actionButtonText}>✅ Accept</Text>
                      </TouchableOpacity>
                    )}
                    
                    {assignment.status === 'in_progress' && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.completeButton]}
                        onPress={() => updateRequestStatus(assignment.id, request.id, 'resolved')}
                      >
                        <Text style={styles.actionButtonText}>🎉 Complete</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => updateRequestStatus(assignment.id, request.id, 'cancelled')}
                    >
                      <Text style={styles.actionButtonText}>❌ Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#1E1E1E',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#007BFF',
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statsContainer: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 48,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#B3B3B3',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  requestCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#1E1E1E',
  },
  requestTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  requestType: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  requestBody: {
    padding: 15,
  },
  requestDescription: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 10,
    lineHeight: 22,
  },
  locationContainer: {
    backgroundColor: '#1E1E1E',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  locationText: {
    color: '#B3B3B3',
    fontSize: 14,
  },
  requesterContainer: {
    backgroundColor: '#1E1E1E',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  requesterLabel: {
    color: '#B3B3B3',
    fontSize: 12,
    marginBottom: 4,
  },
  requesterName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  requesterPhone: {
    color: '#B3B3B3',
    fontSize: 14,
    marginTop: 2,
  },
  timeText: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  completeButton: {
    backgroundColor: '#007BFF',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
