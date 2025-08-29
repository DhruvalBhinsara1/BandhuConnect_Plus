import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  const [volunteer, setVolunteer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [stats, setStats] = useState({
    totalRequests: 0,
    completedRequests: 0,
    hoursWorked: 0
  });

  useEffect(() => {
    fetchVolunteerProfile();
  }, []);

  const fetchVolunteerProfile = async () => {
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
      setEditData({
        name: profile.name || '',
        phone: profile.phone || '',
        skills: profile.skills?.join(', ') || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const skillsArray = editData.skills.split(',').map(skill => skill.trim()).filter(skill => skill);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editData.name,
          phone: editData.phone,
          skills: skillsArray,
          updated_at: new Date().toISOString()
        })
        .eq('id', volunteer.id);

      if (error) throw error;

      setVolunteer(prev => ({
        ...prev,
        name: editData.name,
        phone: editData.phone,
        skills: skillsArray
      }));
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleStatusToggle = async (statusType) => {
    if (!volunteer) return;

    const currentStatus = volunteer[statusType];
    const newStatus = statusType === 'volunteer_status' 
      ? (currentStatus === 'active' ? 'inactive' : 'active')
      : (currentStatus === 'on_duty' ? 'off_duty' : 'on_duty');

    try {
      const updateData = { [statusType]: newStatus };
      
      // If becoming inactive, also set off duty
      if (statusType === 'volunteer_status' && newStatus === 'inactive') {
        updateData.duty_status = 'off_duty';
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', volunteer.id);

      if (error) throw error;

      setVolunteer(prev => ({ ...prev, ...updateData }));
      Alert.alert('Status Updated', `You are now ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Sign Out Failed', error.message);
    } else {
      router.replace('/');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!volunteer) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Failed to load profile</Text>
      </View>
    );
  }

  const isActive = volunteer.volunteer_status === 'active';
  const isOnDuty = volunteer.duty_status === 'on_duty';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: isActive ? '#4CAF50' : '#f44336' }]}>
            <Text style={styles.statusText}>{isActive ? 'Active' : 'Inactive'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isOnDuty ? '#2196F3' : '#9E9E9E' }]}>
            <Text style={styles.statusText}>{isOnDuty ? 'On Duty' : 'Off Duty'}</Text>
          </View>
        </View>
      </View>

      {editing ? (
        <View style={styles.editSection}>
          <Text style={styles.sectionTitle}>Edit Profile</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#888"
            value={editData.name}
            onChangeText={(text) => setEditData(prev => ({ ...prev, name: text }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor="#888"
            value={editData.phone}
            onChangeText={(text) => setEditData(prev => ({ ...prev, phone: text }))}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Skills (comma separated)"
            placeholderTextColor="#888"
            value={editData.skills}
            onChangeText={(text) => setEditData(prev => ({ ...prev, skills: text }))}
            multiline
          />
          <View style={styles.editButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setEditing(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{volunteer.name || 'Not set'}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{volunteer.phone || 'Not set'}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Age</Text>
            <Text style={styles.infoValue}>{volunteer.age || 'Not set'}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Skills</Text>
            <View style={styles.skillsContainer}>
              {volunteer.skills?.length > 0 ? (
                volunteer.skills.map((skill, index) => (
                  <View key={index} style={styles.skillTag}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.infoValue}>No skills added</Text>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.editProfileButton} onPress={() => setEditing(true)}>
            <Text style={styles.buttonText}>✏️ Edit Profile</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.statusControlSection}>
        <Text style={styles.sectionTitle}>Status Controls</Text>
        <TouchableOpacity 
          style={[styles.statusControlButton, { backgroundColor: isActive ? '#f44336' : '#4CAF50' }]}
          onPress={() => handleStatusToggle('volunteer_status')}
        >
          <Text style={styles.buttonText}>
            {isActive ? '🔴 Set Inactive' : '🟢 Set Active'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.statusControlButton, { 
            backgroundColor: isOnDuty ? '#9E9E9E' : '#2196F3',
            opacity: isActive ? 1 : 0.5
          }]}
          onPress={() => handleStatusToggle('duty_status')}
          disabled={!isActive}
        >
          <Text style={styles.buttonText}>
            {isOnDuty ? '⏸️ Go Off Duty' : '▶️ Go On Duty'}
          </Text>
        </TouchableOpacity>
        {!isActive && (
          <Text style={styles.inactiveText}>Activate your account to go on duty</Text>
        )}
      </View>

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Performance Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalRequests}</Text>
            <Text style={styles.statLabel}>Total Requests</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.completedRequests}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.hoursWorked}</Text>
            <Text style={styles.statLabel}>Hours Worked</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.buttonText}>🚪 Sign Out</Text>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
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
  editSection: {
    padding: 20,
  },
  profileSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: '#2C2C2E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 12,
    color: '#B3B3B3',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 5,
  },
  skillTag: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skillText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  input: {
    backgroundColor: '#2C2C2E',
    color: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#666',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  editProfileButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  statusControlSection: {
    padding: 20,
  },
  statusControlButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  inactiveText: {
    color: '#f44336',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  statsSection: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007BFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#B3B3B3',
    textAlign: 'center',
  },
  actionsSection: {
    padding: 20,
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  errorText: {
    color: '#f44336',
    fontSize: 18,
  },
});
