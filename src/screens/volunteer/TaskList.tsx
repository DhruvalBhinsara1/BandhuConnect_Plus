import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRequest } from '../../context/RequestContext';
import Card from '../../components/common/Card';
import { COLORS, STATUS_COLORS } from '../../constants';
import { Assignment } from '../../types';

const TaskList: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { assignments, getAssignments } = useRequest();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    loadTasks();
  }, [user]);

  const loadTasks = async () => {
    if (!user) return;
    await getAssignments({ volunteerId: user.id });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const getFilteredTasks = () => {
    switch (filter) {
      case 'active':
        return assignments.filter(a => ['assigned', 'accepted', 'on_duty'].includes(a.status));
      case 'completed':
        return assignments.filter(a => a.status === 'completed');
      default:
        return assignments;
    }
  };

  const renderTaskItem = ({ item }: { item: Assignment }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('TaskDetails', { assignmentId: item.id })}
    >
      <Card style={{ marginBottom: 12 }}>
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <Text className="font-bold text-gray-900 text-lg mb-1">
              {item.request?.title}
            </Text>
            <Text className="text-gray-600 mb-2">
              {item.request?.description}
            </Text>
          </View>
          <View
            className="px-3 py-1 rounded-full"
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

        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
            <Text className="text-gray-500 text-sm ml-1">
              {new Date(item.assigned_at).toLocaleDateString()}
            </Text>
          </View>
          
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
            <Text className="text-gray-500 text-sm ml-1">
              {item.request?.location ? '0.5 km away' : 'Location pending'}
            </Text>
          </View>
        </View>

        {item.request?.priority && (
          <View className="flex-row items-center mt-2">
            <Ionicons 
              name="flag" 
              size={16} 
              color={item.request.priority === 'high' ? COLORS.error : COLORS.warning} 
            />
            <Text className="text-sm ml-1 capitalize font-medium">
              {item.request.priority} Priority
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );

  const filteredTasks = getFilteredTasks();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-gray-900">My Tasks</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Ionicons name="refresh" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View className="flex-row mt-4">
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
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
                  tab.key === 'all' ? assignments.length :
                  tab.key === 'active' ? assignments.filter(a => ['assigned', 'accepted', 'on_duty'].includes(a.status)).length :
                  assignments.filter(a => a.status === 'completed').length
                })
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Ionicons name="list-outline" size={64} color={COLORS.textSecondary} />
            <Text className="text-gray-500 text-lg mt-4">No tasks found</Text>
            <Text className="text-gray-400 text-center mt-2">
              {filter === 'active' 
                ? 'You have no active tasks at the moment'
                : filter === 'completed'
                ? 'No completed tasks yet'
                : 'Tasks will appear here when assigned'
              }
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default TaskList;
