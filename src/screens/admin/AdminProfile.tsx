import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { COLORS } from '../../constants';

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
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-gray-900">Admin Profile</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Ionicons 
              name={editing ? "close" : "pencil"} 
              size={24} 
              color={COLORS.primary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {/* Profile Info */}
        <Card style={{ marginBottom: 16 }}>
          <View className="items-center mb-6">
            <View className="bg-blue-100 w-20 h-20 rounded-full items-center justify-center mb-3">
              <Ionicons name="shield-checkmark" size={32} color={COLORS.primary} />
            </View>
            <Text className="text-xl font-bold text-gray-900">{user?.name}</Text>
            <Text className="text-gray-600">{user?.email}</Text>
            <View className="flex-row items-center mt-2">
              <View className="bg-purple-100 px-3 py-1 rounded-full">
                <Text className="text-purple-800 text-sm font-medium">Administrator</Text>
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
            </View>
          ) : (
            <View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-600">Phone</Text>
                <Text className="text-gray-900">{user?.phone}</Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-600">Role</Text>
                <Text className="text-gray-900 capitalize">{user?.role}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Status</Text>
                <Text className="text-green-600 font-medium">Active</Text>
              </View>
            </View>
          )}
        </Card>

        {/* Admin Statistics */}
        <Card style={{ marginBottom: 16 }}>
          <Text className="text-lg font-bold text-gray-900 mb-4">Admin Statistics</Text>
          
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center">
              <Ionicons name="people" size={20} color={COLORS.primary} />
              <Text className="text-gray-700 ml-2">Volunteers Managed</Text>
            </View>
            <Text className="text-gray-900 font-semibold">25</Text>
          </View>

          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center">
              <Ionicons name="document-text" size={20} color={COLORS.secondary} />
              <Text className="text-gray-700 ml-2">Requests Processed</Text>
            </View>
            <Text className="text-gray-900 font-semibold">142</Text>
          </View>

          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text className="text-gray-700 ml-2">Tasks Completed</Text>
            </View>
            <Text className="text-gray-900 font-semibold">128</Text>
          </View>
        </Card>

        {/* System Information */}
        <Card style={{ marginBottom: 16 }}>
          <Text className="text-lg font-bold text-gray-900 mb-4">System Information</Text>
          
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-gray-600">App Version</Text>
            <Text className="text-gray-900">1.0.0</Text>
          </View>

          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-gray-600">Last Login</Text>
            <Text className="text-gray-900">{new Date().toLocaleDateString()}</Text>
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="text-gray-600">Account Created</Text>
            <Text className="text-gray-900">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
        </Card>

        {/* Actions */}
        {editing ? (
          <View className="flex-row space-x-3 mb-8">
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
                  phone: user?.phone || '',
                });
              }}
              variant="outline"
              style={{ flex: 1 }}
            />
          </View>
        ) : (
          <View className="space-y-3 mb-8">
            <Button
              title="Manage Volunteers"
              onPress={() => navigation.navigate('VolunteerManagement')}
              variant="outline"
              style={{ marginBottom: 12 }}
            />
            
            <Button
              title="Manage Requests"
              onPress={() => navigation.navigate('RequestManagement')}
              variant="outline"
              style={{ marginBottom: 12 }}
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

export default AdminProfile;
