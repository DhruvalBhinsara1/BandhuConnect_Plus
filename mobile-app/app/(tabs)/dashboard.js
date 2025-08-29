import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function DashboardScreen() {
  const [volunteer, setVolunteer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    assignedRequests: 0,
    completedToday: 0
  });

  useEffect(() => {
    fetchVolunteerData();
  }, []);

  const fetchVolunteerData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setVolunteer(profile);

      // Fetch request stats
      const { count: assignedCount } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('volunteer_id', user.id)
        .in('status', ['pending', 'in_progress']);

      const { count: completedCount } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('volunteer_id', user.id)
        .eq('status', 'resolved')
        .gte('assigned_at', new Date().toISOString().split('T')[0]);

      setStats({
        assignedRequests: assignedCount || 0,
        completedToday: completedCount || 0
      });
    } catch (error) {
      console.error('Error fetching volunteer data:', error);
      Alert.alert('Error', 'Failed to load volunteer data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckInOut = async () => {
    if (!volunteer) return;

    const newDutyStatus = volunteer.duty_status === 'on_duty' ? 'off_duty' : 'on_duty';
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ duty_status: newDutyStatus })
        .eq('id', volunteer.id);

      if (error) throw error;

      setVolunteer(prev => ({ ...prev, duty_status: newDutyStatus }));
      Alert.alert(
        'Status Updated', 
        `You are now ${newDutyStatus === 'on_duty' ? 'on duty' : 'off duty'}`
      );
    } catch (error) {
      console.error('Error updating duty status:', error);
      Alert.alert('Error', 'Failed to update duty status');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!volunteer) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load volunteer data</Text>
      </View>
    );
  }

  const isOnDuty = volunteer.duty_status === 'on_duty';
  const isActive = volunteer.volunteer_status === 'active';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome, {volunteer.name}!</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: isActive ? '#4CAF50' : '#f44336' }]}>
            <Text style={styles.statusText}>{isActive ? 'Active' : 'Inactive'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isOnDuty ? '#2196F3' : '#9E9E9E' }]}>
            <Text style={styles.statusText}>{isOnDuty ? 'On Duty' : 'Off Duty'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.checkInSection}>
        <TouchableOpacity 
          style={[styles.checkInButton, { 
            backgroundColor: isOnDuty ? '#f44336' : '#4CAF50',
            opacity: isActive ? 1 : 0.5
          }]}
          onPress={handleCheckInOut}
          disabled={!isActive}
        >
          <Text style={styles.checkInButtonText}>
            {isOnDuty ? '🔴 Check Out' : '🟢 Check In'}
          </Text>
          <Text style={styles.checkInSubtext}>
            {isOnDuty ? 'End your shift' : 'Start your shift'}
          </Text>
        </TouchableOpacity>
        {!isActive && (
          <Text style={styles.inactiveText}>
            Contact admin to activate your account
          </Text>
        )}
      </View>

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.assignedRequests}</Text>
            <Text style={styles.statLabel}>Assigned Requests</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.completedToday}</Text>
            <Text style={styles.statLabel}>Completed Today</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/requests')}
        >
          <Text style={styles.actionButtonText}>📋 View Requests</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/location-update')}
        >
          <Text style={styles.actionButtonText}>📍 Update Location</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/emergency-contact')}
        >
          <Text style={styles.actionButtonText}>🆘 Emergency Contact</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#1E1E1E',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkInSection: {
    padding: 20,
    alignItems: 'center',
  },
  checkInButton: {
    width: '100%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  checkInButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  checkInSubtext: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
  },
  inactiveText: {
    color: '#f44336',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007BFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#B3B3B3',
    textAlign: 'center',
  },
  quickActions: {
    padding: 20,
  },
  actionButton: {
    backgroundColor: '#2C2C2E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  errorText: {
    color: '#f44336',
    fontSize: 18,
    textAlign: 'center',
  },
});
