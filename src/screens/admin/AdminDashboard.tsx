import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRequest } from '../../context/RequestContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { COLORS, STATUS_COLORS } from '../../constants';
import { AdminStats } from '../../types';

const AdminDashboard: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { requests, assignments, getRequests, getAssignments } = useRequest();
  
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    totalVolunteers: 0,
    activeVolunteers: 0,
    pendingRequests: 0,
    completedRequests: 0,
    totalRequests: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [requests, assignments]);

  const loadDashboardData = async () => {
    await Promise.all([
      getRequests(),
      getAssignments(),
    ]);
  };

  const calculateStats = () => {
    const pending = requests.filter(r => r.status === 'pending').length;
    const completed = requests.filter(r => r.status === 'completed').length;
    
    setStats({
      totalVolunteers: 25, // Mock data
      activeVolunteers: 18, // Mock data
      pendingRequests: pending,
      completedRequests: completed,
      totalRequests: requests.length,
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const recentRequests = requests.slice(0, 5);
  const activeAssignments = assignments.filter(a => 
    ['assigned', 'accepted', 'on_duty'].includes(a.status)
  ).slice(0, 3);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View className="bg-blue-600 px-6 py-8">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-white text-2xl font-bold">Admin Dashboard</Text>
              <Text className="text-blue-100 text-lg">Welcome, {user?.name}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Ionicons name="person-circle-outline" size={32} color="white" />
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View className="flex-row justify-between">
            <View className="bg-white bg-opacity-20 px-4 py-3 rounded-lg flex-1 mr-2">
              <Text className="text-white text-2xl font-bold">{stats.activeVolunteers}</Text>
              <Text className="text-blue-100 text-sm">Active Volunteers</Text>
            </View>
            <View className="bg-white bg-opacity-20 px-4 py-3 rounded-lg flex-1 ml-2">
              <Text className="text-white text-2xl font-bold">{stats.pendingRequests}</Text>
              <Text className="text-blue-100 text-sm">Pending Requests</Text>
            </View>
          </View>
        </View>

        <View className="px-6 py-4">
          {/* Stats Grid */}
          <View className="flex-row flex-wrap justify-between mb-6">
            <Card style={{ width: '48%', marginBottom: 16 }}>
              <View className="items-center">
                <Ionicons name="people" size={32} color={COLORS.primary} />
                <Text className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.totalVolunteers}
                </Text>
                <Text className="text-gray-600">Total Volunteers</Text>
              </View>
            </Card>

            <Card style={{ width: '48%', marginBottom: 16 }}>
              <View className="items-center">
                <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
                <Text className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.completedRequests}
                </Text>
                <Text className="text-gray-600">Completed</Text>
              </View>
            </Card>

            <Card style={{ width: '48%' }}>
              <View className="items-center">
                <Ionicons name="list" size={32} color={COLORS.warning} />
                <Text className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.totalRequests}
                </Text>
                <Text className="text-gray-600">Total Requests</Text>
              </View>
            </Card>

            <Card style={{ width: '48%' }}>
              <View className="items-center">
                <Ionicons name="time" size={32} color={COLORS.error} />
                <Text className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.pendingRequests}
                </Text>
                <Text className="text-gray-600">Pending</Text>
              </View>
            </Card>
          </View>

          {/* Recent Requests */}
          <Card style={{ marginBottom: 24 }}>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-900">Recent Requests</Text>
              <TouchableOpacity onPress={() => navigation.navigate('RequestManagement')}>
                <Text className="text-blue-600 font-semibold">View All</Text>
              </TouchableOpacity>
            </View>

            {recentRequests.length > 0 ? (
              recentRequests.map((request) => (
                <TouchableOpacity
                  key={request.id}
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
                            {request.status}
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
              ))
            ) : (
              <Text className="text-gray-500 text-center py-4">No recent requests</Text>
            )}
          </Card>

          {/* Active Assignments */}
          {activeAssignments.length > 0 && (
            <Card style={{ marginBottom: 24 }}>
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-gray-900">Active Assignments</Text>
                <TouchableOpacity onPress={() => navigation.navigate('VolunteerManagement')}>
                  <Text className="text-blue-600 font-semibold">Manage</Text>
                </TouchableOpacity>
              </View>

              {activeAssignments.map((assignment) => (
                <View
                  key={assignment.id}
                  className="border-b border-gray-200 py-3 last:border-b-0"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900 mb-1">
                        {assignment.volunteer?.name}
                      </Text>
                      <Text className="text-gray-600 text-sm mb-2">
                        {assignment.request?.title}
                      </Text>
                      <View
                        className="px-2 py-1 rounded-full self-start"
                        style={{ backgroundColor: STATUS_COLORS[assignment.status] + '20' }}
                      >
                        <Text
                          className="text-xs font-medium capitalize"
                          style={{ color: STATUS_COLORS[assignment.status] }}
                        >
                          {assignment.status.replace('_', ' ')}
                        </Text>
                      </View>
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
                onPress={() => navigation.navigate('RequestManagement')}
                className="items-center flex-1"
              >
                <View className="bg-blue-100 p-3 rounded-full mb-2">
                  <Ionicons name="list" size={24} color={COLORS.primary} />
                </View>
                <Text className="text-gray-700 text-sm text-center">Manage Requests</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('VolunteerManagement')}
                className="items-center flex-1"
              >
                <View className="bg-green-100 p-3 rounded-full mb-2">
                  <Ionicons name="people" size={24} color={COLORS.secondary} />
                </View>
                <Text className="text-gray-700 text-sm text-center">Manage Volunteers</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('Map')}
                className="items-center flex-1"
              >
                <View className="bg-purple-100 p-3 rounded-full mb-2">
                  <Ionicons name="map" size={24} color="#8b5cf6" />
                </View>
                <Text className="text-gray-700 text-sm text-center">Live Map</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminDashboard;
