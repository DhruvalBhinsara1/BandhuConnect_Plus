import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRequest } from '../../context/RequestContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { COLORS, STATUS_COLORS, REQUEST_TYPES } from '../../constants';

const PilgrimDashboard: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { requests, getRequests } = useRequest();
  
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    await getRequests({ userId: user.id });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const myRequests = requests.filter(r => r.user_id === user?.id);
  const activeRequests = myRequests.filter(r => 
    ['pending', 'assigned', 'in_progress'].includes(r.status)
  );
  const completedRequests = myRequests.filter(r => r.status === 'completed');

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View className="bg-green-600 px-6 py-8">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-white text-2xl font-bold">Welcome,</Text>
              <Text className="text-green-100 text-lg">{user?.name}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Ionicons name="person-circle-outline" size={32} color="white" />
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View className="flex-row justify-between">
            <View className="bg-white bg-opacity-20 px-4 py-3 rounded-lg flex-1 mr-2">
              <Text className="text-white text-2xl font-bold">{activeRequests.length}</Text>
              <Text className="text-green-100 text-sm">Active Requests</Text>
            </View>
            <View className="bg-white bg-opacity-20 px-4 py-3 rounded-lg flex-1 ml-2">
              <Text className="text-white text-2xl font-bold">{completedRequests.length}</Text>
              <Text className="text-green-100 text-sm">Completed</Text>
            </View>
          </View>
        </View>

        <View className="px-6 py-4">
          {/* Quick Request Actions */}
          <Card style={{ marginBottom: 24 }}>
            <Text className="text-lg font-bold text-gray-900 mb-4">Need Help?</Text>
            
            <View className="flex-row flex-wrap justify-between">
              {REQUEST_TYPES.slice(0, 4).map((type) => (
                <TouchableOpacity
                  key={type.value}
                  onPress={() => navigation.navigate('CreateRequest', { type: type.value })}
                  className="items-center w-1/2 mb-4"
                >
                  <View className="bg-green-100 p-4 rounded-full mb-2">
                    <Ionicons name={type.icon as any} size={24} color={COLORS.secondary} />
                  </View>
                  <Text className="text-gray-700 text-sm text-center">{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title="Create Custom Request"
              onPress={() => navigation.navigate('CreateRequest')}
              variant="outline"
              style={{ marginTop: 8 }}
            />
          </Card>

          {/* Active Requests */}
          {activeRequests.length > 0 && (
            <Card style={{ marginBottom: 24 }}>
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-gray-900">Active Requests</Text>
                <TouchableOpacity onPress={() => navigation.navigate('RequestStatus')}>
                  <Text className="text-green-600 font-semibold">View All</Text>
                </TouchableOpacity>
              </View>

              {activeRequests.slice(0, 3).map((request) => (
                <TouchableOpacity
                  key={request.id}
                  onPress={() => navigation.navigate('RequestStatus', { requestId: request.id })}
                  className="border-b border-gray-200 py-3 last:border-b-0"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900 mb-1">
                        {request.title}
                      </Text>
                      <Text className="text-gray-600 text-sm mb-2">
                        {request.description}
                      </Text>
                      <View className="flex-row items-center">
                        <View
                          className="px-2 py-1 rounded-full mr-2"
                          style={{ backgroundColor: STATUS_COLORS[request.status] + '20' }}
                        >
                          <Text
                            className="text-xs font-medium capitalize"
                            style={{ color: STATUS_COLORS[request.status] }}
                          >
                            {request.status.replace('_', ' ')}
                          </Text>
                        </View>
                        <Text className="text-gray-500 text-xs">
                          {new Date(request.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                  </View>
                </TouchableOpacity>
              ))}
            </Card>
          )}

          {/* Recent Activity */}
          {completedRequests.length > 0 && (
            <Card style={{ marginBottom: 24 }}>
              <Text className="text-lg font-bold text-gray-900 mb-4">Recent Activity</Text>
              
              {completedRequests.slice(0, 2).map((request) => (
                <View
                  key={request.id}
                  className="border-b border-gray-200 py-3 last:border-b-0"
                >
                  <View className="flex-row items-center">
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                    <View className="flex-1 ml-3">
                      <Text className="font-medium text-gray-900">
                        {request.title}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        Completed on {new Date(request.updated_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <Text className="text-lg font-bold text-gray-900 mb-4">Quick Actions</Text>
            
            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => navigation.navigate('CreateRequest')}
                className="items-center flex-1"
              >
                <View className="bg-green-100 p-3 rounded-full mb-2">
                  <Ionicons name="add-circle" size={24} color={COLORS.secondary} />
                </View>
                <Text className="text-gray-700 text-sm text-center">New Request</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('RequestStatus')}
                className="items-center flex-1"
              >
                <View className="bg-blue-100 p-3 rounded-full mb-2">
                  <Ionicons name="list" size={24} color={COLORS.primary} />
                </View>
                <Text className="text-gray-700 text-sm text-center">My Requests</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('Map')}
                className="items-center flex-1"
              >
                <View className="bg-purple-100 p-3 rounded-full mb-2">
                  <Ionicons name="map" size={24} color="#8b5cf6" />
                </View>
                <Text className="text-gray-700 text-sm text-center">Find Help</Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Emergency Contact */}
          <Card style={{ marginTop: 16, backgroundColor: '#fef2f2' }}>
            <View className="flex-row items-center">
              <Ionicons name="warning" size={24} color={COLORS.error} />
              <View className="flex-1 ml-3">
                <Text className="font-bold text-red-800">Emergency?</Text>
                <Text className="text-red-600 text-sm">
                  For immediate assistance, call emergency services
                </Text>
              </View>
              <Button
                title="Call 911"
                onPress={() => {/* Handle emergency call */}}
                variant="danger"
                size="small"
              />
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PilgrimDashboard;
