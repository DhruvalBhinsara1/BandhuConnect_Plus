import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRequest } from '../../context/RequestContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { COLORS, STATUS_COLORS } from '../../constants';
import { User, Assignment } from '../../types';

const VolunteerManagement: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { assignments, getAssignments } = useRequest();
  
  const [refreshing, setRefreshing] = useState(false);
  const [volunteers, setVolunteers] = useState<User[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'available' | 'busy'>('all');

  useEffect(() => {
    loadVolunteers();
  }, []);

  const loadVolunteers = async () => {
    // Mock volunteer data for demo
    const mockVolunteers: User[] = [
      {
        id: '1',
        user_id: '1',
        name: 'John Smith',
        email: 'john@example.com',
        phone: '+1234567890',
        role: 'volunteer',
        skills: ['First Aid', 'Medical'],
        status: 'available',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '2',
        user_id: '2',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        phone: '+1234567891',
        role: 'volunteer',
        skills: ['Security', 'Crowd Control'],
        status: 'on_duty',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '3',
        user_id: '3',
        name: 'Mike Davis',
        email: 'mike@example.com',
        phone: '+1234567892',
        role: 'volunteer',
        skills: ['Translation', 'Technical Support'],
        status: 'available',
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    
    setVolunteers(mockVolunteers);
    await getAssignments();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadVolunteers();
    setRefreshing(false);
  };

  const getFilteredVolunteers = () => {
    switch (filter) {
      case 'active':
        return volunteers.filter(v => v.is_active);
      case 'available':
        return volunteers.filter(v => v.status === 'available');
      case 'busy':
        return volunteers.filter(v => v.status === 'on_duty' || v.status === 'busy');
      default:
        return volunteers;
    }
  };

  const getVolunteerAssignments = (volunteerId: string) => {
    return assignments.filter(a => a.volunteer_id === volunteerId);
  };

  const handleToggleStatus = (volunteer: User) => {
    Alert.alert(
      'Update Status',
      `Change ${volunteer.name}'s status?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Toggle Active',
          onPress: () => {
            setVolunteers(prev => 
              prev.map(v => 
                v.id === volunteer.id 
                  ? { ...v, is_active: !v.is_active }
                  : v
              )
            );
          }
        }
      ]
    );
  };

  const renderVolunteerItem = ({ item }: { item: User }) => {
    const volunteerAssignments = getVolunteerAssignments(item.id);
    const activeAssignments = volunteerAssignments.filter(a => 
      ['assigned', 'accepted', 'on_duty'].includes(a.status)
    );

    return (
      <Card style={{ marginBottom: 12 }}>
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <Text className="font-bold text-gray-900 text-lg mr-2">
                {item.name}
              </Text>
              <View
                className="px-2 py-1 rounded-full"
                style={{ 
                  backgroundColor: item.is_active ? COLORS.success + '20' : COLORS.error + '20' 
                }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ 
                    color: item.is_active ? COLORS.success : COLORS.error 
                  }}
                >
                  {item.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            
            <Text className="text-gray-600 mb-2">{item.email}</Text>
            <Text className="text-gray-600 mb-2">{item.phone}</Text>
            
            <View className="flex-row items-center mb-2">
              <Text className="text-gray-500 text-sm mr-2">Status:</Text>
              <View
                className="px-2 py-1 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[item.status] + '20' }}
              >
                <Text
                  className="text-xs font-medium capitalize"
                  style={{ color: STATUS_COLORS[item.status] }}
                >
                  {item.status.replace('_', ' ')}
                </Text>
              </View>
            </View>

            {item.skills && item.skills.length > 0 && (
              <View className="flex-row flex-wrap mb-2">
                {item.skills.slice(0, 3).map((skill) => (
                  <View
                    key={skill}
                    className="bg-blue-100 px-2 py-1 rounded-full mr-1 mb-1"
                  >
                    <Text className="text-blue-800 text-xs">{skill}</Text>
                  </View>
                ))}
                {item.skills.length > 3 && (
                  <Text className="text-gray-500 text-xs">+{item.skills.length - 3} more</Text>
                )}
              </View>
            )}

            <View className="flex-row items-center">
              <Ionicons name="briefcase" size={14} color={COLORS.textSecondary} />
              <Text className="text-gray-500 text-sm ml-1">
                {activeAssignments.length} active task{activeAssignments.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => handleToggleStatus(item)}>
            <Ionicons name="ellipsis-vertical" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between">
          <Button
            title="View Tasks"
            onPress={() => {/* Navigate to volunteer tasks */}}
            variant="outline"
            size="small"
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button
            title="Assign Task"
            onPress={() => {/* Navigate to task assignment */}}
            size="small"
            style={{ flex: 1 }}
          />
        </View>
      </Card>
    );
  };

  const filteredVolunteers = getFilteredVolunteers();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-gray-900">Volunteer Management</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Ionicons name="refresh" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View className="flex-row mt-4">
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'available', label: 'Available' },
            { key: 'busy', label: 'Busy' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setFilter(tab.key as any)}
              className={`mr-4 pb-2 ${filter === tab.key ? 'border-b-2 border-blue-500' : ''}`}
            >
              <Text className={`font-medium ${
                filter === tab.key ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {tab.label} ({
                  tab.key === 'all' ? volunteers.length :
                  tab.key === 'active' ? volunteers.filter(v => v.is_active).length :
                  tab.key === 'available' ? volunteers.filter(v => v.status === 'available').length :
                  volunteers.filter(v => v.status === 'on_duty' || v.status === 'busy').length
                })
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Volunteer List */}
      <FlatList
        data={filteredVolunteers}
        renderItem={renderVolunteerItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Ionicons name="people-outline" size={64} color={COLORS.textSecondary} />
            <Text className="text-gray-500 text-lg mt-4">No volunteers found</Text>
            <Text className="text-gray-400 text-center mt-2">
              {filter === 'active' 
                ? 'No active volunteers at the moment'
                : filter === 'available'
                ? 'No available volunteers'
                : filter === 'busy'
                ? 'No busy volunteers'
                : 'No volunteers registered yet'
              }
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default VolunteerManagement;
