import React, { useState } from 'react';
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
  const { requests } = useRequest();
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await updateProfile(formData);
      if (error) {
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
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>Personal Information</Text>
          
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
              <View className="mb-4">
                <Text style={{ color: '#4b5563', fontSize: 12 }}>Full Name</Text>
                <Text style={{ color: '#111827', fontSize: 18, fontWeight: '500' }}>{user?.name}</Text>
              </View>
              
              <View className="mb-4">
                <Text style={{ color: '#4b5563', fontSize: 12 }}>Email</Text>
                <Text style={{ color: '#111827', fontSize: 18, fontWeight: '500' }}>{user?.email}</Text>
              </View>
              
              <View className="mb-4">
                <Text style={{ color: '#4b5563', fontSize: 12 }}>Phone Number</Text>
                <Text style={{ color: '#111827', fontSize: 18, fontWeight: '500' }}>{user?.phone}</Text>
              </View>
              
              <View className="mb-4">
                <Text style={{ color: '#4b5563', fontSize: 12 }}>Account Type</Text>
                <Text style={{ color: '#111827', fontSize: 18, fontWeight: '500', textTransform: 'capitalize' }}>{user?.role || selectedRole || 'Pilgrim'}</Text>
              </View>
              
              <View>
                <Text style={{ color: '#4b5563', fontSize: 12 }}>Member Since</Text>
                <Text className="text-gray-900 text-lg font-medium">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
            </>
          )}
        </Card>

        {/* Request Statistics */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>Request Statistics</Text>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <View className="w-1/2 mb-4">
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#059669' }}>{stats.totalRequests}</Text>
              <Text style={{ color: '#4b5563' }}>Total Requests</Text>
            </View>
            
            <View className="w-1/2 mb-4">
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#2563eb' }}>{stats.activeRequests}</Text>
              <Text style={{ color: '#4b5563' }}>Active Requests</Text>
            </View>
            
            <View className="w-1/2 mb-4">
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#059669' }}>{stats.completedRequests}</Text>
              <Text style={{ color: '#4b5563' }}>Completed</Text>
            </View>
            
            <View className="w-1/2 mb-4">
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#dc2626' }}>{stats.cancelledRequests}</Text>
              <Text style={{ color: '#4b5563' }}>Cancelled</Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>Quick Actions</Text>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateRequest')}
            className="flex-row items-center py-3 border-b border-gray-200"
          >
            <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
            <Text style={{ color: '#374151', fontSize: 18, marginLeft: 12 }}>Create New Request</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} className="ml-auto" />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('RequestStatus')}
            className="flex-row items-center py-3 border-b border-gray-200"
          >
            <Ionicons name="list-outline" size={24} color={COLORS.primary} />
            <Text style={{ color: '#374151', fontSize: 18, marginLeft: 12 }}>View My Requests</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} className="ml-auto" />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('Map')}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}
          >
            <Ionicons name="map-outline" size={24} color={COLORS.primary} />
            <Text style={{ color: '#374151', fontSize: 18, marginLeft: 12 }}>Find Nearby Help</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} className="ml-auto" />
          </TouchableOpacity>
        </Card>

        {/* App Information */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>App Information</Text>
          
          <TouchableOpacity className="flex-row items-center py-3 border-b border-gray-200">
            <Ionicons name="help-circle-outline" size={24} color={COLORS.textSecondary} />
            <Text style={{ color: '#374151', fontSize: 18, marginLeft: 12 }}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} className="ml-auto" />
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center py-3 border-b border-gray-200">
            <Ionicons name="document-text-outline" size={24} color={COLORS.textSecondary} />
            <Text style={{ color: '#374151', fontSize: 18, marginLeft: 12 }}>Terms & Conditions</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} className="ml-auto" />
          </TouchableOpacity>
          
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
            <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.textSecondary} />
            <Text style={{ color: '#374151', fontSize: 18, marginLeft: 12 }}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} className="ml-auto" />
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
