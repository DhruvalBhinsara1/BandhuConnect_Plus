import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRequest } from '../../context/RequestContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { COLORS } from '../../constants';

const PilgrimProfile: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, updateProfile, signOut, selectedRole } = useAuth();
  const { requests, getRequests } = useRequest();
  
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
      const result = await updateProfile(user?.id || '', formData);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#059669', paddingHorizontal: 24, paddingVertical: 32 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>Profile</Text>
            <Text style={{ color: '#bbf7d0' }}>{user?.name}</Text>
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

      <ScrollView style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 16 }}>
        {/* Profile Information */}
        <Card style={{ marginBottom: 16, backgroundColor: '#ffffff', borderRadius: 16, padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>Personal Information</Text>
            {!editing && (
              <TouchableOpacity 
                onPress={() => setEditing(true)}
                style={{ backgroundColor: '#f3f4f6', padding: 8, borderRadius: 8 }}
              >
                <Ionicons name="create-outline" size={20} color="#6b7280" />
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
                  <Ionicons name="person" size={20} color="#6b7280" />
                  <Text style={{ color: '#6b7280', fontSize: 14, marginLeft: 8, fontWeight: '500' }}>Full Name</Text>
                </View>
                <Text style={{ color: '#111827', fontSize: 18, fontWeight: '600', marginLeft: 28 }}>{user?.name}</Text>
              </View>
              
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="mail" size={20} color="#6b7280" />
                  <Text style={{ color: '#6b7280', fontSize: 14, marginLeft: 8, fontWeight: '500' }}>Email</Text>
                </View>
                <Text style={{ color: '#111827', fontSize: 18, fontWeight: '600', marginLeft: 28 }}>{user?.email}</Text>
              </View>
              
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="call" size={20} color="#6b7280" />
                  <Text style={{ color: '#6b7280', fontSize: 14, marginLeft: 8, fontWeight: '500' }}>Phone Number</Text>
                </View>
                <Text style={{ color: '#111827', fontSize: 18, fontWeight: '600', marginLeft: 28 }}>{user?.phone}</Text>
              </View>
              
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="shield-checkmark" size={20} color="#6b7280" />
                  <Text style={{ color: '#6b7280', fontSize: 14, marginLeft: 8, fontWeight: '500' }}>Account Type</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 28 }}>
                  <Text style={{ color: '#111827', fontSize: 18, fontWeight: '600', textTransform: 'capitalize' }}>{user?.role || selectedRole || 'Pilgrim'}</Text>
                  <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginLeft: 8 }}>
                    <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: '600' }}>Active</Text>
                  </View>
                </View>
              </View>
              
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="calendar" size={20} color="#6b7280" />
                  <Text style={{ color: '#6b7280', fontSize: 14, marginLeft: 8, fontWeight: '500' }}>Member Since</Text>
                </View>
                <Text style={{ color: '#111827', fontSize: 18, fontWeight: '600', marginLeft: 28 }}>
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
        <Card style={{ marginBottom: 16, backgroundColor: '#ffffff', borderRadius: 16, padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 20 }}>Request Statistics</Text>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <View style={{ 
              width: '48%', 
              backgroundColor: '#f0fdf4', 
              padding: 16, 
              borderRadius: 12, 
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#bbf7d0'
            }}>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#059669', marginBottom: 4 }}>{stats.totalRequests}</Text>
              <Text style={{ color: '#16a34a', fontSize: 14, fontWeight: '500' }}>Total Requests</Text>
            </View>
            
            <View style={{ 
              width: '48%', 
              backgroundColor: '#eff6ff', 
              padding: 16, 
              borderRadius: 12, 
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#bfdbfe'
            }}>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#2563eb', marginBottom: 4 }}>{stats.activeRequests}</Text>
              <Text style={{ color: '#2563eb', fontSize: 14, fontWeight: '500' }}>Active Requests</Text>
            </View>
            
            <View style={{ 
              width: '48%', 
              backgroundColor: '#ecfdf5', 
              padding: 16, 
              borderRadius: 12, 
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#a7f3d0'
            }}>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#059669', marginBottom: 4 }}>{stats.completedRequests}</Text>
              <Text style={{ color: '#16a34a', fontSize: 14, fontWeight: '500' }}>Completed</Text>
            </View>
            
            <View style={{ 
              width: '48%', 
              backgroundColor: '#fef2f2', 
              padding: 16, 
              borderRadius: 12, 
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#fecaca'
            }}>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#dc2626', marginBottom: 4 }}>{stats.cancelledRequests}</Text>
              <Text style={{ color: '#dc2626', fontSize: 14, fontWeight: '500' }}>Cancelled</Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <Card style={{ marginBottom: 16, backgroundColor: '#ffffff', borderRadius: 16, padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 20 }}>Quick Actions</Text>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateRequest')}
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              paddingVertical: 16, 
              paddingHorizontal: 12,
              backgroundColor: '#f0fdf4',
              borderRadius: 12,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#bbf7d0'
            }}
          >
            <View style={{ backgroundColor: '#dcfce7', padding: 12, borderRadius: 50, marginRight: 16 }}>
              <Ionicons name="add-circle" size={24} color={COLORS.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 }}>Create New Request</Text>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>Get help from nearby volunteers</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('RequestStatus')}
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              paddingVertical: 16, 
              paddingHorizontal: 12,
              backgroundColor: '#eff6ff',
              borderRadius: 12,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#bfdbfe'
            }}
          >
            <View style={{ backgroundColor: '#dbeafe', padding: 12, borderRadius: 50, marginRight: 16 }}>
              <Ionicons name="list" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 }}>View My Requests</Text>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>Track your assistance requests</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('Map')}
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              paddingVertical: 16, 
              paddingHorizontal: 12,
              backgroundColor: '#faf5ff',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#e9d5ff'
            }}
          >
            <View style={{ backgroundColor: '#ede9fe', padding: 12, borderRadius: 50, marginRight: 16 }}>
              <Ionicons name="map" size={24} color="#8b5cf6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 }}>Find Nearby Help</Text>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>Locate volunteers and services</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
        </Card>

        {/* App Information */}
        <Card style={{ marginBottom: 16, backgroundColor: '#ffffff', borderRadius: 16, padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 20 }}>App Information</Text>
          
          <TouchableOpacity 
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              paddingVertical: 16, 
              borderBottomWidth: 1, 
              borderBottomColor: '#f3f4f6' 
            }}
          >
            <View style={{ backgroundColor: '#f0f9ff', padding: 10, borderRadius: 8, marginRight: 16 }}>
              <Ionicons name="help-circle-outline" size={24} color="#0ea5e9" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 }}>Help & Support</Text>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>Get assistance and FAQ</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              paddingVertical: 16, 
              borderBottomWidth: 1, 
              borderBottomColor: '#f3f4f6' 
            }}
          >
            <View style={{ backgroundColor: '#fef3c7', padding: 10, borderRadius: 8, marginRight: 16 }}>
              <Ionicons name="document-text-outline" size={24} color="#f59e0b" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 }}>Terms & Conditions</Text>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>Read our terms of service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              paddingVertical: 16 
            }}
          >
            <View style={{ backgroundColor: '#f0fdf4', padding: 10, borderRadius: 8, marginRight: 16 }}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#22c55e" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 }}>Privacy Policy</Text>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>How we protect your data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
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
