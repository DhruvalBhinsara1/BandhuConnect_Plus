import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { COLORS, VOLUNTEER_SKILLS } from '../../constants';

const VolunteerProfile: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, updateProfile, signOut } = useAuth();
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    skills: user?.skills || [],
    status: user?.status || 'available',
  });

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await updateProfile({
        name: formData.name,
        phone: formData.phone,
        skills: formData.skills,
        status: formData.status,
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

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-gray-900">Profile</Text>
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
              <Ionicons name="person" size={32} color={COLORS.primary} />
            </View>
            <Text className="text-xl font-bold text-gray-900">{user?.name}</Text>
            <Text className="text-gray-600">{user?.email}</Text>
            <View className="flex-row items-center mt-2">
              <View
                className="px-3 py-1 rounded-full"
                style={{ 
                  backgroundColor: user?.is_active ? COLORS.success + '20' : COLORS.error + '20' 
                }}
              >
                <Text
                  className="text-sm font-medium"
                  style={{ 
                    color: user?.is_active ? COLORS.success : COLORS.error 
                  }}
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

              <View className="mb-4">
                <Text className="text-gray-700 text-sm font-medium mb-2">Status</Text>
                <View className="flex-row">
                  {['available', 'busy', 'off_duty'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      onPress={() => setFormData(prev => ({ ...prev, status }))}
                      className={`mr-3 px-4 py-2 rounded-full border ${
                        formData.status === status
                          ? 'bg-blue-500 border-blue-500'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text className={`text-sm capitalize ${
                        formData.status === status ? 'text-white' : 'text-gray-700'
                      }`}>
                        {status.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ) : (
            <View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-600">Phone</Text>
                <Text className="text-gray-900">{user?.phone}</Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-600">Status</Text>
                <Text className="text-gray-900 capitalize">
                  {user?.status?.replace('_', ' ')}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Role</Text>
                <Text className="text-gray-900 capitalize">{user?.role}</Text>
              </View>
            </View>
          )}
        </Card>

        {/* Skills */}
        <Card style={{ marginBottom: 16 }}>
          <Text className="text-lg font-bold text-gray-900 mb-4">Skills</Text>
          
          {editing ? (
            <View className="flex-row flex-wrap">
              {VOLUNTEER_SKILLS.map((skill) => (
                <TouchableOpacity
                  key={skill}
                  onPress={() => toggleSkill(skill)}
                  className={`mr-2 mb-2 px-3 py-2 rounded-full border ${
                    formData.skills.includes(skill)
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <Text className={`text-sm ${
                    formData.skills.includes(skill) ? 'text-white' : 'text-gray-700'
                  }`}>
                    {skill}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="flex-row flex-wrap">
              {user?.skills?.map((skill) => (
                <View
                  key={skill}
                  className="bg-blue-100 px-3 py-2 rounded-full mr-2 mb-2"
                >
                  <Text className="text-blue-800 text-sm">{skill}</Text>
                </View>
              )) || (
                <Text className="text-gray-500">No skills added</Text>
              )}
            </View>
          )}
        </Card>

        {/* Statistics */}
        <Card style={{ marginBottom: 16 }}>
          <Text className="text-lg font-bold text-gray-900 mb-4">Statistics</Text>
          
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text className="text-gray-700 ml-2">Tasks Completed</Text>
            </View>
            <Text className="text-gray-900 font-semibold">12</Text>
          </View>

          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center">
              <Ionicons name="time" size={20} color={COLORS.warning} />
              <Text className="text-gray-700 ml-2">Hours Worked</Text>
            </View>
            <Text className="text-gray-900 font-semibold">48h</Text>
          </View>

          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Ionicons name="star" size={20} color={COLORS.warning} />
              <Text className="text-gray-700 ml-2">Rating</Text>
            </View>
            <Text className="text-gray-900 font-semibold">4.8/5</Text>
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
                  skills: user?.skills || [],
                  status: user?.status || 'available',
                });
              }}
              variant="outline"
              style={{ flex: 1 }}
            />
          </View>
        ) : (
          <View className="space-y-3 mb-8">
            <Button
              title="View My Tasks"
              onPress={() => navigation.navigate('TaskList')}
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

export default VolunteerProfile;
