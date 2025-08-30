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
  const { user, updateProfile, signOut } = useAuth();
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
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-green-600 px-6 py-8">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white text-2xl font-bold">Profile</Text>
            <Text className="text-green-100">{user?.name}</Text>
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

      <ScrollView className="flex-1 px-6 py-4">
        {/* Profile Information */}
        <Card style={{ marginBottom: 16 }}>
          <Text className="text-lg font-bold text-gray-900 mb-4">Personal Information</Text>
          
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
              
              <View className="flex-row mt-4">
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
                <Text className="text-gray-600 text-sm">Full Name</Text>
                <Text className="text-gray-900 text-lg font-medium">{user?.name}</Text>
              </View>
              
              <View className="mb-4">
                <Text className="text-gray-600 text-sm">Email</Text>
                <Text className="text-gray-900 text-lg font-medium">{user?.email}</Text>
              </View>
              
              <View className="mb-4">
                <Text className="text-gray-600 text-sm">Phone Number</Text>
                <Text className="text-gray-900 text-lg font-medium">{user?.phone}</Text>
              </View>
              
              <View className="mb-4">
                <Text className="text-gray-600 text-sm">Account Type</Text>
                <Text className="text-gray-900 text-lg font-medium capitalize">{user?.role}</Text>
              </View>
              
              <View>
                <Text className="text-gray-600 text-sm">Member Since</Text>
                <Text className="text-gray-900 text-lg font-medium">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
            </>
          )}
        </Card>

        {/* Request Statistics */}
        <Card style={{ marginBottom: 16 }}>
          <Text className="text-lg font-bold text-gray-900 mb-4">Request Statistics</Text>
          
          <View className="flex-row flex-wrap justify-between">
            <View className="w-1/2 mb-4">
              <Text className="text-2xl font-bold text-green-600">{stats.totalRequests}</Text>
              <Text className="text-gray-600">Total Requests</Text>
            </View>
            
            <View className="w-1/2 mb-4">
              <Text className="text-2xl font-bold text-blue-600">{stats.activeRequests}</Text>
              <Text className="text-gray-600">Active Requests</Text>
            </View>
            
            <View className="w-1/2 mb-4">
              <Text className="text-2xl font-bold text-green-600">{stats.completedRequests}</Text>
              <Text className="text-gray-600">Completed</Text>
            </View>
            
            <View className="w-1/2 mb-4">
              <Text className="text-2xl font-bold text-red-600">{stats.cancelledRequests}</Text>
              <Text className="text-gray-600">Cancelled</Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <Card style={{ marginBottom: 16 }}>
          <Text className="text-lg font-bold text-gray-900 mb-4">Quick Actions</Text>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateRequest')}
            className="flex-row items-center py-3 border-b border-gray-200"
          >
            <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
            <Text className="text-gray-700 text-lg ml-3">Create New Request</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} className="ml-auto" />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('RequestStatus')}
            className="flex-row items-center py-3 border-b border-gray-200"
          >
            <Ionicons name="list-outline" size={24} color={COLORS.primary} />
            <Text className="text-gray-700 text-lg ml-3">View My Requests</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} className="ml-auto" />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('Map')}
            className="flex-row items-center py-3"
          >
            <Ionicons name="map-outline" size={24} color={COLORS.primary} />
            <Text className="text-gray-700 text-lg ml-3">Find Nearby Help</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} className="ml-auto" />
          </TouchableOpacity>
        </Card>

        {/* App Information */}
        <Card style={{ marginBottom: 16 }}>
          <Text className="text-lg font-bold text-gray-900 mb-4">App Information</Text>
          
          <TouchableOpacity className="flex-row items-center py-3 border-b border-gray-200">
            <Ionicons name="help-circle-outline" size={24} color={COLORS.textSecondary} />
            <Text className="text-gray-700 text-lg ml-3">Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} className="ml-auto" />
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center py-3 border-b border-gray-200">
            <Ionicons name="document-text-outline" size={24} color={COLORS.textSecondary} />
            <Text className="text-gray-700 text-lg ml-3">Terms & Conditions</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} className="ml-auto" />
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center py-3">
            <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.textSecondary} />
            <Text className="text-gray-700 text-lg ml-3">Privacy Policy</Text>
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
