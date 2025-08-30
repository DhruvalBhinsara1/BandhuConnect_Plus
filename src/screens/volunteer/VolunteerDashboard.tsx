import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRequest } from '../../context/RequestContext';
import { useLocation } from '../../context/LocationContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { assignmentService } from '../../services/assignmentService';
import { COLORS, STATUS_COLORS } from '../../constants';
import { VolunteerStats } from '../../types';

const VolunteerDashboard: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { assignments, getAssignments } = useRequest();
  const { currentLocation, startTracking, stopTracking, isTracking } = useLocation();
  
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<VolunteerStats>({
    totalTasks: 0,
    completedTasks: 0,
    activeAssignments: 0,
    hoursWorked: 0,
  });
  const [isOnDuty, setIsOnDuty] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  useEffect(() => {
    if (assignments.length > 0) {
      calculateStats();
    }
  }, [assignments]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    await getAssignments({ volunteerId: user.id });
  };

  const calculateStats = () => {
    const completed = assignments.filter(a => a.status === 'completed').length;
    const active = assignments.filter(a => ['assigned', 'accepted', 'on_duty'].includes(a.status)).length;
    
    setStats({
      totalTasks: assignments.length,
      completedTasks: completed,
      activeAssignments: active,
      hoursWorked: Math.floor(Math.random() * 40), // Mock data for demo
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const toggleDutyStatus = async () => {
    if (isOnDuty) {
      stopTracking();
      setIsOnDuty(false);
    } else {
      await startTracking();
      setIsOnDuty(true);
    }
  };

  const activeAssignments = assignments.filter(a => 
    ['assigned', 'accepted', 'on_duty'].includes(a.status)
  );

  const recentAssignments = assignments.slice(0, 3);

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
              <Text className="text-white text-2xl font-bold">Welcome back,</Text>
              <Text className="text-blue-100 text-lg">{user?.name}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Ionicons name="person-circle-outline" size={32} color="white" />
            </TouchableOpacity>
          </View>

          {/* Duty Status Toggle */}
          <Card style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-white text-lg font-semibold">
                  {isOnDuty ? 'On Duty' : 'Off Duty'}
                </Text>
                <Text className="text-blue-100">
                  {isOnDuty ? 'Location tracking active' : 'Tap to start duty'}
                </Text>
              </View>
              <Button
                title={isOnDuty ? 'Check Out' : 'Check In'}
                onPress={toggleDutyStatus}
                variant={isOnDuty ? 'danger' : 'secondary'}
                size="small"
              />
            </View>
          </Card>
        </View>

        <View className="px-6 py-4">
          {/* Stats Cards */}
          <View className="flex-row flex-wrap justify-between mb-6">
            <Card style={{ width: '48%', marginBottom: 16 }}>
              <View className="items-center">
                <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
                <Text className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.completedTasks}
                </Text>
                <Text className="text-gray-600">Completed</Text>
              </View>
            </Card>

            <Card style={{ width: '48%', marginBottom: 16 }}>
              <View className="items-center">
                <Ionicons name="time" size={32} color={COLORS.warning} />
                <Text className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.activeAssignments}
                </Text>
                <Text className="text-gray-600">Active Tasks</Text>
              </View>
            </Card>

            <Card style={{ width: '48%' }}>
              <View className="items-center">
                <Ionicons name="list" size={32} color={COLORS.primary} />
                <Text className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.totalTasks}
                </Text>
                <Text className="text-gray-600">Total Tasks</Text>
              </View>
            </Card>

            <Card style={{ width: '48%' }}>
              <View className="items-center">
                <Ionicons name="timer" size={32} color={COLORS.secondary} />
                <Text className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.hoursWorked}h
                </Text>
                <Text className="text-gray-600">Hours Worked</Text>
              </View>
            </Card>
          </View>

          {/* Active Assignments */}
          {activeAssignments.length > 0 && (
            <Card style={{ marginBottom: 24 }}>
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-gray-900">Active Tasks</Text>
                <TouchableOpacity onPress={() => navigation.navigate('TaskList')}>
                  <Text className="text-blue-600 font-semibold">View All</Text>
                </TouchableOpacity>
              </View>

              {activeAssignments.slice(0, 2).map((assignment) => (
                <TouchableOpacity
                  key={assignment.id}
                  onPress={() => navigation.navigate('TaskDetails', { assignmentId: assignment.id })}
                  className="border-b border-gray-200 py-3 last:border-b-0"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900 mb-1">
                        {assignment.request?.title}
                      </Text>
                      <Text className="text-gray-600 text-sm mb-2">
                        {assignment.request?.description}
                      </Text>
                      <View className="flex-row items-center">
                        <View
                          className="px-2 py-1 rounded-full mr-2"
                          style={{ backgroundColor: STATUS_COLORS[assignment.status] + '20' }}
                        >
                          <Text
                            className="text-xs font-medium capitalize"
                            style={{ color: STATUS_COLORS[assignment.status] }}
                          >
                            {assignment.status.replace('_', ' ')}
                          </Text>
                        </View>
                        <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                        <Text className="text-gray-500 text-xs ml-1">
                          {assignment.request?.location ? '0.5 km away' : 'Location pending'}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                  </View>
                </TouchableOpacity>
              ))}
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <Text className="text-lg font-bold text-gray-900 mb-4">Quick Actions</Text>
            
            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => navigation.navigate('TaskList')}
                className="items-center flex-1"
              >
                <View className="bg-blue-100 p-3 rounded-full mb-2">
                  <Ionicons name="list" size={24} color={COLORS.primary} />
                </View>
                <Text className="text-gray-700 text-sm text-center">View Tasks</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('Map')}
                className="items-center flex-1"
              >
                <View className="bg-green-100 p-3 rounded-full mb-2">
                  <Ionicons name="map" size={24} color={COLORS.secondary} />
                </View>
                <Text className="text-gray-700 text-sm text-center">Map View</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('Chat')}
                className="items-center flex-1"
              >
                <View className="bg-purple-100 p-3 rounded-full mb-2">
                  <Ionicons name="chatbubbles" size={24} color="#8b5cf6" />
                </View>
                <Text className="text-gray-700 text-sm text-center">Chat</Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Location Status */}
          {currentLocation && (
            <Card style={{ marginTop: 16 }}>
              <View className="flex-row items-center">
                <Ionicons name="location" size={20} color={COLORS.success} />
                <Text className="text-gray-700 ml-2">
                  Location: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                </Text>
              </View>
              <Text className="text-gray-500 text-sm mt-1">
                Last updated: {new Date().toLocaleTimeString()}
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default VolunteerDashboard;
