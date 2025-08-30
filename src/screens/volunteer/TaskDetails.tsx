import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, Alert, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRequest } from '../../context/RequestContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { COLORS, STATUS_COLORS } from '../../constants';
import { Assignment } from '../../types';

const TaskDetails: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { assignments, acceptAssignment, startTask, completeTask } = useRequest();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(false);

  const assignmentId = route.params?.assignmentId;

  useEffect(() => {
    if (assignmentId) {
      const foundAssignment = assignments.find(a => a.id === assignmentId);
      setAssignment(foundAssignment || null);
    }
  }, [assignmentId, assignments]);

  const handleAcceptTask = async () => {
    if (!assignment) return;

    setLoading(true);
    try {
      const { error } = await acceptAssignment(assignment.id);
      if (error) {
        Alert.alert('Error', 'Failed to accept task. Please try again.');
      } else {
        Alert.alert('Success', 'Task accepted successfully!');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = async () => {
    if (!assignment) return;

    setLoading(true);
    try {
      const { error } = await startTask(assignment.id);
      if (error) {
        Alert.alert('Error', 'Failed to start task. Please try again.');
      } else {
        Alert.alert('Success', 'Task started! You are now on duty.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!assignment) return;

    Alert.alert(
      'Complete Task',
      'Are you sure you want to mark this task as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await completeTask(assignment.id);
              if (error) {
                Alert.alert('Error', 'Failed to complete task. Please try again.');
              } else {
                Alert.alert('Success', 'Task completed successfully!');
                navigation.goBack();
              }
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getActionButton = () => {
    if (!assignment) return null;

    switch (assignment.status) {
      case 'assigned':
        return (
          <Button
            title="Accept Task"
            onPress={handleAcceptTask}
            loading={loading}
          />
        );
      case 'accepted':
        return (
          <Button
            title="Start Task"
            onPress={handleStartTask}
            loading={loading}
          />
        );
      case 'on_duty':
        return (
          <Button
            title="Complete Task"
            onPress={handleCompleteTask}
            loading={loading}
            variant="secondary"
          />
        );
      case 'completed':
        return (
          <View className="bg-green-100 p-4 rounded-lg">
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              <Text className="text-green-800 font-semibold ml-2">Task Completed</Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  if (!assignment) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-gray-500 text-lg">Task not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <Button
            title="←"
            onPress={() => navigation.goBack()}
            variant="outline"
            size="small"
            style={{ marginRight: 16, minWidth: 40 }}
          />
          <Text className="text-xl font-bold text-gray-900">Task Details</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {/* Status Card */}
        <Card style={{ marginBottom: 16 }}>
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-lg font-bold text-gray-900 mb-1">
                Current Status
              </Text>
              <View
                className="px-3 py-2 rounded-full self-start"
                style={{ backgroundColor: STATUS_COLORS[assignment.status] + '20' }}
              >
                <Text
                  className="font-medium capitalize"
                  style={{ color: STATUS_COLORS[assignment.status] }}
                >
                  {assignment.status.replace('_', ' ')}
                </Text>
              </View>
            </View>
            <Ionicons 
              name="information-circle" 
              size={32} 
              color={STATUS_COLORS[assignment.status]} 
            />
          </View>
        </Card>

        {/* Request Details */}
        <Card style={{ marginBottom: 16 }}>
          <Text className="text-lg font-bold text-gray-900 mb-4">Request Details</Text>
          
          <View className="mb-4">
            <Text className="text-gray-600 text-sm mb-1">Title</Text>
            <Text className="text-gray-900 font-semibold text-lg">
              {assignment.request?.title}
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-gray-600 text-sm mb-1">Description</Text>
            <Text className="text-gray-900">
              {assignment.request?.description}
            </Text>
          </View>

          <View className="flex-row justify-between mb-4">
            <View className="flex-1 mr-4">
              <Text className="text-gray-600 text-sm mb-1">Type</Text>
              <Text className="text-gray-900 capitalize">
                {assignment.request?.type?.replace('_', ' ')}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-600 text-sm mb-1">Priority</Text>
              <View className="flex-row items-center">
                <Ionicons 
                  name="flag" 
                  size={16} 
                  color={assignment.request?.priority === 'high' ? COLORS.error : COLORS.warning} 
                />
                <Text className="text-gray-900 capitalize ml-1">
                  {assignment.request?.priority}
                </Text>
              </View>
            </View>
          </View>

          {assignment.request?.photo_url && (
            <View className="mb-4">
              <Text className="text-gray-600 text-sm mb-2">Attached Photo</Text>
              <Image
                source={{ uri: assignment.request.photo_url }}
                className="w-full h-48 rounded-lg"
                resizeMode="cover"
              />
            </View>
          )}
        </Card>

        {/* Timeline */}
        <Card style={{ marginBottom: 16 }}>
          <Text className="text-lg font-bold text-gray-900 mb-4">Timeline</Text>
          
          <View className="space-y-3">
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-blue-500 rounded-full mr-3" />
              <View className="flex-1">
                <Text className="text-gray-900 font-medium">Task Assigned</Text>
                <Text className="text-gray-500 text-sm">
                  {new Date(assignment.assigned_at).toLocaleString()}
                </Text>
              </View>
            </View>

            {assignment.accepted_at && (
              <View className="flex-row items-center">
                <View className="w-3 h-3 bg-green-500 rounded-full mr-3" />
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium">Task Accepted</Text>
                  <Text className="text-gray-500 text-sm">
                    {new Date(assignment.accepted_at).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}

            {assignment.started_at && (
              <View className="flex-row items-center">
                <View className="w-3 h-3 bg-purple-500 rounded-full mr-3" />
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium">Task Started</Text>
                  <Text className="text-gray-500 text-sm">
                    {new Date(assignment.started_at).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}

            {assignment.completed_at && (
              <View className="flex-row items-center">
                <View className="w-3 h-3 bg-green-600 rounded-full mr-3" />
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium">Task Completed</Text>
                  <Text className="text-gray-500 text-sm">
                    {new Date(assignment.completed_at).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </Card>

        {/* Location */}
        {assignment.request?.location && (
          <Card style={{ marginBottom: 16 }}>
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold text-gray-900">Location</Text>
              <Button
                title="View on Map"
                onPress={() => navigation.navigate('Map', { 
                  location: assignment.request?.location 
                })}
                variant="outline"
                size="small"
              />
            </View>
            
            <View className="flex-row items-center">
              <Ionicons name="location" size={20} color={COLORS.primary} />
              <Text className="text-gray-600 ml-2">
                Lat: {assignment.request.location.latitude}, 
                Lng: {assignment.request.location.longitude}
              </Text>
            </View>
            <Text className="text-gray-500 text-sm mt-1">
              Estimated distance: 0.5 km
            </Text>
          </Card>
        )}

        {/* Action Button */}
        <View className="mb-8">
          {getActionButton()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TaskDetails;
