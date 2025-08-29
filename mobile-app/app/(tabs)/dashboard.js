import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Colors, Theme } from '../../constants/Colors';

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
          <View style={[styles.statusBadge, { backgroundColor: isActive ? Colors.active : Colors.inactive }]}>
            <Text style={styles.statusText}>{isActive ? 'Active' : 'Inactive'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isOnDuty ? Colors.onDuty : Colors.offDuty }]}>
            <Text style={styles.statusText}>{isOnDuty ? 'On Duty' : 'Off Duty'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.checkInSection}>
        <TouchableOpacity 
          style={[styles.checkInButton, { 
            backgroundColor: isOnDuty ? Colors.accentSecondary : Colors.accent,
            opacity: isActive ? 1 : 0.5
          }]}
          onPress={handleCheckInOut}
          disabled={!isActive}
        >
          <View style={styles.checkInButtonContent}>
            <Ionicons 
              name={isOnDuty ? 'log-out-outline' : 'log-in-outline'} 
              size={24} 
              color={Colors.textPrimary} 
              style={styles.checkInIcon}
            />
            <Text style={styles.checkInButtonText}>
              {isOnDuty ? 'Check Out' : 'Check In'}
            </Text>
          </View>
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
          <View style={styles.actionButtonContent}>
            <MaterialIcons name="assignment" size={20} color={Colors.accent} />
            <Text style={styles.actionButtonText}>View Requests</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/location-update')}
        >
          <View style={styles.actionButtonContent}>
            <Ionicons name="location-outline" size={20} color={Colors.accent} />
            <Text style={styles.actionButtonText}>Update Location</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/emergency-contact')}
        >
          <View style={styles.actionButtonContent}>
            <MaterialIcons name="emergency" size={20} color={Colors.error} />
            <Text style={styles.actionButtonText}>Emergency Contact</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    padding: Theme.spacing.lg,
    paddingTop: 40,
    backgroundColor: Colors.secondary,
  },
  title: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.md,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  statusBadge: {
    paddingHorizontal: Theme.spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.md,
  },
  statusText: {
    color: Colors.textPrimary,
    fontSize: Theme.fontSize.xs,
    fontWeight: 'bold',
  },
  checkInSection: {
    padding: Theme.spacing.lg,
    alignItems: 'center',
  },
  checkInButton: {
    width: '100%',
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
    backgroundColor: Colors.accent,
  },
  checkInButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  checkInIcon: {
    marginRight: Theme.spacing.sm,
  },
  checkInButtonText: {
    color: Colors.textPrimary,
    fontSize: Theme.fontSize.xl,
    fontWeight: 'bold',
  },
  checkInSubtext: {
    color: Colors.textPrimary,
    fontSize: Theme.fontSize.sm,
    opacity: 0.8,
  },
  inactiveText: {
    color: Colors.error,
    fontSize: Theme.fontSize.sm,
    textAlign: 'center',
    marginTop: Theme.spacing.sm,
  },
  statsSection: {
    padding: Theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.secondary,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.sm,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.accent,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  quickActions: {
    padding: Theme.spacing.lg,
  },
  actionButton: {
    backgroundColor: Colors.secondary,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.sm,
    marginBottom: Theme.spacing.sm,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: Colors.textPrimary,
    fontSize: Theme.fontSize.md,
    marginLeft: Theme.spacing.sm,
  },
  loadingText: {
    color: Colors.textPrimary,
    fontSize: Theme.fontSize.lg,
  },
  errorText: {
    color: Colors.error,
    fontSize: Theme.fontSize.lg,
    textAlign: 'center',
  },
});
