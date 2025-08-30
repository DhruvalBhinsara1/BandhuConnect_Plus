import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRequest } from '../../context/RequestContext';
import { assignmentService } from '../../services/assignmentService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { COLORS, STATUS_COLORS, PRIORITY_LEVELS } from '../../constants';
import { AssistanceRequest } from '../../types';

const RequestManagement: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { requests, getRequests } = useRequest();
  
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'assigned' | 'completed'>('all');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    await getRequests();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const getFilteredRequests = () => {
    switch (filter) {
      case 'pending':
        return requests.filter(r => r.status === 'pending');
      case 'assigned':
        return requests.filter(r => r.status === 'assigned');
      case 'completed':
        return requests.filter(r => r.status === 'completed');
      default:
        return requests;
    }
  };

  const handleAssignVolunteer = async (requestId: string) => {
    // Mock volunteer assignment - in real app, show volunteer selection modal
    const mockVolunteerId = '1'; // This would come from volunteer selection
    
    try {
      const { error } = await assignmentService.createAssignment(requestId, mockVolunteerId);
      if (error) {
        Alert.alert('Error', 'Failed to assign volunteer. Please try again.');
      } else {
        Alert.alert('Success', 'Volunteer assigned successfully!');
        await loadRequests();
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  const getPriorityColor = (priority: string) => {
    const priorityLevel = PRIORITY_LEVELS.find(p => p.value === priority);
    return priorityLevel?.color || COLORS.textSecondary;
  };

  const renderRequestItem = ({ item }: { item: AssistanceRequest }) => (
    <Card style={{ marginBottom: 12 }}>
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <Text className="font-bold text-gray-900 text-lg mr-2">
              {item.title}
            </Text>
            <View
              className="px-2 py-1 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[item.status] + '20' }}
            >
              <Text
                className="text-xs font-medium capitalize"
                style={{ color: STATUS_COLORS[item.status] }}
              >
                {item.status}
              </Text>
            </View>
          </View>
          
          <Text className="text-gray-600 mb-2">{item.description}</Text>
          
          <View className="flex-row items-center mb-2">
            <Ionicons name="person" size={14} color={COLORS.textSecondary} />
            <Text className="text-gray-500 text-sm ml-1">
              {item.user?.name || 'Unknown User'}
            </Text>
          </View>

          <View className="flex-row items-center mb-2">
            <Ionicons name="flag" size={14} color={getPriorityColor(item.priority)} />
            <Text className="text-gray-500 text-sm ml-1 capitalize">
              {item.priority} Priority
            </Text>
          </View>

          <View className="flex-row items-center mb-2">
            <Ionicons name="pricetag" size={14} color={COLORS.textSecondary} />
            <Text className="text-gray-500 text-sm ml-1 capitalize">
              {item.type.replace('_', ' ')}
            </Text>
          </View>

          <View className="flex-row items-center">
            <Ionicons name="time" size={14} color={COLORS.textSecondary} />
            <Text className="text-gray-500 text-sm ml-1">
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </View>
        </View>

        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <View className="flex-row justify-between">
        {item.status === 'pending' ? (
          <>
            <Button
              title="View Details"
              onPress={() => {/* Navigate to request details */}}
              variant="outline"
              size="small"
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              title="Assign Volunteer"
              onPress={() => handleAssignVolunteer(item.id)}
              size="small"
              style={{ flex: 1 }}
            />
          </>
        ) : (
          <>
            <Button
              title="View Details"
              onPress={() => {/* Navigate to request details */}}
              variant="outline"
              size="small"
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              title="Track Progress"
              onPress={() => {/* Navigate to progress tracking */}}
              size="small"
              style={{ flex: 1 }}
            />
          </>
        )}
      </View>
    </Card>
  );

  const filteredRequests = getFilteredRequests();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-gray-900">Request Management</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Ionicons name="refresh" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View className="flex-row mt-4">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'assigned', label: 'Assigned' },
            { key: 'completed', label: 'Completed' }
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
                  tab.key === 'all' ? requests.length :
                  tab.key === 'pending' ? requests.filter(r => r.status === 'pending').length :
                  tab.key === 'assigned' ? requests.filter(r => r.status === 'assigned').length :
                  requests.filter(r => r.status === 'completed').length
                })
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Request List */}
      <FlatList
        data={filteredRequests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Ionicons name="document-text-outline" size={64} color={COLORS.textSecondary} />
            <Text className="text-gray-500 text-lg mt-4">No requests found</Text>
            <Text className="text-gray-400 text-center mt-2">
              {filter === 'pending' 
                ? 'No pending requests at the moment'
                : filter === 'assigned'
                ? 'No assigned requests'
                : filter === 'completed'
                ? 'No completed requests yet'
                : 'No requests have been submitted yet'
              }
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default RequestManagement;
