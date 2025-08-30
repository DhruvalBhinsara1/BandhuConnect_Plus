import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRequest } from '../../context/RequestContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { COLORS, STATUS_COLORS } from '../../constants';
import { AssistanceRequest } from '../../types';

const RequestStatus: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { requests, getRequests } = useRequest();
  
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const specificRequestId = route.params?.requestId;

  useEffect(() => {
    loadRequests();
  }, [user]);

  const loadRequests = async () => {
    if (!user) return;
    await getRequests({ userId: user.id });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const getFilteredRequests = () => {
    const userRequests = requests.filter(r => r.user_id === user?.id);
    
    if (specificRequestId) {
      return userRequests.filter(r => r.id === specificRequestId);
    }

    switch (filter) {
      case 'active':
        return userRequests.filter(r => ['pending', 'assigned', 'in_progress'].includes(r.status));
      case 'completed':
        return userRequests.filter(r => r.status === 'completed');
      default:
        return userRequests;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'time-outline';
      case 'assigned':
        return 'person-outline';
      case 'in_progress':
        return 'play-circle-outline';
      case 'completed':
        return 'checkmark-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Your request is being reviewed';
      case 'assigned':
        return 'A volunteer has been assigned';
      case 'in_progress':
        return 'Volunteer is working on your request';
      case 'completed':
        return 'Request completed successfully';
      case 'cancelled':
        return 'Request was cancelled';
      default:
        return 'Status unknown';
    }
  };

  const renderRequestItem = ({ item }: { item: AssistanceRequest }) => (
    <Card style={{ marginBottom: 12 }}>
      <View className="mb-4">
        <View className="flex-row justify-between items-start mb-2">
          <Text className="font-bold text-gray-900 text-lg flex-1">
            {item.title}
          </Text>
          <View
            className="px-3 py-1 rounded-full ml-2"
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
        
        <Text className="text-gray-600 mb-3">{item.description}</Text>

        {/* Status Timeline */}
        <View className="bg-gray-50 p-3 rounded-lg mb-3">
          <View className="flex-row items-center mb-2">
            <Ionicons 
              name={getStatusIcon(item.status) as any} 
              size={20} 
              color={STATUS_COLORS[item.status]} 
            />
            <Text className="text-gray-700 font-medium ml-2">
              {getStatusMessage(item.status)}
            </Text>
          </View>
          <Text className="text-gray-500 text-sm">
            Last updated: {new Date(item.updated_at).toLocaleString()}
          </Text>
        </View>

        {/* Request Details */}
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center">
            <Ionicons name="flag" size={14} color={COLORS.textSecondary} />
            <Text className="text-gray-500 text-sm ml-1 capitalize">
              {item.priority} Priority
            </Text>
          </View>
          
          <View className="flex-row items-center">
            <Ionicons name="pricetag" size={14} color={COLORS.textSecondary} />
            <Text className="text-gray-500 text-sm ml-1 capitalize">
              {item.type.replace('_', ' ')}
            </Text>
          </View>
        </View>

        {item.photo_url && (
          <View className="mb-3">
            <Text className="text-gray-700 text-sm font-medium mb-2">Attached Photo</Text>
            <Image
              source={{ uri: item.photo_url }}
              className="w-full h-32 rounded-lg"
              resizeMode="cover"
            />
          </View>
        )}

        <Text className="text-gray-500 text-sm">
          Created: {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>

      <View className="flex-row justify-between">
        <Button
          title="View on Map"
          onPress={() => navigation.navigate('Map', { location: item.location })}
          variant="outline"
          size="small"
          style={{ flex: 1, marginRight: 8 }}
        />
        
        {item.status === 'pending' && (
          <Button
            title="Cancel Request"
            onPress={() => {/* Handle cancel request */}}
            variant="danger"
            size="small"
            style={{ flex: 1 }}
          />
        )}
        
        {item.status === 'completed' && (
          <Button
            title="Rate Service"
            onPress={() => {/* Handle rating */}}
            size="small"
            style={{ flex: 1 }}
          />
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
          <View className="flex-row items-center">
            {specificRequestId && (
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            )}
            <Text className="text-2xl font-bold text-gray-900 ml-2">
              {specificRequestId ? 'Request Details' : 'My Requests'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleRefresh}>
            <Ionicons name="refresh" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs - Only show if not viewing specific request */}
        {!specificRequestId && (
          <View className="flex-row mt-4">
            {[
              { key: 'all', label: 'All' },
              { key: 'active', label: 'Active' },
              { key: 'completed', label: 'Completed' }
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setFilter(tab.key as any)}
                className={`mr-4 pb-2 ${filter === tab.key ? 'border-b-2 border-green-500' : ''}`}
              >
                <Text className={`font-medium ${
                  filter === tab.key ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
              {filter === 'active' 
                ? 'You have no active requests'
                : filter === 'completed'
                ? 'No completed requests yet'
                : 'You haven\'t submitted any requests yet'
              }
            </Text>
            {!specificRequestId && (
              <Button
                title="Create Request"
                onPress={() => navigation.navigate('CreateRequest')}
                style={{ marginTop: 16 }}
              />
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default RequestStatus;
