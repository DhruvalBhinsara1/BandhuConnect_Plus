import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRequest } from '../../context/RequestContext';
import { useTheme } from '../../theme';
import { safeNavigate } from '../../utils/navigationErrorHandler';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const PilgrimProfile: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, updateProfile, signOut, selectedRole } = useAuth();
  const { requests, getRequests } = useRequest();
  const { theme } = useTheme();
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // Fetch requests when profile loads to ensure fresh data
  useEffect(() => {
    if (user) {
      getRequests({ userId: user.id });
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const result = await updateProfile(formData);
      if (result.error) {
        Alert.alert('Error', 'Failed to update profile');
      } else {
        setEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
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
        { text: 'Sign Out', style: 'destructive', onPress: signOut }
      ]
    );
  };

  const myRequests = requests.filter(r => r.user_id === user?.id);
  const stats = {
    totalRequests: myRequests.length,
    activeRequests: myRequests.filter(r => ['pending', 'assigned', 'in_progress'].includes(r.status)).length,
    completedRequests: myRequests.filter(r => r.status === 'completed').length,
    cancelledRequests: myRequests.filter(r => r.status === 'cancelled').length,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{ backgroundColor: theme.primary, paddingHorizontal: 24, paddingVertical: 32 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>Profile</Text>
            <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{user?.name}</Text>
          </View>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Ionicons 
              name={editing ? "close" : "create-outline"} 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 16, backgroundColor: theme.background }}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Profile Information */}
        <Card style={{ marginBottom: 16, borderRadius: 16, padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.textPrimary }}>Personal Information</Text>
            {!editing && (
              <TouchableOpacity 
                onPress={() => setEditing(true)}
                style={{ backgroundColor: theme.surface, padding: 8, borderRadius: 8 }}
              >
                <Ionicons name="create-outline" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          
          {editing ? (
            <>
              <Input
                label="Full Name"
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Enter your full name"
              />
              
              <Input
                label="Email"
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <Input
                label="Phone Number"
                value={formData.phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
              
              <View style={{ flexDirection: 'row', marginTop: 16 }}>
                <Button
                  title="Save Changes"
                  onPress={handleSave}
                  loading={loading}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <Button
                  title="Cancel"
                  onPress={() => {
                    setEditing(false);
                    setFormData({
                      name: user?.name || '',
                      email: user?.email || '',
                      phone: user?.phone || '',
                    });
                  }}
                  variant="outline"
                  style={{ flex: 1 }}
                />
              </View>
            </>
          ) : (
            <>
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="person" size={20} color={theme.textSecondary} />
                  <Text style={{ color: theme.textSecondary, fontSize: 14, marginLeft: 8, fontWeight: '500' }}>Full Name</Text>
                </View>
                <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '600', marginLeft: 28 }}>{user?.name}</Text>
              </View>
              
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="mail" size={20} color={theme.textSecondary} />
                  <Text style={{ color: theme.textSecondary, fontSize: 14, marginLeft: 8, fontWeight: '500' }}>Email</Text>
                </View>
                <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '600', marginLeft: 28 }}>{user?.email}</Text>
              </View>
              
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="call" size={20} color={theme.textSecondary} />
                  <Text style={{ color: theme.textSecondary, fontSize: 14, marginLeft: 8, fontWeight: '500' }}>Phone Number</Text>
                </View>
                <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '600', marginLeft: 28 }}>{user?.phone}</Text>
              </View>
              
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="shield-checkmark" size={20} color={theme.textSecondary} />
                  <Text style={{ color: theme.textSecondary, fontSize: 14, marginLeft: 8, fontWeight: '500' }}>Account Type</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 28 }}>
                  <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '600', textTransform: 'capitalize' }}>{user?.role || selectedRole || 'Pilgrim'}</Text>
                  <View style={{ backgroundColor: theme.success + '30', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginLeft: 8 }}>
                    <Text style={{ color: theme.success, fontSize: 12, fontWeight: '600' }}>Active</Text>
                  </View>
                </View>
              </View>
              
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="calendar" size={20} color={theme.textSecondary} />
                  <Text style={{ color: theme.textSecondary, fontSize: 14, marginLeft: 8, fontWeight: '500' }}>Member Since</Text>
                </View>
                <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '600', marginLeft: 28 }}>
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'N/A'}
                </Text>
              </View>
            </>
          )}
        </Card>

        {/* Request Statistics */}
        <Card style={{ marginBottom: 16, borderRadius: 16, padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 20 }}>Request Statistics</Text>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <View style={{ 
              width: '48%', 
              backgroundColor: theme.purpleLight, 
              padding: 16, 
              borderRadius: 12, 
              marginBottom: 12,
              borderWidth: 1,
              borderColor: theme.purple + '40'
            }}>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: theme.purple, marginBottom: 4 }}>{stats.totalRequests}</Text>
              <Text style={{ color: theme.purple, fontSize: 14, fontWeight: '500' }}>Total Requests</Text>
            </View>
            
            <View style={{ 
              width: '48%', 
              backgroundColor: theme.infoLight, 
              padding: 16, 
              borderRadius: 12, 
              marginBottom: 12,
              borderWidth: 1,
              borderColor: theme.info + '40'
            }}>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: theme.info, marginBottom: 4 }}>{stats.activeRequests}</Text>
              <Text style={{ color: theme.info, fontSize: 14, fontWeight: '500' }}>Active Requests</Text>
            </View>
            
            <View style={{ 
              width: '48%', 
              backgroundColor: theme.tealLight, 
              padding: 16, 
              borderRadius: 12, 
              marginBottom: 12,
              borderWidth: 1,
              borderColor: theme.teal + '40'
            }}>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: theme.teal, marginBottom: 4 }}>{stats.completedRequests}</Text>
              <Text style={{ color: theme.teal, fontSize: 14, fontWeight: '500' }}>Completed</Text>
            </View>
            
            <View style={{ 
              width: '48%', 
              backgroundColor: theme.error + '20', 
              padding: 16, 
              borderRadius: 12, 
              marginBottom: 12,
              borderWidth: 1,
              borderColor: theme.error + '40'
            }}>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: theme.error, marginBottom: 4 }}>{stats.cancelledRequests}</Text>
              <Text style={{ color: theme.error, fontSize: 14, fontWeight: '500' }}>Cancelled</Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <Card style={{ marginBottom: 16, borderRadius: 16, padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 20 }}>Quick Actions</Text>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateRequest')}
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              paddingVertical: 16, 
              paddingHorizontal: 12,
              backgroundColor: theme.surface,
              borderRadius: 12,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: theme.borderLight
            }}
          >
            <View style={{ backgroundColor: theme.pinkLight, padding: 12, borderRadius: 50, marginRight: 16 }}>
              <Ionicons name="add-circle" size={24} color={theme.pink} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginBottom: 2 }}>Create New Request</Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary }}>Get help from nearby volunteers</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('RequestStatus')}
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              paddingVertical: 16, 
              paddingHorizontal: 12,
              backgroundColor: theme.surface,
              borderRadius: 12,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: theme.borderLight
            }}
          >
            <View style={{ backgroundColor: theme.infoLight, padding: 12, borderRadius: 50, marginRight: 16 }}>
              <Ionicons name="list" size={24} color={theme.info} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginBottom: 2 }}>View My Requests</Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary }}>Track your assistance requests</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('Map')}
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              paddingVertical: 16, 
              paddingHorizontal: 12,
              backgroundColor: theme.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.borderLight
            }}
          >
            <View style={{ backgroundColor: theme.tealLight, padding: 12, borderRadius: 50, marginRight: 16 }}>
              <Ionicons name="map" size={24} color={theme.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginBottom: 2 }}>Find Nearby Help</Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary }}>Locate volunteers and services</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </Card>

        {/* App Information */}
        <Card style={{ marginBottom: 16, borderRadius: 16, padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 20 }}>App Information</Text>
          
          <TouchableOpacity 
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              paddingVertical: 16, 
              borderBottomWidth: 1, 
              borderBottomColor: theme.borderLight 
            }}
          >
            <View style={{ backgroundColor: theme.primary + '20', padding: 10, borderRadius: 8, marginRight: 16 }}>
              <Ionicons name="help-circle-outline" size={24} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginBottom: 2 }}>Help & Support</Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary }}>Get assistance and FAQ</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              paddingVertical: 16, 
              borderBottomWidth: 1, 
              borderBottomColor: theme.borderLight 
            }}
          >
            <View style={{ backgroundColor: theme.warning + '20', padding: 10, borderRadius: 8, marginRight: 16 }}>
              <Ionicons name="document-text-outline" size={24} color={theme.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginBottom: 2 }}>Terms & Conditions</Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary }}>Read our terms of service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              paddingVertical: 16 
            }}
          >
            <View style={{ backgroundColor: theme.success + '20', padding: 10, borderRadius: 8, marginRight: 16 }}>
              <Ionicons name="shield-checkmark-outline" size={24} color={theme.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginBottom: 2 }}>Privacy Policy</Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary }}>How we protect your data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </Card>

        {/* Sign Out */}
        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="danger"
          style={{ marginBottom: 32 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default PilgrimProfile;
