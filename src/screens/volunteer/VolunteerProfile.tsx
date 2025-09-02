import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRequest } from '../../context/RequestContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { COLORS, VOLUNTEER_SKILLS } from '../../constants';

const VolunteerProfile: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, updateProfile, signOut } = useAuth();
  const { assignments } = useRequest();

  // Type for the navigation
  type RootStackParamList = {
    Devices: undefined;
  };
  const typedNavigation = navigation as any;
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    completedTasks: 0,
    totalTasks: 0,
    hoursWorked: 0,
  });
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    skills: user?.skills || [],
    status: user?.volunteer_status || 'available',
  });

  useEffect(() => {
    if (assignments.length > 0 && user) {
      calculateStats();
    }
  }, [assignments, user]);

  const calculateStats = () => {
    const userAssignments = assignments.filter(a => a.volunteer_id === user?.id);
    const completed = userAssignments.filter(a => a.status === 'completed');
    
    let totalHours = 0;
    completed.forEach(assignment => {
      if (assignment.started_at && assignment.completed_at) {
        const start = new Date(assignment.started_at);
        const end = new Date(assignment.completed_at);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        totalHours += hours;
      }
    });

    setStats({
      completedTasks: completed.length,
      totalTasks: userAssignments.length,
      hoursWorked: totalHours,
    });
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await updateProfile({
        name: formData.name,
        phone: formData.phone,
        skills: formData.skills,
        volunteer_status: formData.status,
      });

      if (error) {
        console.error('Profile update error:', error);
        Alert.alert('Error', `Failed to update profile: ${error.message || error}`);
      } else {
        Alert.alert('Success', 'Profile updated successfully!');
        setEditing(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', onPress: signOut, style: 'destructive' }
      ]
    );
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Ionicons 
              name={editing ? "close" : "pencil"} 
              size={24} 
              color={COLORS.primary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Info */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: user?.is_active ? COLORS.success + '20' : COLORS.error + '20' }
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: user?.is_active ? COLORS.success : COLORS.error }
                  ]}
                >
                  {user?.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </View>

          {editing ? (
            <View>
              <Input
                label="Name"
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Enter your name"
              />

              <Input
                label="Phone"
                value={formData.phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />

              <View style={styles.statusSection}>
                <Text style={styles.statusLabel}>Status</Text>
                <View style={styles.statusOptions}>
                  {['available', 'busy', 'off_duty'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      onPress={() => setFormData(prev => ({ ...prev, status }))}
                      style={[
                        styles.statusOption,
                        formData.status === status ? styles.statusOptionActive : styles.statusOptionInactive
                      ]}
                    >
                      <Text style={[
                        styles.statusOptionText,
                        formData.status === status ? styles.statusOptionTextActive : styles.statusOptionTextInactive
                      ]}>
                        {status.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{user?.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={styles.infoValue}>
                  {user?.status?.replace('_', ' ')}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Role</Text>
                <Text style={styles.infoValue}>{user?.role}</Text>
              </View>
              <TouchableOpacity 
                style={styles.devicesButton}
                onPress={() => typedNavigation.navigate('Devices')}
              >
                <Ionicons name="phone-portrait-outline" size={24} color={COLORS.primary} />
                <Text style={styles.devicesButtonText}>Manage Active Devices</Text>
                <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* Skills */}
        <Card style={styles.skillsCard}>
          <Text style={styles.sectionTitle}>Skills</Text>
          
          {editing ? (
            <View style={styles.skillsContainer}>
              {VOLUNTEER_SKILLS.map((skill) => (
                <TouchableOpacity
                  key={skill}
                  onPress={() => toggleSkill(skill)}
                  style={[
                    styles.skillChip,
                    formData.skills.includes(skill) ? styles.skillChipActive : styles.skillChipInactive
                  ]}
                >
                  <Text style={[
                    styles.skillChipText,
                    formData.skills.includes(skill) ? styles.skillChipTextActive : styles.skillChipTextInactive
                  ]}>
                    {skill}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.skillsContainer}>
              {user?.skills?.map((skill) => (
                <View
                  key={skill}
                  style={styles.skillBadge}
                >
                  <Text style={styles.skillBadgeText}>{skill}</Text>
                </View>
              )) || (
                <Text style={styles.noSkillsText}>No skills added</Text>
              )}
            </View>
          )}
        </Card>

        {/* Statistics */}
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          
          <View style={styles.statRow}>
            <View style={styles.statLabel}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={styles.statLabelText}>Tasks Completed</Text>
            </View>
            <Text style={styles.statValue}>{stats.completedTasks}</Text>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statLabel}>
              <Ionicons name="time" size={20} color={COLORS.warning} />
              <Text style={styles.statLabelText}>Hours Worked</Text>
            </View>
            <Text style={styles.statValue}>{stats.hoursWorked.toFixed(2)}h</Text>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statLabel}>
              <Ionicons name="star" size={20} color={COLORS.warning} />
              <Text style={styles.statLabelText}>Rating</Text>
            </View>
            <Text style={styles.statValue}>-</Text>
          </View>
        </Card>

        {/* Actions */}
        {editing ? (
          <View style={styles.editActions}>
            <Button
              title="Save Changes"
              onPress={handleSave}
              loading={loading}
              style={styles.saveButton}
            />
            <Button
              title="Cancel"
              onPress={() => {
                setEditing(false);
                setFormData({
                  name: user?.name || '',
                  phone: user?.phone || '',
                  skills: user?.skills || [],
                  status: user?.status || 'available',
                });
              }}
              variant="outline"
              style={styles.cancelButton}
            />
          </View>
        ) : (
          <View style={styles.actions}>
            <Button
              title="View My Tasks"
              onPress={() => navigation.navigate('Tasks')}
              variant="outline"
              style={styles.actionButton}
            />
            
            <Button
              title="Sign Out"
              onPress={handleSignOut}
              variant="danger"
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  devicesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  devicesButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  profileCard: {
    marginBottom: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    backgroundColor: '#dbeafe',
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  userEmail: {
    color: '#6b7280',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusSection: {
    marginBottom: 16,
  },
  statusLabel: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  statusOptions: {
    flexDirection: 'row',
  },
  statusOption: {
    marginRight: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusOptionActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  statusOptionInactive: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
  },
  statusOptionText: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  statusOptionTextActive: {
    color: '#ffffff',
  },
  statusOptionTextInactive: {
    color: '#374151',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    color: '#6b7280',
  },
  infoValue: {
    color: '#111827',
    textTransform: 'capitalize',
  },
  skillsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillChip: {
    marginRight: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  skillChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  skillChipInactive: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
  },
  skillChipText: {
    fontSize: 14,
  },
  skillChipTextActive: {
    color: '#ffffff',
  },
  skillChipTextInactive: {
    color: '#374151',
  },
  skillBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  skillBadgeText: {
    color: '#1e40af',
    fontSize: 14,
  },
  noSkillsText: {
    color: '#6b7280',
  },
  statsCard: {
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabelText: {
    color: '#374151',
    marginLeft: 8,
  },
  statValue: {
    color: '#111827',
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  saveButton: {
    flex: 1,
    marginRight: 8,
  },
  cancelButton: {
    flex: 1,
  },
  actions: {
    marginBottom: 32,
  },
  actionButton: {
    marginBottom: 12,
  },
});

export default VolunteerProfile;
