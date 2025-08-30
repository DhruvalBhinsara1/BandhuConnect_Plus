import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, Alert, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const AdminProfile: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, updateProfile, signOut } = useAuth();
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await updateProfile({
        name: formData.name,
        phone: formData.phone,
      });

      if (error) {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Admin Profile</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Ionicons 
              name={editing ? "close" : "pencil"} 
              size={24} 
              color="#3b82f6" 
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Info */}
        <View style={styles.card}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Ionicons name="shield-checkmark" size={32} color="#3b82f6" />
            </View>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.roleContainer}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>Administrator</Text>
              </View>
            </View>
          </View>

          {editing ? (
            <View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  placeholder="Enter your name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.phone}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{user?.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Role</Text>
                <Text style={[styles.infoValue, { textTransform: 'capitalize' }]}>{user?.role}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={styles.statusActive}>Active</Text>
              </View>
            </View>
          )}
        </View>

        {/* Admin Statistics */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Admin Statistics</Text>
          
          <View style={styles.statRow}>
            <View style={styles.statLeft}>
              <Ionicons name="people" size={20} color="#3b82f6" />
              <Text style={styles.statLabel}>Volunteers Managed</Text>
            </View>
            <Text style={styles.statValue}>25</Text>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statLeft}>
              <Ionicons name="document-text" size={20} color="#10b981" />
              <Text style={styles.statLabel}>Requests Processed</Text>
            </View>
            <Text style={styles.statValue}>142</Text>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statLeft}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.statLabel}>Tasks Completed</Text>
            </View>
            <Text style={styles.statValue}>128</Text>
          </View>
        </View>

        {/* System Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>System Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Login</Text>
            <Text style={styles.infoValue}>{new Date().toLocaleDateString()}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Created</Text>
            <Text style={styles.infoValue}>
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Actions */}
        {editing ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleSave} disabled={loading}>
              <Text style={styles.primaryButtonText}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.outlineButton]} 
              onPress={() => {
                setEditing(false);
                setFormData({
                  name: user?.name || '',
                  phone: user?.phone || '',
                });
              }}
            >
              <Text style={styles.outlineButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.outlineButton]} 
              onPress={() => navigation.navigate('VolunteerManagement')}
            >
              <Text style={styles.outlineButtonText}>Manage Volunteers</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.outlineButton]} 
              onPress={() => navigation.navigate('RequestManagement')}
            >
              <Text style={styles.outlineButtonText}>Manage Requests</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.dangerButton]} 
              onPress={handleSignOut}
            >
              <Text style={styles.dangerButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerRow: {
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
  card: {
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
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  profileEmail: {
    color: '#6b7280',
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  roleBadge: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  roleText: {
    color: '#7c3aed',
    fontSize: 14,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: 'white',
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
  },
  statusActive: {
    color: '#10b981',
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    color: '#374151',
    marginLeft: 8,
  },
  statValue: {
    color: '#111827',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    marginRight: 8,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  outlineButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  actionButtons: {
    marginBottom: 32,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  dangerButton: {
    backgroundColor: '#ef4444',
  },
  dangerButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default AdminProfile;
