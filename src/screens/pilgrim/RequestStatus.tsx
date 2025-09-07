import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, RefreshControl, Image, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRequest } from '../../context/RequestContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useTheme } from '../../theme';
import { STATUS_COLORS } from '../../constants';
import { AssistanceRequest } from '../../types';

const RequestStatus: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { requests, getRequests, deleteRequest, cancelRequest } = useRequest();
  const { theme } = useTheme();
  
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

  const handleCancelRequest = async (requestId: string) => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this request? This will mark it as cancelled but keep it in your history.',
      [
        {
          text: 'No, Keep Request',
          style: 'cancel'
        },
        {
          text: 'Yes, Cancel Request',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await cancelRequest(requestId);
              if (error) {
                Alert.alert('Error', 'Failed to cancel request. Please try again.');
              } else {
                Alert.alert('Success', 'Request cancelled successfully.');
                await loadRequests(); // Refresh the list
              }
            } catch (error) {
              Alert.alert('Error', 'An unexpected error occurred.');
            }
          }
        }
      ]
    );
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
      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <Text style={{ fontWeight: 'bold', color: '#111827', fontSize: 18, flex: 1 }}>
            {item.title}
          </Text>
          <View
            style={{ 
              paddingHorizontal: 12, 
              paddingVertical: 4, 
              borderRadius: 50, 
              marginLeft: 8,
              backgroundColor: STATUS_COLORS[item.status] + '20' 
            }}
          >
            <Text
              style={{ 
                fontSize: 12, 
                fontWeight: '500', 
                textTransform: 'capitalize',
                color: STATUS_COLORS[item.status] 
              }}
            >
              {item.status.replace('_', ' ')}
            </Text>
          </View>
        </View>
        
        <Text style={{ color: '#6b7280', marginBottom: 12 }}>{item.description}</Text>

        {/* Status Timeline */}
        <View style={{ backgroundColor: '#f9fafb', padding: 12, borderRadius: 8, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons 
              name={getStatusIcon(item.status) as any} 
              size={20} 
              color={STATUS_COLORS[item.status]} 
            />
            <Text style={{ color: '#374151', fontWeight: '500', marginLeft: 8 }}>
              {getStatusMessage(item.status)}
            </Text>
          </View>
          <Text style={{ color: '#6b7280', fontSize: 14 }}>
            {item.created_at ? `Created: ${new Date(item.created_at).toLocaleDateString()}` : 'Date not available'}
          </Text>
        </View>

        {/* Request Details */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="flag" size={14} color={theme.textSecondary} />
            <Text style={{ color: theme.textSecondary, fontSize: 14, marginLeft: 4, textTransform: 'capitalize' }}>
              {item.priority} Priority
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="pricetag" size={14} color={theme.textSecondary} />
            <Text style={{ color: theme.textSecondary, fontSize: 14, marginLeft: 4, textTransform: 'capitalize' }}>
              {item.type.replace('_', ' ')}
            </Text>
          </View>
        </View>

        {item.photo_url && (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: '#374151', fontSize: 14, fontWeight: '500', marginBottom: 8 }}>Attached Photo</Text>
            <Image
              source={{ uri: item.photo_url }}
              style={{ width: '100%', height: 128, borderRadius: 8 }}
              resizeMode="cover"
            />
          </View>
        )}

        <Text style={{ color: '#6b7280', fontSize: 14 }}>
          Created: {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
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
            onPress={() => handleCancelRequest(item.id)}
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{ backgroundColor: 'white', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {specificRequestId && (
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color={theme.primary} />
              </TouchableOpacity>
            )}
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.textPrimary, marginLeft: 8 }}>
              {specificRequestId ? 'Request Details' : 'My Requests'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleRefresh}>
            <Ionicons name="refresh" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs - Only show if not viewing specific request */}
        {!specificRequestId && (
          <View style={{ flexDirection: 'row', marginTop: 16 }}>
            {[
              { key: 'all', label: 'All' },
              { key: 'active', label: 'Active' },
              { key: 'completed', label: 'Completed' }
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setFilter(tab.key as any)}
                style={{
                  marginRight: 16,
                  paddingBottom: 8,
                  borderBottomWidth: filter === tab.key ? 2 : 0,
                  borderBottomColor: filter === tab.key ? '#10b981' : 'transparent'
                }}
              >
                <Text style={{
                  fontWeight: '500',
                  color: filter === tab.key ? '#059669' : '#6b7280'
                }}>
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
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
            <Ionicons name="document-text-outline" size={64} color={theme.textSecondary} />
            <Text style={{ color: theme.textSecondary, fontSize: 18, marginTop: 16 }}>No requests found</Text>
            <Text style={{ color: theme.textTertiary, textAlign: 'center', marginTop: 8 }}>
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
